import { Link } from "react-router-dom";
import { Icon } from "../components/Icons";
import { Button, SectionHeading, Reveal, PageHero, Breadcrumbs, Counter, IconTile } from "../components/ui";
import { CtaSection, usePageMeta } from "../components/Layout";
import { useI18n } from "../lib/i18n";
import { PAGE_HEROS, BTN, HERO, ABOUT_TEXTS } from "../lib/content";

export default function About() {
  const { t } = useI18n();
  usePageMeta(
    t({ en: "About Us — AL-KHUBAIB IT | IT & Digital Solutions Company", bn: "আমাদের সম্পর্কে — AL-KHUBAIB IT | আইটি ও ডিজিটাল সল্যুশন কোম্পানি" }),
    t({ en: "AL-KHUBAIB IT is an IT-based web design, development and software service organization in Bangladesh. Web design & development, software development and SEO — plus a full ecosystem of digital services.", bn: "AL-KHUBAIB IT বাংলাদেশের একটি আইটি-ভিত্তিক ওয়েব ডিজাইন, ডেভেলপমেন্ট ও সফটওয়্যার সার্ভিস প্রতিষ্ঠান। ওয়েব ডিজাইন ও ডেভেলপমেন্ট, সফটওয়্যার ডেভেলপমেন্ট ও SEO — সাথে সম্পূর্ণ ডিজিটাল সার্ভিস ইকোসিস্টেম।" })
  );
  const core = [
    {
      icon: "code",
      title: t(ABOUT_TEXTS.coreWebTitle),
      desc: t(ABOUT_TEXTS.coreWebDesc),
      to: "/services/web-development",
    },
    {
      icon: "cpu",
      title: t(ABOUT_TEXTS.coreSwTitle),
      desc: t(ABOUT_TEXTS.coreSwDesc),
      to: "/services/software-development",
    },
    {
      icon: "megaphone",
      title: t(ABOUT_TEXTS.coreSeoTitle),
      desc: t(ABOUT_TEXTS.coreSeoDesc),
      to: "/services/digital-marketing",
    },
  ];
  return (
    <>
      <PageHero eyebrow={t(PAGE_HEROS.about.eyebrow)} title={t(PAGE_HEROS.about.title)} subtitle={t(PAGE_HEROS.about.subtitle)}>
        <div className="mt-7 flex flex-col sm:flex-row gap-3.5">
          <Button to="/contact" size="lg">
            {t(BTN.workWithUs)} <Icon name="arrow" className="w-4.5 h-4.5" />
          </Button>
          <Button href={`https://wa.me/8801926100643?text=${encodeURIComponent(t(HERO.waDefault))}`} variant="whatsapp" size="lg">
            <Icon name="whatsapp" className="w-5 h-5" />
            {t(BTN.talkToUs)}
          </Button>
        </div>
      </PageHero>

      <section className="container-x py-14 sm:py-20">
        <Breadcrumbs items={[{ label: t({ en: "About Us", bn: "আমাদের সম্পর্কে" }) }]} />

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <SectionHeading
              align="left"
              eyebrow={t(ABOUT_TEXTS.whoEyebrow)}
              title={t(ABOUT_TEXTS.whoTitle)}
              subtitle={t(ABOUT_TEXTS.whoSub)}
            />
            <div className="mt-8 flex items-center gap-6 rounded-2xl border border-brand-100 bg-brand-50/60 p-5">
              <span className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-500 text-white flex items-center justify-center shadow-lg shadow-brand-600/25 shrink-0">
                <Icon name="badge" className="w-7 h-7" />
              </span>
              <p className="text-[15px] leading-relaxed text-ink-700">
                <strong className="text-ink-900">{t(ABOUT_TEXTS.focusLabel)}</strong>{" "}
                {t(ABOUT_TEXTS.focusBody)}
              </p>
            </div>
          </Reveal>
          <Reveal delay={1}>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: 5, suffix: "+", label: t({ en: "Years Track Record", bn: "বছরের অভিজ্ঞতা" }) },
                { value: 30, suffix: "+", label: t({ en: "Expert Programmers", bn: "বিশেষজ্ঞ প্রোগ্রামার" }) },
                { value: 1100, suffix: "+", label: t({ en: "Client Reviews", bn: "ক্লায়েন্ট রিভিউ" }) },
                { value: 8, suffix: "+", label: t(ABOUT_TEXTS.statCategories) },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl border border-ink-100 bg-white p-6 text-center shadow-soft hover:shadow-card transition-shadow">
                  <p className="font-display font-bold text-3xl sm:text-4xl text-gradient-dark">
                    <Counter value={s.value} suffix={s.suffix} />
                  </p>
                  <p className="mt-2 text-sm font-medium text-ink-500">{s.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <div className="mt-20">
          <SectionHeading
            eyebrow={t(ABOUT_TEXTS.coreEyebrow)}
            title={t(ABOUT_TEXTS.coreTitle)}
            subtitle={t(ABOUT_TEXTS.coreSub)}
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {core.map((p, i) => (
              <Reveal key={p.to} delay={(i % 3) as 0 | 1 | 2}>
                <Link
                  to={p.to}
                  className="group flex h-full flex-col rounded-2xl border border-ink-100 bg-white p-7 shadow-soft transition-all duration-300 hover:shadow-card hover:-translate-y-1 hover:border-brand-200"
                >
                  <IconTile name={p.icon as never} />
                  <h3 className="mt-5 font-display font-bold text-xl text-ink-900 group-hover:text-brand-700 transition-colors">
                    {p.title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-ink-500">{p.desc}</p>
                  <span className="mt-auto pt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600">
                    {t(BTN.learnMore)} <Icon name="arrow" className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="mt-20 rounded-3xl bg-ink-950 relative overflow-hidden p-8 sm:p-14 text-white">
          <div className="absolute inset-0 bg-grid" aria-hidden="true" />
          <div className="absolute -top-24 left-1/3 w-72 h-72 rounded-full bg-brand-600/35 blur-[110px]" aria-hidden="true" />
          <div className="relative">
            <SectionHeading
              dark
              eyebrow={t(ABOUT_TEXTS.principlesEyebrow)}
              title={t(ABOUT_TEXTS.principlesTitle)}
              subtitle={t(ABOUT_TEXTS.principlesSub)}
            />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ABOUT_TEXTS.principles.map((v, i) => (
                <Reveal key={i} delay={(i % 3) as 0 | 1 | 2}>
                  <div className="h-full rounded-2xl bg-white/5 border border-white/10 p-6 hover:bg-white/10 hover:border-brand-400/40 transition-all">
                    <Icon name={v.icon as never} className="w-6 h-6 text-brand-300" />
                    <h3 className="mt-3.5 font-display font-bold text-base">{t(v.title)}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-100/70">{t(v.desc)}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <CtaSection />
    </>
  );
}
