"use client"

import { useState, useMemo, useCallback, useId } from "react"
import { useLanguage } from "@/components/providers/language-provider"
import { motion, AnimatePresence } from "framer-motion"
import {
  Heartbeat,
  Lightning,
  Timer,
  Fire,
  Thermometer,
  Snowflake,
  WhatsappLogo,
  ChatCircle,
  TrendUp,
} from "@phosphor-icons/react"

const ease = [0.33, 1, 0.68, 1] as const

/* ═══ ECG waveform — SVG path generation ════════════════════════════════════ */

function gaussian(x: number, mu: number, sigma: number) {
  return Math.exp(-0.5 * ((x - mu) / sigma) ** 2)
}

// Seeded PRNG (mulberry32) — deterministic, same output on server and client
function seededRng(seed: number) {
  let s = seed
  return () => {
    s |= 0; s = s + 0x6d2b79f5 | 0
    let t = Math.imul(s ^ s >>> 15, 1 | s)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function strToSeed(str: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/**
 * Builds a normalised PQRST SVG path for a given canvas size.
 * Uses a seeded PRNG so server and client produce identical output.
 */
function buildEcgPath(
  w: number,
  h: number,
  amplitude: number,
  noise: number,
  seed: string,
  cycles = 3,
): string {
  const SAMPLES = 220
  const mid = h * 0.52
  const scale = h * 0.44
  const rand = seededRng(strToSeed(seed))

  const points: [number, number][] = []

  for (let c = 0; c < cycles; c++) {
    for (let i = 0; i < SAMPLES; i++) {
      const t = i / SAMPLES
      let v = 0

      v += 0.10 * amplitude * gaussian(t, 0.10, 0.022)   // P
      v -= 0.07 * amplitude * gaussian(t, 0.185, 0.007)  // Q
      v += 0.95 * amplitude * gaussian(t, 0.205, 0.011)  // R
      v -= 0.20 * amplitude * gaussian(t, 0.228, 0.009)  // S
      v += 0.03 * amplitude * gaussian(t, 0.27, 0.025)   // J
      v += 0.24 * amplitude * gaussian(t, 0.38, 0.042)   // T
      v += 0.03 * amplitude * gaussian(t, 0.48, 0.028)   // U

      if (noise > 0) v += (rand() - 0.5) * noise * 0.035

      const x = ((c * SAMPLES + i) / (cycles * SAMPLES)) * w
      const y = mid - v * scale
      points.push([x, y])
    }
  }

  return points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ")
}

/* ═══ ECG SVG strip — pure CSS cyclic draw animation ════════════════════════ */

const W = 800
const H = 90
const CYCLE_S = 2.6  // seconds per full sweep

function EcgStrip({ amplitude, noise, uid }: { amplitude: number; noise: number; uid: string }) {
  const path = useMemo(() => buildEcgPath(W, H, amplitude, noise, uid), [amplitude, noise, uid])

  // Approximate path length — good enough for dasharray trick
  const pathLen = W * 3.2

  // Visible "tail" length — how much of the line is drawn at once
  const tailLen = Math.round(pathLen * 0.28)
  // Eraser gap — blank segment that follows the tail
  const gapLen = pathLen - tailLen

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height: H, display: "block" }}
    >
      <defs>
        {/* Fade-out gradient on the trailing edge of the tail */}
        <linearGradient id={`ecg-fade-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(0,181,212,0)" />
          <stop offset="60%" stopColor="rgba(0,181,212,0.7)" />
          <stop offset="100%" stopColor="rgba(0,181,212,1)" />
        </linearGradient>

        {/* Clip the SVG to its own bounds */}
        <clipPath id={`ecg-clip-${uid}`}>
          <rect x="0" y="0" width={W} height={H} />
        </clipPath>

        <style>{`
          @keyframes ecg-draw-${uid} {
            from { stroke-dashoffset: ${pathLen}; }
            to   { stroke-dashoffset: 0; }
          }
          @keyframes ecg-glow-${uid} {
            from { stroke-dashoffset: ${pathLen}; }
            to   { stroke-dashoffset: 0; }
          }
          .ecg-line-${uid} {
            stroke-dasharray: ${tailLen} ${gapLen};
            stroke-dashoffset: ${pathLen};
            animation: ecg-draw-${uid} ${CYCLE_S}s linear infinite;
          }
          .ecg-glow-${uid} {
            stroke-dasharray: ${tailLen} ${gapLen};
            stroke-dashoffset: ${pathLen};
            animation: ecg-glow-${uid} ${CYCLE_S}s linear infinite;
          }
          .ecg-dot-${uid} {
            animation: ecg-draw-${uid} ${CYCLE_S}s linear infinite;
            stroke-dasharray: 4 ${pathLen};
            stroke-dashoffset: ${pathLen - 2};
          }
          .ecg-dot-glow-${uid} {
            animation: ecg-draw-${uid} ${CYCLE_S}s linear infinite;
            stroke-dasharray: 18 ${pathLen};
            stroke-dashoffset: ${pathLen - 9};
          }
          .ecg-dot-halo-${uid} {
            animation: ecg-draw-${uid} ${CYCLE_S}s linear infinite;
            stroke-dasharray: 32 ${pathLen};
            stroke-dashoffset: ${pathLen - 16};
          }
        `}</style>
      </defs>

      <g clipPath={`url(#ecg-clip-${uid})`}>
        {/* Static dim trail — full path, very faint */}
        <path
          d={path}
          fill="none"
          stroke="rgba(0,181,212,0.07)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Baseline grid line */}
        <line
          x1="0" y1={H * 0.52} x2={W} y2={H * 0.52}
          stroke="rgba(255,255,255,0.04)"
          strokeDasharray="4 10"
        />

        {/* Glow halo — wide, soft */}
        <path
          d={path}
          fill="none"
          stroke="rgba(0,181,212,0.18)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`ecg-glow-${uid}`}
        />

        {/* Main bright line */}
        <path
          d={path}
          fill="none"
          stroke="rgba(0,181,212,0.92)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`ecg-line-${uid}`}
        />

        {/* Tip glow — outermost halo, very soft */}
        <path
          d={path}
          fill="none"
          stroke="rgba(0,181,212,0.25)"
          strokeWidth="22"
          strokeLinecap="round"
          className={`ecg-dot-halo-${uid}`}
        />

        {/* Tip glow — inner bloom */}
        <path
          d={path}
          fill="none"
          stroke="rgba(0,181,212,0.55)"
          strokeWidth="10"
          strokeLinecap="round"
          className={`ecg-dot-glow-${uid}`}
        />

        {/* Leading dot — bright white tip */}
        <path
          d={path}
          fill="none"
          stroke="rgba(255,255,255,0.98)"
          strokeWidth="3.5"
          strokeLinecap="round"
          className={`ecg-dot-${uid}`}
        />
      </g>
    </svg>
  )
}

/* ═══ Lead data — "patients" with warmth levels ══════════════════════════════ */

type LeadTemp = "hot" | "warm" | "cold"

interface LeadContact {
  id: string
  name: string
  initials: string
  source: string
  lastMessage: string
  temp: LeadTemp
  tempLabel: string
  engagement: number
  conversion: number
  responseMin: number
  ecgAmplitude: number
  ecgNoise: number
  dotColor: string
  accentColor: string
  borderActive: string
}

function getLeads(t: ReturnType<typeof useLanguage>["t"]): LeadContact[] {
  return [
    {
      id: "maria",
      name: "Maria Silva",
      initials: "MS",
      source: "WhatsApp",
      lastMessage: t.leadMonitor.msgMaria,
      temp: "hot",
      tempLabel: t.leadMonitor.hot,
      engagement: 96,
      conversion: 92,
      responseMin: 2,
      ecgAmplitude: 1.0,
      ecgNoise: 0.3,
      dotColor: "bg-rose-400/70",
      accentColor: "text-accent",
      borderActive: "border-accent/30",
    },
    {
      id: "joao",
      name: "João Pereira",
      initials: "JP",
      source: "WhatsApp",
      lastMessage: t.leadMonitor.msgJoao,
      temp: "warm",
      tempLabel: t.leadMonitor.warm,
      engagement: 64,
      conversion: 48,
      responseMin: 25,
      ecgAmplitude: 0.6,
      ecgNoise: 0.5,
      dotColor: "bg-amber-400/60",
      accentColor: "text-accent/70",
      borderActive: "border-accent/20",
    },
    {
      id: "ana",
      name: "Ana Luíza",
      initials: "AL",
      source: "Instagram",
      lastMessage: t.leadMonitor.msgAna,
      temp: "warm",
      tempLabel: t.leadMonitor.warm,
      engagement: 51,
      conversion: 35,
      responseMin: 48,
      ecgAmplitude: 0.45,
      ecgNoise: 0.8,
      dotColor: "bg-amber-400/50",
      accentColor: "text-accent/60",
      borderActive: "border-accent/15",
    },
    {
      id: "carlos",
      name: "Carlos Mendes",
      initials: "CM",
      source: "Site",
      lastMessage: t.leadMonitor.msgCarlos,
      temp: "cold",
      tempLabel: t.leadMonitor.cold,
      engagement: 12,
      conversion: 6,
      responseMin: 4320,
      ecgAmplitude: 0.15,
      ecgNoise: 1.5,
      dotColor: "bg-white/20",
      accentColor: "text-white/35",
      borderActive: "border-white/10",
    },
  ]
}

function formatResponseTime(minutes: number): string {
  if (minutes < 60) return `${minutes}min`
  if (minutes < 1440) return `${Math.round(minutes / 60)}h`
  return `${Math.round(minutes / 1440)}d`
}

const tempIcons: Record<LeadTemp, React.ReactNode> = {
  hot:  <Fire      weight="fill" className="h-3 w-3 text-rose-400/80" />,
  warm: <Thermometer weight="fill" className="h-3 w-3 text-amber-400/70" />,
  cold: <Snowflake weight="fill" className="h-3 w-3 text-white/30" />,
}

const tempColors: Record<LeadTemp, string> = {
  hot:  "bg-rose-400/8  text-rose-400/80  border-rose-400/15",
  warm: "bg-amber-400/8 text-amber-400/70 border-amber-400/12",
  cold: "bg-white/[0.04] text-white/35 border-white/[0.08]",
}


/* ═══ Vital Card ═════════════════════════════════════════════════════════════ */

function VitalCard({
  icon,
  label,
  value,
  unit,
  color,
  subtext,
  delay,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  unit: string
  color: string
  subtext?: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease }}
      className="flex flex-col gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5"
    >
      <div className="flex items-center gap-2">
        <span className={`${color} opacity-80`}>{icon}</span>
        <span className="text-[10px] font-medium text-white/35 tracking-wide uppercase">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <AnimatePresence mode="wait">
          <motion.span
            key={String(value)}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.25 }}
            className={`text-xl font-semibold tabular-nums ${color}`}
          >
            {value}
          </motion.span>
        </AnimatePresence>
        <span className="text-[10px] text-white/25">{unit}</span>
      </div>
      {subtext && (
        <span className="text-[9px] text-white/20 leading-tight">{subtext}</span>
      )}
    </motion.div>
  )
}

/* ═══ Main component ═════════════════════════════════════════════════════════ */

export function MedicalViz() {
  const { t } = useLanguage()
  const uid = useId().replace(/:/g, "")
  const [selectedId, setSelectedId] = useState("maria")
  const LEADS = useMemo(() => getLeads(t), [t])

  const selected = useMemo(
    () => LEADS.find((l) => l.id === selectedId) ?? LEADS[0],
    [selectedId, LEADS]
  )

  const handleSelect = useCallback((id: string) => setSelectedId(id), [])

  const glowColor = useMemo(() => {
    switch (selected.temp) {
      case "hot":  return "rgba(0,181,212,0.10)"
      case "warm": return "rgba(0,181,212,0.05)"
      case "cold": return "rgba(0,181,212,0.02)"
    }
  }, [selected.temp])

  return (
    <div className="relative w-full rounded-2xl border border-white/[0.07] bg-zinc-950/80 backdrop-blur-xl overflow-hidden">
      {/* Ambient glow — shifts with lead temperature */}
      <motion.div
        animate={{ backgroundColor: glowColor }}
        transition={{ duration: 0.8 }}
        className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[60%] h-40 blur-3xl rounded-full"
      />

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.05]">
        <div className="flex items-center gap-2.5">
          <div className="h-2 w-2 rounded-full bg-accent/70 animate-pulse" />
          <span className="text-[11px] font-medium text-white/50 tracking-wider uppercase">
            {t.leadMonitor.title}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={selected.temp}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.3 }}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${tempColors[selected.temp]}`}
            >
              {tempIcons[selected.temp]}
              {selected.tempLabel}
            </motion.div>
          </AnimatePresence>
          <span className="text-[10px] text-white/20 font-mono tabular-nums">
            {selected.name}
          </span>
        </div>
      </div>

      {/* ── ECG strip — Recharts ───────────────────────────────── */}
      <div className="px-5 pt-3 pb-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] text-white/20 uppercase tracking-widest font-mono">
            {t.leadMonitor.activity}
          </span>
          <div className="flex items-center gap-1.5">
            <Heartbeat weight="fill" className="h-3 w-3 text-white/20" />
            <AnimatePresence mode="wait">
              <motion.span
                key={selected.engagement}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] font-mono text-white/30 tabular-nums"
              >
                {selected.engagement} bpm
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        {/* ECG strip — pure SVG + CSS, cyclic draw animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <EcgStrip
              amplitude={selected.ecgAmplitude}
              noise={selected.ecgNoise}
              uid={`${uid}-${selectedId}`}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Vitals + Lead list ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-5 pb-5 pt-2">
        {/* Lead list (interactive) */}
        <div className="flex flex-col">
          <div className="text-[9px] text-white/20 uppercase tracking-widest font-mono mb-2.5">
            {t.leadMonitor.activeLeads}
          </div>
          <div className="flex flex-col gap-1.5">
            {LEADS.map((lead) => {
              const isSelected = lead.id === selectedId
              return (
                <motion.button
                  key={lead.id}
                  onClick={() => handleSelect(lead.id)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  animate={{
                    borderColor: isSelected
                      ? lead.temp === "hot"
                        ? "rgba(0,181,212,0.22)"
                        : lead.temp === "warm"
                        ? "rgba(0,181,212,0.12)"
                        : "rgba(255,255,255,0.08)"
                      : "rgba(255,255,255,0.05)",
                    backgroundColor: isSelected
                      ? "rgba(0,181,212,0.03)"
                      : "rgba(255,255,255,0.01)",
                  }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors"
                >
                  {/* Avatar */}
                  <div className="relative h-7 w-7 rounded-full flex items-center justify-center shrink-0 bg-accent/[0.08]">
                    <span className={`text-[8px] font-bold ${lead.accentColor}`}>
                      {lead.initials}
                    </span>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-zinc-950 ${lead.dotColor} ${
                        lead.temp === "hot" ? "animate-pulse" : ""
                      }`}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-medium text-white/70 truncate">
                        {lead.name}
                      </span>
                      {lead.source === "WhatsApp" && (
                        <WhatsappLogo className="h-2.5 w-2.5 text-white/25 shrink-0" />
                      )}
                      {lead.source === "Instagram" && (
                        <ChatCircle className="h-2.5 w-2.5 text-white/25 shrink-0" />
                      )}
                    </div>
                    <span className="text-[9px] text-white/25 truncate block">
                      {lead.lastMessage}
                    </span>
                  </div>

                  {/* Temperature badge */}
                  <div
                    className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 shrink-0 ${tempColors[lead.temp]}`}
                  >
                    {tempIcons[lead.temp]}
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Vitals — change based on selected lead */}
        <div className="flex flex-col">
          <div className="text-[9px] text-white/20 uppercase tracking-widest font-mono mb-2.5">
            {t.leadMonitor.leadSignals}
          </div>
          <div className="flex flex-col gap-2">
            <VitalCard
              icon={<Heartbeat weight="fill" className="w-4 h-4" />}
              label={t.leadMonitor.engagement}
              value={selected.engagement}
              unit="%"
              color={selected.accentColor}
              subtext={
                selected.temp === "hot"
                  ? t.leadMonitor.subEngagementHot
                  : selected.temp === "warm"
                  ? t.leadMonitor.subEngagementWarm
                  : t.leadMonitor.subEngagementCold
              }
              delay={0}
            />
            <VitalCard
              icon={<TrendUp weight="fill" className="w-4 h-4" />}
              label={t.leadMonitor.conversionProb}
              value={selected.conversion}
              unit="%"
              color={selected.accentColor}
              subtext={
                selected.conversion >= 70
                  ? t.leadMonitor.subConversionHigh
                  : selected.conversion >= 30
                  ? t.leadMonitor.subConversionMid
                  : t.leadMonitor.subConversionLow
              }
              delay={0.06}
            />
            <VitalCard
              icon={<Timer weight="fill" className="w-4 h-4" />}
              label={t.leadMonitor.responseTime}
              value={formatResponseTime(selected.responseMin)}
              unit=""
              color={selected.accentColor}
              subtext={`${t.leadMonitor.lastInteraction}: ${
                selected.responseMin < 60
                  ? t.leadMonitor.lastInteractionNow
                  : selected.responseMin < 1440
                  ? t.leadMonitor.lastInteractionToday
                  : t.leadMonitor.lastInteractionDays
              }`}
              delay={0.12}
            />
          </div>
        </div>
      </div>

      {/* ── Bottom status bar ──────────────────────────────────── */}
      <div className="border-t border-white/[0.05] px-5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightning weight="fill" className="h-3 w-3 text-accent/60" />
          <span className="text-[10px] text-white/30">
            {t.leadMonitor.aiMonitoring}{" "}
            <span className="text-white/50 font-medium">{LEADS.length} {t.leadMonitor.leadsRealtime}</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          {(["hot", "warm", "cold"] as const).map((temp) => {
            const count = LEADS.filter((l) => l.temp === temp).length
            return (
              <div key={temp} className="flex items-center gap-1">
                {tempIcons[temp]}
                <span className="text-[9px] text-white/25 font-mono tabular-nums">
                  {count}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
