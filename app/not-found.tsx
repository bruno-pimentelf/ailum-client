"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { House, ArrowLeft } from "@phosphor-icons/react"

const ease = [0.33, 1, 0.68, 1] as const

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background overflow-hidden px-6">
      {/* Subtle radial glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-accent/[0.04] blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
        className="relative z-10 flex flex-col items-center text-center"
      >
        {/* 404 number */}
        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease }}
          className="font-display text-[120px] sm:text-[160px] font-bold leading-none tracking-tight text-foreground/[0.06] select-none"
        >
          404
        </motion.p>

        {/* Content overlapping the number */}
        <div className="-mt-10 sm:-mt-14 space-y-4">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Pagina nao encontrada
          </h1>
          <p className="text-[14px] leading-relaxed text-muted-foreground max-w-sm mx-auto">
            O endereco que voce acessou nao existe ou foi movido. Verifique a URL ou volte para o inicio.
          </p>
        </div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease }}
          className="mt-8 flex flex-col sm:flex-row items-center gap-3"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-[13px] font-semibold text-accent-foreground shadow-sm transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <House className="h-4 w-4" weight="bold" />
            Ir para o inicio
          </Link>
          <button
            onClick={() => {
              if (typeof window !== "undefined") window.history.back()
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-card/50 px-5 py-2.5 text-[13px] font-medium text-muted-foreground transition-all hover:text-foreground hover:bg-card cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
        </motion.div>
      </motion.div>

      {/* Brand */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4, ease }}
        className="absolute bottom-8 text-center"
      >
        <Link href="/" className="inline-flex items-center">
          <span className="font-display text-[10px] font-bold tracking-[0.3em] text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors">
            AILUM
          </span>
        </Link>
      </motion.div>
    </div>
  )
}
