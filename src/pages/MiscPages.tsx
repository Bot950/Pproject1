import { useState } from "react";
import { Icon } from "../components/Icons";
import { Button, Reveal, PageHero, Breadcrumbs, FaqAccordion } from "../components/ui";
import { CtaSection, usePageMeta } from "../components/Layout";
import { useI18n } from "../lib/i18n";
import {
  FAQS,
  BTN,
  HERO,
  PAGE_HEROS,
  VERIFY_TEXTS,
  LEGAL,
  NOTFOUND,
  OFFICIAL_LINKS,
  CONTACT,
} from "../lib/content";
import { cn } from "../utils/cn";

/* ───────────────────────── FAQ page ───────────────────────── */

export function FaqPage() {
  const { t } = useI18n();
  usePageMeta(
    t({ en: "FAQ — Frequently Asked Questions", bn: "FAQ — প্রায়শই জিজ্ঞাসিত প্রশ্ন" }),
    t({ en: "Answers to common questions about AL-KHUBAIB IT services: web development, custom software, education management systems, online services, citizen service assistance, pricing and support.", bn: "AL-KHUBAIB IT সার্ভিস সম্পর্কিত সাধারণ প্রশ্নের উত্তর: ওয়েব ডেভেলপমেন্ট, কাস্টম সফটওয়্যার, এডুকেশন ম্যানেজমেন্ট সিস্টেম, অনলাইন সার্ভিস, সিটিজেন সার্ভিস সহায়তা, মূল্য ও সাপোর্ট।" })
  );
  const faqs = FAQS.map((f) => ({ q: t(f.q), a: t(f.a) }));
  return (
    <>
      <PageHero eyebrow={t(PAGE_HEROS.faq.eyebrow)} title={t(PAGE_HEROS.faq.title)} subtitle={t(PAGE_HEROS.faq.subtitle)}>
        <div className="mt-7 flex flex-col sm:flex-row gap-3.5">
          <Button to="/contact" size="lg">
            {t(BTN.askQuestion)} <Icon name="arrow" className="w-4.5 h-4.5" />
          </Button>
          <Button href={`https://wa.me/8801926100643?text=${encodeURIComponent(t(HERO.waDefault))}`} variant="whatsapp" size="lg">
            <Icon name="whatsapp" className="w-5 h-5" />
            {t(BTN.askOnWhatsApp)}
          </Button>
        </div>
      </PageHero>
      <section className="container-x py-14 sm:py-20">
        <Breadcrumbs items={[{ label: t({ en: "FAQ", bn: "সাধারণ জিজ্ঞাসা" }) }]} />
        <div className="max-w-3xl mx-auto">
          <FaqAccordion faqs={faqs} />
          <Reveal className="mt-10">
            <div className="rounded-2xl bg-brand-50/70 border border-brand-100 p-6 text-center">
              <p className="text-ink-700 font-medium">{t({ en: "Still have questions?", bn: "এখনও প্রশ্ন আছে?" })}</p>
              <p className="mt-1.5 text-sm text-ink-500">
                {t({ en: "Call", bn: "কল করুন" })}{" "}
                <a className="font-semibold text-brand-600" href={CONTACT.phonePrimaryHref}>{CONTACT.phonePrimary}</a>{" "}
                {t({ en: "or email", bn: "অথবা ইমেইল করুন" })}{" "}
                <a className="font-semibold text-brand-600" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
              </p>
            </div>
          </Reveal>
        </div>
      </section>
      <CtaSection />
    </>
  );
}

/* ────────────── Certificate verification page ─────────────── */

export function VerifyPage() {
  const { t } = useI18n();
  usePageMeta(
    t({ en: "Certificate Verification", bn: "সার্টিফিকেট যাচাই" }),
    t({ en: "Verify the authenticity of certificates issued by AL-KHUBAIB IT. Enter your certificate number to confirm it was legitimately issued by our institution.", bn: "AL-KHUBAIB IT কর্তৃক ইস্যুকৃত সার্টিফিকেটের সত্যতা যাচাই করুন। সার্টিফিকেট নম্বর লিখে নিশ্চিত করুন যে এটি আমাদের প্রতিষ্ঠান কর্তৃক বৈধভাবে ইস্যু হয়েছে।" })
  );
  const [id, setId] = useState("");
  const [state, setState] = useState<"idle" | "checking" | "done">("idle");
  const [error, setError] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = id.trim();
    if (clean.length < 5) {
      setError(t(VERIFY_TEXTS.err));
      return;
    }
    setError("");
    setState("checking");
    window.setTimeout(() => setState("done"), 1400);
  };

  const sampleRows = [
    { k: t(VERIFY_TEXTS.holder), v: t(VERIFY_TEXTS.sampleHolder) },
    { k: t(VERIFY_TEXTS.course), v: t(VERIFY_TEXTS.sampleCourse) },
    { k: t(VERIFY_TEXTS.label), v: "AKIT-2026-0001" },
    { k: t(VERIFY_TEXTS.issueDate), v: t(VERIFY_TEXTS.sampleDate) },
  ];

  return (
    <>
      <PageHero eyebrow={t(PAGE_HEROS.verify.eyebrow)} title={t(PAGE_HEROS.verify.title)} subtitle={t(PAGE_HEROS.verify.subtitle)} />
      <section className="container-x py-14 sm:py-20">
        <Breadcrumbs items={[{ label: t({ en: "Certificate Verification", bn: "সার্টিফিকেট যাচাই" }) }]} />

        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8 max-w-5xl mx-auto">
          <Reveal>
            <div className="rounded-3xl border border-ink-100 bg-white p-7 sm:p-10 shadow-card">
              <div className="flex items-center gap-4">
                <span className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-500 text-white flex items-center justify-center shadow-lg shadow-brand-600/25">
                  <Icon name="shield" className="w-7 h-7" />
                </span>
                <div>
                  <h2 className="font-display font-bold text-2xl text-ink-900">{t(VERIFY_TEXTS.title)}</h2>
                  <p className="text-sm text-ink-500">{t(VERIFY_TEXTS.sub)}</p>
                </div>
              </div>

              <form onSubmit={onSubmit} className="mt-8" noValidate>
                <label htmlFor="cert-id" className="block text-sm font-semibold text-ink-800 mb-2">
                  {t(VERIFY_TEXTS.label)}
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    id="cert-id"
                    type="text"
                    value={id}
                    onChange={(e) => {
                      setId(e.target.value);
                      setError("");
                      setState("idle");
                    }}
                    placeholder={t(VERIFY_TEXTS.ph)}
                    className={cn(
                      "flex-1 rounded-xl border border-ink-200 bg-white px-4 py-3.5 text-[15px] font-medium text-ink-900 placeholder:text-ink-300 outline-none transition-all focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10",
                      error && "border-red-400"
                    )}
                  />
                  <Button type="submit" size="lg" className="shrink-0">
                    {state === "checking" ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                        {t(VERIFY_TEXTS.verifying)}
                      </>
                    ) : (
                      <>
                        <Icon name="search" className="w-4.5 h-4.5" />
                        {t(BTN.verifyCertificate)}
                      </>
                    )}
                  </Button>
                </div>
                {error && (
                  <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-red-600">
                    <Icon name="badge" className="w-4 h-4 shrink-0" /> {error}
                  </p>
                )}
              </form>

              {state === "done" && (
                <div className="mt-8 animate-fade-in">
                  <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-6">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0">
                        <Icon name="clock" className="w-5 h-5" />
                      </span>
                      <div>
                        <p className="font-semibold text-ink-900">
                          {t(VERIFY_TEXTS.received)} “{id.trim()}”
                        </p>
                        <p className="text-sm text-ink-500 mt-0.5">{t(VERIFY_TEXTS.note)}</p>
                      </div>
                    </div>
                    <div className="mt-5 flex flex-col sm:flex-row gap-3">
                      <Button href={`${OFFICIAL_LINKS.verify}?certificate=${encodeURIComponent(id.trim())}`} className="flex-1">
                        {t(BTN.continueOfficial)} <Icon name="arrow" className="w-4 h-4" />
                      </Button>
                      <Button
                        href={`https://wa.me/8801926100643?text=${encodeURIComponent(t({ en: `Assalamu Alaikum, I would like to verify certificate: ${id.trim()}`, bn: `আসসালামু আলাইকুম, সার্টিফিকেট যাচাই করতে চাই: ${id.trim()}` }))}`}
                        variant="whatsapp"
                        className="flex-1"
                      >
                        <Icon name="whatsapp" className="w-4.5 h-4.5" />
                        {t(BTN.askOurTeam)}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-400 mb-3">
                  {t(VERIFY_TEXTS.example)}
                </p>
                <div className="rounded-2xl border border-ink-100 bg-gradient-to-br from-white to-brand-50/40 p-6">
                  <div className="flex items-center justify-between pb-4 border-b border-ink-100">
                    <p className="font-display font-bold text-lg text-ink-900">{t(VERIFY_TEXTS.resultTitle)}</p>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1 text-xs font-bold">
                      <Icon name="check" className="w-3.5 h-3.5" strokeWidth={3} />
                      {t(VERIFY_TEXTS.verified)}
                    </span>
                  </div>
                  <dl className="mt-4 grid sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                    {sampleRows.map((r) => (
                      <div key={r.k}>
                        <dt className="text-ink-400 font-medium">{r.k}</dt>
                        <dd className="mt-0.5 font-semibold text-ink-900">{r.v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </div>
          </Reveal>

          <div className="space-y-5">
            <Reveal delay={1}>
              <div className="rounded-2xl bg-ink-950 relative overflow-hidden p-7 text-white">
                <div className="absolute inset-0 bg-grid" aria-hidden="true" />
                <div className="absolute -top-14 -right-14 w-44 h-44 rounded-full bg-brand-600/40 blur-[80px]" aria-hidden="true" />
                <div className="relative">
                  <Icon name="lock" className="w-7 h-7 text-brand-300" />
                  <h3 className="mt-3 font-display font-bold text-xl">{t(VERIFY_TEXTS.howTitle)}</h3>
                  <ol className="mt-4 space-y-3.5 text-sm text-ink-100/80">
                    {VERIFY_TEXTS.howSteps.map((s, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-white/10 text-brand-200 text-xs font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        {t(s)}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </Reveal>

            <Reveal delay={2}>
              <div className="rounded-2xl border border-ink-100 bg-white p-7 shadow-soft">
                <Icon name="badge" className="w-6 h-6 text-brand-600" />
                <h3 className="mt-3 font-display font-bold text-lg text-ink-900">{t(VERIFY_TEXTS.authorityTitle)}</h3>
                <p className="mt-2 text-sm text-ink-500 leading-relaxed">{t(VERIFY_TEXTS.authorityDesc)}</p>
                <Button href={OFFICIAL_LINKS.verifyAuthority} variant="secondary" size="sm" className="mt-4">
                  {t(BTN.openAuthorityPortal)} <Icon name="arrow" className="w-4 h-4" />
                </Button>
              </div>
            </Reveal>

            <Reveal delay={3}>
              <div className="rounded-2xl bg-brand-50/70 border border-brand-100 p-7">
                <p className="text-sm text-ink-600 leading-relaxed">{t(VERIFY_TEXTS.helpText)}</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
      <CtaSection />
    </>
  );
}

/* ─────────────────────── Legal pages ──────────────────────── */

function LegalPage({
  title,
  sections,
}: {
  title: string;
  sections: { h: string; body: string[] }[];
}) {
  const { t } = useI18n();
  return (
    <>
      <PageHero eyebrow={t(PAGE_HEROS.legal)} title={title} subtitle={`${t(LEGAL.updated)} ${t(LEGAL.updatedDate)}`} />
      <section className="container-x py-14 sm:py-20">
        <Breadcrumbs items={[{ label: title }]} />
        <div className="max-w-3xl">
          {sections.map((s) => (
            <div key={s.h} className="py-5 first:pt-0">
              <h2 className="font-display font-bold text-xl text-ink-900">{s.h}</h2>
              {s.body.map((p, i) => (
                <p key={i} className="mt-3 text-[15px] leading-relaxed text-ink-500">
                  {p}
                </p>
              ))}
            </div>
          ))}
          <div className="mt-8 rounded-2xl border border-brand-100 bg-brand-50/60 p-6 text-sm text-ink-600">
            {t(LEGAL.questions)} {title.toLowerCase()}? {t(LEGAL.legalContact)}{" "}
            <a href={`mailto:${CONTACT.email}`} className="font-semibold text-brand-600 break-all">
              {CONTACT.email}
            </a>{" "}
            {t({ en: "or", bn: "অথবা" })}{" "}
            <a href={CONTACT.phonePrimaryHref} className="font-semibold text-brand-600">{CONTACT.phonePrimary}</a>.
          </div>
        </div>
      </section>
    </>
  );
}

export function PrivacyPage() {
  const { t } = useI18n();
  usePageMeta(
    t({ en: "Privacy Policy", bn: "প্রাইভেসি পলিসি" }),
    t({ en: "How AL-KHUBAIB IT collects, uses and protects your personal information.", bn: "AL-KHUBAIB IT কীভাবে আপনার ব্যক্তিগত তথ্য সংগ্রহ, ব্যবহার ও সুরক্ষিত করে।" })
  );
  const sections = LEGAL.privacySections.map((s) => ({
    h: t(s.h),
    body: s.body.map((b) => t(b)),
  }));
  return <LegalPage title={t(LEGAL.privacyTitle)} sections={sections} />;
}

export function TermsPage() {
  const { t } = useI18n();
  usePageMeta(
    t({ en: "Terms & Conditions", bn: "টার্মস ও কন্ডিশনস" }),
    t({ en: "The terms and conditions governing the use of AL-KHUBAIB IT services and website.", bn: "AL-KHUBAIB IT-এর সার্ভিস ও ওয়েবসাইট ব্যবহারের শর্তাবলি।" })
  );
  const sections = LEGAL.termsSections.map((s) => ({
    h: t(s.h),
    body: s.body.map((b) => t(b)),
  }));
  return <LegalPage title={t(LEGAL.termsTitle)} sections={sections} />;
}

/* ─────────────────────── 404 page ─────────────────────────── */

export function NotFoundPage() {
  const { t } = useI18n();
  usePageMeta(t({ en: "Page Not Found", bn: "পেজটি খুঁজে পাওয়া যায়নি" }));
  return (
    <section className="relative overflow-hidden bg-ink-950 text-white">
      <div className="absolute inset-0 bg-grid" aria-hidden="true" />
      <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-brand-600/35 blur-[120px] animate-blob" aria-hidden="true" />
      <div className="container-x relative flex flex-col items-center text-center py-28 sm:py-40">
        <p className="font-display font-bold text-7xl sm:text-8xl bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
          404
        </p>
        <h1 className="mt-4 font-display font-bold text-2xl sm:text-3xl">{t(NOTFOUND.title)}</h1>
        <p className="mt-3 text-ink-100/70 max-w-md">{t(NOTFOUND.desc)}</p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3.5">
          <Button to="/">
            {t(BTN.backHome)} <Icon name="arrow" className="w-4.5 h-4.5" />
          </Button>
          <Button to="/services" variant="outline-light">
            {t(NOTFOUND.explore)}
          </Button>
        </div>
      </div>
    </section>
  );
}
