"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { motion, AnimatePresence, useInView } from "framer-motion"
import {
  Lock,
  Sparkle,
  CheckCircle,
  CalendarCheck,
  CaretLeft,
  CaretRight,
  Microphone,
  PaperPlaneRight,
} from "@phosphor-icons/react"
import { FadeIn } from "./motion"

const ease = [0.33, 1, 0.68, 1] as const

// ─── Types ───────────────────────────────────────────────────────────────────

interface MockApt {
  day: number
  startHour: number
  duration: number
  patient: string
  type: string
  status: "confirmed" | "pending"
}

interface CalendarEvent {
  type: "block" | "highlight-day" | "add-appointment" | "reset"
  day?: number
  startHour?: number
  endHour?: number
  appointment?: MockApt
}

interface ChatMsg {
  from: "user" | "ai"
  text: string
  tools?: { label: string; success: boolean }[]
  // Calendar effect triggered when this AI message appears
  calendarEffect?: CalendarEvent
}

// ─── Mock data ───────────────────────────────────────────────────────────────

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
const HOUR_H = 48

const MOCK_WEEK = (() => {
  const base = new Date()
  base.setDate(base.getDate() - base.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base)
    d.setDate(d.getDate() + i)
    return d
  })
})()

const BASE_APPOINTMENTS: MockApt[] = [
  { day: 1, startHour: 9, duration: 1, patient: "Ana Costa", type: "Consulta", status: "confirmed" },
  { day: 1, startHour: 14, duration: 1, patient: "Pedro Lima", type: "Retorno", status: "confirmed" },
  { day: 2, startHour: 10, duration: 1, patient: "Julia Santos", type: "Consulta", status: "pending" },
  { day: 2, startHour: 15, duration: 1, patient: "Carlos Dias", type: "Exame", status: "confirmed" },
  { day: 3, startHour: 9, duration: 1, patient: "Maria Oliveira", type: "Consulta", status: "confirmed" },
  { day: 3, startHour: 11, duration: 1, patient: "Rafael Nunes", type: "Retorno", status: "confirmed" },
  { day: 4, startHour: 10, duration: 1, patient: "Fernanda Costa", type: "Consulta", status: "pending" },
  { day: 4, startHour: 14, duration: 1, patient: "Lucas Almeida", type: "Consulta", status: "confirmed" },
  { day: 5, startHour: 9, duration: 1, patient: "Beatriz Rocha", type: "Retorno", status: "confirmed" },
]

const isAvailable = (day: number, hour: number) => {
  if (day === 0 || day === 6) return false
  if (hour < 9 || hour >= 18) return false
  return true
}

// ─── Chat scenarios with calendar effects ────────────────────────────────────

const CHAT_SCENARIOS: ChatMsg[][] = [
  [
    { from: "user", text: "Bloqueia quarta à tarde pra mim" },
    {
      from: "ai",
      text: "Pronto! Bloqueei quarta-feira das 12h às 14h.",
      tools: [{ label: "Bloquear horário", success: true }],
      calendarEffect: { type: "block", day: 3, startHour: 12, endHour: 14 },
    },
    { from: "user", text: "Quais consultas tenho terça?" },
    {
      from: "ai",
      text: "Terça você tem 2 consultas:\n• 10h — Julia Santos\n• 15h — Carlos Dias",
      tools: [{ label: "Listar consultas", success: true }],
      calendarEffect: { type: "highlight-day", day: 2 },
    },
  ],
  [
    { from: "user", text: "Marca a Camila sexta às 11h" },
    {
      from: "ai",
      text: "Agendado! Camila Ferreira marcada para sexta às 11h.",
      tools: [{ label: "Criar agendamento", success: true }],
      calendarEffect: {
        type: "add-appointment",
        appointment: { day: 5, startHour: 11, duration: 1, patient: "Camila Ferreira", type: "Consulta", status: "confirmed" },
      },
    },
    { from: "user", text: "Bloqueia sexta à tarde inteira" },
    {
      from: "ai",
      text: "Bloqueado! Sexta das 13h às 18h indisponível.",
      tools: [{ label: "Bloquear horário", success: true }],
      calendarEffect: { type: "block", day: 5, startHour: 13, endHour: 18 },
    },
  ],
]

// ─── Mini Calendar Component ─────────────────────────────────────────────────

function MiniCalendar({
  blocks,
  extraApts,
  highlightDay,
  flashBlock,
}: {
  blocks: { day: number; startHour: number; endHour: number }[]
  extraApts: MockApt[]
  highlightDay: number | null
  flashBlock: { day: number; startHour: number; endHour: number } | null
}) {
  const today = new Date().getDay()
  const allApts = [...BASE_APPOINTMENTS, ...extraApts]

  const isBlocked = (day: number, hour: number) =>
    blocks.some((b) => b.day === day && hour >= b.startHour && hour < b.endHour)

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-white/90">Março 2026</span>
          <span className="text-[10px] text-white/30 font-medium">Semana atual</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="h-6 w-6 rounded-md flex items-center justify-center text-white/40 hover:text-white/60 hover:bg-white/[0.04] transition-colors">
            <CaretLeft className="h-3 w-3" weight="bold" />
          </button>
          <button className="h-6 w-6 rounded-md flex items-center justify-center text-white/40 hover:text-white/60 hover:bg-white/[0.04] transition-colors">
            <CaretRight className="h-3 w-3" weight="bold" />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        <div className="w-8" />
        {MOCK_WEEK.slice(1, 7).map((d, i) => {
          const dayIdx = i + 1
          const isHighlighted = dayIdx === highlightDay
          const isToday = d.getDay() === today
          return (
            <motion.div
              key={dayIdx}
              animate={isHighlighted ? { backgroundColor: "rgba(0,181,212,0.08)" } : { backgroundColor: "rgba(0,0,0,0)" }}
              transition={{ duration: 0.5, ease }}
              className="flex flex-col items-center py-1.5 rounded-lg"
            >
              <span className={`text-[8px] font-bold uppercase tracking-wider ${isHighlighted ? "text-accent/80" : "text-white/40"}`}>
                {WEEKDAYS[d.getDay()]}
              </span>
              <span className={`text-[11px] font-bold mt-0.5 ${
                isToday ? "bg-accent text-accent-foreground h-5 w-5 rounded-full flex items-center justify-center" :
                isHighlighted ? "text-accent" : "text-white/60"
              }`}>
                {d.getDate()}
              </span>
            </motion.div>
          )
        })}
      </div>

      {/* Time grid */}
      <div className="relative overflow-hidden rounded-lg border border-white/[0.04]" style={{ height: HOURS.length * HOUR_H }}>
        <div className="grid grid-cols-7 h-full">
          {/* Hour labels */}
          <div className="w-8 flex flex-col">
            {HOURS.map((h) => (
              <div key={h} className="flex items-start justify-end pr-1.5 pt-0.5" style={{ height: HOUR_H }}>
                <span className="text-[8px] font-mono text-white/25 tabular-nums">
                  {String(h).padStart(2, "0")}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns (Mon-Sat) */}
          {Array.from({ length: 6 }, (_, i) => i + 1).map((dayIdx) => {
            const dayApts = allApts.filter((a) => a.day === dayIdx)
            const isHighlighted = dayIdx === highlightDay

            return (
              <div key={dayIdx} className="relative border-l border-white/[0.04]">
                {/* Day highlight pulse */}
                <AnimatePresence>
                  {isHighlighted && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0 bg-accent/[0.03] z-[1] pointer-events-none"
                    />
                  )}
                </AnimatePresence>

                {/* Hour lines */}
                {HOURS.map((h, hi) => (
                  <div key={h} className="absolute left-0 right-0 border-t border-white/[0.03]" style={{ top: hi * HOUR_H }} />
                ))}

                {/* Unavailable hatch */}
                {HOURS.map((h) => {
                  if (isAvailable(dayIdx, h) && !isBlocked(dayIdx, h)) return null
                  const blocked = isBlocked(dayIdx, h)
                  const isFlashing = flashBlock && flashBlock.day === dayIdx && h >= flashBlock.startHour && h < flashBlock.endHour
                  return (
                    <motion.div
                      key={`${dayIdx}-${h}`}
                      initial={blocked ? { opacity: 0, scale: 0.95 } : false}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, ease }}
                      className="absolute left-0 right-0"
                      style={{
                        top: (h - HOURS[0]) * HOUR_H,
                        height: HOUR_H,
                        background: blocked
                          ? "repeating-linear-gradient(-45deg, rgba(0,0,0,0.1), rgba(0,0,0,0.1) 3px, rgba(245,158,11,0.15) 3px, rgba(245,158,11,0.15) 6px)"
                          : "repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(255,255,255,0.02) 3px, rgba(255,255,255,0.02) 6px)",
                        zIndex: blocked ? 2 : 0,
                      }}
                    >
                      {/* Flash ring on new blocks */}
                      {isFlashing && (
                        <motion.div
                          initial={{ opacity: 0.8 }}
                          animate={{ opacity: 0 }}
                          transition={{ duration: 1.5, ease }}
                          className="absolute inset-0 ring-1 ring-inset ring-amber-400/40 rounded-sm"
                        />
                      )}
                    </motion.div>
                  )
                })}

                {/* Block lock icon */}
                {blocks.filter((b) => b.day === dayIdx).map((b, bi) => (
                  <motion.div
                    key={bi}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
                    className="absolute left-0.5 right-0.5 flex items-center justify-center z-[3] pointer-events-none"
                    style={{
                      top: (b.startHour - HOURS[0]) * HOUR_H + 2,
                      height: (b.endHour - b.startHour) * HOUR_H - 4,
                    }}
                  >
                    <Lock className="h-2.5 w-2.5 text-amber-400/50" weight="fill" />
                  </motion.div>
                ))}

                {/* Appointments */}
                {dayApts.map((apt, ai) => {
                  const isExtra = extraApts.includes(apt)
                  return (
                    <motion.div
                      key={`${apt.patient}-${apt.startHour}`}
                      initial={isExtra ? { opacity: 0, scale: 0.8, y: 8 } : { opacity: 0, scale: 0.9, y: 4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{
                        duration: isExtra ? 0.6 : 0.5,
                        delay: isExtra ? 0 : 0.8 + ai * 0.15,
                        ease: isExtra ? [0.34, 1.56, 0.64, 1] : ease,
                      }}
                      className={`absolute left-0.5 right-0.5 rounded-[4px] px-1 py-0.5 overflow-hidden z-[2] ${
                        apt.status === "confirmed"
                          ? "bg-blue-500/40 border border-blue-500/50"
                          : "bg-white/[0.04] border border-dashed border-white/20"
                      }`}
                      style={{
                        top: (apt.startHour - HOURS[0]) * HOUR_H + 1,
                        height: apt.duration * HOUR_H - 2,
                      }}
                    >
                      {/* Glow flash on new appointments */}
                      {isExtra && (
                        <motion.div
                          initial={{ opacity: 0.6 }}
                          animate={{ opacity: 0 }}
                          transition={{ duration: 1.2, ease }}
                          className="absolute inset-0 bg-blue-400/20 rounded-[4px]"
                        />
                      )}
                      <p className="text-[7px] font-bold text-white/80 truncate relative z-10">{apt.patient.split(" ")[0]}</p>
                      <p className="text-[6px] text-white/40 truncate relative z-10">{apt.type}</p>
                    </motion.div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Now indicator */}
        {(() => {
          const now = new Date()
          const nowH = now.getHours() + now.getMinutes() / 60
          if (nowH < HOURS[0] || nowH > HOURS[HOURS.length - 1]) return null
          const top = (nowH - HOURS[0]) * HOUR_H
          return (
            <div className="absolute left-8 right-0 z-10 pointer-events-none" style={{ top }}>
              <div className="relative">
                <div className="absolute -left-[2px] -top-[2px] h-[5px] w-[5px] rounded-full bg-rose-500" />
                <div className="h-[1px] bg-rose-500/60 w-full" />
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}

// ─── AI Concierge Chat ───────────────────────────────────────────────────────

function ConciergeChat({ onCalendarEvent }: { onCalendarEvent: (e: CalendarEvent) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })
  const [scenarioIdx, setScenarioIdx] = useState(0)
  const [visibleMsgs, setVisibleMsgs] = useState(0)
  const [typing, setTyping] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  const scenario = CHAT_SCENARIOS[scenarioIdx]

  useEffect(() => {
    if (!isInView) return
    let cancelled = false

    async function run() {
      // Reset calendar at start
      onCalendarEvent({ type: "reset" })

      for (let i = 0; i < scenario.length; i++) {
        if (cancelled) return
        const msg = scenario[i]

        if (msg.from === "ai") {
          setTyping(true)
          await new Promise((r) => setTimeout(r, 1200 + Math.random() * 600))
          if (cancelled) return
          setTyping(false)
          await new Promise((r) => setTimeout(r, 100))
        } else {
          await new Promise((r) => setTimeout(r, 900 + Math.random() * 400))
        }

        if (cancelled) return
        setVisibleMsgs((v) => v + 1)

        // Trigger calendar effect after AI message appears
        if (msg.from === "ai" && msg.calendarEffect) {
          await new Promise((r) => setTimeout(r, 400))
          if (cancelled) return
          onCalendarEvent(msg.calendarEffect)
        }

        await new Promise((r) => setTimeout(r, 400))
      }

      // Wait then loop
      await new Promise((r) => setTimeout(r, 5000))
      if (cancelled) return
      setVisibleMsgs(0)
      setScenarioIdx((i) => (i + 1) % CHAT_SCENARIOS.length)
    }

    const t = setTimeout(run, 800)
    return () => { cancelled = true; clearTimeout(t) }
  }, [isInView, scenarioIdx, onCalendarEvent])

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" })
    }
  }, [visibleMsgs, typing])

  const messages = scenario.slice(0, visibleMsgs)

  return (
    <div ref={ref} className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 border border-accent/15">
          <Sparkle className="h-3.5 w-3.5 text-accent/70" weight="fill" />
        </div>
        <div>
          <p className="text-[12px] font-semibold text-white/85 leading-none">Concierge IA</p>
          <p className="text-[10px] text-white/30 mt-0.5 leading-none">Dra. Marina</p>
        </div>
      </div>

      <div className="h-px bg-white/[0.04] mb-3" />

      {/* Messages */}
      <div ref={chatRef} className="flex-1 flex flex-col gap-2.5 overflow-y-auto min-h-0 pr-1" style={{ maxHeight: 320 }}>
        {messages.length === 0 && !typing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center gap-2 py-8"
          >
            <Sparkle className="h-5 w-5 text-accent/20" weight="fill" />
            <p className="text-[11px] text-white/25 text-center">Peça ao seu Concierge</p>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={`${scenarioIdx}-${i}`}
              initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.4, ease }}
              className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.from === "user" ? (
                <div className="max-w-[85%] rounded-xl rounded-br-sm bg-accent/10 border border-accent/15 px-3 py-2">
                  <p className="text-[11px] text-white/75 leading-relaxed">{msg.text}</p>
                </div>
              ) : (
                <div className="max-w-[90%] space-y-1.5">
                  <div className="rounded-xl rounded-bl-sm bg-white/[0.03] border border-white/[0.06] px-3 py-2">
                    <p className="text-[11px] text-white/70 leading-relaxed whitespace-pre-line">{msg.text}</p>
                  </div>
                  {msg.tools && (
                    <div className="flex flex-wrap gap-1">
                      {msg.tools.map((tool, ti) => (
                        <motion.div
                          key={ti}
                          initial={{ opacity: 0, x: -8, scale: 0.9 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          transition={{ duration: 0.35, delay: 0.15 + ti * 0.08, ease }}
                          className="inline-flex items-center gap-1.5 rounded-md bg-white/[0.03] border border-white/[0.06] px-2 py-1"
                        >
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.4 + ti * 0.08, ease: [0.34, 1.56, 0.64, 1] }}
                          >
                            <CheckCircle className="h-3 w-3 text-emerald-400/60" weight="fill" />
                          </motion.div>
                          <span className="text-[9px] font-medium text-white/50">{tool.label}</span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {typing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex justify-start"
            >
              <div className="rounded-xl rounded-bl-sm bg-white/[0.03] border border-white/[0.06] px-3 py-2.5 flex items-center gap-1.5">
                <Sparkle className="h-3 w-3 text-accent/30" weight="fill" />
                <div className="flex gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="h-1 w-1 rounded-full bg-white/20"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="mt-3 pt-3 border-t border-white/[0.04]">
        <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
          <Microphone className="h-3.5 w-3.5 text-white/20 shrink-0" />
          <span className="flex-1 text-[11px] text-white/20">Fale ou digite...</span>
          <PaperPlaneRight className="h-3.5 w-3.5 text-accent/30 shrink-0" />
        </div>
      </div>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function CalendarShowcase() {
  const [blocks, setBlocks] = useState<{ day: number; startHour: number; endHour: number }[]>([])
  const [extraApts, setExtraApts] = useState<MockApt[]>([])
  const [highlightDay, setHighlightDay] = useState<number | null>(null)
  const [flashBlock, setFlashBlock] = useState<{ day: number; startHour: number; endHour: number } | null>(null)

  const handleCalendarEvent = useCallback((event: CalendarEvent) => {
    switch (event.type) {
      case "block":
        if (event.day != null && event.startHour != null && event.endHour != null) {
          const newBlock = { day: event.day, startHour: event.startHour, endHour: event.endHour }
          setBlocks((prev) => [...prev, newBlock])
          setFlashBlock(newBlock)
          setHighlightDay(event.day)
          setTimeout(() => setFlashBlock(null), 2000)
          setTimeout(() => setHighlightDay(null), 3000)
        }
        break
      case "highlight-day":
        if (event.day != null) {
          setHighlightDay(event.day)
          setTimeout(() => setHighlightDay(null), 3500)
        }
        break
      case "add-appointment":
        if (event.appointment) {
          setExtraApts((prev) => [...prev, event.appointment!])
          setHighlightDay(event.appointment.day)
          setTimeout(() => setHighlightDay(null), 3000)
        }
        break
      case "reset":
        setBlocks([])
        setExtraApts([])
        setHighlightDay(null)
        setFlashBlock(null)
        break
    }
  }, [])

  return (
    <section className="relative py-24 md:py-36 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[50rem] w-[70rem] rounded-full bg-accent/[0.02] blur-[160px]" />
      </div>

      <div className="mx-auto max-w-7xl px-6">
        <FadeIn direction="up" className="mx-auto max-w-2xl text-center mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3.5 py-1.5 mb-6">
            <CalendarCheck className="h-3 w-3 text-accent/60" weight="fill" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-accent/70">
              Calendário inteligente
            </span>
          </div>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Sua agenda no{" "}
            <span className="font-display italic text-white/50">piloto automático</span>
          </h2>
          <p className="mt-3 text-sm text-white/35 max-w-lg mx-auto">
            Visualize consultas, bloqueie horários e gerencie tudo por voz ou texto com o Concierge IA.
          </p>
        </FadeIn>

        <FadeIn delay={0.15}>
          <div className="relative rounded-2xl sm:rounded-3xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/25 to-transparent" />

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px]">
              <div className="p-5 sm:p-6 md:p-8">
                <MiniCalendar
                  blocks={blocks}
                  extraApts={extraApts}
                  highlightDay={highlightDay}
                  flashBlock={flashBlock}
                />
              </div>

              <div className="border-t lg:border-t-0 lg:border-l border-white/[0.04] p-5 sm:p-6 flex flex-col">
                <ConciergeChat onCalendarEvent={handleCalendarEvent} />
              </div>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {[
              "Bloqueie por voz",
              "Visualize a semana toda",
              "Consultas em tempo real",
              "IA que entende contexto",
            ].map((label, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.08, ease }}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-3.5 py-1.5 text-[11px] text-white/40"
              >
                <Sparkle className="h-2.5 w-2.5 text-accent/40" weight="fill" />
                {label}
              </motion.div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
