import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon, type IconName } from "../components/Icons";
import { LangSwitch } from "../components/Layout";
import { useI18n } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import { all, update, money, fmtDateTime } from "../lib/db";
import { PT } from "../lib/portalText";
import { downloadCsv } from "../components/portalUi";
import { cn } from "../utils/cn";

/* ─────────────────── Zone (subdomain) system ─────────────────── */

export type Zone = "public" | "portal" | "admin";

/** Detects which subdomain the app is served from. */
export function hostZone(): Zone {
  try {
    const h = window.location.hostname.toLowerCase();
    if (h.startsWith("my.")) return "portal";
    if (h.startsWith("admin.")) return "admin";
  } catch {
    /* ignore */
  }
  return "public";
}

export function ZoneBoot() {
  const navigate = useNavigate();
  useEffect(() => {
    const z = hostZone();
    if (z === "portal" && !window.location.hash.includes("/portal")) {
      navigate("/portal/dashboard", { replace: true });
    } else if (z === "admin" && !window.location.hash.includes("/admin")) {
      navigate("/admin", { replace: true });
    }
  }, [navigate]);
  return null;
}

/** Hard zone isolation — wrong role can never enter a zone. */
export function ZoneDenied({ zone }: { zone: string }) {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-ink-950 px-4">
      <div className="max-w-md w-full rounded-3xl bg-white p-10 text-center shadow-2xl">
        <span className="mx-auto w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
          <Icon name="lock" className="w-8 h-8" />
        </span>
        <h1 className="mt-5 font-display font-bold text-2xl text-ink-900">403</h1>
        <p className="mt-2 font-semibold text-ink-800">
          {t({ en: `Access to the ${zone} zone is restricted.`, bn: `${zone} জোনে প্রবেশ সীমাবদ্ধ।` })}
        </p>
        <p className="mt-2 text-sm text-ink-500 leading-relaxed">
          {t({ en: "This area requires a different account role. Your current role does not have permission to access it.", bn: "এই অংশে প্রবেশের জন্য ভিন্ন অ্যাকাউন্ট রোল প্রয়োজন। আপনার বর্তমান রোলে এই অনুমতি নেই।" })}
        </p>
        <div className="mt-7 flex flex-col gap-2.5">
          <Link to={user ? "/" : "/portal/login"} className="inline-flex items-center justify-center gap-2 font-semibold rounded-xl bg-gradient-to-r from-brand-700 to-brand-500 text-white px-6 py-3 hover:shadow-lg transition-all">
            {t({ en: "Go to Website", bn: "ওয়েবসাইটে যান" })}
          </Link>
          {user && (
            <button onClick={logout} className="text-sm font-semibold text-red-500 hover:text-red-600">
              {t(PT.logout)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── Toast notifications ─────────────────── */

type ToastItem = { id: number; type: "success" | "error" | "warning" | "info"; title: string; desc?: string };
const ToastContext = createContext<{ toast: (t: Omit<ToastItem, "id">) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(1);
  const toast = useCallback((t: Omit<ToastItem, "id">) => {
    const id = idRef.current++;
    setToasts((prev) => [...prev.slice(-3), { ...t, id }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4200);
  }, []);
  const icons = { success: "check", error: "x", warning: "bell", info: "sparkle" } as const;
  const colors = {
    success: "bg-emerald-500",
    error: "bg-red-500",
    warning: "bg-amber-500",
    info: "bg-brand-600",
  };
  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[120] flex flex-col gap-2.5 w-[calc(100vw-2.5rem)] max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto flex items-start gap-3 rounded-2xl bg-white shadow-2xl border border-ink-100 p-4 animate-fade-in">
            <span className={cn("w-8 h-8 rounded-full text-white flex items-center justify-center shrink-0", colors[t.type])}>
              <Icon name={icons[t.type]} className="w-4 h-4" strokeWidth={2.5} />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-ink-900">{t.title}</p>
              {t.desc && <p className="text-xs text-ink-500 mt-0.5">{t.desc}</p>}
            </div>
            <button onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} className="ml-auto text-ink-300 hover:text-ink-500">
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast outside provider");
  return ctx;
}

/* ─────────────────── Confirmation dialogs ─────────────────── */

type ConfirmOpts = { title: string; desc?: string; confirmLabel?: string; danger?: boolean; double?: boolean };
const ConfirmContext = createContext<{ confirm: (o: ConfirmOpts) => Promise<boolean> } | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);
  const confirm = useCallback((o: ConfirmOpts) => new Promise<boolean>((resolve) => setState({ ...o, resolve })), []);
  const close = (v: boolean) => {
    state?.resolve(v);
    setState(null);
  };
  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-5">
          <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" onClick={() => close(false)} />
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl animate-fade-in">
            <span className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", state.danger ? "bg-red-50 text-red-500" : "bg-brand-50 text-brand-600")}>
              <Icon name={state.danger ? "shield" : "bell"} className="w-6 h-6" />
            </span>
            <h3 className="mt-4 font-display font-bold text-lg text-ink-900">{state.title}</h3>
            {state.desc && <p className="mt-1.5 text-sm text-ink-500 leading-relaxed">{state.desc}</p>}
            <div className="mt-6 flex gap-2.5">
              <button onClick={() => close(false)} className="flex-1 rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-semibold text-ink-600 hover:bg-ink-50 transition-colors">
                {state.double ? "No, go back" : "Cancel"}
              </button>
              <button
                onClick={() => close(true)}
                className={cn(
                  "flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all",
                  state.danger ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30" : "bg-gradient-to-r from-brand-700 to-brand-500 hover:shadow-lg shadow-brand-600/25"
                )}
              >
                {state.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm outside provider");
  return ctx;
}

/* ─────────────────── Data table ─────────────────── */

export function DataTable<T extends Record<string, any>>({
  rows,
  columns,
  searchKeys = [],
  searchPlaceholder,
  pageSize = 8,
  filename,
  emptyTitle,
  emptyDesc,
  onRowClick,
}: {
  rows: T[];
  columns: { key: string; label: React.ReactNode; render?: (row: T) => React.ReactNode; className?: string; sortable?: boolean }[];
  searchKeys?: string[];
  searchPlaceholder?: string;
  pageSize?: number;
  filename?: string;
  emptyTitle: string;
  emptyDesc?: string;
  onRowClick?: (row: T) => void;
}) {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [asc, setAsc] = useState(false);
  const [page, setPage] = useState(1);

  const filtered = rows.filter((r) => {
    if (!q) return true;
    const hay = searchKeys.map((k) => {
      const v = r[k];
      if (v == null) return "";
      if (typeof v === "object") return JSON.stringify(v);
      return String(v);
    }).join(" ").toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        const av = a[sortKey], bv = b[sortKey];
        const cmp = av == null ? -1 : bv == null ? 1 : typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
        return asc ? cmp : -cmp;
      })
    : filtered;

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const cur = Math.min(page, pages);
  const view = sorted.slice((cur - 1) * pageSize, cur * pageSize);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <div className="relative flex-1 min-w-48">
          <Icon name="search" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            className="w-full rounded-xl border border-ink-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
            placeholder={searchPlaceholder || t(PT.adminSearch)}
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
          />
        </div>
        {filename && (
          <button
            onClick={() => downloadCsv(filename, sorted as Record<string, unknown>[])}
            className="inline-flex items-center gap-2 rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-semibold text-ink-600 hover:border-brand-300 hover:text-brand-700 transition-colors"
          >
            <Icon name="doc" className="w-4 h-4" /> {t(PT.exportCsv)}
          </button>
        )}
      </div>

      {view.length === 0 ? (
        <EmptyState icon="folder" title={emptyTitle} desc={emptyDesc} />
      ) : (
        <>
          <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs font-bold uppercase tracking-wider text-ink-400">
                  {columns.map((c) => (
                    <th key={c.key} className="px-3 py-2.5 whitespace-nowrap">
                      <button
                        className={cn("inline-flex items-center gap-1 hover:text-brand-600", sortKey === c.key && "text-brand-600")}
                        onClick={() => {
                          if (sortKey === c.key) setAsc(!asc);
                          else { setSortKey(c.key); setAsc(true); }
                        }}
                      >
                        {c.label}
                        {sortKey === c.key && <Icon name="chevron" className={cn("w-3 h-3", !asc && "rotate-180")} />}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {view.map((row, i) => (
                  <tr
                    key={i}
                    onClick={() => onRowClick?.(row)}
                    className={cn("border-b border-ink-50 hover:bg-brand-50/40 transition-colors", onRowClick && "cursor-pointer")}
                  >
                    {columns.map((c) => (
                      <td key={c.key} className={cn("px-3 py-3 align-top", c.className)}>
                        {c.render ? c.render(row) : <span className="text-ink-700">{String(row[c.key] ?? "—")}</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <p className="text-ink-400">
                {sorted.length} · {t({ en: "Page", bn: "পেজ" })} {cur}/{pages}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={cur <= 1} className="w-9 h-9 rounded-xl border border-ink-200 flex items-center justify-center disabled:opacity-40 hover:border-brand-300">
                  <Icon name="arrow" className="w-4 h-4 rotate-180" />
                </button>
                <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={cur >= pages} className="w-9 h-9 rounded-xl border border-ink-200 flex items-center justify-center disabled:opacity-40 hover:border-brand-300">
                  <Icon name="arrow" className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─────────────────── Skeletons / empty / error ─────────────────── */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-ink-100/80", className)} />;
}
export function CardSkeletons({ n = 4 }: { n?: number }) {
  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-ink-100 bg-white p-5 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      ))}
    </div>
  );
}
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function EmptyState({
  icon = "folder",
  title,
  desc,
  action,
}: {
  icon?: string;
  title: string;
  desc?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-200 bg-white/60 px-6 py-12 text-center">
      <span className="mx-auto w-14 h-14 rounded-2xl bg-brand-50 text-brand-400 flex items-center justify-center">
        <Icon name={icon as IconName} className="w-7 h-7" />
      </span>
      <p className="mt-4 font-display font-bold text-ink-800">{title}</p>
      {desc && <p className="mt-1 text-sm text-ink-400 max-w-sm mx-auto">{desc}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/50 px-6 py-12 text-center">
      <span className="mx-auto w-14 h-14 rounded-2xl bg-red-100 text-red-500 flex items-center justify-center">
        <Icon name="shield" className="w-7 h-7" />
      </span>
      <p className="mt-4 font-display font-bold text-ink-800">{t({ en: "Something went wrong", bn: "কিছু একটা সমস্যা হয়েছে" })}</p>
      <p className="mt-1 text-sm text-ink-500">{t({ en: "We couldn't complete your request. Please try again.", bn: "আপনার অনুরোধটি সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।" })}</p>
      <button onClick={onRetry} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-700 to-brand-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-600/25 hover:-translate-y-0.5 transition-all">
        <Icon name="arrow" className="w-4 h-4" /> {t({ en: "Try Again", bn: "আবার চেষ্টা করুন" })}
      </button>
    </div>
  );
}

/* ─────────────────── Time range chips ─────────────────── */

export function TimeRange({ value, onChange }: { value: number; onChange: (d: number) => void }) {
  const { t } = useI18n();
  const opts = [
    { v: 7, l: t(PT.last7) },
    { v: 30, l: t(PT.last30) },
    { v: 90, l: t({ en: "3 Months", bn: "৩ মাস" }) },
    { v: 180, l: t({ en: "6 Months", bn: "৬ মাস" }) },
    { v: 365, l: t(PT.thisYear) },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {opts.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={cn(
            "px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all",
            value === o.v ? "bg-brand-600 text-white border-brand-600 shadow" : "bg-white text-ink-500 border-ink-200 hover:border-brand-300"
          )}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

/* ─────────────────── Notification center ─────────────────── */

export function NotificationCenter({
  target,
  onViewAll,
  dark = false,
}: {
  target: string;
  onViewAll?: () => void;
  dark?: boolean;
}) {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const items = all("notifications")
    .filter((n) => (target === "admin" ? n.user_id === "admin" : n.user_id === user?.id))
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .slice(0, 12);
  const unread = items.filter((n) => !n.read).length;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative w-10 h-10 rounded-xl border flex items-center justify-center transition-colors",
          dark ? "border-white/15 text-white/80 hover:bg-white/10" : "border-ink-200 text-ink-600 hover:bg-ink-50"
        )}
        aria-label={t(PT.notifications)}
      >
        <Icon name="bell" className="w-5 h-5" />
        {unread > 0 && <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">{unread}</span>}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-w-[85vw] rounded-2xl bg-white shadow-2xl border border-ink-100 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100">
              <p className="font-display font-bold text-sm text-ink-900">{t(PT.notifications)}</p>
              <button
                className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                onClick={() => items.filter((n) => !n.read).forEach((n) => update("notifications", n.id, { read: true }))}
              >
                {t(PT.markRead)}
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <p className="p-6 text-center text-sm text-ink-400">{t({ en: "No notifications.", bn: "কোনো নোটিফিকেশন নেই।" })}</p>
              ) : (
                items.map((n) => (
                  <button key={n.id} onClick={() => update("notifications", n.id, { read: true })} className={cn("w-full text-left px-4 py-3 border-b border-ink-50 hover:bg-brand-50/40", !n.read && "bg-brand-50/50")}>
                    <p className="text-sm font-semibold text-ink-900 leading-snug">{t(n.title)}</p>
                    <p className="text-xs text-ink-500 mt-0.5 line-clamp-2">{t(n.body)}</p>
                    <p className="text-[10px] text-ink-400 mt-1">{fmtDateTime(n.created_at, lang)}</p>
                  </button>
                ))
              )}
            </div>
            {onViewAll && (
              <button onClick={() => { setOpen(false); onViewAll(); }} className="w-full py-2.5 text-sm font-bold text-brand-600 hover:bg-brand-50">
                {t({ en: "View all", bn: "সব দেখুন" })}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────── Global search ─────────────────── */

export function GlobalSearch({
  scope,
  onAdminSelect,
  dark = false,
}: {
  scope: "portal" | "admin";
  onAdminSelect?: (section: string) => void;
  dark?: boolean;
}) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const results: { label: string; sub: string; path: string; action?: () => void }[] = [];
  if (q.trim().length >= 2) {
    if (scope === "admin") {
      const customers = all("users").filter((u) => (u.name || "").toLowerCase().includes(q.toLowerCase()) || (u.email || "").toLowerCase().includes(q.toLowerCase()));
      customers.slice(0, 3).forEach((c) => results.push({ label: c.name, sub: c.email, path: "", action: () => onAdminSelect?.("customers") }));
      const orders = all("orders").filter((o) => (o.no || "").toLowerCase().includes(q.toLowerCase()) || (o.user_name || "").toLowerCase().includes(q.toLowerCase()));
      orders.slice(0, 3).forEach((o) => results.push({ label: `#${o.no}`, sub: `${o.user_name} · ${money(o.total, lang)}`, path: "", action: () => onAdminSelect?.("orders") }));
      const invoices = all("invoices").filter((i) => (i.no || "").toLowerCase().includes(q.toLowerCase()) || (i.user_name || "").toLowerCase().includes(q.toLowerCase()));
      invoices.slice(0, 2).forEach((i) => results.push({ label: i.no, sub: `${i.user_name || "—"} · ${money(i.total, lang)}`, path: "", action: () => onAdminSelect?.("invoices") }));
      const tickets = all("tickets").filter((tk) => (tk.no || "").toLowerCase().includes(q.toLowerCase()) || (tk.subject || "").toLowerCase().includes(q.toLowerCase()));
      tickets.slice(0, 2).forEach((tk) => results.push({ label: tk.subject, sub: tk.no, path: "", action: () => onAdminSelect?.("tickets") }));
      const pages = all("pages").filter((p) => (p.slug || "").toLowerCase().includes(q.toLowerCase()) || (p.title?.en || "").toLowerCase().includes(q.toLowerCase()));
      pages.slice(0, 2).forEach((p) => results.push({ label: p.title?.en, sub: p.slug, path: "", action: () => onAdminSelect?.("pages") }));
      const products = all("products").filter((p) => (p.name?.en || "").toLowerCase().includes(q.toLowerCase()));
      products.slice(0, 2).forEach((p) => results.push({ label: p.name?.en, sub: t(PT.products), path: "", action: () => onAdminSelect?.("products") }));
      const affs = all("affiliate_profiles").filter((a) => (a.code || "").toLowerCase().includes(q.toLowerCase()));
      affs.slice(0, 2).forEach((a) => results.push({ label: `@${a.code}`, sub: t(PT.affiliates), path: "", action: () => onAdminSelect?.("affiliates") }));
    } else {
      const orders = all("orders").filter((o) => o.user_id === user?.id && (o.no || "").toLowerCase().includes(q.toLowerCase()));
      orders.slice(0, 4).forEach((o) => results.push({ label: `#${o.no}`, sub: money(o.total, lang), path: "/portal/dashboard?v=orders" }));
      const products = all("products").filter((p) => p.status === "published" && ((p.name?.en || "").toLowerCase().includes(q.toLowerCase()) || (p.name?.bn || "").includes(q)));
      products.slice(0, 3).forEach((p) => results.push({ label: p.name?.en, sub: t(PT.products), path: "/shop" }));
    }
  }

  return (
    <div className="relative hidden md:block">
      <div className="relative">
        <Icon name="search" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          className={cn(
            "w-56 lg:w-72 rounded-xl border pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:ring-4 focus:ring-brand-500/10",
            dark ? "bg-white/10 border-white/15 text-white placeholder:text-white/40 focus:border-brand-300" : "bg-ink-50/70 border-ink-200 text-ink-800 placeholder:text-ink-400 focus:border-brand-500"
          )}
          placeholder={t(PT.searchPh)}
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        />
      </div>
      {open && q.trim().length >= 2 && (
        <div className="absolute left-0 right-0 mt-2 rounded-2xl bg-white shadow-2xl border border-ink-100 z-50 overflow-hidden">
          {results.length === 0 ? (
            <p className="p-4 text-sm text-ink-400">{t({ en: "No results found.", bn: "কোনো ফলাফল পাওয়া যায়নি।" })}</p>
          ) : (
            results.map((r, i) => (
              <button
                key={i}
                className="w-full text-left px-4 py-3 border-b border-ink-50 last:border-0 hover:bg-brand-50/50 flex items-center justify-between gap-3"
                onMouseDown={() => {
                  setQ("");
                  setOpen(false);
                  if (r.action) r.action();
                  else navigate(r.path);
                }}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink-900 truncate">{r.label}</span>
                  <span className="block text-xs text-ink-400">{r.sub}</span>
                </span>
                <Icon name="arrow" className="w-3.5 h-3.5 text-ink-300 shrink-0" />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────── Profile menu ─────────────────── */

export function ProfileMenu({ dark = false }: { dark?: boolean }) {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const isAdmin = user?.role === "super_admin" || user?.role === "admin";
  const isAff = user?.role === "affiliate";
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2.5 group">
        <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 text-white font-display font-bold flex items-center justify-center">
          {(user?.name || "U").slice(0, 1).toUpperCase()}
        </span>
        <span className={cn("hidden lg:block text-left", dark ? "text-white" : "text-ink-800")}>
          <span className="block text-sm font-semibold leading-tight max-w-28 truncate">{user?.name}</span>
          <span className={cn("block text-[11px] leading-tight", dark ? "text-brand-200" : "text-ink-400")}>{t({ en: user?.role?.replace("_", " ") || "", bn: user?.role === "super_admin" ? "সুপার অ্যাডমিন" : user?.role === "admin" ? "অ্যাডমিন" : user?.role === "affiliate" ? "এফিলিয়েট" : "ক্লায়েন্ট" })}</span>
        </span>
        <Icon name="chevron" className={cn("w-4 h-4", dark ? "text-white/60" : "text-ink-400", open && "rotate-180")} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-2xl border border-ink-100 z-50 p-2">
            {!isAdmin && (
              <button onClick={() => { setOpen(false); window.location.hash = "#/portal/dashboard"; }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-ink-700 hover:bg-brand-50 hover:text-brand-700">
                <Icon name="dashboard" className="w-4 h-4 text-brand-500" /> {t(PT.dashboard)}
              </button>
            )}
            {isAff && !isAdmin && (
              <button onClick={() => { setOpen(false); window.location.hash = "#/portal/affiliate"; }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-ink-700 hover:bg-brand-50 hover:text-brand-700">
                <Icon name="network" className="w-4 h-4 text-brand-500" /> {t(PT.affiliatePanel)}
              </button>
            )}
            <button onClick={() => { setOpen(false); window.location.hash = "#/portal/dashboard?v=profile"; }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-ink-700 hover:bg-brand-50 hover:text-brand-700">
              <Icon name="user" className="w-4 h-4 text-brand-500" /> {t(PT.profile)}
            </button>
            <button onClick={() => { setOpen(false); window.location.hash = "#/"; }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-ink-700 hover:bg-brand-50 hover:text-brand-700">
              <Icon name="globe" className="w-4 h-4 text-brand-500" /> {t({ en: "Website", bn: "ওয়েবসাইট" })}
            </button>
            <div className="my-1.5 h-px bg-ink-100" />
            <button onClick={() => { setOpen(false); logout(); }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50">
              <Icon name="x" className="w-4 h-4" /> {t(PT.logout)}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────── Portal shell ─────────────────── */

export function PortalShell({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: string;
}) {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [drawer, setDrawer] = useState(false);

  const isAff = user?.role === "affiliate";
  const clientMenu = [
    { v: "overview", label: t(PT.dashboard), icon: "dashboard" },
    { v: "orders", label: t(PT.myOrders), icon: "folder" },
    { v: "subscriptions", label: t(PT.subscriptions), icon: "clock" },
    { v: "wallet", label: t(PT.wallet), icon: "wallet" },
    { v: "payments", label: t(PT.payments), icon: "card" },
    { v: "invoices", label: t(PT.invoices), icon: "doc" },
    { v: "downloads", label: t(PT.downloads), icon: "monitor" },
    { v: "support", label: t(PT.support), icon: "support" },
    { v: "callback", label: t(PT.requestCallback), icon: "phone" },
    { v: "notifications", label: t(PT.notifications), icon: "bell" },
    { v: "profile", label: t(PT.profile), icon: "user" },
    { v: "security", label: t(PT.security), icon: "lock" },
  ];
  const affMenu = [
    { v: "affiliate", label: t(PT.affiliateDashboard), icon: "chart" },
    { v: "links", label: t({ en: "Affiliate Links", bn: "এফিলিয়েট লিংক" }), icon: "link" },
    { v: "referrals", label: t({ en: "Referrals", bn: "রেফারেল" }), icon: "users" },
    { v: "commissions", label: t(PT.commissions), icon: "trending" },
    { v: "earnings", label: t({ en: "Earnings", bn: "আয়" }), icon: "wallet" },
    { v: "withdrawals", label: t(PT.withdrawals), icon: "send" },
    { v: "kyc", label: "KYC", icon: "shield" },
  ];

  const Menu = ({ onNav }: { onNav?: () => void }) => (
    <>
      <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-400">{t({ en: "Main", bn: "প্রধান" })}</p>
      {clientMenu.map((m) => (
        <button key={m.v} onClick={() => { onNav?.(); navigate(`/portal/dashboard?v=${m.v}`); }}
          className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all", active === m.v ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50")}>
          <Icon name={m.icon as IconName} className="w-4.5 h-4.5 shrink-0" />
          <span className="flex-1 text-left">{m.label}</span>
        </button>
      ))}
      {isAff && (
        <>
          <p className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-400">{t({ en: "Affiliate", bn: "এফিলিয়েট" })}</p>
          {affMenu.map((m) => (
            <button key={m.v} onClick={() => { onNav?.(); navigate(`/portal/affiliate?tab=${m.v}`); }}
              className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all", active === m.v ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50")}>
              <Icon name={m.icon as IconName} className="w-4.5 h-4.5 shrink-0" />
              <span className="flex-1 text-left">{m.label}</span>
            </button>
          ))}
        </>
      )}
      <div className="pt-4 mt-2 border-t border-ink-100">
        <button onClick={() => { onNav?.(); navigate("/shop"); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-ink-600 hover:bg-ink-50">
          <Icon name="shop" className="w-4.5 h-4.5 shrink-0" /> {t(PT.shop)}
        </button>
        <button onClick={() => { onNav?.(); navigate("/"); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-ink-600 hover:bg-ink-50">
          <Icon name="globe" className="w-4.5 h-4.5 shrink-0" /> {t({ en: "Website", bn: "ওয়েবসাইট" })}
        </button>
        <button onClick={() => { onNav?.(); logout(); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50">
          <Icon name="x" className="w-4.5 h-4.5 shrink-0" /> {t(PT.logout)}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-ink-50/70">
      {/* Topbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-ink-100">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 h-16">
          <div className="flex items-center gap-3">
            <button className="lg:hidden w-10 h-10 rounded-xl border border-ink-200 flex items-center justify-center text-ink-700" onClick={() => setDrawer(true)} aria-label={t({ en: "Menu", bn: "মেনু" })}>
              <Icon name="menu" className="w-5 h-5" />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 flex items-center justify-center text-white font-display font-bold text-sm shadow-lg shadow-brand-600/25">AK</span>
              <span className="hidden sm:block leading-tight">
                <span className="block font-display font-bold text-sm text-ink-900">AL-KHUBAIB <span className="text-gradient-dark">IT</span></span>
                <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-ink-400">{isAff ? "Affiliate Portal" : "Client Portal"}</span>
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2.5">
            <GlobalSearch scope="portal" />
            <NotificationCenter target="me" onViewAll={() => navigate("/portal/dashboard?v=notifications")} />
            <LangSwitch compact className="hidden md:inline-flex" />
            <ProfileMenu />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 py-6 lg:py-8 flex gap-6">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24 rounded-2xl bg-white border border-ink-100 shadow-soft p-2 max-h-[calc(100vh-7rem)] overflow-y-auto">
            <Menu />
          </div>
        </aside>
        <div className="flex-1 min-w-0">{children}</div>
      </div>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <div className="absolute left-0 top-0 h-full w-[84%] max-w-xs bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 h-16 border-b border-ink-100">
              <span className="font-display font-bold text-ink-900">AL-KHUBAIB <span className="text-gradient-dark">IT</span></span>
              <button onClick={() => setDrawer(false)} className="w-9 h-9 rounded-lg border border-ink-100 flex items-center justify-center">
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>
            <div className="px-3 py-3 flex-1 overflow-y-auto">
              <div className="mb-2"><LangSwitch className="w-full justify-between" /></div>
              <Menu onNav={() => setDrawer(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl border-t border-ink-100 grid grid-cols-5">
        {[
          { v: "overview", icon: "dashboard", label: t(PT.dashboard) },
          { v: "orders", icon: "folder", label: t(PT.myOrders) },
          { v: "wallet", icon: "wallet", label: t(PT.wallet) },
          { v: "support", icon: "support", label: t(PT.support) },
          { v: "profile", icon: "user", label: t(PT.profile) },
        ].map((m) => (
          <button key={m.v} onClick={() => navigate(`/portal/dashboard?v=${m.v}`)} className="flex flex-col items-center gap-0.5 py-2">
            <Icon name={m.icon as IconName} className={cn("w-5 h-5", active === m.v ? "text-brand-600" : "text-ink-400")} />
            <span className="text-[9px] font-semibold text-ink-500">{m.label}</span>
          </button>
        ))}
      </nav>
      <div className="lg:hidden h-14" />
    </div>
  );
}

/* ─────────────────── Admin shell ─────────────────── */

export type AdminNavItem = { k: string; icon: string; label: React.ReactNode; badge?: number };

export function AdminShell({
  nav,
  section,
  onSection,
  title,
  actions,
  children,
}: {
  nav: { group: string; items: AdminNavItem[] }[];
  section: string;
  onSection: (k: string) => void;
  title: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  const [drawer, setDrawer] = useState(false);
  const Sidebar = ({ onNav }: { onNav?: () => void }) => (
    <>
      {nav.map((grp) => (
        <div key={grp.group} className="py-0.5">
          <p className="px-3 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">{grp.group}</p>
          {grp.items.map((it) => (
            <button key={it.k} onClick={() => { onNav?.(); onSection(it.k); }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all",
                section === it.k ? "bg-brand-600/25 text-white border border-brand-400/30" : "text-white/60 hover:bg-white/5 hover:text-white"
              )}>
              <Icon name={it.icon as IconName} className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left truncate">{it.label}</span>
              {it.badge ? <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{it.badge}</span> : null}
            </button>
          ))}
        </div>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-ink-100/60">
      {/* Topbar */}
      <header className="sticky top-0 z-50 bg-ink-950 text-white">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 h-16">
          <div className="flex items-center gap-3">
            <button className="xl:hidden w-10 h-10 rounded-lg border border-white/15 flex items-center justify-center" onClick={() => setDrawer(true)} aria-label={t({ en: "Menu", bn: "মেনু" })}>
              <Icon name="menu" className="w-5 h-5" />
            </button>
            <Link to="/" className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 flex items-center justify-center text-white font-display font-bold text-sm">AK</span>
              <span className="leading-tight hidden sm:block">
                <span className="block font-display font-bold text-sm">AL-KHUBAIB <span className="text-brand-300">IT</span></span>
                <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-brand-200">{t({ en: "Admin Panel", bn: "অ্যাডমিন প্যানেল" })}</span>
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2.5">
            <GlobalSearch scope="admin" onAdminSelect={onSection} dark />
            <NotificationCenter target="admin" dark onViewAll={() => onSection("notifications")} />
            <ProfileMenu dark />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1500px] px-4 sm:px-6 py-6 flex gap-6">
        {/* Sidebar */}
        <aside className="hidden xl:block w-60 shrink-0">
          <div className="sticky top-24 rounded-2xl bg-ink-950 border border-white/5 shadow-2xl p-2 max-h-[calc(100vh-7rem)] overflow-y-auto">
            <Sidebar />
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {/* Page header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <p className="text-xs font-semibold text-ink-400">{t({ en: "Admin", bn: "অ্যাডমিন" })} / {section}</p>
              <h1 className="font-display font-bold text-xl sm:text-2xl text-ink-900">{title}</h1>
            </div>
            {actions}
          </div>
          {children}
        </div>
      </div>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-[60] xl:hidden">
          <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <div className="absolute left-0 top-0 h-full w-[84%] max-w-xs bg-ink-950 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 h-16 border-b border-white/10">
              <span className="font-display font-bold text-white">AL-KHUBAIB <span className="text-brand-300">IT</span></span>
              <button onClick={() => setDrawer(false)} className="w-9 h-9 rounded-lg border border-white/15 flex items-center justify-center text-white">
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>
            <div className="px-3 py-3 flex-1 overflow-y-auto">
              <Sidebar onNav={() => setDrawer(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
