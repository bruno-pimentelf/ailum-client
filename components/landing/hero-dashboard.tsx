"use client"

import { useEffect, useState, memo, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  WhatsappLogo,
  CheckCircle,
  CalendarCheck,
  CurrencyDollar,
  Sparkle,
  UserCircle,
  Bell,
  ArrowsClockwise,
} from "@phosphor-icons/react"

/* ─── Types ──────────────────────────────────────────────────────────── */

interface ChatMsg {
  from: "patient" | "ai"
  text: string
  type?: "pix"
  amount?: string
}
interface AIAction {
  icon: "calendar" | "pix" | "confirm" | "notify" | "reschedule"
  label: string
  detail: string
}
interface Scenario {
  chat: ChatMsg[]
  actions: AIAction[]
  actionTriggers: number[]
}

/* ─── Scenarios ──────────────────────────────────────────────────────── */

const SCENARIOS: Scenario[] = [
  {
    chat: [
      { from: "patient", text: "Oi, gostaria de agendar com a Dra. Marina" },
      { from: "ai", text: "Oi! Deixa eu ver a agenda dela... Quinta às 10h ou sexta às 14h. Qual prefere?" },
      { from: "patient", text: "Quinta tá ótimo!" },
      { from: "ai", text: "Reservado! Pra garantir o horário, segue o Pix:" },
      { from: "ai", text: "", type: "pix", amount: "R$ 150,00" },
      { from: "patient", text: "Pronto, paguei!" },
      { from: "ai", text: "Confirmado! Consulta garantida. Lembrete na véspera 😉" },
    ],
    actions: [
      { icon: "calendar", label: "Agenda consultada", detail: "Dra. Marina · 2 vagas" },
      { icon: "calendar", label: "Horário reservado", detail: "Qui, 13 Mar · 10:00" },
      { icon: "pix", label: "Cobrança Pix gerada", detail: "R$ 150,00" },
      { icon: "confirm", label: "Pagamento confirmado", detail: "Tempo: 12s" },
      { icon: "notify", label: "Lembrete agendado", detail: "12 Mar · 18:00" },
    ],
    actionTriggers: [1, 2, 4, 5, 6],
  },
  {
    chat: [
      { from: "patient", text: "Preciso remarcar minha consulta de amanhã, surgiu um imprevisto" },
      { from: "ai", text: "Sem problema! Achei sua consulta. Tenho terça 15h ou quarta 9h. Qual funciona?" },
      { from: "patient", text: "Quarta às 9h por favor" },
      { from: "ai", text: "Feito! Remarcado pra quarta 9h. Horário anterior já foi liberado" },
    ],
    actions: [
      { icon: "calendar", label: "Consulta localizada", detail: "Seg, 14h · Dra. Marina" },
      { icon: "reschedule", label: "Agenda reorganizada", detail: "Slot anterior liberado" },
      { icon: "calendar", label: "Novo horário confirmado", detail: "Qua, 9h · Dra. Marina" },
      { icon: "notify", label: "Confirmação enviada", detail: "Via WhatsApp" },
    ],
    actionTriggers: [1, 3, 2, 3],
  },
  {
    chat: [
      { from: "ai", text: "Oi Ana! Lembrete: consulta amanhã às 14h com a Dra. Marina" },
      { from: "ai", text: "Pra confirmar presença, é só fazer o Pix:" },
      { from: "ai", text: "", type: "pix", amount: "R$ 200,00" },
      { from: "patient", text: "Pronto, acabei de pagar!" },
      { from: "ai", text: "Recebido! Consulta confirmada. Até amanhã, Ana!" },
    ],
    actions: [
      { icon: "notify", label: "Lembrete automático", detail: "24h antes da consulta" },
      { icon: "pix", label: "Cobrança Pix gerada", detail: "R$ 200,00" },
      { icon: "confirm", label: "Pagamento detectado", detail: "Tempo: 8s" },
      { icon: "calendar", label: "Presença confirmada", detail: "Status atualizado" },
    ],
    actionTriggers: [0, 2, 3, 4],
  },
]

/* ─── QR Code SVG ────────────────────────────────────────────────────── */

function PixQR({ amount }: { amount: string }) {
  const pattern = [
    [1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,1,0,1,1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,0,1,1,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,0,0,1,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,1,1,0,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0],
    [1,0,1,0,1,1,1,0,1,1,0,0,1,0,1,0,1,0,1],
    [0,1,0,1,0,0,0,1,0,0,1,0,0,1,0,1,0,1,0],
    [1,0,1,1,0,1,1,0,1,0,1,1,1,0,0,1,1,0,1],
    [0,0,0,0,0,0,0,0,1,0,0,1,0,1,0,0,1,0,0],
    [1,1,1,1,1,1,1,0,1,1,0,0,1,0,1,0,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,1,0,0,1,0,1,0,1,0],
    [1,0,1,1,1,0,1,0,1,0,1,1,1,0,0,1,1,0,0],
    [1,0,1,1,1,0,1,0,1,1,0,0,0,0,1,0,0,1,0],
    [1,0,1,1,1,0,1,0,0,0,1,1,1,0,1,1,0,0,1],
    [1,0,0,0,0,0,1,0,1,0,0,1,0,1,0,0,1,0,0],
    [1,1,1,1,1,1,1,0,1,1,1,0,1,0,1,0,1,1,1],
  ]
  const cell = 3.5
  const size = 19 * cell
  return (
    <div className="cta-shimmer relative overflow-hidden rounded-2xl border border-accent/15 bg-white/[0.02] p-3 sm:p-4 shadow-[0_0_20px_rgba(0,181,212,0.08)] backdrop-blur-sm">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <div className="shrink-0 rounded-xl bg-zinc-950/60 p-2.5 ring-1 ring-accent/10">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
            {pattern.map((row, r) =>
              row.map((v, c) =>
                v ? (
                  <rect
                    key={`${r}-${c}`}
                    x={c * cell}
                    y={r * cell}
                    width={cell - 0.4}
                    height={cell - 0.4}
                    rx={0.4}
                    fill="rgba(0,181,212,0.75)"
                  />
                ) : null
              )
            )}
          </svg>
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <CurrencyDollar className="h-3.5 w-3.5 text-emerald-400" weight="fill" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
              Pagamento via Pix
            </span>
          </div>
          <p className="font-display text-lg font-bold tracking-tight text-white/90 sm:text-xl">
            {amount}
          </p>
          <p className="text-[10px] text-white/30">
            Clínica Harmonia LTDA
          </p>
        </div>
      </div>
    </div>
  )
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */

function ActionIcon({ type }: { type: AIAction["icon"] }) {
  const s = "h-4 w-4"
  switch (type) {
    case "calendar":   return <CalendarCheck className={`${s} text-accent`} weight="fill" />
    case "pix":        return <CurrencyDollar className={`${s} text-emerald-400`} weight="fill" />
    case "confirm":    return <CheckCircle className={`${s} text-emerald-400`} weight="fill" />
    case "notify":     return <Bell className={`${s} text-amber-400`} weight="fill" />
    case "reschedule": return <ArrowsClockwise className={`${s} text-violet-400`} weight="fill" />
  }
}

/* ─── Transition presets ─────────────────────────────────────────────── */

const ease = [0.22, 1, 0.36, 1] as const
const msgTransition = { duration: 0.8, ease }
const actionTransition = { duration: 0.7, ease }

/* ─── Shimmer thinking bar ───────────────────────────────────────────── */

function ThinkingShimmer() {
  return (
    <div className="flex justify-end">
      <div className="flex items-center gap-2.5 rounded-2xl rounded-br-sm bg-accent/[0.06] px-4 py-3 ring-1 ring-accent/[0.06]">
        <Sparkle className="h-3.5 w-3.5 text-accent/40" weight="fill" />
        <div className="relative h-2 w-24 overflow-hidden rounded-full bg-white/[0.04]">
          <motion.div
            className="absolute inset-y-0 w-1/2 rounded-full bg-gradient-to-r from-transparent via-accent/30 to-transparent"
            animate={{ x: ["-100%", "250%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>
    </div>
  )
}

/* ─── Main component ─────────────────────────────────────────────────── */

export const HeroDashboard = memo(function HeroDashboard() {
  const [scenarioIdx, setScenarioIdx] = useState(0)
  const [visibleMsgs, setVisibleMsgs] = useState(0)
  const [typing, setTyping] = useState(false)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const actionsScrollRef = useRef<HTMLDivElement>(null)

  const scenario = SCENARIOS[scenarioIdx]

  const visibleActions = scenario.actions.filter(
    (_, i) => visibleMsgs >= scenario.actionTriggers[i]
  )

  const advanceScenario = useCallback(() => {
    setScenarioIdx(i => (i + 1) % SCENARIOS.length)
    setVisibleMsgs(0)
    setTyping(false)
  }, [])

  useEffect(() => {
    if (visibleMsgs >= scenario.chat.length) {
      const t = setTimeout(advanceScenario, 4000)
      return () => clearTimeout(t)
    }
    const nextMsg = scenario.chat[visibleMsgs]
    if (nextMsg.from === "ai") {
      setTyping(true)
      const delay = nextMsg.type === "pix" ? 600 : 1200 + Math.random() * 400
      const t = setTimeout(() => {
        setTyping(false)
        setTimeout(() => setVisibleMsgs(v => v + 1), 120)
      }, delay)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setVisibleMsgs(v => v + 1), 1000 + Math.random() * 300)
    return () => clearTimeout(t)
  }, [visibleMsgs, scenario, advanceScenario])

  const messages = scenario.chat.slice(0, visibleMsgs)

  const scrollToBottom = useCallback((el: HTMLDivElement | null) => {
    if (!el) return
    el.scrollTo({
      top: el.scrollHeight,
      behavior: "smooth",
    })
  }, [])

  useEffect(() => {
    const raf = requestAnimationFrame(() => scrollToBottom(chatScrollRef.current))
    return () => cancelAnimationFrame(raf)
  }, [messages.length, typing, scenarioIdx, scrollToBottom])

  useEffect(() => {
    const raf = requestAnimationFrame(() => scrollToBottom(actionsScrollRef.current))
    return () => cancelAnimationFrame(raf)
  }, [visibleActions.length, scenarioIdx, scrollToBottom])

  return (
    <div className="relative w-full overflow-hidden h-[760px] sm:h-[700px] md:h-[480px]">
      <div className="grid h-full grid-cols-1 grid-rows-2 gap-6 md:grid-cols-2 md:grid-rows-1 md:gap-14">

        {/* ── Left column — WhatsApp chat ─────────────────────────────── */}
        <div className="flex min-h-0 flex-col overflow-hidden">
          <div className="mb-4 flex items-center gap-2.5 md:mb-6">
            <WhatsappLogo className="h-4 w-4 text-emerald-400/70" weight="fill" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/35 md:text-[11px]">
              WhatsApp
            </span>
          </div>

          <div
            ref={chatScrollRef}
            className="flex min-h-0 flex-col gap-3 overflow-y-auto pr-1 md:gap-3.5"
          >
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={`${scenarioIdx}-${i}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={msgTransition}
                  className={`flex ${msg.from === "ai" ? "justify-end" : "justify-start"}`}
                >
                  {msg.type === "pix" ? (
                    <div className="ml-auto w-full max-w-[95%]">
                      <PixQR amount={msg.amount ?? "R$ 0,00"} />
                    </div>
                  ) : msg.from === "patient" ? (
                    <div className="flex max-w-[96%] items-end gap-2 sm:max-w-[92%]">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.06] ring-1 ring-white/[0.06] sm:h-7 sm:w-7">
                        <UserCircle className="h-4 w-4 text-white/50 sm:h-4.5 sm:w-4.5" weight="fill" />
                      </div>
                      <div className="rounded-2xl rounded-bl-sm bg-white/[0.06] px-3 py-2.5 backdrop-blur-sm sm:px-4 sm:py-3">
                        <p className="text-[12px] leading-relaxed text-white/75 sm:text-[13px]">{msg.text}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex max-w-[96%] items-end gap-2 sm:max-w-[92%]">
                      <div className="rounded-2xl rounded-br-sm bg-accent/[0.08] px-3 py-2.5 ring-1 ring-accent/[0.06] backdrop-blur-sm sm:px-4 sm:py-3">
                        <p className="text-[12px] leading-relaxed text-white/85 sm:text-[13px]">{msg.text}</p>
                      </div>
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/[0.10] ring-1 ring-accent/[0.08] sm:h-7 sm:w-7">
                        <Sparkle className="h-3 w-3 text-accent/60 sm:h-3.5 sm:w-3.5" weight="fill" />
                      </div>
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
                  transition={{ duration: 0.5, ease }}
                >
                  <ThinkingShimmer />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Right column — AI actions ───────────────────────────────── */}
        <div className="flex min-h-0 flex-col overflow-hidden">
          <div className="mb-4 flex items-center gap-2.5 md:mb-6">
            <Sparkle className="h-4 w-4 text-accent/60" weight="fill" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/35 md:text-[11px]">
              Ações da IA
            </span>
          </div>

          <div
            ref={actionsScrollRef}
            className="flex min-h-0 flex-col gap-2.5 overflow-y-auto pr-1 md:gap-3"
          >
            <AnimatePresence initial={false}>
              {visibleActions.map((action, i) => (
                <motion.div
                  key={`${scenarioIdx}-a-${i}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...actionTransition, delay: 0.1 }}
                  className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5 backdrop-blur-sm sm:gap-3.5 sm:px-4 sm:py-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.04] ring-1 ring-white/[0.06] sm:h-9 sm:w-9">
                    <ActionIcon type={action.icon} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium leading-none text-white/75 sm:text-[13px]">{action.label}</p>
                    <p className="mt-1 text-[10px] leading-none text-white/35 sm:text-[11px]">{action.detail}</p>
                  </div>
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400/50" weight="fill" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  )
})
