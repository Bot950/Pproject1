import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Icon, type IconName } from "./Icons";
import { Button } from "./ui";
import { useI18n } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import { getSettings } from "../lib/db";
import {
  CONTACT,
  NAV,
  TOPBAR,
  BTN,
  HERO,
  FOOTER,
  CTA,
  SERVICE_CATEGORIES,
  CAREER,
} from "../lib/content";
import { cn } from "../utils/cn";

/* ─────────────────── Page meta management ─────────────────── */

export function usePageMeta(title: string, description?: string) {
  const { lang } = useI18n();
  useEffect(() => {
    const fullTitle =
      lang === "bn" ? `${title} | AL-KHUBAIB IT` : `${title} | AL-KHUBAIB IT`;
    document.title = title;
    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", description);
    }
    // Keep OG title in sync for the active language
    const og = document.querySelector('meta[property="og:title"]');
    if (og) og.setAttribute("content", fullTitle);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc && description) ogDesc.setAttribute("content", description);
  }, [title, description, lang]);
}

export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  return null;
}

/* ─────────────────────── Language switch ──────────────────── */

export function LangSwitch({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const { lang, setLang } = useI18n();
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-ink-200 bg-white p-1 shadow-sm",
        className
      )}
      role="group"
      aria-label="Language / ভাষা"
    >
      <button
        type="button"
        onClick={() => setLang("bn")}
        aria-pressed={lang === "bn"}
        className={cn(
          "rounded-full font-semibold transition-all duration-300",
          compact ? "px-3 py-1 text-xs" : "px-3.5 py-1.5 text-[13px]",
          lang === "bn"
            ? "bg-gradient-to-r from-brand-700 to-brand-500 text-white shadow"
            : "text-ink-500 hover:text-brand-600"
        )}
      >
        বাংলা
      </button>
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={cn(
          "rounded-full font-semibold transition-all duration-300",
          compact ? "px-3 py-1 text-xs" : "px-3.5 py-1.5 text-[13px]",
          lang === "en"
            ? "bg-gradient-to-r from-brand-700 to-brand-500 text-white shadow"
            : "text-ink-500 hover:text-brand-600"
        )}
      >
        English
      </button>
    </div>
  );
}

/* ─────────────────────────── Logo ─────────────────────────── */

export function Logo({ dark = false }: { dark?: boolean }) {
  const { t } = useI18n();
  return (
    <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="AL-KHUBAIB IT — Home">
      <span className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 shadow-lg shadow-brand-600/30">
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" aria-hidden="true" focusable="false">
          <path
            d="M4 7h3.4v2H6v6h1.4v2H4V7zm7 0h2.2l2.9 5V7H18v10h-2.2l-2.9-5v5h-1.9V7zM9.6 11.5a2.3 2.3 0 1 1 0 4.6 2.3 2.3 0 0 1 0-4.6z"
            fill="currentColor"
          />
        </svg>
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
      </span>
      <span className="leading-tight">
        <span
          className={cn(
            "block font-display font-bold text-[15px] sm:text-base tracking-tight",
            dark ? "text-white" : "text-ink-900"
          )}
        >
          AL-KHUBAIB <span className="text-gradient-dark">IT</span>
        </span>
        <span
          className={cn(
            "block text-[10px] font-semibold uppercase tracking-[0.22em]",
            dark ? "text-brand-200" : "text-ink-400"
          )}
        >
          {t(FOOTER.logoSub)}
        </span>
      </span>
    </Link>
  );
}

/* ───────────────────────── Header ─────────────────────────── */

type NavEntry = {
  to?: string;
  label: React.ReactNode;
  menu?: { to: string; label: React.ReactNode; icon: string }[];
  path?: string;
};

function Dropdown({
  label,
  path,
  menu,
  onNavigate,
}: {
  label: React.ReactNode;
  path?: string;
  menu: { to: string; label: React.ReactNode; icon: string }[];
  onNavigate: () => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const mega = menu.length > 5; // mega menu layout for large groups
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        className={cn(
          "nav-link flex items-center gap-1 xl:text-[13px] 2xl:text-sm font-semibold text-ink-700 hover:text-brand-600 transition-colors py-2 whitespace-nowrap",
          open && "text-brand-600 active"
        )}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {label}
        <Icon name="chevron" className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className={cn("absolute left-1/2 -translate-x-1/2 top-full pt-3 z-50", mega ? "w-[480px]" : "w-[300px]")}>
          <div className="rounded-2xl bg-white shadow-xl shadow-ink-900/10 border border-ink-100 p-2">
            {path && (
              <>
                <Link
                  to={path}
                  onClick={onNavigate}
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold text-brand-700 hover:bg-brand-50 transition-colors"
                >
                  {menu.length > 6 ? t({ en: "View all services", bn: "সব সার্ভিস দেখুন" }) : t({ en: "View all", bn: "সব দেখুন" })}
                  <Icon name="arrow" className="w-4 h-4" />
                </Link>
                <div className="my-1.5 h-px bg-ink-100" />
              </>
            )}
            <div className={cn(mega && "grid grid-cols-2 gap-x-2")}>
              {menu.map((m) => (
                <Link
                  key={m.to + "-" + (typeof m.label === "string" ? m.label : m.to)}
                  to={m.to}
                  onClick={() => {
                    setOpen(false);
                    onNavigate();
                  }}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-ink-700 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                >
                  <Icon name={m.icon as IconName} className="w-4 h-4 text-brand-500 shrink-0" />
                  <span className="truncate">{m.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { t } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const settings = getSettings();

  const portalHref =
    !user
      ? "/portal/login"
      : user.role === "super_admin" || user.role === "admin"
        ? "/admin"
        : user.role === "affiliate"
          ? "/portal/affiliate"
          : "/portal/dashboard";
  const portalLabel = !user
    ? t({ en: "Sign In", bn: "সাইন ইন" })
    : user.role === "super_admin" || user.role === "admin"
      ? t({ en: "Admin Panel", bn: "অ্যাডমিন প্যানেল" })
      : user.role === "affiliate"
        ? t({ en: "Affiliate Panel", bn: "এফিলিয়েট প্যানেল" })
        : t({ en: "My Dashboard", bn: "আমার ড্যাশবোর্ড" });

  const servicesMenu = SERVICE_CATEGORIES.map((c) => ({
    to: c.cta.href,
    label: t(c.name),
    icon: c.icon,
  }));

  const solutionsMenu = [
    { to: "/services/software-development", label: t(SERVICE_CATEGORIES[1].name), icon: "cpu" },
    { to: "/services/education-management", label: t(SERVICE_CATEGORIES[2].name), icon: "cap" },
    { to: "/services/domain-hosting", label: t(SERVICE_CATEGORIES[5].name), icon: "server" },
    { to: "/products", label: t(NAV.products), icon: "folder" },
    { to: "/portfolio", label: t(NAV.portfolio), icon: "briefcase" },
    { to: "/courses", label: t(NAV.courses), icon: "book" },
  ];

  const careerMenu = [
    { to: "/career", label: t(CAREER.nav.opportunities), icon: "briefcase" },
    { to: "/career?section=affiliate", label: t(CAREER.nav.affiliate), icon: "network" },
    { to: "/career?section=smart", label: t(CAREER.nav.smartEarning), icon: "card" },
    { to: "/career?section=how", label: t(CAREER.nav.howItWorks), icon: "map" },
    { to: "/career?section=apply", label: t(CAREER.nav.apply), icon: "send" },
    { to: "/career?section=faq", label: t(CAREER.nav.faq), icon: "chat" },
  ];

  // Condensed primary navigation with mega menus — guaranteed to fit
  // 1280px+ without overflow (nav is hidden below xl in favor of the drawer).
  const nav: NavEntry[] = [
    { to: "/", label: t(NAV.home) },
    { to: "/about", label: t(NAV.about) },
    { label: t(NAV.services), menu: servicesMenu, path: "/services" },
    { to: "/services/web-development", label: t(NAV.webDev) },
    { label: t(NAV.solutions), menu: solutionsMenu },
    { to: "/shop", label: t({ en: "Shop", bn: "শপ" }) },
    { label: t(NAV.career), menu: careerMenu },
    { to: "/contact", label: t(NAV.contact) },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Top info bar */}
      <div className="hidden lg:block bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 text-white text-[13px]">
        <div className="container-x flex items-center justify-between h-9">
          <p className="font-medium truncate">{t(TOPBAR)}</p>
          <div className="flex items-center gap-5 shrink-0">
            <a href={CONTACT.phonePrimaryHref} className="flex items-center gap-1.5 hover:text-brand-200 transition-colors">
              <Icon name="phone" className="w-3.5 h-3.5" /> {CONTACT.phonePrimary}
            </a>
            <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-1.5 hover:text-brand-200 transition-colors">
              <Icon name="mail" className="w-3.5 h-3.5" /> {CONTACT.email}
            </a>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header
        className={cn(
          "sticky top-0 z-50 w-full bg-white/90 backdrop-blur-xl transition-all duration-300",
          scrolled ? "shadow-lg shadow-ink-900/5 border-b border-ink-100" : "border-b border-transparent"
        )}
      >
        <div
          className={cn(
            "container-x flex items-center justify-between gap-3 transition-all duration-300",
            scrolled ? "h-16" : "h-18 lg:h-20"
          )}
        >
          <Logo />

          {/* Desktop nav — condensed spacing + nowrap so it always fits 1280px+ */}
          <nav className="hidden xl:flex items-center gap-4 2xl:gap-6 min-w-0" aria-label="Main navigation">
            {nav.map((item) =>
              item.menu ? (
                <Dropdown key={item.path ?? "menu-" + String(item.label)} {...item} menu={item.menu} onNavigate={() => {}} />
              ) : (
                <NavLink
                  key={item.to}
                  to={item.to ?? "/"}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    cn(
                      "nav-link xl:text-[13px] 2xl:text-sm font-semibold text-ink-700 hover:text-brand-600 transition-colors whitespace-nowrap",
                      isActive && "text-brand-600 active"
                    )
                  }
                >
                  {item.label}
                </NavLink>
              )
            )}
          </nav>

          <div className="flex items-center gap-2 xl:gap-2.5 shrink-0">
            <LangSwitch className="hidden md:inline-flex" />
            <a
              href={`https://wa.me/8801926100643?text=${encodeURIComponent(t(HERO.waQuote))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex lg:hidden xl:flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors"
              aria-label={t(NAV.chatWhatsApp)}
            >
              <Icon name="whatsapp" className="w-5 h-5" />
            </a>
            <Button to={portalHref} variant="secondary" size="sm" className="hidden lg:inline-flex">
              <Icon name={user ? "user" : "lock"} className="w-4 h-4 shrink-0" />
              <span className="max-w-28 truncate">{user ? user.name.split(" ")[0] : portalLabel}</span>
            </Button>
            {user && (
              <Button
                onClick={logout}
                variant="ghost"
                size="sm"
                className="hidden lg:inline-flex !text-red-500 hover:!bg-red-50"
              >
                {t({ en: "Logout", bn: "লগআউট" })}
              </Button>
            )}
            <Button to="/contact" size="sm" className="hidden sm:inline-flex">
              {t(BTN.getQuote)}
              <Icon name="arrow" className="w-4 h-4" />
            </Button>
            <button
              className="xl:hidden w-11 h-11 rounded-xl border border-ink-100 flex items-center justify-center text-ink-800 hover:bg-brand-50 hover:border-brand-200 transition-colors"
              onClick={() => setMobileOpen(true)}
              aria-label={t(NAV.openMenu)}
            >
              <Icon name="menu" className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Site notice banner (managed from Admin → Content) */}
      {settings?.notice?.enabled && (settings.notice.en || settings.notice.bn) && (
        <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 text-white text-sm">
          <div className="container-x flex items-center gap-2.5 py-2.5">
            <Icon name="bell" className="w-4 h-4 shrink-0" />
            <p className="font-medium">{t({ en: settings.notice.en || "", bn: settings.notice.bn || "" })}</p>
          </div>
        </div>
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-[60] xl:hidden transition-opacity duration-300",
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        aria-hidden={!mobileOpen}
      >
        <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        <div
          className={cn(
            "absolute right-0 top-0 h-full w-[86%] max-w-sm bg-white shadow-2xl flex flex-col transition-transform duration-300",
            mobileOpen ? "translate-x-0" : "translate-x-full"
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          <div className="flex items-center justify-between px-5 h-16 border-b border-ink-100">
            <Logo />
            <button
              className="w-10 h-10 rounded-xl border border-ink-100 flex items-center justify-center"
              onClick={() => setMobileOpen(false)}
              aria-label={t(NAV.closeMenu)}
            >
              <Icon name="x" className="w-5 h-5" />
            </button>
          </div>
          <div className="px-5 pt-3">
            <LangSwitch className="w-full justify-between" />
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
            <MobileNavGroup title={t(NAV.menu)}>
              {[
                { to: "/", label: t(NAV.home) },
                { to: "/about", label: t(NAV.about) },
                { to: "/services/web-development", label: t(NAV.webDev) },
                { to: "/shop", label: t({ en: "Shop", bn: "শপ" }) },
                { to: "/appointment", label: t({ en: "Schedule a Meeting", bn: "মিটিং নির্ধারণ করুন" }) },
                { to: "/portfolio", label: t(NAV.portfolio) },
                { to: "/courses", label: t(NAV.courses) },
                { to: "/career", label: t(NAV.career) },
                { to: "/faq", label: t(NAV.faq) },
                { to: "/contact", label: t(NAV.contact) },
                { to: portalHref, label: portalLabel },
              ].map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-medium text-ink-800 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                  {l.label}
                </Link>
              ))}
            </MobileNavGroup>
            <MobileNavGroup title={t(NAV.ourServices)}>
              {servicesMenu.map((m) => (
                <Link
                  key={m.to}
                  to={m.to}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-medium text-ink-800 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                >
                  <Icon name={m.icon as IconName} className="w-4.5 h-4.5 text-brand-500 shrink-0" />
                  {m.label}
                </Link>
              ))}
            </MobileNavGroup>
            <MobileNavGroup title={t(NAV.career)}>
              {careerMenu.map((m) => (
                <Link
                  key={m.to}
                  to={m.to}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-medium text-ink-800 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                >
                  <Icon name={m.icon as IconName} className="w-4.5 h-4.5 text-brand-500 shrink-0" />
                  {m.label}
                </Link>
              ))}
            </MobileNavGroup>
            <MobileNavGroup title={t(NAV.support)}>
              {[
                { to: "/verify-certificate", label: t(NAV.certVerify) },
                { to: "/privacy-policy", label: t(NAV.privacyPolicy) },
                { to: "/terms", label: t(NAV.terms) },
              ].map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-medium text-ink-800 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-300" />
                  {l.label}
                </Link>
              ))}
            </MobileNavGroup>
          </div>
          <div className="p-5 border-t border-ink-100 space-y-2.5">
            {/* SIGN IN above GET A QUOTE — same professional style, full width */}
            <Button
              to={portalHref}
              variant="secondary"
              className="w-full py-3 text-[15px]"
            >
              <Icon name="lock" className="w-4.5 h-4.5" />
              {t({ en: "Sign In", bn: "সাইন ইন" })}
            </Button>
            <Button to="/contact" className="w-full py-3 text-[15px]">
              {t(BTN.getQuote)}
            </Button>
            <Button href={`https://wa.me/8801926100643?text=${encodeURIComponent(t(HERO.waDefault))}`} variant="whatsapp" className="w-full py-3 text-[15px]">
              <Icon name="whatsapp" className="w-4.5 h-4.5" />
              {t(NAV.chatWhatsApp)}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

function MobileNavGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-2">
      <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-400">{title}</p>
      {children}
    </div>
  );
}

/* ─────────────────── Mobile bottom nav ────────────────────── */

type BottomNavItem = {
  to?: string;
  href?: string;
  label: React.ReactNode;
  icon: string;
};

export function MobileBottomNav() {
  const { t } = useI18n();
  const items: BottomNavItem[] = [
    { to: "/", label: t(NAV.home), icon: "monitor" },
    { to: "/services", label: t(NAV.services), icon: "layers" },
    { href: `https://wa.me/8801926100643?text=${encodeURIComponent(t(HERO.waHelp))}`, label: t(SECTIONS_LABEL.whatsapp), icon: "whatsapp" },
    { href: CONTACT.phoneSecondaryHref, label: t(SECTIONS_LABEL.call), icon: "phone" },
    { to: "/contact", label: t(NAV.contact), icon: "mail" },
  ];
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl border-t border-ink-100 shadow-[0_-6px_24px_-12px_rgba(13,11,28,0.25)]"
      aria-label={t(NAV.quickActions)}
    >
      <div className="grid grid-cols-5">
        {items.map((item, idx) => {
          const isWa = idx === 2;
          const isCall = idx === 3;
          const inner = (
            <span className="flex flex-col items-center gap-0.5 py-2">
              <span
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
                  isWa ? "text-emerald-500 bg-emerald-500/10" : isCall ? "text-brand-600 bg-brand-50" : "text-ink-500"
                )}
              >
                <Icon name={item.icon as IconName} className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-semibold text-ink-600 truncate max-w-full px-1">
                {isWa ? "WhatsApp" : item.label}
              </span>
            </span>
          );
          if (item.to) {
            return (
              <NavLink key={item.to} to={item.to} className="flex justify-center" end={item.to === "/"}>
                {inner}
              </NavLink>
            );
          }
          return (
            <a key={item.href} href={item.href} target={isWa ? "_blank" : undefined} rel={isWa ? "noopener noreferrer" : undefined} className="flex justify-center">
              {inner}
            </a>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}

const SECTIONS_LABEL = {
  call: { en: "Call", bn: "কল করুন" },
  whatsapp: { en: "WhatsApp", bn: "হোয়াটসঅ্যাপ" },
};

/* ─────────────────── Floating actions ─────────────────────── */

export function FloatingActions() {
  const { t } = useI18n();
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div
      className={cn(
        "fixed right-4 bottom-20 md:bottom-6 z-40 flex flex-col gap-2.5 transition-all duration-500",
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}
    >
      <a
        href={`https://wa.me/8801926100643?text=${encodeURIComponent(t(HERO.waHelp))}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t(NAV.chatWhatsApp)}
        className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 hover:scale-110 transition-transform"
      >
        <Icon name="whatsapp" className="w-6 h-6" />
        <span className="absolute right-14 whitespace-nowrap text-xs font-semibold bg-ink-900 text-white px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {t(NAV.chatWhatsApp)}
        </span>
      </a>
      <a
        href={CONTACT.phoneSecondaryHref}
        aria-label={t(SECTIONS_LABEL.call)}
        className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-brand-700 to-brand-500 text-white shadow-lg shadow-brand-600/40 hover:scale-110 transition-transform"
      >
        <Icon name="phone" className="w-5 h-5" />
        <span className="absolute right-14 whitespace-nowrap text-xs font-semibold bg-ink-900 text-white px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {CONTACT.phoneSecondary}
        </span>
      </a>
    </div>
  );
}

/* ─────────────────────── Big CTA section ──────────────────── */

export function CtaSection({ title, desc }: { title?: string; desc?: string }) {
  const { t } = useI18n();
  return (
    <section className="container-x pb-16 sm:pb-24">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-900 via-brand-700 to-brand-600 px-6 py-14 sm:px-12 sm:py-20 text-center">
        <div className="absolute inset-0 bg-grid" aria-hidden="true" />
        <div className="absolute -top-24 -left-20 w-72 h-72 rounded-full bg-brand-400/40 blur-[90px] animate-blob" aria-hidden="true" />
        <div className="absolute -bottom-28 -right-16 w-80 h-80 rounded-full bg-brand-800/70 blur-[100px] animate-blob" style={{ animationDelay: "-9s" }} aria-hidden="true" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-100">
            <Icon name="zap" className="w-4 h-4" />
            {t(CTA.badge)}
          </span>
          <h2 className="mt-4 font-display font-bold text-white text-3xl sm:text-4xl lg:text-[42px] leading-tight tracking-tight">
            {title ?? t(CTA.title)}
          </h2>
          <p className="mt-4 mx-auto max-w-2xl text-brand-100/90 text-base sm:text-lg leading-relaxed">
            {desc ?? t(CTA.desc)}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Button to="/contact" size="lg" className="w-full sm:w-auto bg-white text-brand-700 hover:bg-brand-50 from-white via-white to-white shadow-xl shadow-ink-950/25">
              {t(BTN.startProject)}
              <Icon name="arrow" className="w-4.5 h-4.5" />
            </Button>
            <Button
              href={`https://wa.me/8801926100643?text=${encodeURIComponent(t(HERO.waDiscuss))}`}
              variant="whatsapp"
              size="lg"
              className="w-full sm:w-auto"
            >
              <Icon name="whatsapp" className="w-5 h-5" />
              {t(BTN.whatsappTalk)}
            </Button>
          </div>
          <p className="mt-6 text-sm text-brand-100/70">{t(CTA.footnote)}</p>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────── Footer ────────────────────────── */

export function Footer() {
  const { t } = useI18n();
  const companyLinks = [
    { to: "/about", label: t(NAV.about) },
    { to: "/services", label: t(NAV.services) },
    { to: "/portfolio", label: t(NAV.portfolio) },
    { to: "/courses", label: t(NAV.courses) },
    { to: "/career", label: t(NAV.career) },
    { to: "/contact", label: t(NAV.contact) },
  ];
  const serviceLinks = [
    { to: "/services/web-development", label: t(SERVICE_CATEGORIES[0].name) },
    { to: "/services/software-development", label: t(SERVICE_CATEGORIES[1].name) },
    { to: "/services/online-services", label: t(SERVICE_CATEGORIES[3].name) },
    { to: "/services/citizen-services", label: t(SERVICE_CATEGORIES[4].name) },
    { to: "/services/education-management", label: t(SERVICE_CATEGORIES[2].name) },
    { to: "/services/domain-hosting", label: t(SERVICE_CATEGORIES[5].name) },
    { to: "/services/graphic-design", label: t(SERVICE_CATEGORIES[6].name) },
    { to: "/services/digital-marketing", label: t(SERVICE_CATEGORIES[7].name) },
  ];
  return (
    <footer className="bg-ink-950 text-ink-200 pb-24 md:pb-0">
      <div className="container-x pt-16 pb-10">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12">
          {/* Brand */}
          <div className="lg:col-span-4">
            <Logo dark />
            <p className="mt-5 text-sm leading-relaxed text-ink-300 max-w-sm">{t(FOOTER.desc)}</p>
            <div className="mt-6 flex items-center gap-2.5">
              <a
                href={`https://wa.me/8801926100643?text=${encodeURIComponent(t(HERO.waDefault))}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all"
              >
                <Icon name="whatsapp" className="w-5 h-5" />
              </a>
              <a
                href={`mailto:${CONTACT.email}`}
                aria-label="Email"
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-brand-600 hover:text-white hover:border-brand-600 transition-all"
              >
                <Icon name="mail" className="w-5 h-5" />
              </a>
              <a
                href={CONTACT.phonePrimaryHref}
                aria-label="Call us"
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-brand-600 hover:text-white hover:border-brand-600 transition-all"
              >
                <Icon name="phone" className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Company */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-[0.14em]">{t(FOOTER.company)}</h3>
            <ul className="mt-5 space-y-3 text-sm">
              {companyLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-ink-300 hover:text-brand-300 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="lg:col-span-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-[0.14em]">{t(FOOTER.services)}</h3>
            <ul className="mt-5 space-y-3 text-sm">
              {serviceLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-ink-300 hover:text-brand-300 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources + Contact */}
          <div className="lg:col-span-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-[0.14em]">{t(FOOTER.resources)}</h3>
            <ul className="mt-5 space-y-3 text-sm">
              <li><Link to="/products" className="text-ink-300 hover:text-brand-300 transition-colors">{t(NAV.products)}</Link></li>
              <li><Link to="/courses" className="text-ink-300 hover:text-brand-300 transition-colors">{t(NAV.courses)}</Link></li>
              <li><Link to="/faq" className="text-ink-300 hover:text-brand-300 transition-colors">{t(NAV.faq)}</Link></li>
              <li><Link to="/verify-certificate" className="text-ink-300 hover:text-brand-300 transition-colors">{t(NAV.certVerify)}</Link></li>
              <li><Link to="/privacy-policy" className="text-ink-300 hover:text-brand-300 transition-colors">{t(NAV.privacyPolicy)}</Link></li>
              <li><Link to="/terms" className="text-ink-300 hover:text-brand-300 transition-colors">{t(NAV.terms)}</Link></li>
            </ul>
            <h3 className="mt-8 text-sm font-bold text-white uppercase tracking-[0.14em]">{t(FOOTER.contact)}</h3>
            <ul className="mt-5 space-y-3 text-sm text-ink-300">
              <li>
                <a href={CONTACT.phonePrimaryHref} className="flex items-center gap-2.5 hover:text-brand-300 transition-colors">
                  <Icon name="phone" className="w-4 h-4 text-brand-400 shrink-0" />
                  {CONTACT.phonePrimary}
                </a>
              </li>
              <li>
                <a href={CONTACT.phoneSecondaryHref} className="flex items-center gap-2.5 hover:text-brand-300 transition-colors">
                  <Icon name="phone" className="w-4 h-4 text-brand-400 shrink-0" />
                  {CONTACT.phoneSecondary}
                </a>
              </li>
              <li>
                <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-2.5 hover:text-brand-300 transition-colors break-all">
                  <Icon name="mail" className="w-4 h-4 text-brand-400 shrink-0" />
                  {CONTACT.email}
                </a>
              </li>
              <li>
                <a href={`mailto:${CONTACT.emailSupport}`} className="flex items-center gap-2.5 hover:text-brand-300 transition-colors break-all">
                  <Icon name="mail" className="w-4 h-4 text-brand-400 shrink-0" />
                  {CONTACT.emailSupport}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-ink-400">
          <p>{t(FOOTER.copyright)}</p>
          <p>
            {t(FOOTER.parent)} <span className="text-brand-300 font-medium">{CONTACT.parentGroup}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
