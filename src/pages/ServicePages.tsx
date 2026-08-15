import { Icon } from "../components/Icons";
import { Button, SectionHeading, Reveal, PageHero, Breadcrumbs, CheckItem, IconTile } from "../components/ui";
import { CtaSection, usePageMeta } from "../components/Layout";
import { useI18n } from "../lib/i18n";
import { ServiceCard } from "./Home";
import {
  SERVICE_CATEGORIES,
  getCategory,
  WEB_SITE_TYPES,
  WEB_PLATFORM_SERVICES,
  HOSTING_SERVICES,
  SOFTWARE_SERVICES,
  BTN,
  HERO,
  CONTACT,
  PAGE_HEROS,
} from "../lib/content";

/* ─────────────────── shared detail layout ─────────────────── */

function ServiceDetail({ slug, extra }: { slug: string; extra?: React.ReactNode }) {
  const { t } = useI18n();
  const cat = getCategory(slug);
  if (!cat) return null;
  const related = SERVICE_CATEGORIES.filter((c) => c.slug !== slug).slice(0, 4);
  const isWeb = slug === "web-development";
  return (
    <>
      <PageHero eyebrow={t(cat.tagline)} title={t(cat.name)} subtitle={t(cat.description)}>
        <div className="mt-7 flex flex-col sm:flex-row gap-3.5">
          <Button to="/contact" size="lg">
            {isWeb ? t(BTN.buildMyWebsite) : t(BTN.startProject)}
            <Icon name="arrow" className="w-4.5 h-4.5" />
          </Button>
          <Button
            href={`https://wa.me/8801926100643?text=${encodeURIComponent(t(HERO.waDiscuss))}`}
            variant="whatsapp"
            size="lg"
          >
            <Icon name="whatsapp" className="w-5 h-5" />
            {t(BTN.freeConsultation)}
          </Button>
        </div>
      </PageHero>

      <section className="container-x py-14 sm:py-20">
        <Breadcrumbs items={[{ label: t({ en: "Services", bn: "সার্ভিসসমূহ" }), to: "/services" }, { label: t(cat.name) }]} />
        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-10">
          <div>
            <SectionHeading
              align="left"
              eyebrow={t({ en: `${cat.name.en} Services`, bn: `${cat.name.bn} সার্ভিস` })}
              title={t({ en: `What We Offer in ${cat.name.en}`, bn: `${cat.name.bn}-এ আমরা যা অফার করি` })}
              subtitle={t({
                en: "Every engagement follows our structured process — consultation, planning, development, testing and ongoing support.",
                bn: "প্রতিটি কাজ সুসংগঠিত প্রক্রিয়া অনুসরণ করে — কনসালটেশন, পরিকল্পনা, ডেভেলপমেন্ট, টেস্টিং ও চলমান সাপোর্ট।",
              })}
            />
            <div className="mt-8 grid sm:grid-cols-2 gap-x-8 gap-y-3.5">
              {cat.items.map((it, i) => (
                <CheckItem key={i}>{t(it)}</CheckItem>
              ))}
            </div>
          </div>
          <aside>
            <div className="lg:sticky lg:top-28 space-y-5">
              <div className="rounded-2xl bg-gradient-to-br from-brand-700 to-brand-500 p-6 text-white shadow-xl shadow-brand-600/25">
                <Icon name={cat.icon as never} className="w-9 h-9 text-brand-200" />
                <h3 className="mt-3 font-display font-bold text-xl">
                  {t({ en: `Designed for ${cat.audience.en}`, bn: `${cat.audience.bn}-এর জন্য ডিজাইনকৃত` })}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-100/90">
                  {t(cat.tagline)} — {t({ en: "tailored to your goals, requirements and budget.", bn: "আপনার লক্ষ্য, চাহিদা ও বাজেট অনুযায়ী।" })}
                </p>
                <Button to="/contact" size="sm" className="mt-5 w-full bg-white text-brand-700 from-white via-white to-white hover:bg-brand-50">
                  {t(BTN.requestQuotation)}
                </Button>
              </div>
              <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-soft">
                <h3 className="font-display font-bold text-base text-ink-900">{t(BTN.talkToExpert)}</h3>
                <p className="mt-1.5 text-sm text-ink-500">
                  {t({ en: "Free consultation — describe your need and we'll recommend the right approach.", bn: "ফ্রি কনসালটেশন — আপনার চাহিদা জানান, আমরা সঠিক পদ্ধতি পরামর্শ দেব।" })}
                </p>
                <div className="mt-4 space-y-2.5 text-sm">
                  <a href={CONTACT.phonePrimaryHref} className="flex items-center gap-2.5 font-semibold text-ink-800 hover:text-brand-600">
                    <Icon name="phone" className="w-4 h-4 text-brand-500 shrink-0" /> {CONTACT.phonePrimary}
                  </a>
                  <a href={CONTACT.phoneSecondaryHref} className="flex items-center gap-2.5 font-semibold text-ink-800 hover:text-brand-600">
                    <Icon name="phone" className="w-4 h-4 text-brand-500 shrink-0" /> {CONTACT.phoneSecondary}
                  </a>
                  <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-2.5 font-semibold text-ink-800 hover:text-brand-600 break-all">
                    <Icon name="mail" className="w-4 h-4 text-brand-500 shrink-0" /> {CONTACT.email}
                  </a>
                </div>
              </div>
            </div>
          </aside>
        </div>
        {extra}
      </section>

      <section className="container-x pb-16 sm:pb-24">
        <h2 className="font-display font-bold text-2xl text-ink-900 text-center">
          {t({ en: "Explore Other Services", bn: "অন্যান্য সার্ভিস দেখুন" })}
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {related.map((c, i) => (
            <Reveal key={c.slug} delay={(i % 4) as 0 | 1 | 2 | 3}>
              <ServiceCard cat={c} compact />
            </Reveal>
          ))}
        </div>
      </section>

      <CtaSection />
    </>
  );
}

/* ───────────────────── Services overview ──────────────────── */

export function ServicesOverview() {
  const { t } = useI18n();
  usePageMeta(
    t({ en: "Our Services — Web, Software, Online & Digital Services", bn: "আমাদের সেবাসমূহ — ওয়েব, সফটওয়্যার, অনলাইন ও ডিজিটাল সার্ভিস" }),
    t({ en: "Explore the complete range of AL-KHUBAIB IT services: web design & development, custom software, education management, domain & hosting, online services, citizen service assistance, graphic design and digital marketing.", bn: "AL-KHUBAIB IT-এর সম্পূর্ণ সার্ভিস দেখুন: ওয়েব ডিজাইন ও ডেভেলপমেন্ট, কাস্টম সফটওয়্যার, এডুকেশন ম্যানেজমেন্ট, ডোমেইন ও হোস্টিং, অনলাইন সার্ভিস, সিটিজেন সার্ভিস সহায়তা, গ্রাফিক ডিজাইন ও ডিজিটাল মার্কেটিং।" })
  );
  return (
    <>
      <PageHero eyebrow={t(PAGE_HEROS.services.eyebrow)} title={t(PAGE_HEROS.services.title)} subtitle={t(PAGE_HEROS.services.subtitle)}>
        <div className="mt-7 flex flex-col sm:flex-row gap-3.5">
          <Button to="/contact" size="lg">
            {t(BTN.getQuote)} <Icon name="arrow" className="w-4.5 h-4.5" />
          </Button>
          <Button to="/portfolio" variant="outline-light" size="lg">
            {t(BTN.viewPortfolio)}
          </Button>
        </div>
      </PageHero>

      <section className="container-x py-14 sm:py-20">
        <Breadcrumbs items={[{ label: t({ en: "Services", bn: "সার্ভিসসমূহ" }) }]} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_CATEGORIES.map((cat, i) => (
            <Reveal key={cat.slug} delay={(i % 3) as 0 | 1 | 2}>
              <ServiceCard cat={cat} />
            </Reveal>
          ))}
        </div>
      </section>

      <CtaSection />
    </>
  );
}

/* ─────────────────── Web design & dev page ────────────────── */

export function WebDevPage() {
  const { t } = useI18n();
  usePageMeta(
    t({ en: "Web Design & Development in Bangladesh — Websites That Convert", bn: "বাংলাদেশে ওয়েব ডিজাইন ও ডেভেলপমেন্ট — কনভার্শন-বান্ধব ওয়েবসাইট" }),
    t({ en: "Professional web design & development company in Bangladesh. Business, e-commerce, educational and custom web applications built with WordPress, PHP and Laravel. Domain & hosting included.", bn: "বাংলাদেশের প্রফেশনাল ওয়েব ডিজাইন ও ডেভেলপমেন্ট কোম্পানি। WordPress, PHP ও Laravel দিয়ে বিজনেস, ই-কমার্স, শিক্ষামূলক ও কাস্টম ওয়েব অ্যাপ্লিকেশন। ডোমেইন ও হোস্টিংসহ।" })
  );
  return (
    <ServiceDetail
      slug="web-development"
      extra={
        <>
          <section className="mt-16 rounded-3xl bg-ink-950 relative overflow-hidden p-8 sm:p-14 text-white">
            <div className="absolute inset-0 bg-grid" aria-hidden="true" />
            <div className="absolute -top-24 right-10 w-72 h-72 rounded-full bg-brand-600/40 blur-[100px] animate-blob" aria-hidden="true" />
            <div className="relative grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <SectionHeading
                  align="left"
                  dark
                  eyebrow={t({ en: "Why It Matters", bn: "কেন গুরুত্বপূর্ণ" })}
                  title={t({ en: "Your Website Is Your Digital Front Door", bn: "আপনার ওয়েবসাইটই আপনার ডিজিটাল প্রবেশদ্বার" })}
                  subtitle={t({ en: "We design and develop fast, responsive, secure and modern websites that help businesses establish a strong digital presence and win customer trust.", bn: "আমরা দ্রুত, রেসপন্সিভ, নিরাপদ ও আধুনিক ওয়েবসাইট ডিজাইন ও ডেভেলপ করি — যা ব্যবসার শক্তিশালী ডিজিটাল উপস্থিতি ও গ্রাহকের আস্থা অর্জনে সাহায্য করে।" })}
                />
                <div className="mt-7 grid grid-cols-2 gap-3">
                  {[
                    { icon: "zap", label: t({ en: "Fast & Optimized", bn: "দ্রুত ও অপটিমাইজড" }) },
                    { icon: "shield", label: t({ en: "Secure & Reliable", bn: "নিরাপদ ও নির্ভরযোগ্য" }) },
                    { icon: "monitor", label: t({ en: "Fully Responsive", bn: "সম্পূর্ণ রেসপন্সিভ" }) },
                    { icon: "search", label: t({ en: "SEO Friendly", bn: "SEO-বান্ধব" }) },
                  ].map((f) => (
                    <div key={f.label} className="flex items-center gap-3 rounded-xl bg-white/6 border border-white/10 px-4 py-3">
                      <Icon name={f.icon as never} className="w-5 h-5 text-brand-300 shrink-0" />
                      <span className="text-sm font-semibold">{f.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-white/95 shadow-2xl overflow-hidden ring-1 ring-white/20">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-ink-900">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="ml-2 flex-1 rounded-md bg-white/10 px-3 py-1 text-[10px] text-ink-200 font-mono">
                    yourbusiness.com
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-600 to-brand-400" />
                    <div className="flex gap-1.5">
                      <span className="h-1.5 w-7 rounded-full bg-ink-200" />
                      <span className="h-1.5 w-7 rounded-full bg-ink-200" />
                      <span className="h-1.5 w-7 rounded-full bg-ink-200" />
                    </div>
                  </div>
                  <div className="mt-3 rounded-lg bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 p-4">
                    <span className="block h-2.5 w-2/3 rounded-full bg-white/85" />
                    <span className="mt-2 block h-2 w-1/2 rounded-full bg-white/60" />
                    <div className="mt-3 flex gap-2">
                      <span className="h-6 w-20 rounded-md bg-white" />
                      <span className="h-6 w-20 rounded-md bg-white/25" />
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="rounded-lg border border-ink-100 p-2.5">
                        <span className="block w-5 h-5 rounded-md bg-brand-100" />
                        <span className="mt-2 block h-1.5 w-full rounded-full bg-ink-100" />
                        <span className="mt-1 block h-1.5 w-2/3 rounded-full bg-ink-100" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-14 grid md:grid-cols-2 gap-6">
            {[
              { icon: "globe", title: t({ en: "Website Types We Build", bn: "যে ধরনের ওয়েবসাইট তৈরি করি" }), items: WEB_SITE_TYPES, note: t({ en: "From simple business sites to full e-commerce stores and custom web applications.", bn: "সাধারণ বিজনেস সাইট থেকে পূর্ণ ই-কমার্স স্টোর ও কাস্টম ওয়েব অ্যাপ্লিকেশন পর্যন্ত।" }) },
              { icon: "code", title: t({ en: "Platforms & Technical Services", bn: "প্ল্যাটফর্ম ও টেকনিক্যাল সার্ভিস" }), items: WEB_PLATFORM_SERVICES, note: t({ en: "Modern stacks — WordPress, PHP and Laravel — with clean, maintainable code.", bn: "আধুনিক স্ট্যাক — WordPress, PHP ও Laravel — পরিষ্কার ও রক্ষণাবেক্ষণযোগ্য কোডে।" }) },
            ].map((col, idx) => (
              <Reveal key={col.title} delay={idx as 0 | 1}>
                <div className="h-full rounded-2xl border border-ink-100 bg-white p-7 shadow-soft">
                  <div className="flex items-center gap-3.5">
                    <IconTile name={col.icon as never} />
                    <h3 className="font-display font-bold text-xl text-ink-900">{col.title}</h3>
                  </div>
                  <ul className="mt-5 grid sm:grid-cols-2 gap-x-5 gap-y-3">
                    {col.items.map((it, i) => (
                      <CheckItem key={i}>{t(it)}</CheckItem>
                    ))}
                  </ul>
                  <p className="mt-5 text-sm text-ink-400 italic">{col.note}</p>
                </div>
              </Reveal>
            ))}
          </section>

          <section className="mt-14 rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-7 sm:p-10">
            <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8 items-center">
              <div>
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-700 bg-white border border-brand-100 px-4 py-1.5 rounded-full">
                  <Icon name="server" className="w-4 h-4 shrink-0" /> {t({ en: "Included service", bn: "অন্তর্ভুক্ত সার্ভিস" })}
                </span>
                <h3 className="mt-4 font-display font-bold text-2xl sm:text-3xl text-ink-900">
                  {t({ en: "Complete with Domain & Hosting", bn: "ডোমেইন ও হোস্টিংসহ সম্পূর্ণ সমাধান" })}
                </h3>
                <p className="mt-3 text-ink-500 leading-relaxed max-w-xl">
                  {t({ en: "Every website needs a reliable home. We handle domain registration and hosting for you, so your project goes live faster — fast, secure and always online.", bn: "প্রতিটি ওয়েবসাইটের একটি নির্ভরযোগ্য ঠিকানা প্রয়োজন। আমরা আপনার জন্য ডোমেইন রেজিস্ট্রেশন ও হোস্টিং সামলাই — আপনার প্রজেক্ট দ্রুত লাইভ হবে, থাকবে দ্রুত, নিরাপদ ও সবসময় অনলাইনে।" })}
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3.5">
                  <Button to="/services/domain-hosting">
                    {t(BTN.exploreHosting)} <Icon name="arrow" className="w-4 h-4" />
                  </Button>
                  <Button to="/contact" variant="secondary">
                    {t(BTN.freeConsultation)}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {HOSTING_SERVICES.slice(0, 8).map((h, i) => (
                  <div key={i} className="rounded-xl bg-white border border-ink-100 p-3.5 shadow-soft hover:border-brand-200 hover:shadow-card transition-all">
                    <Icon name={i % 2 ? "globe" : "server"} className="w-5 h-5 text-brand-500" />
                    <p className="mt-2 text-[13px] font-semibold text-ink-800 leading-snug">{t(h)}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      }
    />
  );
}

/* ────────────────────── Software page ─────────────────────── */

export function SoftwarePage() {
  const { t } = useI18n();
  usePageMeta(
    t({ en: "Custom Software Development in Bangladesh", bn: "বাংলাদেশে কাস্টম সফটওয়্যার ডেভেলপমেন্ট" }),
    t({ en: "Custom business software, management systems, inventory, billing, POS, HR, accounting and CRM solutions built around your exact workflow by AL-KHUBAIB IT.", bn: "AL-KHUBAIB IT-এর কাস্টম বিজনেস সফটওয়্যার, ম্যানেজমেন্ট সিস্টেম, ইনভেন্টরি, বিলিং, POS, এইচআর, অ্যাকাউন্টিং ও CRM সল্যুশন — আপনার সঠিক কর্মপদ্ধতি অনুযায়ী নির্মিত।" })
  );
  return (
    <ServiceDetail
      slug="software-development"
      extra={
        <section className="mt-14 rounded-3xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 relative overflow-hidden p-8 sm:p-12 text-white">
          <div className="absolute inset-0 bg-grid" aria-hidden="true" />
          <div className="absolute -bottom-24 -right-16 w-80 h-80 rounded-full bg-brand-500/40 blur-[110px]" aria-hidden="true" />
          <div className="relative max-w-3xl">
            <SectionHeading
              align="left"
              dark
              eyebrow={t({ en: "Tailored To You", bn: "আপনার জন্য কাস্টমাইজড" })}
              title={t({ en: "Software That Fits Your Workflow — Not the Other Way Around", bn: "সফটওয়্যার যা আপনার কর্মপদ্ধতির সাথে মানানসই — উল্টোটা নয়" })}
              subtitle={t({ en: "We develop almost all types of web-based software, built around the exact workflow of your business or organization. No one-size-fits-all templates.", bn: "আমরা প্রায় সব ধরনের ওয়েব-ভিত্তিক সফটওয়্যার তৈরি করি — আপনার ব্যবসা বা প্রতিষ্ঠানের সঠিক কর্মপদ্ধতিকে কেন্দ্র করে। কোনো এক-সাইজ-সব টেমপ্লেট নয়।" })}
            />
            <ul className="mt-8 grid sm:grid-cols-2 gap-x-8 gap-y-3.5">
              {SOFTWARE_SERVICES.slice(0, 8).map((s, i) => (
                <CheckItem key={i} dark>{t(s)}</CheckItem>
              ))}
            </ul>
            <div className="mt-9 flex flex-col sm:flex-row gap-3.5">
              <Button to="/contact" className="bg-white text-brand-700 from-white via-white to-white hover:bg-brand-50">
                {t(BTN.discussSoftware)} <Icon name="arrow" className="w-4.5 h-4.5" />
              </Button>
              <Button to="/products" variant="outline-light">
                {t(BTN.seeReadySoftware)}
              </Button>
            </div>
          </div>
        </section>
      }
    />
  );
}

/* ──────────────────── Domain & hosting page ───────────────── */

export function HostingPage() {
  const { t } = useI18n();
  usePageMeta(
    t({ en: "Domain Registration & Web Hosting in Bangladesh", bn: "বাংলাদেশে ডোমেইন রেজিস্ট্রেশন ও ওয়েব হোস্টিং" }),
    t({ en: "Domain registration, web hosting, business hosting, SSL certificates, website migration, email hosting and backup — reliable hosting managed by AL-KHUBAIB IT.", bn: "ডোমেইন রেজিস্ট্রেশন, ওয়েব হোস্টিং, বিজনেস হোস্টিং, SSL সার্টিফিকেট, ওয়েবসাইট মাইগ্রেশন, ইমেইল হোস্টিং ও ব্যাকআপ — AL-KHUBAIB IT পরিচালিত নির্ভরযোগ্য হোস্টিং।" })
  );
  const features = [
    { icon: "globe", title: t({ en: "Domain Registration", bn: "ডোমেইন রেজিস্ট্রেশন" }), desc: t({ en: "A premium domain gives you strong branding potential and high recall.", bn: "প্রিমিয়াম ডোমেইন দেয় শক্তিশালী ব্র্যান্ডিং সম্ভাবনা ও সহজে মনে রাখার সুবিধা।" }) },
    { icon: "server", title: t({ en: "Fast Hosting", bn: "দ্রুত হোস্টিং" }), desc: t({ en: "Reliable web & business hosting that keeps your site online.", bn: "নির্ভরযোগ্য ওয়েব ও বিজনেস হোস্টিং — আপনার সাইট থাকবে সবসময় অনলাইনে।" }) },
    { icon: "lock", title: t({ en: "SSL Security", bn: "SSL নিরাপত্তা" }), desc: t({ en: "Encrypt your website and build visitor trust with SSL.", bn: "SSL দিয়ে ওয়েবসাইট এনক্রিপ্ট করুন ও ভিজিটরদের আস্থা অর্জন করুন।" }) },
    { icon: "cloud", title: t({ en: "Migration & Backup", bn: "মাইগ্রেশন ও ব্যাকআপ" }), desc: t({ en: "Painless website migration and regular backups.", bn: "ঝামেলাহীন ওয়েবসাইট মাইগ্রেশন ও নিয়মিত ব্যাকআপ।" }) },
  ];
  return (
    <ServiceDetail
      slug="domain-hosting"
      extra={
        <section className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <Reveal key={i} delay={(i % 4) as 0 | 1 | 2 | 3}>
              <div className="h-full rounded-2xl border border-ink-100 bg-white p-6 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all">
                <IconTile name={f.icon as never} size="sm" />
                <h3 className="mt-4 font-display font-bold text-base text-ink-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </section>
      }
    />
  );
}
