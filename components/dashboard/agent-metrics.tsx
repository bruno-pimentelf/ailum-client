"use client"

import { ChatCircleText, ArrowUpRight, Shield, Prohibit, Cpu } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import type { StatsAgent } from "@/lib/api/stats"

interface AgentMetricsProps {
  data?: StatsAgent
  isLoading?: boolean
  className?: string
}

// API returns resolutionRate as 0–100
function formatResolution(rate?: number) {
  if (rate == null) return "—"
  return `${rate.toFixed(1)}%`
}

const metrics: {
  key: string
  label: string
  icon: typeof ChatCircleText
  get: (d?: StatsAgent) => number
}[] = [
  { key: "messages", label: "Mensagens", icon: ChatCircleText, get: (d) => d?.messagesFromAgent ?? 0 },
  { key: "escalations", label: "Escalações", icon: ArrowUpRight, get: (d) => d?.escalations ?? 0 },
  { key: "violations", label: "Violações guardrail", icon: Shield, get: (d) => d?.guardrailViolations ?? 0 },
  { key: "blocked", label: "Bloqueios", icon: Prohibit, get: (d) => d?.guardrailBlocked ?? 0 },
  { key: "tokens", label: "Tokens", icon: Cpu, get: (d) => (d?.totalInputTokens ?? 0) + (d?.totalOutputTokens ?? 0) },
]

export function AgentMetrics({ data, isLoading, className }: AgentMetricsProps) {
  const resolution = formatResolution(data?.resolutionRate)

  return (
    <div className={cn("rounded-xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden", className)}>
      <div className="border-b border-border/50 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">Assistente</p>
            <h3 className="mt-1 text-[15px] font-semibold tracking-tight text-foreground">Agente IA</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Métricas do assistente no período</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-accent/20 bg-accent/5 px-2.5 py-1.5 text-[13px] font-semibold tabular-nums text-accent">
            {resolution} resolução
          </span>
        </div>
      </div>
      <div className="p-5">
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-[72px] animate-pulse rounded-xl bg-muted/20" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {metrics.map((m) => {
              const Icon = m.icon
              return (
                <div
                  key={m.key}
                  className="flex items-center gap-3 rounded-xl border border-border/40 bg-muted/5 px-3.5 py-3 transition-colors hover:border-border/60"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-muted/20">
                    <Icon className="h-4 w-4 text-muted-foreground" weight="duotone" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-muted-foreground">{m.label}</p>
                    <p className="text-lg font-semibold tabular-nums text-foreground">
                      {m.get(data).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
