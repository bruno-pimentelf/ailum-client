"use client"

import { useEffect, useRef, useState } from "react"
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  useScroll,
} from "framer-motion"
import {
  ArrowUpRight,
  ArrowDown,
  CheckCircle,
  WhatsappLogo,
  CalendarCheck,
} from "@phosphor-icons/react"
import { HeroDashboard } from "@/components/landing/hero-dashboard"
import { useLanguage } from "@/components/providers/language-provider"

const ease = [0.32, 0.72, 0, 1] as const

/* ── Step badge ─────────────────────────────────────────────────────────── */
function StepBadge({ n }: { n: number }) {
  return (
    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/[0.1] bg-foreground/[0.04] text-[9px] font-bold tabular-nums text-foreground/85">
      {n}
    </div>
  )
}

/*
 * Wider, more spread-out zigzag layout (460px wide × 560px tall).
 *
 *   Card 1 (WhatsApp)  — top: 0,    left: 0,    w: 260,  h ≈ 132
 *   Card 2 (Pix)       — top: 200,  left: 196,  w: 210,  h ≈ 106
 *   Card 3 (Confirmed) — top: 374,  left: 24,   w: 260,  h ≈  94
 *
 *   Arrow 1→2: bottom-right of Card1 → top-left of Card2 (elegant S-curve)
 *   Arrow 2→3: bottom-left of Card2  → top-right of Card3 (mirror S-curve)
 */
function HeroCards({ parallaxX, parallaxY }: { parallaxX: any; parallaxY: any }) {
  const p2x = useTransform(parallaxX, (v: number) => v * 0.6)
  const p2y = useTransform(parallaxY, (v: number) => v * 1.2)
  const p3x = useTransform(parallaxX, (v: number) => v * 1.1)
  const p3y = useTransform(parallaxY, (v: number) => v * 0.7)

  return (
    <div className="relative w-[460px] select-none" style={{ height: 560 }}>
      {/* Ambient glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-accent/[0.04] rounded-full blur-[120px]" />

      {/* ── SVG connectors ────────────────────────────────────────────────── */}
      <svg
        className="pointer-events-none absolute inset-0 w-full h-full z-[5]"
        viewBox="0 0 460 560"
        fill="none"
      >
        {/* Arrow 1 → 2
            Card1 bottom-center: (130, 136)  →  Card2 top-center: (301, 200)
            Smooth S-curve through the gap */}
        <path
          d="M 130 136 C 130 162, 301 170, 301 200"
          stroke="rgba(255,255,255,0.20)"
          strokeWidth="1"
          strokeDasharray="3 5"
          strokeLinecap="round"
        />
        <path
          d="M 295 194 L 301 200 L 307 194"
          stroke="rgba(255,255,255,0.30)"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Arrow 2 → 3
            Card2 bottom-center: (301, 306)  →  Card3 top-center: (154, 374)
            Smooth S-curve through the gap */}
        <path
          d="M 301 306 C 301 336, 154 340, 154 374"
          stroke="rgba(255,255,255,0.20)"
          strokeWidth="1"
          strokeDasharray="3 5"
          strokeLinecap="round"
        />
        <path
          d="M 148 368 L 154 374 L 160 368"
          stroke="rgba(255,255,255,0.30)"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* ── Card 1: WhatsApp conversation ────────────────────────────────── */}
      <motion.div
        style={{ x: parallaxX, y: parallaxY }}
        className="absolute top-0 left-0 w-[260px] z-20"
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="rounded-[1.25rem] bg-foreground/[0.015] p-px ring-1 ring-white/[0.07] shadow-[0_24px_60px_-16px_rgba(0,0,0,0.7)]">
            <div className="rounded-[calc(1.25rem-1px)] bg-zinc-950/90 backdrop-blur-2xl overflow-hidden">
              <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-2.5 border-b border-foreground/[0.04]">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
                  <WhatsappLogo className="h-3 w-3 text-emerald-400" weight="fill" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-foreground/85 leading-none">Clínica Harmonia</p>
                  <p className="text-[8px] text-emerald-400/50 mt-0.5 leading-none">IA ativa</p>
                </div>
                <StepBadge n={1} />
              </div>
              <div className="px-3.5 py-2.5 space-y-1.5">
                <div className="flex justify-start">
                  <div className="bg-foreground/[0.05] rounded-2xl rounded-tl-sm px-3 py-2 max-w-[88%]">
                    <p className="text-[10px] text-foreground/85 leading-relaxed">Quero marcar com a Dra. Marina</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-accent/[0.08] rounded-2xl rounded-tr-sm px-3 py-2 max-w-[90%] ring-1 ring-accent/[0.06]">
                    <p className="text-[10px] text-foreground/85 leading-relaxed">Quinta às 10h livre. Envio o Pix.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Card 2: Pix received ─────────────────────────────────────────── */}
      <motion.div
        style={{ x: p2x, y: p2y }}
        className="absolute top-[200px] left-[196px] w-[210px] z-30"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
        >
          <div className="rounded-[1.25rem] bg-foreground/[0.015] p-px ring-1 ring-emerald-500/[0.10] shadow-[0_24px_60px_-16px_rgba(0,0,0,0.7)]">
            <div className="rounded-[calc(1.25rem-1px)] bg-zinc-950/90 backdrop-blur-2xl px-4 py-3">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
                    <CheckCircle className="h-2.5 w-2.5 text-emerald-400" weight="fill" />
                  </div>
                  <span className="text-[8px] font-semibold tracking-wider text-emerald-400/70 uppercase">Pix recebido</span>
                </div>
                <StepBadge n={2} />
              </div>
              <p className="font-display text-[1.5rem] font-bold tracking-[-0.04em] leading-none text-foreground">
                R$&thinsp;150
                <span className="text-[0.85rem] font-normal text-foreground">,00</span>
              </p>
              <div className="mt-2 h-px bg-foreground/[0.04]" />
              <p className="mt-1.5 text-[8px] text-foreground/80 leading-snug">Horário bloqueado</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Card 3: Appointment confirmed ───────────────────────────────── */}
      <motion.div
        style={{ x: p3x, y: p3y }}
        className="absolute top-[374px] left-[24px] w-[260px] z-10"
      >
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        >
          <div className="rounded-[1.25rem] bg-foreground/[0.015] p-px ring-1 ring-white/[0.07] shadow-[0_24px_60px_-16px_rgba(0,0,0,0.7)]">
            <div className="rounded-[calc(1.25rem-1px)] bg-zinc-950/90 backdrop-blur-2xl px-4 py-3">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="h-3 w-3 text-accent/45" weight="fill" />
                  <span className="text-[9px] font-medium text-foreground/85 tracking-wide">Qui, 13 Mar · 10:00</span>
                </div>
                <StepBadge n={3} />
              </div>
              <div className="flex items-center gap-2.5">
                <div className="relative shrink-0">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 ring-1 ring-accent/20 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-accent/75">DM</span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-zinc-950 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-foreground/85 leading-none">Dra. Marina</p>
                  <p className="text-[9px] text-foreground/85 mt-0.5 leading-none">Dermatologia</p>
                </div>
                <div className="shrink-0 rounded-full bg-emerald-500/[0.06] px-2 py-0.5 ring-1 ring-emerald-500/12">
                  <span className="text-[8px] font-semibold text-emerald-400/70 tracking-wide">Confirmada</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export function Hero() {
  const { t } = useLanguage()
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springConfig = { stiffness: 50, damping: 30, mass: 1 }
  const parallaxX = useSpring(useTransform(mouseX, [-0.5, 0.5], [12, -12]), springConfig)
  const parallaxY = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), springConfig)

  const [isMobile, setIsMobile] = useState(false)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })
  // Subtle scale only — no opacity fade so the dashboard stays fully visible
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.97])

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const onChange = () => setIsMobile(mq.matches)
    onChange()
    mq.addEventListener("change", onChange)
    if (mq.matches) return () => mq.removeEventListener("change", onChange)

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      mouseX.set(x)
      mouseY.set(y)
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => {
      mq.removeEventListener("change", onChange)
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [mouseX, mouseY])

  return (
    <section ref={containerRef} className="relative overflow-hidden pt-28 pb-8 md:pt-44 md:pb-16">
      {/* Ambient glow orbs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, ease }}
        >
          <motion.div
            animate={isMobile ? undefined : { y: [0, -20, 0], scale: [1, 1.05, 1] }}
            transition={isMobile ? undefined : { duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-[5%] top-0 -translate-y-1/2"
          >
            <div className="h-[30rem] w-[30rem] md:h-[50rem] md:w-[50rem] rounded-full bg-accent/5 blur-[120px] md:blur-[140px]" />
          </motion.div>
          <motion.div
            animate={isMobile ? undefined : { y: [0, 15, 0] }}
            transition={isMobile ? undefined : { duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute right-[0%] top-[20%]"
          >
            <div className="h-[20rem] w-[20rem] md:h-[30rem] md:w-[30rem] rounded-full bg-cyan-400/3 blur-[80px] md:blur-[100px]" />
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        style={isMobile ? undefined : { scale: heroScale }}
        className="relative mx-auto max-w-7xl px-4 sm:px-6"
      >
        {/* Grid: text left, floating cards right */}
        <div className="grid grid-cols-1 gap-12 items-start lg:grid-cols-[minmax(0,560px)_minmax(0,460px)] lg:justify-center lg:gap-10 lg:pt-8">
          {/* Left: Content */}
          <div className="w-full max-w-[560px] text-center lg:text-left">
            {/* Eyebrow pill */}
            <motion.div
              initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.8, delay: 0.1, ease }}
              className="mb-8 flex justify-center lg:justify-start"
            >
              <div className="inline-flex items-center gap-2.5 rounded-full border border-foreground/[0.06] bg-foreground/[0.03] px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                </span>
                <span className="text-[11px] font-medium tracking-wide text-foreground">
                  {t.hero.pill}
                </span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 32, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1, delay: 0.2, ease }}
              className="font-display text-[clamp(1.9rem,5vw,4rem)] font-bold tracking-[-0.04em] leading-[1.05]"
            >
              <span className="text-foreground">{t.hero.headline}</span>
              <br />
              <span className="text-accent">{t.hero.headlineAccent}</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.9, delay: 0.45, ease }}
              className="mt-7 mx-auto max-w-md text-[15px] leading-relaxed text-foreground/85 lg:mx-0 lg:text-[16px]"
            >
              {t.hero.subheadline}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.65, ease }}
              className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center lg:justify-start"
            >
              <a
                href="https://form.typeform.com/to/d4xLz0DX"
                target="_blank"
                rel="noopener noreferrer"
                className="cta-shimmer group relative overflow-hidden inline-flex w-full items-center justify-center gap-3 h-14 rounded-full border border-border/70 bg-foreground/[0.04] pl-7 pr-2 text-[15px] font-semibold text-foreground shadow-[0_0_20px_rgba(0,181,212,0.06)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-accent/25 hover:bg-accent/[0.07] hover:text-foreground hover:shadow-[0_0_28px_rgba(0,181,212,0.12)] active:scale-[0.97] sm:w-auto sm:justify-start"
              >
                <span>{t.hero.aplicarSe}</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-foreground/[0.06] text-foreground transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105 group-hover:border-accent/20 group-hover:text-accent">
                  <ArrowUpRight className="h-4 w-4" weight="bold" />
                </span>
              </a>

              <a
                href="#como-funciona"
                className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 text-[15px] font-medium text-foreground hover:text-foreground/85 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
              >
                <span>{t.hero.verComoFunciona}</span>
                <ArrowDown className="h-3.5 w-3.5 transition-transform duration-500 group-hover:translate-y-0.5" />
              </a>
            </motion.div>
          </div>

          {/* Right: Floating cards (desktop only) */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, delay: 0.4, ease }}
            className="hidden w-full lg:block"
          >
            <HeroCards parallaxX={parallaxX} parallaxY={parallaxY} />
          </motion.div>
        </div>

        {/* Floating AI demo below */}
        <motion.div
          initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.2, delay: 0.9, ease }}
          className="relative mt-16 md:mt-24"
        >
          <HeroDashboard />
        </motion.div>
      </motion.div>
    </section>
  )
}
