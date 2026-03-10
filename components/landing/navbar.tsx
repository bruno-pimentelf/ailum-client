"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { List, X, CaretDown, Check } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/components/providers/language-provider"

const locales = [
  { code: "pt" as const, label: "Português", flag: "/brasil.png", alt: "Brasil" },
  { code: "en" as const, label: "English", flag: "/usa.webp", alt: "USA" },
]

const navItems = [
  { key: "produto" as const, href: "#produto" },
  { key: "comoFunciona" as const, href: "#como-funciona" },
  { key: "recursos" as const, href: "#recursos" },
  { key: "listaEspera" as const, href: "#waitlist" },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { t, locale, setLocale } = useLanguage()

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-2xl border-b border-border/50"
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 h-14">
        <Link href="/" className="flex items-center group">
          <span
            className="text-lg font-bold tracking-[0.35em] text-foreground transition-opacity duration-300 group-hover:opacity-80"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            A I L U M
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="relative text-[13px] text-muted-foreground transition-colors duration-300 hover:text-foreground group"
            >
              {t.nav[item.key]}
              {/* Animated underline */}
              <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-accent transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="group flex items-center gap-2 h-9 pl-2.5 pr-2 rounded-xl border border-border/80 bg-card/40 text-foreground hover:bg-card/70 hover:border-accent/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:ring-offset-2 focus:ring-offset-background data-[state=open]:border-accent/40 data-[state=open]:bg-card/80"
                aria-label="Select language"
              >
                <div className="relative h-5 w-6 rounded overflow-hidden shrink-0 ring-1 ring-black/5">
                  <Image
                    src={locale === "pt" ? "/brasil.png" : "/usa.webp"}
                    alt={locale === "pt" ? "Brasil" : "USA"}
                    fill
                    className="object-cover"
                    sizes="24px"
                  />
                </div>
                <span className="text-[12px] font-medium">{locales.find((l) => l.code === locale)?.label}</span>
                <CaretDown className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px] p-1.5 rounded-xl border-border/80 bg-card/95 backdrop-blur-xl shadow-xl shadow-black/10">
              {locales.map((loc) => (
                <DropdownMenuItem
                  key={loc.code}
                  onClick={() => setLocale(loc.code)}
                  className="flex items-center gap-3 h-10 px-3 rounded-lg cursor-pointer focus:bg-accent/10 focus:text-accent-foreground data-[highlighted]:bg-accent/10"
                >
                  <div className="relative h-5 w-6 rounded overflow-hidden shrink-0 ring-1 ring-black/5">
                    <Image
                      src={loc.flag}
                      alt={loc.alt}
                      fill
                      className="object-cover"
                      sizes="24px"
                    />
                  </div>
                  <span className="flex-1 text-[13px] font-medium">{loc.label}</span>
                  {locale === loc.code && (
                    <Check className="h-3.5 w-3.5 text-accent shrink-0" weight="bold" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="sm" asChild className="text-[13px] text-muted-foreground hover:text-foreground hover:bg-transparent h-8 transition-all duration-300">
            <a href="/login">{t.nav.entrar}</a>
          </Button>
          <Button size="sm" asChild className="group relative h-8 rounded-lg bg-accent px-4 text-[13px] font-medium text-accent-foreground hover:bg-accent/90 transition-all duration-300 overflow-hidden">
            <a href="https://form.typeform.com/to/d4xLz0DX" target="_blank" rel="noopener noreferrer">
              <motion.span
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
              />
              <span className="relative z-10">{t.nav.aplicarSe}</span>
            </a>
          </Button>
        </div>

        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? t.nav.fecharMenu : t.nav.abrirMenu}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <List className="h-5 w-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
            className="overflow-hidden border-t border-border bg-background/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {navItems.map((item, i) => (
                <motion.div
                  key={item.key}
                  initial={{ x: -12, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                >
                  <Link
                    href={item.href}
                    className="block py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t.nav[item.key]}
                  </Link>
                </motion.div>
              ))}
              <div className="flex items-center gap-2 pt-4 border-t border-border mt-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex items-center gap-2 h-9 pl-2.5 pr-2 rounded-xl border border-border/80 bg-card/40 text-foreground w-full justify-between"
                      aria-label="Select language"
                    >
                      <div className="flex items-center gap-2">
                        <div className="relative h-5 w-6 rounded overflow-hidden shrink-0 ring-1 ring-black/5">
                          <Image
                            src={locale === "pt" ? "/brasil.png" : "/usa.webp"}
                            alt={locale === "pt" ? "Brasil" : "USA"}
                            fill
                            className="object-cover"
                            sizes="24px"
                          />
                        </div>
                        <span className="text-[12px] font-medium">{locales.find((l) => l.code === locale)?.label}</span>
                      </div>
                      <CaretDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[160px] p-1.5 rounded-xl">
                    {locales.map((loc) => (
                      <DropdownMenuItem
                        key={loc.code}
                        onClick={() => { setLocale(loc.code); setMobileOpen(false) }}
                        className="flex items-center gap-3 h-10 px-3 rounded-lg"
                      >
                        <div className="relative h-5 w-6 rounded overflow-hidden shrink-0 ring-1 ring-black/5">
                          <Image src={loc.flag} alt={loc.alt} fill className="object-cover" sizes="24px" />
                        </div>
                        <span className="flex-1 text-[13px] font-medium">{loc.label}</span>
                        {locale === loc.code && <Check className="h-3.5 w-3.5 text-accent" weight="bold" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="ghost" size="sm" asChild className="justify-start text-muted-foreground flex-1">
                  <a href="/login" onClick={() => setMobileOpen(false)}>{t.nav.entrar}</a>
                </Button>
                <Button size="sm" asChild className="w-full bg-accent text-accent-foreground rounded-lg">
                  <a href="https://form.typeform.com/to/d4xLz0DX" target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)}>{t.nav.aplicarSe}</a>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
