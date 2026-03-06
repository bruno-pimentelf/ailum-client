"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useAnimationFrame, useMotionValue, useTransform } from "framer-motion"

// ECG waveform path data — one full PQRST cycle normalized to 0-1 x-axis
const ECG_POINTS = [
  [0, 0.5],
  [0.04, 0.5],
  [0.06, 0.48],
  [0.08, 0.52],
  [0.10, 0.5],
  [0.14, 0.5],
  [0.16, 0.42],
  [0.18, 0.1],   // R peak (sharp spike up)
  [0.20, 0.9],   // S trough
  [0.22, 0.5],
  [0.26, 0.5],
  [0.30, 0.44],
  [0.34, 0.44],
  [0.38, 0.5],
  [0.44, 0.5],
  [0.50, 0.5],
  [0.56, 0.5],
  [0.60, 0.48],
  [0.64, 0.52],
  [0.66, 0.5],
  [0.70, 0.5],
  [0.72, 0.42],
  [0.74, 0.1],
  [0.76, 0.9],
  [0.78, 0.5],
  [0.82, 0.5],
  [0.86, 0.44],
  [0.90, 0.44],
  [0.94, 0.5],
  [1.0, 0.5],
]

function buildEcgPath(points: number[][], w: number, h: number) {
  return points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x * w} ${y * h}`)
    .join(" ")
}

function EcgLine({ width, height }: { width: number; height: number }) {
  const progress = useMotionValue(0)
  const [tick, setTick] = useState(0)

  useAnimationFrame((t) => {
    // cycle every 2.4 seconds
    progress.set((t % 2400) / 2400)
    setTick(Math.floor(t / 16))
  })

  const fullPath = buildEcgPath(ECG_POINTS, width, height)
  const dashLen = width * 2.2

  const dashOffset = useTransform(progress, (p) => dashLen - p * dashLen)

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      {/* Static dim trail */}
      <path
        d={fullPath}
        fill="none"
        stroke="rgba(0,181,212,0.10)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Animated bright line */}
      <motion.path
        d={fullPath}
        fill="none"
        stroke="rgba(0,181,212,0.85)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={`${dashLen}`}
        style={{ strokeDashoffset: dashOffset }}
      />
      {/* Glow duplicate */}
      <motion.path
        d={fullPath}
        fill="none"
        stroke="rgba(0,181,212,0.25)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={`${dashLen}`}
        style={{ strokeDashoffset: dashOffset }}
      />
    </svg>
  )
}

const VITALS = [
  {
    label: "Freq. Cardíaca",
    unit: "bpm",
    base: 72,
    range: 4,
    color: "text-rose-400",
    dot: "bg-rose-400",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.5">
        <path d="M3.5 9C3.5 6.5 5.5 4.5 8 4.5c1.2 0 2.3.5 3 1.3C11.7 5 12.8 4.5 14 4.5c2.5 0 4.5 2 4.5 4.5 0 4-5.5 8-8.5 9.5C7 17 1.5 13 1.5 9z" />
      </svg>
    ),
  },
  {
    label: "SpO₂",
    unit: "%",
    base: 98,
    range: 1,
    color: "text-cyan-400",
    dot: "bg-cyan-400",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.5">
        <circle cx="10" cy="10" r="7" />
        <path d="M10 6v4l2.5 2.5" />
      </svg>
    ),
  },
  {
    label: "Pressão",
    unit: "mmHg",
    base: 120,
    range: 5,
    color: "text-violet-400",
    dot: "bg-violet-400",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.5">
        <path d="M10 3v14M6 7l4-4 4 4" />
      </svg>
    ),
  },
]

function VitalCard({ vital, delay }: { vital: typeof VITALS[0]; delay: number }) {
  const [value, setValue] = useState(vital.base)
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      const next = vital.base + Math.round((Math.random() - 0.5) * vital.range * 2)
      setValue(next)
      setPulse(true)
      setTimeout(() => setPulse(false), 300)
    }, 1800 + delay * 200)
    return () => clearInterval(interval)
  }, [vital, delay])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.6 + delay * 0.15, ease: [0.33, 1, 0.68, 1] }}
      className="relative flex flex-col gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2">
        <span className={`${vital.color} opacity-70`}>{vital.icon}</span>
        <span className="text-[11px] font-medium text-white/40 tracking-wide uppercase">{vital.label}</span>
        <span className={`ml-auto h-1.5 w-1.5 rounded-full ${vital.dot} animate-pulse`} />
      </div>
      <div className="flex items-baseline gap-1">
        <motion.span
          key={value}
          initial={{ opacity: 0.5, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className={`text-2xl font-semibold tabular-nums ${vital.color}`}
        >
          {value}
        </motion.span>
        <span className="text-[11px] text-white/30">{vital.unit}</span>
      </div>
    </motion.div>
  )
}

const APPOINTMENTS = [
  { time: "09:00", name: "Maria S.", type: "Consulta", status: "confirmed" },
  { time: "10:30", name: "João P.", type: "Retorno", status: "confirmed" },
  { time: "11:45", name: "Ana L.", type: "Exame", status: "pending" },
  { time: "14:00", name: "Carlos M.", type: "Consulta", status: "confirmed" },
]

function AppointmentRow({ appt, delay }: { appt: typeof APPOINTMENTS[0]; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.9 + delay * 0.1, ease: [0.33, 1, 0.68, 1] }}
      className="flex items-center gap-3 py-2 border-b border-white/[0.05] last:border-0"
    >
      <span className="w-10 text-[11px] font-mono text-white/40 shrink-0">{appt.time}</span>
      <span className="flex-1 text-[12px] font-medium text-white/75 truncate">{appt.name}</span>
      <span className="text-[11px] text-white/35">{appt.type}</span>
      <span
        className={`h-1.5 w-1.5 rounded-full shrink-0 ${
          appt.status === "confirmed" ? "bg-emerald-400" : "bg-amber-400"
        }`}
      />
    </motion.div>
  )
}

export function MedicalViz() {
  const [mounted, setMounted] = useState(false)
  const [ecgSize, setEcgSize] = useState({ w: 600, h: 80 })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    const update = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth
        setEcgSize({ w, h: 80 })
      }
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl border border-white/[0.07] bg-zinc-950/80 backdrop-blur-xl overflow-hidden"
      style={{ minHeight: 340 }}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[60%] h-40 bg-cyan-500/10 blur-3xl rounded-full" />

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-medium text-white/50 tracking-wider uppercase">Monitor Clínico · Ao vivo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-white/25 font-mono">
            {mounted ? new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : ""}
          </span>
          <div className="h-1.5 w-1.5 rounded-full bg-cyan-400/60" />
        </div>
      </div>

      {/* ECG strip */}
      <div className="px-5 pt-4 pb-2">
        <div className="text-[10px] text-white/25 uppercase tracking-widest mb-2 font-mono">ECG · Lead II</div>
        {mounted && (
          <EcgLine width={ecgSize.w - 40} height={ecgSize.h} />
        )}
      </div>

      {/* Vitals + Appointments */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-5 pb-5 pt-2">
        {/* Vitals */}
        <div className="flex flex-col gap-2">
          <div className="text-[10px] text-white/25 uppercase tracking-widest font-mono mb-1">Sinais Vitais</div>
          {VITALS.map((v, i) => (
            <VitalCard key={v.label} vital={v} delay={i} />
          ))}
        </div>

        {/* Agenda */}
        <div className="flex flex-col">
          <div className="text-[10px] text-white/25 uppercase tracking-widest font-mono mb-3">Agenda de Hoje</div>
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-1 flex-1">
            {APPOINTMENTS.map((a, i) => (
              <AppointmentRow key={a.time} appt={a} delay={i} />
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.6 }}
            className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2"
          >
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-emerald-400/80">IA confirmou 3 consultas automaticamente</span>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
