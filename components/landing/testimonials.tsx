"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useLanguage } from "@/components/providers/language-provider"
import { FadeIn } from "./motion"

const ease = [0.32, 0.72, 0, 1] as const
const INTERVAL_MS = 5500

export function Testimonials() {
  const { t } = useLanguage()
  const quotes = t.testimonials.quotes
  const [active, setActive] = useState(0)
  const [direction, setDirection] = useState(1)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const go = useCallback(
    (next: number, dir: number) => {
      setDirection(dir)
      setActive((next + quotes.length) % quotes.length)
    },
    [quotes.length]
  )

  const restart = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      go(active + 1, 1)
    }, INTERVAL_MS)
  }, [active, go])

  useEffect(() => {
    restart()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [restart])

  const variants = {
    enter: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? 40 : -40,
      filter: "blur(8px)",
    }),
    center: {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
    },
    exit: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? -40 : 40,
      filter: "blur(8px)",
    }),
  }

  return (
    <section className="relative py-28 md:py-36 overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[40rem] w-[60rem] rounded-full bg-accent/[0.03] blur-[120px]" />
      </div>

      <div className="mx-auto max-w-4xl px-6">
        {/* Header */}
        <FadeIn direction="up" className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3.5 py-1.5 mb-6">
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-accent">
              {t.testimonials.tag}
            </span>
          </div>
        </FadeIn>

        {/* Quote carousel */}
        <FadeIn delay={0.15} direction="none" className="relative flex flex-col items-center w-full">
          {/* Large decorative quote mark */}
          <div
            className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 select-none font-display text-[9rem] leading-none text-white/[0.03]"
            aria-hidden
          >
            &ldquo;
          </div>

          {/* Quote text */}
          <div className="relative w-full flex items-center justify-center min-h-[6rem] sm:min-h-[8rem]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.blockquote
                key={active}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.6, ease }}
                className="text-center w-full"
              >
                <p className="font-display text-lg sm:text-xl md:text-2xl lg:text-[1.65rem] font-medium tracking-tight leading-[1.35] text-white/88 max-w-2xl mx-auto">
                  &ldquo;{quotes[active].text}&rdquo;
                </p>
              </motion.blockquote>
            </AnimatePresence>
          </div>

          {/* Author */}
          <div className="relative h-12 w-full flex items-center justify-center mt-4">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`author-${active}`}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.6, delay: 0.05, ease }}
                className="absolute flex flex-col items-center gap-1"
              >
                <p className="text-[13px] font-semibold text-white/85">
                  {quotes[active].author}
                </p>
                <p className="text-[11px] text-white/85">{quotes[active].role}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation dots + arrows */}
          <div className="mt-10 flex items-center gap-6">
            {/* Prev */}
            <button
              onClick={() => { go(active - 1, -1); restart() }}
              aria-label="Anterior"
              className="group flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.02] text-white/85 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-white/90"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M8.5 3L5 7l3.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Dots */}
            <div className="flex items-center gap-2.5">
              {quotes.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { go(i, i > active ? 1 : -1); restart() }}
                  aria-label={`Ir para depoimento ${i + 1}`}
                  className="relative flex h-5 w-5 items-center justify-center"
                >
                  <span
                    className={`block rounded-full transition-all duration-500 ${
                      i === active
                        ? "h-2 w-2 bg-accent/70"
                        : "h-1.5 w-1.5 bg-white/15 hover:bg-white/30"
                    }`}
                  />
                  {i === active && (
                    <motion.span
                      layoutId="testimonial-dot-ring"
                      className="absolute inset-0 rounded-full border border-accent/30"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Next */}
            <button
              onClick={() => { go(active + 1, 1); restart() }}
              aria-label="Próximo"
              className="group flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.02] text-white/85 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-white/90"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5.5 3L9 7l-3.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-8 h-px w-48 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              key={active}
              className="h-full rounded-full bg-accent/40"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: INTERVAL_MS / 1000, ease: "linear" }}
            />
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
