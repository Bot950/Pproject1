import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Icon, type IconName } from "./Icons";
import { cn } from "../utils/cn";

/* ────────────────────────── Button ────────────────────────── */

type ButtonProps = {
  to?: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "dark" | "whatsapp" | "ghost" | "outline-light";
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
  type?: "button" | "submit";
  ariaLabel?: string;
};

export function Button({
  to,
  href,
  onClick,
  variant = "primary",
  size = "md",
  className,
  children,
  type = "button",
  ariaLabel,
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 select-none";
  const sizes = {
    sm: "text-sm px-4 py-2",
    md: "text-sm px-5 py-2.5 sm:text-[15px] sm:px-6 sm:py-3",
    lg: "text-base px-7 py-3.5",
  };
  const variants = {
    primary:
      "text-white bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 shadow-lg shadow-brand-600/30 hover:shadow-xl hover:shadow-brand-600/40 hover:-translate-y-0.5 active:translate-y-0",
    secondary:
      "text-brand-700 bg-white border border-brand-200 hover:border-brand-400 hover:bg-brand-50 shadow-sm hover:shadow",
    dark:
      "text-white bg-ink-900 hover:bg-ink-800 shadow-lg shadow-ink-900/25 hover:-translate-y-0.5",
    whatsapp:
      "text-white bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5",
    ghost: "text-brand-700 hover:bg-brand-50",
    "outline-light":
      "text-white border border-white/30 hover:border-white/70 hover:bg-white/10 backdrop-blur-sm",
  };
  const cls = cn(base, sizes[size], variants[variant], className);

  if (to)
    return (
      <Link to={to} className={cls} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  if (href)
    return (
      <a
        href={href}
        className={cls}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
        aria-label={ariaLabel}
      >
        {children}
      </a>
    );
  return (
    <button type={type} onClick={onClick} className={cls} aria-label={ariaLabel}>
      {children}
    </button>
  );
}

/* ────────────────────── Section heading ───────────────────── */

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  dark = false,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: string;
  align?: "center" | "left";
  dark?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className
      )}
    >
      {eyebrow && (
        <span
          className={cn(
            "inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] px-4 py-1.5 rounded-full",
            dark
              ? "bg-white/10 text-brand-200 border border-white/15"
              : "bg-brand-50 text-brand-700 border border-brand-100"
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-brand-500 to-brand-400" />
          {eyebrow}
        </span>
      )}
      <h2
        className={cn(
          "mt-4 font-display font-bold tracking-tight text-3xl sm:text-4xl leading-[1.15]",
          dark ? "text-white" : "text-ink-900"
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "mt-4 text-base sm:text-lg leading-relaxed",
            dark ? "text-brand-100/80" : "text-ink-500"
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* ─────────────────────── Scroll reveal ────────────────────── */

export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: 0 | 1 | 2 | 3 | 4;
  as?: "div" | "section" | "li" | "span";
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={cn(
        "reveal",
        visible && "is-visible",
        delay > 0 && `reveal-delay-${delay}`,
        className
      )}
    >
      {children}
    </Tag>
  );
}

/* ─────────────────────── Animated counter ─────────────────── */

export function Counter({
  value,
  suffix = "",
  duration = 1600,
  className,
}: {
  value: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true;
          const t0 = performance.now();
          const tick = (now: number) => {
            const p = Math.min((now - t0) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setDisplay(Math.round(eased * value));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          obs.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ───────────────────────── Page hero ──────────────────────── */

export function PageHero({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-ink-950 text-white">
      <div className="absolute inset-0 bg-grid" aria-hidden="true" />
      <div
        className="absolute -top-32 -right-24 w-[480px] h-[480px] rounded-full bg-brand-600/35 blur-[120px] animate-blob"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-40 -left-24 w-[420px] h-[420px] rounded-full bg-brand-500/25 blur-[110px] animate-blob"
        style={{ animationDelay: "-8s" }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink-950/60"
        aria-hidden="true"
      />
      <div className="container-x relative pt-16 pb-14 sm:pt-24 sm:pb-20">
        <div className="max-w-3xl animate-fade-in">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] px-4 py-1.5 rounded-full bg-white/10 text-brand-200 border border-white/15">
            <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-brand-400 to-brand-300" />
            {eyebrow}
          </span>
          <h1 className="mt-5 font-display font-bold tracking-tight text-3xl sm:text-4xl lg:text-5xl leading-[1.12]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-5 text-base sm:text-lg text-ink-100/80 leading-relaxed max-w-2xl">
              {subtitle}
            </p>
          )}
          {children}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── Breadcrumbs ──────────────────────── */

export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-ink-400">
        <li>
          <Link to="/" className="hover:text-brand-600 transition-colors">
            Home
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            <span aria-hidden="true" className="text-ink-300">
              /
            </span>
            {item.to ? (
              <Link to={item.to} className="hover:text-brand-600 transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-brand-700 font-medium" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ──────────────────── Feature list item ───────────────────── */

export function CheckItem({
  children,
  dark = false,
  className,
}: {
  children: React.ReactNode;
  dark?: boolean;
  className?: string;
}) {
  return (
    <li className={cn("flex items-start gap-3", className)}>
      <span
        className={cn(
          "mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center",
          dark ? "bg-brand-500/25 text-brand-200" : "bg-brand-50 text-brand-600"
        )}
      >
        <Icon name="check" className="w-3 h-3" strokeWidth={3} />
      </span>
      <span className={cn("text-[15px] leading-relaxed", dark ? "text-ink-100/90" : "text-ink-700")}>
        {children}
      </span>
    </li>
  );
}

/* ─────────────────────── FAQ accordion ────────────────────── */

export function FaqAccordion({
  faqs,
  dark = false,
}: {
  faqs: { q: string; a: string }[];
  dark?: boolean;
}) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-3">
      {faqs.map((f, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            className={cn(
              "rounded-2xl border transition-all duration-300",
              dark
                ? "border-white/10 bg-white/5"
                : "border-ink-100 bg-white shadow-soft",
              isOpen && (dark ? "border-brand-400/40 bg-white/10" : "border-brand-200")
            )}
          >
            <button
              className="flex w-full items-center justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5 text-left"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              aria-controls={`faq-panel-${i}`}
            >
              <span
                className={cn(
                  "font-semibold text-[15px] sm:text-base",
                  dark ? "text-white" : "text-ink-900"
                )}
              >
                {f.q}
              </span>
              <span
                className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300",
                  isOpen
                    ? "bg-gradient-to-br from-brand-600 to-brand-500 text-white border-transparent rotate-180"
                    : dark
                      ? "border-white/20 text-brand-200"
                      : "border-ink-200 text-ink-500"
                )}
              >
                <Icon name="chevron" className="w-4 h-4" />
              </span>
            </button>
            <div
              id={`faq-panel-${i}`}
              role="region"
              className={cn(
                "grid transition-all duration-300 ease-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <p
                  className={cn(
                    "px-5 pb-5 sm:px-6 text-[15px] leading-relaxed",
                    dark ? "text-ink-100/75" : "text-ink-500"
                  )}
                >
                  {f.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────── Icon tile (gradient) ─────────────────── */

export function IconTile({
  name,
  className,
  size = "md",
}: {
  name: IconName;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = { sm: "w-9 h-9", md: "w-12 h-12", lg: "w-14 h-14" };
  const iconSizes = { sm: "w-4 h-4", md: "w-5.5 h-5.5", lg: "w-7 h-7" };
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-600/25",
        sizes[size],
        className
      )}
    >
      <Icon name={name} className={cn(iconSizes[size], "w-5 h-5")} />
    </span>
  );
}
