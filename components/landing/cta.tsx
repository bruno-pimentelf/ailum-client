"use client"

import { motion } from "framer-motion"
import { ArrowUpRight } from "@phosphor-icons/react"
import { FadeIn } from "./motion"
import { useLanguage } from "@/components/providers/language-provider"

const ease = [0.32, 0.72, 0, 1] as const

export function CTA() {
  const { t } = useLanguage()
  return (
    <section className="relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/[0.04] rounded-full blur-[150px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-32 md:py-44">
        <FadeIn className="max-w-3xl">
          <h2 className="font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl leading-[1.05]">
            {t.cta.pronto}
            <br />
            <span className="text-accent">{t.cta.iluminar}</span>{" "}
            <span className="text-accent">{t.cta.suaClinica}</span>
          </h2>

          <p className="mt-7 max-w-lg text-[15px] leading-relaxed text-white/35">
            {t.cta.faleEspecialista}
          </p>

          <motion.div
            initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, delay: 0.2, ease }}
            className="mt-10"
          >
            <a
              href="https://form.typeform.com/to/d4xLz0DX"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex items-center gap-3 h-14 rounded-full bg-white pl-7 pr-2 text-[15px] font-semibold text-zinc-950 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_0_50px_rgba(0,181,212,0.2)] active:scale-[0.97]"
            >
              <span>{t.cta.aplicarSe}</span>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-950/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105 group-hover:bg-zinc-950/15">
                <ArrowUpRight className="h-4 w-4" weight="bold" />
              </span>
            </a>
          </motion.div>
        </FadeIn>
      </div>
    </section>
  )
}
