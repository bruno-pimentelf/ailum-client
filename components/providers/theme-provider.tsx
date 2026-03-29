"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"

export type Theme = "light" | "dark" | "system"

const STORAGE_KEY = "ailum-theme"

type ThemeContextValue = {
  theme: Theme
  resolvedTheme: "light" | "dark"
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function applyTheme(resolved: "light" | "dark") {
  const root = document.documentElement
  if (resolved === "dark") {
    root.classList.add("dark")
  } else {
    root.classList.remove("dark")
  }
}

export function ThemeProvider({ children, defaultTheme = "dark", forcedTheme }: {
  children: React.ReactNode
  defaultTheme?: Theme
  forcedTheme?: "light" | "dark"
}) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [mounted, setMounted] = useState(false)

  // Resolve the effective theme (handles "system" preference)
  const resolvedTheme: "light" | "dark" = forcedTheme
    ? forcedTheme
    : theme === "system"
      ? (mounted ? getSystemTheme() : "dark")
      : theme

  // On mount: read from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored === "light" || stored === "dark" || stored === "system") {
      setThemeState(stored)
    }
    setMounted(true)
  }, [])

  // Apply theme class whenever resolved theme changes
  useEffect(() => {
    if (!mounted) return
    applyTheme(forcedTheme ?? resolvedTheme)
  }, [mounted, resolvedTheme, forcedTheme])

  // Listen for system preference changes
  useEffect(() => {
    if (theme !== "system" || !mounted) return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => applyTheme(mq.matches ? "dark" : "light")
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [theme, mounted])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, next)
  }, [])

  // Pre-mount: render with default to avoid flash
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: defaultTheme, resolvedTheme: "dark", setTheme }}>
        {children}
      </ThemeContext.Provider>
    )
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}
