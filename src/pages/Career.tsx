import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Icon } from "../components/Icons";
import {
  Button,
  SectionHeading,
  Reveal,
  PageHero,
  Breadcrumbs,
  FaqAccordion,
  IconTile,
} from "../components/ui";
import { CtaSection, usePageMeta } from "../components/Layout";
import { useI18n } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import { CAREER, BTN, PAGE_HEROS } from "../lib/content";
import { cn } from "../utils/cn";

/* ─────────────── Section anchor scrolling ─────────────────── */

function useSectionScroll() {
  const [params] = useSearchParams();
  useEffect(() => {
    const section = params.get("section");
    if (!section) return;
    const timer = window.setTimeout(() => {
      const el = document.getElementById(`career-${section}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [params]);
}

/* ───────────────────────── PAGE ───────────────────────────── */

export default function Career() {
  const { t } = useI18n();
  usePageMeta(
    t({ en: "Career & Earning Opportunities — Join AL-KHUBAIB IT", bn: "ক্যারিয়ার ও আয়ের সুযোগ — AL-KHUBAIB IT-এ যুক্ত হোন" }),
    t({ en: "Build your career with AL-KHUBAIB IT. Explore affiliate, smart earning and digital partnership opportunities — apply online and earn according to applicable terms.", bn: "AL-KHUBAIB IT-এর সাথে আপনার ক্যারিয়ার গড়ুন। এফিলিয়েট, স্মার্ট আর্নিং ও ডিজিটাল পার্টনারশিপ সুযোগ দেখুন — অনলাইনে আবেদন করুন এবং প্রযোজ্য শর্ত অনুযায়ী আয় করুন।" })
  );
  useSectionScroll();
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);

  const opportunities = CAREER.opportunities.filter((o) => filter === "all" || o.category === filter);
  const careerFaqs = CAREER.faqs.map((f) => ({ q: t(f.q), a: t(f.a) }));

  return (
    <>
      <PageHero eyebrow={t(PAGE_HEROS.career.eyebrow)} title={t(PAGE_HEROS.career.title)} subtitle={t(PAGE_HEROS.career.subtitle)}>
        <div className="mt-7 flex flex-col sm:flex-row gap-3.5">
          <Button to="/career?section=apply" size="lg">
            {t(BTN.applyNow)} <Icon name="arrow" className="w-4.5 h-4.5" />
          </Button>
          <Button to="/career?section=opportunities" variant="outline-light" size="lg">
            {t(BTN.exploreEarning)}
          </Button>
        </div>
      </PageHero>

      <section className="container-x py-14 sm:py-20">
        <Breadcrumbs items={[{ label: t({ en: "Career", bn: "ক্যারিয়ার" }) }]} />

        {/* Disclaimer */}
        <Reveal>
          <div className="rounded-2xl border-2 border-brand-200 bg-brand-50/70 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-brand-600/25">
                <Icon name="bell" className="w-6 h-6" />
              </span>
              <div>
                <h2 className="font-display font-bold text-xl text-ink-900">{t(CAREER.disclaimerTitle)}</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-600">{t(CAREER.disclaimer)}</p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Opportunities */}
        <div id="career-opportunities" className="mt-16 scroll-mt-28">
          <SectionHeading
            eyebrow={t({ en: "Earning Opportunities", bn: "আয়ের সুযোগ" })}
            title={t(CAREER.sectionTitle)}
            subtitle={t(CAREER.sectionSub)}
          />
          {/* Filters */}
          <div className="mt-8 flex flex-wrap justify-center gap-2.5" role="tablist" aria-label="Opportunity filters">
            {CAREER.categories.map((c) => (
              <button
                key={c.key}
                role="tab"
                aria-selected={filter === c.key}
                onClick={() => setFilter(c.key)}
                className={cn(
                  "px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 border",
                  filter === c.key
                    ? "bg-gradient-to-r from-brand-700 to-brand-500 text-white border-transparent shadow-lg shadow-brand-600/25"
                    : "bg-white text-ink-600 border-ink-200 hover:border-brand-300 hover:text-brand-700"
                )}
              >
                {t(c.label)}
              </button>
            ))}
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3" id="career-affiliate">
            {opportunities.map((o, i) => (
              <Reveal key={o.id} delay={(i % 3) as 0 | 1 | 2}>
                <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft transition-all duration-300 hover:shadow-card hover:-translate-y-1 hover:border-brand-200">
                  <div className="relative bg-gradient-to-br from-brand-800 via-brand-700 to-brand-500 p-6 text-white overflow-hidden">
                    <div className="absolute inset-0 bg-grid" aria-hidden="true" />
                    <div className="relative flex items-start justify-between">
                      <span className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
                        <Icon name={o.icon as never} className="w-6 h-6" />
                      </span>
                    </div>
                    <h3 className="relative mt-4 font-display font-bold text-xl">{t(o.title)}</h3>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <p className="text-sm leading-relaxed text-ink-500">{t(o.desc)}</p>
                    <dl className="mt-5 space-y-3.5 text-sm">
                      {[
                        { icon: "users", k: t(CAREER.detailLabels.who), v: t(o.who) },
                        { icon: "briefcase", k: t(CAREER.detailLabels.does), v: t(o.does) },
                        { icon: "trending", k: t(CAREER.detailLabels.earns), v: t(o.earns) },
                        { icon: "check", k: t(CAREER.detailLabels.requirements), v: t(o.requirements) },
                        { icon: "gift", k: t(CAREER.detailLabels.benefits), v: t(o.benefits) },
                        { icon: "shield", k: t(CAREER.detailLabels.conditions), v: t(o.conditions) },
                      ].map((row) => (
                        <div key={row.k} className="flex gap-3">
                          <Icon name={row.icon as never} className="w-4.5 h-4.5 text-brand-500 shrink-0 mt-0.5" />
                          <div>
                            <dt className="font-semibold text-ink-900">{row.k}</dt>
                            <dd className="text-ink-500 leading-relaxed">{row.v}</dd>
                          </div>
                        </div>
                      ))}
                    </dl>
                    <div className="mt-auto pt-6">
                      <Button to="/career?section=apply" className="w-full">
                        {t(o.cta)} <Icon name="arrow" className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Smart Earning spotlight */}
        <div id="career-smart" className="mt-16 scroll-mt-28">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-ink-950 p-8 sm:p-12 text-white">
              <div className="absolute inset-0 bg-grid" aria-hidden="true" />
              <div className="absolute -top-20 right-1/4 w-72 h-72 rounded-full bg-brand-600/40 blur-[110px] animate-blob" aria-hidden="true" />
              <div className="relative grid lg:grid-cols-[1.2fr_1fr] gap-10 items-center">
                <div>
                  <SectionHeading align="left" dark eyebrow={t({ en: "Smart Earning Card", bn: "স্মার্ট আর্নিং কার্ড" })} title={t(CAREER.smartTitle)} subtitle={t(CAREER.smartSub)} />
                  <div className="mt-7 flex flex-col sm:flex-row gap-3.5">
                    <Button to="/career?section=apply" className="bg-white text-brand-700 from-white via-white to-white hover:bg-brand-50">
                      {t({ en: "Get the Card", bn: "কার্ডটি নিন" })} <Icon name="arrow" className="w-4.5 h-4.5" />
                    </Button>
                    <Button
                      href={`https://wa.me/8801926100643?text=${encodeURIComponent(t(CAREER.waCareer))}`}
                      variant="whatsapp"
                    >
                      <Icon name="whatsapp" className="w-4.5 h-4.5" />
                      {t(BTN.askOnWhatsApp)}
                    </Button>
                  </div>
                </div>
                <div className="relative mx-auto w-full max-w-sm">
                  <div className="rounded-2xl bg-gradient-to-br from-brand-600 via-brand-500 to-brand-400 p-[1.5px] shadow-2xl shadow-brand-600/40">
                    <div className="rounded-2xl bg-ink-950 p-6">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-300">AL-KHUBAIB IT</span>
                        <Icon name="card" className="w-7 h-7 text-brand-300" />
                      </div>
                      <p className="mt-6 font-display font-bold text-2xl text-white">Smart Earning Card</p>
                      <div className="mt-5 space-y-2.5 text-sm text-ink-100/80">
                        {[
                          t({ en: "10% – 35% bonus on eligible referrals", bn: "যোগ্য রেফারেলে ১০% – ৩৫% বোনাস" }),
                          t({ en: "Services from ৳50 to ৳50,000", bn: "৳৫০ থেকে ৳৫০,০০০ পর্যন্ত সার্ভিস" }),
                          t({ en: "No investment, no prior experience", bn: "বিনিয়োগ বা পূর্ব অভিজ্ঞতা লাগবে না" }),
                          t({ en: "Earnings according to applicable terms", bn: "প্রযোজ্য শর্ত অনুযায়ী আয়" }),
                        ].map((line, i) => (
                          <p key={i} className="flex items-center gap-2.5">
                            <Icon name="check" className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={2.5} />
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Who can join */}
        <div className="mt-16">
          <SectionHeading eyebrow={t({ en: "Eligibility", bn: "যোগ্যতা" })} title={t(CAREER.whoTitle)} subtitle={t(CAREER.whoSub)} />
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {CAREER.whoGroups.map((g, i) => (
              <Reveal key={i} delay={(i % 4) as 0 | 1 | 2 | 3}>
                <div className="group h-full rounded-2xl border border-ink-100 bg-white p-5 text-center shadow-soft transition-all duration-300 hover:shadow-card hover:-translate-y-1 hover:border-brand-200">
                  <span className="mx-auto w-10 h-10 rounded-xl bg-brand-50 text-brand-600 group-hover:bg-gradient-to-br group-hover:from-brand-600 group-hover:to-brand-500 group-hover:text-white transition-all flex items-center justify-center">
                    <Icon name="user" className="w-5 h-5" />
                  </span>
                  <p className="mt-3 font-semibold text-sm text-ink-800 leading-snug">{t(g)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-16 rounded-3xl bg-brand-50/60 border border-brand-100 p-8 sm:p-12">
          <SectionHeading eyebrow={t({ en: "Benefits", bn: "সুবিধাসমূহ" })} title={t(CAREER.benefitsTitle)} subtitle={t(CAREER.benefitsSub)} />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CAREER.benefits.map((b, i) => (
              <Reveal key={i} delay={(i % 3) as 0 | 1 | 2}>
                <div className="group h-full rounded-2xl bg-white border border-ink-100 p-6 shadow-soft transition-all duration-300 hover:shadow-card hover:-translate-y-1">
                  <IconTile name={b.icon as never} size="sm" />
                  <h3 className="mt-4 font-display font-bold text-base text-ink-900">{t(b.title)}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{t(b.desc)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div id="career-how" className="mt-16 scroll-mt-28">
          <SectionHeading eyebrow={t({ en: "Process", bn: "প্রক্রিয়া" })} title={t(CAREER.stepsTitle)} subtitle={t(CAREER.stepsSub)} />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {CAREER.steps.map((s, i) => (
              <Reveal key={i} delay={(i % 5) as 0 | 1 | 2 | 3 | 4}>
                <div className="group relative h-full rounded-2xl bg-white border border-ink-100 p-6 shadow-soft transition-all duration-300 hover:shadow-card hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 text-white flex items-center justify-center shadow-lg shadow-brand-600/25">
                      <Icon name={s.icon as never} className="w-4.5 h-4.5" />
                    </span>
                    <span className="font-display font-bold text-3xl text-brand-100 group-hover:text-brand-200 transition-colors">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display font-bold text-base text-ink-900">{t(s.title)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">{t(s.desc)}</p>
                  {i < CAREER.steps.length - 1 && (
                    <span className="hidden lg:flex absolute top-1/2 -right-3.5 z-10 w-7 h-7 rounded-full bg-white border border-brand-200 text-brand-500 items-center justify-center shadow-sm">
                      <Icon name="arrow" className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Application */}
        <div id="career-apply" className="mt-16 scroll-mt-28">
          {showForm ? (
            <CareerForm onClose={() => setShowForm(false)} />
          ) : (
            <Reveal>
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-900 via-brand-700 to-brand-600 p-8 sm:p-14 text-center text-white">
                <div className="absolute inset-0 bg-grid" aria-hidden="true" />
                <div className="absolute -top-20 -left-16 w-64 h-64 rounded-full bg-brand-400/40 blur-[90px]" aria-hidden="true" />
                <div className="relative">
                  <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-100">
                    <Icon name="zap" className="w-4 h-4" />
                    {t({ en: "Ready to start?", bn: "শুরু করতে প্রস্তুত?" })}
                  </span>
                  <h2 className="mt-4 font-display font-bold text-3xl sm:text-4xl">{t(CAREER.form.title)}</h2>
                  <p className="mt-3 mx-auto max-w-xl text-brand-100/90">{t(CAREER.form.sub)}</p>
                  <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
                    <Button
                      onClick={() => setShowForm(true)}
                      size="lg"
                      className="w-full sm:w-auto bg-white text-brand-700 from-white via-white to-white hover:bg-brand-50"
                    >
                      {t(BTN.applyNow)} <Icon name="arrow" className="w-4.5 h-4.5" />
                    </Button>
                    <Button
                      href={`https://wa.me/8801926100643?text=${encodeURIComponent(t(CAREER.waCareer))}`}
                      variant="whatsapp"
                      size="lg"
                      className="w-full sm:w-auto"
                    >
                      <Icon name="whatsapp" className="w-5 h-5" />
                      {t(BTN.whatsappTalk)}
                    </Button>
                  </div>
                  <p className="mt-5 text-sm text-brand-100/70">{t(CAREER.disclaimer)}</p>
                </div>
              </div>
            </Reveal>
          )}
        </div>

        {/* FAQ */}
        <div id="career-faq" className="mt-16 scroll-mt-28">
          <SectionHeading eyebrow={t({ en: "FAQ", bn: "সাধারণ জিজ্ঞাসা" })} title={t(CAREER.faqTitle)} subtitle={t(CAREER.faqSub)} />
          <div className="mt-10 max-w-3xl mx-auto">
            <FaqAccordion faqs={careerFaqs} />
          </div>
        </div>
      </section>

      <CtaSection
        title={t({ en: "Ready to Grow With Us?", bn: "আমাদের সাথে এগিয়ে যেতে প্রস্তুত?" })}
        desc={t({ en: "Tell us which opportunity fits you best and our team will guide you through the next steps.", bn: "কোন সুযোগটি আপনার জন্য উপযুক্ত তা জানান — আমাদের টিম পরবর্তী ধাপে আপনাকে গাইড করবে।" })}
      />
    </>
  );
}

/* ───────────────────── Application form ───────────────────── */

type CareerFormState = {
  name: string;
  mobile: string;
  email: string;
  address: string;
  language: string;
  opportunity: string;
  experience: string;
  skills: string;
  social: string;
  why: string;
  hear: string;
  additional: string;
};

const initialCareer: CareerFormState = {
  name: "",
  mobile: "",
  email: "",
  address: "",
  language: "",
  opportunity: "",
  experience: "",
  skills: "",
  social: "",
  why: "",
  hear: "",
  additional: "",
};

const careerInputCls =
  "w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-[15px] text-ink-900 placeholder:text-ink-300 outline-none transition-all focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10";

function CareerForm({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const { user: currentUser } = useAuth();
  const [form, setForm] = useState<CareerFormState>(initialCareer);
  const [errors, setErrors] = useState<Partial<Record<keyof CareerFormState, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [credentials, setCredentials] = useState<{ username: string; tempPassword: string } | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);

  const set = (key: keyof CareerFormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validate = () => {
    const er: Partial<Record<keyof CareerFormState, string>> = {};
    if (!form.name.trim() || form.name.trim().length < 2) er.name = t(CAREER.form.errName);
    if (!/^[+0-9][0-9\s\-()]{7,16}$/.test(form.mobile.trim())) er.mobile = t(CAREER.form.errPhone);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) er.email = t(CAREER.form.errEmail);
    if (!form.opportunity) er.opportunity = t(CAREER.form.errOpportunity);
    if (!form.why.trim() || form.why.trim().length < 10) er.why = t(CAREER.form.errWhy);
    if (form.social.trim()) {
      try {
        const url = new URL(form.social.trim().replace(/^@/, "https://"));
        if (!/^https?:$/.test(url.protocol)) er.social = t(CAREER.form.errUrl);
      } catch {
        er.social = t(CAREER.form.errUrl);
      }
    }
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    const { submitAffiliateApplication } = await import("../lib/affiliate");
    // Existing logged-in clients apply with the same central account (no duplicate).
    const r = await submitAffiliateApplication(
      {
        name: form.name,
        mobile: form.mobile,
        email: currentUser?.email || form.email,
        address: form.address,
        experience: form.experience,
        skills: form.skills,
        social: form.social,
        method: form.opportunity,
        why: form.why,
        password: "Auto-Generated",
      },
      currentUser?.role === "client" ? currentUser.id : undefined
    );
    setBusy(false);
    if (!r.ok) {
      setErrors({ email: r.error || "" });
      return;
    }
    setCredentials(r.username ? { username: r.username, tempPassword: r.tempPassword || "" } : null);
    setSubmitted(true);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const applyAs = CAREER.opportunities.find((o) => o.id === form.opportunity);

  return (
    <div ref={formRef} className="scroll-mt-28">
      {submitted ? (
        <div className="rounded-3xl border border-ink-100 bg-white p-8 sm:p-12 text-center shadow-card animate-fade-in">
          <span className="mx-auto flex w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 items-center justify-center">
            <Icon name="check" className="w-8 h-8" strokeWidth={2.5} />
          </span>
          <h2 className="mt-5 font-display font-bold text-2xl sm:text-3xl text-ink-900">
            {t(CAREER.form.successTitle)}
          </h2>
          <p className="mt-3 text-ink-500 leading-relaxed max-w-xl mx-auto">{t(CAREER.form.successBody)}</p>

          {credentials && (
            <div className="mt-6 mx-auto max-w-md rounded-2xl border-2 border-brand-200 bg-brand-50/70 p-5 text-left">
              <p className="font-display font-bold text-base text-ink-900">
                {t({ en: "Your login credentials", bn: "আপনার লগইন তথ্য" })}
              </p>
              <p className="mt-2 text-sm text-ink-600 leading-relaxed">
                {t({ en: "An affiliate applicant account has been created automatically. Save these credentials — they are shown only once.", bn: "আপনার জন্য স্বয়ংক্রিয়ভাবে একটি এফিলিয়েট আবেদনকারী অ্যাকাউন্ট তৈরি হয়েছে। এই তথ্য সংরক্ষণ করুন — এটি শুধুমাত্র একবার দেখানো হয়।" })}
              </p>
              <div className="mt-3 space-y-2 text-sm">
                <p className="flex justify-between rounded-lg bg-white border border-ink-100 px-3 py-2">
                  <span className="text-ink-500">{t({ en: "Username", bn: "ইউজারনেম" })}</span>
                  <span className="font-mono font-bold text-brand-700">{credentials.username}</span>
                </p>
                <p className="flex justify-between rounded-lg bg-white border border-ink-100 px-3 py-2">
                  <span className="text-ink-500">{t({ en: "Temporary Password", bn: "সাময়িক পাসওয়ার্ড" })}</span>
                  <span className="font-mono font-bold text-brand-700">{credentials.tempPassword}</span>
                </p>
              </div>
              <p className="mt-3 text-xs text-ink-400">
                {t({ en: "Login with your email and this password to view your application status. Until approval, only application status and profile are available.", bn: "আবেদনের অবস্থা দেখতে আপনার ইমেইল ও এই পাসওয়ার্ড দিয়ে লগইন করুন। অনুমোদনের আগে শুধুমাত্র আবেদনের অবস্থা ও প্রোফাইল দেখা যাবে।" })}
              </p>
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <Button to="/affiliate" size="sm">
              <Icon name="user" className="w-4.5 h-4.5" />
              {t({ en: "Go to Affiliate Portal", bn: "এফিলিয়েট পোর্টালে যান" })}
            </Button>
            <Button
              href={`https://wa.me/8801926100643?text=${encodeURIComponent(
                t({
                  en: `Assalamu Alaikum, I submitted a career application as: ${form.opportunity || "Affiliate Partner"}. Name: ${form.name || "…"}`,
                  bn: `আসসালামু আলাইকুম, আমি ক্যারিয়ার আবেদন জমা দিয়েছি — ${form.opportunity || "এফিলিয়েট পার্টনার"} হিসেবে। নাম: ${form.name || "…"}`,
                })
              )}`}
              variant="whatsapp"
              size="sm"
            >
              <Icon name="whatsapp" className="w-4.5 h-4.5" />
              {t(BTN.continueWhatsApp)}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setForm(initialCareer);
                setSubmitted(false);
                setCredentials(null);
              }}
            >
              {t(CAREER.form.submitAnother)}
            </Button>
          </div>
          <p className="mt-6 text-xs text-ink-400">{t(CAREER.disclaimer)}</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-ink-100 bg-white p-6 sm:p-10 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-ink-900">{t(CAREER.form.title)}</h2>
              <p className="mt-2 text-sm text-ink-500">{t(CAREER.form.sub)}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-xl border border-ink-100 flex items-center justify-center text-ink-500 hover:bg-brand-50 hover:border-brand-200 transition-colors"
              aria-label={t({ en: "Close", bn: "বন্ধ করুন" })}
            >
              <Icon name="x" className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={onSubmit} noValidate className="mt-8">
            <div className="grid sm:grid-cols-2 gap-5">
              <CField label={t(CAREER.form.fullName)} required error={errors.name}>
                <input type="text" className={cn(careerInputCls, errors.name && "border-red-400")} placeholder={t(CAREER.form.namePh)} value={form.name} onChange={set("name")} autoComplete="name" />
              </CField>
              <CField label={t(CAREER.form.mobile)} required error={errors.mobile}>
                <input type="tel" className={cn(careerInputCls, errors.mobile && "border-red-400")} placeholder={t(CAREER.form.mobilePh)} value={form.mobile} onChange={set("mobile")} autoComplete="tel" />
              </CField>
              <CField label={t(CAREER.form.email)} required error={errors.email}>
                <input type="email" className={cn(careerInputCls, errors.email && "border-red-400")} placeholder={t(CAREER.form.emailPh)} value={form.email} onChange={set("email")} autoComplete="email" />
              </CField>
              <CField label={t(CAREER.form.address)}>
                <input type="text" className={careerInputCls} placeholder={t(CAREER.form.addressPh)} value={form.address} onChange={set("address")} />
              </CField>
              <CField label={t(CAREER.form.language)}>
                <select className={cn(careerInputCls, "appearance-none")} value={form.language} onChange={set("language")}>
                  <option value="">{t({ en: "Select language", bn: "ভাষা নির্বাচন করুন" })}</option>
                  {CAREER.form.languages.map((l, i) => (
                    <option key={i} value={l.en}>{t(l)}</option>
                  ))}
                </select>
              </CField>
              <div className="sm:col-span-2">
                <CField label={t(CAREER.form.joinAs)} required error={errors.opportunity}>
                  <select className={cn(careerInputCls, "appearance-none", errors.opportunity && "border-red-400")} value={form.opportunity} onChange={set("opportunity")}>
                    <option value="">{t(CAREER.form.selectOpportunity)}</option>
                    {CAREER.opportunities.map((o) => (
                      <option key={o.id} value={o.id}>{t(o.title)}</option>
                    ))}
                  </select>
                </CField>
              </div>
              <CField label={t(CAREER.form.experience)}>
                <select className={cn(careerInputCls, "appearance-none")} value={form.experience} onChange={set("experience")}>
                  <option value="">{t(CAREER.form.selectExperience)}</option>
                  {CAREER.form.experienceOptions.map((x, i) => (
                    <option key={i} value={x.en}>{t(x)}</option>
                  ))}
                </select>
              </CField>
              <CField label={t(CAREER.form.skills)}>
                <input type="text" className={careerInputCls} placeholder={t(CAREER.form.skillsPh)} value={form.skills} onChange={set("skills")} />
              </CField>
              <div className="sm:col-span-2">
                <CField label={t(CAREER.form.social)} error={errors.social}>
                  <input type="text" className={cn(careerInputCls, errors.social && "border-red-400")} placeholder={t(CAREER.form.socialPh)} value={form.social} onChange={set("social")} />
                </CField>
              </div>
              <div className="sm:col-span-2">
                <CField label={t(CAREER.form.why)} required error={errors.why}>
                  <textarea rows={4} className={cn(careerInputCls, "resize-none", errors.why && "border-red-400")} placeholder={t(CAREER.form.whyPh)} value={form.why} onChange={set("why")} />
                </CField>
              </div>
              <CField label={t(CAREER.form.hear)}>
                <input type="text" className={careerInputCls} placeholder={t(CAREER.form.hearPh)} value={form.hear} onChange={set("hear")} />
              </CField>
              <CField label={t(CAREER.form.additional)}>
                <input type="text" className={careerInputCls} placeholder={t(CAREER.form.additionalPh)} value={form.additional} onChange={set("additional")} />
              </CField>
            </div>

            <div className="mt-8">
              <Button type="submit" size="lg" className="w-full sm:w-auto">
                {busy ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                ) : (
                  <>
                    {t(BTN.submitApplication)}
                    <Icon name="send" className="w-4.5 h-4.5" />
                  </>
                )}
              </Button>
              <p className="mt-3.5 text-xs text-ink-400">
                {applyAs ? `${t(CAREER.form.applyFor)} ${t(applyAs.title)}` : ""}{" "}
                {t({ en: "We only collect information needed to review your application — it is never shared with third parties.", bn: "আবেদন যাচাইয়ের জন্য প্রয়োজনীয় তথ্যই সংগ্রহ করা হয় — এটি কখনো তৃতীয় পক্ষের সাথে শেয়ার করা হয় না।" })}
              </p>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function CField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-ink-800 mb-1.5">
        {label} {required && <span className="text-brand-600">*</span>}
      </span>
      {children}
      {error && (
        <span className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
          <Icon name="badge" className="w-3.5 h-3.5 shrink-0" /> {error}
        </span>
      )}
    </label>
  );
}
