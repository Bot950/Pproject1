import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Icon } from "../components/Icons";
import { Button } from "../components/ui";
import { usePageMeta } from "../components/Layout";
import { useI18n } from "../lib/i18n";
import { useAuth, Require, affiliateApplication, affiliateProfile, affiliateKyc } from "../lib/auth";
import { submitKyc, requestWithdrawal, submitAffiliateApplication } from "../lib/affiliate";
import { all, money, fmtDateTime, useDbVersion, getSettings } from "../lib/db";
import { PT } from "../lib/portalText";
import { StatCard, StatusBadge, Field, inputCls, Bars } from "../components/portalUi";
import { PortalShell, EmptyState, DataTable, TimeRange, useToast } from "../lib/shell";
import { cn } from "../utils/cn";

/* ─────────────────────── Affiliate dashboard ───────────────── */

export default function AffiliateDashboard() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const tab = params.get("tab") || "overview";
  useDbVersion();
  usePageMeta(t({ en: "Affiliate Portal", bn: "এফিলিয়েট পোর্টাল" }));

  const prof = user ? affiliateProfile(user.id) : undefined;
  const kyc = user ? affiliateKyc(user.id) : undefined;

  // Server-style authorization: normal clients are denied the affiliate zone.
  if (user?.role === "client") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-ink-50/70 px-4">
        <div className="max-w-md w-full rounded-3xl bg-white p-10 text-center shadow-soft border border-ink-100">
          <span className="mx-auto w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
            <Icon name="lock" className="w-8 h-8" />
          </span>
          <h1 className="mt-5 font-display font-bold text-2xl text-ink-900">403</h1>
          <p className="mt-2 text-sm text-ink-500 leading-relaxed">
            {t({ en: "The Affiliate Portal is only available to users with an approved affiliate role. Interested? Apply from the Career page.", bn: "এফিলিয়েট পোর্টাল শুধুমাত্র অনুমোদিত এফিলিয়েট রোলের ইউজারদের জন্য। আগ্রহী? ক্যারিয়ার পেজ থেকে আবেদন করুন।" })}
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Link to="/career?section=apply" className="inline-flex items-center justify-center gap-2 font-semibold rounded-xl bg-gradient-to-r from-brand-700 to-brand-500 text-white px-6 py-3 hover:shadow-lg transition-all">
              <Icon name="send" className="w-4.5 h-4.5" /> {t({ en: "Apply for Affiliate Program", bn: "এফিলিয়েট প্রোগ্রামে আবেদন করুন" })}
            </Link>
            <Link to="/portal/dashboard" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
              {t({ en: "Back to my dashboard", bn: "আমার ড্যাশবোর্ডে ফিরে যান" })}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Require roles={["affiliate"]}>
      {!prof ? (
        <PortalShell>
          <NoApplication user={user!} />
        </PortalShell>
      ) : prof.status === "pending" || prof.status === "rejected" ? (
        <PortalShell active="affiliate">
          <PendingState />
        </PortalShell>
      ) : prof.status === "approved" && prof.kyc_status !== "verified" ? (
        <PortalShell active="kyc">
          <KycGate kyc={kyc} />
        </PortalShell>
      ) : prof.status === "suspended" ? (
        <PortalShell active="affiliate">
          <SuspendedState />
        </PortalShell>
      ) : (
        <PortalShell active={tab}>
          {tab === "overview" && <AffOverview prof={prof} />}
          {tab === "links" && <AffLinks prof={prof} />}
          {tab === "referrals" && <AffReferrals prof={prof} />}
          {tab === "commissions" && <AffCommissions prof={prof} />}
          {tab === "earnings" && <AffEarnings prof={prof} />}
          {tab === "withdrawals" && <AffWithdrawals prof={prof} />}
          {tab === "kyc" && <KycStatus kyc={kyc} prof={prof} />}
        </PortalShell>
      )}
    </Require>
  );
}

/* ── No application yet (client without affiliate profile) ── */
function NoApplication({ user }: { user: any }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const apply = async () => {
    setBusy(true);
    const r = await submitAffiliateApplication(
      { name: user.name, mobile: user.mobile, email: user.email, address: "", experience: "", skills: "", social: "", method: "Affiliate Partner", why: "I want to join the affiliate program.", password: "" },
      user.id
    );
    setBusy(false);
    if (!r.ok) {
      toast({ type: "error", title: r.error || "Error" });
      return;
    }
    setDone(true);
    toast({ type: "success", title: t({ en: "Application submitted", bn: "আবেদন জমা হয়েছে" }) });
  };

  return (
    <div className="max-w-xl mx-auto">
      <EmptyState
        icon="network"
        title={t({ en: "Become an Affiliate Partner", bn: "এফিলিয়েট পার্টনার হোন" })}
        desc={t({ en: "Use the same account to apply for the affiliate program — promote eligible services and earn commissions according to applicable terms.", bn: "একই অ্যাকাউন্টে এফিলিয়েট প্রোগ্রামে আবেদন করুন — অনুমোদিত সার্ভিস প্রচার করে প্রযোজ্য শর্ত অনুযায়ী কমিশন আয় করুন।" })}
        action={
          done ? (
            <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 text-emerald-700 px-5 py-2.5 text-sm font-bold border border-emerald-200">
              <Icon name="check" className="w-4 h-4" strokeWidth={3} /> {t({ en: "Under Review", bn: "যাচাই বাকি" })}
            </span>
          ) : (
            <Button onClick={apply}>
              {busy ? <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : t(BTN_APPLY)}
            </Button>
          )
        }
      />
    </div>
  );
}
const BTN_APPLY = { en: "Apply Now", bn: "আবেদন করুন" };

/* ── Pending application ── */
function PendingState() {
  const { t, lang } = useI18n();
  const { user, logout } = useAuth();
  const app = affiliateApplication(user!.id);
  return (
    <div className="max-w-xl mx-auto">
      <div className="rounded-3xl bg-white border border-ink-100 p-8 shadow-soft text-center">
        <span className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-500 text-white flex items-center justify-center shadow-lg shadow-brand-600/25">
          <Icon name="clock" className="w-7 h-7" />
        </span>
        <h2 className="mt-4 font-display font-bold text-2xl text-ink-900">{t(PT.applicationStatus)}</h2>
        <div className="mt-4 flex justify-center"><StatusBadge status={app?.status || "pending"} /></div>
        {app?.status === "rejected" ? (
          <p className="mt-4 text-sm text-ink-500">
            {t({ en: "Reason:", bn: "কারণ:" })} {app.reason || "—"}
          </p>
        ) : (
          <p className="mt-4 text-sm text-ink-500 max-w-sm mx-auto leading-relaxed">
            {t({ en: "Your application is being reviewed by our team. You will be notified when a decision is made.", bn: "আপনার আবেদন আমাদের টিম পর্যালোচনা করছে। সিদ্ধান্ত হলে আপনাকে জানানো হবে।" })}
          </p>
        )}
        <div className="mt-6 rounded-xl bg-ink-50 p-4 text-left text-sm space-y-2 text-ink-600">
          <p className="flex justify-between gap-4"><span>{t({ en: "Application Date", bn: "আবেদনের তারিখ" })}</span><span className="font-semibold">{fmtDateTime(app?.created_at || "", lang)}</span></p>
          <p className="flex justify-between gap-4"><span>{t({ en: "Current Status", bn: "বর্তমান স্ট্যাটাস" })}</span><span className="font-semibold">{app?.status || "pending"}</span></p>
          <p className="flex justify-between gap-4"><span>{t({ en: "Next Step", bn: "পরবর্তী ধাপ" })}</span><span className="font-semibold">{t({ en: "Admin review", bn: "অ্যাডমিন পর্যালোচনা" })}</span></p>
        </div>
        <Button onClick={logout} variant="secondary" className="mt-6">{t(PT.logout)}</Button>
      </div>
    </div>
  );
}

function SuspendedState() {
  const { t } = useI18n();
  const { logout } = useAuth();
  return (
    <div className="max-w-xl mx-auto rounded-3xl bg-white border border-red-200 p-8 text-center shadow-soft">
      <Icon name="shield" className="w-10 h-10 text-red-500 mx-auto" />
      <h2 className="mt-3 font-display font-bold text-xl text-ink-900">{t(PT.suspended)}</h2>
      <p className="mt-2 text-sm text-ink-500">{t({ en: "Your affiliate account is temporarily suspended. Contact support for details.", bn: "আপনার এফিলিয়েট অ্যাকাউন্ট সাময়িকভাবে বরখাস্ত করা হয়েছে। বিস্তারিত জানতে সাপোর্টে যোগাযোগ করুন।" })}</p>
      <Button onClick={logout} variant="secondary" className="mt-5">{t(PT.logout)}</Button>
    </div>
  );
}

/* ── KYC Gate / Wizard ── */
function KycGate({ kyc }: { kyc: any }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<any>({ full_name: user!.name, dob: "", address: "", nid: "", payment: "", profile_doc: null, nid_doc: null });

  const storeDoc = (key: string, file: File | null) => {
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      toast({ type: "warning", title: t({ en: "File too large (max 1.5MB)", bn: "ফাইল খুব বড় (সর্বোচ্চ ১.৫MB)" }) });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((f: any) => ({ ...f, [key]: { name: file.name, size: file.size, type: file.type, data: reader.result } }));
    reader.readAsDataURL(file);
  };

  const submit = () => {
    if (!form.full_name.trim() || !form.dob || !form.address.trim() || !form.nid.trim() || !form.payment.trim()) {
      toast({ type: "warning", title: t({ en: "Please complete all required fields.", bn: "সব প্রয়োজনীয় ঘর পূরণ করুন।" }) });
      return;
    }
    submitKyc(user!.id, { ...form });
    toast({ type: "success", title: t({ en: "KYC submitted successfully", bn: "KYC সফলভাবে জমা হয়েছে" }) });
  };

  if (kyc?.status === "submitted" || kyc?.status === "under_review" || kyc?.status === "verified") {
    return <KycStatus kyc={kyc} prof={undefined} />;
  }

  const steps = [
    t({ en: "Personal Information", bn: "ব্যক্তিগত তথ্য" }),
    t({ en: "Identity Information", bn: "পরিচয়ের তথ্য" }),
    t({ en: "Document Upload", bn: "ডকুমেন্ট আপলোড" }),
    t({ en: "Review & Submit", bn: "পর্যালোচনা ও জমা" }),
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 flex items-start gap-4 mb-5">
        <span className="w-11 h-11 rounded-xl bg-amber-400 text-white flex items-center justify-center shrink-0">
          <Icon name="shield" className="w-5.5 h-5.5" />
        </span>
        <p className="text-[15px] text-ink-700 font-medium leading-relaxed">{t(PT.kycBanner)}</p>
      </div>

      {kyc?.status === "rejected" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-ink-700 mb-5">
          <p className="font-bold text-red-600">{t(PT.kycRejected)} {kyc.reason || "—"}</p>
          <p className="mt-1">{t({ en: "Please correct the information and resubmit.", bn: "তথ্য সংশোধন করে পুনরায় জমা দিন।" })}</p>
        </div>
      )}

      <div className="rounded-3xl bg-white border border-ink-100 p-6 sm:p-8 shadow-soft">
        <h2 className="font-display font-bold text-xl text-ink-900">{t(PT.completeKyc)}</h2>
        {/* Stepper */}
        <div className="mt-6 flex items-center">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <span className={cn("w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all", i + 1 <= step ? "bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-600/25" : "bg-ink-100 text-ink-400")}>
                  {i + 1 < step ? <Icon name="check" className="w-4 h-4" strokeWidth={3} /> : i + 1}
                </span>
                <span className="hidden sm:block text-[10px] font-semibold text-ink-400 mt-1 text-center max-w-20">{s}</span>
              </div>
              {i < steps.length - 1 && <span className={cn("flex-1 h-0.5 mx-2 rounded", i + 1 < step ? "bg-brand-500" : "bg-ink-100")} />}
            </div>
          ))}
        </div>

        <div className="mt-7">
          {step === 1 && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><Field label={t(PT.kycFullName)} required><input className={inputCls} value={form.full_name} onChange={(e) => setForm((f: any) => ({ ...f, full_name: e.target.value }))} /></Field></div>
              <Field label={t(PT.kycDob)} required><input type="date" className={inputCls} value={form.dob} onChange={(e) => setForm((f: any) => ({ ...f, dob: e.target.value }))} /></Field>
              <Field label={t({ en: "Mobile", bn: "মোবাইল" })} required><input className={inputCls} value={form.mobile || user!.mobile} onChange={(e) => setForm((f: any) => ({ ...f, mobile: e.target.value }))} /></Field>
            </div>
          )}
          {step === 2 && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><Field label={t(PT.kycAddress)} required><input className={inputCls} value={form.address} onChange={(e) => setForm((f: any) => ({ ...f, address: e.target.value }))} /></Field></div>
              <Field label={t(PT.kycNid)} required><input className={inputCls} placeholder="e.g. 1234-5678-9012" value={form.nid} onChange={(e) => setForm((f: any) => ({ ...f, nid: e.target.value }))} /></Field>
              <Field label={t(PT.kycPayment)} required><input className={inputCls} placeholder="bKash — 01XXXXXXXXX" value={form.payment} onChange={(e) => setForm((f: any) => ({ ...f, payment: e.target.value }))} /></Field>
            </div>
          )}
          {step === 3 && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Field label={t({ en: "Profile Photo", bn: "প্রোফাইল ছবি" })}>
                  <input type="file" accept="image/*" className={cn(inputCls, "file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-700 file:px-3 file:py-1.5 file:text-sm file:font-semibold")} onChange={(e) => storeDoc("profile_doc", e.target.files?.[0] || null)} />
                </Field>
                {form.profile_doc && <p className="mt-1.5 text-xs text-emerald-600 flex items-center gap-1"><Icon name="check" className="w-3.5 h-3.5" strokeWidth={3} /> {form.profile_doc.name}</p>}
              </div>
              <div>
                <Field label={t({ en: "NID / Passport Document", bn: "NID / পাসপোর্ট ডকুমেন্ট" })}>
                  <input type="file" accept="image/*,.pdf" className={cn(inputCls, "file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-700 file:px-3 file:py-1.5 file:text-sm file:font-semibold")} onChange={(e) => storeDoc("nid_doc", e.target.files?.[0] || null)} />
                </Field>
                {form.nid_doc && <p className="mt-1.5 text-xs text-emerald-600 flex items-center gap-1"><Icon name="check" className="w-3.5 h-3.5" strokeWidth={3} /> {form.nid_doc.name}</p>}
              </div>
            </div>
          )}
          {step === 4 && (
            <div className="space-y-2.5 text-sm">
              <p className="font-bold text-ink-900">{t({ en: "Review your information", bn: "আপনার তথ্য পর্যালোচনা করুন" })}</p>
              {[
                [t(PT.kycFullName), form.full_name],
                [t(PT.kycDob), form.dob],
                [t(PT.kycAddress), form.address],
                [t(PT.kycNid), form.nid],
                [t(PT.kycPayment), form.payment],
                [t({ en: "Documents", bn: "ডকুমেন্ট" }), [form.profile_doc?.name, form.nid_doc?.name].filter(Boolean).join(", ") || "—"],
              ].map(([k, v], i) => (
                <div key={i} className="flex justify-between gap-4 rounded-xl bg-ink-50 px-4 py-2.5">
                  <span className="text-ink-500">{k}</span>
                  <span className="font-semibold text-ink-800 text-right break-all">{v}</span>
                </div>
              ))}
              <p className="text-xs text-ink-400 pt-2">{t(PT.kycNote)}</p>
            </div>
          )}
        </div>

        <div className="mt-7 flex justify-between">
          <Button variant="secondary" onClick={() => setStep((s) => Math.max(1, s - 1))} className={cn(step === 1 && "opacity-0 pointer-events-none")}>
            {t({ en: "Back", bn: "পিছনে" })}
          </Button>
          {step < 4 ? (
            <Button onClick={() => setStep((s) => s + 1)}>{t({ en: "Continue", bn: "চালিয়ে যান" })} <Icon name="arrow" className="w-4 h-4" /></Button>
          ) : (
            <Button onClick={submit}><Icon name="shield" className="w-4.5 h-4.5" /> {t(PT.submitKyc)}</Button>
          )}
        </div>
      </div>
    </div>
  );
}

function KycStatus({ kyc }: { kyc: any; prof?: any }) {
  const { t } = useI18n();
  if (!kyc) {
    return (
      <div className="max-w-2xl mx-auto">
        <EmptyState icon="shield" title={t(PT.completeKyc)} desc={t(PT.kycBanner)} />
      </div>
    );
  }
  return (
    <div className="max-w-xl mx-auto">
      <div className="rounded-3xl bg-white border border-ink-100 p-8 shadow-soft text-center">
        <span className={cn("mx-auto w-14 h-14 rounded-2xl flex items-center justify-center", kyc.status === "verified" ? "bg-emerald-50 text-emerald-500" : kyc.status === "rejected" ? "bg-red-50 text-red-500" : "bg-brand-50 text-brand-600")}>
          <Icon name={kyc.status === "verified" ? "check" : kyc.status === "rejected" ? "x" : "clock"} className="w-7 h-7" strokeWidth={2.5} />
        </span>
        <h2 className="mt-4 font-display font-bold text-xl text-ink-900">
          {kyc.status === "verified" ? t({ en: "KYC Verified", bn: "KYC যাচাইকৃত" }) : kyc.status === "rejected" ? t({ en: "KYC Rejected", bn: "KYC প্রত্যাখ্যাত" }) : t({ en: "KYC Under Review", bn: "KYC পর্যালোচনাধীন" })}
        </h2>
        <div className="mt-3 flex justify-center"><StatusBadge status={kyc.status} /></div>
        {kyc.status === "rejected" ? (
          <div className="mt-4">
            <p className="text-sm text-ink-500">{t(PT.kycRejected)} {kyc.reason || "—"}</p>
            <Button to="/portal/affiliate?tab=kyc" className="mt-5" onClick={() => { /* KYC wizard re-renders via state */ }}>{t({ en: "Resubmit KYC", bn: "KYC পুনরায় জমা দিন" })}</Button>
          </div>
        ) : kyc.status === "verified" ? (
          <p className="mt-4 text-sm text-ink-500">{t({ en: "Your affiliate account is fully active. You can generate links and earn commissions.", bn: "আপনার এফিলিয়েট অ্যাকাউন্ট সম্পূর্ণ সক্রিয়। লিংক তৈরি করে কমিশন আয় করতে পারবেন।" })}</p>
        ) : (
          <p className="mt-4 text-sm text-ink-500">{t(PT.kycWaiting)}</p>
        )}
      </div>
    </div>
  );
}

/* ── Overview ── */
function AffOverview({ prof }: { prof: any }) {
  const { t, lang } = useI18n();
  const [range, setRange] = useState(30);
  const since = Date.now() - range * 86400000;
  const clicks = all("affiliate_clicks").filter((c) => c.code === prof.code);
  const recentClicks = clicks.filter((c) => new Date(c.at).getTime() > since);
  const referrals = all("affiliate_referrals").filter((r) => r.code === prof.code);
  const comms = all("commissions").filter((c) => c.user_id === prof.user_id);
  const recentComms = comms.filter((c) => new Date(c.created_at).getTime() > since);
  const pending = comms.filter((c) => c.status === "pending").reduce((s, c) => s + c.amount, 0);
  const orders = all("orders").filter((o) => o.affiliate_id === prof.user_id);
  const successful = orders.filter((o) => ["payment_confirmed", "ready", "completed"].includes(o.status)).length;
  const conversion = clicks.length ? Math.round((successful / clicks.length) * 100) : 0;

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400000);
    const key = d.toISOString().slice(0, 10);
    return { label: `${d.getDate()}`, value: recentClicks.filter((c) => String(c.at || "").slice(0, 10) === key).length };
  });
  const commDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400000);
    const key = d.toISOString().slice(0, 10);
    return { label: `${d.getDate()}`, value: recentComms.filter((c) => String(c.created_at).slice(0, 10) === key).reduce((s, c) => s + c.amount, 0) };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-xl text-ink-900">{t(PT.affiliateDashboard)}</h2>
          <p className="text-sm text-ink-400 mt-0.5">@{prof.code} · {t({ en: "Active · KYC Verified", bn: "সক্রিয় · KYC যাচাইকৃত" })}</p>
        </div>
        <TimeRange value={range} onChange={setRange} />
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard icon="trending" label={t(PT.totalEarnings)} value={money(prof.total_earned, lang)} />
        <StatCard icon="wallet" label={t(PT.availableBalance)} value={money(prof.balance, lang)} />
        <StatCard icon="clock" label={t(PT.pendingCommission)} value={money(pending, lang)} />
        <StatCard icon="users" label={t(PT.totalReferrals)} value={referrals.length} />
        <StatCard icon="target" label={t(PT.conversionRate)} value={`${conversion}%`} />
        <StatCard icon="link" label={t(PT.totalClicks)} value={clicks.length} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5">
          <h3 className="font-display font-bold text-base text-ink-900 mb-1">{t(PT.clicks)}</h3>
          <p className="text-xs text-ink-400 mb-4">{recentClicks.length} {t({ en: "clicks in period", bn: "ক্লিক এই সময়ে" })}</p>
          <Bars data={days} />
        </div>
        <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5">
          <h3 className="font-display font-bold text-base text-ink-900 mb-1">{t(PT.monthlyEarnings)}</h3>
          <p className="text-xs text-ink-400 mb-4">{money(recentComms.reduce((s, c) => s + c.amount, 0), lang)}</p>
          <Bars data={commDays} color="from-emerald-600 to-emerald-400" />
        </div>
      </div>
    </div>
  );
}

/* ── Links ── */
function AffLinks({ prof }: { prof: any }) {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const [copied, setCopied] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const products = all("products").filter((p) => p.status === "published" && p.commission?.enabled);
  const services = all("services").filter((s) => s.status === "published" && s.commission?.enabled);
  const base = `https://alkhubaibit.com/?ref=${prof.code}`;
  const itemLink = (id: string) => `https://alkhubaibit.com/?ref=${prof.code}&item=${id}`;

  const copy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(id);
    window.setTimeout(() => setCopied(""), 1500);
    toast({ type: "success", title: t({ en: "Link copied", bn: "লিংক কপি হয়েছে" }) });
  };

  const shareUrls = (link: string, text: string) => ({
    wa: `https://wa.me/?text=${encodeURIComponent(`${text} ${link}`)}`,
    fb: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
    tg: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`,
    msgr: `https://www.facebook.com/dialog/send?link=${encodeURIComponent(link)}`,
  });

  const commissionText = (cfg: any) => (cfg.type === "fixed" ? money(cfg.initial, lang) : `${cfg.initial}%`);

  return (
    <div className="space-y-5">
      {/* Master link */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-800 to-brand-600 p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid" aria-hidden="true" />
        <div className="relative">
          <p className="text-sm font-semibold text-brand-100">{t(PT.yourLink)}</p>
          <div className="mt-2 flex flex-col sm:flex-row gap-2.5">
            <p className="flex-1 rounded-xl bg-white/10 border border-white/15 px-4 py-2.5 text-sm font-mono break-all">{base}</p>
            <Button size="sm" className="bg-white text-brand-700 from-white via-white to-white shrink-0" onClick={() => copy(base, "main")}>
              <Icon name="link" className="w-4 h-4" /> {copied === "main" ? t(PT.copied) : t(PT.copyLink)}
            </Button>
          </div>
          <div className="mt-3 flex gap-2">
            {[
              { icon: "whatsapp", href: shareUrls(base, t({ en: "Check out AL-KHUBAIB IT services:", bn: "AL-KHUBAIB IT-এর সার্ভিস দেখুন:" })).wa, l: "WhatsApp" },
              { icon: "facebook", href: shareUrls(base, "").fb, l: "Facebook" },
              { icon: "telegram", href: shareUrls(base, t({ en: "AL-KHUBAIB IT services", bn: "AL-KHUBAIB IT-এর সার্ভিস" })).tg, l: "Telegram" },
              { icon: "messenger", href: shareUrls(base, "").msgr, l: "Messenger" },
            ].map((s) => (
              <a key={s.l} href={s.href} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-white hover:bg-white hover:text-brand-700 transition-all" aria-label={s.l}>
                <Icon name={s.icon as never} className="w-4.5 h-4.5" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Catalog */}
      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-6">
        <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t(PT.catalog)}</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {[...products.map((p) => ({ item: p, kind: "product" })), ...services.map((s) => ({ item: s, kind: "service" }))].map(({ item, kind }) => (
            <div key={`${kind}_${item.id}`} className="rounded-xl border border-ink-100 p-4 hover:border-brand-300 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-600">{kind === "product" ? t(PT.products) : t(PT.services)}</p>
                  <h4 className="mt-0.5 font-display font-bold text-base text-ink-900">{t(item.name)}</h4>
                </div>
                <span className="rounded-full bg-brand-50 text-brand-700 border border-brand-200 px-2.5 py-0.5 text-[11px] font-bold shrink-0">
                  {t(PT.commission)} {commissionText(item.commission)}
                </span>
              </div>
              <p className="mt-2 text-sm text-ink-500">{money(item.price, lang)}{item.commission?.renewalEnabled ? ` · ${t({ en: "Renewal", bn: "নবায়ন" })} ${item.commission.renewal}${item.commission.type === "fixed" ? "" : "%"}` : ""}</p>
              <Button size="sm" variant="secondary" className="mt-3" onClick={() => setSelected({ item, kind })}>
                <Icon name="link" className="w-4 h-4" /> {t({ en: "Get Affiliate Link", bn: "এফিলিয়েট লিংক নিন" })}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Link modal */}
      {selected && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-5">
          <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-ink-900">{t(selected.item.name)}</h3>
              <button onClick={() => setSelected(null)} className="w-9 h-9 rounded-lg border border-ink-100 flex items-center justify-center">
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-1.5 text-xs text-ink-400">{t(PT.commission)}: {commissionText(selected.item.commission)}{selected.item.commission?.renewalEnabled ? ` · ${t(PT.renewals)}: ${selected.item.commission.renewal}${selected.item.commission.type === "fixed" ? "" : "%"}` : ""}</p>
            <p className="mt-4 text-sm font-semibold text-ink-800">{t({ en: "Affiliate URL", bn: "এফিলিয়েট URL" })}</p>
            <p className="mt-1.5 rounded-xl bg-ink-50 border border-ink-100 px-4 py-3 text-xs font-mono break-all text-brand-700">{itemLink(selected.item.id)}</p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" className="flex-1" onClick={() => copy(itemLink(selected.item.id), selected.item.id)}>
                <Icon name="link" className="w-4 h-4" /> {copied === selected.item.id ? t(PT.copied) : t(PT.copyLink)}
              </Button>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {[
                { icon: "whatsapp", href: shareUrls(itemLink(selected.item.id), t({ en: "Check this out:", bn: "এটি দেখুন:" })).wa },
                { icon: "facebook", href: shareUrls(itemLink(selected.item.id), "").fb },
                { icon: "telegram", href: shareUrls(itemLink(selected.item.id), t(selected.item.name)).tg },
                { icon: "messenger", href: shareUrls(itemLink(selected.item.id), "").msgr },
              ].map((s, i) => (
                <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" className="h-11 rounded-xl bg-ink-50 border border-ink-100 flex items-center justify-center text-ink-600 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 transition-all">
                  <Icon name={s.icon as never} className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
      <p className="text-xs text-ink-400">{t(PT.fraudNote)}</p>
    </div>
  );
}

/* ── Referrals ── */
function AffReferrals({ prof }: { prof: any }) {
  const { t, lang } = useI18n();
  const referrals = all("affiliate_referrals").filter((r) => r.code === prof.code);
  const orders = all("orders").filter((o) => o.affiliate_id === prof.user_id);
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-6">
        <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t({ en: "My Referrals", bn: "আমার রেফারেল" })}</h3>
        <DataTable
          rows={referrals}
          searchKeys={["code"]}
          emptyTitle={t({ en: "No Referrals Yet", bn: "এখনও কোনো রেফারেল নেই" })}
          emptyDesc={t({ en: "Share your affiliate link to start earning referrals.", bn: "রেফারেল পেতে আপনার এফিলিয়েট লিংক শেয়ার করুন।" })}
          columns={[
            { key: "id", label: t({ en: "Referral ID", bn: "রেফারেল আইডি" }), render: (r) => <span className="font-mono text-xs text-ink-600">{String(r.id).slice(0, 10)}…</span> },
            { key: "user_name", label: t({ en: "Customer", bn: "গ্রাহক" }), render: (r) => <span className="text-ink-700">{r.user_name || t({ en: "Customer", bn: "গ্রাহক" })}</span> },
            { key: "created_at", label: t(PT.date), render: (r) => <span className="text-ink-500">{fmtDateTime(r.created_at, lang)}</span> },
            { key: "status", label: t(PT.status), render: (r) => <StatusBadge status={r.status || "active"} /> },
          ]}
        />
      </div>
      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-6">
        <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t({ en: "Referred Orders", bn: "রেফার করা অর্ডার" })}</h3>
        <DataTable
          rows={orders}
          searchKeys={["no", "user_name"]}
          emptyTitle={t({ en: "No converted orders yet.", bn: "এখনও কোনো কনভার্টেড অর্ডার নেই।" })}
          columns={[
            { key: "no", label: t({ en: "Order", bn: "অর্ডার" }), render: (o) => <span className="font-bold text-ink-900">#{o.no}</span> },
            { key: "user_name", label: t({ en: "Customer", bn: "গ্রাহক" }), render: (o) => <span className="text-ink-600">{o.user_name.split(" ")[0]}</span> },
            { key: "created_at", label: t(PT.date), render: (o) => <span className="text-ink-500">{fmtDateTime(o.created_at, lang)}</span> },
            { key: "total", label: t(PT.amount), render: (o) => <span className="font-bold text-ink-800">{money(o.total, lang)}</span> },
            { key: "status", label: t(PT.status), render: (o) => <StatusBadge status={o.status} /> },
          ]}
        />
      </div>
    </div>
  );
}

/* ── Commissions ── */
function AffCommissions({ prof }: { prof: any }) {
  const { t, lang } = useI18n();
  const comms = all("commissions").filter((c) => c.user_id === prof.user_id).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return (
    <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-6">
      <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t({ en: "Commission History", bn: "কমিশনের ইতিহাস" })}</h3>
      <DataTable
        rows={comms}
        searchKeys={["order_no", "type"]}
        emptyTitle={t({ en: "No Commission Yet", bn: "এখনও কোনো কমিশন নেই" })}
        emptyDesc={t({ en: "Earn commission when referrals purchase eligible products and services.", bn: "রেফারেলরা যোগ্য প্রোডাক্ট ও সার্ভিস কিনলে কমিশন পাবেন।" })}
        columns={[
          { key: "created_at", label: t(PT.date), render: (c) => <span className="text-ink-500">{fmtDateTime(c.created_at, lang)}</span> },
          { key: "item_name", label: t({ en: "Product/Service", bn: "প্রোডাক্ট/সার্ভিস" }), render: (c) => <span className="text-ink-700">{typeof c.item_name === "string" ? c.item_name : c.item_name?.en}</span> },
          { key: "order_no", label: t({ en: "Order", bn: "অর্ডার" }), render: (c) => <span className="text-ink-600">#{c.order_no}</span> },
          { key: "amount", label: t(PT.commission), render: (c) => <span className="font-bold text-brand-700">{money(c.amount, lang)}</span> },
          { key: "type", label: t({ en: "Type", bn: "ধরন" }), render: (c) => (
            <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-bold border", c.type === "renewal" ? "bg-sky-50 text-sky-700 border-sky-200" : "bg-brand-50 text-brand-700 border-brand-200")}>
              {c.type === "renewal" ? t(PT.renewals) : t({ en: "First Purchase", bn: "প্রথম ক্রয়" })}
            </span>
          ) },
          { key: "status", label: t(PT.status), render: (c) => <StatusBadge status={c.status} /> },
        ]}
      />
    </div>
  );
}

/* ── Earnings ── */
function AffEarnings({ prof }: { prof: any }) {
  const { t, lang } = useI18n();
  const [range, setRange] = useState(30);
  const since = Date.now() - range * 86400000;
  const comms = all("commissions").filter((c) => c.user_id === prof.user_id);
  const recent = comms.filter((c) => new Date(c.created_at).getTime() > since);
  const pending = comms.filter((c) => c.status === "pending").reduce((s, c) => s + c.amount, 0);
  const paid = comms.filter((c) => c.status === "paid").reduce((s, c) => s + c.amount, 0);
  const approved = comms.filter((c) => c.status === "approved").reduce((s, c) => s + c.amount, 0);
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400000);
    const key = d.toISOString().slice(0, 10);
    return { label: `${d.getDate()}`, value: recent.filter((c) => String(c.created_at).slice(0, 10) === key).reduce((s, c) => s + c.amount, 0) };
  });
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display font-bold text-xl text-ink-900">{t({ en: "Earnings", bn: "আয়" })}</h2>
        <TimeRange value={range} onChange={setRange} />
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon="trending" label={t(PT.totalEarnings)} value={money(prof.total_earned, lang)} />
        <StatCard icon="wallet" label={t(PT.availableBalance)} value={money(prof.balance, lang)} />
        <StatCard icon="clock" label={t(PT.pendingCommission)} value={money(pending, lang)} />
        <StatCard icon="check" label={t(PT.paidCommission)} value={money(paid + approved, lang)} />
      </div>
      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5">
        <h3 className="font-display font-bold text-base text-ink-900 mb-1">{t(PT.monthlyEarnings)}</h3>
        <p className="text-xs text-ink-400 mb-4">{money(recent.reduce((s, c) => s + c.amount, 0), lang)}</p>
        <Bars data={days} color="from-brand-700 to-brand-400" />
      </div>
    </div>
  );
}

/* ── Withdrawals ── */
function AffWithdrawals({ prof }: { prof: any }) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const settings = getSettings();
  const min = settings.affiliate?.minWithdrawal ?? 1000;
  const [amount, setAmount] = useState(min);
  const [method, setMethod] = useState("bKash");
  const [account, setAccount] = useState("");
  const wds = all("withdrawals").filter((w) => w.user_id === prof.user_id).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

  const locked = prof.status !== "active" || prof.kyc_status !== "verified" || prof.status === "suspended";
  const insufficient = prof.balance < min;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-6">
        <h3 className="font-display font-bold text-lg text-ink-900 mb-1">{t({ en: "Withdraw Earnings", bn: "আয় উত্তোলন করুন" })}</h3>
        <p className="text-sm text-ink-500">
          {t(PT.availableBalance)}: <strong className="text-ink-800">{money(prof.balance, lang)}</strong> · {t(PT.minWithdrawal)}: <strong className="text-ink-800">{money(min, lang)}</strong>
        </p>

        {(locked || insufficient) && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-ink-700 flex items-start gap-3">
            <Icon name="lock" className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p>
              {locked
                ? t({ en: "Withdrawals are locked — your affiliate account must be active with verified KYC.", bn: "উইথড্রয়াল লক করা আছে — অ্যাকাউন্ট সক্রিয় ও KYC যাচাইকৃত হতে হবে।" })
                : t({ en: `Your balance is below the minimum withdrawal amount of ৳${min}.`, bn: `আপনার ব্যালেন্স সর্বনিম্ন উইথড্রয়াল পরিমাণ ৳${min}-এর নিচে।` })}
            </p>
          </div>
        )}

        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          <Field label={t(PT.amount)} required>
            <input type="number" className={inputCls} value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} disabled={locked} />
          </Field>
          <Field label={t(PT.paymentMethod)} required>
            <select className={cn(inputCls, "appearance-none")} value={method} onChange={(e) => setMethod(e.target.value)} disabled={locked}>
              {["bKash", "Nagad", "Bank Transfer"].map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label={t(PT.accountInfo)} required>
              <input className={inputCls} placeholder="bKash — 01XXXXXXXXX" value={account} onChange={(e) => setAccount(e.target.value)} disabled={locked} />
            </Field>
          </div>
        </div>
        <Button className="mt-4" onClick={() => {
          if (locked || insufficient) return;
          if (!account.trim()) { toast({ type: "warning", title: t(PT.errRequired) }); return; }
          const r = requestWithdrawal(user!.id, amount, method, account);
          if (!r.ok) { toast({ type: "error", title: r.error || "Error" }); return; }
          setAccount("");
          toast({ type: "success", title: t({ en: "Withdrawal request submitted", bn: "উইথড্রয়াল অনুরোধ জমা হয়েছে" }) });
        }}>
          {t(PT.requestWithdrawal)}
        </Button>
      </div>

      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-6">
        <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t({ en: "Withdrawal History", bn: "উইথড্রয়ালের ইতিহাস" })}</h3>
        <DataTable
          rows={wds}
          searchKeys={["no", "method"]}
          emptyTitle={t({ en: "No withdrawals yet.", bn: "এখনও কোনো উইথড্রয়াল নেই।" })}
          columns={[
            { key: "no", label: t({ en: "Withdrawal ID", bn: "উইথড্রয়াল আইডি" }), render: (w) => <span className="font-bold text-ink-900">{w.no}</span> },
            { key: "amount", label: t(PT.amount), render: (w) => <span className="font-bold text-ink-800">{money(w.amount, lang)}</span> },
            { key: "method", label: t({ en: "Method", bn: "মাধ্যম" }), render: (w) => <span className="text-ink-600">{w.method}</span> },
            { key: "created_at", label: t(PT.date), render: (w) => <span className="text-ink-500">{fmtDateTime(w.created_at, lang)}</span> },
            { key: "status", label: t(PT.status), render: (w) => <StatusBadge status={w.status} /> },
          ]}
        />
      </div>
    </div>
  );
}
