"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import type { Locale } from "@/lib/i18n/translations"
import { translations } from "@/lib/i18n/translations"

const STORAGE_KEY = "ailum-locale"

type LanguageContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (typeof translations)["pt"]
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("pt")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null
    if (stored === "en" || stored === "pt") setLocaleState(stored)
    setMounted(true)
  }, [])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, next)
  }, [])

  const t = translations[locale]

  if (!mounted) {
    return (
      <LanguageContext.Provider value={{ locale: "pt", setLocale, t: translations.pt }}>
        {children}
      </LanguageContext.Provider>
    )
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider")
  return ctx
}
