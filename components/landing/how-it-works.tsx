"use client"

import { useRef, useState, useEffect } from "react"
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from "framer-motion"
import {
  ChatCircle,
  CreditCard,
  CalendarCheck,
  Checks,
  CheckCircle,
  WhatsappLogo,
} from "@phosphor-icons/react"

const ease = [0.33, 1, 0.68, 1] as const

/* ═══ Step 1: Chat ═══════════════════════════════════════════════════════════ */

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
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [visible, typing])

  return (
    <div className="rounded-xl border border-border bg-background/60 overflow-hidden w-full max-w-md mx-auto">
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-border bg-accent/[0.05]">
        <div className="relative">
          <div className="h-8 w-8 rounded-full bg-accent/15 flex items-center justify-center">
            <span className="text-[9px] font-bold text-accent">CH</span>
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-card" />
        </div>
        <div>
          <p className="text-xs font-semibold text-foreground leading-none">Clínica Harmonia</p>
          <p className="text-[9px] text-accent mt-0.5">IA ativa · online agora</p>
        </div>
        <WhatsappLogo className="ml-auto h-4 w-4 text-emerald-500/60" />
      </div>
      <div ref={scrollRef} className="flex flex-col gap-2.5 p-4 h-[260px] overflow-y-auto scroll-smooth">
        <AnimatePresence initial={false}>
          {chatMessages.map(msg =>
            visible.includes(msg.id) ? (
              <motion.div key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                className={`flex ${msg.from === "patient" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${msg.from === "patient" ? "bg-accent/12 rounded-br-sm" : "bg-muted rounded-bl-sm"}`}>
                  <p className="text-[11px] leading-relaxed text-foreground">{msg.text}</p>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span className="text-[8px] text-muted-foreground/60">{msg.time}</span>
                    {msg.from === "patient" && <Checks className="h-2.5 w-2.5 text-accent/70" />}
                  </div>
                </div>
              </motion.div>
            ) : null
          )}
        </AnimatePresence>
        <AnimatePresence>
          {typing && (
            <motion.div key="typing" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2.5">
                <div className="flex gap-1 items-center">
                  {[0,1,2].map(i => (
                    <motion.div key={i} className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50"
                      animate={{ y: [0,-4,0], opacity: [0.5,1,0.5] }}
                      transition={{ duration: 0.65, repeat: Infinity, delay: i * 0.13 }} />
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

/* ═══ Step 2: Pix ════════════════════════════════════════════════════════════ */

function QRPattern() {
  const pattern = [[1,1,1,1,1,1,1],[1,0,0,0,0,0,1],[1,0,1,1,1,0,1],[1,0,1,0,1,0,1],[1,0,1,1,1,0,1],[1,0,0,0,0,0,1],[1,1,1,1,1,1,1]]
  const inner  = [[0,1,0,1,1,0,0],[1,0,1,0,0,1,0],[0,1,1,0,1,0,1],[1,0,0,1,0,1,1],[0,1,0,0,1,0,0],[1,1,0,1,0,1,0],[0,0,1,0,1,1,0]]
  const cell = 8, total = 7 * cell
  return (
    <svg width={total} height={total} viewBox={`0 0 ${total} ${total}`} className="block">
      {Array.from({ length: 7 }).map((_, r) =>
        Array.from({ length: 7 }).map((_, c) => {
          const fill = pattern[r][c] ? "rgba(0,181,212,0.9)" : inner[r][c] ? "rgba(0,181,212,0.55)" : "transparent"
          return <rect key={`${r}-${c}`} x={c*cell+1} y={r*cell+1} width={cell-2} height={cell-2} rx={1} fill={fill} />
        })
      )}
    </svg>
  )
}

function StepPix({ active }: { active: boolean }) {
  const [phase, setPhase] = useState<"idle"|"generating"|"qr"|"waiting"|"paid">("idle")
  const [copied, setCopied] = useState(false)
  const [payProgress, setPayProgress] = useState(0)

  useEffect(() => {
    if (!active) { setPhase("idle"); setCopied(false); setPayProgress(0); return }
    let c = false
    async function run() {
      await new Promise(r => setTimeout(r, 400)); if (c) return; setPhase("generating")
      await new Promise(r => setTimeout(r, 800)); if (c) return; setPhase("qr")
      await new Promise(r => setTimeout(r, 1200)); if (c) return; setPhase("waiting")
      for (let p = 0; p <= 100; p += 2) { if (c) return; setPayProgress(p); await new Promise(r => setTimeout(r, 24)) }
      await new Promise(r => setTimeout(r, 200)); if (c) return; setPhase("paid")
    }
    run(); return () => { c = true }
  }, [active])

  return (
    <div className="rounded-xl border border-border bg-background/60 overflow-hidden w-full max-w-md mx-auto">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-accent/[0.05]">
        <motion.div animate={{ scale: phase === "paid" ? [1,1.3,1] : 1 }} transition={{ duration: 0.4 }}
          className={`h-1.5 w-1.5 rounded-full ${phase === "paid" ? "bg-emerald-400" : "bg-accent animate-pulse"}`} />
        <span className="text-xs font-medium text-foreground">Pagamento via Pix</span>
        <AnimatePresence mode="wait">
          {phase === "paid" ? (
            <motion.div key="paid" initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} className="ml-auto flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /><span className="text-[10px] text-emerald-400 font-semibold">Pago!</span>
            </motion.div>
          ) : (
            <motion.span key="amt" exit={{ opacity: 0 }} className="ml-auto text-[10px] text-emerald-400 font-medium">R$ 150,00</motion.span>
          )}
        </AnimatePresence>
      </div>
      <div className="p-4 flex flex-col gap-3 min-h-[240px] justify-center">
        <AnimatePresence mode="wait">
          {phase === "idle" && (
            <motion.div key="idle" exit={{ opacity: 0 }} className="flex items-center justify-center py-16">
              <div className="flex gap-1.5">{[0,1,2].map(i => (
                <motion.div key={i} className="h-1.5 w-1.5 rounded-full bg-accent/30"
                  animate={{ scale: [1,1.5,1], opacity: [0.3,0.8,0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i*0.22 }} />
              ))}</div>
            </motion.div>
          )}
          {phase === "generating" && (
            <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center gap-2 py-16">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="h-5 w-5 rounded-full border-2 border-accent/20 border-t-accent" />
              <span className="text-[10px] text-muted-foreground/60">Gerando QR code...</span>
            </motion.div>
          )}
          {(phase === "qr" || phase === "waiting" || phase === "paid") && (
            <motion.div key="qr" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease }} className="flex gap-4 items-start">
              <div className="relative shrink-0 p-2.5 rounded-lg bg-zinc-950 border border-accent/20">
                <QRPattern />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="h-7 w-7 rounded bg-zinc-950 border border-accent/25 flex items-center justify-center">
                    <span className="text-[7px] font-bold text-accent">PIX</span>
                  </div>
                </div>
                {phase === "paid" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                      <CheckCircle className="h-8 w-8 text-emerald-400" weight="fill" />
                    </motion.div>
                  </motion.div>
                )}
              </div>
              <div className="flex flex-col gap-2.5 flex-1 min-w-0">
                <div>
                  <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wider mb-1">Pix Copia e Cola</p>
                  <button onClick={() => setCopied(true)} className="w-full flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-2 text-left hover:border-accent/30 transition-colors">
                    <span className="flex-1 truncate font-mono text-[9px] text-muted-foreground">00020126580014br.gov.bcb.pix…6304ABCD</span>
                    <AnimatePresence mode="wait">
                      {copied ? <motion.span key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle className="h-3 w-3 text-emerald-400" /></motion.span>
                        : <motion.span key="cp" initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-[9px] text-accent/50 shrink-0">copiar</motion.span>}
                    </AnimatePresence>
                  </button>
                </div>
                <AnimatePresence mode="wait">
                  {phase === "waiting" && (
                    <motion.div key="w" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-1.5">
                      <div className="flex justify-between"><span className="text-[9px] text-muted-foreground/50">Aguardando pagamento</span><span className="text-[9px] text-accent/60 tabular-nums">{payProgress}%</span></div>
                      <div className="h-1 rounded-full bg-border overflow-hidden"><motion.div className="h-full rounded-full bg-accent/70" style={{ width: `${payProgress}%` }} /></div>
                    </motion.div>
                  )}
                  {phase === "paid" && (
                    <motion.div key="d" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/8 px-2.5 py-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" /><span className="text-[9px] text-emerald-400 font-medium">Pagamento confirmado</span>
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

/* ═══ Step 3: Calendar ═══════════════════════════════════════════════════════ */

const calSlots = ["08:00","09:00","10:00","11:00","14:00","15:00"]
const existingApts = [
  { time: "08:00", col: 1, label: "Dr. Carlos", sub: "Retorno", color: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
  { time: "11:00", col: 1, label: "Dr. Carlos", sub: "Consulta", color: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
  { time: "14:00", col: 2, label: "Dra. Marina", sub: "Limpeza", color: "bg-accent/10 border-accent/20 text-accent" },
  { time: "15:00", col: 1, label: "Dr. Carlos", sub: "Exame", color: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
]

function StepCalendar({ active }: { active: boolean }) {
  const [phase, setPhase] = useState<"idle"|"scanning"|"blocking"|"confirmed"|"notified">("idle")
  const [scanRow, setScanRow] = useState(-1)

  useEffect(() => {
    if (!active) { setPhase("idle"); setScanRow(-1); return }
    let c = false
    async function run() {
      await new Promise(r => setTimeout(r, 500)); if (c) return; setPhase("scanning")
      for (let i = 0; i < calSlots.length; i++) { if (c) return; setScanRow(i); await new Promise(r => setTimeout(r, 260)) }
      setScanRow(-1); await new Promise(r => setTimeout(r, 300)); if (c) return; setPhase("blocking")
      await new Promise(r => setTimeout(r, 900)); if (c) return; setPhase("confirmed")
      await new Promise(r => setTimeout(r, 1000)); if (c) return; setPhase("notified")
    }
    run(); return () => { c = true }
  }, [active])

  return (
    <div className="rounded-xl border border-border bg-background/60 overflow-hidden w-full max-w-md mx-auto">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-accent/[0.05]">
        <span className="text-xs font-medium text-foreground">Março 2026 · Quinta, 13</span>
        <AnimatePresence mode="wait">
          {(phase === "confirmed" || phase === "notified") ? (
            <motion.div key="ok" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-emerald-400" /><span className="text-[10px] text-emerald-400 font-medium">Reservado</span>
            </motion.div>
          ) : phase === "scanning" ? (
            <motion.span key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-accent/60">verificando agenda...</motion.span>
          ) : (
            <motion.span key="w" className="text-[10px] text-muted-foreground/40">aguardando Pix...</motion.span>
          )}
        </AnimatePresence>
      </div>
      <div className="p-3 flex flex-col gap-0.5">
        <div className="grid grid-cols-4 gap-px mb-1 pl-9">
          {["Seg 10","Ter 11","Qua 12","Qui 13"].map((d,i) => (
            <div key={d} className={`text-center text-[8px] font-medium py-0.5 rounded-sm ${i===3 ? "text-accent bg-accent/8" : "text-muted-foreground/40"}`}>{d}</div>
          ))}
        </div>
        {calSlots.map((time, rowIdx) => {
          const isScanning = phase === "scanning" && scanRow === rowIdx
          const isTarget = time === "10:00"
          return (
            <div key={time} className={`flex items-center gap-1.5 h-9 rounded-md transition-colors duration-150 ${isScanning ? "bg-accent/[0.04]" : ""}`}>
              <span className="w-8 text-[8px] text-muted-foreground/40 font-mono shrink-0 text-right">{time}</span>
              <div className="flex-1 grid grid-cols-4 gap-px h-full">
                {[0,1,2,3].map(col => {
                  const apt = existingApts.find(a => a.time === time && a.col === col)
                  const isNewSlot = col === 3 && isTarget
                  return (
                    <div key={col} className={`relative rounded-sm h-full ${col===3 ? "bg-accent/[0.03]" : ""}`}>
                      {apt && (
                        <div className={`absolute inset-0.5 rounded-sm border flex flex-col justify-center px-1 ${apt.color}`}>
                          <span className={`text-[7px] font-semibold truncate leading-tight ${apt.color.split(" ").find(c => c.startsWith("text-"))}`}>{apt.label}</span>
                          <span className={`text-[5px] truncate opacity-60 ${apt.color.split(" ").find(c => c.startsWith("text-"))}`}>{apt.sub}</span>
                        </div>
                      )}
                      {isNewSlot && (
                        <AnimatePresence>
                          {phase === "blocking" && (
                            <motion.div key="bl" initial={{ opacity: 0 }} animate={{ opacity: [0.4,1,0.4] }} exit={{ opacity: 0 }} transition={{ duration: 0.7, repeat: Infinity }}
                              className="absolute inset-0.5 rounded-sm border border-dashed border-accent/40 bg-accent/[0.06] flex items-center justify-center">
                              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="h-2 w-2 border border-accent/40 border-t-accent rounded-full" />
                            </motion.div>
                          )}
                          {(phase === "confirmed" || phase === "notified") && (
                            <motion.div key="cf" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 350, damping: 22 }}
                              className="absolute inset-0.5 rounded-sm border border-accent/30 bg-accent/12 flex flex-col justify-center px-1">
                              <span className="text-[7px] font-bold text-accent truncate leading-tight">Dra. Marina</span>
                              <span className="text-[5px] text-accent/60 truncate">Consulta</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      )}
                      {isScanning && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 rounded-sm bg-accent/[0.06]" />}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
        <AnimatePresence>
          {phase === "notified" && (
            <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 350, damping: 24, delay: 0.1 }}
              className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
              <WhatsappLogo className="h-4 w-4 text-emerald-400 shrink-0" />
              <div>
                <p className="text-[9px] text-emerald-400 font-medium leading-none">Confirmação enviada no WhatsApp</p>
                <p className="text-[7px] text-emerald-400/60 mt-0.5">Quinta 13/03 às 10h · Dra. Marina</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ═══ Step definitions ═══════════════════════════════════════════════════════ */

const steps = [
  {
    number: "01",
    icon: ChatCircle,
    title: "Paciente conversa no WhatsApp",
    description:
      "A IA atende com a voz da sua clínica, entende a necessidade e já sugere o melhor horário disponível.",
    demo: (active: boolean) => <StepChat active={active} />,
  },
  {
    number: "02",
    icon: CreditCard,
    title: "Pagamento via Pix",
    description:
      "A IA envia o QR code e o código Pix direto na conversa. Só avança quando o pagamento cai. Zero no-show.",
    demo: (active: boolean) => <StepPix active={active} />,
  },
  {
    number: "03",
    icon: CalendarCheck,
    title: "Agenda confirmada",
    description:
      "Com o Pix confirmado, o horário é bloqueado automaticamente no calendário. Sem surpresas, sem faltas.",
    demo: (active: boolean) => <StepCalendar active={active} />,
  },
]

/* ═══ Main component — full-screen scroll-pinned experience ═════════════════ */

const DEMO_HEIGHT = 420

export function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  })

  const [activeStep, setActiveStep] = useState(0)
  const [stepProgress, setStepProgress] = useState(0)

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const raw = v * steps.length
    const step = Math.min(Math.floor(raw), steps.length - 1)
    const progress = raw - step
    setActiveStep(step)
    setStepProgress(Math.min(progress, 1))
  })

  const barHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"])

  const RAIL_HEIGHT = 180

  return (
    <section
      ref={sectionRef}
      id="como-funciona"
      className="relative"
      style={{ height: `${(steps.length + 1) * 100}vh` }}
    >
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Background glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-1/3 h-[400px] w-[400px] rounded-full bg-accent/[0.03] blur-[120px]" />
          <div className="absolute right-1/4 bottom-1/4 h-[300px] w-[300px] rounded-full bg-accent/[0.02] blur-[100px]" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 md:px-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="text-center mb-12"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
              Como funciona
            </p>
            <h2 className="mt-3 text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
              Do primeiro contato à{" "}
              <span className="font-display italic text-accent">consulta paga</span>
            </h2>
          </motion.div>

          {/* Content row */}
          <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-center">
            {/* ── Left: progress rail + single active step text ── */}
            <div className="flex items-center gap-6 flex-shrink-0 w-full md:w-auto md:max-w-sm">
              {/* Vertical rail with evenly-spaced dots */}
              <div className="relative flex-shrink-0" style={{ width: 20, height: RAIL_HEIGHT }}>
                {/* Background track */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 w-[2px] rounded-full bg-border/30"
                  style={{ top: 0, bottom: 0 }}
                />
                {/* Filled track */}
                <motion.div
                  className="absolute left-1/2 -translate-x-1/2 w-[2px] rounded-full bg-accent origin-top"
                  style={{ top: 0, height: barHeight }}
                />

                {/* Step nodes — positioned at 0%, 50%, 100% */}
                {steps.map((_, i) => {
                  const topPct = steps.length <= 1 ? 50 : (i / (steps.length - 1)) * 100
                  return (
                    <div
                      key={i}
                      className="absolute left-1/2"
                      style={{ top: `${topPct}%`, transform: "translate(-50%, -50%)" }}
                    >
                      <motion.div
                        animate={{
                          scale: i === activeStep ? 1.15 : 0.85,
                          backgroundColor:
                            i < activeStep
                              ? "rgba(0,181,212,1)"
                              : i === activeStep
                              ? "rgba(0,181,212,0.85)"
                              : "rgba(255,255,255,0.06)",
                          borderColor:
                            i <= activeStep
                              ? "rgba(0,181,212,0.5)"
                              : "rgba(255,255,255,0.08)",
                        }}
                        transition={{ duration: 0.4, ease }}
                        className="relative h-3.5 w-3.5 rounded-full border-2"
                      >
                        {i === activeStep && (
                          <motion.div
                            className="absolute -inset-2.5 rounded-full border border-accent/25"
                            animate={{ scale: [1, 1.9, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          />
                        )}
                        {i < activeStep && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <CheckCircle className="h-3.5 w-3.5 text-white" weight="fill" />
                          </motion.div>
                        )}
                      </motion.div>
                    </div>
                  )
                })}
              </div>

              {/* Single active step text — animated swap */}
              <div className="relative flex-1 min-h-[120px] flex items-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -16, filter: "blur(4px)" }}
                    transition={{ duration: 0.4, ease }}
                    className="flex flex-col gap-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-[11px] font-mono text-accent/60 tabular-nums">
                        {steps[activeStep].number}
                      </span>
                      {(() => {
                        const Icon = steps[activeStep].icon
                        return <Icon className="h-4.5 w-4.5 text-accent" weight="fill" />
                      })()}
                    </div>
                    <h3 className="text-base font-semibold text-foreground leading-snug">
                      {steps[activeStep].title}
                    </h3>
                    <p className="text-[13px] leading-relaxed text-muted-foreground">
                      {steps[activeStep].description}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* ── Right: demo card in fixed-height container ── */}
            <div className="flex-1 min-w-0 w-full">
              <div
                className="relative flex items-center justify-center"
                style={{ height: DEMO_HEIGHT }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, y: 28, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -28, scale: 0.96 }}
                    transition={{ duration: 0.5, ease }}
                    className="w-full"
                  >
                    {steps[activeStep].demo(true)}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Progress bar below demo */}
              <div className="mt-5 mx-auto max-w-md">
                <div className="h-[2px] rounded-full bg-border/20 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-accent/40"
                    animate={{ width: `${stepProgress * 100}%` }}
                    transition={{ duration: 0.1, ease: "linear" }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[9px] text-muted-foreground/30 tabular-nums">
                    {steps[activeStep].number} de {String(steps.length).padStart(2, "0")}
                  </span>
                  <span className="text-[9px] text-muted-foreground/20">
                    role para continuar
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
