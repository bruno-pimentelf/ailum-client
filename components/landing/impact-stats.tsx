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

// ─── Section 1: Revenue Impact ────────────────────────────────────────────────

function RevenueImpact() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <div ref={ref} className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-20">
      <FadeIn direction="right">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 border border-accent/15">
            <CurrencyCircleDollar className="h-3.5 w-3.5 text-accent/70" weight="duotone" />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent/60">
            Faturamento
          </span>
        </div>
        <h3 className="font-display text-[clamp(1.6rem,3vw,2.4rem)] font-bold leading-[1.1] tracking-tight text-foreground">
          <span className="text-white">
            +<AnimatedCounter target={40} suffix="%" />
          </span>{" "}
          em faturamento
          <br />
          <span className="text-white/35 text-[0.65em]">nos primeiros 2 meses</span>
        </h3>
        <p className="mt-3 text-[13px] leading-relaxed text-white/35 max-w-sm">
          Cobrança mais rápida via Pix + menos no-show = receita que antes escapava.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-3.5 py-1.5 text-[12px]">
            <ChartLineUp className="h-3.5 w-3.5 text-accent/60" />
            <span className="text-white/80 font-medium">+R$ 42k</span>
            <span className="text-white/35">média</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-3.5 py-1.5 text-[12px]">
            <CalendarCheck className="h-3.5 w-3.5 text-accent/60" />
            <span className="text-white/80 font-medium">94%</span>
            <span className="text-white/35">confirmação</span>
          </div>
        </div>
      </FadeIn>

      <FadeIn direction="left" delay={0.15}>
        <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 backdrop-blur-sm overflow-hidden">
          <div className="absolute -top-20 -right-20 h-40 w-40 bg-accent/[0.04] rounded-full blur-3xl pointer-events-none" />

          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40 mb-5">
            Crescimento de receita
          </p>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] text-white/50">Antes</span>
                <span className="text-[12px] font-medium text-white/40">R$ 98k/mês</span>
              </div>
              <ProgressBar value={49} color="rgba(255,255,255,0.08)" delay={0.2} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] text-white/70">Com a Ailum</span>
                <span className="text-[12px] font-semibold text-accent/80">R$ 142k/mês</span>
              </div>
              <ProgressBar value={71} color="rgba(0,181,212,0.5)" delay={0.5} />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 1.0, ease }}
            className="mt-5 inline-flex items-center gap-1.5 rounded-lg border border-accent/15 bg-accent/[0.06] px-3 py-1.5"
          >
            <TrendUp className="h-3.5 w-3.5 text-accent/70" weight="bold" />
            <span className="text-[12px] font-bold text-white/80">+40%</span>
            <span className="text-[11px] text-white/40">em 2 meses</span>
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
    <div ref={ref} className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-20">
      <FadeIn direction="right" delay={0.15} className="order-2 lg:order-1">
        <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 backdrop-blur-sm overflow-hidden">
          <div className="absolute -top-20 -left-20 h-40 w-40 bg-accent/[0.04] rounded-full blur-3xl pointer-events-none" />

          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40 mb-5">
            Funil de conversão
          </p>

          <div className="space-y-2.5">
            {[
              { label: "Leads recebidos", value: 100, opacity: "bg-white/[0.06]" },
              { label: "Respondidos", value: 97, opacity: "bg-accent/15" },
              { label: "Agendaram", value: 57, opacity: "bg-accent/30" },
              { label: "Confirmaram", value: 48, opacity: "bg-accent/50" },
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
                    animate={isInView ? { width: `${step.value}%` } : { width: 0 }}
                    transition={{ duration: 1.2, delay: 0.5 + i * 0.2, ease }}
                    className={`h-full rounded-full ${step.opacity}`}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </FadeIn>

      <FadeIn direction="left" className="order-1 lg:order-2">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 border border-accent/15">
            <WhatsappLogo className="h-3.5 w-3.5 text-accent/70" weight="duotone" />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent/60">
            Conversão
          </span>
        </div>
        <h3 className="font-display text-[clamp(1.6rem,3vw,2.4rem)] font-bold leading-[1.1] tracking-tight text-foreground">
          <span className="text-white">
            +<AnimatedCounter target={57} suffix="%" />
          </span>{" "}
          agendamentos
          <br />
          <span className="text-white/35 text-[0.65em]">com a mesma verba de marketing</span>
        </h3>
        <p className="mt-3 text-[13px] leading-relaxed text-white/35 max-w-sm">
          Resposta em 12s, 24h por dia. Nenhum lead fica sem atendimento.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-3.5 py-1.5 text-[12px]">
            <Lightning className="h-3.5 w-3.5 text-accent/60" />
            <span className="text-white/80 font-medium">12s</span>
            <span className="text-white/35">resposta</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-3.5 py-1.5 text-[12px]">
            <WhatsappLogo className="h-3.5 w-3.5 text-accent/60" />
            <span className="text-white/80 font-medium">24/7</span>
            <span className="text-white/35">ativo</span>
          </div>
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
    <div ref={ref} className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-20">
      <FadeIn direction="right">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 border border-accent/15">
            <UserCircleGear className="h-3.5 w-3.5 text-accent/70" weight="duotone" />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent/60">
            Produtividade
          </span>
        </div>
        <h3 className="font-display text-[clamp(1.6rem,3vw,2.4rem)] font-bold leading-[1.1] tracking-tight text-foreground">
          <span className="text-white">3x</span> menos tempo
          <br />
          <span className="text-white/35 text-[0.65em]">gasto pela recepção</span>
        </h3>
        <p className="mt-3 text-[13px] leading-relaxed text-white/35 max-w-sm">
          Agendamento, cobrança e lembretes no automático. Recepção foca no presencial.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-3.5 py-1.5 text-[12px]">
            <Clock className="h-3.5 w-3.5 text-accent/60" />
            <span className="text-white/80 font-medium">-67%</span>
            <span className="text-white/35">tarefas repetitivas</span>
          </div>
        </div>
      </FadeIn>

      <FadeIn direction="left" delay={0.15}>
        <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 backdrop-blur-sm overflow-hidden">
          <div className="absolute -bottom-20 -right-20 h-40 w-40 bg-accent/[0.04] rounded-full blur-3xl pointer-events-none" />

          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40 mb-5">
            Tempo por tarefa
          </p>

          <div className="space-y-4">
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
                    <span className="text-[11px] font-semibold text-accent/70">{item.after}</span>
                  </div>
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.8 + i * 0.1, ease }}
                  className="shrink-0 ml-4 rounded-md bg-accent/[0.06] border border-accent/10 px-2 py-0.5"
                >
                  <span className="text-[10px] font-bold text-white/60">-{item.savings}%</span>
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

  const glowY = useTransform(scrollYProgress, [0, 1], [80, -80])

  return (
    <section ref={sectionRef} className="relative border-t border-white/[0.04] py-24 md:py-36 overflow-hidden">
      {/* Ambient glow */}
      <motion.div
        style={{ y: glowY }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-accent/[0.02] rounded-full blur-[180px] pointer-events-none"
      />

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Section header */}
        <FadeIn className="mx-auto max-w-xl text-center mb-20 md:mb-28">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent/70">
            Impacto real
          </p>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Números que{" "}
            <span className="font-display italic text-white/50">falam sozinhos</span>
          </h2>
        </FadeIn>

        {/* Stat sections */}
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
                  <span className="mt-3 text-[11px] font-medium uppercase tracking-[0.15em] text-white/50">
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
