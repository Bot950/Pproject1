import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Icon } from "../components/Icons";
import { Button } from "../components/ui";
import { usePageMeta } from "../components/Layout";
import { useI18n } from "../lib/i18n";
import { useAuth, Require } from "../lib/auth";
import { useShop } from "../lib/shop";
import {
  all, get, insert, update, money, fmtDateTime, useDbVersion,
  walletBalance, getSettings, notify, nowISO,
} from "../lib/db";
import { PT } from "../lib/portalText";
import { StatCard, StatusBadge, Field, inputCls } from "../components/portalUi";
import { PortalShell, EmptyState, DataTable, useToast } from "../lib/shell";
import { renewSubscription } from "../lib/affiliate";
import { notifyEvent } from "../lib/notify";
import { cn } from "../utils/cn";
import { InvoiceModal } from "./Invoice";

/* ─────────────────────── Portal zone ──────────────────────── */

export function PortalZone({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/* ─────────────────────── Login ────────────────────────────── */

export function PortalLogin() {
  const { t } = useI18n();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  usePageMeta(t({ en: "Login — Client & Affiliate Portal", bn: "লগইন — ক্লায়েন্ট ও এফিলিয়েট পোর্টাল" }));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const r = await login(email, password);
    setBusy(false);
    if (!r.ok) {
      setErr(r.error || "Login failed");
      return;
    }
    const dest = params.get("next") || "/portal/dashboard";
    navigate(dest);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Brand panel */}
      <div className="hidden lg:flex relative overflow-hidden bg-ink-950 text-white flex-col justify-between p-12">
        <div className="absolute inset-0 bg-grid" aria-hidden="true" />
        <div className="absolute -top-24 -left-20 w-96 h-96 rounded-full bg-brand-600/40 blur-[110px] animate-blob" aria-hidden="true" />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-brand-500/30 blur-[100px] animate-blob" style={{ animationDelay: "-7s" }} aria-hidden="true" />
        <div className="relative flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 flex items-center justify-center font-display font-bold text-white shadow-lg shadow-brand-600/30">AK</span>
          <div>
            <p className="font-display font-bold text-lg leading-tight">AL-KHUBAIB <span className="text-brand-300">IT</span></p>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-200">Client & Affiliate Portal</p>
          </div>
        </div>
        <div className="relative max-w-md">
          <h1 className="font-display font-bold text-3xl xl:text-4xl leading-tight">
            {t({ en: "Your digital business, in one place.", bn: "আপনার ডিজিটাল ব্যবসা — এক জায়গায়।" })}
          </h1>
          <p className="mt-4 text-ink-100/75 leading-relaxed">
            {t({ en: "Orders, wallet, subscriptions, downloads, support and affiliate earnings — one secure account for everything.", bn: "অর্ডার, ওয়ালেট, সাবস্ক্রিপশন, ডাউনলোড, সাপোর্ট ও এফিলিয়েট আয় — সবকিছুর জন্য একটি নিরাপদ অ্যাকাউন্ট।" })}
          </p>
          <div className="mt-8 space-y-3.5">
            {[
              { icon: "folder", l: t({ en: "Order services & digital products", bn: "সার্ভিস ও ডিজিটাল প্রোডাক্ট অর্ডার করুন" }) },
              { icon: "wallet", l: t({ en: "Wallet, payments & invoices", bn: "ওয়ালেট, পেমেন্ট ও ইনভয়েস" }) },
              { icon: "network", l: t({ en: "Affiliate program & earnings", bn: "এফিলিয়েট প্রোগ্রাম ও আয়" }) },
            ].map((f) => (
              <div key={f.l} className="flex items-center gap-3.5">
                <span className="w-10 h-10 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center text-brand-300">
                  <Icon name={f.icon as never} className="w-5 h-5" />
                </span>
                <span className="text-[15px] font-medium text-ink-100/85">{f.l}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-ink-100/50">© 2026 AL-KHUBAIB IT · my.alkhubaibit.com</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 flex items-center justify-center text-white font-display font-bold">AK</span>
            <p className="font-display font-bold text-ink-900">AL-KHUBAIB <span className="text-gradient-dark">IT</span></p>
          </div>
          <h2 className="font-display font-bold text-2xl text-ink-900">{t(PT.loginTitle)}</h2>
          <p className="mt-1.5 text-sm text-ink-500">{t(PT.loginSub)}</p>

          <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
            <Field label={t({ en: "Email / Username", bn: "ইমেইল / ইউজারনেম" })} required>
              <input className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" required />
            </Field>
            <Field label={t(PT.password)} required>
              <input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
            </Field>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-ink-600 font-medium cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded accent-brand-600" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                {t({ en: "Remember me", bn: "মনে রাখুন" })}
              </label>
              <button type="button" onClick={() => setForgot(true)} className="font-semibold text-brand-600 hover:text-brand-700">
                {t({ en: "Forgot Password?", bn: "পাসওয়ার্ড ভুলে গেছেন?" })}
              </button>
            </div>
            {err && <p className="text-sm font-medium text-red-600">{err}</p>}
            <Button type="submit" className="w-full" size="lg">
              {busy ? <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : t(PT.signIn)}
            </Button>
          </form>

          <p className="mt-6 text-sm text-ink-500 text-center">
            {t(PT.noAccount)}{" "}
            <Link to="/portal/register" className="font-bold text-brand-600 hover:text-brand-700">{t(PT.register)}</Link>
          </p>

          <div className="mt-6 rounded-xl border border-brand-100 bg-brand-50/60 p-4 text-xs text-ink-600 space-y-1">
            <p className="font-bold text-brand-700">{t(PT.demoAccounts)}</p>
            <p>👑 admin@alkhubaibit.com / Admin@12345 (→ admin zone)</p>
            <p>👤 client@alkhubaibit.com / Client@12345</p>
            <p>🤝 affiliate@alkhubaibit.com / Affiliate@12345</p>
          </div>
        </div>
      </div>

      {/* Forgot password */}
      {forgot && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
          <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm" onClick={() => setForgot(false)} />
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl text-center animate-fade-in">
            <span className="mx-auto w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Icon name="lock" className="w-7 h-7" />
            </span>
            <h3 className="mt-4 font-display font-bold text-xl text-ink-900">{t({ en: "Password Reset", bn: "পাসওয়ার্ড রিসেট" })}</h3>
            <p className="mt-2 text-sm text-ink-500 leading-relaxed">
              {t({ en: "For security, password resets are handled by our team. Contact us to verify your identity and reset your password.", bn: "নিরাপত্তার জন্য পাসওয়ার্ড রিসেট আমাদের টিম পরিচালনা করে। পরিচয় যাচাই করে পাসওয়ার্ড রিসেট করতে আমাদের সাথে যোগাযোগ করুন।" })}
            </p>
            <div className="mt-6 flex flex-col gap-2.5">
              <Button href="https://wa.me/8801926100643?text=Password%20reset%20request" variant="whatsapp">
                <Icon name="whatsapp" className="w-4.5 h-4.5" /> WhatsApp
              </Button>
              <Button href="mailto:contact@alkhubaibit.com" variant="secondary">contact@alkhubaibit.com</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────── Register ─────────────────────────── */

export function PortalRegister() {
  const { t } = useI18n();
  const { register } = useAuth();
  const navigate = useNavigate();
  usePageMeta(t({ en: "Create Account — Client Portal", bn: "অ্যাকাউন্ট তৈরি করুন — ক্লায়েন্ট পোর্টাল" }));
  const [form, setForm] = useState({ name: "", email: "", mobile: "", password: "", confirm: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) return setErr(t(PT.errEmail));
    if (!/^[+0-9][0-9\s\-()]{7,16}$/.test(form.mobile)) return setErr(t(PT.errMobile));
    if (form.password.length < 8 || !/[a-zA-Z]/.test(form.password) || !/[0-9]/.test(form.password)) return setErr(t(PT.errPasswordLen));
    if (form.password !== form.confirm) return setErr(t(PT.errPasswordMatch));
    setBusy(true);
    const r = await register(form);
    setBusy(false);
    if (!r.ok) return setErr(r.error || "Registration failed");
    navigate("/portal/dashboard");
  };

  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center py-16 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid" aria-hidden="true" />
      <div className="absolute -top-24 right-1/4 w-96 h-96 rounded-full bg-brand-600/35 blur-[110px]" aria-hidden="true" />
      <div className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="font-display font-bold text-2xl text-ink-900">{t(PT.registerTitle)}</h1>
          <Link to="/portal/login" className="text-sm font-semibold text-brand-600 hover:text-brand-700">{t(PT.login)}</Link>
        </div>
        <p className="mt-1.5 text-sm text-ink-500">{t(PT.registerSub)}</p>
        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          <Field label={t(PT.name)} required><input className={inputCls} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} autoComplete="name" required /></Field>
          <Field label={t(PT.email)} required><input type="email" className={inputCls} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} autoComplete="email" required /></Field>
          <Field label={t(PT.mobile)} required><input type="tel" className={inputCls} placeholder="+880 1XXX XXXXXX" value={form.mobile} onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))} required /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t(PT.password)} required><input type="password" className={inputCls} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required /></Field>
            <Field label={t(PT.confirmPassword)} required><input type="password" className={inputCls} value={form.confirm} onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))} required /></Field>
          </div>
          {err && <p className="text-sm font-medium text-red-600">{err}</p>}
          <Button type="submit" className="w-full" size="lg">
            {busy ? <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : t(PT.register)}
          </Button>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────── Client dashboard ─────────────────── */

export default function ClientDashboard() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const v = params.get("v") || "overview";
  useDbVersion();
  usePageMeta(t({ en: "Dashboard — Client Portal", bn: "ড্যাশবোর্ড — ক্লায়েন্ট পোর্টাল" }));

  return (
    <Require roles={["client", "affiliate"]}>
      <PortalShell active={v}>
        {v === "overview" && <OverviewView />}
        {v === "orders" && <OrdersView />}
        {v === "subscriptions" && <SubscriptionsView />}
        {v === "wallet" && <WalletView />}
        {v === "payments" && <PaymentsView />}
        {v === "invoices" && <InvoicesView />}
        {v === "downloads" && <DownloadsView />}
        {v === "support" && <SupportView />}
        {v === "callback" && <CallbackView />}
        {v === "notifications" && <NotificationsView />}
        {v === "profile" && <ProfileView />}
        {v === "security" && <SecurityView />}
        <div className="lg:hidden" />
        <p className="sr-only">{user?.name}</p>
      </PortalShell>
    </Require>
  );
}

/* ── Overview ── */
function OverviewView() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const orders = all("orders").filter((o) => o.user_id === user!.id).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  const subs = all("subscriptions").filter((s) => s.user_id === user!.id);
  const balance = walletBalance(user!.id);
  const hour = new Date().getHours();
  const greet = hour < 12 ? t({ en: "Good morning", bn: "শুভ সকাল" }) : hour < 17 ? t({ en: "Good afternoon", bn: "শুভ অপরাহ্ন" }) : t({ en: "Good evening", bn: "শুভ সন্ধ্যা" });

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 p-7 sm:p-9 text-white">
        <div className="absolute inset-0 bg-grid" aria-hidden="true" />
        <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <p className="text-sm font-semibold text-brand-100">{greet},</p>
            <h2 className="mt-1 font-display font-bold text-2xl sm:text-3xl">{t({ en: "Welcome back, {name}!", bn: "আবার স্বাগতম, {name}!" }).replace("{name}", (user!.name || "").split(" ")[0])}</h2>
            <p className="mt-2 text-brand-100/85 max-w-lg">
              {t({ en: "Manage your orders, services, payments and account from one place.", bn: "আপনার অর্ডার, সার্ভিস, পেমেন্ট ও অ্যাকাউন্ট এক জায়গা থেকে পরিচালনা করুন।" })}
            </p>
          </div>
          <div className="flex gap-2.5 shrink-0">
            <Link to="/shop" className="inline-flex items-center gap-2 rounded-xl bg-white text-brand-700 px-5 py-2.5 text-sm font-bold hover:bg-brand-50 transition-all">
              <Icon name="shop" className="w-4 h-4" /> {t(PT.shop)}
            </Link>
            <Link to="/portal/dashboard?v=support" className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-5 py-2.5 text-sm font-bold hover:bg-white/10 transition-all">
              <Icon name="support" className="w-4 h-4" /> {t(PT.support)}
            </Link>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon="folder" label={t(PT.totalOrders)} value={orders.length} sub={t({ en: "View orders", bn: "অর্ডার দেখুন" })} />
        <StatCard icon="layers" label={t(PT.activeServices)} value={subs.filter((s) => s.status === "active").length} sub={t({ en: "Active subscriptions", bn: "সক্রিয় সাবস্ক্রিপশন" })} />
        <StatCard icon="clock" label={t(PT.activeSubs)} value={subs.filter((s) => s.status === "active" && s.kind === "product").length} sub={t({ en: "Product plans", bn: "প্রোডাক্ট প্ল্যান" })} />
        <StatCard icon="wallet" label={t(PT.walletBalance)} value={money(balance, lang)} sub={t({ en: "Add funds", bn: "ফান্ড যোগ করুন" })} />
      </div>

      {/* Recent orders */}
      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg text-ink-900">{t({ en: "Recent Orders", bn: "সাম্প্রতিক অর্ডার" })}</h3>
          <Link to="/portal/dashboard?v=orders" className="text-sm font-semibold text-brand-600 hover:text-brand-700">{t({ en: "View all", bn: "সব দেখুন" })}</Link>
        </div>
        {orders.length === 0 ? (
          <EmptyState icon="folder" title={t({ en: "No Orders Yet", bn: "এখনও কোনো অর্ডার নেই" })} desc={t({ en: "You haven't placed any orders yet.", bn: "আপনি এখনও কোনো অর্ডার করেননি।" })} action={<Link to="/shop" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-700 to-brand-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-600/25"><Icon name="shop" className="w-4 h-4" /> {t({ en: "Explore Services", bn: "সার্ভিস দেখুন" })}</Link>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs font-bold uppercase tracking-wider text-ink-400">
                  <th className="px-3 py-2.5">{t({ en: "Order ID", bn: "অর্ডার আইডি" })}</th>
                  <th className="px-3 py-2.5">{t({ en: "Items", bn: "আইটেম" })}</th>
                  <th className="px-3 py-2.5">{t(PT.date)}</th>
                  <th className="px-3 py-2.5">{t(PT.amount)}</th>
                  <th className="px-3 py-2.5">{t(PT.status)}</th>
                  <th className="px-3 py-2.5 text-right">{t({ en: "Action", bn: "অ্যাকশন" })}</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 6).map((o) => (
                  <tr key={o.id} className="border-b border-ink-50 hover:bg-brand-50/40">
                    <td className="px-3 py-3 font-bold text-ink-900">#{o.no}</td>
                    <td className="px-3 py-3 text-ink-600 max-w-40 truncate">{o.items.map((it: any) => (typeof it.name === "string" ? it.name : it.name?.en)).join(", ")}</td>
                    <td className="px-3 py-3 text-ink-500">{fmtDateTime(o.created_at, lang)}</td>
                    <td className="px-3 py-3 font-semibold text-ink-800">{money(o.total, lang)}</td>
                    <td className="px-3 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-3 py-3 text-right">
                      <Link to={`/portal/dashboard?v=orders&id=${o.id}`} className="text-brand-600 font-semibold hover:text-brand-700">{t(PT.viewDetails)}</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Active services */}
      {subs.length > 0 && (
        <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-6">
          <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t({ en: "Active Services", bn: "সক্রিয় সার্ভিস" })}</h3>
          <div className="space-y-3">
            {subs.filter((s) => s.status === "active").slice(0, 4).map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-100 px-4 py-3.5">
                <div>
                  <p className="font-semibold text-ink-900">{typeof s.name === "string" ? s.name : s.name?.en}</p>
                  <p className="text-xs text-ink-400 mt-0.5">
                    {t({ en: "Expires:", bn: "মেয়াদ শেষ:" })} {fmtDateTime(s.next_renewal, lang)} · {money(s.renewal_price, lang)}
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <StatusBadge status={s.status} />
                  <Link to="/portal/dashboard?v=subscriptions" className="rounded-lg bg-brand-50 text-brand-700 px-3.5 py-1.5 text-xs font-bold hover:bg-brand-100 transition-colors">
                    {t(PT.renewNow)}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Orders ── */
function OrdersView() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const selectedId = params.get("id");
  const orders = all("orders").filter((o) => o.user_id === user!.id).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

  if (selectedId) {
    const order = orders.find((o) => o.id === selectedId);
    if (!order) return <EmptyState icon="folder" title={t({ en: "Order not found.", bn: "অর্ডার পাওয়া যায়নি।" })} />;
    return <OrderDetailView order={order} onBack={() => setParams({ v: "orders" })} />;
  }

  return (
    <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-6">
      <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t(PT.myOrders)} ({orders.length})</h3>
      <DataTable
        rows={orders}
        searchKeys={["no", "user_name"]}
        searchPlaceholder={t({ en: "Search orders…", bn: "অর্ডার খুঁজুন…" })}
        emptyTitle={t({ en: "No Orders Yet", bn: "এখনও কোনো অর্ডার নেই" })}
        columns={[
          { key: "no", label: t({ en: "Order", bn: "অর্ডার" }), render: (o) => <span className="font-bold text-ink-900">#{o.no}</span> },
          { key: "items", label: t({ en: "Item", bn: "আইটেম" }), render: (o) => <span className="text-ink-600">{o.items.map((it: any) => (typeof it.name === "string" ? it.name : it.name?.en)).join(", ")}</span> },
          { key: "created_at", label: t(PT.date), render: (o) => <span className="text-ink-500">{fmtDateTime(o.created_at, lang)}</span> },
          { key: "total", label: t({ en: "Total", bn: "মোট" }), render: (o) => <span className="font-semibold text-ink-800">{money(o.total, lang)}</span> },
          { key: "payment_method", label: t({ en: "Payment", bn: "পেমেন্ট" }), render: (o) => <span className="text-ink-500">{o.payment_method}</span> },
          { key: "status", label: t(PT.status), render: (o) => <StatusBadge status={o.status} /> },
          { key: "action", label: "", render: (o) => (
            <button onClick={() => setParams({ v: "orders", id: o.id })} className="text-brand-600 font-bold hover:text-brand-700 text-xs whitespace-nowrap">
              {t(PT.viewDetails)} →
            </button>
          ) },
        ]}
        onRowClick={(o) => setParams({ v: "orders", id: o.id })}
      />
    </div>
  );
}

function OrderDetailView({ order, onBack }: { order: any; onBack: () => void }) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const events = all("order_events").filter((e) => e.order_id === order.id);
  const [note, setNote] = useState("");

  const addNote = () => {
    if (!note.trim()) return;
    insert("order_events", { order_id: order.id, status: order.status, note, by: user!.name, at: nowISO() });
    setNote("");
    toast({ type: "success", title: t({ en: "Note added", bn: "নোট যোগ হয়েছে" }) });
  };

  const openTicket = () => {
    const tk = insert("tickets", { no: `TCK-${Math.floor(Math.random() * 9000 + 1000)}`, user_id: user!.id, user_name: user!.name, subject: `Order ${order.no} — Support`, category: "Order Support", priority: "Normal", status: "open" });
    insert("ticket_messages", { ticket_id: tk.id, user_id: user!.id, from: "client", body: `Support requested for order ${order.no}.`, at: nowISO() });
    notify("admin", "ticket", { en: "New support ticket", bn: "নতুন সাপোর্ট টিকিট" }, { en: `Order ${order.no} support by ${user!.name}.`, bn: `${user!.name} — অর্ডার ${order.no} সাপোর্ট।` });
    toast({ type: "success", title: t({ en: "Support ticket created", bn: "সাপোর্ট টিকিট তৈরি হয়েছে" }) });
  };

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700">
        <Icon name="arrow" className="w-4 h-4 rotate-180" /> {t(PT.myOrders)}
      </button>

      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 pb-4">
          <div>
            <h3 className="font-display font-bold text-xl text-ink-900">#{order.no}</h3>
            <p className="text-sm text-ink-400 mt-0.5">{fmtDateTime(order.created_at, lang)}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-xl text-brand-700">{money(order.total, lang)}</span>
            <StatusBadge status={order.status} />
          </div>
        </div>

        {/* Items */}
        <div className="mt-5">
          <h4 className="font-display font-bold text-sm text-ink-900 mb-2.5">{t({ en: "Order Summary", bn: "অর্ডার সামারি" })}</h4>
          <div className="space-y-2">
            {order.items.map((it: any, i: number) => (
              <div key={i} className="flex items-center justify-between rounded-xl bg-ink-50 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold text-ink-800">{typeof it.name === "string" ? it.name : it.name?.en} <span className="text-ink-400">× {it.qty}</span></p>
                  {it.fields && <p className="text-xs text-ink-400 mt-0.5 line-clamp-1">{Object.entries(it.fields).filter(([, v]) => v).map(([, v]) => String(v)).join(" · ")}</p>}
                </div>
                <span className="font-semibold text-ink-700 shrink-0">{money(it.price * it.qty, lang)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 ml-auto w-56 space-y-1.5 text-sm">
            <div className="flex justify-between text-ink-500"><span>{t(PT.subtotal)}</span><span>{money(order.subtotal, lang)}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-emerald-600"><span>{t(PT.discount)}</span><span>−{money(order.discount, lang)}</span></div>}
            <div className="flex justify-between font-display font-bold text-ink-900 border-t border-ink-200 pt-2"><span>{t(PT.total)}</span><span>{money(order.total, lang)}</span></div>
          </div>
        </div>

        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-ink-100 p-4 text-sm">
            <h4 className="font-display font-bold text-sm text-ink-900 mb-2">{t({ en: "Payment Information", bn: "পেমেন্ট তথ্য" })}</h4>
            <p className="text-ink-600"><strong>{t(PT.paymentMethod)}:</strong> {order.payment_method}</p>
            <p className="text-ink-600"><strong>{t(PT.status)}:</strong> {order.payment_status}</p>
            {order.ref_code && <p className="text-ink-600"><strong>{t({ en: "Referred by:", bn: "রেফারেল:" })}</strong> @{order.ref_code}</p>}
          </div>
          <div className="rounded-xl border border-ink-100 p-4 text-sm">
            <h4 className="font-display font-bold text-sm text-ink-900 mb-2">{t({ en: "Customer Information", bn: "গ্রাহক তথ্য" })}</h4>
            <p className="text-ink-600">{order.user_name}</p>
            <p className="text-ink-500 break-all">{order.user_email}</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-6">
          <h4 className="font-display font-bold text-sm text-ink-900 mb-3">{t(PT.orderTimeline)}</h4>
          <div className="space-y-3">
            {events.map((e, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
                    <Icon name="check" className="w-3 h-3" strokeWidth={3} />
                  </span>
                  {i < events.length - 1 && <span className="w-px flex-1 bg-ink-100" />}
                </div>
                <div className="pb-2">
                  <p className="text-sm"><StatusBadge status={e.status} /> <span className="text-xs text-ink-400">{fmtDateTime(e.at, lang)}{e.by ? ` · ${e.by}` : ""}</span></p>
                  {e.note && <p className="text-sm text-ink-600 mt-1 bg-ink-50 rounded-lg px-3 py-2">{e.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes + actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="flex flex-1 gap-2">
            <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t({ en: "Write a note for our team…", bn: "আমাদের টিমের জন্য নোট লিখুন…" })} />
            <Button size="sm" onClick={addNote}>{t(PT.addNote)}</Button>
          </div>
          <div className="flex gap-2.5">
            <InvoiceModal order={order} />
            <Button size="sm" variant="secondary" onClick={openTicket}>
              <Icon name="support" className="w-4 h-4" /> {t(PT.support)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Subscriptions ── */
function SubscriptionsView() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const subs = all("subscriptions").filter((s) => s.user_id === user!.id);
  const [result, setResult] = useState<{ ok: boolean; order?: any } | null>(null);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-6">
        <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t(PT.subscriptions)}</h3>
        {subs.length === 0 ? (
          <EmptyState icon="clock" title={t({ en: "No subscriptions yet.", bn: "এখনও কোনো সাবস্ক্রিপশন নেই।" })} desc={t({ en: "Subscriptions from recurring services and products appear here.", bn: "রিকারিং সার্ভিস ও প্রোডাক্টের সাবস্ক্রিপশন এখানে দেখা যাবে।" })} />
        ) : (
          <div className="space-y-3">
            {subs.map((s) => {
              const daysLeft = Math.ceil((new Date(s.next_renewal).getTime() - Date.now()) / 86400000);
              return (
                <div key={s.id} className="rounded-xl border border-ink-100 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink-900">{typeof s.name === "string" ? s.name : s.name?.en}</p>
                      <p className="text-xs text-ink-400 mt-0.5">
                        {t({ en: "Next renewal:", bn: "পরবর্তী নবায়ন:" })} {fmtDateTime(s.next_renewal, lang)} · {money(s.renewal_price, lang)}{t(PT.perYear)}
                        {daysLeft <= 7 && s.status === "active" && <span className="ml-2 text-amber-600 font-semibold">{t({ en: `· ${daysLeft} day(s) left`, bn: `· ${daysLeft} দিন বাকি` })}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-xs font-semibold text-ink-600">
                        {t({ en: "Auto-renew", bn: "অটো-রিনিউ" })}
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded accent-brand-600"
                          checked={!!s.auto_renew}
                          onChange={(e) => {
                            update("subscriptions", s.id, { auto_renew: e.target.checked });
                            toast({ type: "success", title: e.target.checked ? t({ en: "Auto-renew enabled", bn: "অটো-রিনিউ চালু হয়েছে" }) : t({ en: "Auto-renew disabled", bn: "অটো-রিনিউ বন্ধ হয়েছে" }) });
                          }}
                        />
                      </label>
                      <StatusBadge status={s.status} />
                      {(s.status === "active" || s.status === "expired") && (
                        <Button size="sm" onClick={() => {
                          const r = renewSubscription(s.id, "bkash");
                          setResult(r as any);
                          toast({ type: r.ok ? "success" : "error", title: r.ok ? t({ en: "Renewal order placed", bn: "নবায়ন অর্ডার তৈরি হয়েছে" }) : (r as any).error || "Error" });
                        }}>
                          {t(PT.renewNow)}
                        </Button>
                      )}
                    </div>
                  </div>
                  {result && result.order && (
                    <p className="mt-2 text-xs text-ink-500">
                      {result.order.status === "pending_payment"
                        ? t({ en: `Renewal order #${result.order.no} placed — complete payment from your Payments page.`, bn: `নবায়ন অর্ডার #${result.order.no} তৈরি হয়েছে — পেমেন্ট পেজ থেকে পেমেন্ট সম্পন্ন করুন।` })
                        : t({ en: "Renewal completed!", bn: "নবায়ন সম্পন্ন হয়েছে!" })}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Wallet ── */
function WalletView() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { addFunds } = useShop();
  const { toast } = useToast();
  const settings = getSettings();
  const balance = walletBalance(user!.id);
  const txs = all("wallet_txs").filter((w) => w.user_id === user!.id).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  const [filter, setFilter] = useState("all");
  const [amount, setAmount] = useState(1000);
  const [method, setMethod] = useState("bkash");
  const [trxId, setTrxId] = useState("");
  const methods = (settings.payments?.methods || []).filter((m: any) => m.enabled && m.id !== "wallet");
  const filtered = filter === "all" ? txs : txs.filter((w) => w.type === filter);

  return (
    <div className="space-y-5">
      {/* Balance card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 p-7 sm:p-9 text-white">
        <div className="absolute inset-0 bg-grid" aria-hidden="true" />
        <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <p className="text-sm font-semibold text-brand-100">{t(PT.walletBalance)}</p>
            <p className="mt-1 font-display font-bold text-4xl sm:text-5xl">{money(balance, lang)}</p>
            <p className="mt-2 text-xs text-brand-100/70">{t({ en: "Wallet balance can be used to pay for any order instantly.", bn: "ওয়ালেট ব্যালেন্স দিয়ে যেকোনো অর্ডারের পেমেন্ট তাৎক্ষণিকভাবে করা যায়।" })}</p>
          </div>
          <button onClick={() => document.getElementById("addfunds")?.scrollIntoView({ behavior: "smooth" })} className="inline-flex items-center gap-2 rounded-xl bg-white text-brand-700 px-6 py-3 font-bold text-sm hover:bg-brand-50 transition-all shrink-0 shadow-xl">
            <Icon name="wallet" className="w-4.5 h-4.5" /> {t(PT.addFunds)}
          </button>
        </div>
      </div>

      {/* Add funds */}
      <div id="addfunds" className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-6 scroll-mt-24">
        <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t(PT.addFunds)}</h3>
        <div className="flex flex-wrap gap-2.5">
          {[500, 1000, 2000, 5000].map((a) => (
            <button key={a} onClick={() => setAmount(a)} className={cn("px-4 py-2 rounded-xl border text-sm font-semibold transition-all", amount === a ? "border-brand-500 bg-brand-50 text-brand-700" : "border-ink-200 text-ink-600 hover:border-brand-300")}>
              {money(a, lang)}
            </button>
          ))}
        </div>
        <div className="mt-4 grid sm:grid-cols-3 gap-4">
          <Field label={t(PT.customAmount)}>
            <input type="number" className={inputCls} value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
          </Field>
          <Field label={t(PT.paymentMethod)}>
            <select className={cn(inputCls, "appearance-none")} value={method} onChange={(e) => setMethod(e.target.value)}>
              {methods.map((m: any) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </Field>
          <Field label={t(PT.trxId)} required>
            <input className={inputCls} value={trxId} onChange={(e) => setTrxId(e.target.value)} />
          </Field>
        </div>
        <div className="mt-4 rounded-xl bg-ink-50 px-4 py-3 text-sm flex justify-between">
          <span className="text-ink-500">{t({ en: "Processing fee", bn: "প্রসেসিং ফি" })}</span>
          <span className="font-semibold text-ink-800">{money(0, lang)}</span>
        </div>
        <div className="mt-2 rounded-xl bg-brand-50/60 px-4 py-3 text-sm flex justify-between">
          <span className="font-semibold text-ink-800">{t(PT.total)}</span>
          <span className="font-display font-bold text-brand-700">{money(amount, lang)}</span>
        </div>
        <Button className="mt-4" onClick={() => {
          if (!trxId.trim()) { toast({ type: "warning", title: t({ en: "Enter the Transaction ID", bn: "ট্রানজেকশন আইডি লিখুন" }) }); return; }
          const r = addFunds(amount, method, trxId);
          if (!r.ok) { toast({ type: "error", title: r.error || "Error" }); return; }
          setTrxId("");
          toast({ type: "success", title: t({ en: "Deposit request submitted", bn: "ডিপোজিট অনুরোধ জমা হয়েছে" }), desc: t(PT.depositSuccess) });
        }}>
          {t({ en: "Continue to Payment", bn: "পেমেন্টে এগিয়ে যান" })} <Icon name="arrow" className="w-4 h-4" />
        </Button>
      </div>

      {/* Transactions */}
      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="font-display font-bold text-lg text-ink-900">{t(PT.transactions)}</h3>
          <div className="flex gap-2">
            {[{ k: "all", l: t(PT.allItems) }, { k: "credit", l: t(PT.credit) }, { k: "debit", l: t(PT.debit) }].map((f) => (
              <button key={f.k} onClick={() => setFilter(f.k)} className={cn("px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all", filter === f.k ? "bg-brand-600 text-white border-brand-600" : "bg-white text-ink-500 border-ink-200")}>
                {f.l}
              </button>
            ))}
          </div>
        </div>
        {filtered.length === 0 ? <EmptyState icon="wallet" title={t({ en: "No transactions yet.", bn: "এখনও কোনো লেনদেন নেই।" })} /> : (
          <div className="space-y-2">
            {filtered.slice(0, 20).map((w) => (
              <div key={w.id} className="flex items-center justify-between rounded-xl bg-ink-50 px-4 py-3 text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", w.type === "credit" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500")}>
                    <Icon name={w.type === "credit" ? "trending" : "arrow"} className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-ink-800 truncate">{w.reason}</p>
                    <p className="text-xs text-ink-400">{w.id} · {fmtDateTime(w.created_at, lang)}</p>
                  </div>
                </div>
                <span className={cn("font-bold shrink-0", w.type === "credit" ? "text-emerald-600" : "text-red-500")}>
                  {w.type === "credit" ? "+" : "−"}{money(w.amount, lang)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Payments ── */
function PaymentsView() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const payments = all("payments").filter((p) => p.user_id === user!.id).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return (
    <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-6">
      <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t(PT.payments)}</h3>
      <DataTable
        rows={payments}
        searchKeys={["no", "method", "trx_id"]}
        searchPlaceholder={t({ en: "Search payments…", bn: "পেমেন্ট খুঁজুন…" })}
        emptyTitle={t({ en: "No payments yet.", bn: "এখনও কোনো পেমেন্ট নেই।" })}
        columns={[
          { key: "no", label: t({ en: "Transaction ID", bn: "ট্রানজেকশন আইডি" }), render: (p) => <span className="font-bold text-ink-900">{p.no}</span> },
          { key: "type", label: t({ en: "Type", bn: "ধরন" }), render: (p) => <span className="text-ink-600">{p.type === "deposit" ? t({ en: "Wallet Deposit", bn: "ওয়ালেট ডিপোজিট" }) : t(PT.orders)}</span> },
          { key: "method", label: t({ en: "Method", bn: "মাধ্যম" }), render: (p) => <span className="text-ink-500">{p.method}</span> },
          { key: "amount", label: t(PT.amount), render: (p) => <span className="font-bold text-ink-800">{money(p.amount, lang)}</span> },
          { key: "created_at", label: t(PT.date), render: (p) => <span className="text-ink-500">{fmtDateTime(p.created_at, lang)}</span> },
          { key: "status", label: t(PT.status), render: (p) => <StatusBadge status={p.status} /> },
        ]}
      />
    </div>
  );
}

/* ── Invoices / Downloads ── */
function InvoicesView() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const invoices = all("invoices").filter((i) => i.user_id === user!.id).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return (
    <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-6">
      <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t(PT.invoices)}</h3>
      <DataTable
        rows={invoices}
        searchKeys={["no", "order_no"]}
        emptyTitle={t({ en: "No invoices yet.", bn: "এখনও কোনো ইনভয়েস নেই।" })}
        columns={[
          { key: "no", label: t({ en: "Invoice", bn: "ইনভয়েস" }), render: (i) => <span className="font-bold text-ink-900">{i.no}</span> },
          { key: "order_no", label: t({ en: "Order", bn: "অর্ডার" }), render: (i) => <span className="text-ink-600">#{i.order_no}</span> },
          { key: "created_at", label: t(PT.date), render: (i) => <span className="text-ink-500">{fmtDateTime(i.created_at, lang)}</span> },
          { key: "total", label: t({ en: "Total", bn: "মোট" }), render: (i) => <span className="font-bold text-ink-800">{money(i.total, lang)}</span> },
          { key: "status", label: t(PT.status), render: (i) => <StatusBadge status={i.status} /> },
          { key: "action", label: "", render: (i) => {
            const order = get("orders", i.order_id);
            return order ? <InvoiceModal order={order} /> : null;
          } },
        ]}
      />
    </div>
  );
}

function DownloadsView() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const orders = all("orders").filter((o) => o.user_id === user!.id);
  const licenses = orders
    .filter((o) => o.licenses?.length && ["ready", "completed", "payment_confirmed"].includes(o.status))
    .flatMap((o) => (o.licenses || []).map((l: any) => ({ ...l, order: o })));

  const download = (lic: any) => {
    const content = `AL-KHUBAIB IT — License Certificate\nProduct: ${lic.name}\nLicense Key: ${lic.license}\nOrder: ${lic.order.no}\nDate: ${new Date().toISOString()}\n\nKeep this license key safe. Support: contact@alkhubaibit.com`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${String(lic.name).replace(/\s+/g, "-")}-license.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ type: "info", title: t({ en: "License downloaded", bn: "লাইসেন্স ডাউনলোড হয়েছে" }) });
  };

  return (
    <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-6">
      <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t(PT.downloads)}</h3>
      {licenses.length === 0 ? (
        <EmptyState icon="monitor" title={t({ en: "No Downloads Yet", bn: "এখনও কোনো ডাউনলোড নেই" })} desc={t({ en: "Purchased digital products will appear here after payment.", bn: "পেমেন্টের পর কেনা ডিজিটাল প্রোডাক্ট এখানে দেখা যাবে।" })} />
      ) : (
        <div className="space-y-2.5">
          {licenses.map((l: any, i: number) => (
            <div key={i} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-100 px-4 py-3 text-sm">
              <div>
                <p className="font-semibold text-ink-900">{l.name}</p>
                <p className="text-xs text-ink-400">#{l.order.no} · {fmtDateTime(l.order.created_at, lang)}</p>
                <p className="text-xs font-mono text-brand-700 mt-0.5">{l.license}</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => download(l)}>
                <Icon name="monitor" className="w-4 h-4" /> {t(PT.licenseDownload)}
              </Button>
            </div>
          ))}
        </div>
      )}
      <p className="mt-4 text-xs text-ink-400">{t({ en: "Downloads are protected with authorized license keys — no direct file URLs are exposed.", bn: "ডাউনলোড অনুমোদিত লাইসেন্স কি দিয়ে সুরক্ষিত — সরাসরি ফাইল URL প্রকাশ করা হয় না।" })}</p>
    </div>
  );
}

/* ── Support ── */
function SupportView() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const tickets = all("tickets").filter((tk) => tk.user_id === user!.id).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState<any | null>(null);
  const [reply, setReply] = useState("");
  const [form, setForm] = useState({ subject: "", category: "Order Support", priority: "Normal", message: "" });

  if (open) {
    const msgs = all("ticket_messages").filter((m) => m.ticket_id === open.id);
    return (
      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-6">
        <button onClick={() => setOpen(null)} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 mb-4">
          <Icon name="arrow" className="w-4 h-4 rotate-180" /> {t(PT.support)}
        </button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display font-bold text-lg text-ink-900">{open.subject}</h3>
            <p className="text-xs text-ink-400">{open.no} · {open.category} · {open.priority}</p>
          </div>
          <StatusBadge status={open.status} />
        </div>
        <div className="mt-4 space-y-3">
          {msgs.map((m) => (
            <div key={m.id} className={cn("max-w-[85%] rounded-2xl px-4 py-3 text-sm", m.from === "client" ? "ml-auto bg-brand-50 text-ink-700" : "mr-auto bg-ink-50 text-ink-700")}>
              <p>{m.body}</p>
              <p className="text-[10px] text-ink-400 mt-1">{fmtDateTime(m.at, lang)} · {m.from === "admin" ? "AL-KHUBAIB IT" : t({ en: "You", bn: "আপনি" })}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex gap-2">
          <input className={inputCls} value={reply} onChange={(e) => setReply(e.target.value)} placeholder={t({ en: "Type a reply…", bn: "উত্তর লিখুন…" })} />
          <Button size="sm" onClick={() => {
            if (!reply.trim()) return;
            insert("ticket_messages", { ticket_id: open.id, user_id: user!.id, from: "client", body: reply.trim(), at: nowISO() });
            update("tickets", open.id, { status: "waiting_for_customer" });
            notify("admin", "ticket", { en: "New ticket reply", bn: "নতুন টিকিট উত্তর" }, { en: `${open.subject} — new client reply.`, bn: `${open.subject} — ক্লায়েন্টের নতুন উত্তর।` });
            setReply("");
            toast({ type: "success", title: t({ en: "Reply sent", bn: "উত্তর পাঠানো হয়েছে" }) });
          }}>{t(PT.reply)}</Button>
        </div>
      </div>
    );
  }

  const openCount = tickets.filter((tk) => tk.status === "open" || tk.status === "in_progress" || tk.status === "in_progress_ticket" || tk.status === "waiting_for_customer").length;
  const resolvedCount = tickets.filter((tk) => tk.status === "resolved" || tk.status === "closed").length;

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard icon="folder" label={t({ en: "All Tickets", bn: "সব টিকিট" })} value={tickets.length} />
        <StatCard icon="clock" label={t({ en: "Open Tickets", bn: "খোলা টিকিট" })} value={openCount} />
        <StatCard icon="check" label={t({ en: "Resolved Tickets", bn: "সমাধান হওয়া টিকিট" })} value={resolvedCount} />
      </div>
      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg text-ink-900">{t(PT.support)}</h3>
          <Button size="sm" onClick={() => setCreating(!creating)}>{t(PT.newTicket)}</Button>
        </div>
        {creating && (
          <div className="mb-5 rounded-xl border border-brand-100 bg-brand-50/50 p-4 grid gap-3">
            <Field label={t(PT.ticketSubject)} required>
              <input className={inputCls} value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
            </Field>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label={t(PT.ticketCategory)}>
                <select className={cn(inputCls, "appearance-none")} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                  {["Order Support", "Billing", "Technical Issue", "Service Enquiry", "Other"].map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label={t(PT.ticketPriority)}>
                <select className={cn(inputCls, "appearance-none")} value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
                  {["Low", "Normal", "High", "Urgent"].map((p) => <option key={p}>{p}</option>)}
                </select>
              </Field>
            </div>
            <Field label={t(PT.ticketMessage)} required>
              <textarea rows={3} className={cn(inputCls, "resize-none")} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
            </Field>
            <Button size="sm" onClick={() => {
              if (!form.subject.trim() || !form.message.trim()) { toast({ type: "warning", title: t(PT.errRequired) }); return; }
              const tk = insert("tickets", { no: `TCK-${Math.floor(Math.random() * 9000 + 1000)}`, user_id: user!.id, user_name: user!.name, subject: form.subject, category: form.category, priority: form.priority, status: "open" });
              insert("ticket_messages", { ticket_id: tk.id, user_id: user!.id, from: "client", body: form.message, at: nowISO() });
              notify("admin", "ticket", { en: "New support ticket", bn: "নতুন সাপোর্ট টিকিট" }, { en: `${form.subject} by ${user!.name}.`, bn: `${user!.name} — ${form.subject}।` });
              setForm({ subject: "", category: "Order Support", priority: "Normal", message: "" });
              setCreating(false);
              toast({ type: "success", title: t({ en: "Ticket created", bn: "টিকিট তৈরি হয়েছে" }) });
            }}>{t(PT.createTicket)}</Button>
          </div>
        )}
        {tickets.length === 0 ? (
          <EmptyState icon="support" title={t({ en: "No tickets yet.", bn: "এখনও কোনো টিকিট নেই।" })} desc={t({ en: "Create a ticket and our team will respond.", bn: "টিকিট তৈরি করুন — আমাদের টিম উত্তর দেবে।" })} />
        ) : (
          <div className="space-y-2.5">
            {tickets.map((tk) => (
              <button key={tk.id} onClick={() => setOpen(tk)} className="w-full text-left rounded-xl border border-ink-100 px-4 py-3 hover:border-brand-300 transition-all">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink-900 text-sm">{tk.subject}</p>
                    <p className="text-xs text-ink-400">{tk.no} · {fmtDateTime(tk.created_at, lang)}</p>
                  </div>
                  <StatusBadge status={tk.status} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Callback request ── */
function CallbackView() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ id: string } | null>(null);
  // Account info auto-filled from the logged-in client (read-only)
  const [form, setForm] = useState({
    whatsapp: "",
    subject: "",
    message: "",
    time: "any",
    priority: "normal",
  });

  const genId = () => {
    const d = new Date();
    const day = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    const todayCalls = all("callbacks").filter((c) => String(c.no || "").startsWith(`CBR-${day}`)).length;
    return `CBR-${day}-${String(todayCalls + 1).padStart(4, "0")}`;
  };

  const submit = () => {
    if (busy) return; // prevent double submission
    if (!form.subject) {
      toast({ type: "warning", title: t(PT.callbackErrs.subject) });
      return;
    }
    if (!form.message.trim() || form.message.trim().length < 10) {
      toast({ type: "warning", title: t(PT.callbackErrs.message) });
      return;
    }
    setBusy(true);
    // 1) Save the request securely with a unique ID
    const no = genId();
    const rec = insert("callbacks", {
      no, user_id: user!.id, name: user!.name, email: user!.email, phone: user!.mobile,
      whatsapp: form.whatsapp, subject: form.subject, message: form.message.trim(),
      preferred_time: form.time, priority: form.priority, status: "new",
      assigned: "", internal_note: "", created_at: nowISO(),
    });
    // 2) Notifications ONLY after successful save (never lost if they fail)
    try {
      notifyEvent("callback_client", {
        name: user!.name, request_id: no, subject: form.subject,
        phone: user!.mobile, email: user!.email, date: new Date().toLocaleString("en-GB"),
      });
      notifyEvent("callback_admin", {
        request_id: no, name: user!.name, phone: user!.mobile, email: user!.email,
        subject: form.subject, message: form.message, status: "New", date: new Date().toLocaleString("en-GB"),
      });
      notify("admin", "callback", { en: "New callback request", bn: "নতুন কলব্যাক রিকুয়েস্ট" }, {
        en: `${user!.name} requested a callback (${no}) — ${form.subject}.`,
        bn: `${user!.name} কলব্যাক রিকুয়েস্ট করেছেন (${no}) — ${form.subject}।`,
      });
    } catch {
      /* notification failures are logged by the engine and never drop the request */
    }
    setBusy(false);
    setDone({ id: rec.no });
  };

  if (done) {
    return (
      <div className="rounded-3xl bg-white border border-ink-100 p-8 sm:p-10 text-center shadow-card">
        <span className="mx-auto w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
          <Icon name="check" className="w-8 h-8" strokeWidth={2.5} />
        </span>
        <h2 className="mt-5 font-display font-bold text-xl sm:text-2xl text-ink-900 leading-snug">{t(PT.callbackSuccessTitle)}</h2>
        <p className="mt-2 font-mono text-sm font-bold text-brand-700">{t(PT.callbackRequestId)}: {done.id}</p>
        <p className="mt-4 text-ink-500 leading-relaxed max-w-md mx-auto">{t(PT.callbackSuccessBody)}</p>
        <div className="mt-7 flex flex-col sm:flex-row justify-center gap-3">
          <Button to="/portal/dashboard?v=support">{t(PT.support)}</Button>
          <Button variant="secondary" onClick={() => { setDone(null); setForm({ whatsapp: "", subject: "", message: "", time: "any", priority: "normal" }); }}>
            {t(PT.callbackNew)}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white border border-ink-100 p-6 sm:p-8 shadow-soft">
      <div className="flex items-center gap-4">
        <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 text-white flex items-center justify-center shadow-lg shadow-brand-600/25">
          <Icon name="phone" className="w-6 h-6" />
        </span>
        <div>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-ink-900">{t(PT.callbackTitle)}</h2>
          <p className="text-sm text-ink-500 mt-0.5">{t(PT.callbackSub)}</p>
        </div>
      </div>

      <div className="mt-7 grid sm:grid-cols-2 gap-4">
        {/* Auto-filled account info — read-only */}
        <Field label={t(PT.name)}>
          <input className={cn(inputCls, "bg-ink-50")} value={user!.name} disabled />
        </Field>
        <Field label={t(PT.email)}>
          <input className={cn(inputCls, "bg-ink-50")} value={user!.email} disabled />
        </Field>
        <Field label={t(PT.mobile)}>
          <input className={cn(inputCls, "bg-ink-50")} value={user!.mobile} disabled />
        </Field>
        <Field label={t(PT.callbackWhatsapp)}>
          <input className={inputCls} placeholder="+880 1XXX XXXXXX" value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))} />
        </Field>
        <div className="sm:col-span-2">
          <Field label={t(PT.callbackSubject)} required>
            <select className={cn(inputCls, "appearance-none")} value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}>
              <option value="">—</option>
              {PT.callbackSubjects.map((s, i) => (
                <option key={i} value={s.en}>{t(s)}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label={t(PT.callbackTime)}>
          <select className={cn(inputCls, "appearance-none")} value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}>
            {PT.callbackTimes.map((s, i) => <option key={i} value={s.en}>{t(s)}</option>)}
          </select>
        </Field>
        <Field label={t(PT.callbackPriority)}>
          <select className={cn(inputCls, "appearance-none")} value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
            {["Low", "Normal", "High", "Urgent"].map((p) => <option key={p} value={p.toLowerCase()}>{t({ en: p, bn: p === "Low" ? "কম" : p === "High" ? "বেশি" : p === "Urgent" ? "জরুরি" : "সাধারণ" })}</option>)}
          </select>
        </Field>
        <div className="sm:col-span-2">
          <Field label={t(PT.callbackMessage)} required>
            <textarea rows={4} className={cn(inputCls, "resize-none")} placeholder={t({ en: "Describe your issue or request…", bn: "আপনার সমস্যা বা অনুরোধ বর্ণনা করুন…" })} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
          </Field>
        </div>
      </div>

      <div className="mt-6">
        <Button size="lg" onClick={submit}>
          {busy ? <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : <Icon name="send" className="w-4.5 h-4.5" />}
          {t(PT.callbackSubmit)}
        </Button>
        <p className="mt-3 text-xs text-ink-400">
          {t({ en: "Our expert team will contact you within 24 hours.", bn: "আগামী ২৪ ঘণ্টার মধ্যে আমাদের এক্সপার্ট টিম আপনার সাথে যোগাযোগ করবে।" })}
        </p>
      </div>
    </div>
  );
}

/* ── Notifications / Profile / Security ── */
function NotificationsView() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const items = all("notifications").filter((n) => n.user_id === user!.id).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return (
    <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg text-ink-900">{t(PT.notifications)}</h3>
        <Button size="sm" variant="secondary" onClick={() => items.filter((n) => !n.read).forEach((n) => update("notifications", n.id, { read: true }))}>
          {t(PT.markRead)}
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState icon="bell" title={t({ en: "No Notifications", bn: "কোনো নোটিফিকেশন নেই" })} desc={t({ en: "Order, payment and account updates will appear here.", bn: "অর্ডার, পেমেন্ট ও অ্যাকাউন্টের আপডেট এখানে দেখা যাবে।" })} />
      ) : (
        <div className="space-y-2.5">
          {items.map((n) => (
            <div key={n.id} className={cn("rounded-xl border px-4 py-3", n.read ? "border-ink-100" : "border-brand-200 bg-brand-50/50")}>
              <p className="font-semibold text-sm text-ink-900">{t(n.title)}</p>
              <p className="text-sm text-ink-500 mt-0.5">{t(n.body)}</p>
              <p className="text-[11px] text-ink-400 mt-1">{fmtDateTime(n.created_at, lang)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileView() {
  const { t } = useI18n();
  const { user, refresh } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user!.name);
  const [mobile, setMobile] = useState(user!.mobile);
  const [emailNotify, setEmailNotify] = useState(true);
  const [orderNotify, setOrderNotify] = useState(true);
  const [renewalNotify, setRenewalNotify] = useState(true);
  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-6">
        <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t({ en: "Personal Information", bn: "ব্যক্তিগত তথ্য" })}</h3>
        <div className="space-y-3">
          <Field label={t(PT.name)}><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label={t(PT.mobile)}><input className={inputCls} value={mobile} onChange={(e) => setMobile(e.target.value)} /></Field>
          <Field label={t(PT.email)}><input className={cn(inputCls, "bg-ink-50")} value={user!.email} disabled /></Field>
          <Button onClick={() => {
            update("users", user!.id, { name, mobile });
            refresh();
            toast({ type: "success", title: t({ en: "Profile updated", bn: "প্রোফাইল আপডেট হয়েছে" }) });
          }}>{t(PT.updateProfile)}</Button>
        </div>
      </div>
      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-6">
        <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t({ en: "Notification Preferences", bn: "নোটিফিকেশন পছন্দ" })}</h3>
        <div className="space-y-3.5">
          {[
            { v: emailNotify, s: setEmailNotify, l: t({ en: "Email notifications", bn: "ইমেইল নোটিফিকেশন" }) },
            { v: orderNotify, s: setOrderNotify, l: t({ en: "Order updates", bn: "অর্ডার আপডেট" }) },
            { v: renewalNotify, s: setRenewalNotify, l: t({ en: "Renewal reminders", bn: "নবায়ন রিমাইন্ডার" }) },
          ].map((x) => (
            <label key={x.l} className="flex items-center justify-between rounded-xl border border-ink-100 px-4 py-3 cursor-pointer">
              <span className="text-sm font-semibold text-ink-800">{x.l}</span>
              <input type="checkbox" className="w-4.5 h-4.5 accent-brand-600" checked={x.v} onChange={(e) => x.s(e.target.checked)} />
            </label>
          ))}
          <Button onClick={() => toast({ type: "success", title: t({ en: "Preferences saved", bn: "পছন্দ সংরক্ষণ হয়েছে" }) })}>{t(PT.save)}</Button>
        </div>
      </div>
    </div>
  );
}

function SecurityView() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const [cur, setCur] = useState("");
  const [npw, setNpw] = useState("");
  const record = get("users", user!.id) as any;
  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-6">
        <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t(PT.changePassword)}</h3>
        <div className="space-y-3">
          <Field label={t(PT.currentPassword)}><input type="password" className={inputCls} value={cur} onChange={(e) => setCur(e.target.value)} /></Field>
          <Field label={t(PT.newPassword)}><input type="password" className={inputCls} value={npw} onChange={(e) => setNpw(e.target.value)} /></Field>
          <Button onClick={async () => {
            const { verifyPassword, hashPassword } = await import("../lib/db");
            const ok = await verifyPassword(cur, record?.salt || "", record?.hash || "");
            if (!ok) { toast({ type: "error", title: t({ en: "Current password is incorrect.", bn: "বর্তমান পাসওয়ার্ড ভুল।" }) }); return; }
            if (npw.length < 8 || !/[a-zA-Z]/.test(npw) || !/[0-9]/.test(npw)) { toast({ type: "warning", title: t(PT.errPasswordLen) }); return; }
            const hash = await hashPassword(npw, record?.salt || "");
            update("users", user!.id, { hash });
            setCur(""); setNpw("");
            toast({ type: "success", title: t({ en: "Password changed", bn: "পাসওয়ার্ড পরিবর্তন হয়েছে" }) });
          }}>{t(PT.changePassword)}</Button>
        </div>
      </div>
      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-6">
        <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t(PT.security)}</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-xl bg-ink-50 px-4 py-3">
            <span className="text-ink-600">{t({ en: "Current session", bn: "বর্তমান সেশন" })}</span>
            <span className="font-semibold text-emerald-600 flex items-center gap-1.5"><Icon name="check" className="w-4 h-4" strokeWidth={3} /> {t({ en: "Secure", bn: "সুরক্ষিত" })}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-ink-50 px-4 py-3">
            <span className="text-ink-600">{t({ en: "Password protection", bn: "পাসওয়ার্ড সুরক্ষা" })}</span>
            <span className="font-semibold text-ink-800">{t({ en: "Hashed (SHA-256 + salt)", bn: "হ্যাশড (SHA-256 + salt)" })}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-ink-50 px-4 py-3">
            <span className="text-ink-600">{t({ en: "Login protection", bn: "লগইন সুরক্ষা" })}</span>
            <span className="font-semibold text-ink-800">{t({ en: "Attempt-limited", bn: "চেষ্টা সীমিত" })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
