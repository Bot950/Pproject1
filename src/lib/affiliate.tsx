// ─────────────────────────────────────────────────────────────
// Affiliate engine — applications, KYC, attribution, commissions,
// withdrawals. Business rules enforced here (used by portals).
// ─────────────────────────────────────────────────────────────
import {
  all, get, insert, update, where, uid, nowISO, txnNo, orderNo,
  walletBalance, walletDebit, getSettings, notify, logAction, recordLedger,
} from "./db";
import type { Row } from "./db";

/* ── Application ───────────────────────────────────────────── */
export type ApplicationInput = {
  name: string;
  mobile: string;
  email: string;
  address: string;
  experience: string;
  skills: string;
  social: string;
  method: string;
  why: string;
  password: string;
};

export async function submitAffiliateApplication(
  input: ApplicationInput,
  existingUserId?: string
): Promise<{ ok: boolean; error?: string; username?: string; tempPassword?: string }> {
  // Single central account — an existing client applies without a second account.
  if (existingUserId) {
    const existing = get("users", existingUserId);
    if (!existing) return { ok: false, error: "Account not found." };
    const prevApp = where("affiliate_applications", (a) => a.user_id === existingUserId)[0];
    if (prevApp && prevApp.status !== "rejected") {
      return { ok: false, error: "You already have an affiliate application under review." };
    }
    const prevProf = where("affiliate_profiles", (r) => r.user_id === existingUserId)[0];
    if (!prevProf) {
      insert("affiliate_profiles", {
        user_id: existingUserId, code: existing.username || existingUserId.slice(0, 8), status: "pending",
        kyc_status: "not_submitted", balance: 0, total_earned: 0, joined: nowISO(),
      });
    } else {
      update("affiliate_profiles", prevProf.id, { status: "pending" });
    }
    insert("affiliate_applications", {
      user_id: existingUserId, name: existing.name, mobile: input.mobile || existing.mobile,
      email: existing.email, address: input.address, experience: input.experience, skills: input.skills,
      social: input.social, method: input.method, why: input.why, status: "pending", reason: "",
    });
    notify(existingUserId, "affiliate", { en: "Application received", bn: "আবেদন গৃহীত হয়েছে" }, {
      en: "Your affiliate application has been received and is pending review.", bn: "আপনার এফিলিয়েট আবেদন গৃহীত হয়েছে এবং যাচাইয়ের অপেক্ষায় রয়েছে।",
    });
    notify("admin", "affiliate", { en: "New affiliate application", bn: "নতুন এফিলিয়েট আবেদন" }, {
      en: `${existing.name} (${existing.email}) applied for the affiliate program.`, bn: `${existing.name} (${existing.email}) এফিলিয়েট প্রোগ্রামে আবেদন করেছেন।`,
    });
    logAction("system", "affiliate_apply", `Application by ${existing.email}`);
    return { ok: true };
  }

  const exists = all("users").find((u) => String(u.email).toLowerCase() === input.email.trim().toLowerCase());
  if (exists) return { ok: false, error: "An account with this email already exists. Please login and apply from the affiliate portal." };

  // Generate username + temporary password
  const base = input.name.trim().toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10) || "user";
  let username = base;
  let n = 1;
  while (all("users").find((u) => u.username === username)) {
    username = `${base}${n++}`;
  }
  const tempPassword = `AK-${Math.random().toString(36).slice(2, 8).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`;

  const { hashPassword } = await import("./db");
  const salt = uid("s");
  const hash = await hashPassword(tempPassword, salt);

  const userId = insert("users", {
    name: input.name, email: input.email.trim(), mobile: input.mobile, username,
    role: "affiliate", salt, hash, status: "active",
  }).id;

  insert("affiliate_applications", {
    user_id: userId, name: input.name, mobile: input.mobile, email: input.email.trim(),
    address: input.address, experience: input.experience, skills: input.skills,
    social: input.social, method: input.method, why: input.why,
    status: "pending", reason: "", created_at: nowISO(),
  });

  insert("affiliate_profiles", {
    user_id: userId, code: username, status: "pending",
    kyc_status: "not_submitted", balance: 0, total_earned: 0, joined: nowISO(),
  });

  notify(userId, "affiliate", { en: "Application received", bn: "আবেদন গৃহীত হয়েছে" }, {
    en: "Your affiliate application has been received and is pending review.", bn: "আপনার এফিলিয়েট আবেদন গৃহীত হয়েছে এবং যাচাইয়ের অপেক্ষায় রয়েছে।",
  });
  notify("admin", "affiliate", { en: "New affiliate application", bn: "নতুন এফিলিয়েট আবেদন" }, {
    en: `${input.name} (${input.email}) applied for the affiliate program.`, bn: `${input.name} (${input.email}) এফিলিয়েট প্রোগ্রামে আবেদন করেছেন।`,
  });
  logAction("system", "affiliate_apply", `Application by ${input.email}`);

  return { ok: true, username, tempPassword };
}

/* ── Admin decision on application ─────────────────────────── */
export function decideApplication(appId: string, approved: boolean, reason = "") {
  const app = get("affiliate_applications", appId);
  if (!app) return;
  update("affiliate_applications", appId, { status: approved ? "approved" : "rejected", reason });
  const prof = where("affiliate_profiles", (r) => r.user_id === app.user_id)[0];
  if (prof) {
    update("affiliate_profiles", prof.id, { status: approved ? "approved" : "rejected" });
  }
  // Central role transition: on approval the user's single account becomes an
  // affiliate (no duplicate account); orders/wallet history are preserved.
  if (approved) {
    update("users", app.user_id, { role: "affiliate" });
  }
  notify(app.user_id, "affiliate", approved ? { en: "Application approved", bn: "আবেদন অনুমোদিত হয়েছে" } : { en: "Application rejected", bn: "আবেদন প্রত্যাখ্যাত হয়েছে" }, approved
    ? { en: "Your affiliate application is approved. Complete KYC verification to activate your account.", bn: "আপনার এফিলিয়েট আবেদন অনুমোদিত হয়েছে। অ্যাকাউন্ট সক্রিয় করতে KYC যাচাই সম্পন্ন করুন।" }
    : { en: `Your application was rejected. Reason: ${reason || "—"}`, bn: `আপনার আবেদন প্রত্যাখ্যাত হয়েছে। কারণ: ${reason || "—"}` });
  logAction("admin", approved ? "affiliate_approve" : "affiliate_reject", app.email);
}

/* ── KYC ───────────────────────────────────────────────────── */
export function submitKyc(userId: string, fields: Record<string, string>) {
  const existing = where("affiliate_kyc", (r) => r.user_id === userId)[0];
  if (existing) {
    update("affiliate_kyc", existing.id, { fields, status: "submitted", submitted_at: nowISO(), reason: "" });
    const prof = where("affiliate_profiles", (r) => r.user_id === userId)[0];
    if (prof) update("affiliate_profiles", prof.id, { kyc_status: "submitted" });
  } else {
    insert("affiliate_kyc", { user_id: userId, fields, status: "submitted", reason: "", submitted_at: nowISO() });
    const prof = where("affiliate_profiles", (r) => r.user_id === userId)[0];
    if (prof) update("affiliate_profiles", prof.id, { kyc_status: "submitted" });
  }
  notify("admin", "kyc", { en: "New KYC submission", bn: "নতুন KYC জমা পড়েছে" }, {
    en: "An affiliate submitted KYC documents for review.", bn: "একজন এফিলিয়েট যাচাইয়ের জন্য KYC ডকুমেন্ট জমা দিয়েছেন।",
  });
}

export function decideKyc(userId: string, approved: boolean, reason = "") {
  const kyc = where("affiliate_kyc", (r) => r.user_id === userId)[0];
  const prof = where("affiliate_profiles", (r) => r.user_id === userId)[0];
  if (kyc) update("affiliate_kyc", kyc.id, { status: approved ? "verified" : "rejected", reason, reviewed_at: nowISO() });
  if (prof) {
    const kycStatus = approved ? "verified" : "rejected";
    const status = approved ? "active" : "approved";
    update("affiliate_profiles", prof.id, { kyc_status: kycStatus, status });
  }
  notify(userId, "kyc", approved ? { en: "KYC verified — account activated", bn: "KYC যাচাই সম্পন্ন — অ্যাকাউন্ট সক্রিয়" } : { en: "KYC rejected", bn: "KYC প্রত্যাখ্যাত হয়েছে" }, approved
    ? { en: "Your affiliate account is now fully active. You can generate links and earn commissions.", bn: "আপনার এফিলিয়েট অ্যাকাউন্ট এখন সম্পূর্ণ সক্রিয়। লিংক তৈরি করে কমিশন আয় করতে পারবেন।" }
    : { en: `KYC rejected. Reason: ${reason || "—"}. You can resubmit.`, bn: `KYC প্রত্যাখ্যাত হয়েছে। কারণ: ${reason || "—"}। পুনরায় জমা দিতে পারবেন।` });
  logAction("admin", approved ? "kyc_verify" : "kyc_reject", prof?.user_id || userId);
}

/* ── Commissions ───────────────────────────────────────────── */
export function setCommissionStatus(commId: string, status: "pending" | "approved" | "paid" | "rejected" | "reversed") {
  const comm = get("commissions", commId);
  if (!comm) return;
  const prof = where("affiliate_profiles", (r) => r.user_id === comm.user_id)[0];
  if (status === "approved" && comm.status === "pending" && prof) {
    update("affiliate_profiles", prof.id, { balance: prof.balance + comm.amount, total_earned: prof.total_earned + comm.amount });
    notify(comm.user_id, "commission", { en: "Commission approved", bn: "কমিশন অনুমোদিত হয়েছে" }, {
      en: `Commission of ৳${comm.amount} for ${typeof comm.item_name === "string" ? comm.item_name : comm.item_name?.en || ""} approved.`, bn: `৳${comm.amount} কমিশন অনুমোদিত হয়েছে।`,
    });
  }
  if ((status === "reversed" || status === "rejected") && comm.status === "approved" && prof) {
    update("affiliate_profiles", prof.id, { balance: Math.max(0, prof.balance - comm.amount) });
  }
  update("commissions", commId, { status });
  logAction("admin", `commission_${status}`, commId);
}

/* ── Withdrawals ───────────────────────────────────────────── */
export function requestWithdrawal(userId: string, amount: number, method: string, account: string, note = "") {
  const settings = getSettings();
  const min = settings.affiliate?.minWithdrawal ?? 1000;
  const prof = where("affiliate_profiles", (r) => r.user_id === userId)[0];
  if (!prof || prof.status !== "active" || prof.kyc_status !== "verified") {
    return { ok: false, error: "Affiliate account must be active and KYC verified." };
  }
  if (prof.balance < amount) return { ok: false, error: "Insufficient affiliate balance." };
  if (amount < min) return { ok: false, error: `Minimum withdrawal is ৳${min}.` };
  // Freeze funds
  update("affiliate_profiles", prof.id, { balance: prof.balance - amount });
  const w = insert("withdrawals", {
    no: txnNo(), user_id: userId, code: prof.code, amount, method, account, note,
    status: "pending", created_at: nowISO(),
  });
  notify("admin", "withdrawal", { en: "New withdrawal request", bn: "নতুন উইথড্রয়াল অনুরোধ" }, {
    en: `${prof.code} requested ৳${amount} via ${method}.`, bn: `${prof.code} ${method}-এ ৳${amount} উইথড্রয়াল অনুরোধ করেছেন।`,
  });
  return { ok: true, id: w.id };
}

export function decideWithdrawal(wId: string, status: "approved" | "processing" | "paid" | "rejected", reason = "") {
  const w = get("withdrawals", wId);
  if (!w) return;
  update("withdrawals", wId, { status, reason, updated_at: nowISO() });
  recordLedger("withdrawal", w.user_id, -w.amount, `Withdrawal ${w.no} → ${status}${reason ? ` (${reason})` : ""}`, w.no);
  if (status === "paid") {
    recordLedger("withdrawal", w.user_id, 0, `Withdrawal ${w.no} paid via ${w.method}`, w.no);
  }
  if (status === "rejected") {
    const prof = where("affiliate_profiles", (r) => r.user_id === w.user_id)[0];
    if (prof) update("affiliate_profiles", prof.id, { balance: prof.balance + w.amount });
  }
  const msg = status === "rejected"
    ? { en: `Withdrawal rejected. Reason: ${reason || "—"}`, bn: `উইথড্রয়াল প্রত্যাখ্যাত হয়েছে। কারণ: ${reason || "—"}` }
    : status === "paid"
      ? { en: `Withdrawal of ৳${w.amount} has been paid.`, bn: `৳${w.amount} উইথড্রয়াল প্রদান করা হয়েছে।` }
      : { en: `Withdrawal of ৳${w.amount} is now ${status}.`, bn: `৳${w.amount} উইথড্রয়াল এখন ${status} অবস্থায়।` };
  notify(w.user_id, "withdrawal", { en: "Withdrawal update", bn: "উইথড্রয়াল আপডেট" }, msg);
  logAction("admin", `withdrawal_${status}`, w.no);
}

/* ── Click tracking ────────────────────────────────────────── */
export function trackClick(code: string, target: string) {
  const prof = where("affiliate_profiles", (r) => r.code === code)[0];
  if (!prof) return;
  insert("affiliate_clicks", { code, target, at: nowISO() });
  if (prof.status === "active" && prof.kyc_status === "verified") {
    notify(prof.user_id, "click", { en: "New referral click", bn: "নতুন রেফারেল ক্লিক" }, {
      en: `Someone clicked your link (${target}).`, bn: `কেউ আপনার লিংকে ক্লিক করেছে (${target})।`,
    });
  }
}

/* ── Renewal ───────────────────────────────────────────────── */
export function renewSubscription(subId: string, method: string, trxId?: string, useWallet = false) {
  const sub = get("subscriptions", subId);
  if (!sub) return { ok: false, error: "Subscription not found." };
  if (sub.status === "cancelled") return { ok: false, error: "Subscription is cancelled." };
  const item = sub.kind === "product" ? get("products", sub.item_id) : get("services", sub.item_id);
  if (!item) return { ok: false, error: "Item not found." };
  const price = sub.renewal_price || sub.price;

  const order = insert("orders", {
    no: orderNo(), user_id: sub.user_id, items: [{
      key: uid("ci"), kind: sub.kind, item_id: sub.item_id,
      name: typeof sub.name === "string" ? { en: sub.name, bn: sub.name } : sub.name,
      price, qty: 1, isRenewal: true, subscription_id: sub.id,
    }],
    subtotal: price, discount: 0, coupon: "", total: price,
    status: "pending_payment", payment_status: "unpaid", payment_method: method,
    ref_code: sub.ref_code || "", affiliate_id: sub.original_affiliate_id || "",
    note: `Renewal of ${sub.name?.en || sub.name}`, created_at: nowISO(),
  });

  if (useWallet || method === "wallet") {
    if (walletBalance(sub.user_id) < price) return { ok: false, error: "Insufficient wallet balance." };
    walletDebit(sub.user_id, price, `Renewal ${order.no}`, order.no);
    insert("payments", { no: txnNo(), order_id: order.id, user_id: sub.user_id, type: "order", method, amount: price, status: "verified", created_at: nowISO(), verified_at: nowISO(), by: "wallet" });
    finalizeOrderForRenewal(order);
    return { ok: true, order };
  }

  insert("payments", { no: txnNo(), order_id: order.id, user_id: sub.user_id, type: "order", method, amount: price, trx_id: trxId || "", status: "pending_verification", created_at: nowISO() });
  notify("admin", "payment", { en: "Renewal payment pending", bn: "নবায়ন পেমেন্ট বাকি" }, {
    en: `Renewal order ${order.no} (৳${price}) awaiting verification.`, bn: `নবায়ন অর্ডার ${order.no} (৳${price}) যাচাইয়ের অপেক্ষায়।`,
  });
  return { ok: true, order };
}

function finalizeOrderForRenewal(order: Row) {
  update("orders", order.id, { status: "ready", payment_status: "paid" });
  const sub = get("subscriptions", order.items[0].subscription_id);
  if (sub) {
    const periodDays = sub.period === "month" ? 30 : sub.period === "quarter" ? 90 : sub.period === "half" ? 182 : 365;
    update("subscriptions", sub.id, {
      status: "active", start: nowISO(), next_renewal: new Date(Date.now() + periodDays * 86400000).toISOString(),
      last_renewal_order: order.id,
    });
  }
  // Renewal commission
  if (order.affiliate_id && order.ref_code) {
    const item = order.items[0];
    const src = item.kind === "product" ? get("products", item.item_id) : get("services", item.item_id);
    const cfg = src?.commission;
    if (cfg && cfg.enabled && cfg.renewalEnabled && cfg.renewal > 0) {
      const amount = cfg.type === "fixed" ? cfg.renewal : Math.round((item.price * cfg.renewal) / 100);
      insert("commissions", {
        user_id: order.affiliate_id, code: order.ref_code, order_id: order.id, order_no: order.no,
        item_name: item.name, type: "renewal", amount, status: "approved", created_at: nowISO(),
      });
      const prof = where("affiliate_profiles", (r) => r.user_id === order.affiliate_id)[0];
      if (prof) update("affiliate_profiles", prof.id, { balance: prof.balance + amount, total_earned: prof.total_earned + amount });
    }
  }
  notify(order.user_id, "order", { en: "Renewal confirmed", bn: "নবায়ন নিশ্চিত হয়েছে" }, {
    en: `Renewal payment for order ${order.no} is confirmed.`, bn: `অর্ডার ${order.no}-এর নবায়ন পেমেন্ট নিশ্চিত হয়েছে।`,
  });
}
