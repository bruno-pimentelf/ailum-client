"use client"

import { motion } from "framer-motion"
import { ArrowRight } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { FadeIn } from "./motion"
import { useLanguage } from "@/components/providers/language-provider"

export function CTA() {
  const { t } = useLanguage()
  return (
    <section className="relative border-t border-border overflow-hidden">
      {/* Animated background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/[0.04] rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
        <FadeIn className="mx-auto max-w-xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {t.cta.pronto}{" "}
            <span className="font-display italic text-accent">{t.cta.iluminar}</span>
            {" "}{t.cta.suaClinica}
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
            {t.cta.faleEspecialista}
          </p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.33, 1, 0.68, 1] }}
            className="mt-8 flex items-center justify-center"
          >
            <Button size="lg" asChild className="group relative h-11 rounded-lg bg-accent px-8 text-sm font-medium text-accent-foreground hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/20 transition-all duration-300 overflow-hidden">
              <a href="https://form.typeform.com/to/d4xLz0DX" target="_blank" rel="noopener noreferrer">
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
                />
                <span className="relative z-10 flex items-center">
                  {t.cta.aplicarSe}
                  <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
              </a>
            </Button>
          </motion.div>
        </FadeIn>
      </div>
    </section>
  )
}
