import { Icon } from "../components/Icons";
import { Button, SectionHeading, Reveal, CheckItem, IconTile, PageHero, Breadcrumbs } from "../components/ui";
import { CtaSection, usePageMeta } from "../components/Layout";
import { useI18n } from "../lib/i18n";
import { ServiceCard } from "./Home";
import {
  SERVICE_CATEGORIES,
  getCategory,
  EDUCATION_FEATURES,
  CITIZEN_SERVICES,
  GRAPHIC_SERVICES,
  MARKETING_SERVICES,
  PRODUCTS,
  BTN,
  HERO,
} from "../lib/content";

/* ─────────────────────── shared layout ────────────────────── */

function SimpleServiceDetail({ slug, extra }: { slug: string; extra?: React.ReactNode }) {
  const { t } = useI18n();
  const cat = getCategory(slug);
  if (!cat) return null;
  const related = SERVICE_CATEGORIES.filter((c) => c.slug !== slug).slice(0, 4);
  return (
    <>
      <PageHero eyebrow={t(cat.tagline)} title={t(cat.name)} subtitle={t(cat.description)}>
        <div className="mt-7 flex flex-col sm:flex-row gap-3.5">
          <Button to="/contact" size="lg">
            {t(BTN.startProject)} <Icon name="arrow" className="w-4.5 h-4.5" />
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3.5 mt-10">
          {cat.items.map((it, i) => (
            <CheckItem key={i} className="rounded-xl border border-ink-100 bg-white p-4 shadow-soft">
              {t(it)}
            </CheckItem>
          ))}
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

/* ────────────────────── Education page ────────────────────── */

export function EducationPage() {
  const { t } = useI18n();
  usePageMeta(
    t({ en: "Smart Education Management Solution — Infoedu", bn: "স্মার্ট এডুকেশন ম্যানেজমেন্ট সল্যুশন — Infoedu" }),
    t({ en: "Complete digital platform for educational institutions: student, teacher, class & subject management, attendance, examinations, result publishing, fee management, online result portal and admin dashboard.", bn: "শিক্ষাপ্রতিষ্ঠানের জন্য সম্পূর্ণ ডিজিটাল প্ল্যাটফর্ম: শিক্ষার্থী, শিক্ষক, ক্লাস ও বিষয় ম্যানেজমেন্ট, উপস্থিতি, পরীক্ষা, রেজাল্ট প্রকাশ, ফি ম্যানেজমেন্ট, অনলাইন রেজাল্ট পোর্টাল ও অ্যাডমিন ড্যাশবোর্ড।" })
  );
  return (
    <SimpleServiceDetail
      slug="education-management"
      extra={
        <>
          <section className="mt-16">
            <SectionHeading
              align="left"
              eyebrow={t({ en: "Complete Platform", bn: "সম্পূর্ণ প্ল্যাটফর্ম" })}
              title={t({ en: "A Complete Digital Solution for Educational Institutions", bn: "শিক্ষাপ্রতিষ্ঠানের জন্য সম্পূর্ণ ডিজিটাল সল্যুশন" })}
              subtitle={t({ en: "Infoedu enables the digital and easy management of all activities of educational institutions — helping them develop in a modern and timely manner.", bn: "Infoedu শিক্ষাপ্রতিষ্ঠানের সব কার্যক্রম ডিজিটাল ও সহজে পরিচালনা করতে সাহায্য করে — প্রতিষ্ঠানকে আধুনিক ও সময়োপযোগীভাবে এগিয়ে নেয়।" })}
            />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {EDUCATION_FEATURES.map((f, i) => (
                <Reveal key={i} delay={(i % 3) as 0 | 1 | 2}>
                  <div className="group h-full rounded-2xl border border-ink-100 bg-white p-6 shadow-soft transition-all duration-300 hover:shadow-card hover:-translate-y-1 hover:border-brand-200">
                    <span className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 group-hover:bg-gradient-to-br group-hover:from-brand-600 group-hover:to-brand-500 group-hover:text-white transition-all flex items-center justify-center">
                      <Icon name={f.icon as never} className="w-5 h-5" />
                    </span>
                    <h3 className="mt-4 font-display font-bold text-base text-ink-900">{t(f.title)}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{t(f.desc)}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          <section className="mt-16 rounded-3xl bg-ink-950 relative overflow-hidden p-8 sm:p-12 text-white">
            <div className="absolute inset-0 bg-grid" aria-hidden="true" />
            <div className="absolute -top-20 right-20 w-64 h-64 rounded-full bg-brand-600/35 blur-[100px]" aria-hidden="true" />
            <div className="relative grid lg:grid-cols-[1.2fr_1fr] gap-10 items-center">
              <div>
                <SectionHeading
                  align="left"
                  dark
                  eyebrow={t({ en: "Ready-Made Platforms", bn: "রেডিমেড প্ল্যাটফর্ম" })}
                  title={t({ en: "Deployment-Ready Education Software", bn: "ডিপ্লয়মেন্ট-রেডি এডুকেশন সফটওয়্যার" })}
                  subtitle={t({ en: "Choose a ready-made, professionally built education solution and launch faster — optimized for quick deployment and smooth performance.", bn: "রেডিমেড, প্রফেশনালি নির্মিত এডুকেশন সল্যুশন বেছে নিন এবং দ্রুত লঞ্চ করুন — দ্রুত ডিপ্লয়মেন্ট ও স্মুথ পারফরম্যান্সের জন্য অপটিমাইজড।" })}
                />
                <div className="mt-7 flex flex-col sm:flex-row gap-3.5">
                  <Button to="/products" className="bg-white text-brand-700 from-white via-white to-white hover:bg-brand-50">
                    {t(BTN.viewEducationProducts)} <Icon name="arrow" className="w-4.5 h-4.5" />
                  </Button>
                  <Button to="/appointment" variant="whatsapp">
                    <Icon name="clock" className="w-4.5 h-4.5" /> {t(BTN.scheduleDemo)}
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                {PRODUCTS.slice(0, 3).map((p) => (
                  <div key={p.slug} className="flex items-center gap-4 rounded-xl bg-white/6 border border-white/10 p-4">
                    <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center text-white shrink-0">
                      <Icon name={p.icon as never} className="w-5 h-5" />
                    </span>
                    <div>
                      <p className="font-semibold text-white text-[15px]">{t(p.name)}</p>
                      <p className="text-xs text-ink-200">{t(p.type)}</p>
                    </div>
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

/* ──────────────────── Online services page ────────────────── */

export function OnlineServicesPage() {
  const { t } = useI18n();
  usePageMeta(
    t({ en: "Online Services — Content Writing, Data Entry & Composition", bn: "অনলাইন সার্ভিস — কনটেন্ট রাইটিং, ডেটা এন্ট্রি ও কম্পোজ" }),
    t({ en: "Professional online services: content writing (CopyScape-checked), Bangla/English/Arabic computer composition, data entry, online form submission, application support and digital documentation.", bn: "প্রফেশনাল অনলাইন সার্ভিস: কনটেন্ট রাইটিং (CopyScape যাচাইকৃত), বাংলা/ইংরেজি/আরবি কম্পিউটার কম্পোজ, ডেটা এন্ট্রি, অনলাইন ফর্ম সাবমিশন, আবেদন সহায়তা ও ডিজিটাল ডকুমেন্টেশন।" })
  );
  const cards = [
    { icon: "pen", title: t({ en: "Content Writing", bn: "কনটেন্ট রাইটিং" }), desc: t({ en: "Readable, native-toned content — every piece checked through paid plagiarism software (CopyScape) so your content is safe to publish. With 5+ years of experience in the field.", bn: "পড়তে আরামদায়ক, স্বাভাবিক ভাষার কনটেন্ট — প্রতিটি লেখা পেইড প্লেজিয়ারিজম চেকার (CopyScape) দিয়ে যাচাই করা হয়, তাই নিরাপদে প্রকাশ করা যায়। ক্ষেত্রে ৫+ বছরের অভিজ্ঞতা।" }) },
    { icon: "doc", title: t({ en: "Computer Composition", bn: "কম্পিউটার কম্পোজ" }), desc: t({ en: "Accurate Bangla, English and Arabic computer composition for books, documents, forms and digital publications.", bn: "বই, ডকুমেন্ট, ফর্ম ও ডিজিটাল প্রকাশনার জন্য নিখুঁত বাংলা, ইংরেজি ও আরবি কম্পিউটার কম্পোজ।" }) },
    { icon: "folder", title: t({ en: "Data Entry & Documentation", bn: "ডেটা এন্ট্রি ও ডকুমেন্টেশন" }), desc: t({ en: "Clean, organized data entry and complete digital documentation support for businesses and organizations.", bn: "ব্যবসা ও প্রতিষ্ঠানের জন্য পরিচ্ছন্ন, সুসংগঠিত ডেটা এন্ট্রি ও সম্পূর্ণ ডিজিটাল ডকুমেন্টেশন সাপোর্ট।" }) },
    { icon: "send", title: t({ en: "Form & Application Support", bn: "ফর্ম ও আবেদন সহায়তা" }), desc: t({ en: "Careful online form submission and application support — done correctly the first time.", bn: "যত্নসহকারে অনলাইন ফর্ম সাবমিশন ও আবেদন সহায়তা — প্রথমবারেই সঠিকভাবে সম্পন্ন।" }) },
  ];
  return (
    <SimpleServiceDetail
      slug="online-services"
      extra={
        <section className="mt-16 grid md:grid-cols-2 gap-6">
          {cards.map((c, i) => (
            <Reveal key={i} delay={(i % 2) as 0 | 1}>
              <div className="h-full rounded-2xl border border-ink-100 bg-white p-7 shadow-soft hover:shadow-card transition-all">
                <IconTile name={c.icon as never} />
                <h3 className="mt-4 font-display font-bold text-xl text-ink-900">{c.title}</h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-ink-500">{c.desc}</p>
              </div>
            </Reveal>
          ))}
        </section>
      }
    />
  );
}

/* ───────────────────── Citizen services page ──────────────── */

export function CitizenPage() {
  const { t } = useI18n();
  usePageMeta(
    t({ en: "Citizen Services Assistance — NID, E-Passport & Birth Registration", bn: "সিটিজেন সার্ভিস সহায়তা — NID, ই-পাসপোর্ট ও জন্মনিবন্ধন" }),
    t({ en: "Professional assistance for National ID (NID), e-passport and birth registration applications and corrections in Bangladesh. Support services only — AL-KHUBAIB IT is not a government authority.", bn: "বাংলাদেশে জাতীয় পরিচয়পত্র (NID), ই-পাসপোর্ট ও জন্মনিবন্ধন আবেদন ও সংশোধনে প্রফেশনাল সহায়তা। শুধুমাত্র সাপোর্ট সার্ভিস — AL-KHUBAIB IT কোনো সরকারি কর্তৃপক্ষ নয়।" })
  );
  return (
    <SimpleServiceDetail
      slug="citizen-services"
      extra={
        <>
          <section className="mt-16 rounded-3xl bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 relative overflow-hidden p-8 sm:p-12 text-white">
            <div className="absolute inset-0 bg-grid" aria-hidden="true" />
            <div className="relative max-w-3xl">
              <SectionHeading
                align="left"
                dark
                eyebrow={t({ en: "Important Note", bn: "গুরুত্বপূর্ণ নোট" })}
                title={t({ en: "Support Services — Not a Government Authority", bn: "সাপোর্ট সার্ভিস — আমরা সরকারি কর্তৃপক্ষ নই" })}
                subtitle={t({ en: "AL-KHUBAIB IT provides professional assistance to help individuals prepare, complete and submit their applications correctly. We are a private IT company and are not affiliated with any government office.", bn: "AL-KHUBAIB IT ব্যক্তিদের আবেদন সঠিকভাবে প্রস্তুত, সম্পন্ন ও জমা দিতে প্রফেশনাল সহায়তা প্রদান করে। আমরা একটি বেসরকারি আইটি কোম্পানি এবং কোনো সরকারি অফিসের সাথে সংশ্লিষ্ট নই।" })}
              />
              <div className="mt-7 flex flex-col sm:flex-row gap-3.5">
                <Button
                  href={`https://wa.me/8801926100643?text=${encodeURIComponent(t({ en: "Assalamu Alaikum, I need citizen service assistance.", bn: "আসসালামু আলাইকুম, আমার সিটিজেন সার্ভিস সহায়তা প্রয়োজন।" }))}`}
                  variant="whatsapp"
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  <Icon name="whatsapp" className="w-4.5 h-4.5" /> {t({ en: "Ask About My Application", bn: "আমার আবেদন নিয়ে জিজ্ঞাসা করুন" })}
                </Button>
                <Button to="/contact" variant="outline-light">
                  {t(BTN.contactUs)}
                </Button>
              </div>
            </div>
          </section>
          <section className="mt-10 grid gap-4 sm:grid-cols-2">
            {CITIZEN_SERVICES.map((s, i) => (
              <Reveal key={i} delay={(i % 2) as 0 | 1}>
                <div className="flex items-center gap-4 rounded-2xl border border-ink-100 bg-white p-5 shadow-soft hover:border-brand-200 hover:shadow-card transition-all">
                  <span className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                    <Icon name={i < 2 ? "idcard" : i < 4 ? "doc" : "badge"} className="w-5 h-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-ink-900">{t(s)}</p>
                    <p className="text-[13px] text-ink-400 mt-0.5">
                      {t({ en: "Application & documentation support", bn: "আবেদন ও ডকুমেন্টেশন সহায়তা" })}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </section>
        </>
      }
    />
  );
}

/* ───────────────────── Graphic design page ────────────────── */

export function GraphicPage() {
  const { t } = useI18n();
  usePageMeta(
    t({ en: "Creative Graphic Design — Logos, Banners & Brand Identity", bn: "ক্রিয়েটিভ গ্রাফিক ডিজাইন — লোগো, ব্যানার ও ব্র্যান্ড আইডেন্টিটি" }),
    t({ en: "Professional graphic design services: logo design, business cards, ID cards, posters, banners, social media design, brochures, certificates, letterheads and notebook/diary design.", bn: "প্রফেশনাল গ্রাফিক ডিজাইন সার্ভিস: লোগো, বিজনেস কার্ড, আইডি কার্ড, পোস্টার, ব্যানার, সোশ্যাল মিডিয়া ডিজাইন, ব্রোশিওর, সার্টিফিকেট, লেটারহেড ও নোটবুক/ডায়েরি ডিজাইন।" })
  );
  const visualCards = [
    { icon: "sparkle", title: t({ en: "Logo Design", bn: "লোগো ডিজাইন" }), grad: "from-brand-700 to-brand-500", size: "lg" },
    { icon: "card", title: t({ en: "Business Card", bn: "বিজনেস কার্ড" }), grad: "from-brand-600 to-brand-400", size: "sm" },
    { icon: "idcard", title: t({ en: "ID Card", bn: "আইডি কার্ড" }), grad: "from-ink-800 to-ink-600", size: "sm" },
    { icon: "palette", title: t({ en: "Poster", bn: "পোস্টার" }), grad: "from-brand-500 to-brand-300", size: "sm" },
    { icon: "megaphone", title: t({ en: "Banner", bn: "ব্যানার" }), grad: "from-brand-800 to-brand-600", size: "sm" },
    { icon: "users", title: t({ en: "Social Media", bn: "সোশ্যাল মিডিয়া" }), grad: "from-brand-600 to-brand-400", size: "sm" },
    { icon: "doc", title: t({ en: "Brochure", bn: "ব্রোশিওর" }), grad: "from-ink-700 to-ink-500", size: "sm" },
    { icon: "award", title: t({ en: "Certificate", bn: "সার্টিফিকেট" }), grad: "from-brand-700 to-brand-400", size: "sm" },
    { icon: "mail", title: t({ en: "Letterhead", bn: "লেটারহেড" }), grad: "from-brand-600 to-brand-500", size: "sm" },
    { icon: "book", title: t({ en: "Notebook / Diary", bn: "নোটবুক / ডায়েরি" }), grad: "from-brand-800 to-brand-500", size: "lg" },
  ];
  return (
    <SimpleServiceDetail
      slug="graphic-design"
      extra={
        <section className="mt-16">
          <SectionHeading
            align="left"
            eyebrow={t({ en: "Portfolio Style", bn: "পোর্টফোলিও স্টাইল" })}
            title={t({ en: "Designs That Define Your Brand — All in One Place", bn: "ডিজাইন যা আপনার ব্র্যান্ডকে সংজ্ঞায়িত করে — সব এক জায়গায়" })}
            subtitle={t({ en: "From logos to notebooks, diaries, ID cards, posters and banners — unique, professional and impactful visuals crafted just for you.", bn: "লোগো থেকে নোটবুক, ডায়েরি, আইডি কার্ড, পোস্টার ও ব্যানার — আপনার জন্য তৈরি অনন্য, প্রফেশনাল ও প্রভাবশালী ভিজ্যুয়াল।" })}
          />
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            {visualCards.map((v, i) => (
              <Reveal key={i} delay={(i % 4) as 0 | 1 | 2 | 3} className={v.size === "lg" ? "col-span-2 md:col-span-2" : ""}>
                <div className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${v.grad} p-6 h-full min-h-36 flex flex-col justify-between text-white shadow-soft hover:shadow-card hover:-translate-y-1 transition-all`}>
                  <div className="absolute inset-0 bg-grid opacity-60" aria-hidden="true" />
                  <span className="relative w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
                    <Icon name={v.icon as never} className="w-5 h-5" />
                  </span>
                  <div className="relative mt-auto">
                    <p className="font-display font-bold text-[15px] sm:text-base">{v.title}</p>
                    <p className="text-[11px] text-white/70">
                      {t({ en: "Brand & print design", bn: "ব্র্যান্ড ও প্রিন্ট ডিজাইন" })}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-sm text-ink-400">
            {t({ en: "Need a full brand identity? We cover", bn: "সম্পূর্ণ ব্র্যান্ড আইডেন্টিটি প্রয়োজন? আমাদের রয়েছে" })}{" "}
            {GRAPHIC_SERVICES.length}{" "}
            {t({ en: "design services — chat with our design team.", bn: "টি ডিজাইন সার্ভিস — আমাদের ডিজাইন টিমের সাথে চ্যাট করুন।" })}{" "}
            <a
              href={`https://wa.me/8801926100643?text=${encodeURIComponent(t({ en: "Assalamu Alaikum, I need graphic design services.", bn: "আসসালামু আলাইকুম, আমার গ্রাফিক ডিজাইন সার্ভিস প্রয়োজন।" }))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 font-semibold hover:text-brand-700"
            >
              WhatsApp
            </a>
          </p>
        </section>
      }
    />
  );
}

/* ─────────────────── Digital marketing page ───────────────── */

export function MarketingPage() {
  const { t } = useI18n();
  usePageMeta(
    t({ en: "Digital Marketing & SEO Services in Bangladesh", bn: "বাংলাদেশে ডিজিটাল মার্কেটিং ও SEO সার্ভিস" }),
    t({ en: "SEO (paid & organic), social media marketing, content marketing, website optimization and Google Business Profile support — digital marketing that builds your online presence.", bn: "SEO (পেইড ও অর্গানিক), সোশ্যাল মিডিয়া মার্কেটিং, কনটেন্ট মার্কেটিং, ওয়েবসাইট অপটিমাইজেশন ও Google Business Profile সাপোর্ট — ডিজিটাল মার্কেটিং যা আপনার অনলাইন উপস্থিতি গড়ে তোলে।" })
  );
  return (
    <SimpleServiceDetail
      slug="digital-marketing"
      extra={
        <section className="mt-16 rounded-3xl border border-ink-100 bg-white p-8 sm:p-12 shadow-soft">
          <div className="grid lg:grid-cols-[1.3fr_1fr] gap-10">
            <div>
              <SectionHeading
                align="left"
                eyebrow={t({ en: "SEO Focus", bn: "SEO ফোকাস" })}
                title={t({ en: "Digital Marketing That Builds Your Online Presence", bn: "ডিজিটাল মার্কেটিং যা আপনার অনলাইন উপস্থিতি গড়ে তোলে" })}
                subtitle={t({ en: "Web-based marketing is what you want your website or product to convey to more people. We offer two approaches: paid SEO and organic SEO, both aiming to help you rank on the first page of Google.", bn: "ওয়েব-ভিত্তিক মার্কেটিং মানে আপনার ওয়েবসাইট বা প্রোডাক্টকে বেশি মানুষের কাছে পৌঁছে দেওয়া। আমরা দুটি পদ্ধতি অফার করি: পেইড SEO ও অর্গানিক SEO — উভয়ের লক্ষ্য Google-এর প্রথম পেজে আপনার অবস্থান নিশ্চিত করা।" })}
              />
              <ul className="mt-7 grid sm:grid-cols-2 gap-x-8 gap-y-3.5">
                {MARKETING_SERVICES.map((s, i) => (
                  <CheckItem key={i}>{t(s)}</CheckItem>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-brand-50/70 border border-brand-100 p-7">
              <Icon name="chart" className="w-9 h-9 text-brand-600" />
              <h3 className="mt-4 font-display font-bold text-xl text-ink-900">
                {t({ en: "Why Search Visibility Matters", bn: "সার্চ ভিজিবিলিটি কেন গুরুত্বপূর্ণ" })}
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-ink-600">
                {[
                  t({ en: "More people find your website or product.", bn: "আরও বেশি মানুষ আপনার ওয়েবসাইট বা প্রোডাক্ট খুঁজে পাবে।" }),
                  t({ en: "First-page presence builds long-term trust.", bn: "প্রথম পেজে উপস্থিতি দীর্ঘমেয়াদি আস্থা তৈরি করে।" }),
                  t({ en: "Organic growth reduces long-term ad dependency.", bn: "অর্গানিক গ্রোথ দীর্ঘমেয়াদে বিজ্ঞাপন-নির্ভরতা কমায়।" }),
                ].map((s, i) => (
                  <li key={i} className="flex gap-2.5">
                    <Icon name="check" className="w-4.5 h-4.5 text-brand-600 shrink-0 mt-0.5" strokeWidth={2.5} />
                    {s}
                  </li>
                ))}
              </ul>
              <Button to="/contact" className="mt-6 w-full">
                {t(BTN.growReach)} <Icon name="arrow" className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </section>
      }
    />
  );
}
