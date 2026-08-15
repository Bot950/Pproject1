// ─────────────────────────────────────────────────────────────
// Central Notification Engine
// Every business event flows through one dispatcher:
//   Event → Email (template + SMTP) → Telegram (bot) → Dashboard
// Channels are toggled per event from the Admin panel.
// ─────────────────────────────────────────────────────────────
import { insert, where, getSettings, setNotifyHook, nowISO, setSetting } from "./db";
import type { L10n } from "./i18n";

export type EventDef = {
  key: string;
  label: L10n;
  vars: string[];
  email: { subject: L10n; body: L10n };
  telegram: string;
};

export const EVENTS: EventDef[] = [
  { key: "registration", label: { en: "New Registration", bn: "নতুন রেজিস্ট্রেশন" }, vars: ["name", "email", "date"], email: { subject: { en: "Welcome to AL-KHUBAIB IT", bn: "AL-KHUBAIB IT-এ স্বাগতম" }, body: { en: "Hello {name},\n\nYour account has been created at AL-KHUBAIB IT.\n\nDashboard: {dashboard_url}", bn: "প্রিয় {name},\n\nAL-KHUBAIB IT-এ আপনার অ্যাকাউন্ট তৈরি হয়েছে।\n\nড্যাশবোর্ড: {dashboard_url}" } }, telegram: "🎉 New Registration\nName: {name}\nEmail: {email}\nDate: {date}" },
  { key: "order_created", label: { en: "New Order", bn: "নতুন অর্ডার" }, vars: ["order_id", "name", "amount", "date"], email: { subject: { en: "Order {order_id} placed", bn: "অর্ডার {order_id} গৃহীত হয়েছে" }, body: { en: "Hello {name},\n\nYour order {order_id} ({amount}) has been placed.", bn: "প্রিয় {name},\n\nআপনার অর্ডার {order_id} ({amount}) গৃহীত হয়েছে।" } }, telegram: "🔔 New Order\nOrder: {order_id}\nCustomer: {name}\nAmount: {amount}\nDate: {date}" },
  { key: "payment_received", label: { en: "Payment Received", bn: "পেমেন্ট গৃহীত" }, vars: ["order_id", "name", "amount", "method", "date"], email: { subject: { en: "Payment received — Order {order_id}", bn: "পেমেন্ট গৃহীত — অর্ডার {order_id}" }, body: { en: "Payment of {amount} received for order {order_id}.", bn: "অর্ডার {order_id}-এর জন্য {amount} পেমেন্ট গৃহীত হয়েছে।" } }, telegram: "✅ Payment Received\nOrder: {order_id}\nAmount: {amount}\nMethod: {method}" },
  { key: "payment_failed", label: { en: "Payment Failed", bn: "পেমেন্ট ব্যর্থ" }, vars: ["order_id", "amount", "date"], email: { subject: { en: "Payment failed — Order {order_id}", bn: "পেমেন্ট ব্যর্থ — অর্ডার {order_id}" }, body: { en: "Payment for order {order_id} could not be completed.", bn: "অর্ডার {order_id}-এর পেমেন্ট সম্পন্ন হয়নি।" } }, telegram: "❌ Payment Failed\nOrder: {order_id}\nAmount: {amount}" },
  { key: "order_completed", label: { en: "Order Completed", bn: "অর্ডার সম্পন্ন" }, vars: ["order_id", "name", "date"], email: { subject: { en: "Order {order_id} completed", bn: "অর্ডার {order_id} সম্পন্ন হয়েছে" }, body: { en: "Order {order_id} has been completed.", bn: "অর্ডার {order_id} সম্পন্ন হয়েছে।" } }, telegram: "🏁 Order Completed: {order_id}" },
  { key: "order_cancelled", label: { en: "Order Cancelled", bn: "অর্ডার বাতিল" }, vars: ["order_id", "date"], email: { subject: { en: "Order {order_id} cancelled", bn: "অর্ডার {order_id} বাতিল হয়েছে" }, body: { en: "Order {order_id} was cancelled.", bn: "অর্ডার {order_id} বাতিল করা হয়েছে।" } }, telegram: "🚫 Order Cancelled: {order_id}" },
  { key: "invoice_created", label: { en: "Invoice Created", bn: "ইনভয়েস তৈরি" }, vars: ["invoice_id", "name", "amount", "due_date", "date"], email: { subject: { en: "Invoice {invoice_id} — AL-KHUBAIB IT", bn: "ইনভয়েস {invoice_id} — AL-KHUBAIB IT" }, body: { en: "Hello {name},\n\nInvoice {invoice_id} for {amount} has been created. Due: {due_date}.\n\nView invoice: {dashboard_url}", bn: "প্রিয় {name},\n\n{amount}-এর ইনভয়েস {invoice_id} তৈরি হয়েছে। মেয়াদ: {due_date}।\n\nইনভয়েস দেখুন: {dashboard_url}" } }, telegram: "🧾 New Invoice\nInvoice: {invoice_id}\nAmount: {amount}\nDue: {due_date}" },
  { key: "invoice_paid", label: { en: "Invoice Paid", bn: "ইনভয়েস পরিশোধিত" }, vars: ["invoice_id", "amount", "date"], email: { subject: { en: "Invoice {invoice_id} paid", bn: "ইনভয়েস {invoice_id} পরিশোধিত" }, body: { en: "Invoice {invoice_id} has been paid.", bn: "ইনভয়েস {invoice_id} পরিশোধিত হয়েছে।" } }, telegram: "💰 Invoice Paid: {invoice_id} ({amount})" },
  { key: "invoice_overdue", label: { en: "Invoice Overdue", bn: "ইনভয়েস ওভারডিউ" }, vars: ["invoice_id", "amount", "due_date"], email: { subject: { en: "Invoice {invoice_id} overdue", bn: "ইনভয়েস {invoice_id} ওভারডিউ" }, body: { en: "Invoice {invoice_id} is overdue.", bn: "ইনভয়েস {invoice_id} ওভারডিউ।" } }, telegram: "⏰ Invoice Overdue: {invoice_id}" },
  { key: "subscription_renewal", label: { en: "Renewal Reminder", bn: "নবায়ন রিমাইন্ডার" }, vars: ["name", "service", "renewal_date", "amount"], email: { subject: { en: "Renewal reminder — {service}", bn: "নবায়ন রিমাইন্ডার — {service}" }, body: { en: "Your {service} renews on {renewal_date} ({amount}).", bn: "আপনার {service} {renewal_date}-এ নবায়ন হবে ({amount})।" } }, telegram: "🔁 Renewal: {service} → {renewal_date} ({amount})" },
  { key: "affiliate_application", label: { en: "Affiliate Application", bn: "এফিলিয়েট আবেদন" }, vars: ["name", "email", "date"], email: { subject: { en: "Affiliate application received", bn: "এফিলিয়েট আবেদন গৃহীত" }, body: { en: "Hello {name},\n\nYour affiliate application is under review.", bn: "প্রিয় {name},\n\nআপনার এফিলিয়েট আবেদন পর্যালোচনাধীন।" } }, telegram: "🤝 New Affiliate Application\nName: {name}\nEmail: {email}" },
  { key: "affiliate_approved", label: { en: "Affiliate Approved", bn: "এফিলিয়েট অনুমোদিত" }, vars: ["name", "date"], email: { subject: { en: "Affiliate application approved", bn: "এফিলিয়েট আবেদন অনুমোদিত" }, body: { en: "Congratulations {name} — your application is approved. Complete KYC to activate.", bn: "অভিনন্দন {name} — আপনার আবেদন অনুমোদিত হয়েছে। সক্রিয় করতে KYC সম্পন্ন করুন।" } }, telegram: "✅ Affiliate Approved: {name}" },
  { key: "affiliate_rejected", label: { en: "Affiliate Rejected", bn: "এফিলিয়েট প্রত্যাখ্যাত" }, vars: ["name", "reason"], email: { subject: { en: "Affiliate application update", bn: "এফিলিয়েট আবেদন আপডেট" }, body: { en: "Your application was rejected. Reason: {reason}", bn: "আপনার আবেদন প্রত্যাখ্যাত হয়েছে। কারণ: {reason}" } }, telegram: "❌ Affiliate Rejected: {name} ({reason})" },
  { key: "kyc_submitted", label: { en: "KYC Submitted", bn: "KYC জমা হয়েছে" }, vars: ["name", "date"], email: { subject: { en: "KYC submitted", bn: "KYC জমা হয়েছে" }, body: { en: "Your KYC documents were submitted and are under review.", bn: "আপনার KYC ডকুমেন্ট জমা হয়েছে এবং পর্যালোচনাধীন।" } }, telegram: "🪪 New KYC: {name}" },
  { key: "kyc_verified", label: { en: "KYC Verified", bn: "KYC যাচাইকৃত" }, vars: ["name", "date"], email: { subject: { en: "KYC verified — account activated", bn: "KYC যাচাই সম্পন্ন — অ্যাকাউন্ট সক্রিয়" }, body: { en: "Your affiliate account is now fully active.", bn: "আপনার এফিলিয়েট অ্যাকাউন্ট এখন সম্পূর্ণ সক্রিয়।" } }, telegram: "✅ KYC Verified: {name}" },
  { key: "kyc_rejected", label: { en: "KYC Rejected", bn: "KYC প্রত্যাখ্যাত" }, vars: ["name", "reason"], email: { subject: { en: "KYC rejected", bn: "KYC প্রত্যাখ্যাত" }, body: { en: "KYC rejected. Reason: {reason}. You may resubmit.", bn: "KYC প্রত্যাখ্যাত। কারণ: {reason}। পুনরায় জমা দিতে পারবেন।" } }, telegram: "❌ KYC Rejected: {name} ({reason})" },
  { key: "commission_generated", label: { en: "Commission Generated", bn: "কমিশন তৈরি" }, vars: ["affiliate", "commission", "product", "date"], email: { subject: { en: "Commission earned", bn: "কমিশন আয় হয়েছে" }, body: { en: "You earned {commission} for {product}.", bn: "{product}-এর জন্য আপনি {commission} কমিশন আয় করেছেন।" } }, telegram: "💸 Commission: {affiliate} +{commission} ({product})" },
  { key: "commission_approved", label: { en: "Commission Approved", bn: "কমিশন অনুমোদিত" }, vars: ["affiliate", "commission", "date"], email: { subject: { en: "Commission approved", bn: "কমিশন অনুমোদিত" }, body: { en: "Commission of {commission} was approved.", bn: "{commission} কমিশন অনুমোদিত হয়েছে।" } }, telegram: "✅ Commission Approved: {affiliate} {commission}" },
  { key: "withdrawal_requested", label: { en: "Withdrawal Requested", bn: "উইথড্রয়াল অনুরোধ" }, vars: ["affiliate", "amount", "method", "date"], email: { subject: { en: "Withdrawal requested", bn: "উইথড্রয়াল অনুরোধ" }, body: { en: "Withdrawal of {amount} requested via {method}.", bn: "{method}-এ {amount} উইথড্রয়াল অনুরোধ করা হয়েছে।" } }, telegram: "🏦 Withdrawal Request: {affiliate} {amount} via {method}" },
  { key: "withdrawal_paid", label: { en: "Withdrawal Paid", bn: "উইথড্রয়াল পরিশোধিত" }, vars: ["affiliate", "amount", "date"], email: { subject: { en: "Withdrawal paid", bn: "উইথড্রয়াল পরিশোধিত" }, body: { en: "Your withdrawal of {amount} has been paid.", bn: "আপনার {amount} উইথড্রয়াল পরিশোধিত হয়েছে।" } }, telegram: "✅ Withdrawal Paid: {affiliate} {amount}" },
  { key: "new_ticket", label: { en: "New Support Ticket", bn: "নতুন সাপোর্ট টিকিট" }, vars: ["name", "subject", "date"], email: { subject: { en: "Ticket received — {subject}", bn: "টিকিট গৃহীত — {subject}" }, body: { en: "Your support ticket was received.", bn: "আপনার সাপোর্ট টিকিট গৃহীত হয়েছে।" } }, telegram: "🎫 New Ticket: {subject} by {name}" },
  { key: "manual_payment", label: { en: "Manual Payment Submitted", bn: "ম্যানুয়াল পেমেন্ট জমা" }, vars: ["name", "amount", "method", "trx", "date"], email: { subject: { en: "Manual payment submitted", bn: "ম্যানুয়াল পেমেন্ট জমা হয়েছে" }, body: { en: "{name} submitted {amount} via {method} (Trx: {trx}).", bn: "{name} {method}-এ {amount} জমা দিয়েছেন (Trx: {trx})।" } }, telegram: "🏧 Manual Payment: {name} {amount} via {method} (Trx: {trx})" },
  { key: "callback_client", label: { en: "Callback — Client Confirmation", bn: "কলব্যাক — ক্লায়েন্ট নিশ্চিতকরণ" }, vars: ["name", "request_id", "subject", "date"], email: { subject: { en: "Callback Request Received - AL KHUBAIB IT", bn: "কলব্যাক রিকুয়েস্ট গৃহীত হয়েছে - AL KHUBAIB IT" }, body: { en: "Hello {name},\n\nYour callback request has been submitted successfully.\n\nRequest ID: {request_id}\nSubject: {subject}\nSubmitted: {date}\n\nOur expert team will contact you within 24 hours.", bn: "প্রিয় {name},\n\nআপনার কলব্যাক রিকুয়েস্টটি সফলভাবে সাবমিট হয়েছে।\n\nরিকুয়েস্ট আইডি: {request_id}\nবিষয়: {subject}\nজমা হয়েছে: {date}\n\nআগামী ২৪ ঘণ্টার মধ্যে আমাদের এক্সপার্ট টিম আপনার সাথে যোগাযোগ করবে।" } }, telegram: "🔔 NEW CALLBACK REQUEST\nRequest ID: {request_id}\nClient: {name}\nPhone: {phone}\nEmail: {email}\nIssue: {subject}\nStatus: New\nDate: {date}" },
  { key: "callback_admin", label: { en: "Callback — Admin Notification", bn: "কলব্যাক — অ্যাডমিন নোটিফিকেশন" }, vars: ["request_id", "name", "phone", "email", "subject", "message", "status", "date"], email: { subject: { en: "NEW CALLBACK REQUEST — {request_id}", bn: "নতুন কলব্যাক রিকুয়েস্ট — {request_id}" }, body: { en: "Request ID: {request_id}\nClient: {name}\nPhone: {phone}\nEmail: {email}\nIssue: {subject}\nMessage: {message}\nStatus: {status}", bn: "রিকুয়েস্ট আইডি: {request_id}\nক্লায়েন্ট: {name}\nফোন: {phone}\nইমেইল: {email}\nবিষয়: {subject}\nবার্তা: {message}\nস্ট্যাটাস: {status}" } }, telegram: "🔔 NEW CALLBACK REQUEST\nRequest ID: {request_id}\nClient: {name}\nPhone: {phone}\nIssue: {subject}\nStatus: {status}\nDate: {date}" },
  { key: "appointment_client", label: { en: "Appointment — Customer Confirmation", bn: "অ্যাপয়েন্টমেন্ট — গ্রাহক নিশ্চিতকরণ" }, vars: ["name", "appointment_id", "service", "date", "time", "status", "company_name"], email: { subject: { en: "Appointment Submitted — {company_name}", bn: "অ্যাপয়েন্টমেন্ট জমা হয়েছে — {company_name}" }, body: { en: "Hello {name},\n\nYour appointment has been submitted successfully.\n\nAppointment ID: {appointment_id}\nService: {service}\nDate: {date}\nTime: {time}\nStatus: {status}\n\nWe will contact you to confirm the schedule.", bn: "প্রিয় {name},\n\nআপনার অ্যাপয়েন্টমেন্ট সফলভাবে জমা হয়েছে।\n\nঅ্যাপয়েন্টমেন্ট আইডি: {appointment_id}\nসার্ভিস: {service}\nতারিখ: {date}\nসময়: {time}\nস্ট্যাটাস: {status}\n\nসময়সূচি নিশ্চিত করতে আমরা আপনার সাথে যোগাযোগ করব।" } }, telegram: "📅 NEW APPOINTMENT\nAppointment ID: {appointment_id}\nCustomer: {name}\nService: {service}\nDate: {date}\nTime: {time}\nSource: AL KHUBAIB IT" },
  { key: "appointment_admin", label: { en: "Appointment — Admin Notification", bn: "অ্যাপয়েন্টমেন্ট — অ্যাডমিন নোটিফিকেশন" }, vars: ["appointment_id", "name", "email", "phone", "service", "date", "time"], email: { subject: { en: "NEW APPOINTMENT RECEIVED — {appointment_id}", bn: "নতুন অ্যাপয়েন্টমেন্ট গৃহীত — {appointment_id}" }, body: { en: "Appointment ID: {appointment_id}\nCustomer: {name}\nEmail: {email}\nPhone: {phone}\nService: {service}\nDate: {date}\nTime: {time}\nSource: AL KHUBAIB IT Website", bn: "অ্যাপয়েন্টমেন্ট আইডি: {appointment_id}\nগ্রাহক: {name}\nইমেইল: {email}\nফোন: {phone}\nসার্ভিস: {service}\nতারিখ: {date}\nসময়: {time}\nসোর্স: AL KHUBAIB IT ওয়েবসাইট" } }, telegram: "📅 NEW APPOINTMENT\nAppointment ID: {appointment_id}\nCustomer: {name}\nService: {service}\nDate: {date}\nTime: {time}\nSource: AL KHUBAIB IT" },
  { key: "system_event", label: { en: "System Event", bn: "সিস্টেম ইভেন্ট" }, vars: ["title_en", "body_en", "title_bn", "body_bn", "date"], email: { subject: { en: "{title_en}", bn: "{title_bn}" }, body: { en: "{body_en}", bn: "{body_bn}" } }, telegram: "{title_en}\n{body_en}" },
];

const KIND_TO_EVENT: Record<string, string> = {
  order: "order_created", payment: "payment_received", affiliate: "affiliate_application",
  kyc: "kyc_submitted", commission: "commission_generated", withdrawal: "withdrawal_requested",
  ticket: "new_ticket", wallet: "manual_payment",
};

export function renderVars(text: string, vars: Record<string, any>) {
  return String(text || "").replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

export function eventTemplate(key: string, channel: "email" | "telegram") {
  return where("email_templates", (t) => t.key === key && t.channel === channel)[0];
}

export function defaultPrefs() {
  const p: Record<string, { email: boolean; telegram: boolean; dashboard: boolean }> = {};
  EVENTS.forEach((e) => (p[e.key] = { email: true, telegram: true, dashboard: false }));
  return p;
}

export function prefsFor(key: string) {
  const s = getSettings();
  const prefs = s.notification_prefs || defaultPrefs();
  return prefs[key] ?? { email: true, telegram: true, dashboard: false };
}

export function baseVars(vars: Record<string, any>): Record<string, any> {
  const g = getSettings().general || {};
  return {
    company_name: g.company || "AL-KHUBAIB IT",
    dashboard_url: "https://my.alkhubaibit.com",
    login_url: "https://my.alkhubaibit.com/login",
    date: new Date().toLocaleString("en-GB"),
    ...vars,
  };
}

export function notifyEvent(key: string, vars: Record<string, any>) {
  try {
    const def = EVENTS.find((e) => e.key === key) ?? EVENTS[EVENTS.length - 1];
    const v = baseVars(vars);
    const prefs = prefsFor(key);

    if (prefs.email) {
      const tpl = eventTemplate(key, "email");
      const smtp = getSettings().smtp;
      const status = smtp?.host ? "sent" : "queued";
      insert("email_logs", {
        key, to: v.email || smtp?.from_email || "—",
        subject: renderVars(tpl?.subject?.["en"] || def.email.subject.en, v),
        body: renderVars(tpl?.body?.["en"] || def.email.body.en, v),
        status, error: smtp?.host ? "" : "SMTP not configured — queued", created_at: nowISO(),
      });
    }

    if (prefs.telegram) {
      const tg = getSettings().telegram;
      const tpl = eventTemplate(key, "telegram");
      const text = renderVars(tpl?.text || def.telegram, v);
      if (tg?.botToken && tg?.chatId) {
        const url = `https://api.telegram.org/bot${tg.botToken}/sendMessage`;
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: tg.chatId, text }),
        })
          .then(async (r) => {
            const ok = r.ok;
            insert("telegram_logs", { key, status: ok ? "sent" : "failed", text, error: ok ? "" : (await r.text()).slice(0, 180), created_at: nowISO() });
          })
          .catch((err) => {
            insert("telegram_logs", { key, status: "failed", text, error: String(err).slice(0, 180), created_at: nowISO() });
          });
      } else {
        insert("telegram_logs", { key, status: "queued", text, error: "Telegram not configured", created_at: nowISO() });
      }
    }
  } catch { /* engine must never break business flow */ }
}

export async function testTelegram(botToken: string, chatId: string): Promise<{ ok: boolean; desc: string }> {
  if (!botToken || !chatId) return { ok: false, desc: "Bot token and chat ID are required." };
  try {
    const r = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: "🔔 AL-KHUBAIB IT Telegram Notification Test" }),
    });
    const data = await r.json().catch(() => ({}));
    if (r.ok) {
      insert("telegram_logs", { key: "system_event", status: "sent", text: "Connection test", created_at: nowISO() });
      return { ok: true, desc: "Connected Successfully" };
    }
    return { ok: false, desc: String(data?.description || "Failed").slice(0, 200) };
  } catch (err) {
    return { ok: false, desc: String(err).slice(0, 200) };
  }
}

export function seedNotificationTemplates() {
  if (where("email_templates", () => true).length > 0) return;
  EVENTS.forEach((e) => {
    insert("email_templates", {
      key: e.key, channel: "email", subject: { en: e.email.subject.en, bn: e.email.subject.bn },
      body: { en: e.email.body.en, bn: e.email.body.bn }, enabled: true, created_at: nowISO(),
    });
    insert("email_templates", {
      key: e.key, channel: "telegram", text: e.telegram, enabled: true, created_at: nowISO(),
    });
  });
  const s = getSettings();
  if (!s.notification_prefs) s.notification_prefs = defaultPrefs();
  if (!s.invoice_reminders) s.invoice_reminders = [7, 3, 0, -3];
  if (!s.smtp) s.smtp = { host: "", port: 587, encryption: "tls", username: "", password: "", from_name: "AL-KHUBAIB IT", from_email: "contact@alkhubaibit.com", reply_to: "" };
  if (!s.telegram) s.telegram = { botToken: "", chatId: "" };
  setSetting("_touched", Date.now());
}

export function initNotifyEngine() {
  seedNotificationTemplates();
  setNotifyHook((kind, _userId, title, body) => {
    const key = KIND_TO_EVENT[kind] || "system_event";
    notifyEvent(key, {
      title_en: title.en, title_bn: title.bn, body_en: body.en, body_bn: body.bn,
      date: new Date().toLocaleString("en-GB"),
    });
  });
}
