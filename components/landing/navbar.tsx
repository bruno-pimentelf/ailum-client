"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { List, X } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"

const navLinks = [
  { label: "Produto", href: "#produto" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Recursos", href: "#recursos" },
  { label: "Lista de espera", href: "#waitlist" },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

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
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="relative text-[13px] text-muted-foreground transition-colors duration-300 hover:text-foreground group"
            >
              {link.label}
              {/* Animated underline */}
              <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-accent transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" size="sm" asChild className="text-[13px] text-muted-foreground hover:text-foreground hover:bg-transparent h-8 transition-all duration-300">
            <a href="/login">Entrar</a>
          </Button>
          <Button size="sm" asChild className="group relative h-8 rounded-lg bg-accent px-4 text-[13px] font-medium text-accent-foreground hover:bg-accent/90 transition-all duration-300 overflow-hidden">
            <a href="https://form.typeform.com/to/d4xLz0DX" target="_blank" rel="noopener noreferrer">
              <motion.span
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
              />
              <span className="relative z-10">Aplicar-se</span>
            </a>
          </Button>
        </div>

        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
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
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.label}
                  initial={{ x: -12, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                >
                  <Link
                    href={link.href}
                    className="block py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-border mt-2">
                <Button variant="ghost" size="sm" asChild className="justify-start text-muted-foreground">
                  <a href="/login" onClick={() => setMobileOpen(false)}>Entrar</a>
                </Button>
                <Button size="sm" asChild className="w-full bg-accent text-accent-foreground rounded-lg">
                  <a href="https://form.typeform.com/to/d4xLz0DX" target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)}>Aplicar-se</a>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
