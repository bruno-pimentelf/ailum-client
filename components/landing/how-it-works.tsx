"use client"

import { useRef, useState, useEffect } from "react"
import { useLanguage } from "@/components/providers/language-provider"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChatCircle,
  CreditCard,
  CalendarCheck,
  Checks,
  CheckCircle,
  WhatsappLogo,
} from "@phosphor-icons/react"
import { FadeIn } from "./motion"

const ease = [0.32, 0.72, 0, 1] as const

/* ═══ Step 1: Chat ═══════════════════════════════════════════════════════════ */

function getChatMessages(t: { howItWorks: { chatMsg1: string; chatMsg2: string; chatMsg3: string; chatMsg4: string; chatMsg5: string } }) {
  return [
    { id: 1, from: "patient" as const, text: t.howItWorks.chatMsg1, time: "09:41" },
    { id: 2, from: "ai" as const, text: t.howItWorks.chatMsg2, time: "09:41" },
    { id: 3, from: "ai" as const, text: t.howItWorks.chatMsg3, time: "09:42" },
    { id: 4, from: "patient" as const, text: t.howItWorks.chatMsg4, time: "09:42" },
    { id: 5, from: "ai" as const, text: t.howItWorks.chatMsg5, time: "09:42" },
  ]
}

function StepChat({ active, t }: { active: boolean; t: ReturnType<typeof useLanguage>["t"] }) {
  const chatMessages = getChatMessages(t)
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
    <div className="rounded-xl border border-border bg-background/60 overflow-hidden w-full max-w-lg mx-auto">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-accent/[0.05]">
        <div className="relative">
          <div className="h-9 w-9 rounded-full bg-accent/15 flex items-center justify-center">
            <span className="text-[10px] font-bold text-accent">CH</span>
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-card" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground leading-none">{t.howItWorks.chatClinic}</p>
          <p className="text-[10px] text-accent mt-0.5">{t.howItWorks.chatAI}</p>
        </div>
        <WhatsappLogo className="ml-auto h-4.5 w-4.5 text-emerald-500/60" />
      </div>
      <div ref={scrollRef} className="flex flex-col gap-3 p-5 h-[360px] overflow-y-auto scroll-smooth">
        <AnimatePresence initial={false}>
          {chatMessages.map(msg =>
            visible.includes(msg.id) ? (
              <motion.div key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                className={`flex ${msg.from === "patient" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${msg.from === "patient" ? "bg-accent/12 rounded-br-sm" : "bg-muted rounded-bl-sm"}`}>
                  <p className="text-[13px] leading-relaxed text-foreground">{msg.text}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[9px] text-muted-foreground/60">{msg.time}</span>
                    {msg.from === "patient" && <Checks className="h-3 w-3 text-accent/70" />}
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
  const cell = 12, total = 7 * cell
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

function StepPix({ active, t }: { active: boolean; t: ReturnType<typeof useLanguage>["t"] }) {
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
    <div className="rounded-xl border border-border bg-background/60 overflow-hidden w-full max-w-lg mx-auto">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-accent/[0.05]">
        <motion.div animate={{ scale: phase === "paid" ? [1,1.3,1] : 1 }} transition={{ duration: 0.4 }}
          className={`h-1.5 w-1.5 rounded-full ${phase === "paid" ? "bg-emerald-400" : "bg-accent animate-pulse"}`} />
        <span className="text-sm font-medium text-foreground">{t.howItWorks.pixTitle}</span>
        <AnimatePresence mode="wait">
          {phase === "paid" ? (
            <motion.div key="paid" initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} className="ml-auto flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /><span className="text-[10px] text-emerald-400 font-semibold">{t.howItWorks.pixPaid}</span>
            </motion.div>
          ) : (
            <motion.span key="amt" exit={{ opacity: 0 }} className="ml-auto text-[10px] text-emerald-400 font-medium">R$ 150,00</motion.span>
          )}
        </AnimatePresence>
      </div>
      <div className="p-5 flex flex-col gap-4 min-h-[380px] justify-center">
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
              <span className="text-[10px] text-muted-foreground/60">{t.howItWorks.pixGenerating}</span>
            </motion.div>
          )}
          {(phase === "qr" || phase === "waiting" || phase === "paid") && (
            <motion.div key="qr" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease }} className="flex gap-6 items-start">
              <div className="relative shrink-0 p-3 rounded-xl bg-zinc-950 border border-accent/20">
                <QRPattern />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="h-9 w-9 rounded bg-zinc-950 border border-accent/25 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-accent">PIX</span>
                  </div>
                </div>
                {phase === "paid" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                      <CheckCircle className="h-10 w-10 text-emerald-400" weight="fill" />
                    </motion.div>
                  </motion.div>
                )}
              </div>
              <div className="flex flex-col gap-3 flex-1 min-w-0">
                <div>
                  <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider mb-1.5">{t.howItWorks.pixCopyPaste}</p>
                  <button onClick={() => setCopied(true)} className="w-full flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-left hover:border-accent/30 transition-colors">
                    <span className="flex-1 truncate font-mono text-[10px] text-muted-foreground">00020126580014br.gov.bcb.pix…6304ABCD</span>
                    <AnimatePresence mode="wait">
                      {copied ? <motion.span key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle className="h-3.5 w-3.5 text-emerald-400" /></motion.span>
                        : <motion.span key="cp" initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-[10px] text-accent/50 shrink-0">{t.howItWorks.pixCopy}</motion.span>}
                    </AnimatePresence>
                  </button>
                </div>
                <div className="text-center">
                  <p className="text-[11px] text-muted-foreground/40">{t.howItWorks.pixScan}</p>
                </div>
                <AnimatePresence mode="wait">
                  {phase === "waiting" && (
                    <motion.div key="w" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-2">
                      <div className="flex justify-between"><span className="text-[10px] text-muted-foreground/50">{t.howItWorks.pixWaiting}</span><span className="text-[10px] text-accent/60 tabular-nums font-mono">{payProgress}%</span></div>
                      <div className="h-1.5 rounded-full bg-border overflow-hidden"><motion.div className="h-full rounded-full bg-accent/70" style={{ width: `${payProgress}%` }} /></div>
                    </motion.div>
                  )}
                  {phase === "paid" && (
                    <motion.div key="d" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/8 px-3 py-2.5">
                      <div className="h-2 w-2 rounded-full bg-emerald-400" /><span className="text-[11px] text-emerald-400 font-medium">{t.howItWorks.pixConfirmed}</span>
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

function getExistingApts(t: ReturnType<typeof useLanguage>["t"]) {
  const aptTypes = t.demo.aptTypes
  const doctors = { carlos: t.demo.doctorCarlos, marina: t.demo.doctorMarina }
  return [
    { time: "08:00", col: 1, label: doctors.carlos, sub: aptTypes[4], color: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
    { time: "11:00", col: 1, label: doctors.carlos, sub: aptTypes[3], color: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
    { time: "14:00", col: 2, label: doctors.marina, sub: aptTypes[0], color: "bg-accent/10 border-accent/20 text-accent" },
    { time: "15:00", col: 1, label: doctors.carlos, sub: aptTypes[3], color: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
  ]
}

function StepCalendar({ active, t }: { active: boolean; t: ReturnType<typeof useLanguage>["t"] }) {
  const existingApts = getExistingApts(t)
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
    <div className="rounded-xl border border-border bg-background/60 overflow-hidden w-full max-w-lg mx-auto">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-accent/[0.05]">
        <span className="text-sm font-medium text-foreground">{t.howItWorks.calDate}</span>
        <AnimatePresence mode="wait">
          {(phase === "confirmed" || phase === "notified") ? (
            <motion.div key="ok" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-emerald-400" /><span className="text-[10px] text-emerald-400 font-medium">{t.howItWorks.calReserved}</span>
            </motion.div>
          ) : phase === "scanning" ? (
            <motion.span key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-accent/60">{t.howItWorks.calChecking}</motion.span>
          ) : (
            <motion.span key="w" className="text-[10px] text-muted-foreground/40">{t.howItWorks.calAwaiting}</motion.span>
          )}
        </AnimatePresence>
      </div>
      <div className="p-4 flex flex-col gap-0.5">
        <div className="grid grid-cols-4 gap-px mb-2 pl-10">
          {t.howItWorks.calDays.map((d,i) => (
            <div key={d} className={`text-center text-[9px] font-medium py-1 rounded-sm ${i===3 ? "text-accent bg-accent/8" : "text-muted-foreground/40"}`}>{d}</div>
          ))}
        </div>
        {calSlots.map((time, rowIdx) => {
          const isScanning = phase === "scanning" && scanRow === rowIdx
          const isTarget = time === "10:00"
          return (
            <div key={time} className={`flex items-center gap-2 h-11 rounded-md transition-colors duration-150 ${isScanning ? "bg-accent/[0.04]" : ""}`}>
              <span className="w-9 text-[9px] text-muted-foreground/40 font-mono shrink-0 text-right">{time}</span>
              <div className="flex-1 grid grid-cols-4 gap-px h-full">
                {[0,1,2,3].map(col => {
                  const apt = existingApts.find(a => a.time === time && a.col === col)
                  const isNewSlot = col === 3 && isTarget
                  return (
                    <div key={col} className={`relative rounded-sm h-full ${col===3 ? "bg-accent/[0.03]" : ""}`}>
                      {apt && (
                        <div className={`absolute inset-0.5 rounded-sm border flex flex-col justify-center px-1.5 ${apt.color}`}>
                          <span className={`text-[8px] font-semibold truncate leading-tight ${apt.color.split(" ").find(c => c.startsWith("text-"))}`}>{apt.label}</span>
                          <span className={`text-[6px] truncate opacity-60 ${apt.color.split(" ").find(c => c.startsWith("text-"))}`}>{apt.sub}</span>
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
                              className="absolute inset-0.5 rounded-sm border border-accent/30 bg-accent/12 flex flex-col justify-center px-1.5">
                              <span className="text-[8px] font-bold text-accent truncate leading-tight">{t.demo.doctorMarina}</span>
                              <span className="text-[6px] text-accent/60 truncate">{t.demo.aptTypes[3]}</span>
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
              className="mt-3 flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
              <WhatsappLogo className="h-5 w-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-[11px] text-emerald-400 font-medium leading-none">{t.howItWorks.calConfirmTitle}</p>
                <p className="text-[9px] text-emerald-400/60 mt-1">{t.howItWorks.calConfirmSub}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ═══ Main component — interactive tab-based experience ═════════════════════ */

export function HowItWorks() {
  const { t } = useLanguage()
  const [activeStep, setActiveStep] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  const steps = [
    {
      number: "01",
      icon: ChatCircle,
      title: t.howItWorks.step1Title,
      description: t.howItWorks.step1Desc,
      demo: (active: boolean) => <StepChat active={active} t={t} />,
    },
    {
      number: "02",
      icon: CreditCard,
      title: t.howItWorks.step2Title,
      description: t.howItWorks.step2Desc,
      demo: (active: boolean) => <StepPix active={active} t={t} />,
    },
    {
      number: "03",
      icon: CalendarCheck,
      title: t.howItWorks.step3Title,
      description: t.howItWorks.step3Desc,
      demo: (active: boolean) => <StepCalendar active={active} t={t} />,
    },
  ]

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const onChange = () => setIsMobile(mq.matches)
    onChange()
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  if (isMobile) {
    return (
      <section id="como-funciona" className="relative py-24">
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="mb-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
              {t.howItWorks.title}
            </p>
            <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground">
              {t.howItWorks.subtitle}{" "}
              <span className="text-accent">{t.howItWorks.subtitleAccent}</span>
            </h2>
          </div>

          {/* Mobile: step buttons + demo */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {steps.map((step, i) => {
              const Icon = step.icon
              const isActive = i === activeStep
              return (
                <button
                  key={step.number}
                  onClick={() => setActiveStep(i)}
                  className={`flex items-center gap-2 shrink-0 px-4 py-2.5 rounded-full border text-[13px] font-medium transition-all duration-300 ${
                    isActive
                      ? "border-accent/25 bg-accent/[0.06] text-accent"
                      : "border-white/[0.06] bg-white/[0.02] text-white/35"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" weight="fill" />
                  <span>{step.title}</span>
                </button>
              )
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease }}
            >
              <p className="text-[13px] leading-relaxed text-white/30 mb-5">
                {steps[activeStep].description}
              </p>
              {steps[activeStep].demo(true)}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    )
  }

  return (
    <section id="como-funciona" className="relative py-28 md:py-40">
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/3 h-[400px] w-[400px] rounded-full bg-accent/[0.03] blur-[120px]" />
        <div className="absolute right-1/4 bottom-1/4 h-[300px] w-[300px] rounded-full bg-accent/[0.02] blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6">
        {/* Header */}
        <FadeIn className="max-w-lg mb-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            {t.howItWorks.title}
          </p>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl leading-[1.1]">
            {t.howItWorks.subtitle}{" "}
            <span className="text-accent">{t.howItWorks.subtitleAccent}</span>
          </h2>
        </FadeIn>

        {/* Step selector tabs */}
        <div className="grid grid-cols-3 gap-3 mb-12">
          {steps.map((step, i) => {
            const Icon = step.icon
            const isActive = i === activeStep
            return (
              <motion.button
                key={step.number}
                onClick={() => setActiveStep(i)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`relative text-left p-6 rounded-2xl border transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer ${
                  isActive
                    ? "border-accent/20 bg-accent/[0.04] shadow-[0_0_30px_rgba(0,181,212,0.05)]"
                    : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className={`text-[11px] font-mono tabular-nums transition-colors duration-300 ${
                      isActive ? "text-accent" : "text-white/20"
                    }`}
                  >
                    {step.number}
                  </span>
                  <Icon
                    className={`h-4 w-4 transition-colors duration-300 ${
                      isActive ? "text-accent" : "text-white/20"
                    }`}
                    weight="fill"
                  />
                </div>
                <h3 className="font-display text-[15px] font-bold tracking-tight text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/25">
                  {step.description}
                </p>

                {/* Active indicator line */}
                {isActive && (
                  <motion.div
                    layoutId="how-it-works-indicator"
                    className="absolute bottom-0 left-6 right-6 h-[2px] rounded-full bg-accent/40"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Demo showcase area */}
        <div className="rounded-[2rem] bg-white/[0.02] p-2 ring-1 ring-white/[0.06]">
          <div className="rounded-[calc(2rem-0.5rem)] overflow-hidden min-h-[440px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -24, filter: "blur(8px)" }}
                transition={{ duration: 0.5, ease }}
                className="w-full px-4 md:px-8 py-8"
              >
                {steps[activeStep].demo(true)}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
