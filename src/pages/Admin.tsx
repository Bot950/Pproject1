import { useState } from "react";
import { Icon } from "../components/Icons";
import { Button } from "../components/ui";
import { usePageMeta } from "../components/Layout";
import { useI18n } from "../lib/i18n";
import { useAuth, Require } from "../lib/auth";
import { useShop } from "../lib/shop";
import { decideApplication, decideKyc, decideWithdrawal, setCommissionStatus } from "../lib/affiliate";
import {
  all, get, insert, update, remove, money, fmtDateTime, fmtDate, useDbVersion, getSettings, setSetting,
  walletBalance, walletCredit, walletDebit, notify, logAction, nowISO, exportBackup, resetDatabase, recordLedger,
} from "../lib/db";
import { PT } from "../lib/portalText";
import { StatusBadge, Field, inputCls, Bars } from "../components/portalUi";
import {
  AdminShell, ZoneDenied, DataTable, EmptyState, TimeRange, useToast, useConfirm,
} from "../lib/shell";
import {
  PagesView, SectionsView, FormsView, SubmissionsView, MenusView, CategoriesView,
  InvoicesView, EmailTemplatesView, EmailLogsView, SmtpView, TelegramView,
  TelegramLogsView, UsersView, RolesView, CallbacksView,
} from "./AdminExt";
import {
  AdminAppointmentsView, AdminAppointmentServicesView, AdminAppointmentSettingsView,
} from "./Appointment";
import { can } from "../lib/adminCore";
import { cn } from "../utils/cn";

/* ─────────────────────── Zone guard ───────────────────────── */

export default function Admin() {
  const { t } = useI18n();
  const { user } = useAuth();
  usePageMeta(t({ en: "Admin Panel", bn: "অ্যাডমিন প্যানেল" }));
  if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
    return <ZoneDenied zone="admin" />;
  }
  return (
    <Require roles={["super_admin", "admin"]}>
      <AdminPanel />
    </Require>
  );
}

/* ─────────────────────── Panel ────────────────────────────── */

function AdminPanel() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [section, setSection] = useState("dashboard");
  useDbVersion();

  const pendingApps = all("affiliate_applications").filter((a) => a.status === "pending").length;
  const pendingKyc = all("affiliate_kyc").filter((k) => k.status === "submitted").length;
  const pendingPayments = all("payments").filter((p) => p.status === "pending_verification").length;
  const pendingWithdrawals = all("withdrawals").filter((w) => w.status === "pending").length;

  const NAV_RAW: { group: string; items: { k: string; icon: string; label: React.ReactNode; badge?: number; module?: string }[] }[] = [
    {
      group: "Dashboard",
      items: [{ k: "dashboard", icon: "dashboard", label: t(PT.dashboard), module: "dashboard" }],
    },
    {
      group: t({ en: "Website", bn: "ওয়েবসাইট" }),
      items: [
        { k: "pages", icon: "doc", label: t({ en: "Pages", bn: "পেজ" }), module: "pages" },
        { k: "sections", icon: "layers", label: t({ en: "Homepage Sections", bn: "হোমপেজ সেকশন" }), module: "sections" },
        { k: "forms", icon: "pen", label: t({ en: "Forms", bn: "ফর্ম" }), module: "forms" },
        { k: "submissions", icon: "mail", label: t({ en: "Submissions", bn: "সাবমিশন" }), module: "forms" },
        { k: "menus", icon: "menu", label: t({ en: "Menus & Footer", bn: "মেনু ও ফুটার" }), module: "menus" },
        { k: "content", icon: "settings", label: t({ en: "General Settings", bn: "সাধারণ সেটিংস" }), module: "settings" },
      ],
    },
    {
      group: t({ en: "Commerce", bn: "কমার্স" }),
      items: [
        { k: "products", icon: "folder", label: t(PT.products), module: "products" },
        { k: "services", icon: "layers", label: t(PT.services), module: "services" },
        { k: "categories", icon: "book", label: t({ en: "Categories", bn: "ক্যাটাগরি" }), module: "categories" },
        { k: "orders", icon: "shop", label: t(PT.orders), module: "orders" },
        { k: "subscriptions", icon: "clock", label: t(PT.subscriptions), module: "subscriptions" },
        { k: "coupons", icon: "gift", label: t(PT.coupons), module: "coupons" },
        { k: "invoices", icon: "doc", label: t({ en: "Invoice Manager", bn: "ইনভয়েস ম্যানেজার" }), module: "invoices" },
      ],
    },
    {
      group: t({ en: "Customers", bn: "গ্রাহক" }),
      items: [
        { k: "customers", icon: "users", label: t(PT.customers), module: "customers" },
        { k: "payments", icon: "card", label: t(PT.payments), badge: pendingPayments, module: "payments" },
        { k: "tickets", icon: "support", label: t(PT.support), module: "tickets" },
        { k: "callbacks", icon: "phone", label: t({ en: "Callback Requests", bn: "কলব্যাক রিকুয়েস্ট" }), module: "callbacks" },
      ],
    },
    {
      group: t({ en: "Appointments", bn: "অ্যাপয়েন্টমেন্ট" }),
      items: [
        { k: "appointments", icon: "clock", label: t(PT.appointments), module: "appointments" },
        { k: "appointmentservices", icon: "layers", label: t(PT.appointmentServices), module: "appointments" },
        { k: "appointmentsettings", icon: "settings", label: t(PT.appointmentIntegration), module: "appointments" },
      ],
    },
    {
      group: t({ en: "Affiliates", bn: "এফিলিয়েট" }),
      items: [
        { k: "applications", icon: "briefcase", label: t(PT.applications), badge: pendingApps, module: "applications" },
        { k: "affiliates", icon: "network", label: t(PT.affiliates), badge: pendingKyc, module: "affiliates" },
        { k: "commissions", icon: "trending", label: t(PT.commissions), module: "commissions" },
        { k: "withdrawals", icon: "wallet", label: t(PT.withdrawals), badge: pendingWithdrawals, module: "withdrawals" },
      ],
    },
    {
      group: t({ en: "Communication", bn: "যোগাযোগ" }),
      items: [
        { k: "email", icon: "mail", label: t({ en: "Email Templates", bn: "ইমেইল টেমপ্লেট" }), module: "email" },
        { k: "smtp", icon: "settings", label: t({ en: "SMTP Settings", bn: "SMTP সেটিংস" }), module: "email" },
        { k: "emaillogs", icon: "doc", label: t({ en: "Email Logs", bn: "ইমেইল লগ" }), module: "email" },
        { k: "telegram", icon: "send", label: t({ en: "Telegram Notifications", bn: "টেলিগ্রাম নোটিফিকেশন" }), module: "telegram" },
        { k: "telegramlogs", icon: "doc", label: t({ en: "Telegram Logs", bn: "টেলিগ্রাম লগ" }), module: "telegram" },
      ],
    },
    {
      group: t({ en: "Reports", bn: "রিপোর্ট" }),
      items: [
        { k: "reports", icon: "chart", label: t({ en: "Sales & Revenue", bn: "বিক্রয় ও আয়" }), module: "reports" },
        { k: "ledger", icon: "doc", label: t({ en: "Financial Ledger", bn: "ফাইন্যান্সিয়াল লেজার" }), module: "ledger" },
      ],
    },
    {
      group: t({ en: "Users & System", bn: "ইউজার ও সিস্টেম" }),
      items: [
        { k: "users", icon: "users", label: t({ en: "Users", bn: "ইউজার" }), module: "users" },
        { k: "roles", icon: "shield", label: t({ en: "Roles & Permissions", bn: "রোল ও পারমিশন" }), module: "roles" },
        { k: "notifications", icon: "bell", label: t(PT.notifications), module: "notifications" },
        { k: "settings", icon: "settings", label: t(PT.settings), module: "settings" },
        { k: "logs", icon: "doc", label: t(PT.logs), module: "logs" },
        { k: "backup", icon: "shield", label: t({ en: "Backup", bn: "ব্যাকআপ" }), module: "backup" },
      ],
    },
  ];

  // Server-style permission filtering — menus AND views are guarded.
  const nav = NAV_RAW
    .map((grp) => ({ ...grp, items: grp.items.filter((it) => can(user, (it.module || it.k) as any)) }))
    .filter((grp) => grp.items.length > 0);

  const titles: Record<string, string> = {
    dashboard: t(PT.salesOverview),
    pages: t({ en: "Page Management", bn: "পেজ ম্যানেজমেন্ট" }),
    sections: t({ en: "Section Management", bn: "সেকশন ম্যানেজমেন্ট" }),
    forms: t({ en: "Form Builder", bn: "ফর্ম বিল্ডার" }),
    submissions: t({ en: "Form Submissions", bn: "ফর্ম সাবমিশন" }),
    menus: t({ en: "Navigation & Footer", bn: "নেভিগেশন ও ফুটার" }),
    categories: t({ en: "Categories", bn: "ক্যাটাগরি" }),
    content: t({ en: "General Settings", bn: "সাধারণ সেটিংস" }),
    products: t({ en: "Product Management", bn: "প্রোডাক্ট ম্যানেজমেন্ট" }),
    services: t({ en: "Service Management", bn: "সার্ভিস ম্যানেজমেন্ট" }),
    orders: t(PT.orders),
    subscriptions: t({ en: "Subscription Management", bn: "সাবস্ক্রিপশন ম্যানেজমেন্ট" }),
    coupons: t(PT.coupons),
    invoices: t({ en: "Invoice Manager", bn: "ইনভয়েস ম্যানেজার" }),
    customers: t(PT.customers),
    payments: t(PT.payments),
    tickets: t(PT.support),
    callbacks: t({ en: "Callback Requests", bn: "কলব্যাক রিকুয়েস্ট" }),
    appointments: t(PT.appointments),
    appointmentservices: t(PT.appointmentServices),
    appointmentsettings: t(PT.appointmentIntegration),
    applications: t({ en: "Affiliate Applications", bn: "এফিলিয়েট আবেদন" }),
    affiliates: t({ en: "Affiliate Management", bn: "এফিলিয়েট ম্যানেজমেন্ট" }),
    commissions: t(PT.commissions),
    withdrawals: t(PT.withdrawals),
    reports: t({ en: "Reports", bn: "রিপোর্ট" }),
    ledger: t({ en: "Financial Ledger", bn: "ফাইন্যান্সিয়াল লেজার" }),
    users: t({ en: "User Management", bn: "ইউজার ম্যানেজমেন্ট" }),
    roles: t({ en: "Roles & Permissions", bn: "রোল ও পারমিশন" }),
    email: t({ en: "Email Templates", bn: "ইমেইল টেমপ্লেট" }),
    smtp: t({ en: "SMTP Settings", bn: "SMTP সেটিংস" }),
    emaillogs: t({ en: "Email Logs", bn: "ইমেইল লগ" }),
    telegram: t({ en: "Telegram Notifications", bn: "টেলিগ্রাম নোটিফিকেশন" }),
    telegramlogs: t({ en: "Telegram Logs", bn: "টেলিগ্রাম লগ" }),
    notifications: t(PT.notifications),
    settings: t(PT.settings),
    logs: t(PT.logs),
    backup: t({ en: "Backup & Maintenance", bn: "ব্যাকআপ ও রক্ষণাবেক্ষণ" }),
  };

  return (
    <AdminShell nav={nav} section={section} onSection={setSection} title={titles[section] || section}
      actions={section === "dashboard" ? (
        <Button to="/shop" variant="secondary" size="sm">
          <Icon name="globe" className="w-4 h-4" /> {t({ en: "View Website", bn: "ওয়েবসাইট দেখুন" })}
        </Button>
      ) : undefined}
    >
      {section === "dashboard" && <AdminDashboard go={setSection} />}
      {section === "pages" && <PagesView />}
      {section === "sections" && <SectionsView />}
      {section === "forms" && <FormsView />}
      {section === "submissions" && <SubmissionsView />}
      {section === "menus" && <MenusView />}
      {section === "categories" && <CategoriesView />}
      {section === "content" && <AdminContent />}
      {section === "products" && <AdminProducts />}
      {section === "services" && <AdminServices />}
      {section === "orders" && <AdminOrders />}
      {section === "subscriptions" && <AdminSubscriptions />}
      {section === "coupons" && <AdminCoupons />}
      {section === "invoices" && <InvoicesView />}
      {section === "customers" && <AdminCustomers />}
      {section === "payments" && <AdminPayments />}
      {section === "tickets" && <AdminTickets />}
      {section === "callbacks" && <CallbacksView />}
      {section === "appointments" && <AdminAppointmentsView />}
      {section === "appointmentservices" && <AdminAppointmentServicesView />}
      {section === "appointmentsettings" && <AdminAppointmentSettingsView />}
      {section === "applications" && <AdminApplications />}
      {section === "affiliates" && <AdminAffiliates />}
      {section === "commissions" && <AdminCommissions />}
      {section === "withdrawals" && <AdminWithdrawals />}
      {section === "reports" && <AdminReports />}
      {section === "ledger" && <AdminLedger />}
      {section === "users" && <UsersView />}
      {section === "roles" && <RolesView />}
      {section === "email" && <EmailTemplatesView />}
      {section === "smtp" && <SmtpView />}
      {section === "emaillogs" && <EmailLogsView />}
      {section === "telegram" && <TelegramView />}
      {section === "telegramlogs" && <TelegramLogsView />}
      {section === "notifications" && <AdminNotifications />}
      {section === "settings" && <AdminSettings />}
      {section === "logs" && <AdminLogs />}
      {section === "backup" && <AdminBackup />}
    </AdminShell>
  );
}

/* ─────────────────────── Dashboard ────────────────────────── */

function AdminDashboard({ go }: { go: (s: string) => void }) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [range, setRange] = useState(30);
  const since = Date.now() - range * 86400000;
  const users = all("users");
  const orders = all("orders");
  const paidOrders = orders.filter((o) => ["payment_confirmed", "ready", "completed", "processing", "in_progress", "quality_check"].includes(o.status));
  const todayKey = new Date().toISOString().slice(0, 10);
  const monthKey = todayKey.slice(0, 7);
  const totalSales = paidOrders.reduce((s, o) => s + o.total, 0);
  const todaySales = paidOrders.filter((o) => String(o.created_at).slice(0, 10) === todayKey).reduce((s, o) => s + o.total, 0);
  const monthSales = paidOrders.filter((o) => String(o.created_at).slice(0, 7) === monthKey).reduce((s, o) => s + o.total, 0);
  const comms = all("commissions");
  const newCustomers = users.filter((u) => new Date(u.created_at).getTime() > since).length;
  const recentApps = all("affiliate_applications").filter((a) => new Date(a.created_at).getTime() > since).length;

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400000);
    const key = d.toISOString().slice(0, 10);
    return { label: `${d.getDate()}`, value: paidOrders.filter((o) => String(o.created_at).slice(0, 10) === key).reduce((s, o) => s + o.total, 0) };
  });
  const orderDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400000);
    const key = d.toISOString().slice(0, 10);
    return { label: `${d.getDate()}`, value: orders.filter((o) => String(o.created_at).slice(0, 10) === key).length };
  });
  const commDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400000);
    const key = d.toISOString().slice(0, 10);
    return { label: `${d.getDate()}`, value: comms.filter((c) => String(c.created_at).slice(0, 10) === key).reduce((s, c) => s + c.amount, 0) };
  });

  return (
    <div className="space-y-6">
      {/* Quick actions (permission-aware) */}
      <div className="flex flex-wrap gap-2">
        {[
          { k: "products", l: t({ en: "+ New Product", bn: "+ নতুন প্রোডাক্ট" }), m: "products" },
          { k: "services", l: t({ en: "+ New Service", bn: "+ নতুন সার্ভিস" }), m: "services" },
          { k: "invoices", l: t({ en: "+ New Invoice", bn: "+ নতুন ইনভয়েস" }), m: "invoices" },
          { k: "users", l: t({ en: "+ New User", bn: "+ নতুন ইউজার" }), m: "users" },
          { k: "applications", l: t({ en: "+ New Affiliate", bn: "+ নতুন এফিলিয়েট" }), m: "applications" },
          { k: "pages", l: t({ en: "+ New Page", bn: "+ নতুন পেজ" }), m: "pages" },
          { k: "forms", l: t({ en: "+ New Form", bn: "+ নতুন ফর্ম" }), m: "forms" },
          { k: "coupons", l: t({ en: "+ New Coupon", bn: "+ নতুন কুপন" }), m: "coupons" },
        ].filter((q) => can(user, q.m as any)).map((q) => (
          <button key={q.k} onClick={() => go(q.k)} className="rounded-full bg-white border border-brand-200 text-brand-700 px-4 py-2 text-xs font-bold hover:bg-brand-50 hover:border-brand-400 transition-all shadow-sm">
            {q.l}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-500">{t({ en: "Business Overview", bn: "ব্যবসার সারসংক্ষেপ" })}</p>
        <TimeRange value={range} onChange={setRange} />
      </div>

      {/* Revenue */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-brand-800 to-brand-600 p-5 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-grid" aria-hidden="true" />
          <p className="relative text-xs font-bold uppercase tracking-wider text-brand-100">{t({ en: "Total Revenue", bn: "মোট আয়" })}</p>
          <p className="relative mt-1.5 font-display font-bold text-3xl">{money(totalSales, lang)}</p>
        </div>
        <div className="rounded-2xl bg-white border border-ink-100 p-5 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-400">{t({ en: "Today's Revenue", bn: "আজকের আয়" })}</p>
          <p className="mt-1.5 font-display font-bold text-3xl text-ink-900">{money(todaySales, lang)}</p>
        </div>
        <div className="rounded-2xl bg-white border border-ink-100 p-5 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-400">{t({ en: "Monthly Revenue", bn: "মাসিক আয়" })}</p>
          <p className="mt-1.5 font-display font-bold text-3xl text-ink-900">{money(monthSales, lang)}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { icon: "folder", l: t(PT.orders), v: orders.length },
          { icon: "bell", l: t(PT.adminPendingOrders), v: orders.filter((o) => o.status === "pending_payment").length },
          { icon: "check", l: t(PT.completedOrders), v: orders.filter((o) => o.status === "completed" || o.status === "ready").length },
          { icon: "users", l: t(PT.totalUsers), v: users.filter((u) => u.role === "client").length },
          { icon: "users", l: t({ en: "New Customers", bn: "নতুন গ্রাহক" }), v: newCustomers },
          { icon: "network", l: t(PT.totalAffiliates), v: users.filter((u) => u.role === "affiliate").length + all("affiliate_profiles").filter((p) => p.status === "active").length },
          { icon: "briefcase", l: t({ en: "New Applications", bn: "নতুন আবেদন" }), v: recentApps },
          { icon: "shield", l: t(PT.pendingKyc), v: all("affiliate_kyc").filter((k) => k.status === "submitted").length },
          { icon: "card", l: t(PT.pendingPayments), v: all("payments").filter((p) => p.status === "pending_verification").length },
          { icon: "trending", l: t(PT.totalCommission), v: money(comms.reduce((s, c) => s + c.amount, 0), lang) },
          { icon: "wallet", l: t(PT.pendingWithdrawals), v: all("withdrawals").filter((w) => w.status === "pending").length },
          { icon: "wallet", l: t({ en: "Wallet Deposits", bn: "ওয়ালেট ডিপোজিট" }), v: money(all("payments").filter((p) => p.type === "deposit" && p.status === "verified").reduce((s, p) => s + p.amount, 0), lang) },
        ].map((c) => (
          <div key={c.l} className="rounded-2xl bg-white border border-ink-100 p-5 shadow-soft flex items-center gap-4">
            <span className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <Icon name={c.icon as never} className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink-400 truncate">{c.l}</p>
              <p className="font-display font-bold text-xl text-ink-900">{c.v}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="rounded-2xl bg-white border border-ink-100 p-5 shadow-soft">
          <h3 className="font-display font-bold text-base text-ink-900 mb-4">{t(PT.revenue)}</h3>
          <Bars data={days} />
        </div>
        <div className="rounded-2xl bg-white border border-ink-100 p-5 shadow-soft">
          <h3 className="font-display font-bold text-base text-ink-900 mb-4">{t(PT.ordersChart)}</h3>
          <Bars data={orderDays} color="from-ink-700 to-ink-500" />
        </div>
        <div className="rounded-2xl bg-white border border-ink-100 p-5 shadow-soft">
          <h3 className="font-display font-bold text-base text-ink-900 mb-4">{t(PT.commissions)}</h3>
          <Bars data={commDays} color="from-emerald-600 to-emerald-400" />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── Content ──────────────────────────── */

function AdminContent() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const settings = getSettings();
  const [form, setForm] = useState<any>({
    phone1: settings.general?.phone1 || "", phone2: settings.general?.phone2 || "", email: settings.general?.email || "",
    noticeEnabled: settings.notice?.enabled || false, noticeEn: settings.notice?.en || "", noticeBn: settings.notice?.bn || "",
    seoTitleEn: settings.seo?.titleEn || "", seoTitleBn: settings.seo?.titleBn || "",
    seoDescEn: settings.seo?.descEn || "", seoDescBn: settings.seo?.descBn || "",
  });
  return (
    <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-7">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label={t({ en: "Phone 1", bn: "ফোন ১" })}><input className={inputCls} value={form.phone1} onChange={(e) => setForm((f: any) => ({ ...f, phone1: e.target.value }))} /></Field>
        <Field label={t({ en: "Phone 2", bn: "ফোন ২" })}><input className={inputCls} value={form.phone2} onChange={(e) => setForm((f: any) => ({ ...f, phone2: e.target.value }))} /></Field>
        <div className="sm:col-span-2"><Field label={t(PT.email)}><input className={inputCls} value={form.email} onChange={(e) => setForm((f: any) => ({ ...f, email: e.target.value }))} /></Field></div>
        <div className="sm:col-span-2 border-t border-ink-100 pt-4">
          <p className="text-sm font-bold text-ink-800 mb-3">{t({ en: "Site Notice Banner (Homepage)", bn: "সাইট নোটিশ ব্যানার (হোমপেজ)" })}</p>
          <label className="flex items-center gap-2 text-sm font-semibold text-ink-700 mb-3">
            <input type="checkbox" className="w-4 h-4 accent-brand-600" checked={form.noticeEnabled} onChange={(e) => setForm((f: any) => ({ ...f, noticeEnabled: e.target.checked }))} />
            {t(PT.enabled)}
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label={t(PT.english)}><textarea rows={2} className={cn(inputCls, "resize-none")} value={form.noticeEn} onChange={(e) => setForm((f: any) => ({ ...f, noticeEn: e.target.value }))} /></Field>
            <Field label={t(PT.bangla)}><textarea rows={2} className={cn(inputCls, "resize-none")} value={form.noticeBn} onChange={(e) => setForm((f: any) => ({ ...f, noticeBn: e.target.value }))} /></Field>
          </div>
        </div>
        <div className="sm:col-span-2 border-t border-ink-100 pt-4">
          <p className="text-sm font-bold text-ink-800 mb-3">{t({ en: "SEO Settings", bn: "SEO সেটিংস" })}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label={`${t(PT.english)} · Title`}><input className={inputCls} value={form.seoTitleEn} onChange={(e) => setForm((f: any) => ({ ...f, seoTitleEn: e.target.value }))} /></Field>
            <Field label={`${t(PT.bangla)} · Title`}><input className={inputCls} value={form.seoTitleBn} onChange={(e) => setForm((f: any) => ({ ...f, seoTitleBn: e.target.value }))} /></Field>
            <Field label={`${t(PT.english)} · Description`}><textarea rows={2} className={cn(inputCls, "resize-none")} value={form.seoDescEn} onChange={(e) => setForm((f: any) => ({ ...f, seoDescEn: e.target.value }))} /></Field>
            <Field label={`${t(PT.bangla)} · Description`}><textarea rows={2} className={cn(inputCls, "resize-none")} value={form.seoDescBn} onChange={(e) => setForm((f: any) => ({ ...f, seoDescBn: e.target.value }))} /></Field>
          </div>
        </div>
      </div>
      <Button className="mt-5" onClick={() => {
        setSetting("general", { ...settings.general, phone1: form.phone1, phone2: form.phone2, email: form.email });
        setSetting("notice", { enabled: form.noticeEnabled, en: form.noticeEn, bn: form.noticeBn });
        setSetting("seo", { titleEn: form.seoTitleEn, titleBn: form.seoTitleBn, descEn: form.seoDescEn, descBn: form.seoDescBn });
        logAction(user!.email, "content_update", "content");
        toast({ type: "success", title: t({ en: "Content saved", bn: "কনটেন্ট সংরক্ষণ হয়েছে" }) });
      }}>{t(PT.save)}</Button>
    </div>
  );
}

/* ─────────────────────── Products ─────────────────────────── */

function AdminProducts() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { toast, } = useToast();
  const { confirm } = useConfirm();
  const [editing, setEditing] = useState<any | null>(null);
  const products = all("products");

  if (editing) {
    const setF = (patch: any) => setEditing({ ...editing, ...patch });
    return (
      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-7">
        <button onClick={() => setEditing(null)} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 mb-4">
          <Icon name="arrow" className="w-4 h-4 rotate-180" /> {t(PT.products)}
        </button>
        <h3 className="font-display font-bold text-xl text-ink-900 mb-5">
          {editing.id === "new" ? t({ en: "Add Product", bn: "প্রোডাক্ট যোগ করুন" }) : `${t(PT.edit)} — ${editing.name?.en}`}
        </h3>

        {/* Basic */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={`${t(PT.english)} · ${t({ en: "Product Name", bn: "প্রোডাক্টের নাম" })}`}><input className={inputCls} value={editing.name?.en || ""} onChange={(e) => setF({ name: { ...editing.name, en: e.target.value } })} /></Field>
          <Field label={`${t(PT.bangla)} · ${t({ en: "Product Name", bn: "প্রোডাক্টের নাম" })}`}><input className={inputCls} value={editing.name?.bn || ""} onChange={(e) => setF({ name: { ...editing.name, bn: e.target.value } })} /></Field>
          <Field label={t({ en: "Slug", bn: "স্লাগ" })}><input className={inputCls} value={editing.slug || editing.id || ""} onChange={(e) => setF({ slug: e.target.value })} /></Field>
          <Field label={t({ en: "Category", bn: "ক্যাটাগরি" })}>
            <select className={cn(inputCls, "appearance-none")} value={editing.category || "digital"} onChange={(e) => setF({ category: e.target.value })}>
              {["digital", "software", "education", "hosting"].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label={`${t(PT.english)} · ${t({ en: "Description", bn: "বিবরণ" })}`}>
              <textarea rows={2} className={cn(inputCls, "resize-none")} value={editing.description?.en || ""} onChange={(e) => setF({ description: { ...editing.description, en: e.target.value } })} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label={`${t(PT.bangla)} · ${t({ en: "Description", bn: "বিবরণ" })}`}>
              <textarea rows={2} className={cn(inputCls, "resize-none")} value={editing.description?.bn || ""} onChange={(e) => setF({ description: { ...editing.description, bn: e.target.value } })} />
            </Field>
          </div>
          <Field label={t({ en: "Demo URL", bn: "ডেমো URL" })}><input className={inputCls} value={editing.demo_url || ""} onChange={(e) => setF({ demo_url: e.target.value })} /></Field>
          <Field label={t({ en: "Status", bn: "স্ট্যাটাস" })}>
            <select className={cn(inputCls, "appearance-none")} value={editing.status || "published"} onChange={(e) => setF({ status: e.target.value })}>
              <option value="published">{t({ en: "Published", bn: "প্রকাশিত" })}</option><option value="draft">{t({ en: "Draft", bn: "ড্রাফট" })}</option>
            </select>
          </Field>
        </div>

        {/* Pricing builder */}
        <div className="mt-6 border-t border-ink-100 pt-5">
          <h4 className="font-display font-bold text-base text-ink-900 mb-3">{t({ en: "Pricing", bn: "মূল্য" })}</h4>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label={t({ en: "Product Type", bn: "প্রোডাক্টের ধরন" })}>
              <select className={cn(inputCls, "appearance-none")} value={editing.kind || "one_time"} onChange={(e) => setF({ kind: e.target.value })}>
                <option value="one_time">{t({ en: "One Time", bn: "একবার" })}</option>
                <option value="subscription">{t({ en: "Subscription", bn: "সাবস্ক্রিপশন" })}</option>
                <option value="lifetime">{t({ en: "Lifetime", bn: "লাইফটাইম" })}</option>
              </select>
            </Field>
            <Field label={t(PT.amount)}><input type="number" className={inputCls} value={editing.price || 0} onChange={(e) => setF({ price: Number(e.target.value) })} /></Field>
            <Field label={t(PT.discount)}><input type="number" className={inputCls} value={editing.discount || 0} onChange={(e) => setF({ discount: Number(e.target.value) })} /></Field>
            {editing.kind === "subscription" && (
              <>
                <Field label={t({ en: "Renewal Price", bn: "নবায়ন মূল্য" })}>
                  <input type="number" className={inputCls} value={editing.subscription?.renewalPrice || 0} onChange={(e) => setF({ subscription: { ...editing.subscription, renewalPrice: Number(e.target.value) } })} />
                </Field>
                <Field label={t({ en: "Billing Cycle", bn: "বিলিং সাইকেল" })}>
                  <select className={cn(inputCls, "appearance-none")} value={editing.subscription?.period || "year"} onChange={(e) => setF({ subscription: { ...editing.subscription, period: e.target.value } })}>
                    <option value="month">{t({ en: "Monthly", bn: "মাসিক" })}</option><option value="quarter">{t({ en: "Quarterly", bn: "ত্রৈমাসিক" })}</option><option value="half">{t({ en: "Half-Yearly", bn: "অর্ধবার্ষিক" })}</option><option value="year">{t({ en: "Yearly", bn: "বার্ষিক" })}</option>
                  </select>
                </Field>
              </>
            )}
          </div>
        </div>

        {/* Commission builder */}
        <div className="mt-6 border-t border-ink-100 pt-5">
          <h4 className="font-display font-bold text-base text-ink-900 mb-3">{t({ en: "Affiliate Commission", bn: "এফিলিয়েট কমিশন" })}</h4>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-ink-700">
                <input type="checkbox" className="w-4 h-4 accent-brand-600" checked={!!editing.commission?.enabled} onChange={(e) => setF({ commission: { ...editing.commission, enabled: e.target.checked } })} />
                {t({ en: "Enable commission", bn: "কমিশন সক্রিয়" })}
              </label>
            </div>
            <Field label={t({ en: "Commission Type", bn: "কমিশনের ধরন" })}>
              <select className={cn(inputCls, "appearance-none")} value={editing.commission?.type || "percent"} onChange={(e) => setF({ commission: { ...editing.commission, type: e.target.value } })}>
                <option value="percent">{t(PT.percent)}</option><option value="fixed">{t(PT.fixed)}</option>
              </select>
            </Field>
            <Field label={t({ en: "Initial Commission", bn: "প্রথম কমিশন" })}>
              <input type="number" className={inputCls} value={editing.commission?.initial || 0} onChange={(e) => setF({ commission: { ...editing.commission, initial: Number(e.target.value) } })} />
            </Field>
            <Field label={t({ en: "Renewal Commission", bn: "নবায়ন কমিশন" })}>
              <input type="number" className={inputCls} value={editing.commission?.renewal || 0} onChange={(e) => setF({ commission: { ...editing.commission, renewal: Number(e.target.value) } })} />
            </Field>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-ink-700">
                <input type="checkbox" className="w-4 h-4 accent-brand-600" checked={!!editing.commission?.renewalEnabled} onChange={(e) => setF({ commission: { ...editing.commission, renewalEnabled: e.target.checked } })} />
                {t({ en: "Renewal commission enabled", bn: "নবায়ন কমিশন সক্রিয়" })}
              </label>
            </div>
          </div>
        </div>

        <Button className="mt-6" onClick={() => {
          if (editing.id === "new") {
            insert("products", { ...editing, id: undefined, digital: true, created_at: nowISO() });
            logAction(user!.email, "product_create", editing.name?.en || "new");
          } else {
            update("products", editing.id, editing);
            logAction(user!.email, "product_update", editing.name?.en || editing.id);
          }
          setEditing(null);
          toast({ type: "success", title: t({ en: "Product saved", bn: "প্রোডাক্ট সংরক্ষণ হয়েছে" }) });
        }}>{t(PT.save)}</Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg text-ink-900">{t(PT.products)} ({products.length})</h3>
        <Button size="sm" onClick={() => setEditing({ id: "new", name: { en: "", bn: "" }, description: { en: "", bn: "" }, kind: "one_time", price: 0, discount: 0, digital: true, commission: { enabled: true, type: "percent", initial: 10, renewal: 0, renewalEnabled: false }, status: "published" })}>
          {t(PT.addNew)}
        </Button>
      </div>
      <DataTable
        rows={products}
        searchKeys={["name"]}
        filename="products.csv"
        emptyTitle={t({ en: "No products yet.", bn: "এখনও কোনো প্রোডাক্ট নেই।" })}
        columns={[
          { key: "name", label: t(PT.products), render: (p) => <span className="font-bold text-ink-900">{p.name?.en}</span> },
          { key: "kind", label: t({ en: "Type", bn: "ধরন" }), render: (p) => <span className="text-ink-500">{p.kind}</span> },
          { key: "price", label: t(PT.amount), render: (p) => <span className="font-semibold text-ink-800">{money(p.price, lang)}</span> },
          { key: "commission", label: t(PT.commission), render: (p) => <span className="text-ink-500">{p.commission?.enabled ? `${p.commission.initial}${p.commission.type === "fixed" ? "" : "%"}` : "—"}</span> },
          { key: "status", label: t(PT.status), render: (p) => <StatusBadge status={p.status === "published" ? "active" : "cancelled"} /> },
          { key: "action", label: "", render: (p) => (
            <div className="flex gap-2">
              <button onClick={() => setEditing({ ...p })} className="text-brand-600 font-bold text-xs hover:text-brand-700">{t(PT.edit)}</button>
              <button onClick={async () => {
                const ok = await confirm({ title: t({ en: `Delete ${p.name?.en}?`, bn: `${p.name?.bn} মুছবেন?` }), desc: t({ en: "This product will be permanently removed.", bn: "এই প্রোডাক্টটি স্থায়ীভাবে মুছে যাবে।" }), danger: true });
                if (!ok) return;
                remove("products", p.id);
                logAction(user!.email, "product_delete", p.name?.en || p.id);
                toast({ type: "success", title: t({ en: "Product deleted", bn: "প্রোডাক্ট মুছে ফেলা হয়েছে" }) });
              }} className="text-red-500 font-bold text-xs hover:text-red-600">{t(PT.delete)}</button>
            </div>
          ) },
        ]}
      />
    </div>
  );
}

/* ─────────────────────── Services ─────────────────────────── */

function AdminServices() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState<any | null>(null);
  const services = all("services");

  if (editing) {
    const setF = (patch: any) => setEditing({ ...editing, ...patch });
    return (
      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-7">
        <button onClick={() => setEditing(null)} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 mb-4">
          <Icon name="arrow" className="w-4 h-4 rotate-180" /> {t(PT.services)}
        </button>
        <h3 className="font-display font-bold text-xl text-ink-900 mb-5">{t(PT.edit)} — {editing.name?.en}</h3>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={t({ en: "Service Name (EN)", bn: "সার্ভিসের নাম (EN)" })}><input className={inputCls} value={editing.name?.en || ""} onChange={(e) => setF({ name: { ...editing.name, en: e.target.value } })} /></Field>
          <Field label={t({ en: "Service Name (BN)", bn: "সার্ভিসের নাম (BN)" })}><input className={inputCls} value={editing.name?.bn || ""} onChange={(e) => setF({ name: { ...editing.name, bn: e.target.value } })} /></Field>
          <div className="sm:col-span-2"><Field label={t({ en: "Description (EN)", bn: "বিবরণ (EN)" })}><textarea rows={2} className={cn(inputCls, "resize-none")} value={editing.description?.en || ""} onChange={(e) => setF({ description: { ...editing.description, en: e.target.value } })} /></Field></div>
          <div className="sm:col-span-2"><Field label={t({ en: "Description (BN)", bn: "বিবরণ (BN)" })}><textarea rows={2} className={cn(inputCls, "resize-none")} value={editing.description?.bn || ""} onChange={(e) => setF({ description: { ...editing.description, bn: e.target.value } })} /></Field></div>
          <Field label={t({ en: "Type", bn: "ধরন" })}>
            <select className={cn(inputCls, "appearance-none")} value={editing.kind || "one_time"} onChange={(e) => setF({ kind: e.target.value })}>
              <option value="one_time">{t({ en: "One Time", bn: "একবার" })}</option><option value="subscription">{t({ en: "Subscription", bn: "সাবস্ক্রিপশন" })}</option>
            </select>
          </Field>
          <Field label={t({ en: "First Payment (৳)", bn: "প্রথম পেমেন্ট (৳)" })}><input type="number" className={inputCls} value={editing.price || 0} onChange={(e) => setF({ price: Number(e.target.value) })} /></Field>
          {editing.kind === "subscription" && (
            <>
              <Field label={t({ en: "Renewal (৳ / year)", bn: "নবায়ন (৳ / বছর)" })}>
                <input type="number" className={inputCls} value={editing.subscription?.renewalPrice || 0} onChange={(e) => setF({ subscription: { ...editing.subscription, renewalPrice: Number(e.target.value) } })} />
              </Field>
              <Field label={t({ en: "Billing Cycle", bn: "বিলিং সাইকেল" })}>
                <select className={cn(inputCls, "appearance-none")} value={editing.subscription?.period || "year"} onChange={(e) => setF({ subscription: { ...editing.subscription, period: e.target.value } })}>
                  <option value="month">{t({ en: "Monthly", bn: "মাসিক" })}</option><option value="year">{t({ en: "Yearly", bn: "বার্ষিক" })}</option>
                </select>
              </Field>
            </>
          )}
          <Field label={t({ en: "Initial Commission %", bn: "প্রথম কমিশন %" })}><input type="number" className={inputCls} value={editing.commission?.initial || 0} onChange={(e) => setF({ commission: { ...editing.commission, initial: Number(e.target.value) } })} /></Field>
          <Field label={t({ en: "Renewal Commission %", bn: "নবায়ন কমিশন %" })}><input type="number" className={inputCls} value={editing.commission?.renewal || 0} onChange={(e) => setF({ commission: { ...editing.commission, renewal: Number(e.target.value) } })} /></Field>
          <div className="flex items-end pb-1 gap-5">
            <label className="flex items-center gap-2 text-sm font-semibold text-ink-700">
              <input type="checkbox" className="w-4 h-4 accent-brand-600" checked={!!editing.commission?.enabled} onChange={(e) => setF({ commission: { ...editing.commission, enabled: e.target.checked } })} />
              {t({ en: "Commission enabled", bn: "কমিশন সক্রিয়" })}
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-ink-700">
              <input type="checkbox" className="w-4 h-4 accent-brand-600" checked={!!editing.commission?.renewalEnabled} onChange={(e) => setF({ commission: { ...editing.commission, renewalEnabled: e.target.checked } })} />
              {t({ en: "Renewal commission", bn: "নবায়ন কমিশন" })}
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-ink-700">
              <input type="checkbox" className="w-4 h-4 accent-brand-600" checked={!!editing.featured} onChange={(e) => setF({ featured: e.target.checked })} />
              {t({ en: "Featured", bn: "ফিচারড" })}
            </label>
          </div>
          <Field label={t({ en: "Status", bn: "স্ট্যাটাস" })}>
            <select className={cn(inputCls, "appearance-none")} value={editing.status || "published"} onChange={(e) => setF({ status: e.target.value })}>
              <option value="published">{t({ en: "Published", bn: "প্রকাশিত" })}</option><option value="draft">{t({ en: "Draft", bn: "ড্রাফট" })}</option>
            </select>
          </Field>
        </div>

        {/* Order fields */}
        <div className="mt-6 border-t border-ink-100 pt-5">
          <h4 className="font-display font-bold text-base text-ink-900 mb-3">{t({ en: "Order Requirement Fields", bn: "অর্ডার ফিল্ড" })}</h4>
          <div className="space-y-2">
            {(editing.order_fields || []).map((f: any, i: number) => (
              <div key={i} className="flex flex-wrap items-center gap-3 rounded-xl bg-ink-50 px-3 py-2.5 text-sm">
                <input className={cn(inputCls, "!w-40 !py-1.5")} value={f.label?.en || ""} placeholder="Label EN" onChange={(e) => setF({ order_fields: editing.order_fields.map((x: any, j: number) => j === i ? { ...x, label: { ...x.label, en: e.target.value } } : x) })} />
                <input className={cn(inputCls, "!w-40 !py-1.5")} value={f.label?.bn || ""} placeholder="Label BN" onChange={(e) => setF({ order_fields: editing.order_fields.map((x: any, j: number) => j === i ? { ...x, label: { ...x.label, bn: e.target.value } } : x) })} />
                <select className={cn(inputCls, "!w-28 !py-1.5 appearance-none")} value={f.type || "text"} onChange={(e) => setF({ order_fields: editing.order_fields.map((x: any, j: number) => j === i ? { ...x, type: e.target.value } : x) })}>
                  {["text", "textarea", "select", "number", "date"].map((tp) => <option key={tp} value={tp}>{tp}</option>)}
                </select>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-600">
                  <input type="checkbox" className="w-3.5 h-3.5 accent-brand-600" checked={!!f.required} onChange={(e) => setF({ order_fields: editing.order_fields.map((x: any, j: number) => j === i ? { ...x, required: e.target.checked } : x) })} />
                  {t({ en: "Required", bn: "আবশ্যক" })}
                </label>
                <button className="ml-auto text-red-500 text-xs font-bold hover:underline" onClick={() => setF({ order_fields: editing.order_fields.filter((_: any, j: number) => j !== i) })}>
                  {t(PT.delete)}
                </button>
              </div>
            ))}
            <Button size="sm" variant="secondary" onClick={() => setF({ order_fields: [...(editing.order_fields || []), { key: `f_${Date.now().toString(36)}`, label: { en: "New Field", bn: "নতুন ফিল্ড" }, type: "text", required: false }] })}>
              + {t(PT.addNew)}
            </Button>
          </div>
        </div>

        <Button className="mt-6" onClick={() => { update("services", editing.id, editing); logAction(user!.email, "service_update", editing.name?.en); setEditing(null); toast({ type: "success", title: t({ en: "Service saved", bn: "সার্ভিস সংরক্ষণ হয়েছে" }) }); }}>
          {t(PT.save)}
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-6">
      <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t(PT.services)} ({services.length})</h3>
      <DataTable
        rows={services}
        searchKeys={["name"]}
        filename="services.csv"
        emptyTitle={t({ en: "No services yet.", bn: "এখনও কোনো সার্ভিস নেই।" })}
        columns={[
          { key: "name", label: t(PT.services), render: (s) => <span className="font-bold text-ink-900">{s.name?.en}</span> },
          { key: "kind", label: t({ en: "Type", bn: "ধরন" }), render: (s) => <span className="text-ink-500">{s.kind}</span> },
          { key: "price", label: t({ en: "From", bn: "শুরু থেকে" }), render: (s) => <span className="font-semibold text-ink-800">{money(s.price, lang)}</span> },
          { key: "commission", label: t(PT.commission), render: (s) => <span className="text-ink-500">{s.commission?.enabled ? `${s.commission.initial}%${s.commission.renewalEnabled ? ` + ${s.commission.renewal}% rnw` : ""}` : "—"}</span> },
          { key: "fields", label: t({ en: "Fields", bn: "ফিল্ড" }), render: (s) => <span className="text-ink-500">{s.order_fields?.length || 0}</span> },
          { key: "status", label: t(PT.status), render: (s) => <StatusBadge status={s.status === "published" ? "active" : "cancelled"} /> },
          { key: "action", label: "", render: (s) => <button onClick={() => setEditing({ ...s })} className="text-brand-600 font-bold text-xs hover:text-brand-700">{t(PT.edit)}</button> },
        ]}
      />
    </div>
  );
}

/* ─────────────────────── Orders ───────────────────────────── */

function AdminOrders() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selected, setSelected] = useState<any | null>(null);
  const orders = all("orders").sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

  if (selected) {
    const events = all("order_events").filter((e) => e.order_id === selected.id);
    const statuses = ["pending_payment", "payment_confirmed", "processing", "in_progress", "quality_check", "ready", "completed"];
    const idx = statuses.indexOf(selected.status);
    const next = idx >= 0 ? statuses[idx + 1] : undefined;
    return (
      <div className="space-y-4">
        <button onClick={() => setSelected(null)} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600">
          <Icon name="arrow" className="w-4 h-4 rotate-180" /> {t(PT.orders)}
        </button>
        <div className="rounded-2xl bg-white border border-ink-100 p-6 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 pb-4">
            <div>
              <h3 className="font-display font-bold text-xl">#{selected.no}</h3>
              <p className="text-sm text-ink-400">{selected.user_name} · {selected.user_email} · {fmtDateTime(selected.created_at, lang)}</p>
              <p className="text-xs text-ink-400 mt-0.5">
                {selected.ref_code ? `@${selected.ref_code}` : t({ en: "No affiliate", bn: "এফিলিয়েট নেই" })} · {selected.payment_method} · {selected.payment_status}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-display font-bold text-xl text-brand-700">{money(selected.total, lang)}</span>
              <StatusBadge status={selected.status} />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {selected.items.map((it: any, i: number) => (
              <div key={i} className="rounded-xl bg-ink-50 px-4 py-2.5 text-sm flex justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{typeof it.name === "string" ? it.name : it.name?.en}</p>
                  {it.fields && <p className="text-xs text-ink-400 mt-0.5 line-clamp-1">{Object.entries(it.fields).filter(([, v]) => v).map(([, v]) => String(v)).join(" · ")}</p>}
                </div>
                <span className="font-semibold shrink-0">{money(it.price * it.qty, lang)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {next && (
              <Button size="sm" onClick={() => {
                update("orders", selected.id, { status: next });
                insert("order_events", { order_id: selected.id, status: next, note: "", by: user!.name, at: nowISO() });
                notify(selected.user_id, "order", { en: "Order status updated", bn: "অর্ডার স্ট্যাটাস আপডেট হয়েছে" }, { en: `Order #${selected.no} → ${next}`, bn: `অর্ডার #${selected.no} → ${next}` });
                logAction(user!.email, "order_status", `${selected.no} → ${next}`);
                toast({ type: "success", title: t({ en: "Status updated", bn: "স্ট্যাটাস আপডেট হয়েছে" }) });
              }}>
                {t(PT.changeStatus)}: {next.replace(/_/g, " ")}
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={async () => {
              const ok = await confirmDialogS();
              if (!ok) return;
              update("orders", selected.id, { status: "cancelled" });
              insert("order_events", { order_id: selected.id, status: "cancelled", note: "Cancelled by admin", by: user!.name, at: nowISO() });
              all("commissions").filter((c) => c.order_id === selected.id && c.status !== "reversed").forEach((c) => setCommissionStatus(c.id, "reversed"));
              logAction(user!.email, "order_cancel", selected.no);
              toast({ type: "info", title: t({ en: "Order cancelled", bn: "অর্ডার বাতিল হয়েছে" }) });
            }}>{t(PT.cancel)}</Button>
            <Button size="sm" variant="secondary" onClick={async () => {
              const ok = await confirmDialogS();
              if (!ok) return;
              update("orders", selected.id, { status: "refunded" });
              insert("order_events", { order_id: selected.id, status: "refunded", note: "Refunded by admin", by: user!.name, at: nowISO() });
              if (["payment_confirmed", "ready", "completed"].includes(selected.status)) {
                walletCredit(selected.user_id, selected.total, `Refund order ${selected.no}`, selected.no);
                recordLedger("refund", selected.user_id, selected.total, `Refund ${selected.no}`, selected.no);
              }
              all("commissions").filter((c) => c.order_id === selected.id && c.status !== "reversed").forEach((c) => setCommissionStatus(c.id, "reversed"));
              logAction(user!.email, "order_refund", selected.no);
              toast({ type: "success", title: t({ en: "Order refunded", bn: "অর্ডার রিফান্ড হয়েছে" }) });
            }}>{t({ en: "Refund", bn: "রিফান্ড" })}</Button>
          </div>
          <div className="mt-5">
            <h4 className="font-display font-bold text-sm text-ink-900 mb-2">{t(PT.orderTimeline)}</h4>
            <div className="space-y-2">
              {events.map((e, i) => (
                <div key={i} className="text-sm flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center shrink-0"><Icon name="check" className="w-3 h-3" strokeWidth={3} /></span>
                  <span className="text-ink-600"><StatusBadge status={e.status} /> · {fmtDateTime(e.at, lang)} · {e.by}{e.note ? ` — ${e.note}` : ""}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5">
      <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t(PT.orders)} ({orders.length})</h3>
      <DataTable
        rows={orders}
        searchKeys={["no", "user_name", "user_email"]}
        filename="orders.csv"
        emptyTitle={t({ en: "No orders.", bn: "কোনো অর্ডার নেই।" })}
        onRowClick={setSelected}
        columns={[
          { key: "no", label: t({ en: "Order", bn: "অর্ডার" }), render: (o) => <span className="font-bold text-ink-900">#{o.no}</span> },
          { key: "user_name", label: t({ en: "Customer", bn: "গ্রাহক" }), render: (o) => <span className="text-ink-600">{o.user_name}</span> },
          { key: "created_at", label: t(PT.date), render: (o) => <span className="text-ink-500">{fmtDateTime(o.created_at, lang)}</span> },
          { key: "total", label: t({ en: "Amount", bn: "পরিমাণ" }), render: (o) => <span className="font-bold text-ink-800">{money(o.total, lang)}</span> },
          { key: "payment_method", label: t({ en: "Payment", bn: "পেমেন্ট" }), render: (o) => <span className="text-ink-500">{o.payment_method}</span> },
          { key: "ref_code", label: t({ en: "Affiliate", bn: "এফিলিয়েট" }), render: (o) => <span className="text-ink-500">{o.ref_code ? `@${o.ref_code}` : "—"}</span> },
          { key: "status", label: t(PT.status), render: (o) => <StatusBadge status={o.status} /> },
        ]}
      />
    </div>
  );
}

function confirmDialogS(): Promise<boolean> {
  // Thin wrapper — replaced by hook where hooks are available
  return Promise.resolve(window.confirm("Confirm this action?"));
}

/* ─────────────────────── Subscriptions ────────────────────── */

function AdminSubscriptions() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const subs = all("subscriptions").sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return (
    <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5">
      <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t({ en: "Subscription Management", bn: "সাবস্ক্রিপশন ম্যানেজমেন্ট" })} ({subs.length})</h3>
      <DataTable
        rows={subs}
        searchKeys={["name"]}
        filename="subscriptions.csv"
        emptyTitle={t({ en: "No subscriptions.", bn: "কোনো সাবস্ক্রিপশন নেই।" })}
        columns={[
          { key: "name", label: t({ en: "Customer / Item", bn: "গ্রাহক / আইটেম" }), render: (s) => <div><p className="font-bold text-ink-900">{typeof s.name === "string" ? s.name : s.name?.en}</p><p className="text-xs text-ink-400">{get("users", s.user_id)?.name}</p></div> },
          { key: "start", label: t({ en: "Start", bn: "শুরু" }), render: (s) => <span className="text-ink-500">{fmtDate(s.start, lang)}</span> },
          { key: "next_renewal", label: t(PT.nextRenewal), render: (s) => <span className="text-ink-500">{fmtDate(s.next_renewal, lang)}</span> },
          { key: "renewal_price", label: t({ en: "Price", bn: "মূল্য" }), render: (s) => <span className="font-semibold text-ink-800">{money(s.renewal_price, lang)}</span> },
          { key: "status", label: t(PT.status), render: (s) => <StatusBadge status={s.status} /> },
          { key: "action", label: t({ en: "Action", bn: "অ্যাকশন" }), render: (s) => (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const days = s.period === "month" ? 30 : 365;
                  update("subscriptions", s.id, { status: "active", next_renewal: new Date(Date.now() + days * 86400000).toISOString() });
                  logAction(user!.email, "subscription_extend", s.id);
                  toast({ type: "success", title: t({ en: "Subscription extended", bn: "সাবস্ক্রিপশন বাড়ানো হয়েছে" }) });
                }}
                className="text-brand-600 font-bold text-xs hover:text-brand-700"
              >
                {t({ en: "Extend", bn: "বাড়ান" })}
              </button>
              {s.status !== "suspended" && s.status !== "cancelled" && (
                <button
                  onClick={() => { update("subscriptions", s.id, { status: "suspended" }); logAction(user!.email, "subscription_suspend", s.id); toast({ type: "info", title: t({ en: "Suspended", bn: "সাসপেন্ড হয়েছে" }) }); }}
                  className="text-amber-600 font-bold text-xs hover:text-amber-700"
                >
                  {t({ en: "Suspend", bn: "সাসপেন্ড" })}
                </button>
              )}
              {s.status !== "cancelled" && (
                <button
                  onClick={() => { update("subscriptions", s.id, { status: "cancelled" }); logAction(user!.email, "subscription_cancel", s.id); toast({ type: "info", title: t({ en: "Cancelled", bn: "বাতিল হয়েছে" }) }); }}
                  className="text-red-500 font-bold text-xs hover:text-red-600"
                >
                  {t(PT.cancel)}
                </button>
              )}
            </div>
          ) },
        ]}
      />
    </div>
  );
}

/* ─────────────────────── Coupons / Invoices ───────────────── */

function AdminCoupons() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState<any>({ code: "", type: "percent", value: 10, min_order: 0, max_uses: 100, expires: "", enabled: true });
  const coupons = all("coupons");
  return (
    <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5">
      <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t(PT.coupons)}</h3>
      <div className="mb-5 rounded-xl border border-brand-100 bg-brand-50/50 p-4 grid sm:grid-cols-3 gap-3">
        <Field label={t(PT.couponCode)}><input className={inputCls} value={form.code} onChange={(e) => setForm((f: any) => ({ ...f, code: e.target.value }))} /></Field>
        <Field label={t(PT.couponType)}>
          <select className={cn(inputCls, "appearance-none")} value={form.type} onChange={(e) => setForm((f: any) => ({ ...f, type: e.target.value }))}>
            <option value="percent">{t(PT.percent)}</option><option value="fixed">{t(PT.fixed)}</option>
          </select>
        </Field>
        <Field label={t({ en: "Value", bn: "মান" })}><input type="number" className={inputCls} value={form.value} onChange={(e) => setForm((f: any) => ({ ...f, value: Number(e.target.value) }))} /></Field>
        <Field label={t(PT.minOrder)}><input type="number" className={inputCls} value={form.min_order} onChange={(e) => setForm((f: any) => ({ ...f, min_order: Number(e.target.value) }))} /></Field>
        <Field label={t(PT.maxUses)}><input type="number" className={inputCls} value={form.max_uses} onChange={(e) => setForm((f: any) => ({ ...f, max_uses: Number(e.target.value) }))} /></Field>
        <Field label={t(PT.expiry)}><input type="date" className={inputCls} value={form.expires} onChange={(e) => setForm((f: any) => ({ ...f, expires: e.target.value }))} /></Field>
        <Button size="sm" className="col-span-3" onClick={() => {
          if (!form.code.trim()) return;
          insert("coupons", { code: form.code.trim().toUpperCase(), type: form.type, value: Number(form.value), min_order: Number(form.min_order), max_uses: Number(form.max_uses), used: 0, expires: form.expires || null, enabled: true });
          logAction(user!.email, "coupon_create", form.code);
          setForm({ code: "", type: "percent", value: 10, min_order: 0, max_uses: 100, expires: "", enabled: true });
          toast({ type: "success", title: t({ en: "Coupon created", bn: "কুপন তৈরি হয়েছে" }) });
        }}>{t(PT.createCoupon)}</Button>
      </div>
      <div className="space-y-2.5">
        {coupons.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-100 px-4 py-3 text-sm">
            <div>
              <p className="font-bold text-ink-900">{c.code}</p>
              <p className="text-xs text-ink-400">{c.type === "percent" ? `${c.value}%` : money(c.value, lang)} · {c.used}/{c.max_uses} {t({ en: "used", bn: "ব্যবহৃত" })}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={c.enabled ? "active" : "cancelled"} />
              <button onClick={() => { update("coupons", c.id, { enabled: !c.enabled }); logAction(user!.email, "coupon_toggle", c.code); }} className="text-brand-600 font-bold text-xs">{c.enabled ? t({ en: "Disable", bn: "নিষ্ক্রিয়" }) : t(PT.enabled)}</button>
              <button onClick={() => { remove("coupons", c.id); logAction(user!.email, "coupon_delete", c.code); toast({ type: "info", title: t({ en: "Coupon deleted", bn: "কুপন মুছে ফেলা হয়েছে" }) }); }} className="text-red-500 font-bold text-xs">{t(PT.delete)}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminInvoices() {
  const { t, lang } = useI18n();
  const invoices = all("invoices").sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return (
    <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5">
      <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t(PT.invoices)} ({invoices.length})</h3>
      <DataTable
        rows={invoices}
        searchKeys={["no", "order_no", "user_name"]}
        filename="invoices.csv"
        emptyTitle={t({ en: "No invoices yet.", bn: "এখনও কোনো ইনভয়েস নেই।" })}
        columns={[
          { key: "no", label: t({ en: "Invoice", bn: "ইনভয়েস" }), render: (i) => <span className="font-bold text-ink-900">{i.no}</span> },
          { key: "order_no", label: t({ en: "Order", bn: "অর্ডার" }), render: (i) => <span className="text-ink-600">#{i.order_no}</span> },
          { key: "user_name", label: t({ en: "Customer", bn: "গ্রাহক" }), render: (i) => <span className="text-ink-500">{i.user_name}</span> },
          { key: "created_at", label: t(PT.date), render: (i) => <span className="text-ink-500">{fmtDateTime(i.created_at, lang)}</span> },
          { key: "total", label: t({ en: "Total", bn: "মোট" }), render: (i) => <span className="font-bold text-ink-800">{money(i.total, lang)}</span> },
          { key: "status", label: t(PT.status), render: (i) => <StatusBadge status={i.status} /> },
        ]}
      />
    </div>
  );
}

/* ─────────────────────── Customers ────────────────────────── */

function AdminCustomers() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selected, setSelected] = useState<any | null>(null);
  const [adjust, setAdjust] = useState({ type: "credit", amount: 0, reason: "" });
  const customers = all("users").filter((u) => u.role === "client" || u.role === "affiliate");

  if (selected) {
    return (
      <div className="space-y-4">
        <button onClick={() => setSelected(null)} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600">
          <Icon name="arrow" className="w-4 h-4 rotate-180" /> {t(PT.customers)}
        </button>
        <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display font-bold text-xl text-ink-900">{selected.name}</h3>
              <p className="text-sm text-ink-400">{selected.email} · {selected.mobile} · {selected.role}</p>
            </div>
            <span className="font-display font-bold text-2xl text-brand-700">{money(walletBalance(selected.id), lang)}</span>
          </div>

          <div className="mt-5 rounded-xl border border-brand-100 bg-brand-50/50 p-4">
            <h4 className="font-display font-bold text-sm text-ink-900 mb-3">{t(PT.adjustWallet)}</h4>
            <div className="grid sm:grid-cols-4 gap-3">
              <Field label={t({ en: "Type", bn: "ধরন" })}>
                <select className={cn(inputCls, "appearance-none")} value={adjust.type} onChange={(e) => setAdjust((a) => ({ ...a, type: e.target.value }))}>
                  <option value="credit">{t(PT.credit)}</option><option value="debit">{t(PT.debit)}</option>
                </select>
              </Field>
              <Field label={t(PT.amount)}><input type="number" className={inputCls} value={adjust.amount} onChange={(e) => setAdjust((a) => ({ ...a, amount: Number(e.target.value) }))} /></Field>
              <Field label={t(PT.reason)}><input className={inputCls} value={adjust.reason} onChange={(e) => setAdjust((a) => ({ ...a, reason: e.target.value }))} /></Field>
              <div className="flex items-end pb-1">
                <Button size="sm" onClick={() => {
                  if (adjust.amount <= 0) { toast({ type: "warning", title: t({ en: "Enter an amount", bn: "পরিমাণ লিখুন" }) }); return; }
                  if (!adjust.reason.trim()) { toast({ type: "warning", title: t({ en: "A reason is required", bn: "কারণ আবশ্যক" }) }); return; }
                  if (adjust.type === "credit") {
                    walletCredit(selected.id, adjust.amount, adjust.reason || "Admin adjustment");
                    recordLedger("adjustment", selected.id, adjust.amount, adjust.reason, selected.email);
                  } else {
                    const ok = walletDebit(selected.id, adjust.amount, adjust.reason || "Admin adjustment");
                    if (!ok) { toast({ type: "error", title: t({ en: "Insufficient balance", bn: "পর্যাপ্ত ব্যালেন্স নেই" }) }); return; }
                    recordLedger("adjustment", selected.id, -adjust.amount, adjust.reason, selected.email);
                  }
                  notify(selected.id, "wallet", { en: "Wallet adjusted", bn: "ওয়ালেট অ্যাডজাস্ট হয়েছে" }, { en: `${adjust.type === "credit" ? "+" : "−"}৳${adjust.amount} — ${adjust.reason}`, bn: `${adjust.type === "credit" ? "+" : "−"}৳${adjust.amount} — ${adjust.reason}` });
                  logAction(user!.email, `wallet_${adjust.type}`, `${selected.email} ${adjust.amount}`);
                  setAdjust({ type: "credit", amount: 0, reason: "" });
                  toast({ type: "success", title: t({ en: "Wallet adjusted", bn: "ওয়ালেট অ্যাডজাস্ট হয়েছে" }) });
                }}>{t(PT.save)}</Button>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <h4 className="font-display font-bold text-sm text-ink-900 mb-3">{t(PT.transactions)}</h4>
            <div className="space-y-2">
              {all("wallet_txs").filter((w) => w.user_id === selected.id).slice(0, 15).map((w) => (
                <div key={w.id} className="flex items-center justify-between rounded-xl bg-ink-50 px-4 py-2.5 text-sm">
                  <div>
                    <p className="font-semibold text-ink-800">{w.reason}</p>
                    <p className="text-xs text-ink-400">{fmtDateTime(w.created_at, lang)}</p>
                  </div>
                  <span className={cn("font-bold", w.type === "credit" ? "text-emerald-600" : "text-red-500")}>{w.type === "credit" ? "+" : "−"}{money(w.amount, lang)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5">
      <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t(PT.customers)} ({customers.length})</h3>
      <DataTable
        rows={customers}
        searchKeys={["name", "email", "mobile"]}
        filename="customers.csv"
        emptyTitle={t({ en: "No customers yet.", bn: "এখনও কোনো গ্রাহক নেই।" })}
        onRowClick={setSelected}
        columns={[
          { key: "name", label: t({ en: "Name", bn: "নাম" }), render: (c) => <span className="font-bold text-ink-900">{c.name}</span> },
          { key: "email", label: t(PT.email), render: (c) => <span className="text-ink-500 break-all">{c.email}</span> },
          { key: "mobile", label: t(PT.mobile), render: (c) => <span className="text-ink-500">{c.mobile}</span> },
          { key: "role", label: t({ en: "Role", bn: "রোল" }), render: (c) => <span className="text-ink-600">{c.role}</span> },
          { key: "wallet", label: t(PT.walletBalance), render: (c) => <span className="font-semibold text-ink-800">{money(walletBalance(c.id), lang)}</span> },
          { key: "status", label: t(PT.status), render: (c) => <StatusBadge status={c.status || "active"} /> },
        ]}
      />
    </div>
  );
}

/* ─────────────────────── Payments ─────────────────────────── */

function AdminPayments() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const { verifyPayment } = useShop();
  const payments = all("payments").sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return (
    <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5">
      <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t({ en: "Payment Transactions", bn: "পেমেন্ট লেনদেন" })} ({payments.filter((p) => p.status === "pending_verification").length} pending)</h3>
      <DataTable
        rows={payments}
        searchKeys={["no", "method", "trx_id"]}
        filename="payments.csv"
        emptyTitle={t({ en: "No payments yet.", bn: "এখনও কোনো পেমেন্ট নেই।" })}
        columns={[
          { key: "no", label: t({ en: "Transaction ID", bn: "ট্রানজেকশন আইডি" }), render: (p) => <span className="font-bold text-ink-900">{p.no}</span> },
          { key: "type", label: t({ en: "Type", bn: "ধরন" }), render: (p) => <span className="text-ink-600">{p.type === "deposit" ? t({ en: "Deposit", bn: "ডিপোজিট" }) : t(PT.orders)}</span> },
          { key: "user", label: t({ en: "User", bn: "ইউজার" }), render: (p) => <span className="text-ink-500">{get("users", p.user_id)?.name}</span> },
          { key: "method", label: t({ en: "Method", bn: "মাধ্যম" }), render: (p) => <span className="text-ink-500">{p.method}</span> },
          { key: "amount", label: t(PT.amount), render: (p) => <span className="font-bold text-ink-800">{money(p.amount, lang)}</span> },
          { key: "created_at", label: t(PT.date), render: (p) => <span className="text-ink-500">{fmtDateTime(p.created_at, lang)}</span> },
          { key: "status", label: t(PT.status), render: (p) => <StatusBadge status={p.status} /> },
          { key: "action", label: "", render: (p) => p.status === "pending_verification" ? (
            <div className="flex gap-2">
              <button onClick={() => { verifyPayment(p.id, true); logAction(user!.email, "payment_verify", p.no); toast({ type: "success", title: t({ en: "Payment verified", bn: "পেমেন্ট যাচাই হয়েছে" }) }); }} className="text-emerald-600 font-bold text-xs">{t(PT.verify)}</button>
              <button onClick={() => { verifyPayment(p.id, false); logAction(user!.email, "payment_reject", p.no); toast({ type: "info", title: t({ en: "Payment rejected", bn: "পেমেন্ট প্রত্যাখ্যাত হয়েছে" }) }); }} className="text-red-500 font-bold text-xs">{t(PT.reject)}</button>
            </div>
          ) : null },
        ]}
      />
    </div>
  );
}

/* ─────────────────────── Tickets ──────────────────────────── */

function AdminTickets() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState<any | null>(null);
  const [reply, setReply] = useState("");
  const tickets = all("tickets").sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

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
            <p className="text-xs text-ink-400">{open.no} · {open.user_name} · {open.category} · {open.priority}</p>
          </div>
          <StatusBadge status={open.status} />
        </div>
        <div className="mt-4 space-y-3">
          {msgs.map((m) => (
            <div key={m.id} className={cn("max-w-[85%] rounded-2xl px-4 py-3 text-sm", m.from === "admin" ? "ml-auto bg-brand-50 text-ink-700" : "mr-auto bg-ink-50 text-ink-700")}>
              <p>{m.body}</p>
              <p className="text-[10px] text-ink-400 mt-1">{fmtDateTime(m.at, lang)} · {m.from === "admin" ? "AL-KHUBAIB IT" : open.user_name}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex gap-2">
          <input className={inputCls} value={reply} onChange={(e) => setReply(e.target.value)} placeholder={t({ en: "Type a reply…", bn: "উত্তর লিখুন…" })} />
          <Button size="sm" onClick={() => {
            if (!reply.trim()) return;
            insert("ticket_messages", { ticket_id: open.id, user_id: open.user_id, from: "admin", body: reply.trim(), at: nowISO() });
            update("tickets", open.id, { status: "waiting_for_customer" });
            notify(open.user_id, "ticket", { en: "Support replied", bn: "সাপোর্ট উত্তর দিয়েছে" }, { en: `Your ticket "${open.subject}" has a new reply.`, bn: `আপনার টিকিট "${open.subject}"-এ নতুন উত্তর এসেছে।` });
            setReply("");
            logAction(user!.email, "ticket_reply", open.no);
            toast({ type: "success", title: t({ en: "Reply sent", bn: "উত্তর পাঠানো হয়েছে" }) });
          }}>{t(PT.reply)}</Button>
          <Button size="sm" variant="secondary" onClick={() => { update("tickets", open.id, { status: "resolved" }); logAction(user!.email, "ticket_resolve", open.no); toast({ type: "success", title: t({ en: "Resolved", bn: "সমাধান হয়েছে" }) }); }}>
            {t({ en: "Resolve", bn: "সমাধান" })}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5">
      <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t(PT.support)} ({tickets.length})</h3>
      <DataTable
        rows={tickets}
        searchKeys={["subject", "no", "user_name"]}
        emptyTitle={t({ en: "No tickets.", bn: "কোনো টিকিট নেই।" })}
        onRowClick={setOpen}
        columns={[
          { key: "no", label: t({ en: "Ticket", bn: "টিকিট" }), render: (tk) => <span className="font-bold text-ink-900">{tk.no}</span> },
          { key: "subject", label: t(PT.ticketSubject), render: (tk) => <span className="text-ink-700">{tk.subject}</span> },
          { key: "user_name", label: t({ en: "Customer", bn: "গ্রাহক" }), render: (tk) => <span className="text-ink-500">{tk.user_name}</span> },
          { key: "category", label: t(PT.ticketCategory), render: (tk) => <span className="text-ink-500">{tk.category}</span> },
          { key: "created_at", label: t(PT.date), render: (tk) => <span className="text-ink-500">{fmtDateTime(tk.created_at, lang)}</span> },
          { key: "status", label: t(PT.status), render: (tk) => <StatusBadge status={tk.status} /> },
        ]}
      />
    </div>
  );
}

/* ─────────────────── Applications / Affiliates ────────────── */

function AdminApplications() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const apps = all("affiliate_applications").sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  const pending = apps.filter((a) => a.status === "pending");

  return (
    <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="font-display font-bold text-lg text-ink-900">{t({ en: "Affiliate Applications", bn: "এফিলিয়েট আবেদন" })} ({pending.length} pending)</h3>
        <Button size="sm" variant="secondary" onClick={() => {
          pending.forEach((a) => decideApplication(a.id, true));
          toast({ type: "success", title: t({ en: `${pending.length} application(s) approved`, bn: `${pending.length}টি আবেদন অনুমোদিত হয়েছে` }) });
        }}>
          {t({ en: "Approve all", bn: "সব অনুমোদন করুন" })}
        </Button>
      </div>
      <div className="space-y-3">
        {apps.map((a) => (
          <div key={a.id} className="rounded-xl border border-ink-100 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold text-ink-900">{a.name} <span className="text-ink-400 font-normal text-xs">· {a.email}</span></p>
                <p className="text-xs text-ink-400 mt-0.5">{a.mobile} · {fmtDateTime(a.created_at, lang)} · {a.method}</p>
              </div>
              <StatusBadge status={a.status} />
            </div>
            <p className="mt-2 text-sm text-ink-500 italic line-clamp-1">“{a.why}”</p>
            {a.status === "pending" && (
              <div className="mt-3 flex flex-col sm:flex-row gap-2.5">
                <Button size="sm" onClick={() => { decideApplication(a.id, true); toast({ type: "success", title: t({ en: "Approved", bn: "অনুমোদিত হয়েছে" }) }); }}>
                  {t(PT.approve)}
                </Button>
                <div className="flex flex-1 gap-2">
                  <input className={cn(inputCls, "flex-1")} placeholder={t({ en: "Rejection reason", bn: "প্রত্যাখ্যানের কারণ" })} value={reason} onChange={(e) => setReason(e.target.value)} />
                  <Button size="sm" variant="secondary" className="!text-red-600 shrink-0" onClick={() => { decideApplication(a.id, false, reason); setReason(""); toast({ type: "info", title: t({ en: "Rejected", bn: "প্রত্যাখ্যাত হয়েছে" }) }); }}>
                    {t(PT.reject)}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminAffiliates() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selected, setSelected] = useState<any | null>(null);
  const [reason, setReason] = useState("");
  const [kycTab, setKycTab] = useState("submitted");
  const profs = all("affiliate_profiles");

  if (selected) {
    const kyc = all("affiliate_kyc").find((k) => k.user_id === selected.user_id);
    const u = get("users", selected.user_id);
    return (
      <div className="space-y-4">
        <button onClick={() => setSelected(null)} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600">
          <Icon name="arrow" className="w-4 h-4 rotate-180" /> {t(PT.affiliates)}
        </button>
        <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display font-bold text-xl">{u?.name} <span className="text-brand-600">@{selected.code}</span></h3>
              <p className="text-sm text-ink-400">{u?.email} · {fmtDate(selected.joined, lang)}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={selected.status} />
              <StatusBadge status={selected.kyc_status} />
            </div>
          </div>
          <div className="mt-4 grid sm:grid-cols-3 gap-4">
            {[
              { l: t(PT.availableBalance), v: money(selected.balance, lang) },
              { l: t(PT.totalEarnings), v: money(selected.total_earned, lang) },
              { l: t(PT.totalClicks), v: all("affiliate_clicks").filter((c) => c.code === selected.code).length },
            ].map((s) => (
              <div key={s.l} className="rounded-xl bg-ink-50 p-4">
                <p className="text-xs text-ink-400">{s.l}</p>
                <p className="mt-1 font-display font-bold text-lg text-ink-900">{s.v}</p>
              </div>
            ))}
          </div>

          {kyc && (
            <div className="mt-5 rounded-xl border border-brand-100 bg-brand-50/50 p-4">
              <h4 className="font-display font-bold text-sm text-ink-900 mb-3">{t({ en: "KYC Review", bn: "KYC পর্যালোচনা" })}</h4>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                {Object.entries(kyc.fields || {}).map(([k, v]) => {
                  const val: any = v;
                  if (k === "profile_doc" || k === "nid_doc") {
                    return (
                      <div key={k} className="rounded-lg bg-white border border-ink-100 px-3 py-2">
                        <p className="text-xs text-ink-400 capitalize">{k.replace(/_/g, " ")}</p>
                        <p className="font-semibold text-ink-800 text-xs">{val?.name || "—"}</p>
                        {val?.data && String(val.data).startsWith("data:image") && (
                          <img src={val.data} alt="" className="mt-2 max-h-24 rounded-lg border border-ink-100" />
                        )}
                      </div>
                    );
                  }
                  return (
                    <div key={k} className="rounded-lg bg-white border border-ink-100 px-3 py-2">
                      <p className="text-xs text-ink-400 capitalize">{k.replace(/_/g, " ")}</p>
                      <p className="font-semibold text-ink-800 break-all">{String(v)}</p>
                    </div>
                  );
                })}
              </div>
              {kyc.status === "submitted" && (
                <div className="mt-3 flex flex-col sm:flex-row gap-2.5">
                  <Button size="sm" onClick={() => { decideKyc(selected.user_id, true); toast({ type: "success", title: t({ en: "KYC verified", bn: "KYC যাচাই হয়েছে" }) }); }}>{t(PT.verify)}</Button>
                  <div className="flex flex-1 gap-2">
                    <input className={cn(inputCls, "flex-1")} placeholder={t({ en: "Rejection reason", bn: "প্রত্যাখ্যানের কারণ" })} value={reason} onChange={(e) => setReason(e.target.value)} />
                    <Button size="sm" variant="secondary" className="!text-red-600 shrink-0" onClick={() => { decideKyc(selected.user_id, false, reason); setReason(""); toast({ type: "info", title: t({ en: "KYC rejected", bn: "KYC প্রত্যাখ্যাত হয়েছে" }) }); }}>
                      {t(PT.reject)}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-5 flex gap-2.5">
            <Button size="sm" variant="secondary" onClick={() => {
              const susp = selected.status === "suspended";
              update("affiliate_profiles", selected.id, { status: susp ? "active" : "suspended" });
              logAction(user!.email, susp ? "affiliate_activate" : "affiliate_suspend", selected.code);
              toast({ type: "info", title: susp ? t({ en: "Activated", bn: "সক্রিয় হয়েছে" }) : t({ en: "Suspended", bn: "সাসপেন্ড হয়েছে" }) });
            }}>
              {selected.status === "suspended" ? t({ en: "Activate", bn: "সক্রিয় করুন" }) : t({ en: "Suspend", bn: "সাসপেন্ড করুন" })}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const kycs = all("affiliate_kyc");
  const filteredKyc = kycs.filter((k) => k.status === kycTab);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5">
        <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t(PT.affiliates)} ({profs.length})</h3>
        <DataTable
          rows={profs}
          searchKeys={["code"]}
          filename="affiliates.csv"
          emptyTitle={t({ en: "No affiliates yet.", bn: "এখনও কোনো এফিলিয়েট নেই।" })}
          onRowClick={setSelected}
          columns={[
            { key: "code", label: t({ en: "Affiliate", bn: "এফিলিয়েট" }), render: (p) => <div><p className="font-bold text-brand-700">@{p.code}</p><p className="text-xs text-ink-400">{get("users", p.user_id)?.name}</p></div> },
            { key: "balance", label: t({ en: "Balance", bn: "ব্যালেন্স" }), render: (p) => <span className="font-semibold text-ink-800">{money(p.balance, lang)}</span> },
            { key: "total_earned", label: t({ en: "Earned", bn: "আয়" }), render: (p) => <span className="text-ink-600">{money(p.total_earned, lang)}</span> },
            { key: "status", label: t(PT.status), render: (p) => <StatusBadge status={p.status} /> },
            { key: "kyc_status", label: "KYC", render: (p) => <StatusBadge status={p.kyc_status} /> },
            { key: "action", label: "", render: (p) => <button onClick={() => setSelected(p)} className="text-brand-600 font-bold text-xs">{t(PT.viewDetails)}</button> },
          ]}
        />
      </div>

      {/* KYC tabs */}
      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5">
        <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t({ en: "KYC Verification", bn: "KYC যাচাই" })}</h3>
        <div className="flex gap-2 mb-4">
          {[
            { k: "submitted", l: t(PT.pendingKyc) },
            { k: "verified", l: t({ en: "Verified", bn: "যাচাইকৃত" }) },
            { k: "rejected", l: t(PT.rejected) },
          ].map((tb) => (
            <button key={tb.k} onClick={() => setKycTab(tb.k)} className={cn("px-4 py-2 rounded-full text-xs font-bold border transition-all", kycTab === tb.k ? "bg-brand-600 text-white border-brand-600" : "bg-white text-ink-500 border-ink-200")}>
              {tb.l} ({kycs.filter((k) => k.status === tb.k).length})
            </button>
          ))}
        </div>
        <DataTable
          rows={filteredKyc}
          searchKeys={["id"]}
          emptyTitle={t({ en: "No KYC records in this status.", bn: "এই স্ট্যাটাসে কোনো KYC রেকর্ড নেই।" })}
          columns={[
            { key: "user", label: t({ en: "Affiliate", bn: "এফিলিয়েট" }), render: (k) => {
              const prof = profs.find((p) => p.user_id === k.user_id);
              return <span className="font-bold text-ink-900">{get("users", k.user_id)?.name} <span className="text-brand-600">@{prof?.code}</span></span>;
            } },
            { key: "submitted_at", label: t({ en: "Submitted", bn: "জমা" }), render: (k) => <span className="text-ink-500">{fmtDateTime(k.submitted_at, lang)}</span> },
            { key: "status", label: t(PT.status), render: (k) => <StatusBadge status={k.status} /> },
            { key: "action", label: "", render: (k) => (
              <button onClick={() => {
                const prof = profs.find((p) => p.user_id === k.user_id);
                if (prof) setSelected(prof);
              }} className="text-brand-600 font-bold text-xs">{t(PT.viewDetails)}</button>
            ) },
          ]}
        />
      </div>
    </div>
  );
}

/* ─────────────────── Commissions / Withdrawals ────────────── */

function AdminCommissions() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const comms = all("commissions").sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return (
    <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5">
      <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t(PT.commissions)} ({comms.length})</h3>
      <DataTable
        rows={comms}
        searchKeys={["code", "order_no"]}
        filename="commissions.csv"
        emptyTitle={t({ en: "No commissions yet.", bn: "এখনও কোনো কমিশন নেই।" })}
        columns={[
          { key: "code", label: t({ en: "Affiliate", bn: "এফিলিয়েট" }), render: (c) => <span className="font-bold text-brand-700">@{c.code}</span> },
          { key: "item_name", label: t({ en: "Item", bn: "আইটেম" }), render: (c) => <span className="text-ink-700">{typeof c.item_name === "string" ? c.item_name : c.item_name?.en}</span> },
          { key: "order_no", label: t({ en: "Order", bn: "অর্ডার" }), render: (c) => <span className="text-ink-500">#{c.order_no}</span> },
          { key: "amount", label: t(PT.amount), render: (c) => <span className="font-bold text-ink-800">{money(c.amount, lang)}</span> },
          { key: "type", label: t({ en: "Type", bn: "ধরন" }), render: (c) => <span className="text-ink-500">{c.type === "renewal" ? t(PT.renewals) : t({ en: "Initial", bn: "প্রথম" })}</span> },
          { key: "status", label: t(PT.status), render: (c) => <StatusBadge status={c.status} /> },
          { key: "action", label: "", render: (c) => (
            <div className="flex gap-2">
              {c.status === "pending" && (
                <button onClick={() => { setCommissionStatus(c.id, "approved"); toast({ type: "success", title: t({ en: "Commission approved", bn: "কমিশন অনুমোদিত হয়েছে" }) }); }} className="text-emerald-600 font-bold text-xs">{t(PT.approve)}</button>
              )}
              {c.status === "approved" && (
                <>
                  <button onClick={() => { setCommissionStatus(c.id, "paid"); toast({ type: "success", title: t({ en: "Marked paid", bn: "পরিশোধিত চিহ্নিত" }) }); }} className="text-emerald-600 font-bold text-xs">{t(PT.paid)}</button>
                  <button onClick={() => { setCommissionStatus(c.id, "reversed"); toast({ type: "info", title: t({ en: "Reversed", bn: "রিভার্স হয়েছে" }) }); }} className="text-red-500 font-bold text-xs">{t({ en: "Reverse", bn: "রিভার্স" })}</button>
                </>
              )}
            </div>
          ) },
        ]}
      />
    </div>
  );
}

function AdminWithdrawals() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const wds = all("withdrawals").sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return (
    <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5">
      <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t(PT.withdrawals)} ({wds.filter((w) => w.status === "pending").length} pending)</h3>
      <DataTable
        rows={wds}
        searchKeys={["no", "code", "method"]}
        filename="withdrawals.csv"
        emptyTitle={t({ en: "No withdrawals yet.", bn: "এখনও কোনো উইথড্রয়াল নেই।" })}
        columns={[
          { key: "no", label: t({ en: "Withdrawal", bn: "উইথড্রয়াল" }), render: (w) => <span className="font-bold text-ink-900">{w.no}</span> },
          { key: "code", label: t({ en: "Affiliate", bn: "এফিলিয়েট" }), render: (w) => <span className="font-bold text-brand-700">@{w.code}</span> },
          { key: "amount", label: t(PT.amount), render: (w) => <span className="font-bold text-ink-800">{money(w.amount, lang)}</span> },
          { key: "method", label: t({ en: "Method", bn: "মাধ্যম" }), render: (w) => <span className="text-ink-500">{w.method} · {w.account}</span> },
          { key: "created_at", label: t(PT.date), render: (w) => <span className="text-ink-500">{fmtDateTime(w.created_at, lang)}</span> },
          { key: "status", label: t(PT.status), render: (w) => <StatusBadge status={w.status} /> },
          { key: "action", label: "", render: (w) => w.status === "pending" ? (
            <div className="flex gap-2">
              <button onClick={() => { decideWithdrawal(w.id, "paid"); toast({ type: "success", title: t({ en: "Withdrawal paid", bn: "উইথড্রয়াল পরিশোধিত" }) }); }} className="text-emerald-600 font-bold text-xs">{t(PT.paid)}</button>
              <button onClick={() => { decideWithdrawal(w.id, "rejected", reason); setReason(""); toast({ type: "info", title: t({ en: "Withdrawal rejected", bn: "উইথড্রয়াল প্রত্যাখ্যাত" }) }); }} className="text-red-500 font-bold text-xs">{t(PT.reject)}</button>
            </div>
          ) : w.status === "approved" ? (
            <button onClick={() => { decideWithdrawal(w.id, "paid"); toast({ type: "success", title: t({ en: "Withdrawal paid", bn: "উইথড্রয়াল পরিশোধিত" }) }); }} className="text-emerald-600 font-bold text-xs">{t(PT.paid)}</button>
          ) : null },
        ]}
      />
    </div>
  );
}

/* ─────────────────── Reports / Ledger ─────────────────────── */

function AdminReports() {
  const { t, lang } = useI18n();
  const [range, setRange] = useState(30);
  const since = Date.now() - range * 86400000;
  const paidOrders = all("orders").filter((o) => ["payment_confirmed", "ready", "completed"].includes(o.status));
  const gross = paidOrders.reduce((s, o) => s + o.total, 0);
  const refunds = all("orders").filter((o) => o.status === "refunded").reduce((s, o) => s + o.total, 0);
  const deposits = all("payments").filter((p) => p.type === "deposit" && p.status === "verified").reduce((s, p) => s + p.amount, 0);
  const comms = all("commissions");
  const commTotal = comms.reduce((s, c) => s + c.amount, 0);
  const commPaid = comms.filter((c) => c.status === "paid").reduce((s, c) => s + c.amount, 0);
  const commPending = comms.filter((c) => c.status === "pending" || c.status === "approved").reduce((s, c) => s + c.amount, 0);
  const withdrawals = all("withdrawals").filter((w) => w.status === "paid").reduce((s, w) => s + w.amount, 0);
  const serviceSales = paidOrders.flatMap((o) => o.items).filter((i: any) => i.kind === "service").reduce((s, i) => s + i.price * i.qty, 0);
  const productSales = paidOrders.flatMap((o) => o.items).filter((i: any) => i.kind === "product").reduce((s, i) => s + i.price * i.qty, 0);
  const recent = paidOrders.filter((o) => new Date(o.created_at).getTime() > since).reduce((s, o) => s + o.total, 0);

  const rows = [
    { k: t({ en: "Gross Sales", bn: "মোট বিক্রয়" }), v: money(gross, lang) },
    { k: t({ en: `Net Sales (${range} days)`, bn: `নিট বিক্রয় (${range} দিন)` }), v: money(recent, lang) },
    { k: t({ en: "Refunds", bn: "রিফান্ড" }), v: money(refunds, lang) },
    { k: t({ en: "Wallet Deposits", bn: "ওয়ালেট ডিপোজিট" }), v: money(deposits, lang) },
    { k: t({ en: "Service Sales", bn: "সার্ভিস বিক্রয়" }), v: money(serviceSales, lang) },
    { k: t({ en: "Product Sales", bn: "প্রোডাক্ট বিক্রয়" }), v: money(productSales, lang) },
    { k: t({ en: "Affiliate Commission (Total)", bn: "এফিলিয়েট কমিশন (মোট)" }), v: money(commTotal, lang) },
    { k: t({ en: "Paid Commission", bn: "পরিশোধিত কমিশন" }), v: money(commPaid, lang) },
    { k: t({ en: "Pending Commission", bn: "বাকি কমিশন" }), v: money(commPending, lang) },
    { k: t({ en: "Withdrawals Paid", bn: "উইথড্রয়াল পরিশোধিত" }), v: money(withdrawals, lang) },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-lg text-ink-900">{t({ en: "Financial Reports", bn: "ফাইন্যান্সিয়াল রিপোর্ট" })}</h3>
        <TimeRange value={range} onChange={setRange} />
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {rows.map((r) => (
          <div key={r.k} className="rounded-2xl bg-white border border-ink-100 p-5 shadow-soft">
            <p className="text-xs font-semibold text-ink-400">{r.k}</p>
            <p className="mt-1 font-display font-bold text-xl text-ink-900">{r.v}</p>
          </div>
        ))}
      </div>
      <Button size="sm" variant="secondary" onClick={() => downloadCsvReport(rows)}>
        <Icon name="doc" className="w-4 h-4" /> {t(PT.exportCsv)}
      </Button>
    </div>
  );
}
function downloadCsvReport(rows: { k: string; v: string }[]) {
  const csv = rows.map((r) => `"${r.k}","${r.v}"`).join("\n");
  const blob = new Blob(["Metric,Value\n" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "financial-report.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function AdminLedger() {
  const { t, lang } = useI18n();
  const ledger = all("ledger").sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return (
    <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5">
      <h3 className="font-display font-bold text-lg text-ink-900 mb-2">{t({ en: "Financial Ledger", bn: "ফাইন্যান্সিয়াল লেজার" })}</h3>
      <p className="text-xs text-ink-400 mb-4">{t({ en: "Append-only records — financial entries are never overwritten or deleted.", bn: "অ্যাপেন্ড-অনলি রেকর্ড — ফাইন্যান্সিয়াল এন্ট্রি কখনো ওভাররাইট বা ডিলিট হয় না।" })}</p>
      <DataTable
        rows={ledger}
        searchKeys={["type", "note", "ref"]}
        filename="ledger.csv"
        emptyTitle={t({ en: "No ledger entries yet.", bn: "এখনও কোনো লেজার এন্ট্রি নেই।" })}
        columns={[
          { key: "type", label: t({ en: "Type", bn: "ধরন" }), render: (l) => <span className="rounded-full bg-brand-50 text-brand-700 border border-brand-200 px-2.5 py-0.5 text-[11px] font-bold">{l.type}</span> },
          { key: "note", label: t({ en: "Description", bn: "বিবরণ" }), render: (l) => <span className="text-ink-700">{l.note}</span> },
          { key: "amount", label: t(PT.amount), render: (l) => <span className={cn("font-bold", l.amount >= 0 ? "text-emerald-600" : "text-red-500")}>{l.amount >= 0 ? "+" : ""}{money(l.amount, lang)}</span> },
          { key: "ref", label: t({ en: "Ref", bn: "রেফ" }), render: (l) => <span className="text-ink-500">{l.ref || "—"}</span> },
          { key: "created_at", label: t(PT.date), render: (l) => <span className="text-ink-500">{fmtDateTime(l.created_at, lang)}</span> },
        ]}
      />
    </div>
  );
}

/* ─────────────────── Admins / Notifications ───────────────── */

export function AdminAdmins() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const users = all("users");
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5">
        <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t(PT.admins)} ({users.length})</h3>
        <div className="space-y-2.5">
          {users.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-100 px-4 py-3 text-sm">
              <div>
                <p className="font-bold text-ink-900">{u.name} <span className="text-xs text-ink-400">{u.email}</span></p>
                <p className="text-xs text-ink-400">{u.role}</p>
              </div>
              <select
                className={cn(inputCls, "w-auto appearance-none")}
                value={u.role}
                disabled={u.id === user!.id}
                onChange={(e) => { update("users", u.id, { role: e.target.value }); logAction(user!.email, "role_change", `${u.email} → ${e.target.value}`); toast({ type: "success", title: t({ en: "Role updated", bn: "রোল আপডেট হয়েছে" }) }); }}
              >
                <option value="client">client</option><option value="affiliate">affiliate</option><option value="admin">admin</option><option value="super_admin">super_admin</option>
              </select>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5">
        <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t({ en: "Create Admin", bn: "অ্যাডমিন তৈরি করুন" })}</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label={t(PT.name)}><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label={t(PT.email)}><input className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label={t(PT.password)}><input className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        </div>
        <Button size="sm" className="mt-4" onClick={async () => {
          if (!name.trim() || !email.trim() || password.length < 8) { toast({ type: "warning", title: t({ en: "Fill all fields (password ≥ 8 chars)", bn: "সব ঘর পূরণ করুন (পাসওয়ার্ড ≥ ৮ অক্ষর)" }) }); return; }
          const { hashPassword, insert, uid } = await import("../lib/db");
          const salt = uid("s");
          const hash = await hashPassword(password, salt);
          insert("users", { name, email: email.trim(), role: "admin", salt, hash, status: "active" });
          logAction(user!.email, "admin_create", email);
          setName(""); setEmail(""); setPassword("");
          toast({ type: "success", title: t({ en: "Admin created", bn: "অ্যাডমিন তৈরি হয়েছে" }) });
        }}>{t(PT.addNew)}</Button>
      </div>
    </div>
  );
}

function AdminNotifications() {
  const { t, lang } = useI18n();
  const notifications = all("notifications").filter((n) => n.user_id === "admin").sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return (
    <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg text-ink-900">{t(PT.notifications)}</h3>
        <Button size="sm" variant="secondary" onClick={() => notifications.forEach((n) => update("notifications", n.id, { read: true }))}>{t(PT.markRead)}</Button>
      </div>
      {notifications.length === 0 ? <EmptyState icon="bell" title={t({ en: "No notifications.", bn: "কোনো নোটিফিকেশন নেই।" })} /> : (
        <div className="space-y-2.5">
          {notifications.map((n) => (
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

/* ─────────────────── Settings / Logs / Backup ─────────────── */

function AdminSettings() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const settings = getSettings();
  const [aff, setAff] = useState<any>({ ...settings.affiliate });
  const [wallet, setWallet] = useState<any>({ ...settings.wallet });
  const [methods, setMethods] = useState<any[]>([...(settings.payments?.methods || [])]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-6">
        <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t({ en: "Affiliate Settings", bn: "এফিলিয়েট সেটিংস" })}</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label={t({ en: "Cookie Duration (days)", bn: "কুকি সময়কাল (দিন)" })}><input type="number" className={inputCls} value={aff.cookieDays} onChange={(e) => setAff((f: any) => ({ ...f, cookieDays: Number(e.target.value) }))} /></Field>
          <Field label={t({ en: "Minimum Withdrawal (৳)", bn: "সর্বনিম্ন উইথড্রয়াল (৳)" })}><input type="number" className={inputCls} value={aff.minWithdrawal} onChange={(e) => setAff((f: any) => ({ ...f, minWithdrawal: Number(e.target.value) }))} /></Field>
          <Field label={t({ en: "Default Commission (%)", bn: "ডিফল্ট কমিশন (%)" })}><input type="number" className={inputCls} value={aff.defaultCommission} onChange={(e) => setAff((f: any) => ({ ...f, defaultCommission: Number(e.target.value) }))} /></Field>
          <Field label={t({ en: "Commission Holding (days)", bn: "কমিশন হোল্ডিং (দিন)" })}><input type="number" className={inputCls} value={aff.holdingDays} onChange={(e) => setAff((f: any) => ({ ...f, holdingDays: Number(e.target.value) }))} /></Field>
          <label className="flex items-center gap-2 text-sm font-semibold text-ink-700">
            <input type="checkbox" className="w-4 h-4 accent-brand-600" checked={!!aff.kycRequired} onChange={(e) => setAff((f: any) => ({ ...f, kycRequired: e.target.checked }))} />
            {t({ en: "KYC required", bn: "KYC আবশ্যক" })}
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-ink-700">
            <input type="checkbox" className="w-4 h-4 accent-brand-600" checked={!!aff.approvalRequired} onChange={(e) => setAff((f: any) => ({ ...f, approvalRequired: e.target.checked }))} />
            {t({ en: "Approval required", bn: "অনুমোদন আবশ্যক" })}
          </label>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-6">
        <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t({ en: "Wallet Settings", bn: "ওয়ালেট সেটিংস" })}</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={t({ en: "Minimum Deposit (৳)", bn: "সর্বনিম্ন ডিপোজিট (৳)" })}><input type="number" className={inputCls} value={wallet.minDeposit} onChange={(e) => setWallet((f: any) => ({ ...f, minDeposit: Number(e.target.value) }))} /></Field>
          <Field label={t({ en: "Maximum Deposit (৳)", bn: "সর্বোচ্চ ডিপোজিট (৳)" })}><input type="number" className={inputCls} value={wallet.maxDeposit} onChange={(e) => setWallet((f: any) => ({ ...f, maxDeposit: Number(e.target.value) }))} /></Field>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-6">
        <h3 className="font-display font-bold text-lg text-ink-900 mb-2">{t({ en: "Payment Methods", bn: "পেমেন্ট মাধ্যম" })}</h3>
        <p className="text-xs text-ink-400 mb-4">{t({ en: "Gateway credentials must be configured in the production server environment — never exposed in the frontend.", bn: "গেটওয়ে ক্রেডেনশিয়াল প্রোডাকশন সার্ভারে কনফিগার করতে হবে — ফ্রন্টএন্ডে প্রকাশ করা হয় না।" })}</p>
        <div className="space-y-3">
          {methods.map((m: any, i: number) => (
            <div key={m.id} className="rounded-xl border border-ink-100 p-4">
              <div className="flex items-center gap-3">
                <input type="checkbox" className="w-4 h-4 accent-brand-600" checked={!!m.enabled} onChange={(e) => setMethods((ms) => ms.map((x, j) => (j === i ? { ...x, enabled: e.target.checked } : x)))} />
                <p className="font-bold text-ink-900">{m.label}</p>
              </div>
              <textarea rows={2} className={cn(inputCls, "mt-2 resize-none")} value={m.instructions} onChange={(e) => setMethods((ms) => ms.map((x, j) => (j === i ? { ...x, instructions: e.target.value } : x)))} />
            </div>
          ))}
        </div>
      </div>

      <Button onClick={() => {
        setSetting("affiliate", aff);
        setSetting("wallet", wallet);
        setSetting("payments", { methods });
        logAction(user!.email, "settings_update", "platform");
        toast({ type: "success", title: t({ en: "Settings saved", bn: "সেটিংস সংরক্ষণ হয়েছে" }) });
      }}>{t(PT.save)}</Button>
    </div>
  );
}

function AdminLogs() {
  const { t, lang } = useI18n();
  const logs = all("logs").sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return (
    <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5">
      <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t(PT.logs)}</h3>
      <DataTable
        rows={logs}
        searchKeys={["admin", "action", "target"]}
        filename="activity-logs.csv"
        emptyTitle={t({ en: "No activity yet.", bn: "এখনও কোনো কার্যকলাপ নেই।" })}
        columns={[
          { key: "admin", label: t({ en: "Admin", bn: "অ্যাডমিন" }), render: (l) => <span className="font-bold text-ink-900">{l.admin}</span> },
          { key: "action", label: t({ en: "Action", bn: "অ্যাকশন" }), render: (l) => <span className="text-ink-600">{l.action}</span> },
          { key: "target", label: t({ en: "Target", bn: "টার্গেট" }), render: (l) => <span className="text-ink-500">{l.target}</span> },
          { key: "created_at", label: t(PT.date), render: (l) => <span className="text-ink-500">{fmtDateTime(l.created_at, lang)}</span> },
        ]}
      />
    </div>
  );
}

function AdminBackup() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  return (
    <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-6">
      <h3 className="font-display font-bold text-lg text-ink-900 mb-2">{t({ en: "Backup & Maintenance", bn: "ব্যাকআপ ও রক্ষণাবেক্ষণ" })}</h3>
      <p className="text-xs text-ink-400 mb-5">{t({ en: "Backups are only available to authorized admins and are never publicly accessible.", bn: "ব্যাকআপ শুধুমাত্র অনুমোদিত অ্যাডমিনদের জন্য — কখনো পাবলিকলি অ্যাক্সেসযোগ্য নয়।" })}</p>
      <div className="flex flex-wrap gap-2.5">
        <Button size="sm" variant="secondary" onClick={() => {
          const blob = new Blob([exportBackup()], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `alkhubaib-backup-${new Date().toISOString().slice(0, 10)}.json`;
          a.click();
          URL.revokeObjectURL(url);
          logAction(user!.email, "backup_download", "database");
          toast({ type: "success", title: t({ en: "Backup downloaded", bn: "ব্যাকআপ ডাউনলোড হয়েছে" }) });
        }}>
          <Icon name="monitor" className="w-4 h-4" /> {t(PT.downloadBackup)}
        </Button>
        <Button size="sm" variant="secondary" className="!text-red-600" onClick={async () => {
          const ok = await confirm({
            title: t({ en: "Reset all data?", bn: "সব ডেটা রিসেট করবেন?" }),
            desc: t({ en: "This permanently wipes the entire database. This action cannot be undone.", bn: "এটি পুরো ডেটাবেজ স্থায়ীভাবে মুছে ফেলবে। এই কাজটি ফিরিয়ে আনা যাবে না।" }),
            danger: true,
            double: true,
          });
          if (!ok) return;
          resetDatabase();
          window.location.reload();
        }}>
          {t(PT.resetData)}
        </Button>
      </div>
    </div>
  );
}
