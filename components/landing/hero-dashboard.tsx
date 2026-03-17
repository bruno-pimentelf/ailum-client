"use client"

import { useEffect, useRef, useState, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  WhatsappLogo,
  CheckCircle,
  CalendarCheck,
  CurrencyDollar,
  ArrowUpRight,
  Sparkle,
  Clock,
  UserCircle,
  ChatCircle,
} from "@phosphor-icons/react"

const ease = [0.32, 0.72, 0, 1] as const

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface ConversationMessage {
  id: number
  from: "patient" | "ai"
  text: string
  time: string
}

interface AppointmentSlot {
  id: number
  patient: string
  initials: string
  time: string
  doctor: string
  status: "confirmed" | "pending" | "paid"
  color: string
}

interface ActivityEvent {
  id: number
  icon: "pix" | "schedule" | "message" | "confirm"
  text: string
  value?: string
  ts: number
}

/* ─── Static data ────────────────────────────────────────────────────────── */

const CONVERSATIONS: ConversationMessage[][] = [
  [
    { id: 1, from: "patient", text: "Oi! Tem horário com a Dra. Marina essa semana?", time: "09:41" },
    { id: 2, from: "ai", text: "Olá! Tenho quinta às 10h ou sexta às 14h disponíveis. Qual prefere?", time: "09:41" },
    { id: 3, from: "patient", text: "Quinta perfeito!", time: "09:42" },
    { id: 4, from: "ai", text: "Ótimo! Enviei o Pix de R$150 para confirmar o horário.", time: "09:42" },
  ],
  [
    { id: 1, from: "patient", text: "Preciso remarcar minha consulta de amanhã", time: "11:03" },
    { id: 2, from: "ai", text: "Claro! Tenho terça às 15h ou quarta às 09h. Qual fica melhor?", time: "11:03" },
    { id: 3, from: "patient", text: "Quarta às 9h está ótimo", time: "11:04" },
    { id: 4, from: "ai", text: "Remarcado! Você receberá a confirmação em instantes.", time: "11:04" },
  ],
  [
    { id: 1, from: "patient", text: "Quanto custa a consulta de dermatologia?", time: "14:22" },
    { id: 2, from: "ai", text: "A consulta com a Dra. Marina é R$200. Posso já reservar um horário?", time: "14:22" },
    { id: 3, from: "patient", text: "Sim! Sexta à tarde se tiver", time: "14:23" },
    { id: 4, from: "ai", text: "Sexta às 16h disponível. Pix enviado para garantir!", time: "14:23" },
  ],
]

const APPOINTMENTS: AppointmentSlot[] = [
  { id: 1, patient: "Ana Souza", initials: "AS", time: "09:00", doctor: "Dra. Marina", status: "confirmed", color: "from-violet-500/20 to-violet-500/5" },
  { id: 2, patient: "Carlos Lima", initials: "CL", time: "10:00", doctor: "Dr. Rafael", status: "paid", color: "from-emerald-500/20 to-emerald-500/5" },
  { id: 3, patient: "Beatriz Nunes", initials: "BN", time: "11:30", doctor: "Dra. Marina", status: "confirmed", color: "from-accent/20 to-accent/5" },
  { id: 4, patient: "Pedro Alves", initials: "PA", time: "14:00", doctor: "Dr. Rafael", status: "pending", color: "from-amber-500/20 to-amber-500/5" },
  { id: 5, patient: "Mariana Costa", initials: "MC", time: "15:30", doctor: "Dra. Marina", status: "paid", color: "from-emerald-500/20 to-emerald-500/5" },
]

const ACTIVITY_POOL: Omit<ActivityEvent, "id" | "ts">[] = [
  { icon: "pix", text: "Pix confirmado", value: "R$ 150" },
  { icon: "schedule", text: "Consulta agendada", value: "10:00" },
  { icon: "message", text: "Nova conversa iniciada" },
  { icon: "confirm", text: "Horário bloqueado", value: "14:30" },
  { icon: "pix", text: "Pix confirmado", value: "R$ 200" },
  { icon: "schedule", text: "Remarcação confirmada", value: "09:00" },
  { icon: "message", text: "Paciente respondeu" },
  { icon: "pix", text: "Pix confirmado", value: "R$ 150" },
  { icon: "confirm", text: "Consulta confirmada", value: "15:30" },
]

/* ─── Sub-components ─────────────────────────────────────────────────────── */

const ActivityIcon = memo(({ type }: { type: ActivityEvent["icon"] }) => {
  if (type === "pix") return (
    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
      <CurrencyDollar className="h-3 w-3 text-emerald-400" weight="bold" />
    </div>
  )
  if (type === "schedule") return (
    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 ring-1 ring-accent/20">
      <CalendarCheck className="h-3 w-3 text-accent/80" weight="bold" />
    </div>
  )
  if (type === "message") return (
    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/10 ring-1 ring-violet-500/20">
      <ChatCircle className="h-3 w-3 text-violet-400" weight="bold" />
    </div>
  )
  return (
    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.05] ring-1 ring-white/[0.1]">
      <CheckCircle className="h-3 w-3 text-white/40" weight="bold" />
    </div>
  )
})
ActivityIcon.displayName = "ActivityIcon"

const StatusBadge = memo(({ status }: { status: AppointmentSlot["status"] }) => {
  if (status === "confirmed") return (
    <span className="rounded-full bg-accent/8 px-2 py-0.5 text-[9px] font-semibold tracking-wide text-accent/70 ring-1 ring-accent/15">
      Confirmado
    </span>
  )
  if (status === "paid") return (
    <span className="rounded-full bg-emerald-500/8 px-2 py-0.5 text-[9px] font-semibold tracking-wide text-emerald-400/80 ring-1 ring-emerald-500/15">
      Pago
    </span>
  )
  return (
    <span className="rounded-full bg-amber-500/8 px-2 py-0.5 text-[9px] font-semibold tracking-wide text-amber-400/70 ring-1 ring-amber-500/15">
      Aguardando
    </span>
  )
})
StatusBadge.displayName = "StatusBadge"

/* ─── Revenue counter ────────────────────────────────────────────────────── */

function RevenueCounter() {
  const [value, setValue] = useState(4200)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      const bump = [150, 200, 150][Math.floor(Math.random() * 3)]
      setValue(v => v + bump)
      setFlash(true)
      setTimeout(() => setFlash(false), 600)
    }, 4800)
    return () => clearInterval(interval)
  }, [])

  const formatted = value.toLocaleString("pt-BR")

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-1">
        <span className="text-[11px] font-medium text-white/25">R$</span>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: -12, opacity: 0, filter: "blur(4px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: 12, opacity: 0, filter: "blur(4px)" }}
            transition={{ duration: 0.35, ease }}
            className={`font-display text-[1.6rem] font-bold tracking-[-0.04em] leading-none transition-colors duration-300 ${flash ? "text-emerald-400" : "text-white/85"}`}
          >
            {formatted}
          </motion.span>
        </AnimatePresence>
      </div>
      <p className="text-[10px] text-white/25">faturado hoje</p>
    </div>
  )
}

/* ─── AI Pulse indicator ─────────────────────────────────────────────────── */

function AIPulse() {
  const [active, setActive] = useState(true)
  const [count, setCount] = useState(3)

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(c => c + Math.floor(Math.random() * 2))
      setActive(a => !a)
      setTimeout(() => setActive(true), 400)
    }, 3200)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-2.5">
      <div className="relative flex h-2 w-2">
        <span className={`absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 ${active ? "animate-ping" : ""}`} />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
      </div>
      <span className="text-[11px] font-medium text-white/40">
        IA ativa · <span className="text-accent/70">{count} conversas</span>
      </span>
    </div>
  )
}

/* ─── Main component ─────────────────────────────────────────────────────── */

export const HeroDashboard = memo(function HeroDashboard() {
  const [convIndex, setConvIndex] = useState(0)
  const [visibleMessages, setVisibleMessages] = useState(1)
  const [activities, setActivities] = useState<ActivityEvent[]>(() =>
    ACTIVITY_POOL.slice(0, 3).map((a, i) => ({ ...a, id: i, ts: Date.now() - (3 - i) * 8000 }))
  )
  const activityIdRef = useRef(100)
  const poolIndexRef = useRef(3)

  // Reveal messages one by one
  useEffect(() => {
    const conv = CONVERSATIONS[convIndex]
    if (visibleMessages >= conv.length) return
    const delay = visibleMessages === 1 ? 1200 : 1600
    const t = setTimeout(() => setVisibleMessages(v => v + 1), delay)
    return () => clearTimeout(t)
  }, [visibleMessages, convIndex])

  // Cycle to next conversation
  useEffect(() => {
    const conv = CONVERSATIONS[convIndex]
    if (visibleMessages < conv.length) return
    const t = setTimeout(() => {
      setConvIndex(i => (i + 1) % CONVERSATIONS.length)
      setVisibleMessages(1)
    }, 4000)
    return () => clearTimeout(t)
  }, [visibleMessages, convIndex])

  // Activity feed
  useEffect(() => {
    const interval = setInterval(() => {
      const item = ACTIVITY_POOL[poolIndexRef.current % ACTIVITY_POOL.length]
      poolIndexRef.current++
      const newEvent: ActivityEvent = {
        ...item,
        id: activityIdRef.current++,
        ts: Date.now(),
      }
      setActivities(prev => [newEvent, ...prev].slice(0, 5))
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  const conv = CONVERSATIONS[convIndex]
  const messages = conv.slice(0, visibleMessages)

  return (
    <div className="relative w-full overflow-hidden rounded-[1.75rem] bg-zinc-950 ring-1 ring-white/[0.06]">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-white/[0.04] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
            <div className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
            <div className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
          </div>
          <div className="h-4 w-px bg-white/[0.06]" />
          <span className="text-[11px] font-medium text-white/25 tracking-wide">Ailum · Clínica Harmonia</span>
        </div>
        <AIPulse />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-12 divide-x divide-white/[0.04]" style={{ minHeight: 380 }}>

        {/* Left: Appointment list */}
        <div className="col-span-4 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-3.5 w-3.5 text-accent/50" weight="bold" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/25">Hoje</span>
            </div>
            <span className="text-[10px] text-white/20">{APPOINTMENTS.length} consultas</span>
          </div>
          <div className="flex-1 overflow-hidden py-2">
            {APPOINTMENTS.map((apt, i) => (
              <motion.div
                key={apt.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: i * 0.08, ease }}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-colors duration-200"
              >
                <div className={`h-8 w-8 shrink-0 rounded-full bg-gradient-to-br ${apt.color} ring-1 ring-white/[0.08] flex items-center justify-center`}>
                  <span className="text-[9px] font-bold text-white/60">{apt.initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-white/60 truncate leading-none">{apt.patient}</p>
                  <p className="text-[9px] text-white/25 mt-0.5 leading-none">{apt.doctor}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="font-mono text-[10px] text-white/35 tabular-nums">{apt.time}</span>
                  <StatusBadge status={apt.status} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Center: Live conversation */}
        <div className="col-span-5 flex flex-col">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/[0.04]">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <WhatsappLogo className="h-3 w-3 text-emerald-400" weight="fill" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-white/50 leading-none">WhatsApp · ao vivo</p>
            </div>
            <AnimatePresence mode="wait">
              <motion.span
                key={convIndex}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="text-[9px] text-white/20"
              >
                conversa {convIndex + 1}/{CONVERSATIONS.length}
              </motion.span>
            </AnimatePresence>
          </div>

          <div className="flex-1 flex flex-col justify-end px-4 py-4 gap-2 overflow-hidden">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={`${convIndex}-${msg.id}`}
                  initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.4, ease }}
                  className={`flex ${msg.from === "ai" ? "justify-end" : "justify-start"}`}
                >
                  {msg.from === "patient" && (
                    <div className="flex items-end gap-2 max-w-[85%]">
                      <div className="h-5 w-5 shrink-0 rounded-full bg-white/[0.06] flex items-center justify-center mb-0.5">
                        <UserCircle className="h-3.5 w-3.5 text-white/30" weight="fill" />
                      </div>
                      <div className="rounded-2xl rounded-bl-sm bg-white/[0.05] px-3 py-2">
                        <p className="text-[11px] text-white/50 leading-relaxed">{msg.text}</p>
                        <p className="text-[9px] text-white/20 mt-0.5 text-right">{msg.time}</p>
                      </div>
                    </div>
                  )}
                  {msg.from === "ai" && (
                    <div className="flex items-end gap-2 max-w-[85%]">
                      <div className="rounded-2xl rounded-br-sm bg-accent/[0.1] px-3 py-2 ring-1 ring-accent/[0.08]">
                        <p className="text-[11px] text-white/65 leading-relaxed">{msg.text}</p>
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          <p className="text-[9px] text-white/20">{msg.time}</p>
                          <CheckCircle className="h-2.5 w-2.5 text-accent/40" weight="fill" />
                        </div>
                      </div>
                      <div className="h-5 w-5 shrink-0 rounded-full bg-accent/10 ring-1 ring-accent/20 flex items-center justify-center mb-0.5">
                        <Sparkle className="h-3 w-3 text-accent/70" weight="fill" />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            {visibleMessages < conv.length && conv[visibleMessages].from === "ai" && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-end"
              >
                <div className="flex items-center gap-1.5 rounded-2xl rounded-br-sm bg-accent/[0.06] px-3 py-2.5 ring-1 ring-accent/[0.06]">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-accent/50"
                      animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right: Stats + activity */}
        <div className="col-span-3 flex flex-col">
          {/* Revenue */}
          <div className="px-4 py-4 border-b border-white/[0.04]">
            <div className="flex items-start justify-between mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" weight="bold" />
              </div>
              <span className="text-[9px] text-emerald-400/60 font-semibold">+12% hoje</span>
            </div>
            <RevenueCounter />
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 divide-x divide-white/[0.04] border-b border-white/[0.04]">
            {[
              { label: "Agendados", value: "18", icon: <CalendarCheck className="h-3 w-3 text-accent/50" weight="bold" /> },
              { label: "No-show", value: "0", icon: <CheckCircle className="h-3 w-3 text-emerald-400/60" weight="bold" /> },
            ].map(stat => (
              <div key={stat.label} className="flex flex-col gap-1.5 px-3 py-3">
                <div className="flex items-center gap-1.5">
                  {stat.icon}
                  <span className="text-[9px] text-white/25 uppercase tracking-wide">{stat.label}</span>
                </div>
                <span className="font-display text-xl font-bold tracking-tight text-white/70">{stat.value}</span>
              </div>
            ))}
          </div>

          {/* Activity feed */}
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.04]">
              <Clock className="h-3 w-3 text-white/20" weight="bold" />
              <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/20">Atividade</span>
            </div>
            <div className="flex flex-col px-3 py-2 gap-1.5 overflow-hidden">
              <AnimatePresence initial={false}>
                {activities.slice(0, 4).map(event => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: -16, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.35, ease }}
                    className="flex items-center gap-2"
                  >
                    <ActivityIcon type={event.icon} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-white/40 truncate leading-none">{event.text}</p>
                      {event.value && (
                        <p className="text-[9px] text-white/25 mt-0.5 leading-none font-medium">{event.value}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="flex items-center justify-between border-t border-white/[0.04] px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-white/25">Sistema operacional</span>
          </div>
          <div className="h-3 w-px bg-white/[0.06]" />
          <span className="text-[10px] text-white/20">Última sincronização: agora</span>
        </div>
        <div className="flex items-center gap-3">
          {["WhatsApp", "Agenda", "Pix"].map(label => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400/70" />
              <span className="text-[10px] text-white/20">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})
