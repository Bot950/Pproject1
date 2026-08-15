import { useState } from "react";
import { Icon } from "../components/Icons";
import { Button } from "../components/ui";
import { useI18n } from "../lib/i18n";
import { all, money, fmtDateTime } from "../lib/db";
import { PT } from "../lib/portalText";

export function InvoiceModal({ order }: { order: any }) {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const invoice = all("invoices").find((i) => i.order_id === order.id);
  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Icon name="doc" className="w-4 h-4" /> {t(PT.viewInvoice)}
      </Button>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="p-8 print-area">
              <div className="flex items-start justify-between border-b-2 border-brand-600 pb-5">
                <div>
                  <p className="font-display font-bold text-xl text-brand-700">AL-KHUBAIB IT</p>
                  <p className="text-xs text-ink-400 mt-1">+880 9638 238 576 · contact@alkhubaibit.com · my.alkhubaibit.com</p>
                </div>
                <div className="text-right">
                  <p className="font-display font-bold text-lg text-ink-900">{t(PT.invoices)}</p>
                  <p className="text-sm text-ink-500">{invoice?.no || "—"}</p>
                  <p className="text-xs text-ink-400 mt-1">{fmtDateTime(order.created_at, lang)}</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-bold text-ink-900">{t({ en: "Billed To", bn: "গ্রাহক" })}</p>
                  <p className="text-ink-600 mt-1">{order.user_name}</p>
                  <p className="text-ink-400 break-all">{order.user_email}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-ink-900">{t({ en: "Order", bn: "অর্ডার" })}</p>
                  <p className="text-ink-600 mt-1">#{order.no}</p>
                  <p className="text-ink-400">{order.payment_method} · {order.payment_status}</p>
                </div>
              </div>
              <table className="mt-6 w-full text-sm">
                <thead>
                  <tr className="bg-ink-50 text-left text-ink-500">
                    <th className="px-3 py-2.5 rounded-l-lg">{t({ en: "Item", bn: "আইটেম" })}</th>
                    <th className="px-3 py-2.5">{t({ en: "Qty", bn: "পরিমাণ" })}</th>
                    <th className="px-3 py-2.5 text-right rounded-r-lg">{t(PT.amount)}</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((it: any, i: number) => (
                    <tr key={i} className="border-b border-ink-100">
                      <td className="px-3 py-2.5 font-medium text-ink-800">{typeof it.name === "string" ? it.name : it.name?.en}</td>
                      <td className="px-3 py-2.5 text-ink-500">{it.qty}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-ink-700">{money(it.price * it.qty, "en")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 ml-auto w-56 space-y-1.5 text-sm">
                <div className="flex justify-between text-ink-500"><span>{t(PT.subtotal)}</span><span>{money(order.subtotal, "en")}</span></div>
                {order.discount > 0 && <div className="flex justify-between text-emerald-600"><span>{t(PT.discount)}</span><span>−{money(order.discount, "en")}</span></div>}
                <div className="flex justify-between font-display font-bold text-ink-900 text-base border-t border-ink-200 pt-2"><span>{t(PT.total)}</span><span>{money(order.total, "en")}</span></div>
              </div>
              <p className="mt-6 text-[11px] text-ink-400">© 2026 AL-KHUBAIB IT. All rights reserved. · Powered by Aminul Khan Group</p>
            </div>
            <div className="flex justify-end gap-2.5 px-8 pb-6 print:hidden">
              <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>{t(PT.cancel)}</Button>
              <Button size="sm" onClick={() => window.print()}>{t(PT.printInvoice)}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
