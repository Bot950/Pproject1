// ─────────────────────────────────────────────────────────────
// AKDB — AL-KHUBAIB IT platform data layer
// Normalized tables, persisted locally. The storage adapter can be
// swapped for a real API backend without touching business logic.
// ─────────────────────────────────────────────────────────────
import { SERVICE_CATEGORIES } from "./translations";

export type Row = { id: string; created_at: string; updated_at?: string; [k: string]: any };

const DB_KEY = "akit_db_v3";

export type TableName =
  | "users" | "roles" | "products" | "services" | "orders" | "order_items"
  | "order_events" | "payments" | "wallet_txs" | "subscriptions" | "invoices"
  | "affiliate_applications" | "affiliate_profiles" | "affiliate_kyc"
  | "affiliate_clicks" | "affiliate_referrals" | "commissions" | "withdrawals"
  | "coupons" | "notifications" | "tickets" | "ticket_messages" | "logs" | "pages"
  | "ledger"
  | "page_sections" | "page_revisions" | "forms" | "form_fields" | "form_submissions"
  | "email_templates" | "email_logs" | "telegram_logs"
  | "invoice_payments" | "invoice_adjustments"
  | "menu_items" | "categories" | "campaigns"
  | "callbacks" | "appointment_services" | "appointment_logs";

type DBShape = {
  // Seeded literals may omit optional metadata; readers use typed generics.
  tables: Record<TableName, any[]>;
  settings: Record<string, any>;
  seed: number;
};

const SEED_VERSION = 5;

let cache: DBShape | null = null;

export function uid(p = "id"): string {
  try {
    return `${p}_${crypto.randomUUID().slice(0, 13)}`;
  } catch {
    return `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  }
}

export function nowISO() {
  return new Date().toISOString();
}

export function orderNo() {
  return `AK-${Date.now().toString(36).toUpperCase().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
}
export function invoiceNo() {
  return `INV-${Date.now().toString(36).toUpperCase().slice(-5)}${Math.floor(Math.random() * 900 + 100)}`;
}
export function txnNo() {
  return `TXN-${Date.now().toString(36).toUpperCase().slice(-7)}`;
}

export function money(n: number, lang = "en"): string {
  const v = Math.round(n).toLocaleString(lang === "bn" ? "bn-BD" : "en-IN");
  return `৳${v}`;
}

export function fmtDate(iso: string, lang = "en") {
  try {
    return new Date(iso).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
export function fmtDateTime(iso: string, lang = "en") {
  try {
    const d = new Date(iso);
    return `${d.toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", year: "numeric" })} · ${d.toLocaleTimeString(lang === "bn" ? "bn-BD" : "en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  } catch {
    return iso;
  }
}

/* ── Password hashing (SHA-256, salted; bcrypt server-side in production) ── */
function fallbackHash(str: string) {
  let h1 = 0xdeadbeef ^ 0, h2 = 0x41c6ce57 ^ 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(13, "0");
}

export async function hashPassword(pw: string, salt: string): Promise<string> {
  const text = `${salt}::${pw}`;
  try {
    if (crypto.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    }
  } catch { /* fall back */ }
  return "h_" + fallbackHash(text);
}

export async function verifyPassword(pw: string, salt: string, hash: string): Promise<boolean> {
  const calc = await hashPassword(pw, salt);
  return calc === hash;
}

/* ── Store core ────────────────────────────────────────────── */
let version = 0;
const listeners = new Set<() => void>();

function load(): DBShape {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      cache = JSON.parse(raw) as DBShape;
      return cache;
    }
  } catch { /* corrupted → reseed */ }
  cache = { tables: {} as Record<TableName, Row[]>, settings: {}, seed: 0 };
  return cache;
}

function save() {
  if (!cache) return;
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(cache));
  } catch { /* quota */ }
  version++;
  listeners.forEach((l) => l());
}

function table(t: TableName): Row[] {
  const db = load();
  if (!db.tables[t]) db.tables[t] = [];
  return db.tables[t];
}

/* ── Immutable financial ledger ──────────────────────────────
   Every payment, wallet change, commission, withdrawal or refund
   creates an append-only entry. Records are never overwritten. */
export function recordLedger(
  type: "payment" | "deposit" | "wallet_credit" | "wallet_debit" | "commission" | "commission_paid" | "withdrawal" | "refund" | "adjustment",
  user_id: string,
  amount: number,
  note: string,
  ref = ""
) {
  insert("ledger", { type, user_id, amount, note, ref });
}

export function all<T = Row>(t: TableName): T[] {
  return table(t) as T[];
}
export function get<T = Row>(t: TableName, id: string): T | undefined {
  return table(t).find((r) => r.id === id) as T | undefined;
}
export function where<T = Row>(t: TableName, pred: (r: Row) => boolean): T[] {
  return table(t).filter(pred) as T[];
}
export function insert(t: TableName, row: Partial<Row>): Row {
  const rec: Row = { id: uid(t.slice(0, 4)), created_at: nowISO(), ...row };
  table(t).push(rec);
  save();
  return rec;
}
export function update(t: TableName, id: string, patch: Partial<Row>): Row | undefined {
  const rec = table(t).find((r) => r.id === id);
  if (!rec) return undefined;
  Object.assign(rec, patch, { updated_at: nowISO() });
  save();
  return rec;
}
export function remove(t: TableName, id: string) {
  const rows = table(t);
  const i = rows.findIndex((r) => r.id === id);
  if (i >= 0) {
    rows.splice(i, 1);
    save();
  }
}
export function getSettings(): Record<string, any> {
  return load().settings;
}
export function setSetting(key: string, value: any) {
  const db = load();
  db.settings[key] = value;
  save();
}
export function useDbVersion(): number {
  const v = React.useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    () => version,
    () => version
  );
  return v;
}

import React from "react";

/* ── Notifications & audit log ─────────────────────────────── */
export function notify(
  user_id: string | "admin",
  kind: string,
  title: { en: string; bn: string },
  body: { en: string; bn: string }
) {
  insert("notifications", { user_id, kind, title, body, read: false });
  // Central notification engine hook (email + telegram + logs)
  if (notifyHook) {
    try {
      notifyHook(kind, user_id, title, body);
    } catch { /* never break business flow */ }
  }
}

/** Registered by the central notification engine (lib/notify). */
export let notifyHook: ((kind: string, user_id: string, title: { en: string; bn: string }, body: { en: string; bn: string }) => void) | null = null;
export function setNotifyHook(h: typeof notifyHook) {
  notifyHook = h;
}

export function logAction(admin: string, action: string, target: string) {
  insert("logs", { admin, action, target });
}

/* ── Wallet helpers ────────────────────────────────────────── */
export function walletBalance(userId: string): number {
  return where("wallet_txs", (r) => r.user_id === userId).reduce((s, t) => {
    const v = Number(t.amount) || 0;
    return s + (t.type === "credit" ? v : -v);
  }, 0);
}

export function walletCredit(userId: string, amount: number, reason: string, ref = "") {
  const bal = walletBalance(userId);
  insert("wallet_txs", {
    user_id: userId,
    type: "credit",
    amount,
    balance_after: bal + amount,
    reason,
    ref,
  });
}

export function walletDebit(userId: string, amount: number, reason: string, ref = "") {
  const bal = walletBalance(userId);
  if (bal < amount) return false;
  insert("wallet_txs", {
    user_id: userId,
    type: "debit",
    amount,
    balance_after: bal - amount,
    reason,
    ref,
  });
  return true;
}

/* ── Seed data ─────────────────────────────────────────────── */
export async function ensureSeed() {
  const db = load();
  if (db.seed >= SEED_VERSION) return;

  db.settings = {
    general: {
      company: "AL-KHUBAIB IT",
      phone1: "+880 9638 238 576",
      phone2: "+880 1926 100 643",
      email: "contact@alkhubaibit.com",
      whatsapp: "8801926100643",
      address: { en: "Bangladesh", bn: "বাংলাদেশ" },
      currency: "BDT",
    },
    affiliate: {
      cookieDays: 30,
      minWithdrawal: 1000,
      defaultCommission: 10,
      holdingDays: 0,
      kycRequired: true,
      approvalRequired: true,
    },
    wallet: { minDeposit: 500, maxDeposit: 50000 },
    payments: {
      methods: [
        { id: "bkash", label: "bKash", enabled: true, instructions: "Send Money to 01XXXXXXXXX (bKash merchant number) and enter the bKash Transaction ID below.", icon: "phone" },
        { id: "nagad", label: "Nagad", enabled: true, instructions: "Send Money to 01XXXXXXXXX (Nagad merchant number) and enter the Nagad Transaction ID below.", icon: "wallet" },
        { id: "bank", label: "Bank Transfer", enabled: true, instructions: "Transfer to the company bank account and enter the reference/Transaction ID below.", icon: "bank" },
        { id: "wallet", label: "Wallet Balance", enabled: true, instructions: "Pay instantly from your AL-KHUBAIB IT wallet balance.", icon: "card" },
      ],
    },
    seo: {
      titleEn: "AL-KHUBAIB IT — Web Design & Development Company in Bangladesh",
      titleBn: "AL-KHUBAIB IT — বাংলাদেশের ওয়েব ডিজাইন ও ডেভেলপমেন্ট কোম্পানি",
      descEn: "Professional web development, custom software, education management systems, hosting, online & citizen services and digital products.",
      descBn: "প্রফেশনাল ওয়েব ডেভেলপমেন্ট, কাস্টম সফটওয়্যার, এডুকেশন ম্যানেজমেন্ট সিস্টেম, হোস্টিং, অনলাইন ও সিটিজেন সার্ভিস এবং ডিজিটাল প্রোডাক্ট।",
    },
    // Central appointment integration (aminulkhan.com) — credentials NEVER exposed in UI/frontend config;
    // in production these live in server environment variables and requests go through the company PHP proxy.
    appointment: {
      enabled: true,
      proxyUrl: "", // e.g. https://alkhubaibit.com/api/appointments  (server-side proxy)
      apiKey: "",
      apiSecret: "",
      timeout: 15000,
      lastCheck: null,
      connected: null,
    },
    notice: { enabled: false, en: "", bn: "" },
    renewalNotifyDays: [7, 3, 1],
    security: { maxLoginAttempts: 5, lockMinutes: 5 },
  };

  db.tables.roles = [
    { id: "role_super", name: "super_admin", label: "Super Admin", created_at: nowISO() },
    { id: "role_admin", name: "admin", label: "Admin", created_at: nowISO() },
    { id: "role_client", name: "client", label: "Client", created_at: nowISO() },
    { id: "role_aff", name: "affiliate", label: "Affiliate", created_at: nowISO() },
  ];

  const saltAdmin = uid("s"), saltClient = uid("s"), saltAff = uid("s");
  const hAdmin = await hashPassword("Admin@12345", saltAdmin);
  const hClient = await hashPassword("Client@12345", saltClient);
  const hAff = await hashPassword("Affiliate@12345", saltAff);

  const adminId = uid("u");
  const clientId = uid("u");
  const affUserId = uid("u");

  db.tables.users = [
    {
      id: adminId, name: "Platform Administrator", email: "admin@alkhubaibit.com", mobile: "+880 9638 238 576",
      role: "super_admin", salt: saltAdmin, hash: hAdmin, status: "active", created_at: nowISO(),
    },
    {
      id: clientId, name: "Demo Client", email: "client@alkhubaibit.com", mobile: "+880 1926 100 643",
      role: "client", salt: saltClient, hash: hClient, status: "active", created_at: nowISO(),
    },
    {
      id: affUserId, name: "Demo Affiliate", email: "affiliate@alkhubaibit.com", mobile: "+880 1XXX XXXXXX",
      role: "affiliate", salt: saltAff, hash: hAff, status: "active", created_at: nowISO(),
    },
  ];

  // Products — real AL-KHUBAIB IT products, prices configurable in Admin
  db.tables.products = [
    {
      id: "infoedu-wp", name: { en: "InfoEdu WP", bn: "InfoEdu WP" },
      type: { en: "WordPress Education Solution", bn: "WordPress এডুকেশন সল্যুশন" },
      kind: "one_time", price: 25000, discount: 0, digital: true,
      description: { en: "A modern WordPress-based education management system — admissions, courses, results, attendance, teacher-student management and accounting.", bn: "আধুনিক WordPress-ভিত্তিক শিক্ষা ম্যানেজমেন্ট সিস্টেম — ভর্তি, কোর্স, রেজাল্ট, উপস্থিতি, শিক্ষক-শিক্ষার্থী ম্যানেজমেন্ট ও হিসাব।" },
      features: { en: ["Admission & student management", "Result publishing & attendance", "Teacher & course management", "Accounting & fees"], bn: ["ভর্তি ও শিক্ষার্থী ম্যানেজমেন্ট", "রেজাল্ট প্রকাশ ও উপস্থিতি", "শিক্ষক ও কোর্স ম্যানেজমেন্ট", "হিসাব ও ফি"] },
      commission: { enabled: true, type: "percent", initial: 10, renewal: 0, renewalEnabled: false },
      status: "published", icon: "wp", badge: { en: "Flagship", bn: "ফ্ল্যাগশিপ" }, created_at: nowISO(),
    },
    {
      id: "smart-school", name: { en: "Smart School Management", bn: "Smart School Management" },
      type: { en: "Laravel Software", bn: "Laravel সফটওয়্যার" },
      kind: "one_time", price: 35000, discount: 0, digital: true,
      description: { en: "PHP Laravel-based education management system — full academic management, results, attendance and accounting.", bn: "PHP Laravel-ভিত্তিক শিক্ষা ম্যানেজমেন্ট সিস্টেম — সম্পূর্ণ একাডেমিক ম্যানেজমেন্ট, রেজাল্ট, উপস্থিতি ও হিসাব।" },
      features: { en: ["Built on PHP Laravel", "Full academic management", "Results, attendance & accounting", "Admin dashboard"], bn: ["PHP Laravel-এ নির্মিত", "সম্পূর্ণ একাডেমিক ম্যানেজমেন্ট", "রেজাল্ট, উপস্থিতি ও হিসাব", "অ্যাডমিন ড্যাশবোর্ড"] },
      commission: { enabled: true, type: "percent", initial: 10, renewal: 0, renewalEnabled: false },
      status: "published", icon: "cpu", badge: { en: "Laravel", bn: "Laravel" }, created_at: nowISO(),
    },
    {
      id: "ramon-school", name: { en: "Ramon School Management", bn: "Ramon School Management" },
      type: { en: "Laravel Software", bn: "Laravel সফটওয়্যার" },
      kind: "one_time", price: 20000, discount: 0, digital: true,
      description: { en: "Deployment-ready school management software built on Laravel with a modern admin dashboard.", bn: "আধুনিক অ্যাডমিন ড্যাশবোর্ডসহ Laravel-এ নির্মিত ডিপ্লয়মেন্ট-রেডি স্কুল ম্যানেজমেন্ট সফটওয়্যার।" },
      features: { en: ["Built on PHP Laravel", "Admissions & student profiles", "Results & accounting", "Deployment-ready"], bn: ["PHP Laravel-এ নির্মিত", "ভর্তি ও শিক্ষার্থী প্রোফাইল", "রেজাল্ট ও হিসাব", "ডিপ্লয়মেন্ট-রেডি"] },
      commission: { enabled: true, type: "percent", initial: 10, renewal: 0, renewalEnabled: false },
      status: "published", icon: "school", badge: { en: "Laravel", bn: "Laravel" }, created_at: nowISO(),
    },
    {
      id: "business-hosting", name: { en: "Business Hosting (Yearly)", bn: "বিজনেস হোস্টিং (বার্ষিক)" },
      type: { en: "Hosting Subscription", bn: "হোস্টিং সাবস্ক্রিপশন" },
      kind: "subscription", price: 3000, discount: 0, digital: true,
      subscription: { period: "year", renewalPrice: 2500 },
      description: { en: "Reliable business hosting with SSL, email hosting, backups and managed support — renewed yearly.", bn: "SSL, ইমেইল হোস্টিং, ব্যাকআপ ও ম্যানেজড সাপোর্টসহ নির্ভরযোগ্য বিজনেস হোস্টিং — বার্ষিক নবায়নযোগ্য।" },
      features: { en: ["cPanel access", "Free SSL certificate", "Email hosting included", "Backups & management"], bn: ["cPanel অ্যাক্সেস", "ফ্রি SSL সার্টিফিকেট", "ইমেইল হোস্টিং অন্তর্ভুক্ত", "ব্যাকআপ ও ম্যানেজমেন্ট"] },
      commission: { enabled: true, type: "percent", initial: 10, renewal: 10, renewalEnabled: true },
      status: "published", icon: "server", badge: { en: "Subscription", bn: "সাবস্ক্রিপশন" }, created_at: nowISO(),
    },
  ];

  // Services — real service categories with dynamic order forms
  const svcFields: Record<string, any[]> = {
    "web-development": [
      { key: "business_name", label: { en: "Business Name", bn: "ব্যবসার নাম" }, type: "text", required: true },
      { key: "website_type", label: { en: "Website Type", bn: "ওয়েবসাইটের ধরন" }, type: "select", required: true, options: ["Business", "Corporate", "Portfolio", "E-commerce", "Educational", "News/Magazine", "Booking", "Membership", "Custom Web App"] },
      { key: "pages", label: { en: "Number of Pages", bn: "পেজ সংখ্যা" }, type: "number", required: false },
      { key: "domain", label: { en: "Domain", bn: "ডোমেইন" }, type: "select", required: true, options: ["Need new domain", "I have a domain", "Not sure yet"] },
      { key: "hosting", label: { en: "Hosting", bn: "হোস্টিং" }, type: "select", required: true, options: ["Need hosting", "Already have hosting", "Not sure yet"] },
      { key: "reference", label: { en: "Design Reference (optional)", bn: "ডিজাইন রেফারেন্স (ঐচ্ছিক)" }, type: "textarea", required: false },
      { key: "features", label: { en: "Required Features", bn: "প্রয়োজনীয় ফিচার" }, type: "textarea", required: false },
      { key: "deadline", label: { en: "Deadline", bn: "সময়সীমা" }, type: "date", required: false },
    ],
    "software-development": [
      { key: "business_name", label: { en: "Business / Organization Name", bn: "ব্যবসা/প্রতিষ্ঠানের নাম" }, type: "text", required: true },
      { key: "software_type", label: { en: "Software Type", bn: "সফটওয়্যারের ধরন" }, type: "select", required: true, options: ["Management Software", "Inventory", "Billing", "POS", "HR", "Accounting", "CRM", "Custom Dashboard", "Other"] },
      { key: "users", label: { en: "Number of Users", bn: "ব্যবহারকারীর সংখ্যা" }, type: "number", required: false },
      { key: "modules", label: { en: "Required Modules", bn: "প্রয়োজনীয় মডিউল" }, type: "textarea", required: true },
      { key: "deadline", label: { en: "Deadline", bn: "সময়সীমা" }, type: "date", required: false },
    ],
    "education-management": [
      { key: "institution", label: { en: "Institution Name", bn: "প্রতিষ্ঠানের নাম" }, type: "text", required: true },
      { key: "inst_type", label: { en: "Institution Type", bn: "প্রতিষ্ঠানের ধরন" }, type: "select", required: true, options: ["School", "Madrasa", "College", "Coaching Center", "Other"] },
      { key: "students", label: { en: "Number of Students", bn: "শিক্ষার্থীর সংখ্যা" }, type: "number", required: false },
      { key: "website", label: { en: "Website Requirement", bn: "ওয়েবসাইট প্রয়োজন" }, type: "select", required: true, options: ["Need new website", "Have website", "Not sure yet"] },
      { key: "result", label: { en: "Result System Required?", bn: "রেজাল্ট সিস্টেম প্রয়োজন?" }, type: "select", required: true, options: ["Yes", "No"] },
      { key: "extra", label: { en: "Additional Requirements", bn: "অতিরিক্ত প্রয়োজনীয়তা" }, type: "textarea", required: false },
    ],
    "online-services": [
      { key: "svc_type", label: { en: "Service Type", bn: "সার্ভিসের ধরন" }, type: "select", required: true, options: ["Content Writing", "Bangla Composition", "English Composition", "Arabic Composition", "Data Entry", "Form Submission", "Application Support", "Digital Documentation"] },
      { key: "details", label: { en: "Details", bn: "বিস্তারিত" }, type: "textarea", required: true },
      { key: "quantity", label: { en: "Quantity (pages/items)", bn: "পরিমাণ (পেজ/আইটেম)" }, type: "number", required: false },
    ],
    "citizen-services": [
      { key: "svc_type", label: { en: "Service Type", bn: "সার্ভিসের ধরন" }, type: "select", required: true, options: ["NID Application", "NID Correction", "E-Passport Application", "E-Passport Correction", "Birth Registration Application", "Birth Registration Correction"] },
      { key: "details", label: { en: "Details", bn: "বিস্তারিত" }, type: "textarea", required: true },
    ],
    "graphic-design": [
      { key: "design_type", label: { en: "Design Type", bn: "ডিজাইনের ধরন" }, type: "select", required: true, options: ["Logo", "Business Card", "ID Card", "Poster", "Banner", "Social Media Design", "Brochure", "Certificate", "Letterhead", "Notebook/Diary"] },
      { key: "details", label: { en: "Details", bn: "বিস্তারিত" }, type: "textarea", required: true },
    ],
    "digital-marketing": [
      { key: "business", label: { en: "Business Name", bn: "ব্যবসার নাম" }, type: "text", required: true },
      { key: "url", label: { en: "Website / Page URL", bn: "ওয়েবসাইট/পেজ URL" }, type: "text", required: false },
      { key: "goal", label: { en: "Main Goal", bn: "মূল লক্ষ্য" }, type: "select", required: true, options: ["More traffic", "More sales", "Brand awareness", "First page of Google", "Social media growth"] },
      { key: "details", label: { en: "Details", bn: "বিস্তারিত" }, type: "textarea", required: false },
    ],
  };

  const svcBase: Record<string, { price: number; kind: string; commission: any; subscription?: any }> = {
    "web-development": { price: 10000, kind: "one_time", commission: { enabled: true, type: "percent", initial: 10, renewal: 0, renewalEnabled: false } },
    "software-development": { price: 25000, kind: "one_time", commission: { enabled: true, type: "percent", initial: 10, renewal: 0, renewalEnabled: false } },
    "education-management": { price: 30000, kind: "subscription", subscription: { period: "year", renewalPrice: 5000 }, commission: { enabled: true, type: "percent", initial: 10, renewal: 5, renewalEnabled: true } },
    "online-services": { price: 100, kind: "one_time", commission: { enabled: true, type: "percent", initial: 5, renewal: 0, renewalEnabled: false } },
    "citizen-services": { price: 200, kind: "one_time", commission: { enabled: false, type: "percent", initial: 0, renewal: 0, renewalEnabled: false } },
    "domain-hosting": { price: 3000, kind: "subscription", subscription: { period: "year", renewalPrice: 2500 }, commission: { enabled: true, type: "percent", initial: 10, renewal: 10, renewalEnabled: true } },
    "graphic-design": { price: 500, kind: "one_time", commission: { enabled: true, type: "percent", initial: 10, renewal: 0, renewalEnabled: false } },
    "digital-marketing": { price: 3000, kind: "one_time", commission: { enabled: true, type: "percent", initial: 10, renewal: 0, renewalEnabled: false } },
  };

  db.tables.services = SERVICE_CATEGORIES.map((cat) => ({
    id: cat.slug,
    name: { en: cat.name.en, bn: cat.name.bn },
    description: { en: cat.description.en, bn: cat.description.bn },
    icon: cat.icon,
    price: svcBase[cat.slug]?.price ?? 1000,
    price_label: { en: "Starting from", bn: "শুরু থেকে" },
    kind: svcBase[cat.slug]?.kind ?? "one_time",
    subscription: svcBase[cat.slug]?.subscription ?? null,
    commission: svcBase[cat.slug]?.commission ?? { enabled: false, type: "percent", initial: 0 },
    order_fields: svcFields[cat.slug] ?? [],
    status: "published",
    created_at: nowISO(),
  }));

  db.tables.affiliate_applications = [
    {
      id: uid("app"), user_id: affUserId, name: "Demo Affiliate", mobile: "+880 1XXX XXXXXX",
      email: "affiliate@alkhubaibit.com", address: "Dhaka, Bangladesh", experience: "2 years freelance",
      skills: "Social media, sales", social: "facebook.com/demoaffiliate", method: "Social media promotion",
      why: "I want to promote AL-KHUBAIB IT services in my community.", status: "approved", reason: "", created_at: nowISO(),
    },
  ];
  db.tables.affiliate_profiles = [
    {
      id: uid("af"), user_id: affUserId, code: "akdemo", status: "active",
      kyc_status: "verified", balance: 0, total_earned: 0, joined: nowISO(), created_at: nowISO(),
    },
  ];
  db.tables.affiliate_kyc = [
    {
      id: uid("kyc"), user_id: affUserId, status: "verified", reason: "",
      fields: { full_name: "Demo Affiliate", dob: "1995-01-01", address: "Dhaka, Bangladesh", nid: "1234-5678-9012", payment: "bKash — 01XXXXXXXXX" },
      submitted_at: nowISO(), reviewed_at: nowISO(), created_at: nowISO(),
    },
  ];

  db.tables.coupons = [
    { id: uid("cp"), code: "WELCOME10", type: "percent", value: 10, min_order: 1000, max_uses: 100, used: 0, expires: null, enabled: true, created_at: nowISO() },
  ];

  // ── Custom admin roles (RBAC) ──
  const ROLES_PERMS: Record<string, string[]> = {
    content_manager: ["dashboard", "pages", "sections", "forms", "menus", "services", "products", "categories", "notifications", "logs"],
    accountant: ["dashboard", "invoices", "payments", "reports", "ledger", "notifications"],
    support_agent: ["dashboard", "tickets", "customers", "notifications"],
    affiliate_manager: ["dashboard", "applications", "affiliates", "commissions", "withdrawals", "campaigns", "notifications"],
    order_manager: ["dashboard", "orders", "subscriptions", "coupons", "invoices", "notifications"],
  };
  Object.entries(ROLES_PERMS).forEach(([name, perms]) => {
    db.tables.roles.push({ id: `role_${name}`, name, label: name.replace(/_/g, " "), permissions: perms, created_at: nowISO() });
  });

  // ── Product/service categories (with commission defaults) ──
  db.tables.categories = [
    { id: "cat_education", name: { en: "Education Solutions", bn: "এডুকেশন সল্যুশন" }, parent_id: "", commission: { type: "percent", initial: 10, renewal: 5, renewalEnabled: true }, order: 1 },
    { id: "cat_hosting", name: { en: "Hosting & Domain", bn: "হোস্টিং ও ডোমেইন" }, parent_id: "", commission: { type: "percent", initial: 10, renewal: 10, renewalEnabled: true }, order: 2 },
    { id: "cat_software", name: { en: "Software", bn: "সফটওয়্যার" }, parent_id: "", commission: { type: "percent", initial: 10, renewal: 0, renewalEnabled: false }, order: 3 },
    { id: "cat_online", name: { en: "Online Services", bn: "অনলাইন সার্ভিস" }, parent_id: "", commission: { type: "percent", initial: 5, renewal: 0, renewalEnabled: false }, order: 4 },
    { id: "cat_design", name: { en: "Design & Creative", bn: "ডিজাইন ও ক্রিয়েটিভ" }, parent_id: "", commission: { type: "percent", initial: 10, renewal: 0, renewalEnabled: false }, order: 5 },
  ];

  // ── Navigation menu ──
  db.tables.menu_items = [
    { id: uid("mi"), label: { en: "Home", bn: "হোম" }, href: "/", parent: "", order: 1, enabled: true, type: "link" },
    { id: uid("mi"), label: { en: "Services", bn: "সার্ভিসসমূহ" }, href: "/services", parent: "", order: 2, enabled: true, type: "link" },
    { id: uid("mi"), label: { en: "Web Development", bn: "ওয়েব ডেভেলপমেন্ট" }, href: "/services/web-development", parent: "", order: 3, enabled: true, type: "link" },
    { id: uid("mi"), label: { en: "Shop", bn: "শপ" }, href: "/shop", parent: "", order: 4, enabled: true, type: "link" },
    { id: uid("mi"), label: { en: "Portfolio", bn: "পোর্টফোলিও" }, href: "/portfolio", parent: "", order: 5, enabled: true, type: "link" },
    { id: uid("mi"), label: { en: "Courses", bn: "কোর্সসমূহ" }, href: "/courses", parent: "", order: 6, enabled: true, type: "link" },
    { id: uid("mi"), label: { en: "Career", bn: "ক্যারিয়ার" }, href: "/career", parent: "", order: 7, enabled: true, type: "link" },
    { id: uid("mi"), label: { en: "Contact", bn: "যোগাযোগ" }, href: "/contact", parent: "", order: 8, enabled: true, type: "link" },
  ];

  // ── Forms (dynamic form builder seed: contact form) ──
  db.tables.forms = [
    {
      id: "form_contact", name: { en: "Contact Form", bn: "যোগাযোগ ফর্ম" }, slug: "contact", status: "published",
      settings: { email_notify: true, telegram_notify: true, success_en: "Thank you! We will contact you soon.", success_bn: "ধন্যবাদ! আমরা শিগগিরই যোগাযোগ করব।", redirect: "" },
    },
    {
      id: "form_career", name: { en: "Career Application", bn: "ক্যারিয়ার আবেদন" }, slug: "career-apply", status: "published",
      settings: { email_notify: true, telegram_notify: true, success_en: "Application submitted successfully.", success_bn: "আবেদন সফলভাবে জমা হয়েছে।", redirect: "" },
    },
  ];
  db.tables.form_fields = [
    { id: uid("ff"), form_id: "form_contact", label: { en: "Full Name", bn: "পূর্ণ নাম" }, type: "text", required: true, order: 1 },
    { id: uid("ff"), form_id: "form_contact", label: { en: "Email", bn: "ইমেইল" }, type: "email", required: true, order: 2 },
    { id: uid("ff"), form_id: "form_contact", label: { en: "Phone", bn: "মোবাইল" }, type: "phone", required: true, order: 3 },
    { id: uid("ff"), form_id: "form_contact", label: { en: "Service", bn: "সার্ভিস" }, type: "select", required: true, order: 4, options: ["Web Development", "Software", "Hosting", "Online Services", "Other"] },
    { id: uid("ff"), form_id: "form_contact", label: { en: "Message", bn: "বার্তা" }, type: "textarea", required: true, order: 5 },
    { id: uid("ff"), form_id: "form_career", label: { en: "Full Name", bn: "পূর্ণ নাম" }, type: "text", required: true, order: 1 },
    { id: uid("ff"), form_id: "form_career", label: { en: "Email", bn: "ইমেইল" }, type: "email", required: true, order: 2 },
    { id: uid("ff"), form_id: "form_career", label: { en: "Experience", bn: "অভিজ্ঞতা" }, type: "textarea", required: false, order: 3 },
  ];

  // ── CMS pages ──
  db.tables.pages = [
    {
      id: "page_home", title: { en: "Home", bn: "হোম" }, slug: "/", status: "published", is_system: true, order: 1,
      content: { en: "Connecting Your Business to the Digital World", bn: "আপনার ব্যবসাকে যুক্ত করুন ডিজিটাল বিশ্বের সাথে" },
      seo: { title_en: "AL-KHUBAIB IT — Web Design & Development Company in Bangladesh", title_bn: "AL-KHUBAIB IT — বাংলাদেশের ওয়েব ডিজাইন ও ডেভেলপমেন্ট কোম্পানি", desc_en: "Professional web development, software and digital services.", desc_bn: "প্রফেশনাল ওয়েব ডেভেলপমেন্ট, সফটওয়্যার ও ডিজিটাল সার্ভিস।" },
    },
    {
      id: "page_about", title: { en: "About Us", bn: "আমাদের সম্পর্কে" }, slug: "/about", status: "published", is_system: true, order: 2,
      content: { en: "AL-KHUBAIB IT is an IT-based web design, development and software service organization.", bn: "AL-KHUBAIB IT একটি আইটি-ভিত্তিক ওয়েব ডিজাইন, ডেভেলপমেন্ট ও সফটওয়্যার সার্ভিস প্রতিষ্ঠান।" },
      seo: { title_en: "About Us — AL-KHUBAIB IT", title_bn: "আমাদের সম্পর্কে — AL-KHUBAIB IT", desc_en: "", desc_bn: "" },
    },
  ];
  db.tables.page_sections = ([
    { id: uid("ps"), page_id: "page_home", key: "hero", title: { en: "Hero Section", bn: "হিরো সেকশন" }, content: { en: "Connecting Your Business to the Digital World", bn: "আপনার ব্যবসাকে যুক্ত করুন ডিজিটাল বিশ্বের সাথে" }, order: 1, enabled: true },
    { id: uid("ps"), page_id: "page_home", key: "services", title: { en: "Services Grid", bn: "সার্ভিস গ্রিড" }, content: { en: "Everything You Need to Go Digital", bn: "ডিজিটাল হতে প্রয়োজনীয় সবকিছু" }, order: 2, enabled: true },
    { id: uid("ps"), page_id: "page_home", key: "why", title: { en: "Why Choose Us", bn: "কেন আমরা" }, content: { en: "Why Choose AL-KHUBAIB IT?", bn: "কেন AL-KHUBAIB IT বেছে নেবেন?" }, order: 3, enabled: true },
    { id: uid("ps"), page_id: "page_home", key: "faq", title: { en: "FAQ", bn: "সাধারণ জিজ্ঞাসা" }, content: { en: "Frequently Asked Questions", bn: "প্রায়শই জিজ্ঞাসিত প্রশ্ন" }, order: 4, enabled: true },
    { id: uid("ps"), page_id: "page_home", key: "cta", title: { en: "Call to Action", bn: "কল টু অ্যাকশন" }, content: { en: "Have a Digital Project in Mind?", bn: "মনে কি কোনো ডিজিটাল প্রজেক্টের পরিকল্পনা আছে?" }, order: 5, enabled: true },
  ]);

  walletCredit(clientId, 5000, "Welcome bonus (demo balance)", "SEED");

  // ── Callback requests (Client Dashboard → Support) ──
  db.tables.callbacks = [];

  // ── Central Appointment integration (aminulkhan.com) ──
  // Master appointment records live on the central system — the company
  // site keeps only integration config, service mapping and API logs.
  db.tables.appointment_services = [
    { id: uid("aps"), name: { en: "Website Development Consultation", bn: "ওয়েবসাইট ডেভেলপমেন্ট কনসালটেশন" }, duration: 60, portfolio_service_id: "", status: "published", order: 1, created_at: nowISO() },
    { id: uid("aps"), name: { en: "Software & Systems Discussion", bn: "সফটওয়্যার ও সিস্টেম আলোচনা" }, duration: 45, portfolio_service_id: "", status: "published", order: 2, created_at: nowISO() },
    { id: uid("aps"), name: { en: "Education Solution (Infoedu) Demo", bn: "এডুকেশন সল্যুশন (Infoedu) ডেমো" }, duration: 45, portfolio_service_id: "", status: "published", order: 3, created_at: nowISO() },
    { id: uid("aps"), name: { en: "General IT Consultation", bn: "সাধারণ আইটি কনসালটেশন" }, duration: 30, portfolio_service_id: "", status: "published", order: 4, created_at: nowISO() },
  ];
  db.tables.appointment_logs = [];

  db.seed = SEED_VERSION;
  save();
}

export function resetDatabase() {
  try {
    localStorage.removeItem(DB_KEY);
  } catch { /* ignore */ }
  cache = null;
  version++;
  listeners.forEach((l) => l());
}

export function exportBackup(): string {
  return JSON.stringify(load(), null, 2);
}
