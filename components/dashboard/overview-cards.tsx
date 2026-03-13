"use client"

import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { StatsOverview } from "@/lib/api/stats"

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

interface OverviewCardsProps {
  data?: StatsOverview
  isLoading?: boolean
  className?: string
}

const cards = [
  { key: "leads", label: "Leads", get: (d?: StatsOverview) => d?.leadsTotal ?? 0 },
  { key: "agendamentos", label: "Agendamentos", get: (d?: StatsOverview) => d?.appointmentScheduledTotal ?? 0 },
  { key: "hoje", label: "Consultas hoje", get: (d?: StatsOverview) => d?.appointmentsToday ?? 0 },
  { key: "receita", label: "Receita paga", get: (d?: StatsOverview) => formatCurrency(d?.revenuePaid ?? 0), isCurrency: true },
  { key: "inadimplente", label: "Inadimplentes", get: (d?: StatsOverview) => d?.chargesOverdueCount ?? 0, sub: (d?: StatsOverview) => (d?.chargesOverdueCount ?? 0) > 0 ? formatCurrency(d?.chargesOverdueAmount ?? 0) : null },
  { key: "escalacoes", label: "Escalações", get: (d?: StatsOverview) => d?.escalationsCount ?? 0 },
  { key: "noShow", label: "Taxa no-show", get: (d?: StatsOverview) => d?.noShowRate ?? 0, suffix: "%" },
]

export function OverviewCards({ data, isLoading, className }: OverviewCardsProps) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7", className)}>
      {cards.map((card) => {
        const value = card.get(data)
        const sub = "sub" in card && card.sub ? card.sub(data) : null
        const suffix = "suffix" in card && card.suffix ? card.suffix : ""
        const displayValue = typeof value === "number"
          ? value.toLocaleString("pt-BR") + suffix
          : String(value)
        return (
          <Card key={card.key} className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-medium text-muted-foreground">
                {card.label}
              </span>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-8 w-20 animate-pulse rounded bg-muted/50" />
              ) : (
                <>
                  <span className="text-2xl font-bold tabular-nums">
                    {displayValue}
                  </span>
                  {sub && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
