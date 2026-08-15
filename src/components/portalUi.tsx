import React from "react";
import { Icon, type IconName } from "./Icons";
import { cn } from "../utils/cn";

export function StatCard({
  icon,
  label,
  value,
  sub,
  className,
}: {
  icon: string;
  label: React.ReactNode;
  value: React.ReactNode;
  sub?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-ink-100 bg-white p-5 shadow-soft", className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</span>
        <span className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
          <Icon name={icon as IconName} className="w-4.5 h-4.5" />
        </span>
      </div>
      <p className="mt-2 font-display font-bold text-2xl text-ink-900 leading-tight">{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-400">{sub}</p>}
    </div>
  );
}

export function Bars({
  data,
  height = 160,
  color = "from-brand-700 to-brand-500",
}: {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-1.5" style={{ height }} role="img" aria-label="chart">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1" title={`${d.label}: ${d.value}`}>
          <span className="text-[10px] font-semibold text-brand-600">{d.value > 0 ? d.value : ""}</span>
          <div
            className={cn("w-full rounded-t-md bg-gradient-to-t transition-all duration-500", color)}
            style={{ height: `${Math.max(3, (d.value / max) * (height - 34))}px` }}
          />
          <span className="text-[9px] text-ink-400 truncate w-full text-center leading-none">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Badge({ children, tone = "gray" }: { children: React.ReactNode; tone?: "gray" | "brand" | "green" | "red" | "amber" | "blue" }) {
  const tones = {
    gray: "bg-ink-50 text-ink-600 border-ink-200",
    brand: "bg-brand-50 text-brand-700 border-brand-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    red: "bg-red-50 text-red-600 border-red-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-sky-50 text-sky-700 border-sky-200",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold", tones[tone])}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone: Record<string, "gray" | "brand" | "green" | "red" | "amber" | "blue"> = {
    active: "green", verified: "green", paid: "green", completed: "green", ready: "green",
    approved: "green",
    pending: "amber", pending_payment: "amber", pending_verification: "amber",
    submitted: "amber", under_review: "amber", processing: "blue", in_progress: "blue",
    payment_confirmed: "blue", quality_check: "blue", open: "blue",
    rejected: "red", cancelled: "red", refunded: "red", expired: "red", suspended: "red",
    reversed: "red", unpaid: "red",
    waiting_for_customer: "amber", closed: "gray", resolved: "green", not_submitted: "gray",
    resubmission_required: "amber",
  };
  const label: Record<string, string> = {
    pending_payment: "Pending Payment", payment_confirmed: "Payment Confirmed",
    in_progress: "Work in Progress", quality_check: "Quality Check",
    ready: "Ready / Download", pending_verification: "Pending Verification",
    not_submitted: "Not Submitted", under_review: "Under Review",
    waiting_for_customer: "Waiting for Customer", unpaid: "Unpaid",
    resubmission_required: "Resubmission Required",
  };
  return <Badge tone={tone[status] ?? "gray"}>{label[status] ?? status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</Badge>;
}

export function Field({
  label,
  required,
  error,
  children,
  full,
}: {
  label: React.ReactNode;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={cn("block", full && "sm:col-span-2")}>
      <span className="block text-sm font-semibold text-ink-800 mb-1.5">
        {label} {required && <span className="text-brand-600">*</span>}
      </span>
      {children}
      {error && (
        <span className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
          <Icon name="badge" className="w-3.5 h-3.5 shrink-0" /> {error}
        </span>
      )}
    </label>
  );
}

export const inputCls =
  "w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-[15px] text-ink-900 placeholder:text-ink-300 outline-none transition-all focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10";

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-200 bg-white/60 p-10 text-center text-sm text-ink-400">
      {children}
    </div>
  );
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
