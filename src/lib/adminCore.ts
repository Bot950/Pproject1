// ─────────────────────────────────────────────────────────────
// RBAC (roles & granular permissions) + CMS layer helpers.
// Permissions are enforced in every admin view (not only menus).
// ─────────────────────────────────────────────────────────────
import { all, get, insert, update, remove, nowISO, logAction, getSettings } from "./db";

/* ── RBAC ─────────────────────────────────────────────────── */

export const MODULES = [
  "dashboard", "pages", "sections", "forms", "menus", "categories",
  "services", "products", "orders", "subscriptions", "coupons", "invoices",
  "customers", "wallets", "payments", "tickets", "callbacks", "appointments",
  "applications", "affiliates", "commissions", "withdrawals", "campaigns",
  "reports", "ledger", "users", "roles", "notifications",
  "email", "telegram", "settings", "logs", "backup",
] as const;

export type ModuleKey = (typeof MODULES)[number];

export function rolePerms(user: { role: string; admin_role?: string; id: string }): string[] {
  if (user.role === "super_admin") return ["*"];
  if (user.role === "admin" && !user.admin_role) return ["*"]; // legacy full admin
  const role = all("roles").find((r) => r.name === user.admin_role);
  return role?.permissions || [];
}

export function can(user: { role: string; admin_role?: string; id: string } | null | undefined, module: ModuleKey): boolean {
  if (!user) return false;
  const p = rolePerms(user);
  return p.includes("*") || p.includes(module);
}

export function isSuperAdmin(user: { role: string } | null | undefined): boolean {
  return user?.role === "super_admin";
}

/* ── CMS: pages, sections, revisions ──────────────────────── */

export function savePage(id: string, patch: any, admin: string) {
  const prev = get("pages", id);
  if (prev) {
    insert("page_revisions", {
      page_id: id, snapshot: { title: prev.title, content: prev.content, seo: prev.seo, status: prev.status },
      admin, created_at: nowISO(),
    });
    logAction(admin, "page_update", `${patch.title?.en || prev.title?.en || id} (old: ${prev.title?.en})`);
  }
  if (id === "new") return insert("pages", { ...patch, created_at: nowISO() });
  return update("pages", id, patch);
}

export function saveSection(id: string, patch: any, admin: string) {
  const prev = get("page_sections", id);
  if (prev) {
    insert("page_revisions", {
      page_id: prev.page_id, section_id: id, snapshot: { title: prev.title, content: prev.content, enabled: prev.enabled },
      admin, created_at: nowISO(),
    });
    logAction(admin, "section_update", `${prev.key} (${prev.title?.en})`);
  }
  if (id === "new") return insert("page_sections", { ...patch, created_at: nowISO() });
  return update("page_sections", id, patch);
}

export function revisionsFor(pageId: string, sectionId?: string) {
  return all("page_revisions")
    .filter((r) => r.page_id === pageId && (!sectionId || r.section_id === sectionId))
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
}

/* ── Forms ────────────────────────────────────────────────── */

export const FIELD_TYPES = ["text", "email", "phone", "number", "textarea", "select", "radio", "checkbox", "date", "time", "file", "address", "hidden"];

export function saveForm(id: string, patch: any, admin: string) {
  logAction(admin, id === "new" ? "form_create" : "form_update", patch.name?.en || id);
  if (id === "new") {
    const f = insert("forms", { ...patch, created_at: nowISO() });
    return f.id;
  }
  update("forms", id, patch);
  return id;
}

export function saveFormFields(formId: string, fields: any[]) {
  all("form_fields").filter((f) => f.form_id === formId).forEach((f) => remove("form_fields", f.id));
  fields.forEach((f, i) => insert("form_fields", { ...f, id: undefined, form_id: formId, order: i + 1, created_at: nowISO() }));
}

export function submitForm(formId: string, data: Record<string, any>) {
  const form = get("forms", formId);
  if (!form || form.status !== "published") return null;
  return insert("form_submissions", { form_id: formId, data, status: "pending", created_at: nowISO() });
}

/* ── Categories with commission inheritance ───────────────── */

export function categoryPath(categoryId: string): string[] {
  const ids: string[] = [];
  let cur = get("categories", categoryId);
  while (cur) {
    ids.unshift(cur.id);
    cur = cur.parent_id ? get("categories", cur.parent_id) : undefined;
  }
  return ids;
}

/** Priority: product/service → subcategory → category → global default. */
export function resolveCommission(item: any): { type: string; initial: number; renewal: number; renewalEnabled: boolean; enabled: boolean } {
  if (item?.commission?.enabled !== undefined) return item.commission;
  const catIds = categoryPath(item?.category_id || "");
  for (const cid of catIds) {
    const c = get("categories", cid);
    if (c?.commission?.enabled !== undefined && c.commission.enabled) return c.commission;
  }
  const g = getSettings();
  const def = g.affiliate?.defaultCommission ?? 10;
  return { type: "percent", initial: def, renewal: 0, renewalEnabled: false, enabled: true };
}

/* ── Menus ────────────────────────────────────────────────── */

export function menuTree() {
  return all("menu_items")
    .filter((m) => m.enabled)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}
