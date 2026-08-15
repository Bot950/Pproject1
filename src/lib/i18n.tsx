import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Lang = "en" | "bn";

/** A bilingual string pair. */
export type L10n = { en: string; bn: string };

const STORAGE_KEY = "akit-language";

type I18nCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  /** Returns the string for the active language. */
  t: (x: L10n) => string;
  /** Builds a WhatsApp deep link with a language-aware message. */
  wa: (message: L10n) => string;
};

const Ctx = createContext<I18nCtx | null>(null);

function detectInitial(): Lang {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "bn") return stored;
    const nav = navigator.language || (navigator as { userLanguage?: string }).userLanguage || "";
    if (nav.toLowerCase().startsWith("bn")) return "bn";
  } catch {
    /* storage unavailable */
  }
  return "en";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectInitial);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const toggleLang = useCallback(() => setLangState((p) => (p === "en" ? "bn" : "en")), []);

  // Persist + keep <html lang> and Bangla typography in sync
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
    const root = document.documentElement;
    root.lang = lang === "bn" ? "bn" : "en";
    root.classList.toggle("lang-bn", lang === "bn");
  }, [lang]);

  const t = useCallback((x: L10n) => (lang === "bn" ? x.bn : x.en), [lang]);

  const wa = useCallback(
    (message: L10n) => {
      const text = lang === "bn" ? message.bn : message.en;
      return `https://wa.me/8801926100643?text=${encodeURIComponent(text)}`;
    },
    [lang]
  );

  return <Ctx.Provider value={{ lang, setLang, toggleLang, t, wa }}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used inside <LanguageProvider>");
  return ctx;
}

/** Shorthand to build an L10n pair. */
export const L = (en: string, bn: string): L10n => ({ en, bn });
