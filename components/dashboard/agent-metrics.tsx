"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { StatsAgent } from "@/lib/api/stats"

interface AgentMetricsProps {
  data?: StatsAgent
  isLoading?: boolean
  className?: string
}

// API returns resolutionRate as 0–100 (e.g. 94.5), not 0–1
function formatResolution(rate?: number) {
  if (rate == null) return "—"
  return `${rate.toFixed(1)}%`
}

const metrics = [
  { key: "messages", label: "Mensagens", get: (d?: StatsAgent) => d?.messagesFromAgent ?? 0 },
  { key: "escalations", label: "Escalações", get: (d?: StatsAgent) => d?.escalations ?? 0 },
  { key: "violations", label: "Violações guardrail", get: (d?: StatsAgent) => d?.guardrailViolations ?? 0 },
  { key: "blocked", label: "Bloqueios", get: (d?: StatsAgent) => d?.guardrailBlocked ?? 0 },
  { key: "tokens", label: "Tokens", get: (d?: StatsAgent) => (d?.totalInputTokens ?? 0) + (d?.totalOutputTokens ?? 0) },
] as const

export function AgentMetrics({ data, isLoading, className }: AgentMetricsProps) {
  const resolution = formatResolution(data?.resolutionRate)

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Agente IA</CardTitle>
            <CardDescription>Métricas do assistente no período</CardDescription>
          </div>
          <span className="rounded-md bg-muted px-2.5 py-1 text-sm font-medium tabular-nums">
            {resolution} resolução
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-muted/30" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {metrics.map((m) => (
              <div key={m.key} className="rounded-lg border border-border/50 p-3">
                <p className="text-xs font-medium text-muted-foreground">{m.label}</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">
                  {m.get(data).toLocaleString("pt-BR")}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
