import { Link } from "react-router-dom";
import { Icon } from "../components/Icons";
import {
  Button,
  SectionHeading,
  Reveal,
  Counter,
  FaqAccordion,
  CheckItem,
  IconTile,
} from "../components/ui";
import { CtaSection, usePageMeta } from "../components/Layout";
import { useI18n } from "../lib/i18n";
import {
  CONTACT,
  HERO,
  BTN,
  SECTIONS,
  STATS_LABELS,
  SERVICE_CATEGORIES,
  WEB_SITE_TYPES,
  ONLINE_SERVICES,
  CITIZEN_SERVICES,
  EDUCATION_FEATURES,
  WHY_US,
  PROCESS,
  TECHNOLOGIES,
  INDUSTRIES,
  FAQS,
  PORTFOLIO,
  AUDIENCES,
} from "../lib/content";
import { cn } from "../utils/cn";

/* ────────────────────────── HERO ─────────────────────────── */

function HeroMockup() {
  const { t } = useI18n();
  return (
    <div className="relative mx-auto max-w-xl lg:max-w-none">
      <div className="relative rounded-2xl bg-white/95 shadow-2xl shadow-brand-950/60 ring-1 ring-white/20 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-ink-900">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <div className="ml-3 flex-1 flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-[11px] text-ink-200 font-medium">
            <Icon name="lock" className="w-3 h-3 text-emerald-400 shrink-0" />
            alkhubaibit.com
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-gradient-to-br from-brand-600 to-brand-400" />
              <span className="h-2 w-16 rounded-full bg-ink-200" />
            </div>
            <div className="hidden sm:flex gap-2">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="h-1.5 w-8 rounded-full bg-ink-100" />
              ))}
            </div>
            <span className="h-6 w-16 rounded-lg bg-gradient-to-r from-brand-600 to-brand-500" />
          </div>
          <div className="mt-4 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100/60 p-4">
            <span className="inline-block h-2 w-24 rounded-full bg-brand-200" />
            <div className="mt-2.5 space-y-2">
              <span className="block h-3 w-3/4 rounded-full bg-ink-300/70" />
              <span className="block h-3 w-1/2 rounded-full bg-ink-300/70" />
            </div>
            <div className="mt-3 flex gap-2">
              <span className="h-7 w-24 rounded-lg bg-gradient-to-r from-brand-700 to-brand-500" />
              <span className="h-7 w-24 rounded-lg border border-brand-200" />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2.5">
            {[
              { v: "5+", l: t(STATS_LABELS.years) },
              { v: "30+", l: t(STATS_LABELS.programmers) },
              { v: "1,100+", l: t(STATS_LABELS.reviews) },
            ].map((s) => (
              <div key={s.l} className="rounded-lg border border-ink-100 bg-white p-2.5 text-center shadow-soft">
                <p className="font-display font-bold text-brand-600 text-sm sm:text-base">{s.v}</p>
                <p className="text-[9px] sm:text-[10px] text-ink-400 font-medium leading-tight mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2.5">
            {["from-brand-600 to-brand-400", "from-ink-800 to-ink-700", "from-brand-500 to-brand-300"].map((g, i) => (
              <div key={i} className={cn("h-16 rounded-lg bg-gradient-to-br opacity-90", g)}>
                <div className="h-full w-full p-2">
                  <span className="block w-6 h-6 rounded-md bg-white/25" />
                  <span className="mt-1.5 block h-1.5 w-4/5 rounded-full bg-white/40" />
                  <span className="mt-1 block h-1.5 w-3/5 rounded-full bg-white/25" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute -top-5 -right-3 sm:-right-6 animate-float">
        <div className="glass rounded-xl px-4 py-3 shadow-xl flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
            <Icon name="check" className="w-4.5 h-4.5" strokeWidth={2.5} />
          </span>
          <div>
            <p className="text-white text-xs font-semibold leading-tight">{t(HERO.mock1)}</p>
            <p className="text-[10px] text-white/60 mt-0.5">{t(HERO.mock2)}</p>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-8 -left-2 sm:-left-8 animate-float-slow hidden sm:block">
        <div className="rounded-xl bg-ink-900 ring-1 ring-white/15 shadow-2xl p-4 w-56">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-ink-400">index.php</span>
            <span className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-ink-600" />
              <span className="w-2 h-2 rounded-full bg-ink-600" />
            </span>
          </div>
          <pre className="text-[11px] leading-relaxed font-mono">
            <span className="text-brand-400">&lt;?php</span>
            {"\n"}
            <span className="text-ink-300">function</span> <span className="text-amber-300">build_dream</span>
            <span className="text-ink-400">()</span> {"{"}
            {"\n"}
            {"  "}<span className="text-ink-300">return</span> <span className="text-emerald-300">"Al-Khubaib IT"</span>;
            {"\n"}
            {"}"}
          </pre>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-full bg-brand-500" />
            <span className="w-6 h-6 rounded-full bg-amber-400" />
            <span className="w-6 h-6 rounded-full bg-ink-500" />
            <span className="ml-auto text-[10px] text-ink-400 font-mono">PHP · Laravel</span>
          </div>
        </div>
      </div>

      <div className="absolute top-1/2 -right-2 sm:-right-5 hidden md:flex flex-col gap-2 animate-float" style={{ animationDelay: "-3s" }}>
        {["WordPress", "Laravel", "React"].map((tech) => (
          <span key={tech} className="glass rounded-lg px-3 py-1.5 text-[11px] font-semibold text-brand-100 shadow-lg">
            {tech}
          </span>
        ))}
      </div>
    </div>
  );
}

function Hero() {
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden bg-ink-950 text-white">
      <div className="absolute inset-0 bg-grid" aria-hidden="true" />
      <div className="absolute -top-40 right-[10%] w-[560px] h-[560px] rounded-full bg-brand-600/40 blur-[130px] animate-blob" aria-hidden="true" />
      <div className="absolute bottom-0 left-[-10%] w-[480px] h-[480px] rounded-full bg-brand-500/25 blur-[120px] animate-blob" style={{ animationDelay: "-6s" }} aria-hidden="true" />
      <div className="absolute top-1/3 left-1/2 w-[300px] h-[300px] rounded-full bg-ink-800/80 blur-[80px]" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink-950/70" aria-hidden="true" />

      <div className="container-x relative grid lg:grid-cols-2 gap-14 lg:gap-10 items-center pt-14 pb-24 sm:pt-20 lg:pt-24 lg:pb-32">
        <div className="animate-fade-in">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-4 py-1.5 text-xs font-semibold text-brand-100">
            <Icon name="sparkle" className="w-3.5 h-3.5 text-brand-300 shrink-0" />
            {t(HERO.badge)}
          </span>
          <h1 className="mt-6 font-display font-bold tracking-tight text-4xl sm:text-5xl xl:text-[56px] leading-[1.15]">
            {t(HERO.title1)}{" "}
            <span className="bg-gradient-to-r from-brand-300 via-brand-400 to-brand-500 bg-clip-text text-transparent">
              {t(HERO.title2)}
            </span>
          </h1>
          <p className="mt-4 font-display font-semibold text-lg sm:text-xl text-white/90">{t(HERO.subhead)}</p>
          <p className="mt-4 text-base sm:text-lg text-ink-100/75 leading-relaxed max-w-xl">{t(HERO.desc)}</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3.5">
            <Button to="/contact" size="lg">
              {t(BTN.startProject)}
              <Icon name="arrow" className="w-4.5 h-4.5" />
            </Button>
            <Button to="/services" variant="outline-light" size="lg">
              {t(BTN.exploreServices)}
            </Button>
            <Button
              href={`https://wa.me/8801926100643?text=${encodeURIComponent(t(HERO.waDiscuss))}`}
              variant="whatsapp"
              size="lg"
              className="sm:hidden lg:inline-flex"
            >
              <Icon name="whatsapp" className="w-5 h-5" />
              WhatsApp
            </Button>
          </div>
          <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-ink-100/70">
            <span className="flex items-center gap-2">
              <Icon name="check" className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={2.5} />
              {t(HERO.trust1)}
            </span>
            <span className="flex items-center gap-2">
              <Icon name="check" className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={2.5} />
              {t(HERO.trust2)}
            </span>
            <span className="flex items-center gap-2">
              <Icon name="check" className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={2.5} />
              {t(HERO.trust3)}
            </span>
          </div>
        </div>
        <div className="relative lg:pl-6">
          <HeroMockup />
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────── STATS ────────────────────────── */

function Stats() {
  const { t } = useI18n();
  const tiles = [
    { value: 5, suffix: "+", key: "years", icon: "clock", counter: true },
    { value: 30, suffix: "+", key: "programmers", icon: "users", counter: true },
    { value: 1100, suffix: "+", key: "reviews", icon: "star", counter: true },
    { value: 0, suffix: "", key: "inhouse", icon: "cpu", counter: false },
  ] as const;
  const labelMap: Record<string, { en: string; bn: string }> = {
    years: STATS_LABELS.years,
    programmers: STATS_LABELS.programmers,
    reviews: STATS_LABELS.reviews,
    inhouse: STATS_LABELS.inhouse,
  };
  return (
    <section className="relative z-10 -mt-12 lg:-mt-16 pb-4">
      <div className="container-x">
        <Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 rounded-2xl bg-white shadow-xl shadow-ink-900/10 border border-ink-100 p-4 sm:p-6">
            {tiles.map((tl) => (
              <div key={tl.key} className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-xl hover:bg-brand-50/60 transition-colors">
                <span className="hidden sm:flex w-11 h-11 rounded-xl bg-brand-50 text-brand-600 items-center justify-center shrink-0">
                  <Icon name={tl.icon} className="w-5 h-5" />
                </span>
                <div>
                  {tl.counter ? (
                    <p className="font-display font-bold text-2xl sm:text-3xl text-ink-900 leading-none">
                      <Counter value={tl.value} suffix={tl.suffix} />
                    </p>
                  ) : (
                    <p className="font-display font-bold text-xl sm:text-2xl text-ink-900 leading-tight">
                      {t(STATS_LABELS.inhouseValue)}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] sm:text-xs font-medium text-ink-500 leading-tight">{t(labelMap[tl.key])}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─────────────────────── SERVICES GRID ───────────────────── */

export function ServiceCard({
  cat,
  compact = false,
  className,
}: {
  cat: (typeof SERVICE_CATEGORIES)[number];
  compact?: boolean;
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <Link
      to={cat.cta.href}
      className={cn(
        "group flex h-full flex-col rounded-2xl border border-ink-100 bg-white p-6 shadow-soft transition-all duration-300 hover:shadow-card hover:-translate-y-1 hover:border-brand-200",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <IconTile name={cat.icon as never} size={compact ? "sm" : "md"} />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400 group-hover:text-brand-500 transition-colors">
          {t(cat.audience)}
        </span>
      </div>
      <h3 className="mt-4 font-display font-bold text-lg text-ink-900 leading-snug group-hover:text-brand-700 transition-colors">
        {t(cat.name)}
      </h3>
      <p className={cn("mt-2 text-sm leading-relaxed text-ink-500", compact && "line-clamp-2")}>
        {t(cat.description)}
      </p>
      {!compact && (
        <ul className="mt-4 space-y-2">
          {cat.items.slice(0, 3).map((it, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-ink-600">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
              {t(it)}
            </li>
          ))}
        </ul>
      )}
      <span className="mt-auto pt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600">
        {t(cat.cta.label)}
        <Icon name="arrow" className="w-4 h-4 transition-transform group-hover:translate-x-1 shrink-0" />
      </span>
    </Link>
  );
}

function ServicesGrid() {
  const { t } = useI18n();
  const main = SERVICE_CATEGORIES.filter((c) => ["web-development", "software-development", "education-management", "online-services", "citizen-services"].includes(c.slug));
  const rest = SERVICE_CATEGORIES.filter((c) => !main.includes(c));

  return (
    <section className="container-x py-16 sm:py-24">
      <SectionHeading
        eyebrow={t(SECTIONS.services.eyebrow)}
        title={t(SECTIONS.services.title)}
        subtitle={t(SECTIONS.services.subtitle)}
      />
      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        <Reveal className="lg:col-span-2" delay={0}>
          <Link
            to="/services/web-development"
            className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 p-7 sm:p-9 text-white shadow-xl shadow-brand-900/25 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-grid" aria-hidden="true" />
            <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-widest">
                <Icon name="zap" className="w-3.5 h-3.5 shrink-0" />
                {t(SECTIONS.primary)}
              </span>
              <Icon name="code" className="w-10 h-10 text-brand-200" />
            </div>
            <div className="relative mt-6">
              <h3 className="font-display font-bold text-2xl sm:text-3xl tracking-tight">{t(SECTIONS.webDevCardTitle)}</h3>
              <p className="mt-3 text-brand-100/90 leading-relaxed max-w-xl">{t(SECTIONS.webDevCardDesc)}</p>
              <ul className="mt-6 grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
                {WEB_SITE_TYPES.slice(0, 6).map((s, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-brand-50/95">
                    <Icon name="check" className="w-4 h-4 text-brand-200 shrink-0" strokeWidth={2.5} />
                    {t(s)}
                  </li>
                ))}
              </ul>
              <span className="mt-8 inline-flex items-center gap-2 font-semibold text-sm text-white">
                {t(BTN.buildMyWebsite)}
                <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center transition-transform group-hover:translate-x-1">
                  <Icon name="arrow" className="w-4 h-4" />
                </span>
              </span>
            </div>
          </Link>
        </Reveal>

        {main.slice(1, 5).map((cat, i) => (
          <Reveal key={cat.slug} delay={((i + 1) % 4) as 0 | 1 | 2 | 3}>
            <ServiceCard cat={cat} />
          </Reveal>
        ))}
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {rest.map((cat, i) => (
          <Reveal key={cat.slug} delay={(i % 4) as 0 | 1 | 2 | 3}>
            <ServiceCard cat={cat} compact />
          </Reveal>
        ))}
        <Reveal delay={3}>
          <Link
            to="/services"
            className="group flex h-full flex-col justify-center rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/50 p-6 text-center transition-all duration-300 hover:border-brand-400 hover:bg-brand-50"
          >
            <span className="mx-auto w-12 h-12 rounded-xl bg-white border border-brand-200 text-brand-600 flex items-center justify-center shadow-soft group-hover:scale-110 transition-transform">
              <Icon name="layers" className="w-5.5 h-5.5" />
            </span>
            <p className="mt-4 font-display font-bold text-ink-900">{t(SECTIONS.viewAllServices)}</p>
            <p className="mt-1 text-sm text-ink-500">8+</p>
            <span className="mt-4 inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-brand-600">
              {t(BTN.explore)} <Icon name="arrow" className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ─────────────────────── AUDIENCES ───────────────────────── */

function Audiences() {
  const { t } = useI18n();
  return (
    <section className="bg-brand-50/50 border-y border-brand-100/60">
      <div className="container-x py-16 sm:py-20">
        <SectionHeading
          eyebrow={t(SECTIONS.audiences.eyebrow)}
          title={t(SECTIONS.audiences.title)}
          subtitle={t(SECTIONS.audiences.subtitle)}
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {AUDIENCES.map((g, i) => (
            <Reveal key={g.to} delay={(i % 3) as 0 | 1 | 2}>
              <Link
                to={g.to}
                className={cn(
                  "group flex h-full flex-col rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1",
                  g.featured
                    ? "bg-gradient-to-br from-brand-700 to-brand-500 text-white shadow-xl shadow-brand-600/30"
                    : "bg-white border border-ink-100 shadow-soft hover:shadow-card"
                )}
              >
                <span className={cn("w-12 h-12 rounded-xl flex items-center justify-center", g.featured ? "bg-white/15 text-white" : "bg-brand-50 text-brand-600")}>
                  <Icon name={g.icon as never} className="w-6 h-6" />
                </span>
                <h3 className={cn("mt-5 font-display font-bold text-xl", g.featured ? "text-white" : "text-ink-900")}>
                  {t(g.title)}
                </h3>
                <p className={cn("mt-2.5 text-sm leading-relaxed", g.featured ? "text-brand-100/90" : "text-ink-500")}>
                  {t(g.desc)}
                </p>
                <ul className={cn("mt-4 space-y-2", g.featured ? "text-brand-50" : "text-ink-600")}>
                  {g.items.map((it, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm font-medium">
                      <span className={cn("w-1.5 h-1.5 rounded-full", g.featured ? "bg-brand-200" : "bg-brand-500")} />
                      {t(it)}
                    </li>
                  ))}
                </ul>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── CITIZEN + ONLINE SERVICES ────────────────── */

function CitizenOnline() {
  const { t } = useI18n();
  return (
    <section className="container-x py-16 sm:py-24">
      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal>
          <div className="h-full rounded-2xl border border-ink-100 bg-white p-7 sm:p-9 shadow-soft hover:shadow-card transition-shadow">
            <div className="flex items-center gap-4">
              <IconTile name="pen" />
              <div>
                <h3 className="font-display font-bold text-xl text-ink-900">{t(SECTIONS.citizenOnline.onlineTitle)}</h3>
                <p className="text-sm text-ink-500">{t(SECTIONS.citizenOnline.onlineSub)}</p>
              </div>
            </div>
            <p className="mt-5 text-[15px] leading-relaxed text-ink-500">{t(SECTIONS.citizenOnline.onlineDesc)}</p>
            <ul className="mt-5 grid sm:grid-cols-2 gap-x-5 gap-y-2.5">
              {ONLINE_SERVICES.slice(0, 8).map((s, i) => (
                <CheckItem key={i}>{t(s)}</CheckItem>
              ))}
            </ul>
            <Button to="/services/online-services" variant="ghost" className="mt-7 -ml-2">
              {t(BTN.exploreOnline)} <Icon name="arrow" className="w-4 h-4" />
            </Button>
          </div>
        </Reveal>

        <Reveal delay={1}>
          <div className="h-full rounded-2xl bg-gradient-to-br from-ink-900 to-ink-950 p-7 sm:p-9 text-white shadow-card relative overflow-hidden">
            <div className="absolute inset-0 bg-grid opacity-60" aria-hidden="true" />
            <div className="absolute -top-20 -right-20 w-52 h-52 rounded-full bg-brand-600/30 blur-3xl" aria-hidden="true" />
            <div className="relative">
              <div className="flex items-center gap-4">
                <IconTile name="idcard" />
                <div>
                  <h3 className="font-display font-bold text-xl">{t(SECTIONS.citizenOnline.citizenTitle)}</h3>
                  <p className="text-sm text-ink-200">{t(SECTIONS.citizenOnline.citizenSub)}</p>
                </div>
              </div>
              <p className="mt-5 text-[15px] leading-relaxed text-ink-100/80">{t(SECTIONS.citizenOnline.citizenDesc)}</p>
              <ul className="mt-5 grid sm:grid-cols-2 gap-x-5 gap-y-2.5">
                {CITIZEN_SERVICES.slice(0, 6).map((s, i) => (
                  <CheckItem key={i} dark>{t(s)}</CheckItem>
                ))}
              </ul>
              <div className="mt-6 rounded-xl bg-white/8 border border-white/12 px-4 py-3 text-[13px] leading-relaxed text-ink-100/70">
                <Icon name="badge" className="inline w-4 h-4 text-brand-300 mr-1.5 -mt-0.5" />
                {t(SECTIONS.citizenOnline.citizenNote)}
              </div>
              <Button to="/services/citizen-services" className="mt-7">
                {t(BTN.viewCitizen)} <Icon name="arrow" className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─────────────────── EDUCATION SOLUTION ──────────────────── */

function EducationSpotlight() {
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden bg-ink-950 text-white">
      <div className="absolute inset-0 bg-grid" aria-hidden="true" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-brand-600/30 blur-[130px] animate-blob" aria-hidden="true" />
      <div className="container-x relative py-16 sm:py-24 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <SectionHeading
            align="left"
            dark
            eyebrow={t(SECTIONS.education.eyebrow)}
            title={t(SECTIONS.education.title)}
            subtitle={t(SECTIONS.education.subtitle)}
          />
          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3.5">
            {EDUCATION_FEATURES.slice(0, 8).map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center text-brand-300 shrink-0">
                  <Icon name={f.icon as never} className="w-4 h-4" />
                </span>
                <span className="text-sm font-medium text-ink-100/90">{t(f.title)}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-col sm:flex-row gap-3.5">
            <Button to="/services/education-management">
              {t(BTN.exploreEducation)} <Icon name="arrow" className="w-4 h-4" />
            </Button>
            <Button to="/products" variant="outline-light">
              {t(BTN.seeInfoeduProducts)}
            </Button>
          </div>
        </div>

        <Reveal delay={1} className="hidden lg:block">
          <div className="relative rounded-2xl bg-white/5 ring-1 ring-white/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-white">Infoedu Admin Dashboard</span>
              <span className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
              </span>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { l: "Students", v: "2,450", c: "text-brand-300" },
                { l: "Teachers", v: "118", c: "text-emerald-300" },
                { l: "Results", v: "9,830", c: "text-amber-300" },
                { l: "Fees (৳)", v: "1.2M", c: "text-sky-300" },
              ].map((s) => (
                <div key={s.l} className="rounded-xl bg-white/6 border border-white/10 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-ink-300">{s.l}</p>
                  <p className={cn("mt-1 font-display font-bold text-lg", s.c)}>{s.v}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-3 h-28">
              {[45, 70, 35, 85, 55, 62, 92, 48, 74, 40].map((h, i) => (
                <div key={i} className="flex items-end">
                  <div className="w-full rounded-lg bg-gradient-to-t from-brand-700 to-brand-400" style={{ height: `${h}%` }} />
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/6 border border-white/10 p-3.5">
                <p className="text-[11px] text-ink-300 mb-2">Latest Results</p>
                {["Class 8 — Published", "Class 9 — Published", "HSC — Draft"].map((r) => (
                  <p key={r} className="text-xs text-ink-100/85 py-1 border-b border-white/5 last:border-0">
                    {r}
                  </p>
                ))}
              </div>
              <div className="rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 p-3.5 flex flex-col justify-between">
                <p className="text-[11px] text-brand-100">Attendance</p>
                <p className="font-display font-bold text-3xl">96.4%</p>
                <p className="text-[10px] text-brand-100/80">1,876 · 68</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─────────────────────── WHY CHOOSE ──────────────────────── */

function WhyChoose() {
  const { t } = useI18n();
  return (
    <section className="container-x py-16 sm:py-24">
      <SectionHeading eyebrow={t(SECTIONS.why.eyebrow)} title={t(SECTIONS.why.title)} subtitle={t(SECTIONS.why.subtitle)} />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {WHY_US.map((w, i) => (
          <Reveal key={i} delay={(i % 3) as 0 | 1 | 2}>
            <div className="group h-full rounded-2xl border border-ink-100 bg-white p-6 sm:p-7 shadow-soft transition-all duration-300 hover:shadow-card hover:-translate-y-1 hover:border-brand-200">
              <div className="flex items-center gap-3.5">
                <IconTile name={w.icon as never} size="sm" />
                <h3 className="font-display font-bold text-lg text-ink-900">{t(w.title)}</h3>
              </div>
              <p className="mt-4 text-[15px] leading-relaxed text-ink-500">{t(w.desc)}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── PROCESS ───────────────────────── */

function Process() {
  const { t } = useI18n();
  return (
    <section className="bg-brand-50/50 border-y border-brand-100/60">
      <div className="container-x py-16 sm:py-24">
        <SectionHeading eyebrow={t(SECTIONS.process.eyebrow)} title={t(SECTIONS.process.title)} subtitle={t(SECTIONS.process.subtitle)} />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS.map((p, i) => (
            <Reveal key={i} delay={(i % 4) as 0 | 1 | 2 | 3}>
              <div className="group relative h-full rounded-2xl bg-white border border-ink-100 p-6 shadow-soft transition-all duration-300 hover:shadow-card hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 text-white flex items-center justify-center shadow-lg shadow-brand-600/25">
                    <Icon name={p.icon as never} className="w-4.5 h-4.5" />
                  </span>
                  <span className="font-display font-bold text-3xl text-brand-100 group-hover:text-brand-200 transition-colors">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-4 font-display font-bold text-base text-ink-900">{t(p.title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{t(p.desc)}</p>
                {i < PROCESS.length - 1 && (
                  <span className="hidden lg:flex absolute top-1/2 -right-3.5 z-10 w-7 h-7 rounded-full bg-white border border-brand-200 text-brand-500 items-center justify-center shadow-sm">
                    <Icon name="arrow" className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────── TECHNOLOGIES ──────────────────────── */

function Technologies() {
  const { t } = useI18n();
  return (
    <section className="container-x py-16 sm:py-24">
      <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-center">
        <SectionHeading align="left" eyebrow={t(SECTIONS.tech.eyebrow)} title={t(SECTIONS.tech.title)} subtitle={t(SECTIONS.tech.subtitle)} />
        <div className="hidden lg:block">
          <Button to="/contact" variant="secondary">
            {t(BTN.discussTech)}
          </Button>
        </div>
      </div>
      <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {TECHNOLOGIES.map((tech, i) => (
          <Reveal key={i} delay={(i % 5) as 0 | 1 | 2 | 3 | 4}>
            <div className="group rounded-2xl border border-ink-100 bg-white p-5 text-center shadow-soft transition-all duration-300 hover:shadow-card hover:-translate-y-1 hover:border-brand-200">
              <span className="mx-auto flex w-12 h-12 rounded-xl bg-ink-50 text-ink-700 group-hover:bg-gradient-to-br group-hover:from-brand-600 group-hover:to-brand-500 group-hover:text-white transition-all duration-300 items-center justify-center">
                <Icon name={tech.icon as never} className="w-6 h-6" />
              </span>
              <p className="mt-3 font-display font-bold text-sm text-ink-900">{t(tech.name)}</p>
              <p className="mt-1 text-xs text-ink-400">{t(tech.note)}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────── INDUSTRIES ──────────────────────── */

function Industries() {
  const { t } = useI18n();
  return (
    <section className="container-x pb-16 sm:pb-24">
      <SectionHeading eyebrow={t(SECTIONS.industries.eyebrow)} title={t(SECTIONS.industries.title)} subtitle={t(SECTIONS.industries.subtitle)} />
      <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {INDUSTRIES.map((ind, i) => (
          <Reveal key={i} delay={(i % 4) as 0 | 1 | 2 | 3}>
            <div className="group h-full rounded-2xl border border-ink-100 bg-white p-5 shadow-soft transition-all duration-300 hover:shadow-card hover:-translate-y-1 hover:border-brand-200">
              <span className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 group-hover:bg-gradient-to-br group-hover:from-brand-600 group-hover:to-brand-500 group-hover:text-white transition-all duration-300 flex items-center justify-center">
                <Icon name={ind.icon as never} className="w-5 h-5" />
              </span>
              <h3 className="mt-3.5 font-display font-bold text-[15px] text-ink-900">{t(ind.name)}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">{t(ind.desc)}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────── PORTFOLIO TEASER ──────────────────── */

function PortfolioTeaser() {
  const { t } = useI18n();
  const items = PORTFOLIO.slice(0, 3);
  return (
    <section className="container-x pb-16 sm:pb-24">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <SectionHeading align="left" eyebrow={t(SECTIONS.portfolio.eyebrow)} title={t(SECTIONS.portfolio.title)} subtitle={t(SECTIONS.portfolio.subtitle)} />
        <Button to="/portfolio" variant="secondary" className="shrink-0">
          {t(BTN.viewAllWork)} <Icon name="arrow" className="w-4 h-4" />
        </Button>
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {items.map((p, i) => (
          <Reveal key={p.id} delay={(i % 3) as 0 | 1 | 2}>
            <Link
              to="/portfolio"
              className="group block h-full rounded-2xl border border-ink-100 bg-white overflow-hidden shadow-soft transition-all duration-300 hover:shadow-card hover:-translate-y-1"
            >
              <div className="relative h-44 bg-gradient-to-br from-brand-800 via-brand-600 to-brand-500 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-grid" aria-hidden="true" />
                <span className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-white">
                  <Icon name={p.filter === "education" ? "cap" : p.filter === "websites" ? "globe" : "zap"} className="w-8 h-8" />
                </span>
                <span className="absolute top-3 right-3 rounded-full bg-white/15 backdrop-blur px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  {t(p.tech)}
                </span>
              </div>
              <div className="p-5">
                <p className="text-[11px] font-bold uppercase tracking-widest text-brand-600">{t(p.category)}</p>
                <h3 className="mt-1.5 font-display font-bold text-lg text-ink-900 group-hover:text-brand-700 transition-colors">
                  {t(p.name)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500 line-clamp-2">{t(p.description)}</p>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────── HOME FAQ ────────────────────────── */

function HomeFaq() {
  const { t } = useI18n();
  const faqs = FAQS.slice(0, 6).map((f) => ({ q: t(f.q), a: t(f.a) }));
  return (
    <section className="bg-brand-50/50 border-y border-brand-100/60">
      <div className="container-x py-16 sm:py-24">
        <div className="grid lg:grid-cols-[1fr_1.6fr] gap-10">
          <div>
            <SectionHeading align="left" eyebrow={t(SECTIONS.faq.eyebrow)} title={t(SECTIONS.faq.title)} subtitle={t(SECTIONS.faq.subtitle)} />
            <div className="mt-8 rounded-2xl bg-white border border-ink-100 p-6 shadow-soft">
              <p className="text-sm text-ink-500 leading-relaxed">{t(SECTIONS.contactStrip.title)}</p>
              <div className="mt-4 flex flex-col gap-2.5">
                <Button to="/contact" size="sm">
                  {t(BTN.contactUs)}
                </Button>
                <Button href={`https://wa.me/8801926100643?text=${encodeURIComponent(t(HERO.waDefault))}`} variant="whatsapp" size="sm">
                  <Icon name="whatsapp" className="w-4 h-4" />
                  {t(BTN.askOnWhatsApp)}
                </Button>
              </div>
            </div>
          </div>
          <div>
            <FaqAccordion faqs={faqs} />
            <div className="mt-6">
              <Link to="/faq" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                {t(BTN.viewAllQuestions)} <Icon name="arrow" className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────── CONTACT STRIP ─────────────────────── */

function ContactStrip() {
  const { t } = useI18n();
  const cards = [
    { icon: "phone", title: t(SECTIONS.contactStrip.callUs), lines: [CONTACT.phonePrimary, CONTACT.phoneSecondary], href: CONTACT.phonePrimaryHref, label: t(SECTIONS.contactStrip.callNow) },
    { icon: "whatsapp", title: t(SECTIONS.contactStrip.whatsapp), lines: [t(SECTIONS.contactStrip.instantChat), t(SECTIONS.contactStrip.quickQuotes)], href: `https://wa.me/8801926100643?text=${encodeURIComponent(t(HERO.waHelp))}`, label: t(SECTIONS.contactStrip.startChat), external: true },
    { icon: "mail", title: t(SECTIONS.contactStrip.emailUs), lines: [CONTACT.email, CONTACT.emailSupport], href: `mailto:${CONTACT.email}`, label: t(SECTIONS.contactStrip.sendEmail) },
  ];
  return (
    <section className="container-x pb-16 sm:pb-24">
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c, i) => (
          <Reveal key={c.title} delay={(i % 3) as 0 | 1 | 2}>
            <a
              href={c.href}
              target={c.external ? "_blank" : undefined}
              rel={c.external ? "noopener noreferrer" : undefined}
              className="group flex h-full flex-col rounded-2xl border border-ink-100 bg-white p-6 shadow-soft transition-all duration-300 hover:shadow-card hover:-translate-y-1 hover:border-brand-200"
            >
              <span className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 group-hover:bg-gradient-to-br group-hover:from-brand-600 group-hover:to-brand-500 group-hover:text-white transition-all flex items-center justify-center">
                <Icon name={c.icon as never} className="w-5 h-5" />
              </span>
              <h3 className="mt-4 font-display font-bold text-lg text-ink-900">{c.title}</h3>
              <div className="mt-1.5 text-sm text-ink-500 space-y-0.5">
                {c.lines.map((l) => (
                  <p key={l} className="break-words">{l}</p>
                ))}
              </div>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600">
                {c.label} <Icon name="arrow" className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </a>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ────────────────────────── PAGE ─────────────────────────── */

export default function Home() {
  const { t } = useI18n();
  usePageMeta(
    t({ en: "AL-KHUBAIB IT — Web Design & Development Company in Bangladesh", bn: "AL-KHUBAIB IT — বাংলাদেশের ওয়েব ডিজাইন ও ডেভেলপমেন্ট কোম্পানি" }),
    t({ en: "Professional web development, custom software, education management systems, hosting, online & citizen services and digital products for individuals, businesses and institutions.", bn: "ব্যক্তি, ব্যবসা ও প্রতিষ্ঠানের জন্য প্রফেশনাল ওয়েব ডেভেলপমেন্ট, কাস্টম সফটওয়্যার, এডুকেশন ম্যানেজমেন্ট সিস্টেম, হোস্টিং, অনলাইন ও সিটিজেন সার্ভিস এবং ডিজিটাল প্রোডাক্ট।" })
  );
  return (
    <>
      <Hero />
      <Stats />
      <ServicesGrid />
      <Audiences />
      <CitizenOnline />
      <EducationSpotlight />
      <WhyChoose />
      <Process />
      <Technologies />
      <Industries />
      <PortfolioTeaser />
      <HomeFaq />
      <ContactStrip />
      <CtaSection />
    </>
  );
}
