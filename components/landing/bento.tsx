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
    <div className="h-[140px] flex flex-col justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[9px] text-white/30 uppercase tracking-wider">{t.bento.voiceLabel}</span>
        </div>
        <span className="text-[9px] text-accent/60 font-medium">{t.bento.voiceCustom}</span>
      </div>
      {/* Equalizer — fixed height container, bars use absolute positioning */}
      <div className="relative flex items-end gap-[3px]" style={{ height: 56 }}>
        {bars.map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-full bg-accent/50"
            style={{ height: "12%" }}
            animate={active ? {
              height: [`${h * 30}%`, `${h * 100}%`, `${h * 50}%`, `${h * 80}%`, `${h * 20}%`, `${h * 100}%`],
              opacity: [0.4, 0.9, 0.6, 0.9, 0.5, 0.9],
            } : { height: "12%", opacity: 0.15 }}
            transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.08, ease: "easeInOut" }}
          />
        ))}
      </div>
      <span className="text-[9px] text-white/20">{t.bento.clinicName}</span>
    </div>
  )
}

// ─── Card 2: Patient history lines ───────────────────────────────────────────
function HistoryAnim({ active, t }: { active: boolean; t: ReturnType<typeof useLanguage>["t"] }) {
  const historyLines = [
    { label: t.bento.historyLabels[0], tag: t.bento.historyTags[0], date: t.bento.historyDates[0], color: "text-accent", dot: "bg-accent" },
    { label: t.bento.historyLabels[1], tag: t.bento.historyTags[1], date: t.bento.historyDates[1], color: "text-blue-400", dot: "bg-blue-400" },
    { label: t.bento.historyLabels[2], tag: t.bento.historyTags[2], date: t.bento.historyDates[2], color: "text-violet-400", dot: "bg-violet-400" },
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
    <div className="h-[140px] flex flex-col justify-center gap-2">
      {historyLines.map((line, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={visible.includes(i) ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
          transition={{ duration: 0.4, ease }}
          className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2"
        >
          <div className={`h-1.5 w-1.5 rounded-full ${line.dot} shrink-0`} />
          <span className="text-[10px] font-medium text-white/60 flex-1 truncate">{line.label}</span>
          <span className={`text-[9px] font-semibold ${line.color}`}>{line.tag}</span>
          <span className="text-[8px] text-white/20 font-mono">{line.date}</span>
        </motion.div>
      ))}
    </div>
  )
}

// ─── Card 3: Notification stack ───────────────────────────────────────────────
function NotifAnim({ active, t }: { active: boolean; t: ReturnType<typeof useLanguage>["t"] }) {
  const notifications = [
    { Icon: Bell, text: t.bento.notif1, border: "border-accent/15", bg: "bg-accent/[0.04]", iconColor: "text-accent" },
    { Icon: CheckCircle, text: t.bento.notif2, border: "border-emerald-500/15", bg: "bg-emerald-500/[0.04]", iconColor: "text-emerald-400" },
    { Icon: ChatText, text: t.bento.notif3, border: "border-blue-500/15", bg: "bg-blue-500/[0.04]", iconColor: "text-blue-400" },
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
    <div className="h-[140px] flex flex-col justify-center gap-2">
      {notifications.map((n, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={visible.includes(i) ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -8, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
          className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 ${n.border} ${n.bg}`}
        >
          <n.Icon className={`h-3.5 w-3.5 shrink-0 ${n.iconColor}`} weight="fill" />
          <span className="text-[10px] text-white/55 leading-snug">{n.text}</span>
        </motion.div>
      ))}
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
    const timer = setTimeout(run, 300)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [active])

  return (
    /* Fixed height — col-span-2 card, taller to accommodate chat */
    <div className="h-[160px] flex flex-col gap-1.5 overflow-hidden">
      {/* Manager header */}
      <div className="flex items-center gap-2 mb-0.5">
        <div className="relative shrink-0">
          <div className="h-7 w-7 rounded-full bg-violet-500/15 ring-1 ring-violet-500/20 flex items-center justify-center">
            <span className="text-[9px] font-bold text-violet-400">GM</span>
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-1 ring-zinc-950" />
        </div>
        <div>
          <p className="text-[10px] font-semibold text-white/60 leading-none">{t.bento.managerLabel}</p>
          <p className="text-[8px] text-emerald-400/70 mt-0.5">{t.bento.managerOnline}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 overflow-hidden">
        <AnimatePresence>
          {managerMessages.map((msg, i) =>
            visible.includes(i) ? (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 380, damping: 26 }}
                className={`flex ${msg.from === "clinic" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[75%] rounded-xl px-2.5 py-1.5 text-[10px] leading-snug ${
                  msg.from === "clinic"
                    ? "bg-accent/[0.1] text-white/65 rounded-br-sm ring-1 ring-accent/[0.08]"
                    : "bg-white/[0.05] text-white/50 rounded-bl-sm"
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
              <div className="bg-white/[0.05] rounded-xl rounded-bl-sm px-3 py-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-white/25"
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
    <div className="h-[140px] flex flex-col justify-between gap-2">
      {/* WhatsApp message bubble */}
      <div className="flex flex-col gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
        <div className="flex items-center gap-2">
          <WhatsappLogo className="h-3.5 w-3.5 text-emerald-400/60" weight="fill" />
          <span className="text-[9px] text-white/25">{t.bento.clinicName} · WhatsApp</span>
        </div>
        <p className="text-[10px] text-white/50 leading-snug">{t.bento.pixMsg}</p>
        <div className="flex items-center gap-2 rounded-lg border border-accent/15 bg-accent/[0.04] px-2.5 py-1.5">
          <div className="h-5 w-5 rounded bg-zinc-900 border border-accent/20 flex items-center justify-center shrink-0">
            <span className="text-[6px] font-bold text-accent">PIX</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-semibold text-accent/80">R$ 150,00</p>
            <p className="text-[8px] text-white/20 truncate font-mono">00020126…6304ABCD</p>
          </div>
        </div>
      </div>

      {/* Payment status — fixed height slot so layout never shifts */}
      <div className="h-8 flex items-center">
        <AnimatePresence mode="wait">
          {phase === "idle" && (
            <motion.div key="idle" exit={{ opacity: 0 }} className="w-full h-px bg-white/[0.06]" />
          )}
          {phase === "progress" && (
            <motion.div key="prog" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex flex-col gap-1">
              <div className="flex justify-between">
                <span className="text-[9px] text-white/25">{t.bento.pixProcessing}</span>
                <span className="text-[9px] text-accent/60 tabular-nums font-mono">{progress}%</span>
              </div>
              <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div className="h-full rounded-full bg-accent/60" style={{ width: `${progress}%` }} />
              </div>
            </motion.div>
          )}
          {phase === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              className="w-full flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-1.5"
            >
              <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" weight="fill" />
              <div>
                <p className="text-[10px] font-semibold text-emerald-400 leading-none">{t.bento.pixDoneTitle}</p>
                <p className="text-[8px] text-emerald-400/50 mt-0.5">{t.bento.pixDoneSub}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Card 6: Appointments chart (AgendaChart style) ──────────────────────────

const allChartData = [
  { mes: "Jan", agendamentos: 18, confirmados: 16 },
  { mes: "Fev", agendamentos: 24, confirmados: 22 },
  { mes: "Mar", agendamentos: 21, confirmados: 20 },
  { mes: "Abr", agendamentos: 31, confirmados: 29 },
  { mes: "Mai", agendamentos: 36, confirmados: 34 },
  { mes: "Jun", agendamentos: 33, confirmados: 32 },
  { mes: "Jul", agendamentos: 44, confirmados: 41 },
  { mes: "Ago", agendamentos: 49, confirmados: 47 },
  { mes: "Set", agendamentos: 46, confirmados: 44 },
  { mes: "Out", agendamentos: 58, confirmados: 56 },
  { mes: "Nov", agendamentos: 64, confirmados: 62 },
  { mes: "Dez", agendamentos: 75, confirmados: 74 },
]

function AgendaAnim({ active, t }: { active: boolean; t: ReturnType<typeof useLanguage>["t"] }) {
  const chartConfig: ChartConfig = {
    agendamentos: { label: "Agendamentos", color: "oklch(0.712 0.126 215.9)" },
    confirmados:  { label: "Confirmados",  color: "oklch(0.696 0.17 162.48)" },
  }

  const metrics = [
    { label: t.bento.metric1, value: "98%", color: "text-accent" },
    { label: t.bento.metric2, value: "4.9★", color: "text-amber-400" },
    { label: t.bento.metric3, value: "0%",  color: "text-emerald-400" },
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
        await new Promise(r => setTimeout(r, 90))
      }
      await new Promise(r => setTimeout(r, 200))
      if (cancelled) return
      setMetricsVisible(true)
    }
    run()
    return () => { cancelled = true }
  }, [active])

  const visibleData = allChartData.slice(0, revealed)
  const total = visibleData.reduce((s, d) => s + d.agendamentos, 0)

  return (
    /* Responsive: stacks on mobile, side-by-side on sm+ */
    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-stretch sm:h-[200px]">
      {/* Chart panel */}
      <div className="flex-1 min-w-0 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 pt-3 pb-2 flex flex-col h-[160px] sm:h-auto">
        <div className="flex items-center justify-between mb-2 shrink-0">
          <div>
            <span className="text-[9px] text-white/25 uppercase tracking-wider">{t.bento.chartLabel}</span>
            <AnimatePresence>
              {revealed === allChartData.length && (
                <motion.span
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="ml-2 text-[9px] text-emerald-400/80 font-medium"
                >
                  {t.bento.chartGrowth}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <AnimatePresence mode="wait">
            <motion.span
              key={total}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-lg font-bold tabular-nums text-white/70 leading-none"
            >
              {total}
            </motion.span>
          </AnimatePresence>
        </div>
        <div className="flex-1 min-h-0">
          <ChartContainer id="bento-agenda" config={chartConfig} className="h-full w-full aspect-auto">
            <AreaChart data={visibleData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="fillAgend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--color-agendamentos)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--color-agendamentos)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fillConf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--color-confirmados)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="var(--color-confirmados)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
              <XAxis
                dataKey="mes"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 8, fill: "rgba(255,255,255,0.2)" }}
                interval="preserveStartEnd"
                tickMargin={6}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
              <Area type="monotone" dataKey="agendamentos" stroke="var(--color-agendamentos)" strokeWidth={1.5} fill="url(#fillAgend)" dot={false} isAnimationActive={false} />
              <Area type="monotone" dataKey="confirmados"  stroke="var(--color-confirmados)"  strokeWidth={1.5} fill="url(#fillConf)"  dot={false} isAnimationActive={false} />
            </AreaChart>
          </ChartContainer>
        </div>
      </div>

      {/* Metric pills — row on mobile, column on sm+ */}
      <div className="flex flex-row gap-2 sm:flex-col sm:w-[110px] sm:shrink-0">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, x: 8 }}
            animate={metricsVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: 8 }}
            transition={{ duration: 0.35, delay: i * 0.1, ease }}
            className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 sm:py-0 flex flex-col justify-center"
          >
            <p className={`text-[17px] font-bold tabular-nums leading-none ${m.color}`}>{m.value}</p>
            <p className="text-[9px] text-white/25 mt-1.5 leading-tight">{m.label}</p>
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
      whileHover={{ y: -4, transition: { duration: 0.5, ease: [0.32, 0.72, 0, 1] } }}
      className={`group ${card.span}`}
    >
      {/* Double-bezel outer shell */}
      <div className="rounded-[1.5rem] bg-white/[0.02] p-[1px] ring-1 ring-white/[0.06] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:ring-accent/20 group-hover:shadow-[0_16px_40px_-12px_rgba(0,181,212,0.08)]">
        {/* Inner core */}
        <div className="relative overflow-hidden rounded-[calc(1.5rem-1px)] bg-zinc-950/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]">
          {/* Hover gradient */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/[0.03] via-transparent to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />

          <div className="relative flex flex-col h-full">
            {/* Top: icon + animation */}
            <div className="p-7 pb-5">
              <motion.div
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/8 ring-1 ring-accent/10 transition-all duration-500 group-hover:bg-accent/12 group-hover:ring-accent/20 mb-5"
                whileHover={{ rotate: 3, scale: 1.03 }}
                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              >
                <card.icon className="h-4 w-4 text-accent" />
              </motion.div>

              <div>{card.anim(isInView)}</div>
            </div>

            {/* Bottom: text */}
            <div className="border-t border-white/[0.04] px-7 py-6 mt-auto">
              <h3 className="font-display text-[15px] font-bold tracking-tight text-foreground">
                {card.title}
              </h3>
              <p className="mt-2.5 text-[13px] leading-relaxed text-white/30">
                {card.description}
              </p>
            </div>
          </div>
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
      anim: (active) => <AgendaAnim active={active} t={t} />,
    },
  ]

  return (
    <section id="produto" className="py-28 md:py-40">
      <div className="mx-auto max-w-7xl px-6">
        <FadeIn className="max-w-xl mb-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            {t.bento.tag}
          </p>
          <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl leading-[1.1]">
            {t.bento.title}
            <br />
            <span className="text-white/20">{t.bento.titleAccent}</span>
          </h2>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <BentoCard key={card.title} card={card} />
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
