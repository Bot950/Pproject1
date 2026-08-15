import { useState } from "react";
import { Icon } from "../components/Icons";
import { Button, SectionHeading, Reveal, PageHero, Breadcrumbs, IconTile } from "../components/ui";
import { CtaSection, usePageMeta } from "../components/Layout";
import { useI18n } from "../lib/i18n";
import {
  PRODUCTS,
  PORTFOLIO,
  PORTFOLIO_FILTERS,
  PAGE_HEROS,
  BTN,
  PORTFOLIO_TEXTS,
  PRODUCT_TEXTS,
  CTA,
  COURSES_NOTICE,
  COURSE_AREAS,
  OFFICIAL_LINKS,
} from "../lib/content";
import { cn } from "../utils/cn";

/* ─────────────────────── Products page ────────────────────── */

export function ProductsPage() {
  const { t } = useI18n();
  usePageMeta(
    t({ en: "Digital Products — WordPress Themes, Software & Tools", bn: "ডিজিটাল প্রোডাক্ট — WordPress থিম, সফটওয়্যার ও টুল" }),
    t({ en: "Premium digital products by AL-KHUBAIB IT: InfoEdu WP education solution, Smart School & Ramon School management software (Laravel), and the Smart Earning Card program.", bn: "AL-KHUBAIB IT-এর প্রিমিয়াম ডিজিটাল প্রোডাক্ট: InfoEdu WP এডুকেশন সল্যুশন, Smart School ও Ramon School ম্যানেজমেন্ট সফটওয়্যার (Laravel) এবং স্মার্ট আর্নিং কার্ড প্রোগ্রাম।" })
  );
  return (
    <>
      <PageHero eyebrow={t(PAGE_HEROS.products.eyebrow)} title={t(PAGE_HEROS.products.title)} subtitle={t(PAGE_HEROS.products.subtitle)}>
        <div className="mt-7 flex flex-col sm:flex-row gap-3.5">
          <Button to="/contact" size="lg">
            {t(BTN.requestPricing)} <Icon name="arrow" className="w-4.5 h-4.5" />
          </Button>
          <Button
            href={`https://wa.me/8801926100643?text=${encodeURIComponent(t({ en: "Assalamu Alaikum, I would like a demo of one of your digital products.", bn: "আসসালামু আলাইকুম, আপনার ডিজিটাল প্রোডাক্টের একটি ডেমো দেখতে চাই।" }))}`}
            variant="whatsapp"
            size="lg"
          >
            <Icon name="whatsapp" className="w-5 h-5" />
            {t(BTN.scheduleDemo)}
          </Button>
        </div>
      </PageHero>

      <section className="container-x py-14 sm:py-20">
        <Breadcrumbs items={[{ label: t({ en: "Digital Products", bn: "ডিজিটাল প্রোডাক্ট" }) }]} />
        <div className="grid gap-6 md:grid-cols-2">
          {PRODUCTS.map((p, i) => (
            <Reveal key={p.slug} delay={(i % 2) as 0 | 1}>
              <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft transition-all duration-300 hover:shadow-card hover:-translate-y-1">
                <div className={cn("relative h-44 bg-gradient-to-br overflow-hidden", p.gradient)}>
                  <div className="absolute inset-0 bg-grid" aria-hidden="true" />
                  <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/15 blur-2xl" aria-hidden="true" />
                  <div className="relative flex h-full items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <span className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-white">
                        <Icon name={p.icon as never} className="w-7 h-7" />
                      </span>
                      <div>
                        <p className="font-display font-bold text-xl text-white">{t(p.name)}</p>
                        <p className="text-xs font-medium text-white/75">{t(p.type)}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-white/15 backdrop-blur px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      {t(p.badge)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-6 sm:p-7">
                  <p className="text-[15px] leading-relaxed text-ink-500">{t(p.description)}</p>
                  <ul className="mt-5 space-y-2.5">
                    {p.features.map((f, idx) => (
                      <li key={idx} className="flex items-center gap-2.5 text-sm text-ink-700">
                        <span className="w-5 h-5 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                          <Icon name="check" className="w-3 h-3" strokeWidth={3} />
                        </span>
                        {t(f)}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-6 flex flex-col sm:flex-row gap-3">
                    <Button
                      href={`https://wa.me/8801926100643?text=${encodeURIComponent(t({ en: `Assalamu Alaikum, I would like a live demo of ${p.name.en}.`, bn: `আসসালামু আলাইকুম, আমি ${p.name.bn}-এর লাইভ ডেমো দেখতে চাই।` }))}`}
                      variant="secondary"
                      className="flex-1"
                    >
                      <Icon name="monitor" className="w-4.5 h-4.5" />
                      {t(BTN.requestDemo)}
                    </Button>
                    <Button to="/shop" className="flex-1">
                      {t(BTN.buyNow)} <Icon name="arrow" className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-brand-100 bg-brand-50/60 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Icon name="chat" className="w-8 h-8 text-brand-600 shrink-0" />
            <p className="text-[15px] text-ink-600 leading-relaxed">{t(PRODUCT_TEXTS.help)}</p>
            <Button to="/appointment" className="shrink-0">
              <Icon name="clock" className="w-4 h-4" />
              {t(BTN.scheduleMeetingBtn)}
            </Button>
          </div>
        </div>
      </section>

      <CtaSection title={t(CTA.customTitle)} desc={t(CTA.customDesc)} />
    </>
  );
}

/* ─────────────────────── Portfolio page ───────────────────── */

const portfolioLinks: Record<string, string> = {
  infoedu: "/products",
  "smart-school": "/products",
  "ramon-school": "/products",
  website: OFFICIAL_LINKS.website,
  "smart-card": "/products",
  verify: "/verify-certificate",
};

export function PortfolioPage() {
  const { t } = useI18n();
  usePageMeta(
    t({ en: "Portfolio — Our Recent Work & Platforms", bn: "পোর্টফোলিও — আমাদের সাম্প্রতিক কাজ ও প্ল্যাটফর্ম" }),
    t({ en: "Explore platforms and projects designed, built and deployed by AL-KHUBAIB IT — education management systems, websites and digital platforms.", bn: "AL-KHUBAIB IT-এর ডিজাইন, নির্মিত ও ডিপ্লয়কৃত প্ল্যাটফর্ম ও প্রজেক্ট দেখুন — এডুকেশন ম্যানেজমেন্ট সিস্টেম, ওয়েবসাইট ও ডিজিটাল প্ল্যাটফর্ম।" })
  );
  const [filter, setFilter] = useState("all");
  const items = PORTFOLIO.filter((p) => filter === "all" || p.filter === filter);

  return (
    <>
      <PageHero eyebrow={t(PAGE_HEROS.portfolio.eyebrow)} title={t(PAGE_HEROS.portfolio.title)} subtitle={t(PAGE_HEROS.portfolio.subtitle)}>
        <div className="mt-7">
          <Button to="/contact" size="lg">
            {t(BTN.startProject)} <Icon name="arrow" className="w-4.5 h-4.5" />
          </Button>
        </div>
      </PageHero>

      <section className="container-x py-14 sm:py-20">
        <Breadcrumbs items={[{ label: t({ en: "Portfolio", bn: "পোর্টফোলিও" }) }]} />

        <div className="flex flex-wrap gap-2.5" role="tablist" aria-label="Portfolio filters">
          {PORTFOLIO_FILTERS.map((f) => (
            <button
              key={f.key}
              role="tab"
              aria-selected={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 border",
                filter === f.key
                  ? "bg-gradient-to-r from-brand-700 to-brand-500 text-white border-transparent shadow-lg shadow-brand-600/25"
                  : "bg-white text-ink-600 border-ink-200 hover:border-brand-300 hover:text-brand-700"
              )}
            >
              {t(f.label)}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p, i) => {
            const href = portfolioLinks[p.id] ?? "/contact";
            const internal = href.startsWith("/");
            return (
              <Reveal key={p.id} delay={(i % 3) as 0 | 1 | 2}>
                <a
                  href={href}
                  target={internal ? undefined : "_blank"}
                  rel={internal ? undefined : "noopener noreferrer"}
                  className="group block h-full overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft transition-all duration-300 hover:shadow-card hover:-translate-y-1"
                >
                  <div className="relative h-44 overflow-hidden bg-gradient-to-br from-brand-800 via-brand-600 to-brand-400">
                    <div className="absolute inset-0 bg-grid" aria-hidden="true" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-110">
                        <Icon name={p.filter === "education" ? "cap" : p.filter === "websites" ? "globe" : "zap"} className="w-8 h-8" />
                      </span>
                    </div>
                    <span className="absolute top-3 right-3 rounded-full bg-ink-950/40 backdrop-blur px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      {t(p.tech)}
                    </span>
                    <span className="absolute bottom-3 left-3 rounded-full bg-white/15 backdrop-blur px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      {t(p.category)}
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="font-display font-bold text-lg text-ink-900 group-hover:text-brand-700 transition-colors">
                      {t(p.name)}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-500">{t(p.description)}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600">
                      {t(BTN.viewProject)}
                      <Icon name="arrow" className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </a>
              </Reveal>
            );
          })}
        </div>

        <div className="mt-10 rounded-2xl border border-ink-100 bg-white p-6 shadow-soft">
          <div className="flex items-start gap-4">
            <IconTile name="badge" size="sm" />
            <p className="text-[15px] leading-relaxed text-ink-500">{t(PORTFOLIO_TEXTS.note)}</p>
          </div>
        </div>
      </section>

      <CtaSection />
    </>
  );
}

/* ─────────────────────── Courses page ─────────────────────── */

export function CoursesPage() {
  const { t } = useI18n();
  usePageMeta(
    t({ en: "Courses & IT Skills Training", bn: "কোর্স ও আইটি স্কিল প্রশিক্ষণ" }),
    t({ en: "Learn digital skills with AL-KHUBAIB IT — web development, WordPress, digital marketing, graphics design and content & data skills. New batches announced regularly.", bn: "AL-KHUBAIB IT-এর সাথে ডিজিটাল স্কিল শিখুন — ওয়েব ডেভেলপমেন্ট, WordPress, ডিজিটাল মার্কেটিং, গ্রাফিক্স ডিজাইন ও কনটেন্ট/ডেটা স্কিল। নিয়মিত নতুন ব্যাচ ঘোষণা করা হয়।" })
  );
  return (
    <>
      <PageHero eyebrow={t(PAGE_HEROS.courses.eyebrow)} title={t(PAGE_HEROS.courses.title)} subtitle={t(PAGE_HEROS.courses.subtitle)}>
        <div className="mt-7 flex flex-col sm:flex-row gap-3.5">
          <Button to="/contact" size="lg">
            {t(BTN.joinWaitlist)} <Icon name="arrow" className="w-4.5 h-4.5" />
          </Button>
          <Button
            href={`https://wa.me/8801926100643?text=${encodeURIComponent(t({ en: "Assalamu Alaikum, please notify me when new course batches open.", bn: "আসসালামু আলাইকুম, নতুন কোর্স ব্যাচ চালু হলে আমাকে জানাবেন।" }))}`}
            variant="whatsapp"
            size="lg"
          >
            <Icon name="whatsapp" className="w-5 h-5" />
            {t(BTN.notifyWhatsApp)}
          </Button>
        </div>
      </PageHero>

      <section className="container-x py-14 sm:py-20">
        <Breadcrumbs items={[{ label: t({ en: "Courses", bn: "কোর্সসমূহ" }) }]} />

        <Reveal>
          <div className="rounded-2xl border-2 border-brand-200 bg-brand-50/70 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-brand-600/25">
                <Icon name="bell" className="w-6 h-6" />
              </span>
              <div>
                <h2 className="font-display font-bold text-xl text-ink-900">{t(COURSES_NOTICE.title)}</h2>
                <p className="mt-2.5 text-[15px] leading-relaxed text-ink-600">{t(COURSES_NOTICE.body)}</p>
              </div>
            </div>
          </div>
        </Reveal>

        <SectionHeading className="mt-16" eyebrow={t(COURSES_NOTICE.sectionTitle)} title={t({ en: "Skill Areas We Teach", bn: "যে স্কিলগুলো শেখানো হয়" })} subtitle={t(COURSES_NOTICE.sectionSub)} />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {COURSE_AREAS.map((c, i) => (
            <Reveal key={i} delay={(i % 5) as 0 | 1 | 2 | 3 | 4}>
              <div className="group h-full rounded-2xl border border-ink-100 bg-white p-6 shadow-soft transition-all duration-300 hover:shadow-card hover:-translate-y-1 hover:border-brand-200">
                <span className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 group-hover:bg-gradient-to-br group-hover:from-brand-600 group-hover:to-brand-500 group-hover:text-white transition-all flex items-center justify-center">
                  <Icon name={c.icon as never} className="w-5 h-5" />
                </span>
                <h3 className="mt-4 font-display font-bold text-base text-ink-900">{t(c.title)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{t(c.desc)}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-12">
          <div className="rounded-2xl bg-ink-950 relative overflow-hidden p-8 sm:p-10 text-white">
            <div className="absolute inset-0 bg-grid" aria-hidden="true" />
            <div className="absolute -top-16 right-16 w-56 h-56 rounded-full bg-brand-600/35 blur-[90px]" aria-hidden="true" />
            <div className="relative flex flex-col md:flex-row md:items-center gap-6 justify-between">
              <div>
                <h3 className="font-display font-bold text-2xl">{t(COURSES_NOTICE.completedTitle)}</h3>
                <p className="mt-2 text-ink-100/75 text-[15px] max-w-xl">{t(COURSES_NOTICE.completedDesc)}</p>
              </div>
              <Button to="/verify-certificate" className="shrink-0 bg-white text-brand-700 from-white via-white to-white hover:bg-brand-50">
                {t(BTN.verifyCertificate)} <Icon name="shield" className="w-4.5 h-4.5" />
              </Button>
            </div>
          </div>
        </Reveal>
      </section>

      <CtaSection title={t(CTA.notifyTitle)} desc={t(CTA.notifyDesc)} />
    </>
  );
}
