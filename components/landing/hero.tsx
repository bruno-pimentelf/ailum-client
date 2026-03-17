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

function HeroCards({ parallaxX, parallaxY }: { parallaxX: any; parallaxY: any }) {
  const p2x = useTransform(parallaxX, (v: number) => v * 0.7)
  const p2y = useTransform(parallaxY, (v: number) => v * 1.3)
  const p3x = useTransform(parallaxX, (v: number) => v * 1.2)
  const p3y = useTransform(parallaxY, (v: number) => v * 0.6)

  return (
    <div className="relative w-full h-[480px]">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] bg-accent/[0.06] rounded-full blur-[120px]" />

      {/* Card 1: WhatsApp conversation */}
      <motion.div
        className="absolute top-0 left-0 w-[296px] z-20"
        style={{ x: parallaxX, y: parallaxY }}
        animate={{ y: [0, -9, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Double-bezel outer ring */}
        <div className="rounded-[1.375rem] bg-white/[0.015] p-px ring-1 ring-white/[0.07] shadow-[0_32px_80px_-20px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.03)_inset]">
          <div className="rounded-[1.3rem] bg-zinc-950/80 backdrop-blur-2xl overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center gap-2.5 px-4 pt-4 pb-3 border-b border-white/[0.04]">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
                <WhatsappLogo className="h-3.5 w-3.5 text-emerald-400" weight="fill" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-white/60 leading-none">Clínica Harmonia</p>
                <p className="text-[9px] text-emerald-400/60 mt-0.5 leading-none">IA ativa · online agora</p>
              </div>
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400/70 animate-pulse" />
            </div>
            {/* Messages */}
            <div className="px-4 py-3.5 space-y-2">
              <div className="flex justify-start">
                <div className="bg-white/[0.05] rounded-2xl rounded-tl-sm px-3 py-2 max-w-[85%]">
                  <p className="text-[11px] text-white/50 leading-relaxed">
                    Oi! Quero marcar uma consulta com a Dra. Marina
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-accent/[0.12] rounded-2xl rounded-tr-sm px-3 py-2 max-w-[88%] ring-1 ring-accent/[0.08]">
                  <p className="text-[11px] text-white/65 leading-relaxed">
                    Quinta às 10h está livre. Envio o Pix agora para confirmar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Card 2: Pix received */}
      <motion.div
        className="absolute top-[195px] right-0 w-[220px] z-30"
        style={{ x: p2x, y: p2y }}
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
      >
        <div className="rounded-[1.375rem] bg-white/[0.015] p-px ring-1 ring-emerald-500/[0.12] shadow-[0_32px_80px_-20px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.03)_inset]">
          <div className="rounded-[1.3rem] bg-zinc-950/80 backdrop-blur-2xl px-5 py-4">
            {/* Status row */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
                <CheckCircle className="h-3 w-3 text-emerald-400" weight="fill" />
              </div>
              <span className="text-[10px] font-semibold tracking-wide text-emerald-400/80 uppercase">Pix recebido</span>
            </div>
            {/* Amount */}
            <p className="font-display text-[2rem] font-bold tracking-[-0.04em] leading-none text-white/85">
              R$&thinsp;150
              <span className="text-[1rem] font-normal text-white/20">,00</span>
            </p>
            {/* Divider */}
            <div className="my-3 h-px bg-white/[0.05]" />
            <p className="text-[10px] text-white/25 leading-snug">Horário bloqueado automaticamente</p>
          </div>
        </div>
      </motion.div>

      {/* Card 3: Appointment confirmed */}
      <motion.div
        className="absolute bottom-0 left-4 w-[268px] z-10"
        style={{ x: p3x, y: p3y }}
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      >
        <div className="rounded-[1.375rem] bg-white/[0.015] p-px ring-1 ring-white/[0.07] shadow-[0_32px_80px_-20px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.03)_inset]">
          <div className="rounded-[1.3rem] bg-zinc-950/80 backdrop-blur-2xl px-5 py-4">
            {/* Header row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-3.5 w-3.5 text-accent/50" weight="fill" />
                <span className="text-[10px] font-medium text-white/30 tracking-wide">Qui, 13 Março</span>
              </div>
              <span className="font-mono text-[11px] text-accent/60 tabular-nums">10:00</span>
            </div>
            {/* Doctor row */}
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 ring-1 ring-accent/20 flex items-center justify-center">
                  <span className="text-[11px] font-bold text-accent/80">DM</span>
                </div>
                {/* Online dot */}
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-zinc-950 flex items-center justify-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-white/70 leading-none">Dra. Marina</p>
                <p className="text-[10px] text-white/25 mt-1 leading-none">Dermatologia</p>
              </div>
              <div className="shrink-0 rounded-full bg-emerald-500/8 px-2.5 py-1 ring-1 ring-emerald-500/15">
                <span className="text-[9px] font-semibold text-emerald-400/80 tracking-wide">Confirmada</span>
              </div>
            </div>
          </div>
        </div>
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
    <section ref={containerRef} className="relative overflow-hidden pt-32 pb-8 md:pt-44 md:pb-16">
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
            className="absolute left-[15%] top-0 -translate-y-1/2"
          >
            <div className="h-[50rem] w-[50rem] rounded-full bg-accent/5 blur-[140px]" />
          </motion.div>
          <motion.div
            animate={isMobile ? undefined : { y: [0, 15, 0] }}
            transition={isMobile ? undefined : { duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute right-[5%] top-[20%]"
          >
            <div className="h-[30rem] w-[30rem] rounded-full bg-cyan-400/3 blur-[100px]" />
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        style={isMobile ? undefined : { scale: heroScale }}
        className="relative mx-auto max-w-7xl px-6"
      >
        {/* Grid: text left, floating cards right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left: Content */}
          <div className="max-w-xl">
            {/* Eyebrow pill */}
            <motion.div
              initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.8, delay: 0.1, ease }}
              className="mb-8"
            >
              <div className="inline-flex items-center gap-2.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                </span>
                <span className="text-[11px] font-medium tracking-wide text-white/40">
                  {t.hero.pill}
                </span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 32, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1, delay: 0.2, ease }}
              className="font-display text-[clamp(2.5rem,6vw,4.5rem)] font-bold tracking-[-0.04em] leading-[0.95]"
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
              className="mt-7 max-w-md text-[16px] leading-relaxed text-white/35"
            >
              {t.hero.subheadline}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.65, ease }}
              className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
            >
              <a
                href="https://form.typeform.com/to/d4xLz0DX"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center gap-3 h-14 rounded-full bg-white pl-7 pr-2 text-[15px] font-semibold text-zinc-950 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_0_40px_rgba(0,181,212,0.15)] active:scale-[0.97]"
              >
                <span>{t.hero.aplicarSe}</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-950/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105 group-hover:bg-zinc-950/15">
                  <ArrowUpRight className="h-4 w-4" weight="bold" />
                </span>
              </a>

              <a
                href="#como-funciona"
                className="group inline-flex items-center gap-2 px-6 py-3.5 text-[15px] font-medium text-white/40 hover:text-white/70 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
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
            className="hidden lg:block"
          >
            <HeroCards parallaxX={parallaxX} parallaxY={parallaxY} />
          </motion.div>
        </div>

        {/* Full-width dashboard showcase below */}
        <motion.div
          initial={{ opacity: 0, y: 56, filter: "blur(16px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.4, delay: 0.9, ease }}
          className="relative mt-20 md:mt-28"
        >
          {/* Outer double-bezel frame */}
          <div className="rounded-[2rem] bg-white/[0.015] p-1.5 ring-1 ring-white/[0.06] shadow-[0_32px_80px_-20px_rgba(0,0,0,0.6)]">
            <div
              className="relative overflow-hidden rounded-[calc(2rem-0.375rem)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
              style={{
                maskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
              }}
            >
              <HeroDashboard />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
