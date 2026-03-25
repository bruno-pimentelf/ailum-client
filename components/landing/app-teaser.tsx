"use client"

import { useRef, useState, useEffect } from "react"
import { motion, AnimatePresence, useInView } from "framer-motion"
import {
  DeviceMobileCamera,
  Bell,
  CalendarCheck,
  UserCircle,
  Microphone,
  ChatCircleDots,
  CheckCircle,
  Clock,
  Sparkle,
  ArrowRight,
} from "@phosphor-icons/react"
import { FadeIn } from "./motion"

const ease = [0.33, 1, 0.68, 1] as const

// ─── Phone mockup screens ────────────────────────────────────────────────────

function AgendaScreen() {
  const [visibleApts, setVisibleApts] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  const apts = [
    { time: "09:00", patient: "Ana Costa", type: "Consulta", status: "confirmed" as const },
    { time: "10:30", patient: "Pedro Lima", type: "Retorno", status: "confirmed" as const },
    { time: "14:00", patient: "Julia Santos", type: "Exame", status: "pending" as const },
    { time: "15:30", patient: "Carlos Dias", type: "Consulta", status: "confirmed" as const },
  ]

  useEffect(() => {
    if (!isInView) return
    let i = 0
    const interval = setInterval(() => {
      i++
      if (i > apts.length) { clearInterval(interval); return }
      setVisibleApts(i)
    }, 400)
    return () => clearInterval(interval)
  }, [isInView])

  return (
    <div ref={ref} className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold text-white/80">Hoje, 25 mar</p>
        <span className="text-[9px] text-accent/60 font-medium">{apts.length} consultas</span>
      </div>
      {apts.slice(0, visibleApts).map((apt, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease }}
          className="flex items-center gap-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05] px-3 py-2"
        >
          <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${
            apt.status === "confirmed" ? "bg-blue-500/30 text-blue-300" : "bg-white/[0.06] text-white/50"
          }`}>
            {apt.patient[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-white/80 truncate">{apt.patient}</p>
            <p className="text-[8px] text-white/35">{apt.type}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] font-mono font-bold text-white/60 tabular-nums">{apt.time}</p>
            {apt.status === "confirmed" ? (
              <CheckCircle className="h-3 w-3 text-emerald-400/50 ml-auto" weight="fill" />
            ) : (
              <Clock className="h-3 w-3 text-amber-400/50 ml-auto" weight="fill" />
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function NotificationsScreen() {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  const notifs = [
    { icon: CheckCircle, color: "text-emerald-400/60", text: "Pagamento confirmado — Ana Costa", time: "agora" },
    { icon: CalendarCheck, color: "text-accent/60", text: "Nova consulta agendada às 16h", time: "2 min" },
    { icon: Bell, color: "text-amber-400/60", text: "Lembrete enviado — Pedro Lima", time: "5 min" },
    { icon: ChatCircleDots, color: "text-accent/60", text: "Mensagem: Julia quer remarcar", time: "12 min" },
  ]

  useEffect(() => {
    if (!isInView) return
    let i = 0
    const interval = setInterval(() => {
      i++
      if (i > notifs.length) { clearInterval(interval); return }
      setCount(i)
    }, 600)
    return () => clearInterval(interval)
  }, [isInView])

  return (
    <div ref={ref} className="space-y-1.5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold text-white/80">Notificações</p>
        <span className="text-[9px] text-white/30">{count} novas</span>
      </div>
      {notifs.slice(0, count).map((n, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3, ease }}
          className="flex items-start gap-2 rounded-lg bg-white/[0.02] px-2.5 py-2"
        >
          <n.icon className={`h-3.5 w-3.5 ${n.color} shrink-0 mt-0.5`} weight="fill" />
          <div className="flex-1 min-w-0">
            <p className="text-[9px] text-white/65 leading-snug">{n.text}</p>
            <p className="text-[8px] text-white/25 mt-0.5">{n.time}</p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function ConciergeScreen() {
  const [step, setStep] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return
    const timers = [
      setTimeout(() => setStep(1), 800),
      setTimeout(() => setStep(2), 2200),
      setTimeout(() => setStep(3), 3800),
    ]
    return () => timers.forEach(clearTimeout)
  }, [isInView])

  return (
    <div ref={ref} className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Sparkle className="h-3.5 w-3.5 text-accent/60" weight="fill" />
        <p className="text-[11px] font-semibold text-white/80">Concierge</p>
      </div>

      {/* Audio message */}
      <AnimatePresence>
        {step >= 1 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease }}
            className="flex justify-end"
          >
            <div className="rounded-xl rounded-br-sm bg-accent/10 border border-accent/15 px-3 py-2 flex items-center gap-2">
              <Microphone className="h-3 w-3 text-accent/60" weight="fill" />
              <div className="flex gap-px items-end">
                {Array.from({ length: 16 }, (_, i) => (
                  <motion.div
                    key={i}
                    className="w-[2px] rounded-full bg-accent/40"
                    initial={{ height: 3 }}
                    animate={{ height: 3 + Math.sin(i * 0.8) * 8 + Math.random() * 4 }}
                    transition={{ duration: 0.3, delay: i * 0.03 }}
                  />
                ))}
              </div>
              <span className="text-[9px] text-white/40 ml-1">0:04</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Typing */}
      <AnimatePresence>
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-start"
          >
            <div className="rounded-xl rounded-bl-sm bg-white/[0.03] border border-white/[0.06] px-3 py-2 flex items-center gap-1.5">
              <Sparkle className="h-2.5 w-2.5 text-accent/30" weight="fill" />
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-1 w-1 rounded-full bg-white/20"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Response */}
      <AnimatePresence>
        {step >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.5, ease }}
            className="space-y-1.5"
          >
            <div className="rounded-xl rounded-bl-sm bg-white/[0.03] border border-white/[0.06] px-3 py-2">
              <p className="text-[10px] text-white/65 leading-relaxed">Remarquei a Julia para quinta às 14h. Confirmação enviada por WhatsApp.</p>
            </div>
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3, ease }}
              className="inline-flex items-center gap-1.5 rounded-md bg-white/[0.03] border border-white/[0.06] px-2 py-1"
            >
              <CheckCircle className="h-3 w-3 text-emerald-400/60" weight="fill" />
              <span className="text-[8px] font-medium text-white/45">Remarcar consulta</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Phone Frame ─────────────────────────────────────────────────────────────

function PhoneFrame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-[280px] sm:w-[300px]">
        {/* Ambient glow behind phone */}
        <div className="absolute -inset-8 bg-accent/[0.03] rounded-[4rem] blur-[60px] pointer-events-none" />
        {/* Phone shell */}
        <div className="relative rounded-[2.5rem] border border-white/[0.10] bg-white/[0.03] p-[3px] shadow-2xl shadow-black/40">
          <div className="rounded-[calc(2.5rem-3px)] bg-zinc-950/95 overflow-hidden">
            {/* Status bar */}
            <div className="flex items-center justify-between px-6 pt-3 pb-1">
              <span className="text-[9px] font-semibold text-white/40 tabular-nums">9:41</span>
              <div className="h-[4px] w-20 rounded-full bg-white/[0.08]" />
              <div className="flex items-center gap-1">
                <div className="h-[6px] w-[6px] rounded-full bg-white/[0.15]" />
                <div className="h-[6px] w-[6px] rounded-full bg-white/[0.15]" />
              </div>
            </div>
            {/* Screen content */}
            <div className="px-4 pb-6 pt-3 min-h-[480px]">
              {children}
            </div>
            {/* Home indicator */}
            <div className="flex justify-center pb-2">
              <div className="h-[4px] w-28 rounded-full bg-white/[0.10]" />
            </div>
          </div>
        </div>
      </div>
      <span className="text-[12px] font-medium text-white/30">{label}</span>
    </div>
  )
}

// ─── Tab selector ────────────────────────────────────────────────────────────

const TABS = [
  { id: "agenda", label: "Agenda", icon: CalendarCheck },
  { id: "notifications", label: "Notificações", icon: Bell },
  { id: "concierge", label: "Concierge", icon: Sparkle },
] as const

type TabId = (typeof TABS)[number]["id"]

// ─── Main Export ─────────────────────────────────────────────────────────────

export function AppTeaser() {
  const [activeTab, setActiveTab] = useState<TabId>("agenda")
  const [autoRotate, setAutoRotate] = useState(true)

  // Auto rotate tabs
  useEffect(() => {
    if (!autoRotate) return
    const interval = setInterval(() => {
      setActiveTab((prev) => {
        const idx = TABS.findIndex((t) => t.id === prev)
        return TABS[(idx + 1) % TABS.length].id
      })
    }, 5000)
    return () => clearInterval(interval)
  }, [autoRotate])

  return (
    <section className="relative py-24 md:py-36 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[40rem] w-[50rem] rounded-full bg-accent/[0.015] blur-[180px]" />
      </div>

      <div className="mx-auto max-w-5xl px-6">
        <FadeIn direction="up" className="text-center mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-accent/20 bg-accent/[0.08] px-5 py-2 mb-6 shadow-[0_0_24px_rgba(0,181,212,0.12)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
              Em breve
            </span>
          </div>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Ailum na palma da{" "}
            <span className="font-display italic text-white/50">sua mão</span>
          </h2>
          <p className="mt-3 text-sm text-white/35 max-w-md mx-auto">
            Gerencie consultas, receba notificações e fale com o Concierge — direto do celular.
          </p>
        </FadeIn>

        {/* Tab selector */}
        <FadeIn delay={0.1}>
          <div className="flex items-center justify-center gap-1 mb-12">
            {TABS.map((tab) => {
              const active = tab.id === activeTab
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setAutoRotate(false) }}
                  className={`relative flex items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-medium transition-all duration-300 ${
                    active ? "text-white/90" : "text-white/40 hover:text-white/60"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="app-teaser-tab"
                      className="absolute inset-0 rounded-lg bg-white/[0.06] border border-white/[0.08]"
                      transition={{ duration: 0.3, ease }}
                    />
                  )}
                  <tab.icon className={`h-3.5 w-3.5 relative z-10 ${active ? "text-accent/70" : ""}`} weight={active ? "fill" : "regular"} />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </FadeIn>

        {/* Phone mockup */}
        <FadeIn delay={0.2}>
          <div className="flex justify-center">
            <PhoneFrame label={
              activeTab === "agenda" ? "Sua agenda do dia" :
              activeTab === "notifications" ? "Tudo em tempo real" :
              "Gerencie por voz"
            }>
              <AnimatePresence mode="wait">
                {activeTab === "agenda" && (
                  <motion.div
                    key="agenda"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease }}
                  >
                    <AgendaScreen />
                  </motion.div>
                )}
                {activeTab === "notifications" && (
                  <motion.div
                    key="notifications"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease }}
                  >
                    <NotificationsScreen />
                  </motion.div>
                )}
                {activeTab === "concierge" && (
                  <motion.div
                    key="concierge"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease }}
                  >
                    <ConciergeScreen />
                  </motion.div>
                )}
              </AnimatePresence>
            </PhoneFrame>
          </div>
        </FadeIn>

        {/* Feature pills */}
        <FadeIn delay={0.35}>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            {[
              { icon: CalendarCheck, text: "Agenda completa" },
              { icon: UserCircle, text: "Perfil de pacientes" },
              { icon: Microphone, text: "Áudio pro Concierge" },
              { icon: Bell, text: "Notificações push" },
              { icon: ChatCircleDots, text: "Chat com pacientes" },
            ].map((item, i) => (
              <motion.div
                key={item.text}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.06, ease }}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-3.5 py-1.5 text-[11px] text-white/40"
              >
                <item.icon className="h-3 w-3 text-accent/40" weight="fill" />
                {item.text}
              </motion.div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
