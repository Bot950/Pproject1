import { useCallback, useEffect, useState } from "react";
import { Icon } from "../components/Icons";
import { Button, PageHero, Breadcrumbs, SectionHeading } from "../components/ui";
import { usePageMeta } from "../components/Layout";
import { useI18n } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import { all, get, insert, update, fmtDateTime, useDbVersion, getSettings, setSetting, logAction, nowISO, notify } from "../lib/db";
import { PT } from "../lib/portalText";
import { StatusBadge, Field, inputCls } from "../components/portalUi";
import { DataTable, useToast } from "../lib/shell";
import { notifyEvent } from "../lib/notify";
import {
  AppointmentApiError, fetchAvailability, bookAppointment, testAppointmentConnection,
} from "../lib/appointmentApi";
import { cn } from "../utils/cn";

/* ──────────────────── PUBLIC BOOKING PAGE ──────────────────── */

export default function AppointmentPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [slot, setSlot] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [form, setForm] = useState({ name: user?.name || "", email: user?.email || "", phone: user?.mobile || "", whatsapp: "", message: "" });
  const services = all("appointment_services").filter((s) => s.status === "published");
  useDbVersion();

  usePageMeta(
    t({ en: "Schedule a Meeting — AL-KHUBAIB IT", bn: "মিটিং নির্ধারণ করুন — AL-KHUBAIB IT" }),
    t({ en: "Book an appointment with the AL-KHUBAIB IT expert team. Availability is verified in real time from the central appointment system.", bn: "AL-KHUBAIB IT এক্সপার্ট টিমের সাথে অ্যাপয়েন্টমেন্ট বুক করুন। সেন্ট্রাল অ্যাপয়েন্টমেন্ট সিস্টেম থেকে সময়ের উপলব্ধতা রিয়েল-টাইমে যাচাই করা হয়।" })
  );

  const today = new Date().toISOString().slice(0, 10);
  const maxDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  const loadSlots = useCallback(async () => {
    if (!serviceId || !date) return;
    setLoadingSlots(true);
    setSlotError("");
    setSlots([]);
    setSlot("");
    try {
      const data = await fetchAvailability(date, serviceId);
      setSlots(data);
    } catch (err: any) {
      setSlots([]);
      setSlotError(
        err instanceof AppointmentApiError && err.code === "TIMEOUT"
          ? t(PT.appointmentTimeout)
          : t(PT.appointmentUnavailable)
      );
    } finally {
      setLoadingSlots(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId, date]);

  useEffect(() => {
    if (step === 2) loadSlots();
  }, [step, loadSlots]);

  const submit = async () => {
    if (submitting) return; // prevent double submission
    setSubmitting(true);
    try {
      const svc = get("appointment_services", serviceId);
      // Central API performs the final slot verification (double-booking protection)
      const res = await bookAppointment({
        name: form.name, email: form.email, phone: form.phone, whatsapp: form.whatsapp,
        service: svc?.name?.en || "", service_id: serviceId, date, time: slot, message: form.message,
      });
      const appointmentId = res.appointment_id || res.id || "";
      // Only after a REAL success: dispatch company-branded notifications
      notifyEvent("appointment_client", {
        name: form.name, appointment_id: appointmentId, service: svc?.name?.en || "",
        date, time: slot, status: res.status || "Pending", email: form.email,
      });
      notifyEvent("appointment_admin", {
        appointment_id: appointmentId, name: form.name, email: form.email, phone: form.phone,
        service: svc?.name?.en || "", date, time: slot,
      });
      notify("admin", "appointment", { en: "New appointment", bn: "নতুন অ্যাপয়েন্টমেন্ট" }, {
        en: `${form.name} booked ${svc?.name?.en || ""} on ${date} at ${slot}.`,
        bn: `${form.name} ${date} তারিখ ${slot}-এ ${svc?.name?.bn || ""} অ্যাপয়েন্টমেন্ট করেছেন।`,
      });
      setResult({ appointment_id: appointmentId, status: res.status || "Pending", service: svc?.name, date, time: slot });
    } catch (err: any) {
      if (err instanceof AppointmentApiError && err.code === "SLOT_TAKEN") {
        setSlot("");
        setSlotError(t(PT.slotTaken));
        loadSlots(); // refresh availability
      } else {
        setSlotError(err instanceof AppointmentApiError && err.code === "TIMEOUT" ? t(PT.appointmentTimeout) : t(PT.appointmentUnavailable));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const available = slots.filter((s) => s.available);

  /* Success screen */
  if (result) {
    return (
      <div className="relative min-h-[80vh] bg-ink-950 flex items-center justify-center py-16 overflow-hidden">
        <div className="absolute inset-0 bg-grid" aria-hidden="true" />
        <div className="absolute -top-24 right-1/4 w-96 h-96 rounded-full bg-brand-600/35 blur-[110px]" aria-hidden="true" />
        <div className="container-x relative max-w-md">
          <div className="rounded-3xl bg-white p-8 text-center shadow-2xl animate-fade-in">
            <span className="mx-auto w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <Icon name="check" className="w-8 h-8" strokeWidth={2.5} />
            </span>
            <h2 className="mt-4 font-display font-bold text-2xl text-ink-900">{t(PT.appointmentSuccess)}</h2>
            <div className="mt-5 rounded-2xl bg-ink-50 p-4 text-left text-sm space-y-2">
              <p className="flex justify-between gap-4"><span className="text-ink-500">{t({ en: "Appointment ID", bn: "অ্যাপয়েন্টমেন্ট আইডি" })}</span><span className="font-mono font-bold text-brand-700">{result.appointment_id}</span></p>
              <p className="flex justify-between gap-4"><span className="text-ink-500">{t(PT.services)}</span><span className="font-semibold text-ink-800">{t(result.service)}</span></p>
              <p className="flex justify-between gap-4"><span className="text-ink-500">{t(PT.date)}</span><span className="font-semibold text-ink-800">{result.date}</span></p>
              <p className="flex justify-between gap-4"><span className="text-ink-500">{t({ en: "Time", bn: "সময়" })}</span><span className="font-semibold text-ink-800">{result.time}</span></p>
              <p className="flex justify-between gap-4"><span className="text-ink-500">{t(PT.status)}</span><span className="font-semibold text-amber-600">{t(PT.appointmentStatusPending)}</span></p>
            </div>
            <p className="mt-4 text-sm text-ink-500 leading-relaxed">
              {t({ en: "We will contact you to confirm the schedule. A confirmation email has been prepared for you.", bn: "সময়সূচি নিশ্চিত করতে আমরা আপনার সাথে যোগাযোগ করব। আপনার জন্য নিশ্চিতকরণ ইমেইল প্রস্তুত করা হয়েছে।" })}
            </p>
            <div className="mt-6 flex flex-col gap-2.5">
              <Button to="/">{t({ en: "Back to Website", bn: "ওয়েবসাইটে ফিরে যান" })}</Button>
              <Button variant="secondary" onClick={() => { setResult(null); setStep(1); setSlot(""); setSlots([]); }}>
                {t({ en: "Book Another Appointment", bn: "আরেকটি অ্যাপয়েন্টমেন্ট বুক করুন" })}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHero eyebrow={t({ en: "Appointments", bn: "অ্যাপয়েন্টমেন্ট" })} title={t(PT.bookAppointment)} subtitle={t(PT.appointmentSub)}>
        <div className="mt-7 flex flex-col sm:flex-row gap-3.5">
          <Button href="https://wa.me/8801926100643" variant="whatsapp" size="lg">
            <Icon name="whatsapp" className="w-5 h-5" /> WhatsApp
          </Button>
          <Button to="/contact" variant="outline-light" size="lg">{t({ en: "Contact Us", bn: "যোগাযোগ করুন" })}</Button>
        </div>
      </PageHero>

      <section className="container-x py-12 sm:py-16">
        <Breadcrumbs items={[{ label: t(PT.scheduleMeeting) }]} />
        <div className="max-w-2xl mx-auto">
          {/* Step indicator */}
          <div className="flex items-center mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <span className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all", s <= step ? "bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-600/25" : "bg-ink-100 text-ink-400")}>
                  {s < step ? <Icon name="check" className="w-4 h-4" strokeWidth={3} /> : s}
                </span>
                {s < 3 && <span className={cn("flex-1 h-0.5 mx-3 rounded", s < step ? "bg-brand-500" : "bg-ink-100")} />}
              </div>
            ))}
          </div>

          <div className="rounded-3xl bg-white border border-ink-100 shadow-card p-6 sm:p-8">
            {step === 1 && (
              <div className="space-y-5">
                <SectionHeading align="left" eyebrow={t({ en: "Step 1", bn: "ধাপ ১" })} title={t(PT.selectService)} subtitle={t({ en: "Choose the service you want to discuss.", bn: "আপনি যে সার্ভিস নিয়ে আলোচনা করতে চান তা নির্বাচন করুন।" })} />
                <div className="grid gap-3">
                  {services.map((s) => (
                    <button key={s.id} onClick={() => { setServiceId(s.id); setStep(2); }}
                      className={cn("flex items-center justify-between gap-3 rounded-2xl border p-4 text-left transition-all", serviceId === s.id ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500/20" : "border-ink-200 hover:border-brand-300")}>
                      <div>
                        <p className="font-semibold text-ink-900">{t(s.name)}</p>
                        <p className="text-xs text-ink-400 mt-0.5">{s.duration} {t(PT.minutes)}</p>
                      </div>
                      <Icon name="arrow" className="w-4 h-4 text-brand-500" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <SectionHeading align="left" eyebrow={t({ en: "Step 2", bn: "ধাপ ২" })} title={t(PT.selectDate)} subtitle={t({ en: "Pick a date and choose an available time slot.", bn: "তারিখ নির্বাচন করে উপলব্ধ সময়স্লট বেছে নিন।" })} />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label={t(PT.date)}>
                    <input type="date" min={today} max={maxDate} className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
                  </Field>
                  <div className="flex items-end pb-1">
                    <Button variant="secondary" onClick={() => setStep(1)}>{t({ en: "Back", bn: "পিছনে" })}</Button>
                  </div>
                </div>

                {loadingSlots && (
                  <div className="flex items-center gap-3 rounded-2xl bg-ink-50 p-5 text-sm text-ink-500">
                    <span className="w-5 h-5 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
                    {t(PT.loadingTimes)}
                  </div>
                )}

                {slotError && !loadingSlots && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-ink-700 flex items-start gap-3">
                    <Icon name="bell" className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p>{slotError}</p>
                      <button className="mt-2 font-bold text-brand-600 hover:text-brand-700" onClick={loadSlots}>{t({ en: "Try Again", bn: "আবার চেষ্টা করুন" })}</button>
                    </div>
                  </div>
                )}

                {!loadingSlots && !slotError && date && (
                  available.length === 0 ? (
                    <p className="text-sm text-ink-500">{t(PT.noSlots)}</p>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold text-ink-800 mb-3">{t(PT.selectTime)}</p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                        {slots.map((s) => (
                          <button
                            key={s.time}
                            disabled={!s.available}
                            onClick={() => setSlot(s.time)}
                            className={cn(
                              "rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all",
                              !s.available && "border-ink-100 bg-ink-50 text-ink-300 line-through cursor-not-allowed",
                              s.available && slot === s.time && "border-brand-500 bg-brand-600 text-white shadow-lg shadow-brand-600/25",
                              s.available && slot !== s.time && "border-ink-200 text-ink-700 hover:border-brand-400 hover:bg-brand-50"
                            )}
                          >
                            {s.time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                )}

                {slot && (
                  <Button className="w-full" onClick={() => setStep(3)}>
                    {t({ en: "Continue", bn: "চালিয়ে যান" })} <Icon name="arrow" className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <SectionHeading align="left" eyebrow={t({ en: "Step 3", bn: "ধাপ ৩" })} title={t({ en: "Your Information", bn: "আপনার তথ্য" })} subtitle={`${t(get("appointment_services", serviceId)?.name)} · ${date} · ${slot}`} />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label={t(PT.name)} required><input className={inputCls} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required /></Field>
                  <Field label={t(PT.email)} required><input type="email" className={inputCls} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required /></Field>
                  <Field label={t(PT.mobile)} required><input type="tel" className={inputCls} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required /></Field>
                  <Field label={t(PT.callbackWhatsapp)}><input className={inputCls} value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))} /></Field>
                  <div className="sm:col-span-2">
                    <Field label={t({ en: "Message / Project Details", bn: "বার্তা / প্রজেক্টের বিবরণ" })}>
                      <textarea rows={3} className={cn(inputCls, "resize-none")} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
                    </Field>
                  </div>
                </div>
                {slotError && <p className="text-sm font-medium text-red-600">{slotError}</p>}
                <div className="flex gap-2.5">
                  <Button variant="secondary" onClick={() => setStep(2)}>{t({ en: "Back", bn: "পিছনে" })}</Button>
                  <Button className="flex-1" onClick={submit}>
                    {submitting ? (
                      <><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> {t(PT.submittingAppointment)}</>
                    ) : (
                      <>{t(PT.bookAppointment)} <Icon name="send" className="w-4.5 h-4.5" /></>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

/* ──────────────────── ADMIN: APPOINTMENTS LIST ─────────────── */

export function AdminAppointmentsView() {
  const { t, lang } = useI18n();
  const logs = all("appointment_logs").filter((l) => l.kind === "success" && l.detail.startsWith("POST /book")).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5">
        <h3 className="font-display font-bold text-lg text-ink-900 mb-2">{t(PT.appointments)}</h3>
        <p className="text-xs text-ink-400 mb-4">
          {t({ en: "Master appointment records remain on the central system. This list shows company-originated bookings from the integration log (read-only).", bn: "মাস্টার অ্যাপয়েন্টমেন্ট রেকর্ড সেন্ট্রাল সিস্টেমে থাকে। এই তালিকায় কোম্পানি থেকে করা বুকিংগুলো ইন্টিগ্রেশন লগ থেকে দেখানো হয় (রিড-অনলি)।" })}
        </p>
        <DataTable
          rows={logs}
          searchKeys={["detail"]}
          emptyTitle={t({ en: "No appointments from this website yet.", bn: "এই ওয়েবসাইট থেকে এখনও কোনো অ্যাপয়েন্টমেন্ট নেই।" })}
          columns={[
            { key: "detail", label: t({ en: "API Request", bn: "API রিকুয়েস্ট" }), render: (r) => <span className="text-ink-500 text-xs">{r.detail}</span> },
            { key: "meta", label: t(PT.centralAppointmentId), render: (r) => {
              try {
                const parsed = JSON.parse(r.meta?.summary || "{}");
                return <span className="font-mono text-xs text-brand-700">{parsed.appointment_id || parsed.id || "—"}</span>;
              } catch {
                return <span className="font-mono text-xs text-brand-700">—</span>;
              }
            } },
            { key: "created_at", label: t({ en: "Created", bn: "তৈরি হয়েছে" }), render: (r) => <span className="text-ink-500">{fmtDateTime(r.created_at, lang)}</span> },
            { key: "status", label: t(PT.status), render: () => <StatusBadge status="pending" /> },
          ]}
        />
      </div>
      <AdminApiLogsView />
    </div>
  );
}

function AdminApiLogsView() {
  const { t, lang } = useI18n();
  const logs = all("appointment_logs").sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return (
    <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5">
      <h3 className="font-display font-bold text-lg text-ink-900 mb-4">{t(PT.integrationLogs)}</h3>
      <DataTable
        rows={logs}
        searchKeys={["kind", "detail", "status"]}
        emptyTitle={t({ en: "No integration logs.", bn: "কোনো ইন্টিগ্রেশন লগ নেই।" })}
        columns={[
          { key: "created_at", label: t(PT.date), render: (l) => <span className="text-ink-500">{fmtDateTime(l.created_at, lang)}</span> },
          { key: "kind", label: t({ en: "Type", bn: "ধরন" }), render: (l) => <span className="text-ink-600 text-xs">{l.kind}</span> },
          { key: "detail", label: t({ en: "Detail", bn: "বিস্তারিত" }), render: (l) => <span className="text-ink-700 text-xs">{l.detail}</span> },
          { key: "status", label: t(PT.status), render: (l) => <StatusBadge status={l.status === "ok" ? "verified" : "rejected"} /> },
        ]}
      />
    </div>
  );
}

/* ──────────────────── ADMIN: APPOINTMENT SERVICES ──────────── */

export function AdminAppointmentServicesView() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState<any | null>(null);
  const services = all("appointment_services").filter((s) => s.status !== "trashed").sort((a, b) => (a.order || 0) - (b.order || 0));

  if (editing) {
    const setF = (p: any) => setEditing({ ...editing, ...p });
    return (
      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-7">
        <button onClick={() => setEditing(null)} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 mb-4">
          <Icon name="arrow" className="w-4 h-4 rotate-180" /> {t(PT.appointmentServices)}
        </button>
        <h3 className="font-display font-bold text-xl text-ink-900 mb-5">{editing.id === "new" ? t(PT.addNew) : t(PT.edit)}</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={`${t(PT.english)} · ${t({ en: "Service Name", bn: "সার্ভিসের নাম" })}`}><input className={inputCls} value={editing.name?.en || ""} onChange={(e) => setF({ name: { ...editing.name, en: e.target.value } })} /></Field>
          <Field label={`${t(PT.bangla)} · ${t({ en: "Service Name", bn: "সার্ভিসের নাম" })}`}><input className={inputCls} value={editing.name?.bn || ""} onChange={(e) => setF({ name: { ...editing.name, bn: e.target.value } })} /></Field>
          <Field label={t({ en: "Duration (minutes)", bn: "সময়কাল (মিনিট)" })}><input type="number" className={inputCls} value={editing.duration || 30} onChange={(e) => setF({ duration: Number(e.target.value) })} /></Field>
          <Field label={t({ en: "Portfolio Service ID (mapping)", bn: "Portfolio Service ID (ম্যাপিং)" })}>
            <input className={inputCls} placeholder="central-service-id" value={editing.portfolio_service_id || ""} onChange={(e) => setF({ portfolio_service_id: e.target.value })} />
          </Field>
          <Field label={t({ en: "Status", bn: "স্ট্যাটাস" })}>
            <select className={cn(inputCls, "appearance-none")} value={editing.status || "published"} onChange={(e) => setF({ status: e.target.value })}>
              <option value="published">{t({ en: "Enabled", bn: "সক্রিয়" })}</option><option value="draft">{t({ en: "Disabled", bn: "নিষ্ক্রিয়" })}</option>
            </select>
          </Field>
        </div>
        <Button className="mt-6" onClick={() => {
          if (editing.id === "new") { insert("appointment_services", { ...editing, id: undefined, created_at: nowISO() }); logAction(user!.email, "appointment_service_create", editing.name?.en); }
          else { update("appointment_services", editing.id, editing); logAction(user!.email, "appointment_service_update", editing.name?.en); }
          setEditing(null);
          toast({ type: "success", title: t({ en: "Service saved", bn: "সার্ভিস সংরক্ষণ হয়েছে" }) });
        }}>{t(PT.save)}</Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg text-ink-900">{t(PT.appointmentServices)} ({services.length})</h3>
        <Button size="sm" onClick={() => setEditing({ id: "new", name: { en: "", bn: "" }, duration: 30, portfolio_service_id: "", status: "published", order: services.length + 1 })}>
          {t(PT.addNew)}
        </Button>
      </div>
      <DataTable
        rows={services}
        searchKeys={["name"]}
        emptyTitle={t({ en: "No appointment services.", bn: "কোনো অ্যাপয়েন্টমেন্ট সার্ভিস নেই।" })}
        columns={[
          { key: "name", label: t(PT.services), render: (s) => <span className="font-bold text-ink-900">{s.name?.en}</span> },
          { key: "duration", label: t({ en: "Duration", bn: "সময়কাল" }), render: (s) => <span className="text-ink-500">{s.duration} min</span> },
          { key: "portfolio_service_id", label: t({ en: "Central ID", bn: "সেন্ট্রাল আইডি" }), render: (s) => <span className="font-mono text-xs text-ink-400">{s.portfolio_service_id || "—"}</span> },
          { key: "status", label: t(PT.status), render: (s) => <StatusBadge status={s.status === "published" ? "active" : "cancelled"} /> },
          { key: "action", label: "", render: (s) => (
            <div className="flex gap-2">
              <button onClick={() => setEditing({ ...s })} className="text-brand-600 font-bold text-xs">{t(PT.edit)}</button>
              <button onClick={() => { update("appointment_services", s.id, { status: "trashed" }); logAction(user!.email, "appointment_service_delete", s.name?.en); }} className="text-red-500 font-bold text-xs">{t(PT.delete)}</button>
            </div>
          ) },
        ]}
      />
    </div>
  );
}

/* ──────────────────── ADMIN: INTEGRATION SETTINGS ──────────── */

export function AdminAppointmentSettingsView() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const settings = getSettings();
  const [cfg, setCfg] = useState<any>({ ...(settings.appointment || {}) });
  const [busy, setBusy] = useState(false);

  const test = async () => {
    setBusy(true);
    const r = await testAppointmentConnection();
    setBusy(false);
    setSetting("appointment", { ...cfg, lastCheck: nowISO(), connected: r.ok });
    if (r.ok) {
      logAction(user!.email, "appointment_test", "connection ok");
      toast({ type: "success", title: t(PT.connected), desc: r.desc });
    } else {
      logAction(user!.email, "appointment_test", `connection failed: ${r.desc}`);
      toast({ type: "error", title: t(PT.notConnected), desc: r.desc });
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white border border-ink-100 shadow-soft p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="font-display font-bold text-lg text-ink-900">{t(PT.appointmentIntegration)}</h3>
          <span className={cn("inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold border", cfg.connected ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-ink-50 text-ink-500 border-ink-200")}>
            <span className={cn("w-2 h-2 rounded-full", cfg.connected ? "bg-emerald-500" : "bg-ink-300")} />
            {cfg.connected ? `✓ ${t(PT.connected)}` : t(PT.notConnected)}
          </span>
        </div>
        <p className="text-xs text-ink-400 mb-5">{t(PT.proxyNote)}</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex items-end pb-1 gap-5">
            <label className="flex items-center gap-2 text-sm font-semibold text-ink-700">
              <input type="checkbox" className="w-4 h-4 accent-brand-600" checked={!!cfg.enabled} onChange={(e) => setCfg({ ...cfg, enabled: e.target.checked })} />
              {t(PT.appointmentOn)}
            </label>
          </div>
          <Field label={t({ en: "Timeout (ms)", bn: "টাইমআউট (ms)" })}><input type="number" className={inputCls} value={cfg.timeout || 15000} onChange={(e) => setCfg({ ...cfg, timeout: Number(e.target.value) })} /></Field>
          <div className="sm:col-span-2">
            <Field label={t(PT.proxyUrl)}>
              <input type="password" className={inputCls} placeholder="https://alkhubaibit.com/api/appointments" value={cfg.proxyUrl || ""} onChange={(e) => setCfg({ ...cfg, proxyUrl: e.target.value })} />
            </Field>
          </div>
          <Field label={t(PT.apiKey)}><input type="password" className={inputCls} placeholder="****************" value={cfg.apiKey || ""} onChange={(e) => setCfg({ ...cfg, apiKey: e.target.value })} /></Field>
          <Field label={t(PT.apiSecret)}><input type="password" className={inputCls} placeholder="****************" value={cfg.apiSecret || ""} onChange={(e) => setCfg({ ...cfg, apiSecret: e.target.value })} /></Field>
        </div>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Button onClick={test}>
            {busy ? <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : <Icon name="zap" className="w-4 h-4" />}
            {t(PT.testConnection)}
          </Button>
          <Button variant="secondary" onClick={() => { setSetting("appointment", { ...cfg, connected: null, lastCheck: null }); logAction(user!.email, "appointment_settings_save", "settings"); toast({ type: "success", title: t({ en: "Settings saved", bn: "সেটিংস সংরক্ষণ হয়েছে" }) }); }}>
            {t(PT.save)}
          </Button>
        </div>
        {cfg.lastCheck && (
          <p className="mt-3 text-xs text-ink-400">
            {t({ en: "Last check:", bn: "সর্বশেষ পরীক্ষা:" })} {fmtDateTime(cfg.lastCheck, "en")} · {cfg.connected ? t(PT.connected) : t(PT.notConnected)}
          </p>
        )}
      </div>
      <AdminApiLogsView />
    </div>
  );
}
