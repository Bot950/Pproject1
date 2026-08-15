import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Icon } from "../components/Icons";
import { Button, PageHero, Breadcrumbs } from "../components/ui";
import { usePageMeta } from "../components/Layout";
import { useI18n } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import { useShop, setAttribution } from "../lib/shop";
import { all, money, useDbVersion, getSettings } from "../lib/db";
import { PT } from "../lib/portalText";
import { Badge, Empty, Field, inputCls } from "../components/portalUi";
import { cn } from "../utils/cn";

type ItemView = { kind: "product" | "service"; id: string; name: any; description: any; price: number; icon: string; features?: any; commission?: any; subscription?: any; order_fields?: any[]; price_label?: any; type?: any; badge?: any };

export default function Shop() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const shop = useShop();
  useDbVersion();
  const [params] = useSearchParams();

  usePageMeta(
    t({ en: "Shop — Digital Services & Products", bn: "শপ — ডিজিটাল সার্ভিস ও প্রোডাক্ট" }),
    t({ en: "Order digital services and buy premium digital products from AL-KHUBAIB IT — secure checkout, wallet payments and invoices.", bn: "AL-KHUBAIB IT থেকে ডিজিটাল সার্ভিস অর্ডার ও প্রিমিয়াম ডিজিটাল প্রোডাক্ট কিনুন — নিরাপদ চেকআউট, ওয়ালেট পেমেন্ট ও ইনভয়েস।" })
  );

  // Attribution capture
  useEffect(() => {
    const ref = params.get("ref");
    if (ref) {
      setAttribution(ref);
      import("../lib/affiliate").then(({ trackClick }) => trackClick(ref, "shop"));
    }
  }, [params]);

  const [tab, setTab] = useState<"all" | "product" | "service">("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ItemView | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [reqFields, setReqFields] = useState<Record<string, string>>({});
  const [reqError, setReqError] = useState("");
  const [orderResult, setOrderResult] = useState<{ no: string; paid: boolean } | null>(null);

  const products = all("products").filter((p) => p.status === "published");
  const services = all("services").filter((s) => s.status === "published");

  const items: ItemView[] = useMemo(() => {
    const list: ItemView[] = [
      ...products.map((p) => ({
        kind: "product" as const, id: p.id, name: p.name, description: p.description, price: p.price,
        icon: p.icon || "folder", features: p.features, commission: p.commission,
        subscription: p.subscription, type: p.type, badge: p.badge,
      })),
      ...services.map((s) => ({
        kind: "service" as const, id: s.id, name: s.name, description: s.description, price: s.price,
        icon: s.icon || "layers", commission: s.commission, subscription: s.subscription,
        order_fields: s.order_fields, price_label: s.price_label,
      })),
    ];
    return list;
  }, [products, services]);

  const filtered = items.filter((i) => {
    const okTab = tab === "all" || (tab === "product" && i.kind === "product") || (tab === "service" && i.kind === "service");
    const q = query.trim().toLowerCase();
    const okQ = !q || i.name.en.toLowerCase().includes(q) || i.name.bn.includes(q) || (i.type?.en || "").toLowerCase().includes(q);
    return okTab && okQ;
  });

  const openItem = (i: ItemView) => {
    setSelected(i);
    setReqFields({});
    setReqError("");
  };

  const addItem = () => {
    if (!selected) return;
    const fields = selected.order_fields || [];
    if (selected.kind === "service" && fields.length) {
      for (const f of fields) {
        if (f.required && !(reqFields[f.key] || "").trim()) {
          setReqError(`${t(f.label)} — ${t(PT.errRequired)}`);
          return;
        }
      }
    }
    shop.addToCart({
      kind: selected.kind,
      item_id: selected.id,
      name: selected.name,
      price: selected.price,
      fields: selected.kind === "service" ? { ...reqFields } : undefined,
    });
    setSelected(null);
    setCartOpen(true);
  };

  return (
    <>
      <PageHero eyebrow={t({ en: "Marketplace", bn: "মার্কেটপ্লেস" })} title={t(PT.shopTitle)} subtitle={t(PT.shopSub)}>
        <div className="mt-7 flex flex-col sm:flex-row gap-3.5">
          <Button onClick={() => setCartOpen(true)} size="lg">
            {t(PT.yourCart)} ({shop.cartCount})
          </Button>
          {user ? (
            <Button to={user.role === "admin" || user.role === "super_admin" ? "/admin" : "/dashboard"} variant="outline-light" size="lg">
              {t(PT.dashboard)}
            </Button>
          ) : (
            <Button to="/login" variant="outline-light" size="lg">
              {t(PT.signIn)}
            </Button>
          )}
        </div>
      </PageHero>

      <section className="container-x py-10 sm:py-14">
        <Breadcrumbs items={[{ label: t(PT.shop) }]} />

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
          <div className="flex flex-wrap gap-2.5">
            {[
              { k: "all", l: t(PT.allItems) },
              { k: "product", l: t(PT.products) },
              { k: "service", l: t(PT.services) },
            ].map((tb) => (
              <button
                key={tb.k}
                onClick={() => setTab(tb.k as typeof tab)}
                className={cn(
                  "px-5 py-2.5 rounded-full text-sm font-semibold transition-all border",
                  tab === tb.k
                    ? "bg-gradient-to-r from-brand-700 to-brand-500 text-white border-transparent shadow-lg shadow-brand-600/25"
                    : "bg-white text-ink-600 border-ink-200 hover:border-brand-300"
                )}
              >
                {tb.l}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-80">
            <Icon name="search" className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              className={cn(inputCls, "pl-10")}
              placeholder={t(PT.searchPh)}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="mt-8"><Empty>{t({ en: "No items found.", bn: "কোনো আইটেম পাওয়া যায়নি।" })}</Empty></div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((i) => (
              <div key={`${i.kind}_${i.id}`} className="group flex flex-col rounded-2xl border border-ink-100 bg-white shadow-soft hover:shadow-card hover:-translate-y-1 transition-all overflow-hidden">
                <div className="relative h-32 bg-gradient-to-br from-brand-800 via-brand-700 to-brand-500 flex items-center justify-between px-6">
                  <div className="absolute inset-0 bg-grid" aria-hidden="true" />
                  <span className="relative w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center text-white">
                    <Icon name={i.icon as never} className="w-6 h-6" />
                  </span>
                  {i.subscription && (
                    <Badge tone="amber">{t({ en: "Subscription", bn: "সাবস্ক্রিপশন" })}</Badge>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-brand-600">{i.kind === "service" ? t(PT.services) : t(PT.products)}</p>
                  <h3 className="mt-1 font-display font-bold text-lg text-ink-900 leading-snug">{t(i.name)}</h3>
                  <p className="mt-1.5 text-sm text-ink-500 line-clamp-2">{t(i.description)}</p>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-display font-bold text-xl text-gradient-dark">{money(i.price, lang)}</span>
                    {i.kind === "service" && <span className="text-xs text-ink-400">{t(i.price_label || PT.startingFrom)}</span>}
                    {i.subscription && <span className="text-xs text-ink-400">{t(PT.perYear)}</span>}
                  </div>
                  <div className="mt-4 flex gap-2.5">
                    <Button variant="secondary" size="sm" className="flex-1" onClick={() => openItem(i)}>
                      {t(PT.viewDetails)}
                    </Button>
                    <Button size="sm" className="flex-1" onClick={() => { openItem(i); }}>
                      {t(PT.addToCart)}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Item detail + requirements modal */}
      {selected && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl p-6 sm:p-8 animate-fade-in">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 text-white flex items-center justify-center">
                  <Icon name={selected.icon as never} className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="font-display font-bold text-xl text-ink-900">{t(selected.name)}</h3>
                  <p className="text-sm text-ink-400">{selected.type ? t(selected.type) : t({ en: "Digital Service", bn: "ডিজিটাল সার্ভিস" })}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="w-10 h-10 rounded-xl border border-ink-100 flex items-center justify-center text-ink-500 hover:bg-brand-50" aria-label="Close">
                <Icon name="x" className="w-5 h-5" />
              </button>
            </div>

            <p className="mt-4 text-[15px] text-ink-500 leading-relaxed">{t(selected.description)}</p>

            {selected.features && (
              <ul className="mt-4 grid sm:grid-cols-2 gap-2">
                {selected.features[lang].map((f: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-ink-700">
                    <span className="w-5 h-5 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                      <Icon name="check" className="w-3 h-3" strokeWidth={3} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            )}

            {/* Dynamic requirement form */}
            {selected.kind === "service" && (selected.order_fields?.length ?? 0) > 0 && (
              <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50/50 p-5">
                <h4 className="font-display font-bold text-base text-ink-900">{t(PT.requirements)}</h4>
                <div className="mt-4 grid sm:grid-cols-2 gap-4">
                  {selected.order_fields!.map((f: any) => (
                    <Field key={f.key} label={t(f.label)} required={f.required} full={f.type === "textarea"}>
                      {f.type === "select" ? (
                        <select className={cn(inputCls, "appearance-none")} value={reqFields[f.key] || ""} onChange={(e) => setReqFields((p) => ({ ...p, [f.key]: e.target.value }))}>
                          <option value="">—</option>
                          {f.options.map((o: string) => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      ) : f.type === "textarea" ? (
                        <textarea rows={2} className={cn(inputCls, "resize-none")} value={reqFields[f.key] || ""} onChange={(e) => setReqFields((p) => ({ ...p, [f.key]: e.target.value }))} />
                      ) : (
                        <input type={f.type === "date" ? "date" : f.type === "number" ? "number" : "text"} className={inputCls} value={reqFields[f.key] || ""} onChange={(e) => setReqFields((p) => ({ ...p, [f.key]: e.target.value }))} />
                      )}
                    </Field>
                  ))}
                </div>
                {reqError && <p className="mt-3 text-sm font-medium text-red-600">{reqError}</p>}
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
              <div className="mr-auto">
                <p className="font-display font-bold text-2xl text-gradient-dark">{money(selected.price, lang)}</p>
                {selected.kind === "service" && <p className="text-xs text-ink-400">{t(selected.price_label || PT.startingFrom)}</p>}
                {selected.subscription && <p className="text-xs text-ink-400">{t({ en: "Renews yearly — manage from dashboard", bn: "বার্ষিক নবায়ন — ড্যাশবোর্ড থেকে ম্যানেজ করুন" })}</p>}
              </div>
              <Button onClick={addItem} className="w-full sm:w-auto">
                {t(PT.addToCart)} <Icon name="arrow" className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-[70] flex justify-end">
          <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-fade-in">
            <div className="flex items-center justify-between px-6 h-16 border-b border-ink-100">
              <h3 className="font-display font-bold text-lg text-ink-900">{t(PT.yourCart)}</h3>
              <button onClick={() => setCartOpen(false)} className="w-10 h-10 rounded-xl border border-ink-100 flex items-center justify-center" aria-label="Close">
                <Icon name="x" className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {shop.cart.length === 0 ? (
                <Empty>{t(PT.cartEmpty)}</Empty>
              ) : (
                shop.cart.map((c) => (
                  <div key={c.key} className="rounded-xl border border-ink-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-ink-900 text-sm">{t(c.name)}</p>
                        <p className="text-xs text-ink-400 mt-0.5">
                          {c.kind === "service" ? t(PT.services) : t(PT.products)}
                          {c.isRenewal && ` · ${t(PT.renewals)}`}
                        </p>
                        {c.fields && (
                          <p className="text-[11px] text-ink-400 mt-1 line-clamp-2">
                            {Object.values(c.fields).filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                      <button onClick={() => shop.removeFromCart(c.key)} className="text-ink-300 hover:text-red-500 shrink-0" aria-label="Remove">
                        <Icon name="x" className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button onClick={() => shop.setQty(c.key, c.qty - 1)} className="w-7 h-7 rounded-lg border border-ink-200 flex items-center justify-center text-ink-500">−</button>
                        <span className="w-8 text-center text-sm font-semibold">{c.qty}</span>
                        <button onClick={() => shop.setQty(c.key, c.qty + 1)} className="w-7 h-7 rounded-lg border border-ink-200 flex items-center justify-center text-ink-500">+</button>
                      </div>
                      <p className="font-semibold text-ink-900 text-sm">{money(c.price * c.qty, lang)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            {shop.cart.length > 0 && (
              <div className="px-6 py-5 border-t border-ink-100 space-y-3">
                <CouponBox />
                <div className="flex justify-between text-sm text-ink-500">
                  <span>{t(PT.subtotal)}</span><span>{money(shop.cartTotal, lang)}</span>
                </div>
                {shop.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600 font-semibold">
                    <span>{t(PT.discount)} ({shop.appliedCoupon})</span><span>−{money(shop.discountAmount, lang)}</span>
                  </div>
                )}
                <div className="flex justify-between font-display font-bold text-ink-900">
                  <span>{t(PT.total)}</span><span>{money(shop.cartTotal - shop.discountAmount, lang)}</span>
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    if (!user) {
                      setCartOpen(false);
                      window.location.hash = "#/portal/login";
                      return;
                    }
                    setCartOpen(false);
                    setCheckoutOpen(true);
                  }}
                >
                  {t(PT.checkout)} <Icon name="arrow" className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout */}
      {checkoutOpen && <CheckoutModal onClose={() => setCheckoutOpen(false)} onDone={(r) => { setOrderResult(r); setCheckoutOpen(false); }} />}

      {/* Order result */}
      {orderResult && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm" onClick={() => setOrderResult(null)} />
          <div className="relative w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl animate-fade-in">
            <span className="mx-auto flex w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 items-center justify-center">
              <Icon name="check" className="w-8 h-8" strokeWidth={2.5} />
            </span>
            <h3 className="mt-4 font-display font-bold text-xl text-ink-900">
              {orderResult.paid ? t(PT.orderSuccess) : t(PT.orderPendingPay)}
            </h3>
            <p className="mt-1 text-sm font-semibold text-brand-600">#{orderResult.no}</p>
            <p className="mt-2 text-sm text-ink-500 leading-relaxed">
              {orderResult.paid ? t(PT.orderPaidDesc) : t(PT.orderPendingPayDesc)}
            </p>
            <div className="mt-6 flex flex-col gap-2.5">
              <Button to="/dashboard">{t(PT.dashboard)}</Button>
              <Button variant="secondary" onClick={() => setOrderResult(null)}>{t(PT.backToShop)}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CouponBox() {
  const { t } = useI18n();
  const shop = useShop();
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  return (
    <div>
      <div className="flex gap-2">
        <input className={cn(inputCls, "flex-1")} placeholder={t(PT.coupon)} value={code} onChange={(e) => { setCode(e.target.value); setErr(""); }} />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            const r = shop.applyCoupon(code);
            if (!r.ok) setErr(r.error || "Invalid");
          }}
        >
          {t(PT.applyCoupon)}
        </Button>
      </div>
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
    </div>
  );
}

function CheckoutModal({ onClose, onDone }: { onClose: () => void; onDone: (r: { no: string; paid: boolean }) => void }) {
  const { t, lang } = useI18n();
  const shop = useShop();
  const settings = getSettings();
  const [method, setMethod] = useState("bkash");
  const [trxId, setTrxId] = useState("");
  const [useWallet, setUseWallet] = useState(false);
  const [err, setErr] = useState("");
  const methods = (settings.payments?.methods || []).filter((m: any) => m.enabled);

  const submit = () => {
    if (!useWallet && !trxId.trim()) {
      setErr(t({ en: "Please enter the Transaction ID after completing payment.", bn: "পেমেন্ট সম্পন্ন করে ট্রানজেকশন আইডি লিখুন।" }));
      return;
    }
    const r = shop.checkout({ method: useWallet ? "wallet" : method, trxId, useWallet });
    if (!r.ok) {
      setErr(r.error || "Error");
      return;
    }
    onDone({ no: r.order!.no, paid: r.order!.status !== "pending_payment" });
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-6 sm:p-8 shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-xl text-ink-900">{t(PT.checkout)}</h3>
          <button onClick={onClose} className="w-10 h-10 rounded-xl border border-ink-100 flex items-center justify-center" aria-label="Close">
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 rounded-xl bg-ink-50 p-4 text-sm">
          <div className="flex justify-between text-ink-500"><span>{t(PT.subtotal)}</span><span>{money(shop.cartTotal, lang)}</span></div>
          {shop.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600 font-semibold"><span>{t(PT.discount)}</span><span>−{money(shop.discountAmount, lang)}</span></div>
          )}
          <div className="mt-1.5 flex justify-between font-display font-bold text-ink-900 text-base"><span>{t(PT.total)}</span><span>{money(shop.cartTotal - shop.discountAmount, lang)}</span></div>
        </div>

        <div className="mt-5">
          <p className="text-sm font-semibold text-ink-800 mb-2.5">{t(PT.paymentMethod)}</p>
          <div className="grid grid-cols-2 gap-2.5">
            {methods.map((m: any) => (
              <button
                key={m.id}
                onClick={() => { setMethod(m.id); setUseWallet(false); setErr(""); }}
                className={cn(
                  "rounded-xl border p-3.5 text-left transition-all",
                  !useWallet && method === m.id ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500/20" : "border-ink-200 hover:border-brand-300"
                )}
              >
                <p className="font-semibold text-sm text-ink-900">{m.label}</p>
                <p className="text-[11px] text-ink-400 mt-0.5 line-clamp-2">{m.instructions}</p>
              </button>
            ))}
            <button
              onClick={() => { setUseWallet(true); setErr(""); }}
              className={cn(
                "rounded-xl border p-3.5 text-left transition-all col-span-2",
                useWallet ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500/20" : "border-ink-200 hover:border-brand-300"
              )}
            >
              <p className="font-semibold text-sm text-ink-900">{t(PT.payWithWallet)}</p>
              <p className="text-[11px] text-ink-400 mt-0.5">{t({ en: "Instant payment from your wallet balance.", bn: "আপনার ওয়ালেট ব্যালেন্স থেকে তাৎক্ষণিক পেমেন্ট।" })}</p>
            </button>
          </div>
          {!useWallet && (
            <div className="mt-4">
              <Field label={t(PT.trxId)} required>
                <input className={inputCls} placeholder="e.g. 9VX7B2KA3L" value={trxId} onChange={(e) => { setTrxId(e.target.value); setErr(""); }} />
              </Field>
              <p className="mt-2 text-xs text-ink-400 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                {t({ en: "Payments are verified manually by our team — never rely on frontend success messages.", bn: "পেমেন্ট আমাদের টিম ম্যানুয়ালি যাচাই করে — সামনের বার্তার ওপর নির্ভর করবেন না।" })}
              </p>
            </div>
          )}
          {err && <p className="mt-3 text-sm font-medium text-red-600">{err}</p>}
          <Button className="w-full mt-5" size="lg" onClick={submit}>
            {t(PT.placeOrder)} <Icon name="send" className="w-4.5 h-4.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
