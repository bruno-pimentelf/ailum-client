"use client"

import { useRef } from "react"
import { motion, useInView, useScroll, useTransform } from "framer-motion"
import {
  TrendUp,
  Clock,
  CurrencyCircleDollar,
  ChartLineUp,
  CalendarCheck,
  WhatsappLogo,
  Lightning,
  UserCircleGear,
} from "@phosphor-icons/react"
import { AnimatedCounter, FadeIn } from "./motion"

const ease = [0.32, 0.72, 0, 1] as const

// ─── Animated progress bar ────────────────────────────────────────────────────

function ProgressBar({ value, color, delay }: { value: number; color: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-40px" })

  return (
    <div ref={ref} className="h-1.5 w-full rounded-full bg-white/[0.04] overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={isInView ? { width: `${value}%` } : { width: 0 }}
        transition={{ duration: 1.4, delay, ease }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  )
}

// ─── Floating micro-stat pill ─────────────────────────────────────────────────

function FloatingPill({
  children,
  delay,
  className = "",
}: {
  children: React.ReactNode
  delay: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12, scale: 0.9 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.7, delay, ease }}
      className={`inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-3.5 py-1.5 text-[12px] backdrop-blur-sm ${className}`}
    >
      {children}
    </motion.div>
  )
}

// ─── Section 1: Revenue Impact ────────────────────────────────────────────────

function RevenueImpact() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <div ref={ref} className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
      {/* Left — Text */}
      <FadeIn direction="right">
        <div className="flex items-center gap-2 mb-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <CurrencyCircleDollar className="h-3.5 w-3.5 text-emerald-400" weight="duotone" />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400/80">
            Faturamento
          </span>
        </div>
        <h3 className="font-display text-[clamp(1.6rem,3vw,2.4rem)] font-bold leading-[1.1] tracking-tight text-foreground">
          Salto de{" "}
          <span className="text-emerald-400">
            <AnimatedCounter target={40} suffix="%" />
          </span>{" "}
          no faturamento
          <br />
          <span className="text-white/50">nos primeiros 2 meses</span>
        </h3>
        <p className="mt-4 max-w-md text-[14px] leading-relaxed text-white/55">
          Clínicas que implementam IA no atendimento via WhatsApp cobram mais rápido,
          confirmam mais e perdem menos pacientes no caminho.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <FloatingPill delay={0.3}>
            <ChartLineUp className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-emerald-300/90 font-medium">+R$ 42k</span>
            <span className="text-white/40">faturamento médio</span>
          </FloatingPill>
          <FloatingPill delay={0.45}>
            <CalendarCheck className="h-3.5 w-3.5 text-accent" />
            <span className="text-accent font-medium">94%</span>
            <span className="text-white/40">confirmação</span>
          </FloatingPill>
        </div>
      </FadeIn>

      {/* Right — Visual */}
      <FadeIn direction="left" delay={0.15}>
        <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 backdrop-blur-sm overflow-hidden">
          <div className="absolute -top-20 -right-20 h-40 w-40 bg-emerald-500/[0.06] rounded-full blur-3xl pointer-events-none" />

          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40 mb-5">
            Crescimento de receita
          </p>

          {/* Before/After bars */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] text-white/50">Antes da Ailum</span>
                <span className="text-[12px] font-medium text-white/40">R$ 98k/mês</span>
              </div>
              <ProgressBar value={49} color="rgba(255,255,255,0.08)" delay={0.2} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] text-white/70">Com a Ailum</span>
                <span className="text-[12px] font-semibold text-emerald-400">R$ 142k/mês</span>
              </div>
              <ProgressBar value={71} color="rgb(52, 211, 153)" delay={0.5} />
            </div>
          </div>

          {/* Uplift badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 1.0, ease }}
            className="mt-5 inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.08] px-3 py-1.5"
          >
            <TrendUp className="h-3.5 w-3.5 text-emerald-400" weight="bold" />
            <span className="text-[12px] font-bold text-emerald-400">+40%</span>
            <span className="text-[11px] text-emerald-400/60">em 2 meses</span>
          </motion.div>
        </div>
      </FadeIn>
    </div>
  )
}

// ─── Section 2: Conversion ────────────────────────────────────────────────────

function ConversionImpact() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <div ref={ref} className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
      {/* Left — Visual (reversed order on desktop) */}
      <FadeIn direction="right" delay={0.15} className="order-2 lg:order-1">
        <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 backdrop-blur-sm overflow-hidden">
          <div className="absolute -top-20 -left-20 h-40 w-40 bg-accent/[0.06] rounded-full blur-3xl pointer-events-none" />

          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40 mb-5">
            Taxa de conversão lead → consulta
          </p>

          {/* Funnel visualization */}
          <div className="space-y-2.5">
            {[
              { label: "Leads recebidos", value: 100, width: 100, color: "bg-white/[0.06]" },
              { label: "Respondidos pela IA", value: 97, width: 97, color: "bg-accent/20" },
              { label: "Agendaram consulta", value: 57, width: 57, color: "bg-accent/40" },
              { label: "Confirmaram e pagaram", value: 48, width: 48, color: "bg-accent" },
            ].map((step, i) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 + i * 0.15, ease }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-white/50">{step.label}</span>
                  <span className="text-[11px] font-medium text-white/60">{step.value}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/[0.03] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={isInView ? { width: `${step.width}%` } : { width: 0 }}
                    transition={{ duration: 1.2, delay: 0.5 + i * 0.2, ease }}
                    className={`h-full rounded-full ${step.color}`}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Right — Text */}
      <FadeIn direction="left" className="order-1 lg:order-2">
        <div className="flex items-center gap-2 mb-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 border border-accent/20">
            <WhatsappLogo className="h-3.5 w-3.5 text-accent" weight="duotone" />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent/80">
            Conversão
          </span>
        </div>
        <h3 className="font-display text-[clamp(1.6rem,3vw,2.4rem)] font-bold leading-[1.1] tracking-tight text-foreground">
          <span className="text-accent">
            <AnimatedCounter target={57} suffix="%" />
          </span>{" "}
          mais agendamentos
          <br />
          <span className="text-white/50">com a mesma verba em marketing</span>
        </h3>
        <p className="mt-4 max-w-md text-[14px] leading-relaxed text-white/55">
          A IA responde em 12 segundos, 24 horas por dia. Nenhum lead fica sem resposta.
          Nenhuma oportunidade escapa.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <FloatingPill delay={0.3}>
            <Lightning className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-amber-300/90 font-medium">12s</span>
            <span className="text-white/40">tempo de resposta</span>
          </FloatingPill>
          <FloatingPill delay={0.45}>
            <WhatsappLogo className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-emerald-300/90 font-medium">24h</span>
            <span className="text-white/40">disponível</span>
          </FloatingPill>
        </div>
      </FadeIn>
    </div>
  )
}

// ─── Section 3: Productivity ──────────────────────────────────────────────────

function ProductivityImpact() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <div ref={ref} className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
      {/* Left — Text */}
      <FadeIn direction="right">
        <div className="flex items-center gap-2 mb-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20">
            <UserCircleGear className="h-3.5 w-3.5 text-violet-400" weight="duotone" />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-400/80">
            Produtividade
          </span>
        </div>
        <h3 className="font-display text-[clamp(1.6rem,3vw,2.4rem)] font-bold leading-[1.1] tracking-tight text-foreground">
          <span className="text-violet-400">3x</span> menos tempo
          <br />
          <span className="text-white/50">gasto pela recepção</span>
        </h3>
        <p className="mt-4 max-w-md text-[14px] leading-relaxed text-white/55">
          Agendamento, confirmação, cobrança PIX e lembretes — tudo automático.
          Sua recepção foca no que importa: o paciente presencial.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <FloatingPill delay={0.3}>
            <Clock className="h-3.5 w-3.5 text-violet-400" />
            <span className="text-violet-300/90 font-medium">-67%</span>
            <span className="text-white/40">tempo em tarefas repetitivas</span>
          </FloatingPill>
        </div>
      </FadeIn>

      {/* Right — Visual */}
      <FadeIn direction="left" delay={0.15}>
        <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 backdrop-blur-sm overflow-hidden">
          <div className="absolute -bottom-20 -right-20 h-40 w-40 bg-violet-500/[0.06] rounded-full blur-3xl pointer-events-none" />

          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40 mb-5">
            Tempo da recepção por dia
          </p>

          {/* Time comparison */}
          <div className="space-y-5">
            {[
              { task: "Responder WhatsApp", before: "3h 20min", after: "15min", savings: 93 },
              { task: "Confirmar consultas", before: "1h 40min", after: "0min", savings: 100 },
              { task: "Cobrar pacientes", before: "1h 10min", after: "5min", savings: 93 },
              { task: "Remarcar horários", before: "45min", after: "10min", savings: 78 },
            ].map((item, i) => (
              <motion.div
                key={item.task}
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.12, ease }}
                className="flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-white/60 truncate">{item.task}</p>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="text-[11px] text-white/30 line-through">{item.before}</span>
                    <span className="text-[11px] font-semibold text-violet-400">{item.after}</span>
                  </div>
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.8 + i * 0.1, ease }}
                  className="shrink-0 ml-4 rounded-md bg-violet-500/[0.08] border border-violet-500/15 px-2 py-0.5"
                >
                  <span className="text-[10px] font-bold text-violet-400">-{item.savings}%</span>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </FadeIn>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function ImpactStats() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })

  // Subtle parallax on the ambient glow
  const glowY = useTransform(scrollYProgress, [0, 1], [80, -80])

  return (
    <section ref={sectionRef} className="relative border-t border-white/[0.04] py-24 md:py-36 overflow-hidden">
      {/* Ambient glow */}
      <motion.div
        style={{ y: glowY }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-accent/[0.025] rounded-full blur-[180px] pointer-events-none"
      />

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Section header */}
        <FadeIn className="mx-auto max-w-xl text-center mb-20 md:mb-28">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            Impacto real
          </p>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Números que{" "}
            <span className="font-display italic text-accent">falam sozinhos</span>
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Dados reais de clínicas que automatizaram o atendimento com IA.
          </p>
        </FadeIn>

        {/* Stat sections with spacing */}
        <div className="space-y-24 md:space-y-36">
          <RevenueImpact />
          <ConversionImpact />
          <ProductivityImpact />
        </div>

        {/* Bottom summary strip */}
        <div className="mt-20 md:mt-28">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-0">
            {[
              { value: 57, suffix: "%", label: "mais agendamentos" },
              { value: 40, suffix: "%", label: "aumento no faturamento" },
              { value: 3, suffix: "x", label: "menos tempo operacional" },
              { value: 12, suffix: "s", label: "tempo de resposta" },
            ].map((stat, i) => (
              <FadeIn key={stat.label} delay={i * 0.1}>
                <div
                  className={`flex flex-col items-center text-center px-4 py-6 lg:py-0 ${
                    i < 3 ? "md:border-r md:border-white/[0.06]" : ""
                  }`}
                >
                  <span className="font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </span>
                  <span className="mt-3 text-[11px] font-medium uppercase tracking-[0.15em] text-white/85">
                    {stat.label}
                  </span>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
