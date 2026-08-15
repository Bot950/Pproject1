import { useState } from "react";
import { Icon } from "../components/Icons";
import { Button } from "../components/ui";
import { useI18n } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import {
  all, get, insert, update, remove, money, fmtDateTime, getSettings, setSetting,
  walletCredit, notify, logAction, nowISO, uid, recordLedger,
} from "../lib/db";
import { PT } from "../lib/portalText";
import { StatusBadge, Field, inputCls } from "../components/portalUi";
import { DataTable, EmptyState, useToast } from "../lib/shell";
import {
  savePage, saveSection, revisionsFor, saveForm, saveFormFields,
  FIELD_TYPES, MODULES, isSuperAdmin,
} from "../lib/adminCore";
import { notifyEvent, renderVars, EVENTS, testTelegram } from "../lib/notify";
import { cn } from "../utils/cn";

/* ─────────────────────── Pages ────────────────────────────── */

export function PagesView() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState<any | null>(null);
  const pages = all("pages").filter((p) => p.status !== "trashed").sort((a, b) => (a.order || 0) - (b.order || 0));

  if (editing) {
    const setF = (p: any) => setEditing({ ...editing, ...p });
    const revs = editing.id !== "new" ? revisionsFor(editing.id) : [];
    return (
      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-7">
        <button onClick={() => setEditing(null)} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 mb-4">
          <Icon name="arrow" className="w-4 h-4 rotate-180" /> {t({ en: "Pages", bn: "পেজ" })}
        </button>
        <h3 className="font-display font-bold text-xl text-ink-900 mb-5">{editing.id === "new" ? t({ en: "Add Page", bn: "পেজ যোগ করুন" }) : `${t(PT.edit)} — ${editing.title?.en}`}</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={`${t(PT.english)} · ${t({ en: "Page Title", bn: "পেজের শিরোনাম" })}`}><input className={inputCls} value={editing.title?.en || ""} onChange={(e) => setF({ title: { ...editing.title, en: e.target.value } })} /></Field>
          <Field label={`${t(PT.bangla)} · ${t({ en: "Page Title", bn: "পেজের শিরোনাম" })}`}><input className={inputCls} value={editing.title?.bn || ""} onChange={(e) => setF({ title: { ...editing.title, bn: e.target.value } })} /></Field>
          <Field label={t({ en: "Slug / URL", bn: "স্লাগ / URL" })}><input className={inputCls} value={editing.slug || ""} onChange={(e) => setF({ slug: e.target.value })} /></Field>
          <Field label={t({ en: "Status", bn: "স্ট্যাটাস" })}>
            <select className={cn(inputCls, "appearance-none")} value={editing.status || "published"} onChange={(e) => setF({ status: e.target.value })}>
              <option value="published">{t({ en: "Published", bn: "প্রকাশিত" })}</option>
              <option value="draft">{t({ en: "Draft", bn: "ড্রাফট" })}</option>
              <option value="scheduled">{t({ en: "Scheduled", bn: "নির্ধারিত" })}</option>
              <option value="unpublished">{t({ en: "Unpublished", bn: "অপ্রকাশিত" })}</option>
            </select>
          </Field>
          {editing.status === "scheduled" && (
            <Field label={t({ en: "Publish Date", bn: "প্রকাশের তারিখ" })}>
              <input type="datetime-local" className={inputCls} value={editing.publish_at || ""} onChange={(e) => setF({ publish_at: e.target.value })} />
            </Field>
          )}
          <Field label={t({ en: "Order", bn: "ক্রম" })}><input type="number" className={inputCls} value={editing.order || 0} onChange={(e) => setF({ order: Number(e.target.value) })} /></Field>
          <div className="sm:col-span-2">
            <Field label={`${t(PT.english)} · ${t({ en: "Content", bn: "কনটেন্ট" })}`}>
              <textarea rows={4} className={cn(inputCls, "resize-none")} value={editing.content?.en || ""} onChange={(e) => setF({ content: { ...editing.content, en: e.target.value } })} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label={`${t(PT.bangla)} · ${t({ en: "Content", bn: "কনটেন্ট" })}`}>
              <textarea rows={4} className={cn(inputCls, "resize-none")} value={editing.content?.bn || ""} onChange={(e) => setF({ content: { ...editing.content, bn: e.target.value } })} />
            </Field>
          </div>
          <div className="sm:col-span-2 border-t border-ink-100 pt-4">
            <p className="text-sm font-bold text-ink-800 mb-3">{t({ en: "SEO", bn: "SEO" })}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label={`${t(PT.english)} · Title`}><input className={inputCls} value={editing.seo?.title_en || ""} onChange={(e) => setF({ seo: { ...editing.seo, title_en: e.target.value } })} /></Field>
              <Field label={`${t(PT.bangla)} · Title`}><input className={inputCls} value={editing.seo?.title_bn || ""} onChange={(e) => setF({ seo: { ...editing.seo, title_bn: e.target.value } })} /></Field>
              <Field label={`${t(PT.english)} · Description`}><input className={inputCls} value={editing.seo?.desc_en || ""} onChange={(e) => setF({ seo: { ...editing.seo, desc_en: e.target.value } })} /></Field>
              <Field label={`${t(PT.bangla)} · Description`}><input className={inputCls} value={editing.seo?.desc_bn || ""} onChange={(e) => setF({ seo: { ...editing.seo, desc_bn: e.target.value } })} /></Field>
            </div>
          </div>
        </div>
        <div className="mt-6 flex gap-2.5">
          <Button onClick={() => { savePage(editing.id, editing, user!.email); setEditing(null); toast({ type: "success", title: t({ en: "Page saved", bn: "পেজ সংরক্ষণ হয়েছে" }) }); }}>{t(PT.save)}</Button>
          {editing.id !== "new" && <Button variant="secondary" onClick={() => setEditing({ ...editing, id: "new", title: { ...editing.title, en: editing.title?.en + " (Copy)" }, slug: "" })}>{t({ en: "Duplicate", bn: "ডুপ্লিকেট" })}</Button>}
        </div>
        {revs.length > 0 && (
          <div className="mt-6 border-t border-ink-100 pt-4">
            <h4 className="font-display font-bold text-sm text-ink-900 mb-3">{t({ en: "Revision History", bn: "রিভিশন হিস্ট্রি" })}</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {revs.slice(0, 10).map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 text-xs">
                  <span className="text-ink-600">{r.admin} · {fmtDateTime(r.created_at, "en")} · <span className="font-semibold">{r.snapshot?.title?.en}</span></span>
                  <button
                    onClick={() => { setF({ title: r.snapshot?.title, content: r.snapshot?.content, seo: r.snapshot?.seo }); toast({ type: "info", title: t({ en: "Version loaded — save to restore", bn: "পূর্বের ভার্সন লোড হয়েছে — সংরক্ষণ করুন" }) }); }}
                    className="font-bold text-brand-600 hover:text-brand-700"
                  >
                    {t({ en: "Restore", bn: "পুনরুদ্ধার" })}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg text-ink-900">{t({ en: "Website Pages", bn: "ওয়েবসাইট পেজ" })} ({pages.length})</h3>
        <Button size="sm" onClick={() => setEditing({ id: "new", title: { en: "", bn: "" }, content: { en: "", bn: "" }, seo: { title_en: "", title_bn: "", desc_en: "", desc_bn: "" }, status: "draft", order: pages.length + 1, slug: "" })}>
          {t(PT.addNew)}
        </Button>
      </div>
      <DataTable
        rows={pages}
        searchKeys={["slug"]}
        emptyTitle={t({ en: "No pages.", bn: "কোনো পেজ নেই।" })}
        columns={[
          { key: "title", label: t({ en: "Title", bn: "শিরোনাম" }), render: (p) => <span className="font-bold text-ink-900">{p.title?.en}</span> },
          { key: "slug", label: t({ en: "URL", bn: "URL" }), render: (p) => <span className="text-ink-500 font-mono text-xs">{p.slug}</span> },
          { key: "order", label: t({ en: "Order", bn: "ক্রম" }), render: (p) => <span className="text-ink-500">{p.order}</span> },
          { key: "status", label: t(PT.status), render: (p) => <StatusBadge status={p.status === "published" ? "active" : p.status} /> },
          { key: "action", label: "", render: (p) => (
            <div className="flex gap-2">
              <button onClick={() => setEditing({ ...p })} className="text-brand-600 font-bold text-xs">{t(PT.edit)}</button>
              <button onClick={() => { update("pages", p.id, { status: p.status === "published" ? "unpublished" : "published" }); logAction(user!.email, "page_toggle", p.slug); }} className="text-amber-600 font-bold text-xs">{p.status === "published" ? t({ en: "Unpublish", bn: "অপ্রকাশিত" }) : t({ en: "Publish", bn: "প্রকাশিত" })}</button>
              {!p.is_system && <button onClick={() => { update("pages", p.id, { status: "trashed" }); logAction(user!.email, "page_delete", p.slug); }} className="text-red-500 font-bold text-xs">{t(PT.delete)}</button>}
            </div>
          ) },
        ]}
      />
    </div>
  );
}

/* ─────────────────────── Sections ─────────────────────────── */

export function SectionsView() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState<any | null>(null);
  const home = all("pages").find((p) => p.slug === "/") || all("pages")[0];
  const sections = all("page_sections").filter((s) => s.page_id === home?.id && s.status !== "trashed").sort((a, b) => (a.order || 0) - (b.order || 0));

  const move = (id: string, dir: -1 | 1) => {
    const idx = sections.findIndex((s) => s.id === id);
    const other = sections[idx + dir];
    if (!other) return;
    update("page_sections", id, { order: other.order });
    update("page_sections", other.id, { order: sections[idx].order });
    logAction(user!.email, "section_reorder", sections[idx].key);
  };

  if (editing) {
    const setF = (p: any) => setEditing({ ...editing, ...p });
    return (
      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-7">
        <button onClick={() => setEditing(null)} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 mb-4">
          <Icon name="arrow" className="w-4 h-4 rotate-180" /> {t({ en: "Sections", bn: "সেকশন" })}
        </button>
        <h3 className="font-display font-bold text-xl text-ink-900 mb-5">{t(PT.edit)} — {editing.title?.en}</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={`${t(PT.english)} · ${t({ en: "Section Title", bn: "সেকশন শিরোনাম" })}`}><input className={inputCls} value={editing.title?.en || ""} onChange={(e) => setF({ title: { ...editing.title, en: e.target.value } })} /></Field>
          <Field label={`${t(PT.bangla)} · ${t({ en: "Section Title", bn: "সেকশন শিরোনাম" })}`}><input className={inputCls} value={editing.title?.bn || ""} onChange={(e) => setF({ title: { ...editing.title, bn: e.target.value } })} /></Field>
          <div className="sm:col-span-2">
            <Field label={`${t(PT.english)} · ${t({ en: "Content", bn: "কনটেন্ট" })}`}>
              <textarea rows={3} className={cn(inputCls, "resize-none")} value={editing.content?.en || ""} onChange={(e) => setF({ content: { ...editing.content, en: e.target.value } })} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label={`${t(PT.bangla)} · ${t({ en: "Content", bn: "কনটেন্ট" })}`}>
              <textarea rows={3} className={cn(inputCls, "resize-none")} value={editing.content?.bn || ""} onChange={(e) => setF({ content: { ...editing.content, bn: e.target.value } })} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-ink-700">
            <input type="checkbox" className="w-4 h-4 accent-brand-600" checked={!!editing.enabled} onChange={(e) => setF({ enabled: e.target.checked })} />
            {t(PT.enabled)}
          </label>
        </div>
        <Button className="mt-6" onClick={() => { saveSection(editing.id, editing, user!.email); setEditing(null); toast({ type: "success", title: t({ en: "Section saved", bn: "সেকশন সংরক্ষণ হয়েছে" }) }); }}>{t(PT.save)}</Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg text-ink-900">{t({ en: "Homepage Sections", bn: "হোমপেজ সেকশন" })} ({sections.length})</h3>
        <Button size="sm" onClick={() => setEditing({ id: "new", page_id: home?.id, key: `section_${Date.now().toString(36)}`, title: { en: "New Section", bn: "নতুন সেকশন" }, content: { en: "", bn: "" }, order: sections.length + 1, enabled: true })}>
          {t(PT.addNew)}
        </Button>
      </div>
      <div className="space-y-2">
        {sections.map((s) => (
          <div key={s.id} className={cn("flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3", s.enabled ? "border-ink-100" : "border-ink-100 bg-ink-50 opacity-60")}>
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center text-xs font-bold">{s.order}</span>
              <div>
                <p className="font-bold text-ink-900 text-sm">{s.title?.en} <span className="text-ink-400">·</span> {s.title?.bn}</p>
                <p className="text-xs text-ink-400">{s.key}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <IconBtn onClick={() => move(s.id, -1)}><Icon name="arrow" className="w-3.5 h-3.5 rotate-180" /></IconBtn>
              <IconBtn onClick={() => move(s.id, 1)}><Icon name="arrow" className="w-3.5 h-3.5" /></IconBtn>
              <IconBtn onClick={() => { update("page_sections", s.id, { enabled: !s.enabled }); logAction(user!.email, "section_toggle", s.key); }}><Icon name={s.enabled ? "monitor" : "lock"} className="w-3.5 h-3.5" /></IconBtn>
              <IconBtn onClick={() => setEditing({ ...s })}><Icon name="pen" className="w-3.5 h-3.5" /></IconBtn>
              <IconBtn onClick={() => { insert("page_sections", { ...s, id: uid("ps"), key: s.key + "_copy", title: { ...s.title, en: s.title?.en + " (Copy)" }, order: sections.length + 1, created_at: nowISO() }); toast({ type: "success", title: t({ en: "Duplicated", bn: "ডুপ্লিকেট হয়েছে" }) }); }}><Icon name="layers" className="w-3.5 h-3.5" /></IconBtn>
              <IconBtn danger onClick={() => { update("page_sections", s.id, { status: "trashed" }); logAction(user!.email, "section_delete", s.key); }}><Icon name="x" className="w-3.5 h-3.5" /></IconBtn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={cn("w-8 h-8 rounded-lg border border-ink-200 flex items-center justify-center text-ink-500 hover:border-brand-300 hover:text-brand-600 transition-colors", danger && "hover:border-red-300 hover:text-red-500")}>
      {children}
    </button>
  );
}

/* ═══════════════════ ADVANCED INVOICE MANAGEMENT ═════════════ */

const INVOICE_STATUSES = ["draft", "pending", "sent", "partial", "paid", "overdue", "cancelled", "refunded"];

export function InvoicesView() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [editing, setEditing] = useState<any | null>(null);
  const invoices = all("invoices").sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

  if (editing) return <InvoiceEditor invoice={editing} onClose={() => setEditing(null)} />;

  const newInvoice = () => {
    const inv = insert("invoices", {
      no: `INV-${Date.now().toString(36).toUpperCase().slice(-6)}`, manual: true, user_id: "", user_name: "",
      items: [], subtotal: 0, discount: 0, fees: [], tax_rate: 0, total: 0,
      status: "draft", due_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      notes: "", terms: "", created_at: nowISO(),
    });
    logAction(user!.email, "invoice_create", inv.no);
    setEditing(inv);
  };

  return (
    <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg text-ink-900">{t({ en: "Invoice Management", bn: "ইনভয়েস ম্যানেজমেন্ট" })} ({invoices.length})</h3>
        <Button size="sm" onClick={newInvoice}>{t({ en: "Create Invoice", bn: "ইনভয়েস তৈরি করুন" })}</Button>
      </div>
      <DataTable
        rows={invoices}
        searchKeys={["no", "order_no", "user_name"]}
        filename="invoices.csv"
        emptyTitle={t({ en: "No invoices yet.", bn: "এখনও কোনো ইনভয়েস নেই।" })}
        columns={[
          { key: "no", label: t({ en: "Invoice", bn: "ইনভয়েস" }), render: (i) => <span className="font-bold text-ink-900">{i.no}{i.manual ? <span className="ml-1.5 text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-100 rounded px-1.5 py-0.5">MANUAL</span> : null}</span> },
          { key: "user_name", label: t({ en: "Client", bn: "ক্লায়েন্ট" }), render: (i) => <span className="text-ink-600">{i.user_name || "—"}</span> },
          { key: "created_at", label: t(PT.date), render: (i) => <span className="text-ink-500">{fmtDateTime(i.created_at, lang)}</span> },
          { key: "total", label: t({ en: "Total", bn: "মোট" }), render: (i) => <span className="font-bold text-ink-800">{money(i.total, lang)}</span> },
          { key: "paid", label: t({ en: "Paid", bn: "পরিশোধিত" }), render: (i) => <span className="text-emerald-600 font-semibold">{money(all("invoice_payments").filter((p) => p.invoice_id === i.id).reduce((s, p) => s + p.amount, 0), lang)}</span> },
          { key: "status", label: t(PT.status), render: (i) => <StatusBadge status={i.status === "partial" ? "waiting_for_customer" : i.status} /> },
          { key: "action", label: "", render: (i) => <button onClick={() => setEditing(i)} className="text-brand-600 font-bold text-xs">{t(PT.edit)}</button> },
        ]}
      />
    </div>
  );
}

function InvoiceEditor({ invoice, onClose }: { invoice: any; onClose: () => void }) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const [inv, setInv] = useState<any>({ ...invoice, items: invoice.items || [], fees: invoice.fees || [] });
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState("bKash");
  const [payNote, setPayNote] = useState("");
  const [newItem, setNewItem] = useState<any>({ type: "custom", name_en: "", name_bn: "", qty: 1, price: 0 });
  const [newFee, setNewFee] = useState({ label_en: "", label_bn: "", amount: 0 });

  const clients = all("users").filter((u) => u.role === "client" || u.role === "affiliate");
  const payments = all("invoice_payments").filter((p) => p.invoice_id === inv.id);
  const paidTotal = payments.reduce((s, p) => s + p.amount, 0);

  const subtotal = (inv.items || []).reduce((s: number, it: any) => s + it.qty * it.price, 0);
  const feesTotal = (inv.fees || []).reduce((s: number, f: any) => s + Number(f.amount || 0), 0);
  const tax = Math.round((subtotal - (inv.discount || 0)) * (inv.tax_rate || 0) / 100);
  const total = Math.max(0, subtotal - (inv.discount || 0) + feesTotal + tax);
  const due = Math.max(0, total - paidTotal);

  const recomputeStatus = () => {
    if (inv.status === "draft" || inv.status === "cancelled" || inv.status === "refunded") return inv.status;
    if (paidTotal >= total && total > 0) return "paid";
    if (paidTotal > 0 && paidTotal < total) return "partial";
    if (inv.due_date && new Date(inv.due_date) < new Date()) return "overdue";
    return inv.status;
  };

  const addItem = () => {
    if (!newItem.name_en.trim()) { toast({ type: "warning", title: t({ en: "Item name required", bn: "আইটেমের নাম আবশ্যক" }) }); return; }
    setInv({ ...inv, items: [...(inv.items || []), { id: uid("li"), name: { en: newItem.name_en, bn: newItem.name_bn || newItem.name_en }, qty: newItem.qty || 1, price: newItem.price || 0, custom: newItem.type === "custom" }] });
    setNewItem({ type: "custom", name_en: "", name_bn: "", qty: 1, price: 0 });
  };

  const pickItem = (id: string, kind: string) => {
    if (!id) return;
    const src = kind === "product" ? get("products", id) : get("services", id);
    if (!src) return;
    setInv({ ...inv, items: [...(inv.items || []), { id: uid("li"), kind, item_id: src.id, name: src.name, qty: 1, price: src.price }] });
  };

  const save = () => {
    update("invoices", inv.id, { ...inv, subtotal, total, status: recomputeStatus() });
    logAction(user!.email, "invoice_update", `${inv.no} (total ${total})`);
    toast({ type: "success", title: t({ en: "Invoice saved", bn: "ইনভয়েস সংরক্ষণ হয়েছে" }) });
    onClose();
  };

  const recordPayment = () => {
    if (payAmount <= 0) { toast({ type: "warning", title: t({ en: "Enter an amount", bn: "পরিমাণ লিখুন" }) }); return; }
    insert("invoice_payments", { invoice_id: inv.id, invoice_no: inv.no, user_id: inv.user_id, amount: payAmount, method: payMethod, note: payNote, by: user!.name, created_at: nowISO() });
    recordLedger("payment", inv.user_id || "manual", payAmount, `Invoice ${inv.no} payment via ${payMethod}`, inv.no);
    if (inv.user_id) {
      walletCredit(inv.user_id, 0, `Invoice ${inv.no} payment recorded`); // ledger-only entry for manual invoice payments
      notify(inv.user_id, "payment", { en: "Invoice payment recorded", bn: "ইনভয়েস পেমেন্ট রেকর্ড হয়েছে" }, { en: `Payment of ৳${payAmount} recorded for invoice ${inv.no}.`, bn: `ইনভয়েস ${inv.no}-এর জন্য ৳${payAmount} পেমেন্ট রেকর্ড হয়েছে।` });
    }
    setPayAmount(0); setPayNote("");
    toast({ type: "success", title: t({ en: "Payment recorded", bn: "পেমেন্ট রেকর্ড হয়েছে" }) });
  };

  const emailInvoice = () => {
    const client = get("users", inv.user_id);
    notifyEvent("invoice_created", {
      invoice_id: inv.no, name: inv.user_name || client?.name || "Customer", amount: money(total, "en"),
      due_date: inv.due_date || "—", email: client?.email || inv.user_email,
    });
    update("invoices", inv.id, { status: inv.status === "draft" ? "sent" : inv.status });
    toast({ type: "success", title: t({ en: "Invoice emailed", bn: "ইনভয়েস ইমেইল করা হয়েছে" }) });
  };

  return (
    <div className="space-y-4">
      <button onClick={onClose} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600">
        <Icon name="arrow" className="w-4 h-4 rotate-180" /> {t({ en: "Invoices", bn: "ইনভয়েস" })}
      </button>

      {/* Editor card */}
      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 pb-4">
          <div>
            <h3 className="font-display font-bold text-xl text-ink-900">{inv.no}</h3>
            <p className="text-xs text-ink-400">{t({ en: "Manual invoice", bn: "ম্যানুয়াল ইনভয়েস" })}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select className={cn(inputCls, "w-auto appearance-none")} value={inv.status} onChange={(e) => setInv({ ...inv, status: e.target.value })}>
              {INVOICE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <Button size="sm" variant="secondary" onClick={emailInvoice}><Icon name="send" className="w-4 h-4" /> {t({ en: "Email Invoice", bn: "ইমেইল করুন" })}</Button>
            <Button size="sm" variant="secondary" onClick={() => window.print()}><Icon name="doc" className="w-4 h-4" /> PDF</Button>
            <Button size="sm" onClick={save}>{t(PT.save)}</Button>
          </div>
        </div>

        <div className="mt-5 grid sm:grid-cols-3 gap-4">
          <Field label={t({ en: "Client", bn: "ক্লায়েন্ট" })}>
            <select className={cn(inputCls, "appearance-none")} value={inv.user_id || ""} onChange={(e) => {
              const c = get("users", e.target.value);
              setInv({ ...inv, user_id: e.target.value, user_name: c?.name || "", user_email: c?.email || "" });
            }}>
              <option value="">—</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
            </select>
          </Field>
          <Field label={t({ en: "Due Date", bn: "মেয়াদ শেষের তারিখ" })}><input type="date" className={inputCls} value={inv.due_date || ""} onChange={(e) => setInv({ ...inv, due_date: e.target.value })} /></Field>
          <Field label={t({ en: "Tax Rate %", bn: "ট্যাক্স রেট %" })}><input type="number" className={inputCls} value={inv.tax_rate || 0} onChange={(e) => setInv({ ...inv, tax_rate: Number(e.target.value) })} /></Field>
        </div>

        {/* Line items */}
        <div className="mt-6">
          <h4 className="font-display font-bold text-base text-ink-900 mb-3">{t({ en: "Line Items", bn: "লাইন আইটেম" })}</h4>
          <div className="space-y-2">
            {(inv.items || []).map((it: any, i: number) => (
              <div key={i} className="flex flex-wrap items-center gap-2.5 rounded-xl bg-ink-50 px-3 py-2.5 text-sm">
                <span className="font-semibold text-ink-800 flex-1 min-w-40">{it.name?.en || it.name}</span>
                <input type="number" className={cn(inputCls, "!w-16 !py-1.5")} value={it.qty} onChange={(e) => setInv({ ...inv, items: inv.items.map((x: any, j: number) => j === i ? { ...x, qty: Number(e.target.value) } : x) })} />
                <input type="number" className={cn(inputCls, "!w-28 !py-1.5")} value={it.price} onChange={(e) => setInv({ ...inv, items: inv.items.map((x: any, j: number) => j === i ? { ...x, price: Number(e.target.value) } : x) })} />
                <span className="font-bold text-ink-800 w-24 text-right">{money(it.qty * it.price, lang)}</span>
                <button className="text-red-500 font-bold text-xs" onClick={() => setInv({ ...inv, items: inv.items.filter((_: any, j: number) => j !== i) })}>✕</button>
              </div>
            ))}
          </div>
          {/* Add item */}
          <div className="mt-3 grid sm:grid-cols-6 gap-2.5">
            <select className={cn(inputCls, "sm:col-span-1 appearance-none")} value={newItem.type} onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}>
              <option value="custom">{t({ en: "Custom", bn: "কাস্টম" })}</option>
              <option value="product">{t(PT.products)}</option>
              <option value="service">{t(PT.services)}</option>
            </select>
            {newItem.type === "custom" ? (
              <>
                <input className={cn(inputCls, "sm:col-span-2")} placeholder={t({ en: "Item name (EN)", bn: "আইটেমের নাম (EN)" })} value={newItem.name_en} onChange={(e) => setNewItem({ ...newItem, name_en: e.target.value })} />
                <input className={cn(inputCls, "sm:col-span-1")} placeholder="BN" value={newItem.name_bn} onChange={(e) => setNewItem({ ...newItem, name_bn: e.target.value })} />
                <input type="number" className={inputCls} placeholder={t({ en: "Qty", bn: "পরিমাণ" })} value={newItem.qty} onChange={(e) => setNewItem({ ...newItem, qty: Number(e.target.value) })} />
                <input type="number" className={inputCls} placeholder={t(PT.amount)} value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })} />
              </>
            ) : (
              <select className={cn(inputCls, "sm:col-span-5 appearance-none")} value="" onChange={(e) => pickItem(e.target.value, newItem.type)}>
                <option value="">{t({ en: "Pick an item…", bn: "আইটেম নির্বাচন করুন…" })}</option>
                {(newItem.type === "product" ? all("products") : all("services")).map((x: any) => <option key={x.id} value={x.id}>{x.name?.en} — {money(x.price, lang)}</option>)}
              </select>
            )}
            <Button size="sm" onClick={addItem}>+ {t(PT.addNew)}</Button>
          </div>
        </div>

        {/* Discount / fees */}
        <div className="mt-5 grid sm:grid-cols-3 gap-4">
          <Field label={t(PT.discount)}><input type="number" className={inputCls} value={inv.discount || 0} onChange={(e) => setInv({ ...inv, discount: Number(e.target.value) })} /></Field>
          <Field label={t({ en: "Fee Label", bn: "ফি লেবেল" })}><input className={inputCls} value={newFee.label_en} onChange={(e) => setNewFee({ ...newFee, label_en: e.target.value })} /></Field>
          <Field label={t({ en: "Fee Amount", bn: "ফি পরিমাণ" })}>
            <div className="flex gap-2">
              <input type="number" className={inputCls} value={newFee.amount} onChange={(e) => setNewFee({ ...newFee, amount: Number(e.target.value) })} />
              <Button size="sm" onClick={() => { if (!newFee.label_en.trim()) return; setInv({ ...inv, fees: [...(inv.fees || []), { id: uid("fee"), label: newFee.label_en, amount: newFee.amount }] }); setNewFee({ label_en: "", label_bn: "", amount: 0 }); }}>+</Button>
            </div>
          </Field>
        </div>
        {(inv.fees || []).map((f: any) => (
          <div key={f.id} className="mt-2 flex items-center justify-between rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-xs">
            <span className="font-semibold text-ink-700">{f.label}</span>
            <span className="flex items-center gap-3">
              <span className="font-bold text-ink-800">{money(f.amount, lang)}</span>
              <button className="text-red-500 font-bold" onClick={() => setInv({ ...inv, fees: inv.fees.filter((x: any) => x.id !== f.id) })}>✕</button>
            </span>
          </div>
        ))}

        {/* Totals */}
        <div className="mt-5 ml-auto w-64 space-y-1.5 text-sm">
          <div className="flex justify-between text-ink-500"><span>{t(PT.subtotal)}</span><span>{money(subtotal, lang)}</span></div>
          {inv.discount > 0 && <div className="flex justify-between text-emerald-600"><span>{t(PT.discount)}</span><span>−{money(inv.discount, lang)}</span></div>}
          {feesTotal > 0 && <div className="flex justify-between text-amber-600"><span>{t({ en: "Fees", bn: "ফি" })}</span><span>+{money(feesTotal, lang)}</span></div>}
          {tax > 0 && <div className="flex justify-between text-ink-500"><span>{t({ en: "Tax", bn: "ট্যাক্স" })}</span><span>+{money(tax, lang)}</span></div>}
          <div className="flex justify-between font-display font-bold text-ink-900 border-t border-ink-200 pt-2"><span>{t(PT.total)}</span><span>{money(total, lang)}</span></div>
          <div className="flex justify-between text-emerald-600"><span>{t({ en: "Paid", bn: "পরিশোধিত" })}</span><span>{money(paidTotal, lang)}</span></div>
          <div className="flex justify-between text-red-500 font-semibold"><span>{t({ en: "Due", bn: "বাকি" })}</span><span>{money(due, lang)}</span></div>
        </div>

        {/* Notes & terms */}
        <div className="mt-5 grid sm:grid-cols-2 gap-4">
          <Field label={t({ en: "Notes", bn: "নোট" })}><textarea rows={2} className={cn(inputCls, "resize-none")} value={inv.notes || ""} onChange={(e) => setInv({ ...inv, notes: e.target.value })} /></Field>
          <Field label={t({ en: "Terms", bn: "শর্তাবলি" })}><textarea rows={2} className={cn(inputCls, "resize-none")} value={inv.terms || ""} onChange={(e) => setInv({ ...inv, terms: e.target.value })} /></Field>
        </div>

        {/* Record payment */}
        <div className="mt-6 rounded-xl border border-brand-100 bg-brand-50/50 p-4">
          <h4 className="font-display font-bold text-sm text-ink-900 mb-3">{t({ en: "Record Payment", bn: "পেমেন্ট রেকর্ড করুন" })}</h4>
          <div className="grid sm:grid-cols-4 gap-3">
            <Field label={t(PT.amount)}><input type="number" className={inputCls} value={payAmount} onChange={(e) => setPayAmount(Number(e.target.value))} /></Field>
            <Field label={t({ en: "Method", bn: "মাধ্যম" })}>
              <select className={cn(inputCls, "appearance-none")} value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                {["bKash", "Nagad", "Bank Transfer", "Cash", "Other"].map((m) => <option key={m}>{m}</option>)}
              </select>
            </Field>
            <Field label={t({ en: "Note", bn: "নোট" })}><input className={inputCls} value={payNote} onChange={(e) => setPayNote(e.target.value)} /></Field>
            <div className="flex items-end pb-1"><Button size="sm" onClick={recordPayment}>{t({ en: "Record Payment", bn: "পেমেন্ট রেকর্ড" })}</Button></div>
          </div>
          {payments.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg bg-white border border-ink-100 px-3 py-2 text-xs">
                  <span className="text-ink-600">{p.method} · {p.note || p.by} · {fmtDateTime(p.created_at, lang)}</span>
                  <span className="font-bold text-emerald-600">+{money(p.amount, lang)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Printable invoice */}
        <div className="print-area hidden print:block mt-6">
          <div className="border-b-2 border-brand-600 pb-3">
            <p className="font-display font-bold text-xl text-brand-700">AL-KHUBAIB IT</p>
            <p className="text-xs">+880 9638 238 576 · contact@alkhubaibit.com</p>
          </div>
          <div className="mt-3 flex justify-between text-sm">
            <div><p className="font-bold">{inv.user_name}</p><p>{inv.user_email}</p></div>
            <div className="text-right"><p className="font-bold">{inv.no}</p><p>{inv.due_date ? `Due: ${inv.due_date}` : ""}</p></div>
          </div>
          <table className="mt-4 w-full text-sm">
            <tbody>
              {(inv.items || []).map((it: any, i: number) => (
                <tr key={i} className="border-b border-ink-100"><td className="py-2">{it.name?.en || it.name}</td><td className="text-center">{it.qty}</td><td className="text-right">{money(it.price * it.qty, "en")}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 ml-auto w-52 text-sm space-y-1">
            <div className="flex justify-between"><span>Subtotal</span><span>{money(subtotal, "en")}</span></div>
            {inv.discount > 0 && <div className="flex justify-between"><span>Discount</span><span>−{money(inv.discount, "en")}</span></div>}
            <div className="flex justify-between font-bold border-t border-ink-200 pt-1"><span>Total</span><span>{money(total, "en")}</span></div>
          </div>
          {inv.notes && <p className="mt-3 text-xs">{inv.notes}</p>}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ CALLBACK REQUESTS (Admin) ═══════════════ */

const CALLBACK_STATUSES = ["new", "pending", "in_progress", "contacted", "resolved", "cancelled"];

export function CallbacksView() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selected, setSelected] = useState<any | null>(null);
  const [filter, setFilter] = useState("all");
  const requests = all("callbacks").filter((c) => c.status !== "trashed").sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  const list = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const statusLabel: Record<string, { en: string; bn: string }> = {
    new: { en: "New", bn: "নতুন" }, pending: { en: "Pending", bn: "বিচারাধীন" },
    in_progress: { en: "In Progress", bn: "চলমান" }, contacted: { en: "Contacted", bn: "যোগাযোগ করা হয়েছে" },
    resolved: { en: "Resolved", bn: "সমাধান হয়েছে" }, cancelled: { en: "Cancelled", bn: "বাতিল" },
  };
  if (selected) {
    const setF = (p: any) => setSelected({ ...selected, ...p });
    return (
      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-6">
        <button onClick={() => setSelected(null)} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 mb-4">
          <Icon name="arrow" className="w-4 h-4 rotate-180" /> {t({ en: "Callback Requests", bn: "কলব্যাক রিকুয়েস্ট" })}
        </button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display font-bold text-xl text-ink-900">{selected.no}</h3>
            <p className="text-sm text-ink-400">{selected.name} · {selected.email} · {selected.phone}</p>
            <p className="text-xs text-ink-400 mt-0.5">{fmtDateTime(selected.created_at, lang)}</p>
          </div>
          <select
            className={cn(inputCls, "w-auto appearance-none")}
            value={selected.status}
            onChange={(e) => {
              update("callbacks", selected.id, { status: e.target.value });
              logAction(user!.email, "callback_status", `${selected.no} → ${e.target.value}`);
              setF({ status: e.target.value });
              toast({ type: "success", title: t({ en: "Status updated", bn: "স্ট্যাটাস আপডেট হয়েছে" }) });
            }}
          >
            {CALLBACK_STATUSES.map((s) => <option key={s} value={s}>{statusLabel[s]?.en || s}</option>)}
          </select>
        </div>
        <div className="mt-5 grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl bg-ink-50 p-4 text-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-400 mb-2">{t(PT.callbackSubject)}</p>
            <p className="font-semibold text-ink-800">{selected.subject}</p>
          </div>
          <div className="rounded-xl bg-ink-50 p-4 text-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-400 mb-2">{t(PT.callbackPriority)}</p>
            <p className="font-semibold text-ink-800 capitalize">{selected.priority}</p>
          </div>
          <div className="rounded-xl bg-ink-50 p-4 text-sm sm:col-span-2">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-400 mb-2">{t(PT.callbackMessage)}</p>
            <p className="text-ink-700 leading-relaxed">{selected.message}</p>
          </div>
        </div>
        <div className="mt-5 grid sm:grid-cols-2 gap-4">
          <Field label={t(PT.callbackAssigned)}>
            <input className={inputCls} value={selected.assigned || ""} onChange={(e) => setF({ assigned: e.target.value })}
              onBlur={(e) => { update("callbacks", selected.id, { assigned: e.target.value }); logAction(user!.email, "callback_assign", `${selected.no} → ${e.target.value || "—"}`); }} />
          </Field>
          <Field label={t(PT.callbackInternalNote)}>
            <input className={inputCls} value={selected.internal_note || ""} onChange={(e) => setF({ internal_note: e.target.value })}
              onBlur={(e) => { update("callbacks", selected.id, { internal_note: e.target.value }); logAction(user!.email, "callback_note", selected.no); }} />
          </Field>
        </div>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Button size="sm" href={`mailto:${selected.email}`}>
            <Icon name="mail" className="w-4 h-4" /> {t({ en: "Reply / Contact Client", bn: "উত্তর / যোগাযোগ করুন" })}
          </Button>
          <Button size="sm" variant="secondary" href={`https://wa.me/${String(selected.whatsapp || selected.phone).replace(/[^0-9]/g, "")}`}>
            <Icon name="whatsapp" className="w-4 h-4" /> WhatsApp
          </Button>
          <Button size="sm" variant="secondary" className="!text-red-600" onClick={() => {
            update("callbacks", selected.id, { status: "trashed" });
            logAction(user!.email, "callback_soft_delete", selected.no);
            toast({ type: "info", title: t({ en: "Request archived (soft delete)", bn: "রিকুয়েস্ট আর্কাইভ হয়েছে (সফট ডিলিট)" }) });
            setSelected(null);
          }}>
            {t({ en: "Archive", bn: "আর্কাইভ" })}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="font-display font-bold text-lg text-ink-900">{t({ en: "Callback Requests", bn: "কলব্যাক রিকুয়েস্ট" })} ({list.length})</h3>
        <div className="flex flex-wrap gap-2">
          <select className={cn(inputCls, "w-auto appearance-none")} value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">{t(PT.allItems)}</option>
            {CALLBACK_STATUSES.map((s) => <option key={s} value={s}>{statusLabel[s]?.en || s}</option>)}
          </select>
        </div>
      </div>
      <DataTable
        rows={list}
        searchKeys={["no", "name", "email", "phone", "subject", "message"]}
        filename="callback-requests.csv"
        emptyTitle={t({ en: "No callback requests.", bn: "কোনো কলব্যাক রিকুয়েস্ট নেই।" })}
        onRowClick={setSelected}
        columns={[
          { key: "no", label: t(PT.callbackRequestId), render: (r) => <span className="font-mono font-bold text-brand-700 text-xs">{r.no}</span> },
          { key: "name", label: t(PT.name), render: (r) => <span className="font-semibold text-ink-900">{r.name}</span> },
          { key: "phone", label: t(PT.mobile), render: (r) => <span className="text-ink-500">{r.phone}</span> },
          { key: "subject", label: t(PT.callbackSubject), render: (r) => <span className="text-ink-700 text-xs">{r.subject}</span> },
          { key: "created_at", label: t(PT.date), render: (r) => <span className="text-ink-500">{fmtDateTime(r.created_at, lang)}</span> },
          { key: "priority", label: t(PT.callbackPriority), render: (r) => <span className="text-ink-500 capitalize">{r.priority}</span> },
          { key: "assigned", label: t(PT.callbackAssigned), render: (r) => <span className="text-ink-500">{r.assigned || "—"}</span> },
          { key: "status", label: t(PT.status), render: (r) => <StatusBadge status={r.status} /> },
        ]}
      />
    </div>
  );
}

/* ═══════════════ USERS, ROLES & PERMISSIONS ═══════════════ */

export function UsersView() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<any>({ name: "", email: "", mobile: "", password: "", role: "client", admin_role: "" });
  const users = all("users");
  const roles = all("roles").filter((r) => r.name !== "client" && r.name !== "affiliate");

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg text-ink-900">{t({ en: "User Management", bn: "ইউজার ম্যানেজমেন্ট" })} ({users.length})</h3>
          <Button size="sm" onClick={() => setCreating(!creating)}>{t({ en: "Create User", bn: "ইউজার তৈরি করুন" })}</Button>
        </div>
        {creating && (
          <div className="mb-5 grid sm:grid-cols-3 gap-3 rounded-xl border border-brand-100 bg-brand-50/50 p-4">
            <Field label={t(PT.name)}><input className={inputCls} value={form.name} onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))} /></Field>
            <Field label={t(PT.email)}><input className={inputCls} value={form.email} onChange={(e) => setForm((f: any) => ({ ...f, email: e.target.value }))} /></Field>
            <Field label={t(PT.mobile)}><input className={inputCls} value={form.mobile} onChange={(e) => setForm((f: any) => ({ ...f, mobile: e.target.value }))} /></Field>
            <Field label={t(PT.password)}><input className={inputCls} value={form.password} onChange={(e) => setForm((f: any) => ({ ...f, password: e.target.value }))} /></Field>
            <Field label={t({ en: "Role", bn: "রোল" })}>
              <select className={cn(inputCls, "appearance-none")} value={form.role} onChange={(e) => setForm((f: any) => ({ ...f, role: e.target.value }))}>
                <option value="client">client</option><option value="affiliate">affiliate</option><option value="admin">admin</option><option value="super_admin">super_admin</option>
              </select>
            </Field>
            <Field label={t({ en: "Admin Role", bn: "অ্যাডমিন রোল" })}>
              <select className={cn(inputCls, "appearance-none")} value={form.admin_role} onChange={(e) => setForm((f: any) => ({ ...f, admin_role: e.target.value }))}>
                <option value="">—</option>
                {roles.map((r) => <option key={r.id} value={r.name}>{r.label}</option>)}
              </select>
            </Field>
            <Button size="sm" className="col-span-3" onClick={async () => {
              if (!form.name.trim() || !form.email.trim() || form.password.length < 8) { toast({ type: "warning", title: t({ en: "Fill all fields (password ≥ 8 chars)", bn: "সব ঘর পূরণ করুন (পাসওয়ার্ড ≥ ৮ অক্ষর)" }) }); return; }
              const { hashPassword } = await import("../lib/db");
              const salt = uid("s");
              const hash = await hashPassword(form.password, salt);
              insert("users", { name: form.name, email: form.email.trim(), mobile: form.mobile, role: form.role, admin_role: form.admin_role || "", salt, hash, status: "active", created_at: nowISO() });
              logAction(user!.email, "user_create", form.email);
              setForm({ name: "", email: "", mobile: "", password: "", role: "client", admin_role: "" });
              setCreating(false);
              toast({ type: "success", title: t({ en: "User created", bn: "ইউজার তৈরি হয়েছে" }) });
            }}>{t(PT.addNew)}</Button>
          </div>
        )}
        <DataTable
          rows={users}
          searchKeys={["name", "email", "mobile"]}
          filename="users.csv"
          emptyTitle={t({ en: "No users.", bn: "কোনো ইউজার নেই।" })}
          columns={[
            { key: "name", label: t({ en: "Name", bn: "নাম" }), render: (u) => <span className="font-bold text-ink-900">{u.name}</span> },
            { key: "email", label: t(PT.email), render: (u) => <span className="text-ink-500 break-all">{u.email}</span> },
            { key: "role", label: t({ en: "Role", bn: "রোল" }), render: (u) => (
              <select
                className={cn(inputCls, "w-auto appearance-none !py-1.5 text-xs")}
                value={u.role}
                disabled={u.id === user!.id}
                onChange={(e) => { update("users", u.id, { role: e.target.value }); logAction(user!.email, "role_change", `${u.email} → ${e.target.value}`); toast({ type: "success", title: t({ en: "Role updated", bn: "রোল আপডেট হয়েছে" }) }); }}
              >
                <option value="client">client</option><option value="affiliate">affiliate</option><option value="admin">admin</option><option value="super_admin">super_admin</option>
              </select>
            ) },
            { key: "status", label: t(PT.status), render: (u) => <StatusBadge status={u.status || "active"} /> },
            { key: "action", label: "", render: (u) => (
              <div className="flex gap-2">
                <button onClick={async () => {
                  const { hashPassword } = await import("../lib/db");
                  const temp = `AK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
                  const hash = await hashPassword(temp, u.salt || uid("s"));
                  update("users", u.id, { hash });
                  logAction(user!.email, "password_reset", u.email);
                  window.alert(`Temporary password for ${u.email}: ${temp}`);
                }} className="text-brand-600 font-bold text-xs">{t({ en: "Reset", bn: "রিসেট" })}</button>
                <button onClick={() => { update("users", u.id, { status: u.status === "suspended" ? "active" : "suspended" }); logAction(user!.email, u.status === "suspended" ? "user_activate" : "user_suspend", u.email); }} className="text-amber-600 font-bold text-xs">{u.status === "suspended" ? t({ en: "Activate", bn: "সক্রিয়" }) : t({ en: "Suspend", bn: "সাসপেন্ড" })}</button>
              </div>
            ) },
          ]}
        />
      </div>
    </div>
  );
}

export function RolesView() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState<any | null>(null);
  const roles = all("roles").filter((r) => r.name !== "super_admin" && r.name !== "admin" && r.name !== "client" && r.name !== "affiliate");

  if (editing) {
    const toggle = (m: string) => {
      const p = editing.permissions || [];
      const next = p.includes(m) ? p.filter((x: string) => x !== m) : [...p, m];
      setEditing({ ...editing, permissions: next });
    };
    return (
      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-7">
        <button onClick={() => setEditing(null)} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 mb-4">
          <Icon name="arrow" className="w-4 h-4 rotate-180" /> {t({ en: "Roles", bn: "রোল" })}
        </button>
        <div className="flex items-center gap-4">
          <h3 className="font-display font-bold text-xl text-ink-900">{t(PT.edit)}</h3>
          <input className={cn(inputCls, "max-w-xs")} value={editing.label || ""} onChange={(e) => setEditing({ ...editing, label: e.target.value })} />
        </div>
        <p className="mt-5 text-sm font-bold text-ink-800 mb-3">{t({ en: "Permissions (menu visibility + access)", bn: "পারমিশন (মেনু ভিজিবিলিটি + অ্যাক্সেস)" })}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {MODULES.map((m) => (
            <label key={m} className={cn("flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm font-semibold cursor-pointer transition-all", (editing.permissions || []).includes(m) ? "border-brand-400 bg-brand-50 text-brand-700" : "border-ink-200 text-ink-600 hover:border-brand-200")}>
              <input type="checkbox" className="w-4 h-4 accent-brand-600" checked={(editing.permissions || []).includes(m)} onChange={() => toggle(m)} />
              {m}
            </label>
          ))}
        </div>
        <Button className="mt-6" onClick={() => {
          if (editing.id === "new") {
            insert("roles", { name: editing.label.toLowerCase().replace(/\s+/g, "_"), label: editing.label, permissions: editing.permissions || [], created_at: nowISO() });
            logAction(user!.email, "role_create", editing.label);
          } else {
            update("roles", editing.id, editing);
            logAction(user!.email, "role_update", editing.label);
          }
          setEditing(null);
          toast({ type: "success", title: t({ en: "Role saved", bn: "রোল সংরক্ষণ হয়েছে" }) });
        }}>{t(PT.save)}</Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg text-ink-900">{t({ en: "Custom Roles", bn: "কাস্টম রোল" })} ({roles.length})</h3>
        <Button size="sm" onClick={() => setEditing({ id: "new", label: "", permissions: ["dashboard"] })}>{t({ en: "Create Role", bn: "রোল তৈরি করুন" })}</Button>
      </div>
      {!isSuperAdmin(user) ? (
        <EmptyState icon="lock" title={t({ en: "Super Admin only", bn: "শুধুমাত্র সুপার অ্যাডমিন" })} desc={t({ en: "Role and permission management is restricted to the Super Admin.", bn: "রোল ও পারমিশন ম্যানেজমেন্ট শুধুমাত্র সুপার অ্যাডমিনের জন্য।" })} />
      ) : (
        <div className="space-y-2.5">
          {roles.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-100 px-4 py-3">
              <div>
                <p className="font-bold text-ink-900 capitalize">{r.label}</p>
                <p className="text-xs text-ink-400">{(r.permissions || []).join(", ").slice(0, 80)}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing({ ...r })} className="text-brand-600 font-bold text-xs">{t(PT.edit)}</button>
                <button onClick={() => { remove("roles", r.id); logAction(user!.email, "role_delete", r.label); }} className="text-red-500 font-bold text-xs">{t(PT.delete)}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────── Forms ────────────────────────────── */

export function FormsView() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState<any | null>(null);
  const forms = all("forms").filter((f) => f.status !== "trashed");

  if (editing) {
    const setF = (p: any) => setEditing({ ...editing, ...p });
    const fields = editing.id === "new" ? (editing._fields || []) : all("form_fields").filter((f) => f.form_id === editing.id).sort((a, b) => (a.order || 0) - (b.order || 0));
    const updateFields = (nf: any[]) => setF({ _fields: nf });
    return (
      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-7">
        <button onClick={() => setEditing(null)} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 mb-4">
          <Icon name="arrow" className="w-4 h-4 rotate-180" /> {t({ en: "Forms", bn: "ফর্ম" })}
        </button>
        <h3 className="font-display font-bold text-xl text-ink-900 mb-5">{editing.id === "new" ? t({ en: "Add Form", bn: "ফর্ম যোগ করুন" }) : `${t(PT.edit)} — ${editing.name?.en}`}</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={`${t(PT.english)} · ${t({ en: "Form Name", bn: "ফর্মের নাম" })}`}><input className={inputCls} value={editing.name?.en || ""} onChange={(e) => setF({ name: { ...editing.name, en: e.target.value } })} /></Field>
          <Field label={`${t(PT.bangla)} · ${t({ en: "Form Name", bn: "ফর্মের নাম" })}`}><input className={inputCls} value={editing.name?.bn || ""} onChange={(e) => setF({ name: { ...editing.name, bn: e.target.value } })} /></Field>
          <Field label={t({ en: "Slug", bn: "স্লাগ" })}><input className={inputCls} value={editing.slug || ""} onChange={(e) => setF({ slug: e.target.value })} /></Field>
          <Field label={t({ en: "Redirect URL", bn: "রিডাইরেক্ট URL" })}><input className={inputCls} value={editing.settings?.redirect || ""} onChange={(e) => setF({ settings: { ...editing.settings, redirect: e.target.value } })} /></Field>
          <Field label={t({ en: "Success Message (EN)", bn: "সফলতার বার্তা (EN)" })}><input className={inputCls} value={editing.settings?.success_en || ""} onChange={(e) => setF({ settings: { ...editing.settings, success_en: e.target.value } })} /></Field>
          <Field label={t({ en: "Success Message (BN)", bn: "সফলতার বার্তা (BN)" })}><input className={inputCls} value={editing.settings?.success_bn || ""} onChange={(e) => setF({ settings: { ...editing.settings, success_bn: e.target.value } })} /></Field>
          <div className="flex gap-5 items-end pb-1">
            <label className="flex items-center gap-2 text-sm font-semibold text-ink-700">
              <input type="checkbox" className="w-4 h-4 accent-brand-600" checked={!!editing.settings?.email_notify} onChange={(e) => setF({ settings: { ...editing.settings, email_notify: e.target.checked } })} />
              {t({ en: "Email notification", bn: "ইমেইল নোটিফিকেশন" })}
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-ink-700">
              <input type="checkbox" className="w-4 h-4 accent-brand-600" checked={!!editing.settings?.telegram_notify} onChange={(e) => setF({ settings: { ...editing.settings, telegram_notify: e.target.checked } })} />
              {t({ en: "Telegram notification", bn: "টেলিগ্রাম নোটিফিকেশন" })}
            </label>
          </div>
        </div>

        <div className="mt-6 border-t border-ink-100 pt-5">
          <h4 className="font-display font-bold text-base text-ink-900 mb-3">{t({ en: "Form Fields", bn: "ফর্ম ফিল্ড" })}</h4>
          <div className="space-y-2">
            {fields.map((f: any, i: number) => (
              <div key={i} className="flex flex-wrap items-center gap-2.5 rounded-xl bg-ink-50 px-3 py-2.5 text-sm">
                <span className="w-6 h-6 rounded-md bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <input className={cn(inputCls, "!w-36 !py-1.5")} value={f.label?.en || ""} placeholder="Label EN" onChange={(e) => updateFields(fields.map((x: any, j: number) => (j === i ? { ...x, label: { ...x.label, en: e.target.value } } : x)))} />
                <input className={cn(inputCls, "!w-36 !py-1.5")} value={f.label?.bn || ""} placeholder="Label BN" onChange={(e) => updateFields(fields.map((x: any, j: number) => (j === i ? { ...x, label: { ...x.label, bn: e.target.value } } : x)))} />
                <select className={cn(inputCls, "!w-28 !py-1.5 appearance-none")} value={f.type || "text"} onChange={(e) => updateFields(fields.map((x: any, j: number) => (j === i ? { ...x, type: e.target.value } : x)))}>
                  {FIELD_TYPES.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
                </select>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-600">
                  <input type="checkbox" className="w-3.5 h-3.5 accent-brand-600" checked={!!f.required} onChange={(e) => updateFields(fields.map((x: any, j: number) => (j === i ? { ...x, required: e.target.checked } : x)))} />
                  {t({ en: "Req", bn: "আবশ্যক" })}
                </label>
                {(f.type === "select" || f.type === "radio" || f.type === "checkbox") && (
                  <input className={cn(inputCls, "!w-44 !py-1.5")} placeholder="Option1, Option2" value={(f.options || []).join(", ")} onChange={(e) => updateFields(fields.map((x: any, j: number) => (j === i ? { ...x, options: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) } : x)))} />
                )}
                <button className="ml-auto text-red-500 text-xs font-bold" onClick={() => updateFields(fields.filter((_: any, j: number) => j !== i))}>{t(PT.delete)}</button>
              </div>
            ))}
            <Button size="sm" variant="secondary" onClick={() => updateFields([...fields, { id: uid("ff"), label: { en: "New Field", bn: "নতুন ফিল্ড" }, type: "text", required: false, order: fields.length + 1 }])}>
              + {t(PT.addNew)}
            </Button>
          </div>
        </div>

        <Button className="mt-6" onClick={() => {
          const id = saveForm(editing.id, { name: editing.name, slug: editing.slug, settings: editing.settings, status: editing.status || "published" }, user!.email);
          saveFormFields(id, editing._fields || fields);
          setEditing(null);
          toast({ type: "success", title: t({ en: "Form saved", bn: "ফর্ম সংরক্ষণ হয়েছে" }) });
        }}>{t(PT.save)}</Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg text-ink-900">{t({ en: "Forms", bn: "ফর্ম" })} ({forms.length})</h3>
        <Button size="sm" onClick={() => setEditing({ id: "new", name: { en: "", bn: "" }, slug: "", status: "published", settings: { email_notify: true, telegram_notify: true, success_en: "", success_bn: "", redirect: "" }, _fields: [] })}>
          {t(PT.addNew)}
        </Button>
      </div>
      <DataTable
        rows={forms}
        searchKeys={["slug"]}
        emptyTitle={t({ en: "No forms.", bn: "কোনো ফর্ম নেই।" })}
        columns={[
          { key: "name", label: t({ en: "Form", bn: "ফর্ম" }), render: (f) => <span className="font-bold text-ink-900">{f.name?.en}</span> },
          { key: "slug", label: t({ en: "Slug", bn: "স্লাগ" }), render: (f) => <span className="text-ink-500 font-mono text-xs">{f.slug}</span> },
          { key: "fields", label: t({ en: "Fields", bn: "ফিল্ড" }), render: (f) => <span className="text-ink-500">{all("form_fields").filter((x) => x.form_id === f.id).length}</span> },
          { key: "subs", label: t({ en: "Submissions", bn: "জমা" }), render: (f) => <span className="text-ink-500">{all("form_submissions").filter((x) => x.form_id === f.id).length}</span> },
          { key: "status", label: t(PT.status), render: (f) => <StatusBadge status={f.status === "published" ? "active" : "cancelled"} /> },
          { key: "action", label: "", render: (f) => (
            <div className="flex gap-2">
              <button onClick={() => setEditing({ ...f })} className="text-brand-600 font-bold text-xs">{t(PT.edit)}</button>
              <button onClick={() => { remove("forms", f.id); logAction(user!.email, "form_delete", f.slug); }} className="text-red-500 font-bold text-xs">{t(PT.delete)}</button>
            </div>
          ) },
        ]}
      />
    </div>
  );
}

/* ─────────────────────── Submissions ──────────────────────── */

export function SubmissionsView() {
  const { t, lang } = useI18n();
  const subs = all("form_submissions").sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return (
    <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5">
      <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t({ en: "Form Submissions", bn: "ফর্ম সাবমিশন" })} ({subs.length})</h3>
      <DataTable
        rows={subs}
        searchKeys={["form_id"]}
        filename="form-submissions.csv"
        emptyTitle={t({ en: "No submissions yet.", bn: "এখনও কোনো সাবমিশন নেই।" })}
        columns={[
          { key: "id", label: t({ en: "Submission ID", bn: "সাবমিশন আইডি" }), render: (s) => <span className="font-mono text-xs text-ink-500">{String(s.id).slice(0, 12)}…</span> },
          { key: "form_id", label: t({ en: "Form", bn: "ফর্ম" }), render: (s) => <span className="font-bold text-ink-900">{get("forms", s.form_id)?.name?.en || s.form_id}</span> },
          { key: "data", label: t({ en: "Data", bn: "ডেটা" }), render: (s) => (
            <span className="text-ink-500 text-xs line-clamp-2">{Object.entries(s.data || {}).filter(([, v]) => v).map(([k, v]) => `${k}: ${String(v).slice(0, 30)}`).join(" · ")}</span>
          ) },
          { key: "created_at", label: t(PT.date), render: (s) => <span className="text-ink-500">{fmtDateTime(s.created_at, lang)}</span> },
          { key: "status", label: t(PT.status), render: (s) => <StatusBadge status={s.status} /> },
          { key: "action", label: "", render: (s) => (
            <div className="flex gap-2">
              <button onClick={() => update("form_submissions", s.id, { status: s.status === "pending" ? "processed" : "pending" })} className="text-brand-600 font-bold text-xs">{s.status === "pending" ? t({ en: "Mark processed", bn: "প্রসেসড করুন" }) : t({ en: "Mark pending", bn: "পেন্ডিং করুন" })}</button>
              <button onClick={() => { remove("form_submissions", s.id); }} className="text-red-500 font-bold text-xs">{t(PT.delete)}</button>
            </div>
          ) },
        ]}
      />
    </div>
  );
}

/* ═══════════════════ EMAIL + TELEGRAM COMMUNICATION ═════════ */

export function EmailTemplatesView() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState<any | null>(null);
  const templates = all("email_templates").filter((x) => x.channel === "email");

  if (editing) {
    const def = EVENTS.find((e) => e.key === editing.key);
    const sample = { name: "Aminul", email: "client@example.com", order_id: "AK-10293", invoice_id: "INV-2041", amount: "৳10,000", product: "Hosting Plan", service: "Web Development", affiliate: "akdemo", commission: "৳300", status: "Processing", renewal_date: "12 Sep 2027", company_name: "AL-KHUBAIB IT", dashboard_url: "https://my.alkhubaibit.com", date: new Date().toLocaleDateString("en-GB") };
    return (
      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-7">
        <button onClick={() => setEditing(null)} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 mb-4">
          <Icon name="arrow" className="w-4 h-4 rotate-180" /> {t({ en: "Email Templates", bn: "ইমেইল টেমপ্লেট" })}
        </button>
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-xl text-ink-900">{editing.key}</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => { insert("email_templates", { ...editing, id: undefined, key: editing.key + "_copy", created_at: nowISO() }); toast({ type: "success", title: t({ en: "Duplicated", bn: "ডুপ্লিকেট হয়েছে" }) }); }}>{t({ en: "Duplicate", bn: "ডুপ্লিকেট" })}</Button>
            <Button size="sm" variant="secondary" onClick={() => {
              notifyEvent(editing.key, sample);
              toast({ type: "info", title: t({ en: "Test event dispatched — check logs", bn: "টেস্ট ইভেন্ট পাঠানো হয়েছে — লগ দেখুন" }) });
            }}>{t({ en: "Test Send", bn: "টেস্ট পাঠান" })}</Button>
          </div>
        </div>
        {def && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {def.vars.map((v) => (
              <button key={v} onClick={() => navigator.clipboard?.writeText(`{${v}}`)} className="rounded-full bg-brand-50 border border-brand-200 text-brand-700 px-2.5 py-1 text-[11px] font-bold font-mono hover:bg-brand-100" title="Copy variable">
                {`{${v}}`}
              </button>
            ))}
          </div>
        )}
        <div className="mt-5 grid sm:grid-cols-2 gap-4">
          <Field label={`${t(PT.english)} · ${t({ en: "Subject", bn: "বিষয়" })}`}>
            <input className={inputCls} value={editing.subject?.en || ""} onChange={(e) => setEditing({ ...editing, subject: { ...editing.subject, en: e.target.value } })} />
          </Field>
          <Field label={`${t(PT.bangla)} · ${t({ en: "Subject", bn: "বিষয়" })}`}>
            <input className={inputCls} value={editing.subject?.bn || ""} onChange={(e) => setEditing({ ...editing, subject: { ...editing.subject, bn: e.target.value } })} />
          </Field>
          <div className="sm:col-span-2">
            <Field label={`${t(PT.english)} · ${t({ en: "Body", bn: "বডি" })}`}>
              <textarea rows={6} className={cn(inputCls, "resize-none font-mono text-xs")} value={editing.body?.en || ""} onChange={(e) => setEditing({ ...editing, body: { ...editing.body, en: e.target.value } })} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label={`${t(PT.bangla)} · ${t({ en: "Body", bn: "বডি" })}`}>
              <textarea rows={6} className={cn(inputCls, "resize-none font-mono text-xs")} value={editing.body?.bn || ""} onChange={(e) => setEditing({ ...editing, body: { ...editing.body, bn: e.target.value } })} />
            </Field>
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-ink-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-400 mb-2">{t({ en: "Preview", bn: "প্রিভিউ" })}</p>
          <p className="text-sm font-bold text-ink-900">{renderVars(editing.subject?.en || "", sample)}</p>
          <p className="text-xs text-ink-600 whitespace-pre-line mt-2">{renderVars(editing.body?.en || "", sample)}</p>
        </div>
        <Button className="mt-6" onClick={() => {
          update("email_templates", editing.id, editing);
          logAction(user!.email, "template_update", editing.key);
          setEditing(null);
          toast({ type: "success", title: t({ en: "Template saved", bn: "টেমপ্লেট সংরক্ষণ হয়েছে" }) });
        }}>{t(PT.save)}</Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5">
      <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t({ en: "Email Templates", bn: "ইমেইল টেমপ্লেট" })} ({templates.length})</h3>
      <DataTable
        rows={templates}
        searchKeys={["key"]}
        emptyTitle={t({ en: "No templates.", bn: "কোনো টেমপ্লেট নেই।" })}
        columns={[
          { key: "key", label: t({ en: "Event", bn: "ইভেন্ট" }), render: (x) => <span className="font-bold text-ink-900">{x.key}</span> },
          { key: "subject", label: t({ en: "Subject", bn: "বিষয়" }), render: (x) => <span className="text-ink-600 text-xs line-clamp-1">{x.subject?.en}</span> },
          { key: "enabled", label: t(PT.status), render: (x) => <StatusBadge status={x.enabled !== false ? "active" : "cancelled"} /> },
          { key: "action", label: "", render: (x) => (
            <div className="flex gap-2">
              <button onClick={() => setEditing({ ...x })} className="text-brand-600 font-bold text-xs">{t(PT.edit)}</button>
              <button onClick={() => { update("email_templates", x.id, { enabled: x.enabled === false }); }} className="text-amber-600 font-bold text-xs">{x.enabled === false ? t(PT.enabled) : t({ en: "Disable", bn: "নিষ্ক্রিয়" })}</button>
            </div>
          ) },
        ]}
      />
    </div>
  );
}

export function EmailLogsView() {
  const { t, lang } = useI18n();
  const logs = all("email_logs").sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return (
    <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5">
      <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t({ en: "Email Delivery Log", bn: "ইমেইল ডেলিভারি লগ" })} ({logs.length})</h3>
      <DataTable
        rows={logs}
        searchKeys={["key", "to", "subject"]}
        filename="email-logs.csv"
        emptyTitle={t({ en: "No emails logged yet.", bn: "এখনও কোনো ইমেইল লগ নেই।" })}
        columns={[
          { key: "to", label: t({ en: "Recipient", bn: "প্রাপক" }), render: (l) => <span className="text-ink-600">{l.to}</span> },
          { key: "subject", label: t({ en: "Subject", bn: "বিষয়" }), render: (l) => <span className="text-ink-700 text-xs">{l.subject}</span> },
          { key: "key", label: t({ en: "Template", bn: "টেমপ্লেট" }), render: (l) => <span className="text-ink-400 text-xs">{l.key}</span> },
          { key: "created_at", label: t(PT.date), render: (l) => <span className="text-ink-500">{fmtDateTime(l.created_at, lang)}</span> },
          { key: "status", label: t(PT.status), render: (l) => <StatusBadge status={l.status === "sent" ? "verified" : l.status === "failed" ? "rejected" : "pending"} /> },
          { key: "error", label: t({ en: "Note", bn: "নোট" }), render: (l) => <span className="text-ink-400 text-xs">{l.error || "—"}</span> },
        ]}
      />
    </div>
  );
}

export function SmtpView() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const settings = getSettings();
  const [smtp, setSmtp] = useState<any>({ ...(settings.smtp || {}) });
  return (
    <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-6">
      <h3 className="font-display font-bold text-lg text-ink-900 mb-2">{t({ en: "SMTP Settings", bn: "SMTP সেটিংস" })}</h3>
      <p className="text-xs text-ink-400 mb-5">{t({ en: "Credentials are stored securely in settings — never exposed to frontend users. Delivery requires the production mail relay.", bn: "ক্রেডেনশিয়াল সেটিংসে নিরাপদে সংরক্ষিত — ফ্রন্টএন্ড ইউজারদের কাছে প্রকাশ হয় না। ডেলিভারির জন্য প্রোডাকশন মেইল রিলে প্রয়োজন।" })}</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Field label="SMTP Host"><input className={inputCls} value={smtp.host || ""} onChange={(e) => setSmtp({ ...smtp, host: e.target.value })} /></Field>
        <Field label="SMTP Port"><input type="number" className={inputCls} value={smtp.port || 587} onChange={(e) => setSmtp({ ...smtp, port: Number(e.target.value) })} /></Field>
        <Field label={t({ en: "Encryption", bn: "এনক্রিপশন" })}>
          <select className={cn(inputCls, "appearance-none")} value={smtp.encryption || "tls"} onChange={(e) => setSmtp({ ...smtp, encryption: e.target.value })}>
            <option value="tls">TLS</option><option value="ssl">SSL</option><option value="none">None</option>
          </select>
        </Field>
        <Field label="SMTP Username"><input className={inputCls} value={smtp.username || ""} onChange={(e) => setSmtp({ ...smtp, username: e.target.value })} /></Field>
        <Field label="SMTP Password"><input type="password" className={inputCls} value={smtp.password || ""} onChange={(e) => setSmtp({ ...smtp, password: e.target.value })} /></Field>
        <Field label={t({ en: "From Name", bn: "প্রেরকের নাম" })}><input className={inputCls} value={smtp.from_name || "AL-KHUBAIB IT"} onChange={(e) => setSmtp({ ...smtp, from_name: e.target.value })} /></Field>
        <Field label={t({ en: "From Email", bn: "প্রেরকের ইমেইল" })}><input className={inputCls} value={smtp.from_email || ""} onChange={(e) => setSmtp({ ...smtp, from_email: e.target.value })} /></Field>
        <Field label="Reply-To"><input className={inputCls} value={smtp.reply_to || ""} onChange={(e) => setSmtp({ ...smtp, reply_to: e.target.value })} /></Field>
      </div>
      <div className="mt-5 flex gap-2.5">
        <Button onClick={() => { setSetting("smtp", smtp); logAction(user!.email, "smtp_update", "settings"); toast({ type: "success", title: t({ en: "SMTP settings saved", bn: "SMTP সেটিংস সংরক্ষণ হয়েছে" }) }); }}>{t(PT.save)}</Button>
        <Button variant="secondary" onClick={() => {
          if (!smtp.host) { toast({ type: "warning", title: t({ en: "Configure SMTP host first", bn: "প্রথমে SMTP হোস্ট কনফিগার করুন" }) }); return; }
          insert("email_logs", { key: "system_event", to: smtp.from_email || "—", subject: "SMTP Test — AL-KHUBAIB IT", status: "queued", error: smtp.host ? "" : "SMTP not configured", created_at: nowISO() });
          toast({ type: "info", title: t({ en: "Test queued — check Email Logs", bn: "টেস্ট কিউতে আছে — ইমেইল লগ দেখুন" }) });
        }}>{t({ en: "Test Email", bn: "টেস্ট ইমেইল" })}</Button>
      </div>
    </div>
  );
}

export function TelegramView() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const settings = getSettings();
  const [tg, setTg] = useState<any>({ ...(settings.telegram || {}) });
  const [busy, setBusy] = useState(false);

  const connect = async () => {
    setBusy(true);
    const r = await testTelegram(tg.botToken, tg.chatId);
    setBusy(false);
    if (r.ok) {
      setSetting("telegram", tg);
      logAction(user!.email, "telegram_connect", "settings");
      toast({ type: "success", title: r.desc, desc: t({ en: "Telegram notifications are now active.", bn: "টেলিগ্রাম নোটিফিকেশন এখন সক্রিয়।" }) });
    } else {
      toast({ type: "error", title: t({ en: "Connection failed", bn: "সংযোগ ব্যর্থ" }), desc: r.desc });
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-6">
        <h3 className="font-display font-bold text-lg text-ink-900 mb-2">{t({ en: "Telegram Notifications", bn: "টেলিগ্রাম নোটিফিকেশন" })}</h3>
        <p className="text-xs text-ink-400 mb-5">{t({ en: "Connect a Telegram bot to receive real-time business notifications. The bot token is stored securely and never exposed.", bn: "রিয়েল-টাইম নোটিফিকেশন পেতে টেলিগ্রাম বট কানেক্ট করুন। বট টোকেন নিরাপদে সংরক্ষিত, কখনো প্রকাশ করা হয় না।" })}</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Telegram Bot Token">
            <input type="password" className={inputCls} placeholder="123456789:AAH…" value={tg.botToken || ""} onChange={(e) => setTg({ ...tg, botToken: e.target.value })} />
          </Field>
          <Field label="Telegram Chat ID">
            <input className={inputCls} placeholder="-1001234567890" value={tg.chatId || ""} onChange={(e) => setTg({ ...tg, chatId: e.target.value })} />
          </Field>
        </div>
        <div className="mt-5 flex gap-2.5">
          <Button onClick={() => { if (!busy) connect(); }}>
            {busy ? <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : <Icon name="send" className="w-4 h-4" />}
            {t({ en: "Connect Telegram", bn: "টেলিগ্রাম কানেক্ট করুন" })}
          </Button>
          <Button variant="secondary" onClick={async () => {
            const r = await testTelegram(tg.botToken, tg.chatId);
            if (r.ok) toast({ type: "success", title: r.desc });
            else toast({ type: "error", title: t({ en: "Test failed", bn: "টেস্ট ব্যর্থ" }), desc: r.desc });
          }}>
            {t({ en: "Test Notification", bn: "টেস্ট নোটিফিকেশন" })}
          </Button>
          <Button variant="secondary" onClick={() => { setSetting("telegram", tg); logAction(user!.email, "telegram_save", "settings"); toast({ type: "success", title: t({ en: "Saved", bn: "সংরক্ষণ হয়েছে" }) }); }}>
            {t(PT.save)}
          </Button>
        </div>
      </div>

      {/* Telegram templates */}
      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-6">
        <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t({ en: "Telegram Message Templates", bn: "টেলিগ্রাম মেসেজ টেমপ্লেট" })}</h3>
        <div className="space-y-2.5">
          {EVENTS.slice(0, 12).map((e) => {
            const tpl = all("email_templates").find((x) => x.key === e.key && x.channel === "telegram");
            return (
              <div key={e.key} className="rounded-xl border border-ink-100 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-ink-900">{e.key}</p>
                  <label className="flex items-center gap-2 text-xs font-semibold text-ink-600">
                    <input type="checkbox" className="w-3.5 h-3.5 accent-brand-600" checked={tpl?.enabled !== false} onChange={(ev) => { if (tpl) update("email_templates", tpl.id, { enabled: ev.target.checked }); }} />
                    {t(PT.enabled)}
                  </label>
                </div>
                <textarea
                  rows={2}
                  className={cn(inputCls, "mt-2 resize-none font-mono text-xs")}
                  value={tpl?.text || e.telegram}
                  onBlur={(ev) => {
                    if (tpl) update("email_templates", tpl.id, { text: ev.target.value });
                    else insert("email_templates", { key: e.key, channel: "telegram", text: ev.target.value, enabled: true, created_at: nowISO() });
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <EventPrefsView />
    </div>
  );
}

export function TelegramLogsView() {
  const { t, lang } = useI18n();
  const logs = all("telegram_logs").sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return (
    <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5">
      <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t({ en: "Telegram Delivery Log", bn: "টেলিগ্রাম ডেলিভারি লগ" })} ({logs.length})</h3>
      <DataTable
        rows={logs}
        searchKeys={["key", "text"]}
        filename="telegram-logs.csv"
        emptyTitle={t({ en: "No Telegram messages yet.", bn: "এখনও কোনো টেলিগ্রাম মেসেজ নেই।" })}
        columns={[
          { key: "key", label: t({ en: "Event", bn: "ইভেন্ট" }), render: (l) => <span className="text-ink-400 text-xs">{l.key}</span> },
          { key: "text", label: t({ en: "Message", bn: "মেসেজ" }), render: (l) => <span className="text-ink-700 text-xs line-clamp-2">{l.text}</span> },
          { key: "created_at", label: t(PT.date), render: (l) => <span className="text-ink-500">{fmtDateTime(l.created_at, lang)}</span> },
          { key: "status", label: t(PT.status), render: (l) => <StatusBadge status={l.status === "sent" ? "verified" : l.status === "failed" ? "rejected" : "pending"} /> },
          { key: "error", label: t({ en: "Note", bn: "নোট" }), render: (l) => <span className="text-ink-400 text-xs">{l.error || "—"}</span> },
        ]}
      />
    </div>
  );
}

export function EventPrefsView() {
  const { t } = useI18n();
  const settings = getSettings();
  const prefs = settings.notification_prefs || {};
  const toggle = (key: string, channel: "email" | "telegram" | "dashboard") => {
    const p = prefs[key] || { email: true, telegram: true, dashboard: false };
    prefs[key] = { ...p, [channel]: !p[channel] };
    setSetting("notification_prefs", { ...prefs });
  };
  return (
    <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-6">
      <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t({ en: "Notification Events (Email / Telegram / Dashboard)", bn: "নোটিফিকেশন ইভেন্ট (ইমেইল / টেলিগ্রাম / ড্যাশবোর্ড)" })}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs font-bold uppercase tracking-wider text-ink-400">
              <th className="px-3 py-2">{t({ en: "Event", bn: "ইভেন্ট" })}</th>
              <th className="px-3 py-2 text-center">Email</th>
              <th className="px-3 py-2 text-center">Telegram</th>
              <th className="px-3 py-2 text-center">{t(PT.dashboard)}</th>
            </tr>
          </thead>
          <tbody>
            {EVENTS.map((e) => {
              const p = prefs[e.key] || { email: true, telegram: true, dashboard: false };
              return (
                <tr key={e.key} className="border-b border-ink-50">
                  <td className="px-3 py-2.5 font-semibold text-ink-800">{e.key}</td>
                  {(["email", "telegram", "dashboard"] as const).map((ch) => (
                    <td key={ch} className="px-3 py-2.5 text-center">
                      <button onClick={() => toggle(e.key, ch)} className={cn("w-10 h-6 rounded-full transition-colors relative", p[ch] ? "bg-emerald-500" : "bg-ink-200")} aria-label={`${e.key} ${ch}`}>
                        <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all", p[ch] ? "left-[18px]" : "left-0.5")} />
                      </button>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function MenusView() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const settings = getSettings();
  const [form, setForm] = useState<any>({
    labelEn: "", labelBn: "", href: "", order: (all("menu_items").length || 0) + 1,
    footerAboutEn: settings.footer?.about_en || "", footerAboutBn: settings.footer?.about_bn || "",
    addressEn: settings.footer?.address_en || "", facebook: settings.footer?.facebook || "",
    telegram: settings.footer?.telegram || "", messenger: settings.footer?.messenger || "",
  });
  const items = all("menu_items").filter((m) => m.status !== "trashed").sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5">
        <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t({ en: "Navigation Menu", bn: "নেভিগেশন মেনু" })} ({items.length})</h3>
        <div className="mb-5 grid sm:grid-cols-4 gap-3">
          <Field label={`${t(PT.english)} · ${t({ en: "Label", bn: "লেবেল" })}`}><input className={inputCls} value={form.labelEn} onChange={(e) => setForm((f: any) => ({ ...f, labelEn: e.target.value }))} /></Field>
          <Field label={`${t(PT.bangla)} · ${t({ en: "Label", bn: "লেবেল" })}`}><input className={inputCls} value={form.labelBn} onChange={(e) => setForm((f: any) => ({ ...f, labelBn: e.target.value }))} /></Field>
          <Field label={t({ en: "Link", bn: "লিংক" })}><input className={inputCls} placeholder="/services" value={form.href} onChange={(e) => setForm((f: any) => ({ ...f, href: e.target.value }))} /></Field>
          <Field label={t({ en: "Order", bn: "ক্রম" })}><input type="number" className={inputCls} value={form.order} onChange={(e) => setForm((f: any) => ({ ...f, order: Number(e.target.value) }))} /></Field>
          <Button size="sm" className="col-span-4" onClick={() => {
            if (!form.labelEn.trim() || !form.href.trim()) { toast({ type: "warning", title: t(PT.errRequired) }); return; }
            insert("menu_items", { label: { en: form.labelEn, bn: form.labelBn || form.labelEn }, href: form.href, order: form.order, enabled: true, type: "link", created_at: nowISO() });
            logAction(user!.email, "menu_create", form.href);
            setForm((f: any) => ({ ...f, labelEn: "", labelBn: "", href: "", order: items.length + 2 }));
            toast({ type: "success", title: t({ en: "Menu item added", bn: "মেনু আইটেম যোগ হয়েছে" }) });
          }}>{t(PT.addNew)}</Button>
        </div>
        <div className="space-y-2">
          {items.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-100 px-4 py-2.5 text-sm">
              <div>
                <p className="font-bold text-ink-900">{m.label?.en} <span className="text-ink-400">·</span> {m.label?.bn}</p>
                <p className="text-xs text-ink-400 font-mono">{m.href}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={m.enabled ? "active" : "cancelled"} />
                <button onClick={() => { update("menu_items", m.id, { enabled: !m.enabled }); logAction(user!.email, "menu_toggle", m.href); }} className="text-brand-600 font-bold text-xs">{m.enabled ? t({ en: "Disable", bn: "নিষ্ক্রিয়" }) : t(PT.enabled)}</button>
                <button onClick={() => { update("menu_items", m.id, { status: "trashed" }); logAction(user!.email, "menu_delete", m.href); }} className="text-red-500 font-bold text-xs">{t(PT.delete)}</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5">
        <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t({ en: "Footer Content", bn: "ফুটার কনটেন্ট" })}</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={`${t(PT.english)} · ${t({ en: "About Text", bn: "পরিচিতি" })}`}><textarea rows={2} className={cn(inputCls, "resize-none")} value={form.footerAboutEn} onChange={(e) => setForm((f: any) => ({ ...f, footerAboutEn: e.target.value }))} /></Field>
          <Field label={`${t(PT.bangla)} · ${t({ en: "About Text", bn: "পরিচিতি" })}`}><textarea rows={2} className={cn(inputCls, "resize-none")} value={form.footerAboutBn} onChange={(e) => setForm((f: any) => ({ ...f, footerAboutBn: e.target.value }))} /></Field>
          <Field label={t({ en: "Address", bn: "ঠিকানা" })}><input className={inputCls} value={form.addressEn} onChange={(e) => setForm((f: any) => ({ ...f, addressEn: e.target.value }))} /></Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Facebook"><input className={inputCls} value={form.facebook} onChange={(e) => setForm((f: any) => ({ ...f, facebook: e.target.value }))} /></Field>
            <Field label="Telegram"><input className={inputCls} value={form.telegram} onChange={(e) => setForm((f: any) => ({ ...f, telegram: e.target.value }))} /></Field>
            <Field label="Messenger"><input className={inputCls} value={form.messenger} onChange={(e) => setForm((f: any) => ({ ...f, messenger: e.target.value }))} /></Field>
          </div>
        </div>
        <Button className="mt-5" onClick={() => {
          setSetting("footer", { about_en: form.footerAboutEn, about_bn: form.footerAboutBn, address_en: form.addressEn, facebook: form.facebook, telegram: form.telegram, messenger: form.messenger });
          logAction(user!.email, "footer_update", "footer");
          toast({ type: "success", title: t({ en: "Footer saved", bn: "ফুটার সংরক্ষণ হয়েছে" }) });
        }}>{t(PT.save)}</Button>
      </div>
    </div>
  );
}

/* ─────────────────────── Categories ───────────────────────── */

export function CategoriesView() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState<any | null>(null);
  const cats = all("categories").sort((a, b) => (a.order || 0) - (b.order || 0));

  if (editing) {
    const setF = (p: any) => setEditing({ ...editing, ...p });
    return (
      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-7">
        <button onClick={() => setEditing(null)} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 mb-4">
          <Icon name="arrow" className="w-4 h-4 rotate-180" /> {t({ en: "Categories", bn: "ক্যাটাগরি" })}
        </button>
        <h3 className="font-display font-bold text-xl text-ink-900 mb-5">{editing.id === "new" ? t(PT.addNew) : t(PT.edit)}</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={`${t(PT.english)} · ${t({ en: "Name", bn: "নাম" })}`}><input className={inputCls} value={editing.name?.en || ""} onChange={(e) => setF({ name: { ...editing.name, en: e.target.value } })} /></Field>
          <Field label={`${t(PT.bangla)} · ${t({ en: "Name", bn: "নাম" })}`}><input className={inputCls} value={editing.name?.bn || ""} onChange={(e) => setF({ name: { ...editing.name, bn: e.target.value } })} /></Field>
          <Field label={t({ en: "Parent Category", bn: "প্যারেন্ট ক্যাটাগরি" })}>
            <select className={cn(inputCls, "appearance-none")} value={editing.parent_id || ""} onChange={(e) => setF({ parent_id: e.target.value })}>
              <option value="">—</option>
              {cats.filter((c) => c.id !== editing.id).map((c) => <option key={c.id} value={c.id}>{c.name?.en}</option>)}
            </select>
          </Field>
          <Field label={t({ en: "Order", bn: "ক্রম" })}><input type="number" className={inputCls} value={editing.order || 0} onChange={(e) => setF({ order: Number(e.target.value) })} /></Field>
          <Field label={t({ en: "Commission Type", bn: "কমিশনের ধরন" })}>
            <select className={cn(inputCls, "appearance-none")} value={editing.commission?.type || "percent"} onChange={(e) => setF({ commission: { ...editing.commission, type: e.target.value } })}>
              <option value="percent">{t(PT.percent)}</option><option value="fixed">{t(PT.fixed)}</option>
            </select>
          </Field>
          <Field label={t({ en: "Initial Commission", bn: "প্রথম কমিশন" })}><input type="number" className={inputCls} value={editing.commission?.initial || 0} onChange={(e) => setF({ commission: { ...editing.commission, initial: Number(e.target.value) } })} /></Field>
          <Field label={t({ en: "Renewal Commission", bn: "নবায়ন কমিশন" })}><input type="number" className={inputCls} value={editing.commission?.renewal || 0} onChange={(e) => setF({ commission: { ...editing.commission, renewal: Number(e.target.value) } })} /></Field>
          <label className="flex items-center gap-2 text-sm font-semibold text-ink-700 pb-1">
            <input type="checkbox" className="w-4 h-4 accent-brand-600" checked={!!editing.commission?.renewalEnabled} onChange={(e) => setF({ commission: { ...editing.commission, renewalEnabled: e.target.checked } })} />
            {t({ en: "Renewal commission", bn: "নবায়ন কমিশন" })}
          </label>
        </div>
        <Button className="mt-6" onClick={() => {
          if (editing.id === "new") { insert("categories", { ...editing, id: undefined, created_at: nowISO() }); logAction(user!.email, "category_create", editing.name?.en); }
          else { update("categories", editing.id, editing); logAction(user!.email, "category_update", editing.name?.en); }
          setEditing(null);
          toast({ type: "success", title: t({ en: "Category saved", bn: "ক্যাটাগরি সংরক্ষণ হয়েছে" }) });
        }}>{t(PT.save)}</Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg text-ink-900">{t({ en: "Categories", bn: "ক্যাটাগরি" })} ({cats.length})</h3>
        <Button size="sm" onClick={() => setEditing({ id: "new", name: { en: "", bn: "" }, parent_id: "", order: cats.length + 1, commission: { type: "percent", initial: 10, renewal: 0, renewalEnabled: false } })}>
          {t(PT.addNew)}
        </Button>
      </div>
      <DataTable
        rows={cats}
        searchKeys={["name"]}
        emptyTitle={t({ en: "No categories.", bn: "কোনো ক্যাটাগরি নেই।" })}
        columns={[
          { key: "name", label: t({ en: "Name", bn: "নাম" }), render: (c) => <span className="font-bold text-ink-900">{c.name?.en}</span> },
          { key: "parent_id", label: t({ en: "Parent", bn: "প্যারেন্ট" }), render: (c) => <span className="text-ink-500">{c.parent_id ? get("categories", c.parent_id)?.name?.en || c.parent_id : "—"}</span> },
          { key: "commission", label: t(PT.commission), render: (c) => <span className="text-ink-500">{c.commission?.initial}{c.commission?.type === "fixed" ? "" : "%"}{c.commission?.renewalEnabled ? ` + ${c.commission?.renewal}% rnw` : ""}</span> },
          { key: "action", label: "", render: (c) => (
            <div className="flex gap-2">
              <button onClick={() => setEditing({ ...c })} className="text-brand-600 font-bold text-xs">{t(PT.edit)}</button>
              <button onClick={() => { remove("categories", c.id); logAction(user!.email, "category_delete", c.name?.en); }} className="text-red-500 font-bold text-xs">{t(PT.delete)}</button>
            </div>
          ) },
        ]}
      />
    </div>
  );
}
