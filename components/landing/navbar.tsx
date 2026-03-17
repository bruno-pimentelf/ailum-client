"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from "framer-motion"
import { List, X, CaretDown, Check, ArrowUpRight } from "@phosphor-icons/react"
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
]

const spring = { type: "spring" as const, stiffness: 400, damping: 30 }
const ease = [0.32, 0.72, 0, 1] as const

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { t, locale, setLocale } = useLanguage()
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)

  useMotionValueEvent(scrollY, "change", (v) => {
    setScrolled(v > 40)
  })

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease }}
        className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4 md:pt-5"
      >
        <nav
          className={`flex items-center gap-1 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            scrolled
              ? "rounded-full border border-white/[0.08] bg-zinc-950/70 backdrop-blur-2xl px-2 py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]"
              : "rounded-full border border-transparent bg-transparent px-2 py-1.5"
          }`}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center px-3 py-1.5 group">
            <span className="text-sm font-display font-bold tracking-[0.3em] text-foreground transition-opacity duration-300 group-hover:opacity-70">
              AILUM
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden items-center md:flex">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="relative px-4 py-2 text-[13px] font-medium text-white/40 transition-colors duration-300 hover:text-white/80"
              >
                {t.nav[item.key]}
              </Link>
            ))}
          </div>

          {/* Desktop right side */}
          <div className="hidden items-center gap-1.5 ml-2 md:flex">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="group flex items-center gap-1.5 h-8 px-2.5 rounded-full text-white/40 hover:text-white/70 transition-all duration-300 focus:outline-none"
                  aria-label="Select language"
                  suppressHydrationWarning
                >
                  <div className="relative h-4 w-5 rounded-sm overflow-hidden shrink-0 ring-1 ring-white/10">
                    <Image
                      src={locale === "pt" ? "/brasil.png" : "/usa.webp"}
                      alt={locale === "pt" ? "Brasil" : "USA"}
                      fill
                      className="object-cover"
                      sizes="20px"
                    />
                  </div>
                  <CaretDown className="h-3 w-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="min-w-[160px] p-1.5 rounded-2xl border-white/[0.08] bg-zinc-950/95 backdrop-blur-2xl shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
              >
                {locales.map((loc) => (
                  <DropdownMenuItem
                    key={loc.code}
                    onClick={() => setLocale(loc.code)}
                    className="flex items-center gap-3 h-10 px-3 rounded-xl cursor-pointer focus:bg-white/[0.05]"
                  >
                    <div className="relative h-4 w-5 rounded-sm overflow-hidden shrink-0 ring-1 ring-white/10">
                      <Image
                        src={loc.flag}
                        alt={loc.alt}
                        fill
                        className="object-cover"
                        sizes="20px"
                      />
                    </div>
                    <span className="flex-1 text-[13px] font-medium text-white/70">{loc.label}</span>
                    {locale === loc.code && (
                      <Check className="h-3.5 w-3.5 text-accent shrink-0" weight="bold" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              href="/login"
              className="px-4 py-2 text-[13px] font-medium text-white/40 hover:text-white/80 transition-colors duration-300"
            >
              {t.nav.entrar}
            </Link>

            <a
              href="https://form.typeform.com/to/d4xLz0DX"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-shimmer group relative overflow-hidden flex items-center gap-2 h-9 rounded-full border border-white/10 bg-white/[0.04] px-4 text-[13px] font-semibold text-white/75 shadow-[0_0_12px_rgba(0,181,212,0.05)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-accent/25 hover:bg-accent/[0.07] hover:text-white hover:shadow-[0_0_20px_rgba(0,181,212,0.12)] active:scale-[0.97]"
            >
              <span>{t.nav.aplicarSe}</span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/50 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105 group-hover:border-accent/20 group-hover:text-accent">
                <ArrowUpRight className="h-3 w-3" />
              </span>
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex items-center justify-center h-9 w-9 rounded-full text-white/60 hover:text-white hover:bg-white/[0.05] transition-all duration-300 ml-1"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? t.nav.fecharMenu : t.nav.abrirMenu}
          >
            <div className="relative h-4 w-4">
              <motion.span
                animate={mobileOpen ? { rotate: 45, y: 0 } : { rotate: 0, y: -4 }}
                transition={spring}
                className="absolute left-0 top-1/2 block h-[1.5px] w-4 bg-current origin-center"
              />
              <motion.span
                animate={mobileOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.2 }}
                className="absolute left-0 top-1/2 block h-[1.5px] w-4 bg-current origin-center"
              />
              <motion.span
                animate={mobileOpen ? { rotate: -45, y: 0 } : { rotate: 0, y: 4 }}
                transition={spring}
                className="absolute left-0 top-1/2 block h-[1.5px] w-4 bg-current origin-center"
              />
            </div>
          </button>
        </nav>
      </motion.header>

      {/* Full-screen mobile menu overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease }}
            className="fixed inset-0 z-40 bg-zinc-950/95 backdrop-blur-3xl md:hidden"
          >
            <div className="flex flex-col items-center justify-center h-full gap-2 px-8">
              {navItems.map((item, i) => (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 24 }}
                  transition={{ delay: 0.1 + i * 0.06, duration: 0.5, ease }}
                >
                  <Link
                    href={item.href}
                    className="block py-3 text-2xl font-display font-semibold tracking-tight text-white/60 hover:text-white transition-colors duration-300"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t.nav[item.key]}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                transition={{ delay: 0.35, duration: 0.5, ease }}
                className="flex flex-col items-center gap-4 mt-8 w-full max-w-xs"
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex items-center gap-2 h-10 px-4 rounded-full border border-white/[0.08] bg-white/[0.03] text-white/50 w-full justify-center"
                      aria-label="Select language"
                    >
                      <div className="relative h-4 w-5 rounded-sm overflow-hidden shrink-0 ring-1 ring-white/10">
                        <Image
                          src={locale === "pt" ? "/brasil.png" : "/usa.webp"}
                          alt={locale === "pt" ? "Brasil" : "USA"}
                          fill
                          className="object-cover"
                          sizes="20px"
                        />
                      </div>
                      <span className="text-[13px] font-medium">{locales.find((l) => l.code === locale)?.label}</span>
                      <CaretDown className="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="min-w-[200px] p-1.5 rounded-2xl border-white/[0.08] bg-zinc-950/95 backdrop-blur-2xl">
                    {locales.map((loc) => (
                      <DropdownMenuItem
                        key={loc.code}
                        onClick={() => { setLocale(loc.code); setMobileOpen(false) }}
                        className="flex items-center gap-3 h-10 px-3 rounded-xl"
                      >
                        <div className="relative h-4 w-5 rounded-sm overflow-hidden shrink-0 ring-1 ring-white/10">
                          <Image src={loc.flag} alt={loc.alt} fill className="object-cover" sizes="20px" />
                        </div>
                        <span className="flex-1 text-[13px] font-medium text-white/70">{loc.label}</span>
                        {locale === loc.code && <Check className="h-3.5 w-3.5 text-accent" weight="bold" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <a
                  href="https://form.typeform.com/to/d4xLz0DX"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cta-shimmer relative overflow-hidden flex items-center justify-center gap-2 h-12 w-full rounded-full border border-accent/30 bg-accent/[0.08] text-white text-base font-semibold shadow-[0_0_24px_rgba(0,181,212,0.12)] transition-all duration-300 active:scale-[0.97]"
                  onClick={() => setMobileOpen(false)}
                >
                  {t.nav.aplicarSe}
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
