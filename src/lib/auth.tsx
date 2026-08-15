import React, { createContext, useContext, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  all, get, insert, where, uid, hashPassword, verifyPassword,
  ensureSeed, useDbVersion, logAction, getSettings,
} from "./db";
import type { Row } from "./db";

const SESSION_KEY = "akit_session";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: "super_admin" | "admin" | "client" | "affiliate";
  status: string;
};

type AuthCtx = {
  ready: boolean;
  user: SessionUser | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (data: { name: string; email: string; mobile: string; password: string }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  refresh: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

function attemptKey(email: string) {
  return `akit_login_${email.trim().toLowerCase()}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [sessionId, setSessionId] = useState<string>(() => {
    try {
      return localStorage.getItem(SESSION_KEY) || "";
    } catch {
      return "";
    }
  });
  useDbVersion();

  useEffect(() => {
    let mounted = true;
    ensureSeed().then(() => {
      if (mounted) setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const user: SessionUser | null = sessionId ? (get("users", sessionId) as SessionUser | undefined) || null : null;

  const refresh = () => {
    try {
      setSessionId(localStorage.getItem(SESSION_KEY) || "");
    } catch {
      /* ignore */
    }
  };

  const login: AuthCtx["login"] = async (email, password) => {
    const settings = getSettings();
    const maxAttempts = settings.security?.maxLoginAttempts ?? 5;
    const lockMinutes = settings.security?.lockMinutes ?? 5;
    const key = attemptKey(email);
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const a = JSON.parse(raw);
        if (a.until && Date.now() < a.until) {
          const mins = Math.ceil((a.until - Date.now()) / 60000);
          return { ok: false, error: `Too many failed attempts. Try again in ${mins} minute(s).` };
        }
      }
    } catch { /* ignore */ }

    const rec = all("users").find((u) => String(u.email).toLowerCase() === email.trim().toLowerCase());
    if (!rec || rec.status !== "active") {
      return { ok: false, error: "Invalid email or password." };
    }
    const valid = await verifyPassword(password, rec.salt, rec.hash);
    if (!valid) {
      try {
        const raw = localStorage.getItem(key);
        const prev = raw ? JSON.parse(raw) : { fails: 0 };
        const fails = (prev.fails || 0) + 1;
        const until = fails >= maxAttempts ? Date.now() + lockMinutes * 60000 : prev.until || 0;
        localStorage.setItem(key, JSON.stringify({ fails, until }));
      } catch { /* ignore */ }
      return { ok: false, error: "Invalid email or password." };
    }
    try {
      localStorage.removeItem(key);
      localStorage.setItem(SESSION_KEY, rec.id);
    } catch { /* ignore */ }
    setSessionId(rec.id);
    logAction(rec.email, "login", `User logged in`);
    return { ok: true };
  };

  const register: AuthCtx["register"] = async ({ name, email, mobile, password }) => {
    const exists = all("users").find((u) => String(u.email).toLowerCase() === email.trim().toLowerCase());
    if (exists) return { ok: false, error: "An account with this email already exists." };
    const salt = uid("s");
    const hash = await hashPassword(password, salt);
    const u = insert("users", {
      name, email: email.trim(), mobile, role: "client",
      salt, hash, status: "active",
    });
    try {
      localStorage.setItem(SESSION_KEY, u.id);
    } catch { /* ignore */ }
    setSessionId(u.id);
    logAction(u.email, "register", "New client registered");
    return { ok: true };
  };

  const logout = () => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch { /* ignore */ }
    setSessionId("");
  };

  return <Ctx.Provider value={{ ready, user, login, register, logout, refresh }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

/* ── Route guards ──────────────────────────────────────────── */

export function Require({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: Array<"super_admin" | "admin" | "client" | "affiliate">;
}) {
  const { ready, user } = useAuth();
  const location = useLocation();
  if (!ready) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span className="w-8 h-8 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === "client" ? "/dashboard" : user.role === "affiliate" ? "/affiliate" : "/"} replace />;
  }
  return <>{children}</>;
}

/* ── Affiliate status helpers ──────────────────────────────── */
export function affiliateProfile(userId: string): Row | undefined {
  return where("affiliate_profiles", (r) => r.user_id === userId)[0];
}
export function affiliateApplication(userId: string): Row | undefined {
  return where("affiliate_applications", (r) => r.user_id === userId)[0];
}
export function affiliateKyc(userId: string): Row | undefined {
  return where("affiliate_kyc", (r) => r.user_id === userId)[0];
}
