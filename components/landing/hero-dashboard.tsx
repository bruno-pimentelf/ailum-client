"use client"

import { useEffect, useState, memo, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  WhatsappLogo,
  CheckCircle,
  CalendarCheck,
  CurrencyDollar,
  Sparkle,
  Bell,
  ArrowsClockwise,
  Lightning,
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
      { from: "ai", text: "Confirmado! Consulta garantida. Lembrete na véspera" },
    ],
    actions: [
      { icon: "calendar", label: "Agenda consultada", detail: "Dra. Marina · 2 vagas" },
      { icon: "calendar", label: "Horário reservado", detail: "Qui, 13 Mar · 10:00" },
      { icon: "pix", label: "Cobrança Pix gerada", detail: "R$ 150,00" },
      { icon: "confirm", label: "Pagamento confirmado", detail: "12s" },
      { icon: "notify", label: "Lembrete agendado", detail: "12 Mar · 18:00" },
    ],
    actionTriggers: [1, 2, 4, 5, 6],
  },
  {
    chat: [
      { from: "patient", text: "Preciso remarcar minha consulta de amanhã" },
      { from: "ai", text: "Sem problema! Achei sua consulta. Terça 15h ou quarta 9h?" },
      { from: "patient", text: "Quarta às 9h" },
      { from: "ai", text: "Feito! Remarcado. Horário anterior liberado." },
    ],
    actions: [
      { icon: "calendar", label: "Consulta localizada", detail: "Seg, 14h · Dra. Marina" },
      { icon: "reschedule", label: "Agenda reorganizada", detail: "Slot anterior liberado" },
      { icon: "calendar", label: "Novo horário", detail: "Qua, 9h · Dra. Marina" },
      { icon: "notify", label: "Confirmação enviada", detail: "Via WhatsApp" },
    ],
    actionTriggers: [1, 3, 2, 3],
  },
  {
    chat: [
      { from: "ai", text: "Oi Ana! Lembrete: consulta amanhã às 14h com a Dra. Marina" },
      { from: "ai", text: "Para confirmar presença, segue o Pix:" },
      { from: "ai", text: "", type: "pix", amount: "R$ 200,00" },
      { from: "patient", text: "Pronto, acabei de pagar!" },
      { from: "ai", text: "Recebido! Consulta confirmada. Até amanhã!" },
    ],
    actions: [
      { icon: "notify", label: "Lembrete automático", detail: "24h antes" },
      { icon: "pix", label: "Cobrança Pix gerada", detail: "R$ 200,00" },
      { icon: "confirm", label: "Pagamento detectado", detail: "8s" },
      { icon: "calendar", label: "Presença confirmada", detail: "Status atualizado" },
    ],
    actionTriggers: [0, 2, 3, 4],
  },
]

/* ─── Helpers ─────────────────────────────────────────────────────────── */

const ease = [0.22, 1, 0.36, 1] as const

function ActionIcon({ type }: { type: AIAction["icon"] }) {
  const cls = "h-4 w-4 sm:h-[18px] sm:w-[18px]"
  switch (type) {
    case "calendar":   return <CalendarCheck className={`${cls} text-accent`} weight="fill" />
    case "pix":        return <CurrencyDollar className={`${cls} text-emerald-400`} weight="fill" />
    case "confirm":    return <CheckCircle className={`${cls} text-emerald-400`} weight="fill" />
    case "notify":     return <Bell className={`${cls} text-amber-400`} weight="fill" />
    case "reschedule": return <ArrowsClockwise className={`${cls} text-violet-400`} weight="fill" />
  }
}

/* ─── Pix card ────────────────────────────────────────────────────────── */

function PixCard({ amount }: { amount: string }) {
  return (
    <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/[0.04] px-4 py-3.5 sm:px-5 sm:py-4">
      <div className="flex items-center gap-2 mb-2">
        <CurrencyDollar className="h-4 w-4 text-emerald-400" weight="fill" />
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400/60">
          Pix
        </span>
      </div>
      <p className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">
        {amount}
      </p>
      <p className="text-[11px] sm:text-xs text-white/30 mt-1">Clínica Harmonia LTDA</p>
    </div>
  )
}

/* ─── Typing indicator ────────────────────────────────────────────────── */

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-accent/40"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.1, 0.85] }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

/* ─── Shimmer pulse on AI bubble ──────────────────────────────────────── */

function AIPulse() {
  return (
    <motion.div
      className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-accent/[0.06] to-transparent"
      animate={{ x: ["-100%", "200%"] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
    />
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
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
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
    <div className="relative w-full">
      {/* Ambient glow behind the card */}
      <div className="pointer-events-none absolute -inset-8 -z-10">
        <div className="absolute inset-0 bg-accent/[0.02] rounded-[3rem] blur-[80px]" />
      </div>

      {/* Container */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/[0.06] bg-white/[0.02]">
        {/* Top accent line */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

        {/* Inner glow */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-accent/[0.03] rounded-full blur-[100px]" />

        <div className="relative p-5 sm:p-7 md:p-9 lg:p-12">

          {/* Two-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 lg:gap-16">

            {/* ── Left: WhatsApp chat ──────────────────────────────────── */}
            <div className="flex flex-col min-h-0">
              {/* Column header */}
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-emerald-500/8 ring-1 ring-emerald-500/10">
                    <WhatsappLogo className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400/80" weight="fill" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-[15px] font-semibold text-white/90 leading-none tracking-tight">
                      WhatsApp
                    </h3>
                    <p className="text-[11px] sm:text-xs text-white/35 mt-1 leading-none">
                      Clínica Harmonia
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/8 px-2.5 py-1 ring-1 ring-emerald-500/10">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-400/70">Online</span>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/[0.04] mb-5 sm:mb-6" />

              {/* Chat messages */}
              <div
                ref={chatScrollRef}
                className="flex flex-col gap-3 sm:gap-3.5 overflow-y-auto pr-1 h-[300px] sm:h-[340px] md:h-[380px]"
              >
                <AnimatePresence initial={false}>
                  {messages.map((msg, i) => (
                    <motion.div
                      key={`${scenarioIdx}-${i}`}
                      initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      transition={{ duration: 0.6, ease }}
                      className={`flex ${msg.from === "ai" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.type === "pix" ? (
                        <div className="w-full max-w-[88%] sm:max-w-[80%] ml-auto">
                          <PixCard amount={msg.amount ?? ""} />
                        </div>
                      ) : msg.from === "patient" ? (
                        <div className="max-w-[88%] sm:max-w-[80%] rounded-2xl rounded-bl-sm bg-white/[0.05] px-4 py-3 sm:px-5 sm:py-3.5">
                          <p className="text-[13px] sm:text-sm font-medium leading-relaxed text-white/70">
                            {msg.text}
                          </p>
                        </div>
                      ) : (
                        <div className="relative max-w-[88%] sm:max-w-[80%] overflow-hidden rounded-2xl rounded-br-sm bg-accent/[0.06] ring-1 ring-accent/[0.08] px-4 py-3 sm:px-5 sm:py-3.5">
                          <AIPulse />
                          <p className="relative text-[13px] sm:text-sm font-medium leading-relaxed text-white/80">
                            {msg.text}
                          </p>
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
                      transition={{ duration: 0.3, ease }}
                      className="flex justify-end"
                    >
                      <div className="bg-accent/[0.06] ring-1 ring-accent/[0.08] rounded-2xl rounded-br-sm">
                        <TypingDots />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ── Vertical divider (desktop) ──────────────────────────── */}
            <div className="hidden md:block absolute left-1/2 top-[80px] bottom-[40px] w-px bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />

            {/* ── Right: AI actions ────────────────────────────────────── */}
            <div className="flex flex-col min-h-0">
              {/* Column header */}
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-accent/8 ring-1 ring-accent/10">
                    <Lightning className="h-4 w-4 sm:h-5 sm:w-5 text-accent/70" weight="fill" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-[15px] font-semibold text-white/90 leading-none tracking-tight">
                      Ações da IA
                    </h3>
                    <p className="text-[11px] sm:text-xs text-white/35 mt-1 leading-none">
                      Executadas em tempo real
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-accent/8 px-2.5 py-1 ring-1 ring-accent/10">
                  <Sparkle className="h-3 w-3 text-accent/50" weight="fill" />
                  <span className="text-[10px] sm:text-[11px] font-semibold text-accent/60">Auto</span>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/[0.04] mb-5 sm:mb-6" />

              {/* Action list */}
              <div
                ref={actionsScrollRef}
                className="flex flex-col gap-2.5 sm:gap-3 overflow-y-auto pr-1 h-[300px] sm:h-[340px] md:h-[380px]"
              >
                <AnimatePresence initial={false}>
                  {visibleActions.map((action, i) => (
                    <motion.div
                      key={`${scenarioIdx}-a-${i}`}
                      initial={{ opacity: 0, x: 16, filter: "blur(6px)" }}
                      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                      transition={{ duration: 0.6, ease, delay: 0.05 }}
                    >
                      <div className="group flex items-center gap-3.5 sm:gap-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-transparent hover:border-white/[0.04] px-4 py-3.5 sm:px-5 sm:py-4 transition-all duration-500">
                        <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.03] ring-1 ring-white/[0.06] group-hover:ring-white/[0.1] transition-all duration-500">
                          <ActionIcon type={action.icon} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] sm:text-sm font-semibold text-white/80 leading-none tracking-tight">
                            {action.label}
                          </p>
                          <p className="mt-1.5 sm:mt-2 text-[11px] sm:text-xs text-white/35 leading-none">
                            {action.detail}
                          </p>
                        </div>
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.5, delay: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
                        >
                          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400/50" weight="fill" />
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
})
