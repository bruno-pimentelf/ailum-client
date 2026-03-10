"use client"

import { useEffect, useRef, useState } from "react"
import { useLanguage } from "@/components/providers/language-provider"
import { motion, useInView, AnimatePresence } from "framer-motion"
import { FadeIn, StaggerContainer, staggerItem } from "./motion"
import {
  Microphone,
  FileText,
  Bell,
  UserCheck,
  Sparkle,
  Shield,
  CheckCircle,
  WhatsappLogo,
  ChatText,
} from "@phosphor-icons/react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

const ease = [0.33, 1, 0.68, 1] as any

// ─── Card 1: Voice equalizer ──────────────────────────────────────────────────
function VoiceAnim({ active, t }: { active: boolean; t: ReturnType<typeof useLanguage>["t"] }) {
  const bars = [0.4, 0.7, 1, 0.6, 0.85, 0.5, 0.9, 0.65, 0.75, 0.45, 0.8, 0.55]
  return (
    <div className="rounded-xl border border-border bg-background/50 px-4 py-3 flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">{t.bento.voiceLabel}</span>
        </div>
        <span className="text-[9px] text-accent/60 font-medium">{t.bento.voiceCustom}</span>
      </div>
      {/* Equalizer — uses absolute height so scaleY never clips */}
      <div className="relative flex items-end gap-[3px]" style={{ height: 48 }}>
        {bars.map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-full bg-accent/60"
            animate={active ? {
              height: [`${h * 30}%`, `${h * 100}%`, `${h * 50}%`, `${h * 80}%`, `${h * 20}%`, `${h * 100}%`],
              opacity: [0.5, 1, 0.7, 1, 0.6, 1],
            } : { height: "12%", opacity: 0.2 }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              delay: i * 0.08,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] text-muted-foreground/40">{t.bento.clinicName}</span>
      </div>
    </div>
  )
}

// ─── Card 2: Patient history lines ───────────────────────────────────────────
function HistoryAnim({ active, t }: { active: boolean; t: ReturnType<typeof useLanguage>["t"] }) {
  const historyLines = [
    { label: t.bento.historyLabels[0], tag: t.bento.historyTags[0], date: t.bento.historyDates[0], color: "text-accent" },
    { label: t.bento.historyLabels[1], tag: t.bento.historyTags[1], date: t.bento.historyDates[1], color: "text-blue-400" },
    { label: t.bento.historyLabels[2], tag: t.bento.historyTags[2], date: t.bento.historyDates[2], color: "text-violet-400" },
  ]
  const [visible, setVisible] = useState<number[]>([])

  useEffect(() => {
    if (!active) { setVisible([]); return }
    let cancelled = false
    async function run() {
      for (let i = 0; i < historyLines.length; i++) {
        await new Promise(r => setTimeout(r, 400 + i * 350))
        if (cancelled) return
        setVisible(p => [...p, i])
      }
    }
    run()
    return () => { cancelled = true }
  }, [active])

  return (
    <div className="flex flex-col gap-1.5">
      {historyLines.map((line, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={visible.includes(i) ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
          transition={{ duration: 0.4, ease }}
          className="flex items-center gap-2 rounded-lg bg-background/50 border border-border/60 px-2.5 py-1.5"
        >
          <div className={`h-1.5 w-1.5 rounded-full ${line.color.replace("text-", "bg-")} shrink-0`} />
          <span className="text-[10px] font-medium text-foreground flex-1 truncate">{line.label}</span>
          <span className={`text-[9px] font-medium ${line.color}`}>{line.tag}</span>
          <span className="text-[8px] text-muted-foreground/50 font-mono">{line.date}</span>
        </motion.div>
      ))}
    </div>
  )
}

// ─── Card 3: Notification stack ───────────────────────────────────────────────
function NotifAnim({ active, t }: { active: boolean; t: ReturnType<typeof useLanguage>["t"] }) {
  const notifications = [
    { Icon: Bell, text: t.bento.notif1, color: "border-accent/20 bg-accent/5", iconColor: "text-accent" },
    { Icon: CheckCircle, text: t.bento.notif2, color: "border-emerald-500/20 bg-emerald-500/5", iconColor: "text-emerald-400" },
    { Icon: ChatText, text: t.bento.notif3, color: "border-blue-500/20 bg-blue-500/5", iconColor: "text-blue-400" },
  ]
  const [visible, setVisible] = useState<number[]>([])

  useEffect(() => {
    if (!active) { setVisible([]); return }
    let cancelled = false
    async function run() {
      for (let i = 0; i < notifications.length; i++) {
        await new Promise(r => setTimeout(r, 300 + i * 600))
        if (cancelled) return
        setVisible(p => [...p, i])
      }
    }
    run()
    return () => { cancelled = true }
  }, [active])

  return (
    <div className="flex flex-col gap-1.5">
      <AnimatePresence>
        {notifications.map((n, i) =>
          visible.includes(i) ? (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 ${n.color}`}
            >
              <n.Icon className={`h-3.5 w-3.5 shrink-0 ${n.iconColor}`} weight="fill" />
              <span className="text-[10px] text-foreground/80 leading-snug">{n.text}</span>
            </motion.div>
          ) : null
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Card 4: Dedicated manager chat ───────────────────────────────────────────
function ManagerAnim({ active, t }: { active: boolean; t: ReturnType<typeof useLanguage>["t"] }) {
  const managerMessages = [
    { from: "manager" as const, text: t.bento.manager1 },
    { from: "clinic" as const, text: t.bento.manager2 },
    { from: "manager" as const, text: t.bento.manager3 },
  ]
  const [visible, setVisible] = useState<number[]>([])
  const [typing, setTyping] = useState(false)

  useEffect(() => {
    if (!active) { setVisible([]); setTyping(false); return }
    let cancelled = false
    async function run() {
      for (let i = 0; i < managerMessages.length; i++) {
        if (cancelled) return
        if (managerMessages[i].from === "manager") {
          setTyping(true)
          await new Promise(r => setTimeout(r, 800))
          if (cancelled) return
          setTyping(false)
          await new Promise(r => setTimeout(r, 100))
        } else {
          await new Promise(r => setTimeout(r, 600))
        }
        if (cancelled) return
        setVisible(p => [...p, i])
      }
    }
    const t = setTimeout(run, 300)
    return () => { cancelled = true; clearTimeout(t) }
  }, [active])

  return (
    <div className="flex flex-col gap-1.5">
      {/* Manager header */}
      <div className="flex items-center gap-2 mb-1">
        <div className="relative">
          <div className="h-7 w-7 rounded-full bg-violet-500/20 flex items-center justify-center">
            <span className="text-[9px] font-bold text-violet-400">GM</span>
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 border border-card" />
        </div>
        <div>
          <p className="text-[10px] font-semibold text-foreground leading-none">{t.bento.managerLabel}</p>
          <p className="text-[8px] text-emerald-400 mt-0.5">{t.bento.managerOnline}</p>
        </div>
      </div>

      <AnimatePresence>
        {managerMessages.map((msg, i) =>
          visible.includes(i) ? (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              className={`flex ${msg.from === "clinic" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] rounded-xl px-2.5 py-1.5 text-[10px] leading-snug ${
                msg.from === "clinic" ? "bg-accent/12 text-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"
              }`}>
                {msg.text}
              </div>
            </motion.div>
          ) : null
        )}
      </AnimatePresence>

      <AnimatePresence>
        {typing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex justify-start"
          >
            <div className="bg-muted rounded-xl rounded-bl-sm px-3 py-2">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.13 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Card 5: Pix payment confirm ──────────────────────────────────────────────
function PixAnim({ active, t }: { active: boolean; t: ReturnType<typeof useLanguage>["t"] }) {
  const [phase, setPhase] = useState<"idle" | "progress" | "done">("idle")
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!active) { setPhase("idle"); setProgress(0); return }
    let cancelled = false
    async function run() {
      await new Promise(r => setTimeout(r, 500))
      if (cancelled) return
      setPhase("progress")
      for (let p = 0; p <= 100; p += 3) {
        if (cancelled) return
        setProgress(p)
        await new Promise(r => setTimeout(r, 28))
      }
      setProgress(100)
      await new Promise(r => setTimeout(r, 200))
      if (cancelled) return
      setPhase("done")
    }
    run()
    return () => { cancelled = true }
  }, [active])

  return (
    <div className="flex flex-col gap-2.5">
      {/* WhatsApp message bubble */}
      <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-background/50 p-3">
        <div className="flex items-center gap-2 mb-1">
          <WhatsappLogo className="h-3.5 w-3.5 text-emerald-500/70" />
          <span className="text-[9px] text-muted-foreground/60">{t.bento.clinicName} · WhatsApp</span>
        </div>
        <p className="text-[10px] text-foreground/80 leading-snug">{t.bento.pixMsg}</p>
        <div className="flex items-center gap-2 mt-1 rounded-lg border border-accent/20 bg-accent/5 px-2.5 py-2">
          <div className="h-5 w-5 rounded bg-zinc-900 border border-accent/20 flex items-center justify-center shrink-0">
            <span className="text-[6px] font-bold text-accent">PIX</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-semibold text-accent">R$ 150,00</p>
            <p className="text-[8px] text-muted-foreground/50 truncate font-mono">00020126…6304ABCD</p>
          </div>
        </div>
      </div>

      {/* Payment status */}
      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <motion.div key="idle" exit={{ opacity: 0 }} className="h-8 flex items-center">
            <div className="h-1 w-full rounded-full bg-border" />
          </motion.div>
        )}
        {phase === "progress" && (
          <motion.div key="prog" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-1">
            <div className="flex justify-between">
              <span className="text-[9px] text-muted-foreground/50">{t.bento.pixProcessing}</span>
              <span className="text-[9px] text-accent/70 tabular-nums font-mono">{progress}%</span>
            </div>
            <div className="h-1 rounded-full bg-border overflow-hidden">
              <motion.div className="h-full rounded-full bg-accent/70" style={{ width: `${progress}%` }} />
            </div>
          </motion.div>
        )}
        {phase === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/8 px-3 py-2"
          >
            <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" weight="fill" />
            <div>
              <p className="text-[10px] font-semibold text-emerald-400 leading-none">{t.bento.pixDoneTitle}</p>
              <p className="text-[8px] text-emerald-400/60 mt-0.5">{t.bento.pixDoneSub}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Card 6: Learning curve chart (Recharts) ─────────────────────────────────

const allChartData = [
  { mes: "Jan", qualidade: 18 },
  { mes: "Fev", qualidade: 24 },
  { mes: "Mar", qualidade: 21 },
  { mes: "Abr", qualidade: 31 },
  { mes: "Mai", qualidade: 36 },
  { mes: "Jun", qualidade: 33 },
  { mes: "Jul", qualidade: 44 },
  { mes: "Ago", qualidade: 49 },
  { mes: "Set", qualidade: 46 },
  { mes: "Out", qualidade: 58 },
  { mes: "Nov", qualidade: 64 },
  { mes: "Dez", qualidade: 75 },
]

function LearningAnim({ active, t }: { active: boolean; t: ReturnType<typeof useLanguage>["t"] }) {
  const chartConfig: ChartConfig = {
    qualidade: {
      label: t.bento.chartQualidade,
      color: "oklch(0.712 0.126 215.9)",
    },
  }

  const metrics = [
    { label: t.bento.metric1, value: "98%", color: "text-accent" },
    { label: t.bento.metric2, value: "4.9 / 5", color: "text-amber-400" },
    { label: t.bento.metric3, value: "0%", color: "text-emerald-400" },
  ]
  const [revealed, setRevealed] = useState(0)
  const [metricsVisible, setMetricsVisible] = useState(false)

  useEffect(() => {
    if (!active) { setRevealed(0); setMetricsVisible(false); return }
    let cancelled = false
    async function run() {
      await new Promise(r => setTimeout(r, 300))
      for (let i = 1; i <= allChartData.length; i++) {
        if (cancelled) return
        setRevealed(i)
        await new Promise(r => setTimeout(r, 100))
      }
      await new Promise(r => setTimeout(r, 200))
      if (cancelled) return
      setMetricsVisible(true)
    }
    run()
    return () => { cancelled = true }
  }, [active])

  const visibleData = allChartData.slice(0, revealed)

  return (
    <div className="flex gap-4 items-stretch">
      {/* Chart — takes most of the space */}
      <div className="flex-1 min-w-0 rounded-xl border border-border bg-background/50 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">{t.bento.chartLabel}</span>
          <AnimatePresence>
            {revealed === allChartData.length && (
              <motion.span
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[9px] text-emerald-400 font-medium"
              >
                {t.bento.chartGrowth}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <ChartContainer config={chartConfig} className="h-[140px] w-full aspect-auto">
          <AreaChart data={visibleData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="fillQualidade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-qualidade)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--color-qualidade)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="mes"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 8, fill: "rgba(255,255,255,0.25)" }}
              interval="preserveStartEnd"
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" hideLabel />}
            />
            <Area
              type="monotone"
              dataKey="qualidade"
              stroke="var(--color-qualidade)"
              strokeWidth={2}
              fill="url(#fillQualidade)"
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ChartContainer>
      </div>

      {/* Metrics — stacked vertically on the right */}
      <div className="flex flex-col gap-2 w-[120px] shrink-0">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, x: 8 }}
            animate={metricsVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: 8 }}
            transition={{ duration: 0.35, delay: i * 0.1, ease }}
            className="flex-1 rounded-xl border border-border bg-background/50 px-3 py-3 flex flex-col justify-center"
          >
            <p className={`text-[18px] font-semibold tabular-nums leading-none ${m.color}`}>{m.value}</p>
            <p className="text-[9px] text-muted-foreground/50 mt-1.5 leading-tight">{m.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── Card definitions ─────────────────────────────────────────────────────────

interface CardDef {
  icon: React.ElementType
  title: string
  description: string
  span: string
  anim: (active: boolean) => React.ReactNode
}

// ─── Individual card with inView trigger ─────────────────────────────────────

function BentoCard({ card }: { card: CardDef }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, margin: "-60px" })

  return (
    <motion.div
      ref={ref}
      variants={staggerItem}
      whileHover={{ y: -3, transition: { duration: 0.3, ease } }}
      className={`group relative overflow-hidden rounded-2xl border border-border bg-card transition-all duration-500 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/[0.05] ${card.span}`}
    >
      {/* Hover gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/[0.04] via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative flex flex-col h-full">
        {/* Top: icon + animation */}
        <div className="p-6 pb-4">
          {/* Icon */}
          <motion.div
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 border border-accent/10 transition-all duration-500 group-hover:bg-accent/15 group-hover:border-accent/25 mb-5"
            whileHover={{ rotate: 5, scale: 1.05 }}
            transition={{ duration: 0.25 }}
          >
            <card.icon className="h-4 w-4 text-accent" />
          </motion.div>

          {/* Animation area — grows freely with content */}
          <div>
            {card.anim(isInView)}
          </div>
        </div>

        {/* Bottom: text — separated by border */}
        <div className="border-t border-border/50 px-6 py-5 mt-auto">
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
            {card.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {card.description}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function Bento() {
  const { t } = useLanguage()
  const cards: CardDef[] = [
    {
      icon: Microphone,
      title: t.bento.voiceTitle,
      description: t.bento.voiceDesc,
      span: "",
      anim: (active) => <VoiceAnim active={active} t={t} />,
    },
    {
      icon: FileText,
      title: t.bento.historyTitle,
      description: t.bento.historyDesc,
      span: "",
      anim: (active) => <HistoryAnim active={active} t={t} />,
    },
    {
      icon: Bell,
      title: t.bento.notifTitle,
      description: t.bento.notifDesc,
      span: "",
      anim: (active) => <NotifAnim active={active} t={t} />,
    },
    {
      icon: UserCheck,
      title: t.bento.managerTitle,
      description: t.bento.managerDesc,
      span: "md:col-span-2",
      anim: (active) => <ManagerAnim active={active} t={t} />,
    },
    {
      icon: Shield,
      title: t.bento.pixTitle,
      description: t.bento.pixDesc,
      span: "",
      anim: (active) => <PixAnim active={active} t={t} />,
    },
    {
      icon: Sparkle,
      title: t.bento.learningTitle,
      description: t.bento.learningDesc,
      span: "md:col-span-3",
      anim: (active) => <LearningAnim active={active} t={t} />,
    },
  ]

  return (
    <section id="produto" className="border-t border-border py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="mx-auto max-w-lg text-center mb-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            {t.bento.tag}
          </p>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {t.bento.title}{" "}
            <span className="font-display italic text-accent">{t.bento.titleAccent}</span>
          </h2>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {cards.map((card) => (
            <BentoCard key={card.title} card={card} />
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
