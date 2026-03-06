"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence, useInView } from "framer-motion"
import { ChatCircle, CreditCard, CalendarCheck, Checks, CheckCircle, WhatsappLogo } from "@phosphor-icons/react"
import { FadeIn } from "./motion"

const ease = [0.33, 1, 0.68, 1] as any
const STEP_DURATION = 7000

// ─── Step 1: Chat ─────────────────────────────────────────────────────────────

const chatMessages = [
  { id: 1, from: "patient", text: "Oi! Quero marcar uma consulta com a Dra. Marina 😊", time: "09:41" },
  { id: 2, from: "ai", text: "Oi! Que bom que entrou em contato. Deixa eu verificar a agenda dela...", time: "09:41" },
  { id: 3, from: "ai", text: "Tenho quinta-feira (13/03) às 10h disponível. Funciona pra você?", time: "09:42" },
  { id: 4, from: "patient", text: "Perfeito, pode ser!", time: "09:42" },
  { id: 5, from: "ai", text: "Ótimo! Vou te enviar o Pix agora pra garantir o horário 🙌", time: "09:42" },
]

function StepChat({ active }: { active: boolean }) {
  const [visible, setVisible] = useState<number[]>([])
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active) { setVisible([]); setTyping(false); return }
    let cancelled = false

    async function run() {
      const delays = [0, 600, 1400, 2800, 3600]
      const typingDurations = [0, 900, 1100, 0, 800]

      for (let i = 0; i < chatMessages.length; i++) {
        if (cancelled) return
        await new Promise(r => setTimeout(r, i === 0 ? 500 : delays[i] - delays[i - 1]))
        if (cancelled) return

        if (typingDurations[i] > 0) {
          setTyping(true)
          await new Promise(r => setTimeout(r, typingDurations[i]))
          if (cancelled) return
          setTyping(false)
          await new Promise(r => setTimeout(r, 100))
          if (cancelled) return
        }

        setVisible(p => [...p, chatMessages[i].id])
      }
    }

    run()
    return () => { cancelled = true }
  }, [active])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
    }
  }, [visible, typing])

  return (
    <div className="rounded-xl border border-border bg-background/60 overflow-hidden">
      <div className="flex items-center gap-2.5 px-3 py-2 border-b border-border bg-accent/[0.05]">
        <div className="relative">
          <div className="h-7 w-7 rounded-full bg-accent/15 flex items-center justify-center">
            <span className="text-[8px] font-bold text-accent">CH</span>
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-card" />
        </div>
        <div>
          <p className="text-[10px] font-semibold text-foreground leading-none">Clínica Harmonia</p>
          <p className="text-[8px] text-accent mt-0.5">IA ativa · online agora</p>
        </div>
        <WhatsappLogo className="ml-auto h-3.5 w-3.5 text-emerald-500/60" />
      </div>

      <div ref={scrollRef} className="flex flex-col gap-2 p-3 h-[180px] overflow-y-auto scroll-smooth">
        <AnimatePresence initial={false}>
          {chatMessages.map(msg =>
            visible.includes(msg.id) ? (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                className={`flex ${msg.from === "patient" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[85%] rounded-2xl px-2.5 py-1.5 ${
                  msg.from === "patient"
                    ? "bg-accent/12 rounded-br-sm"
                    : "bg-muted rounded-bl-sm"
                }`}>
                  <p className="text-[10px] leading-relaxed text-foreground">{msg.text}</p>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span className="text-[8px] text-muted-foreground/60">{msg.time}</span>
                    {msg.from === "patient" && (
                      <Checks className="h-2.5 w-2.5 text-accent/70" />
                    )}
                  </div>
                </div>
              </motion.div>
            ) : null
          )}
        </AnimatePresence>

        <AnimatePresence>
          {typing && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="flex justify-start"
            >
              <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2.5">
                <div className="flex gap-1 items-center">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50"
                      animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.65, repeat: Infinity, delay: i * 0.13, ease: "easeInOut" }}
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

// ─── Step 2: Pix ──────────────────────────────────────────────────────────────

function QRPattern() {
  const size = 7
  const pattern = [
    [1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1],
    [1,0,1,0,1,0,1],
    [1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1],
  ]
  const inner = [
    [0,1,0,1,1,0,0],
    [1,0,1,0,0,1,0],
    [0,1,1,0,1,0,1],
    [1,0,0,1,0,1,1],
    [0,1,0,0,1,0,0],
    [1,1,0,1,0,1,0],
    [0,0,1,0,1,1,0],
  ]
  const cell = 8
  const total = size * cell
  return (
    <svg width={total} height={total} viewBox={`0 0 ${total} ${total}`} className="block">
      {Array.from({ length: size }).map((_, row) =>
        Array.from({ length: size }).map((_, col) => {
          const isBorder = pattern[row][col] === 1
          const isInner = !isBorder && inner[row][col] === 1
          const fill = isBorder ? "rgba(0,181,212,0.9)" : isInner ? "rgba(0,181,212,0.55)" : "transparent"
          return (
            <rect
              key={`${row}-${col}`}
              x={col * cell + 1}
              y={row * cell + 1}
              width={cell - 2}
              height={cell - 2}
              rx={1}
              fill={fill}
            />
          )
        })
      )}
    </svg>
  )
}

const PIX_SHORT = "00020126580014br.gov.bcb.pix…6304ABCD"

function StepPix({ active }: { active: boolean }) {
  const [phase, setPhase] = useState<"idle" | "generating" | "qr" | "waiting" | "paid">("idle")
  const [copied, setCopied] = useState(false)
  const [payProgress, setPayProgress] = useState(0)

  useEffect(() => {
    if (!active) {
      setPhase("idle"); setCopied(false); setPayProgress(0)
      return
    }
    let cancelled = false

    async function run() {
      await new Promise(r => setTimeout(r, 400))
      if (cancelled) return
      setPhase("generating")

      await new Promise(r => setTimeout(r, 800))
      if (cancelled) return
      setPhase("qr")

      await new Promise(r => setTimeout(r, 1200))
      if (cancelled) return
      setPhase("waiting")

      // Simulate payment progress bar
      for (let p = 0; p <= 100; p += 2) {
        if (cancelled) return
        setPayProgress(p)
        await new Promise(r => setTimeout(r, 24))
      }

      await new Promise(r => setTimeout(r, 200))
      if (cancelled) return
      setPhase("paid")
    }

    run()
    return () => { cancelled = true }
  }, [active])

  return (
    <div className="rounded-xl border border-border bg-background/60 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-accent/[0.05]">
        <motion.div
          animate={{ scale: phase === "paid" ? [1, 1.3, 1] : 1 }}
          transition={{ duration: 0.4 }}
          className={`h-1.5 w-1.5 rounded-full ${phase === "paid" ? "bg-emerald-400" : "bg-accent animate-pulse"}`}
        />
        <span className="text-[10px] font-medium text-foreground">Pagamento via Pix</span>
        <AnimatePresence mode="wait">
          {phase === "paid" ? (
            <motion.div
              key="paid"
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              className="ml-auto flex items-center gap-1"
            >
              <CheckCircle className="h-3 w-3 text-emerald-400" />
              <span className="text-[9px] text-emerald-400 font-semibold">Pago!</span>
            </motion.div>
          ) : (
            <motion.span key="amount" exit={{ opacity: 0 }} className="ml-auto text-[9px] text-emerald-400 font-medium">
              R$ 150,00
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="p-3 flex flex-col gap-2">
        <AnimatePresence mode="wait">
          {phase === "idle" && (
            <motion.div key="idle" exit={{ opacity: 0 }} className="flex items-center justify-center h-[180px]">
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-accent/30"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.22 }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {phase === "generating" && (
            <motion.div
              key="gen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-2 h-[180px]"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-5 w-5 rounded-full border-2 border-accent/20 border-t-accent"
              />
              <span className="text-[9px] text-muted-foreground/60">Gerando QR code...</span>
            </motion.div>
          )}

          {(phase === "qr" || phase === "waiting" || phase === "paid") && (
            <motion.div
              key="qr-view"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease }}
              className="flex gap-3 items-start"
            >
              {/* QR */}
              <div className="relative shrink-0 p-2 rounded-lg bg-zinc-950 border border-accent/20">
                <QRPattern />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="h-6 w-6 rounded bg-zinc-950 border border-accent/25 flex items-center justify-center">
                    <span className="text-[7px] font-bold text-accent">PIX</span>
                  </div>
                </div>
                {phase === "paid" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 rounded-lg bg-emerald-500/10 flex items-center justify-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      <CheckCircle className="h-8 w-8 text-emerald-400" weight="fill" />
                    </motion.div>
                  </motion.div>
                )}
              </div>

              {/* Right side */}
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <div>
                  <p className="text-[8px] text-muted-foreground/50 uppercase tracking-wider mb-1">Pix Copia e Cola</p>
                  <button
                    onClick={() => setCopied(true)}
                    className="w-full flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1.5 text-left hover:border-accent/30 transition-colors"
                  >
                    <span className="flex-1 truncate font-mono text-[8px] text-muted-foreground">
                      {PIX_SHORT}
                    </span>
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.span key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                          <CheckCircle className="h-3 w-3 text-emerald-400 shrink-0" />
                        </motion.span>
                      ) : (
                        <motion.span key="cp" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="text-[8px] text-accent/50 shrink-0">
                          copiar
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </div>

                {/* Payment status */}
                <AnimatePresence mode="wait">
                  {phase === "waiting" && (
                    <motion.div key="waiting" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-1">
                      <div className="flex justify-between">
                        <span className="text-[8px] text-muted-foreground/50">Aguardando pagamento</span>
                        <span className="text-[8px] text-accent/60 tabular-nums">{payProgress}%</span>
                      </div>
                      <div className="h-1 rounded-full bg-border overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-accent/70"
                          style={{ width: `${payProgress}%` }}
                        />
                      </div>
                    </motion.div>
                  )}
                  {phase === "paid" && (
                    <motion.div
                      key="done"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/8 px-2 py-1.5"
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[8px] text-emerald-400 font-medium">Pagamento confirmado</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Step 3: Calendar ─────────────────────────────────────────────────────────

const calSlots = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00"]

const existingApts = [
  { time: "08:00", col: 1, label: "Dr. Carlos", sub: "Retorno", color: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
  { time: "11:00", col: 1, label: "Dr. Carlos", sub: "Consulta", color: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
  { time: "14:00", col: 2, label: "Dra. Marina", sub: "Limpeza", color: "bg-accent/10 border-accent/20 text-accent" },
  { time: "15:00", col: 1, label: "Dr. Carlos", sub: "Exame", color: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
]

function StepCalendar({ active }: { active: boolean }) {
  const [phase, setPhase] = useState<"idle" | "scanning" | "blocking" | "confirmed" | "notified">("idle")
  const [scanRow, setScanRow] = useState(-1)

  useEffect(() => {
    if (!active) { setPhase("idle"); setScanRow(-1); return }
    let cancelled = false

    async function run() {
      await new Promise(r => setTimeout(r, 500))
      if (cancelled) return
      setPhase("scanning")

      // Scan rows one by one
      for (let i = 0; i < calSlots.length; i++) {
        if (cancelled) return
        setScanRow(i)
        await new Promise(r => setTimeout(r, 260))
      }
      setScanRow(-1)

      await new Promise(r => setTimeout(r, 300))
      if (cancelled) return
      setPhase("blocking")

      await new Promise(r => setTimeout(r, 900))
      if (cancelled) return
      setPhase("confirmed")

      await new Promise(r => setTimeout(r, 1000))
      if (cancelled) return
      setPhase("notified")
    }

    run()
    return () => { cancelled = true }
  }, [active])

  return (
    <div className="rounded-xl border border-border bg-background/60 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-accent/[0.05]">
        <span className="text-[10px] font-medium text-foreground">Março 2026 · Quinta, 13</span>
        <AnimatePresence mode="wait">
          {phase === "confirmed" || phase === "notified" ? (
            <motion.div key="ok" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-emerald-400" />
              <span className="text-[9px] text-emerald-400 font-medium">Reservado</span>
            </motion.div>
          ) : phase === "scanning" ? (
            <motion.span key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[9px] text-accent/60">
              verificando agenda...
            </motion.span>
          ) : (
            <motion.span key="wait" className="text-[9px] text-muted-foreground/40">aguardando Pix...</motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="p-2.5 flex flex-col gap-0.5">
        {/* day columns header */}
        <div className="grid grid-cols-4 gap-px mb-1 pl-8">
          {["Seg 10", "Ter 11", "Qua 12", "Qui 13"].map((d, i) => (
            <div key={d} className={`text-center text-[7px] font-medium py-0.5 rounded-sm ${i === 3 ? "text-accent bg-accent/8" : "text-muted-foreground/40"}`}>
              {d}
            </div>
          ))}
        </div>

        {calSlots.map((time, rowIdx) => {
          const isScanning = phase === "scanning" && scanRow === rowIdx
          const isTarget = time === "10:00"

          return (
            <div
              key={time}
              className={`flex items-center gap-1.5 h-8 rounded-md transition-colors duration-150 ${isScanning ? "bg-accent/[0.04]" : ""}`}
            >
              <span className="w-7 text-[7px] text-muted-foreground/40 font-mono shrink-0 text-right">{time}</span>
              <div className="flex-1 grid grid-cols-4 gap-px h-full">
                {[0, 1, 2, 3].map(col => {
                  const apt = existingApts.find(a => a.time === time && a.col === col)
                  const isNewSlot = col === 3 && isTarget

                  return (
                    <div key={col} className={`relative rounded-sm h-full ${col === 3 ? "bg-accent/[0.03]" : ""}`}>
                      {apt && (
                        <div className={`absolute inset-0.5 rounded-sm border flex flex-col justify-center px-1 ${apt.color}`}>
                          <span className={`text-[6px] font-semibold truncate leading-tight ${apt.color.split(" ").find(c => c.startsWith("text-"))}`}>{apt.label}</span>
                          <span className={`text-[5px] truncate opacity-60 ${apt.color.split(" ").find(c => c.startsWith("text-"))}`}>{apt.sub}</span>
                        </div>
                      )}

                      {isNewSlot && (
                        <AnimatePresence>
                          {(phase === "blocking") && (
                            <motion.div
                              key="blocking"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: [0.4, 1, 0.4] }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.7, repeat: Infinity }}
                              className="absolute inset-0.5 rounded-sm border border-dashed border-accent/40 bg-accent/[0.06] flex items-center justify-center"
                            >
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="h-2 w-2 border border-accent/40 border-t-accent rounded-full"
                              />
                            </motion.div>
                          )}
                          {(phase === "confirmed" || phase === "notified") && (
                            <motion.div
                              key="confirmed"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ type: "spring", stiffness: 350, damping: 22 }}
                              className="absolute inset-0.5 rounded-sm border border-accent/30 bg-accent/12 flex flex-col justify-center px-1"
                            >
                              <span className="text-[6px] font-bold text-accent truncate leading-tight">Dra. Marina</span>
                              <span className="text-[5px] text-accent/60 truncate">Consulta</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      )}

                      {/* scan line highlight */}
                      {isScanning && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 rounded-sm bg-accent/[0.06]"
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* WhatsApp notification */}
        <AnimatePresence>
          {phase === "notified" && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 350, damping: 24, delay: 0.1 }}
              className="mt-1.5 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-2"
            >
              <WhatsappLogo className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-[8px] text-emerald-400 font-medium leading-none">Confirmação enviada no WhatsApp</p>
                <p className="text-[7px] text-emerald-400/60 mt-0.5">Quinta 13/03 às 10h · Dra. Marina</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Main section ─────────────────────────────────────────────────────────────

const steps = [
  {
    number: "01",
    icon: ChatCircle,
    title: "Paciente conversa no WhatsApp",
    description: "A IA atende com a voz da sua clínica, entende a necessidade e já sugere o melhor horário disponível.",
    demo: (active: boolean) => <StepChat active={active} />,
  },
  {
    number: "02",
    icon: CreditCard,
    title: "Pagamento via Pix",
    description: "A IA envia o QR code e o código Pix direto na conversa. Só avança quando o pagamento cai. Zero no-show.",
    demo: (active: boolean) => <StepPix active={active} />,
  },
  {
    number: "03",
    icon: CalendarCheck,
    title: "Agenda confirmada",
    description: "Com o Pix confirmado, o horário é bloqueado automaticamente no calendário. Sem surpresas, sem faltas.",
    demo: (active: boolean) => <StepCalendar active={active} />,
  },
]

export function HowItWorks() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-120px" })
  const [activeStep, setActiveStep] = useState(0)
  const [manualOverride, setManualOverride] = useState(false)

  useEffect(() => {
    if (!isInView) return
    if (manualOverride) return

    let step = 0
    setActiveStep(0)

    const interval = setInterval(() => {
      step = (step + 1) % steps.length
      setActiveStep(step)
    }, STEP_DURATION)

    return () => clearInterval(interval)
  }, [isInView, manualOverride])

  const handleStepClick = (i: number) => {
    setManualOverride(true)
    setActiveStep(i)
    // Resume auto after 20s of inactivity
    setTimeout(() => setManualOverride(false), 20000)
  }

  return (
    <section id="como-funciona" ref={ref} className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="mx-auto max-w-lg text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            Como funciona
          </p>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Do primeiro contato à{" "}
            <span className="font-display italic text-accent">consulta paga</span>
          </h2>
        </FadeIn>

        {/* Step indicators */}
        <div className="mt-12 flex items-center justify-center gap-2">
          {steps.map((step, i) => (
            <button
              key={step.number}
              onClick={() => handleStepClick(i)}
              className="flex items-center gap-2 group"
            >
              <motion.div
                animate={{
                  scale: i === activeStep ? 1.12 : 1,
                  borderColor: i === activeStep
                    ? "rgba(0,181,212,0.7)"
                    : i < activeStep
                    ? "rgba(0,181,212,0.35)"
                    : "rgba(255,255,255,0.1)",
                  backgroundColor: i === activeStep
                    ? "rgba(0,181,212,0.15)"
                    : i < activeStep
                    ? "rgba(0,181,212,0.07)"
                    : "rgba(255,255,255,0.03)",
                }}
                transition={{ duration: 0.4, ease }}
                className="flex h-7 w-7 items-center justify-center rounded-full border text-[9px] font-semibold"
                style={{ color: i <= activeStep ? "rgba(0,181,212,0.9)" : "rgba(255,255,255,0.25)" }}
              >
                <AnimatePresence mode="wait">
                  {i < activeStep ? (
                    <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>✓</motion.span>
                  ) : (
                    <motion.span key="num" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>{step.number}</motion.span>
                  )}
                </AnimatePresence>
              </motion.div>

              {i < steps.length - 1 && (
                <div className="w-16 h-px bg-border overflow-hidden rounded-full">
                  <motion.div
                    className="h-full bg-accent/50 origin-left"
                    animate={{ scaleX: i < activeStep ? 1 : 0 }}
                    transition={{ duration: 0.7, ease }}
                  />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Cards — fixed height, text always at same vertical position */}
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3 items-start">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              animate={{
                opacity: i === activeStep ? 1 : 0.4,
                scale: i === activeStep ? 1 : 0.965,
                y: i === activeStep ? 0 : 4,
              }}
              transition={{ duration: 0.55, ease }}
              onClick={() => handleStepClick(i)}
              className="relative cursor-pointer rounded-2xl border bg-card overflow-hidden"
              style={{
                borderColor: i === activeStep ? "rgba(0,181,212,0.22)" : "rgba(255,255,255,0.07)",
              }}
            >
              {/* Active ambient glow */}
              <AnimatePresence>
                {i === activeStep && (
                  <motion.div
                    key="glow"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute -inset-px rounded-2xl pointer-events-none"
                    style={{
                      background: "radial-gradient(ellipse at top left, rgba(0,181,212,0.08) 0%, transparent 60%)",
                    }}
                  />
                )}
              </AnimatePresence>

              {/* Top: header + demo — fixed height so cards stay aligned */}
              <div className="p-5 pb-4">
                {/* Step header */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[10px] font-medium tabular-nums" style={{ color: "rgba(255,255,255,0.18)" }}>
                    {step.number}
                  </span>
                  <motion.div
                    animate={{
                      backgroundColor: i === activeStep ? "rgba(0,181,212,0.15)" : "rgba(0,181,212,0.07)",
                      borderColor: i === activeStep ? "rgba(0,181,212,0.25)" : "rgba(0,181,212,0.1)",
                    }}
                    transition={{ duration: 0.4 }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border"
                  >
                    <step.icon
                      className="h-4 w-4"
                      style={{ color: i === activeStep ? "rgba(0,181,212,1)" : "rgba(0,181,212,0.4)" }}
                    />
                  </motion.div>
                </div>

                {/* Demo — fixed height container so all cards have same demo area */}
                <div className="h-[280px] overflow-hidden">
                  {step.demo(i === activeStep && isInView)}
                </div>
              </div>

              {/* Bottom: text — always at same position, separated by border */}
              <div className="border-t border-border/60 px-5 py-4">
                <h3 className="text-sm font-semibold tracking-tight text-foreground">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>

              {/* Timer bar */}
              <AnimatePresence>
                {i === activeStep && !manualOverride && (
                  <motion.div
                    key={`timer-${activeStep}-${manualOverride}`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: STEP_DURATION / 1000, ease: "linear" }}
                    className="absolute bottom-0 left-0 h-[2px] w-full origin-left rounded-b-2xl bg-accent/40"
                  />
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
