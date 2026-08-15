import { useState } from "react";
import { Icon } from "../components/Icons";
import { Button, SectionHeading, Reveal, PageHero, Breadcrumbs } from "../components/ui";
import { usePageMeta } from "../components/Layout";
import { useI18n } from "../lib/i18n";
import { CONTACT, CONTACT_FORM, CONTACT_INFO, PAGE_HEROS, BTN } from "../lib/content";
import { cn } from "../utils/cn";

type FormState = {
  name: string;
  phone: string;
  email: string;
  service: string;
  budget: string;
  message: string;
};

const initialForm: FormState = {
  name: "",
  phone: "",
  email: "",
  service: "",
  budget: "",
  message: "",
};

const inputCls =
  "w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-[15px] text-ink-900 placeholder:text-ink-300 outline-none transition-all focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10";

export default function Contact() {
  const { t } = useI18n();
  usePageMeta(
    t({ en: "Contact Us — Get a Free Quote", bn: "যোগাযোগ করুন — ফ্রি কোটেশন নিন" }),
    t({ en: "Contact AL-KHUBAIB IT for web development, software, online services and more. Call +880 9638 238 576 or +880 1926 100 643, email contact@alkhubaibit.com, or send a quote request.", bn: "ওয়েব ডেভেলপমেন্ট, সফটওয়্যার, অনলাইন সার্ভিসসহ সব প্রয়োজনে AL-KHUBAIB IT-এর সাথে যোগাযোগ করুন। কল করুন +880 9638 238 576 বা +880 1926 100 643, ইমেইল করুন contact@alkhubaibit.com, অথবা কোটেশন অনুরোধ পাঠান।" })
  );
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  const set = (key: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validate = () => {
    const er: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim() || form.name.trim().length < 2) er.name = t(CONTACT_FORM.errName);
    if (!/^[+0-9][0-9\s\-()]{7,16}$/.test(form.phone.trim())) er.phone = t(CONTACT_FORM.errPhone);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) er.email = t(CONTACT_FORM.errEmail);
    if (!form.service) er.service = t(CONTACT_FORM.errService);
    if (!form.message.trim() || form.message.trim().length < 10) er.message = t(CONTACT_FORM.errMessage);
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const infoCards = [
    {
      icon: "phone",
      title: t(CONTACT_INFO.callTitle),
      lines: [CONTACT.phonePrimary, CONTACT.phoneSecondary],
      hrefs: [CONTACT.phonePrimaryHref, CONTACT.phoneSecondaryHref],
    },
    {
      icon: "mail",
      title: t(CONTACT_INFO.emailTitle),
      lines: [CONTACT.email, CONTACT.emailSupport],
      hrefs: [`mailto:${CONTACT.email}`, `mailto:${CONTACT.emailSupport}`],
    },
    {
      icon: "whatsapp",
      title: t(CONTACT_INFO.waTitle),
      lines: [t(CONTACT_INFO.waLine1), t(CONTACT_INFO.waLine2)],
      hrefs: [
        `https://wa.me/8801926100643?text=${encodeURIComponent(t({ en: "Assalamu Alaikum, I have a question.", bn: "আসসালামু আলাইকুম, আমার একটি প্রশ্ন আছে।" }))}`,
        `https://wa.me/8801926100643`,
      ],
      external: true,
    },
  ];

  return (
    <>
      <PageHero eyebrow={t(PAGE_HEROS.contact.eyebrow)} title={t(PAGE_HEROS.contact.title)} subtitle={t(PAGE_HEROS.contact.subtitle)}>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button href={CONTACT.phonePrimaryHref} variant="outline-light" size="lg">
            <Icon name="phone" className="w-4.5 h-4.5" />
            {CONTACT.phonePrimary}
          </Button>
          <Button href={`https://wa.me/8801926100643`} variant="whatsapp" size="lg">
            <Icon name="whatsapp" className="w-5 h-5" />
            WhatsApp
          </Button>
        </div>
      </PageHero>

      <section className="container-x py-14 sm:py-20">
        <Breadcrumbs items={[{ label: t({ en: "Contact", bn: "যোগাযোগ" }) }]} />

        <div className="grid lg:grid-cols-[1fr_1.5fr] gap-10">
          {/* Contact info */}
          <div>
            <SectionHeading align="left" eyebrow={t(CONTACT_INFO.heading)} title={t(CONTACT_INFO.sub)} subtitle={t(CONTACT_INFO.sub2)} />
            <div className="mt-8 space-y-4">
              {infoCards.map((c) => (
                <Reveal key={c.title}>
                  <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-soft hover:shadow-card transition-shadow">
                    <div className="flex items-center gap-4">
                      <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 text-white flex items-center justify-center shadow-lg shadow-brand-600/25 shrink-0">
                        <Icon name={c.icon as never} className="w-5.5 h-5.5" />
                      </span>
                      <h3 className="font-display font-bold text-lg text-ink-900">{c.title}</h3>
                    </div>
                    <div className="mt-4 space-y-1.5">
                      {c.lines.map((l, i) => (
                        <a
                          key={l + i}
                          href={c.hrefs[i]}
                          target={c.external ? "_blank" : undefined}
                          rel={c.external ? "noopener noreferrer" : undefined}
                          className="block text-[15px] font-medium text-ink-600 hover:text-brand-600 transition-colors break-all"
                        >
                          {l}
                        </a>
                      ))}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={2}>
              <div className="mt-6 rounded-2xl bg-gradient-to-br from-brand-700 to-brand-500 p-6 text-white shadow-xl shadow-brand-600/25">
                <h3 className="font-display font-bold text-lg">{t(CONTACT_INFO.meetTitle)}</h3>
                <p className="mt-2 text-sm text-brand-100/90 leading-relaxed">{t(CONTACT_INFO.meetDesc)}</p>
                <Button
                  to="/appointment"
                  size="sm"
                  className="mt-4 bg-white text-brand-700 from-white via-white to-white hover:bg-brand-50"
                >
                  <Icon name="clock" className="w-4 h-4" />
                  {t(BTN.scheduleMeetingBtn)}
                </Button>
              </div>
            </Reveal>
          </div>

          {/* Form */}
          <Reveal delay={1}>
            <div className="rounded-3xl border border-ink-100 bg-white p-6 sm:p-9 shadow-card">
              {submitted ? (
                <div className="py-10 text-center animate-fade-in">
                  <span className="mx-auto flex w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 items-center justify-center">
                    <Icon name="check" className="w-8 h-8" strokeWidth={2.5} />
                  </span>
                  <h2 className="mt-5 font-display font-bold text-2xl text-ink-900">
                    {t(CONTACT_FORM.successTitle)} {form.name.split(" ")[0]}!
                  </h2>
                  <p className="mt-3 text-ink-500 leading-relaxed max-w-md mx-auto">
                    {t(CONTACT_FORM.successBody)}{" "}
                    {t({ en: "We will reach you at", bn: "আমরা যোগাযোগ করব —" })}{" "}
                    <strong className="text-ink-800">{form.phone}</strong>{" "}
                    {t({ en: "or", bn: "অথবা" })}{" "}
                    <strong className="text-ink-800">{form.email}</strong>.
                  </p>
                  <div className="mt-7 flex flex-col sm:flex-row justify-center gap-3">
                    <Button
                      href={`https://wa.me/8801926100643?text=${encodeURIComponent(
                        t({
                          en: `Assalamu Alaikum, my name is ${form.name || "…"}. I need: ${form.service || "a digital service"}. Budget: ${form.budget || "to discuss"}. Details: ${form.message || "…"}`,
                          bn: `আসসালামু আলাইকুম, আমার নাম ${form.name || "…"}। আমার প্রয়োজন: ${form.service || "একটি ডিজিটাল সার্ভিস"}। বাজেট: ${form.budget || "আলোচনা সাপেক্ষ"}। বিস্তারিত: ${form.message || "…"}`,
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
                        setForm(initialForm);
                        setSubmitted(false);
                      }}
                    >
                      {t(BTN.sendAnother)}
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={onSubmit} noValidate>
                  <h2 className="font-display font-bold text-2xl text-ink-900">{t(CONTACT_FORM.title)}</h2>
                  <p className="mt-2 text-sm text-ink-500">{t(CONTACT_FORM.sub)}</p>

                  <div className="mt-7 grid sm:grid-cols-2 gap-5">
                    <Field label={t(CONTACT_FORM.name)} required error={errors.name}>
                      <input type="text" className={cn(inputCls, errors.name && "border-red-400")} placeholder={t(CONTACT_FORM.namePh)} value={form.name} onChange={set("name")} autoComplete="name" />
                    </Field>
                    <Field label={t(CONTACT_FORM.phone)} required error={errors.phone}>
                      <input type="tel" className={cn(inputCls, errors.phone && "border-red-400")} placeholder={t(CONTACT_FORM.phonePh)} value={form.phone} onChange={set("phone")} autoComplete="tel" />
                    </Field>
                    <Field label={t(CONTACT_FORM.email)} required error={errors.email}>
                      <input type="email" className={cn(inputCls, errors.email && "border-red-400")} placeholder={t(CONTACT_FORM.emailPh)} value={form.email} onChange={set("email")} autoComplete="email" />
                    </Field>
                    <Field label={t(CONTACT_FORM.budget)}>
                      <select className={cn(inputCls, "appearance-none")} value={form.budget} onChange={set("budget")}>
                        <option value="">{t(CONTACT_FORM.budgetPh)}</option>
                        {CONTACT_FORM.budgets.map((b, i) => (
                          <option key={i} value={b.en}>{t(b)}</option>
                        ))}
                      </select>
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label={t(CONTACT_FORM.service)} required error={errors.service}>
                        <select className={cn(inputCls, "appearance-none")} value={form.service} onChange={set("service")}>
                          <option value="">{t(CONTACT_FORM.servicePh)}</option>
                          {CONTACT_FORM.services.map((s, i) => (
                            <option key={i} value={s.en}>{t(s)}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    <div className="sm:col-span-2">
                      <Field label={t(CONTACT_FORM.details)} required error={errors.message}>
                        <textarea
                          rows={5}
                          className={cn(inputCls, "resize-none", errors.message && "border-red-400")}
                          placeholder={t(CONTACT_FORM.detailsPh)}
                          value={form.message}
                          onChange={set("message")}
                        />
                      </Field>
                    </div>
                  </div>

                  <div className="mt-7">
                    <Button type="submit" size="lg" className="w-full sm:w-auto">
                      {t(BTN.submitRequest)}
                      <Icon name="send" className="w-4.5 h-4.5" />
                    </Button>
                    <p className="mt-3.5 text-xs text-ink-400">{t(CONTACT_FORM.agree)}</p>
                  </div>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function Field({
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
