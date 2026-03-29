"use client"

import { motion } from "framer-motion"
import {
  Timer,
  Smiley,
  SmileyMeh,
  SmileySad,
  SmileyAngry,
  TrendDown,
  Clock,
  UsersThree,
  Lightning,
} from "@phosphor-icons/react"
import type { StatsBehavior } from "@/lib/api/stats"

const ease = [0.33, 1, 0.68, 1] as const

function formatResponseTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}min`
  return `${Math.round(seconds / 3600)}h`
}

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}h`
}

const SENTIMENT_META = {
  positive:   { label: "Positivo",   icon: Smiley,      color: "text-emerald-400", bg: "bg-emerald-500" },
  neutral:    { label: "Neutro",     icon: SmileyMeh,   color: "text-muted-foreground", bg: "bg-muted-foreground" },
  negative:   { label: "Negativo",   icon: SmileySad,   color: "text-amber-400", bg: "bg-amber-500" },
  frustrated: { label: "Frustrado",  icon: SmileyAngry, color: "text-rose-400", bg: "bg-rose-500" },
} as const

export function BehaviorAnalytics({ data }: { data: StatsBehavior | undefined }) {
  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card/30 p-5 h-36 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Lightning className="h-4 w-4 text-accent" weight="fill" />
        <h3 className="text-[13px] font-bold text-foreground">Comportamento</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {/* Response Time */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease }}
          className="rounded-xl border border-border/50 bg-card/30 p-4 space-y-2"
        >
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-accent" weight="duotone" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tempo de resposta</span>
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">
            {data.responseTime.sampleCount > 0 ? formatResponseTime(data.responseTime.avgSeconds) : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground/60">
            {data.responseTime.sampleCount > 0
              ? `Média de ${data.responseTime.sampleCount} respostas`
              : "Sem dados ainda"
            }
          </p>
        </motion.div>

        {/* Sentiment */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05, ease }}
          className="rounded-xl border border-border/50 bg-card/30 p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <Smiley className="h-4 w-4 text-accent" weight="duotone" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sentimento</span>
          </div>
          {data.sentiment.total > 0 ? (
            <>
              {/* Bar */}
              <div className="flex h-2 rounded-full overflow-hidden gap-px">
                {(["positive", "neutral", "negative", "frustrated"] as const).map((key) => {
                  const pct = data.sentiment.total > 0 ? (data.sentiment[key] / data.sentiment.total) * 100 : 0
                  if (pct === 0) return null
                  return (
                    <div
                      key={key}
                      className={`${SENTIMENT_META[key].bg}/70 transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  )
                })}
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {(["positive", "neutral", "negative", "frustrated"] as const).map((key) => {
                  const meta = SENTIMENT_META[key]
                  const count = data.sentiment[key]
                  if (count === 0) return null
                  const pct = Math.round((count / data.sentiment.total) * 100)
                  return (
                    <div key={key} className="flex items-center gap-1">
                      <meta.icon className={`h-3 w-3 ${meta.color}`} weight="fill" />
                      <span className="text-[10px] text-muted-foreground/70">{pct}%</span>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <p className="text-[11px] text-muted-foreground/50">Sem dados ainda</p>
          )}
        </motion.div>

        {/* Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1, ease }}
          className="rounded-xl border border-border/50 bg-card/30 p-4 space-y-2"
        >
          <div className="flex items-center gap-2">
            <UsersThree className="h-4 w-4 text-accent" weight="duotone" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sessões</span>
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">{data.sessions.total}</p>
          <div className="space-y-0.5">
            <p className="text-[10px] text-muted-foreground/60">
              {data.sessions.avgPerContact} sessões/contato · {data.sessions.uniqueContacts} contatos
            </p>
            {data.sessions.peakHours.length > 0 && (
              <p className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Pico: {data.sessions.peakHours.map((h) => formatHour(h.hour)).join(", ")}
              </p>
            )}
          </div>
        </motion.div>

        {/* Drop-off */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15, ease }}
          className="rounded-xl border border-border/50 bg-card/30 p-4 space-y-2"
        >
          <div className="flex items-center gap-2">
            <TrendDown className="h-4 w-4 text-rose-400" weight="duotone" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Drop-off</span>
          </div>
          {data.dropOff.length > 0 ? (
            <div className="space-y-1.5">
              {data.dropOff.slice(0, 3).map((d, i) => (
                <div key={d.stageId} className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-foreground/80 truncate">{d.stageName}</span>
                  <span className="text-[11px] font-bold text-rose-400/80 tabular-nums shrink-0">{d.staleCount}</span>
                </div>
              ))}
              <p className="text-[9px] text-muted-foreground/40">Contatos parados há +24h</p>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground/50">Sem drop-off detectado</p>
          )}
        </motion.div>
      </div>
    </div>
  )
}
