import React, { createContext, useContext, useState } from "react";
import { useAuth } from "./auth";
import {
  all, get, insert, update, where, uid, nowISO, orderNo, invoiceNo, txnNo,
  walletCredit, walletDebit, getSettings, notify, logAction, useDbVersion, recordLedger,
} from "./db";
import type { Row } from "./db";

export type CartItem = {
  key: string;
  kind: "product" | "service";
  item_id: string;
  name: { en: string; bn: string };
  price: number;
  qty: number;
  fields?: Record<string, string>;
  isRenewal?: boolean;
  subscription_id?: string;
};

/* ── Affiliate attribution (cookie storage) ────────────────── */
export type Attribution = { code: string; exp: number };

export function getActiveAttribution(): Attribution | null {
  try {
    const raw = localStorage.getItem("akit_ref");
    if (!raw) return null;
    const att = JSON.parse(raw) as Attribution;
    if (Date.now() > att.exp) {
      localStorage.removeItem("akit_ref");
      return null;
    }
    return att;
  } catch {
    return null;
  }
}

export function setAttribution(code: string) {
  try {
    const existing = getActiveAttribution();
    if (existing && existing.code !== code) return; // do not overwrite valid attribution
    const settings = getSettings();
    const days = settings.affiliate?.cookieDays ?? 30;
    localStorage.setItem("akit_ref", JSON.stringify({ code, exp: Date.now() + days * 86400000 }));
  } catch { /* ignore */ }
}

type ShopCtx = {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "key" | "qty"> & { qty?: number }) => void;
  removeFromCart: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  applyCoupon: (code: string) => { ok: boolean; discount: number; error?: string };
  appliedCoupon: string | null;
  discountAmount: number;
  checkout: (opts: {
    method: string;
    trxId?: string;
    useWallet?: boolean;
    note?: string;
  }) => { ok: boolean; order?: Row; error?: string };
  verifyPayment: (paymentId: string, approved: boolean) => void;
  addFunds: (amount: number, method: string, trxId?: string) => { ok: boolean; error?: string };
};

const Ctx = createContext<ShopCtx | null>(null);

function cartKey(userId: string) {
  return `akit_cart_${userId}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  useDbVersion();
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (!user) return [];
    try {
      return JSON.parse(localStorage.getItem(cartKey(user.id)) || "[]");
    } catch {
      return [];
    }
  });

  const persist = (items: CartItem[]) => {
    setCart(items);
    if (user) {
      try {
        localStorage.setItem(cartKey(user.id), JSON.stringify(items));
      } catch { /* ignore */ }
    }
  };

  const addToCart: ShopCtx["addToCart"] = (item) => {
    setCart((prev) => {
      const key = `${item.kind}_${item.item_id}_${item.isRenewal ? "rnw" : "new"}`;
      const existing = prev.find((c) => c.key === key && !item.fields);
      let next: CartItem[];
      if (existing && !item.fields) {
        next = prev.map((c) => (c.key === key ? { ...c, qty: c.qty + (item.qty ?? 1) } : c));
      } else {
        next = [...prev, { ...item, key: item.fields ? uid("ci") : key, qty: item.qty ?? 1 }];
      }
      persist(next);
      return next;
    });
  };

  const removeFromCart = (key: string) => persist(cart.filter((c) => c.key !== key));
  const setQty = (key: string, qty: number) =>
    persist(cart.map((c) => (c.key === key ? { ...c, qty: Math.max(1, qty) } : c)));
  const clearCart = () => {
    persist([]);
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const cartTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);

  const applyCoupon: ShopCtx["applyCoupon"] = (code) => {
    const coupon = all("coupons").find(
      (c) => String(c.code).toUpperCase() === code.trim().toUpperCase() && c.enabled
    );
    if (!coupon) return { ok: false, discount: 0, error: "Invalid coupon code." };
    if (coupon.expires && new Date(coupon.expires) < new Date()) return { ok: false, discount: 0, error: "Coupon expired." };
    if (coupon.max_uses && (coupon.used || 0) >= coupon.max_uses) return { ok: false, discount: 0, error: "Coupon usage limit reached." };
    if (coupon.min_order && cartTotal < coupon.min_order)
      return { ok: false, discount: 0, error: `Minimum order ${coupon.min_order} required.` };
    const discount = coupon.type === "percent" ? Math.round((cartTotal * coupon.value) / 100) : Math.min(coupon.value, cartTotal);
    setAppliedCoupon(code.trim().toUpperCase());
    setDiscountAmount(discount);
    return { ok: true, discount };
  };

  /* ── Order lifecycle ─────────────────────────────────────── */
  const finalizeOrder = (order: Row, by: string) => {
    const status = order.items.some((i: CartItem) => i.kind === "service")
      ? "payment_confirmed"
      : "ready";
    update("orders", order.id, { status, payment_status: "paid" });
    insert("order_events", { order_id: order.id, status, note: by ? "Payment verified" : "Payment confirmed", by, at: nowISO() });

    // Invoice
    insert("invoices", {
      no: invoiceNo(), order_id: order.id, order_no: order.no, user_id: order.user_id,
      user_name: order.user_name, items: order.items, subtotal: order.subtotal,
      discount: order.discount, coupon: order.coupon, total: order.total,
      status: "paid", created_at: nowISO(),
    });

    // Digital licenses
    const licenses: { item_id: string; name: string; license: string }[] = [];
    order.items.forEach((it: CartItem) => {
      const prod = it.kind === "product" ? get("products", it.item_id) : null;
      if (prod && prod.digital) {
        const lic = `AK-${it.item_id.toUpperCase().slice(0, 4)}-${order.no.slice(-5)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        licenses.push({ item_id: it.item_id, name: it.name.en, license: lic });
      }
    });
    if (licenses.length) {
      update("orders", order.id, { licenses });
      insert("order_events", { order_id: order.id, status, note: "Download available", by, at: nowISO() });
    }

    // Subscription records
    order.items.forEach((it: CartItem) => {
      const item = it.kind === "product" ? get("products", it.item_id) : get("services", it.item_id);
      if (item && (item.kind === "subscription" || item.subscription)) {
        const periodDays = item.subscription?.period === "month" ? 30 : item.subscription?.period === "quarter" ? 90 : item.subscription?.period === "half" ? 182 : 365;
        const start = nowISO();
        const next = new Date(Date.now() + periodDays * 86400000).toISOString();
        insert("subscriptions", {
          user_id: order.user_id, item_id: it.item_id, kind: it.kind, name: it.name,
          period: item.subscription?.period || "year", price: item.price,
          renewal_price: item.subscription?.renewalPrice || item.price,
          start, next_renewal: next, status: "active", order_id: order.id,
          ref_code: order.ref_code || "", original_affiliate_id: order.affiliate_id || "",
        });
      }
    });

    // Affiliate commission
    if (order.ref_code && order.affiliate_id) {
      const settings = getSettings();
      const holdingDays = settings.affiliate?.holdingDays || 0;
      order.items.forEach((it: CartItem) => {
        const item = it.kind === "product" ? get("products", it.item_id) : get("services", it.item_id);
        if (!item) return;
        const cfg = item.commission;
        if (!cfg || !cfg.enabled) return;
        const isRenewal = !!it.isRenewal;
        const rate = isRenewal ? cfg.renewalEnabled ? cfg.renewal : 0 : cfg.initial;
        if (!rate) return;
        const amount = cfg.type === "fixed" ? rate : Math.round((it.price * it.qty * rate) / 100);
        if (amount <= 0) return;
        insert("commissions", {
          user_id: order.affiliate_id, code: order.ref_code, order_id: order.id, order_no: order.no,
          item_name: it.name, type: isRenewal ? "renewal" : "initial", amount,
          status: holdingDays > 0 ? "pending" : "approved", created_at: nowISO(),
        });
        if (holdingDays <= 0) {
          const prof = where("affiliate_profiles", (r) => r.user_id === order.affiliate_id)[0];
          if (prof) update("affiliate_profiles", prof.id, { balance: prof.balance + amount, total_earned: prof.total_earned + amount });
          notify(order.affiliate_id, "commission", { en: "Commission approved", bn: "কমিশন অনুমোদিত হয়েছে" }, {
            en: `Commission of ৳${amount} for ${it.name} has been approved.`, bn: `${it.name}-এর জন্য ৳${amount} কমিশন অনুমোদিত হয়েছে।`,
          });
        }
      });
    }

    // Notifications
    notify(order.user_id, "order", { en: "Payment confirmed", bn: "পেমেন্ট নিশ্চিত হয়েছে" }, {
      en: `Payment for order ${order.no} is confirmed. ${licenses.length ? "Your downloads are ready." : "Our team will begin processing."}`,
      bn: `অর্ডার ${order.no}-এর পেমেন্ট নিশ্চিত হয়েছে। ${licenses.length ? "আপনার ডাউনলোড প্রস্তুত।" : "আমাদের টিম কাজ শুরু করবে।"}`,
    });
    notify("admin", "order", { en: "New order", bn: "নতুন অর্ডার" }, {
      en: `Order ${order.no} (৳${order.total}) paid — ${order.items.length} item(s).`, bn: `অর্ডার ${order.no} (৳${order.total}) পেমেন্ট সম্পন্ন — ${order.items.length}টি আইটেম।`,
    });
  };

  const checkout: ShopCtx["checkout"] = ({ method, trxId, useWallet, note }) => {
    if (!user) return { ok: false, error: "Please login first." };
    if (cart.length === 0) return { ok: false, error: "Your cart is empty." };
    const total = cartTotal - discountAmount;
    if (total <= 0) return { ok: false, error: "Invalid total." };

    const ref = getActiveAttribution();
    const affiliate = ref ? where("affiliate_profiles", (r) => r.code === ref.code && r.status === "active" && r.kyc_status === "verified")[0] : null;
    const refCode = affiliate ? ref!.code : "";

    const order = insert("orders", {
      no: orderNo(), user_id: user.id, user_name: user.name, user_email: user.email,
      items: cart.map((c) => ({ ...c })), subtotal: cartTotal, discount: discountAmount,
      coupon: appliedCoupon, total, status: "pending_payment", payment_status: "unpaid",
      payment_method: method, ref_code: refCode, affiliate_id: affiliate ? affiliate.user_id : "",
      note: note || "", created_at: nowISO(),
    });
    insert("order_events", { order_id: order.id, status: "pending_payment", note: "Order placed", by: user.name, at: nowISO() });

    // Apply coupon usage
    if (appliedCoupon) {
      const cp = all("coupons").find((c) => String(c.code).toUpperCase() === appliedCoupon);
      if (cp) update("coupons", cp.id, { used: (cp.used || 0) + 1 });
    }

    const paid = useWallet || method === "wallet";
    if (paid) {
      const ok = walletDebit(user.id, total, `Payment for order ${order.no}`, order.no);
      if (!ok) {
        update("orders", order.id, { status: "cancelled", payment_status: "unpaid" });
        return { ok: false, error: "Insufficient wallet balance. Please add funds or choose another method." };
      }
      insert("payments", {
        no: txnNo(), order_id: order.id, user_id: user.id, type: "order", method,
        amount: total, status: "verified", created_at: nowISO(), verified_at: nowISO(), by: "wallet",
      });
      recordLedger("payment", user.id, total, `Order ${order.no} paid via wallet`, order.no);
      recordLedger("wallet_debit", user.id, -total, `Wallet payment for ${order.no}`, order.no);
      finalizeOrder(order, "");
      clearCart();
      return { ok: true, order };
    }

    // Manual payment — pending verification
    insert("payments", {
      no: txnNo(), order_id: order.id, user_id: user.id, type: "order", method,
      amount: total, trx_id: trxId || "", status: "pending_verification", created_at: nowISO(),
    });
    notify("admin", "payment", { en: "Payment pending verification", bn: "পেমেন্ট যাচাই বাকি" }, {
      en: `Order ${order.no} — ${method} payment of ৳${total} (Trx: ${trxId || "—"}) awaiting verification.`,
      bn: `অর্ডার ${order.no} — ${method} পেমেন্ট ৳${total} (Trx: ${trxId || "—"}) যাচাইয়ের অপেক্ষায়।`,
    });
    notify(user.id, "order", { en: "Order placed — payment pending", bn: "অর্ডার গৃহীত — পেমেন্ট বাকি" }, {
      en: `Order ${order.no} created. Complete payment using ${method} to activate your order.`,
      bn: `অর্ডার ${order.no} তৈরি হয়েছে। অর্ডারটি সক্রিয় করতে ${method} পেমেন্ট সম্পন্ন করুন।`,
    });
    clearCart();
    return { ok: true, order };
  };

  const verifyPayment: ShopCtx["verifyPayment"] = (paymentId, approved) => {
    const payment = get("payments", paymentId);
    if (!payment) return;
    if (!approved) {
      update("payments", paymentId, { status: "rejected", verified_at: nowISO() });
      if (payment.order_id) {
        update("orders", payment.order_id, { status: "cancelled", payment_status: "unpaid" });
        insert("order_events", { order_id: payment.order_id, status: "cancelled", note: "Payment rejected", by: "admin", at: nowISO() });
      }
      return;
    }
    update("payments", paymentId, { status: "verified", verified_at: nowISO(), by: "admin" });
    recordLedger("payment", payment.user_id, payment.amount, `${payment.type} ${payment.no} verified (${payment.method})`, payment.no);
    if (payment.type === "deposit") {
      walletCredit(payment.user_id, payment.amount, "Wallet deposit", payment.no);
      recordLedger("wallet_credit", payment.user_id, payment.amount, `Deposit ${payment.no} credited`, payment.no);
      notify(payment.user_id, "wallet", { en: "Wallet updated", bn: "ওয়ালেট আপডেট হয়েছে" }, {
        en: `Your deposit of ৳${payment.amount} is verified and added to your wallet.`, bn: `আপনার ৳${payment.amount} ডিপোজিট যাচাই হয়ে ওয়ালেটে যোগ হয়েছে।`,
      });
    } else if (payment.order_id) {
      const order = get("orders", payment.order_id);
      if (order) {
        finalizeOrder(order, "admin");
        logAction("admin", "verify_payment", `Payment ${payment.no} verified for ${order.no}`);
      }
    }
  };

  const addFunds: ShopCtx["addFunds"] = (amount, method, trxId) => {
    if (!user) return { ok: false, error: "Please login first." };
    const settings = getSettings();
    const min = settings.wallet?.minDeposit ?? 500;
    const max = settings.wallet?.maxDeposit ?? 50000;
    if (amount < min || amount > max) return { ok: false, error: `Amount must be between ৳${min} and ৳${max}.` };
    insert("payments", {
      no: txnNo(), user_id: user.id, type: "deposit", method, amount,
      trx_id: trxId || "", status: "pending_verification", created_at: nowISO(),
    });
    notify("admin", "payment", { en: "New wallet deposit", bn: "নতুন ওয়ালেট ডিপোজিট" }, {
      en: `${user.name} requested ৳${amount} deposit via ${method} (Trx: ${trxId || "—"}).`, bn: `${user.name} ${method} পথে ৳${amount} ডিপোজিট অনুরোধ করেছেন (Trx: ${trxId || "—"})।`,
    });
    return { ok: true };
  };

  const value: ShopCtx = {
    cart, addToCart, removeFromCart, setQty, clearCart, cartCount, cartTotal,
    applyCoupon, appliedCoupon, discountAmount, checkout, verifyPayment, addFunds,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useShop() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useShop must be used inside CartProvider");
  return ctx;
}
