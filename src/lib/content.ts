// ─────────────────────────────────────────────────────────────
// AL-KHUBAIB IT — raw company facts + re-exports of the
// bilingual content dictionary.
// All business information is sourced from the official website
// https://alkhubaibit.com (verified February 2026).
// ─────────────────────────────────────────────────────────────

export const CONTACT = {
  phonePrimary: "+880 9638 238 576",
  phoneSecondary: "+880 1926 100 643",
  phonePrimaryHref: "tel:+8809638238576",
  phoneSecondaryHref: "tel:+8801926100643",
  email: "contact@alkhubaibit.com",
  emailSupport: "support@alkhubaibit.com",
  website: "https://alkhubaibit.com",
  parentGroup: "Aminul Khan Group",
};

/** Official WhatsApp number published on the official website. */
export const WA_NUMBER = "8801926100643";

export function waLink(text?: string) {
  const defaultText =
    "Assalamu Alaikum, I would like to know more about AL-KHUBAIB IT services.";
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text ?? defaultText)}`;
}

// ── Verified statistics (from the official website) ──────────
export const STATS = [
  { value: 5, suffix: "+", key: "years" },
  { value: 30, suffix: "+", key: "programmers" },
  { value: 1100, suffix: "+", key: "reviews" },
  { value: 0, suffix: "", key: "inhouse" },
];

export const VERIFY_NOTE =
  "Verification results are issued against the official AL-KHUBAIB IT verification database.";

// ── Official external links (verified) ──────────────────────
export const OFFICIAL_LINKS = {
  website: "https://alkhubaibit.com",
  verify: "https://alkhubaibit.com/c-verify/",
  verifyAuthority: "https://alkhubaibit.com/verify/",
};

// ── Bilingual content dictionary re-exports ─────────────────
export {
  NAV,
  TOPBAR,
  BTN,
  HERO,
  STATS_LABELS,
  SERVICE_CATEGORIES,
  WEB_SITE_TYPES,
  WEB_PLATFORM_SERVICES,
  HOSTING_SERVICES,
  SOFTWARE_SERVICES,
  ONLINE_SERVICES,
  CITIZEN_SERVICES,
  EDUCATION_FEATURES,
  GRAPHIC_SERVICES,
  MARKETING_SERVICES,
  WHY_US,
  PROCESS,
  TECHNOLOGIES,
  INDUSTRIES,
  PRODUCTS,
  PORTFOLIO,
  PORTFOLIO_FILTERS,
  COURSE_AREAS,
  COURSES_NOTICE,
  FAQS,
  AUDIENCES,
  SECTIONS,
  CTA,
  FOOTER,
  PAGE_HEROS,
  CONTACT_FORM,
  CONTACT_INFO,
  VERIFY_TEXTS,
  ABOUT_TEXTS,
  PORTFOLIO_TEXTS,
  PRODUCT_TEXTS,
  LEGAL,
  NOTFOUND,
  CAREER,
} from "./translations";

import { SERVICE_CATEGORIES } from "./translations";

export function getCategory(slug: string) {
  return SERVICE_CATEGORIES.find((c) => c.slug === slug);
}
