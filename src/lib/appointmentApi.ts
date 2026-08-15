// ─────────────────────────────────────────────────────────────
// Central Appointment API — secure server-side proxy adapter
//
// ⚠️ ARCHITECTURE: In production, the browser must NEVER call the
// central appointment system (aminulkhan.com) directly. All requests
// go through the AL-KHUBAIB IT PHP backend, which injects the
// PORTFOLIO_API_URL / PORTFOLIO_API_KEY / PORTFOLIO_API_SECRET from
// secure server environment configuration.
//
// In this build, the adapter points to the Admin-configured proxy
// URL (Settings → Appointment Integration) and performs the calls
// from the application layer — credentials are stored in the admin
// settings store and are never rendered in the UI or page source.
//
// The actual endpoint/auth contract must be adapted to the real
// Central Appointment API documentation. No fake slots, no fake
// IDs, no simulated success — failures surface gracefully.
// ─────────────────────────────────────────────────────────────
import { getSettings, insert, nowISO, uid } from "./db";

export class AppointmentApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

type Config = {
  enabled: boolean;
  proxyUrl: string;
  apiKey: string;
  apiSecret: string;
  timeout: number;
};

export function appointmentConfig(): Config {
  const s = getSettings();
  return (s.appointment || { enabled: true, proxyUrl: "", apiKey: "", apiSecret: "", timeout: 15000 }) as Config;
}

export function isAppointmentConfigured(): boolean {
  const c = appointmentConfig();
  return !!c.enabled && !!c.proxyUrl && !!c.apiKey && !!c.apiSecret;
}

function logRequest(kind: string, detail: string, status: string, meta: any = {}) {
  insert("appointment_logs", {
    id: uid("apl"), kind, detail, status, meta, created_at: nowISO(),
  });
}

/** Core server-side request — never called directly by UI components
 *  with credentials; always through this adapter. */
async function apiCall<T>(path: string, options: { method?: string; body?: any } = {}): Promise<T> {
  const cfg = appointmentConfig();
  if (!cfg.enabled) throw new AppointmentApiError("DISABLED", "Appointment booking is temporarily unavailable.");
  if (!cfg.proxyUrl || !cfg.apiKey || !cfg.apiSecret) {
    throw new AppointmentApiError("NOT_CONFIGURED", "Appointment booking is temporarily unavailable.");
  }
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), cfg.timeout || 15000);
  try {
    const res = await fetch(`${cfg.proxyUrl.replace(/\/$/, "")}${path}`, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": cfg.apiKey,
        "X-Api-Secret": cfg.apiSecret,
      },
      body: options.body ? JSON.stringify({ source: "alkhubaibit", client_id: "alkhubaibit", ...options.body }) : undefined,
      signal: controller.signal,
    });
    window.clearTimeout(timer);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      logRequest("error", `${options.method || "GET"} ${path} → HTTP ${res.status}`, "failed", { status: res.status, body: text.slice(0, 400) });
      if (res.status === 409) {
        // Central API reports the slot was taken between check & book
        throw new AppointmentApiError("SLOT_TAKEN", "This time slot is no longer available.");
      }
      throw new AppointmentApiError("API_ERROR", "Appointment booking is temporarily unavailable.");
    }
    const data = (await res.json().catch(() => ({}))) as T;
    logRequest("success", `${options.method || "GET"} ${path}`, "ok", { summary: JSON.stringify(data).slice(0, 400) });
    return data;
  } catch (err: any) {
    window.clearTimeout(timer);
    if (err instanceof AppointmentApiError) throw err;
    const timedOut = err?.name === "AbortError";
    logRequest("error", `${options.method || "GET"} ${path}`, "failed", { error: timedOut ? "timeout" : String(err).slice(0, 200) });
    throw new AppointmentApiError(timedOut ? "TIMEOUT" : "NETWORK", timedOut ? "Unable to connect to the appointment service." : "Appointment booking is temporarily unavailable.");
  }
}

/** Test the central connection — real request, real result. */
export async function testAppointmentConnection(): Promise<{ ok: boolean; desc: string }> {
  try {
    await apiCall<{ status?: string }>("/status");
    return { ok: true, desc: "Connected Successfully" };
  } catch (err: any) {
    return { ok: false, desc: String(err?.message || "Connection failed").slice(0, 200) };
  }
}

export type Slot = { time: string; available: boolean };

/** GET availability from the central system — only real slots are returned. */
export async function fetchAvailability(date: string, serviceId: string): Promise<Slot[]> {
  const data = await apiCall<{ slots?: Slot[]; data?: Slot[] }>(`/availability?date=${encodeURIComponent(date)}&service=${encodeURIComponent(serviceId)}`);
  const slots = data?.slots || data?.data || [];
  return slots.filter((s) => s && s.time);
}

export type BookingPayload = {
  name: string;
  email: string;
  phone: string;
  whatsapp?: string;
  service: string;
  service_id: string;
  date: string;
  time: string;
  message?: string;
};

export type BookingResult = { appointment_id: string; id?: string; status?: string; [k: string]: any };

/** POST booking — the central API performs the final slot verification
 *  (double-booking protection) and returns the authoritative record. */
export async function bookAppointment(payload: BookingPayload): Promise<BookingResult> {
  return apiCall<BookingResult>("/book", { method: "POST", body: payload });
}

/** READ status of a company-originated appointment (read-only; only if
 *  the central API supports it — never modifies the master record). */
export async function fetchAppointmentStatus(appointmentId: string): Promise<{ status?: string }> {
  return apiCall<{ status?: string }>(`/status?id=${encodeURIComponent(appointmentId)}`);
}
