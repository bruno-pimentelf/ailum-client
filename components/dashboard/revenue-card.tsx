"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { StatsRevenue } from "@/lib/api/stats"

interface RevenueCardProps {
  data?: StatsRevenue
  isLoading?: boolean
  className?: string
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

const items = [
  { key: "paid", label: "Pago", getValue: (d?: StatsRevenue) => formatCurrency(d?.paid ?? 0), getCount: (d?: StatsRevenue) => d?.paidCount ?? 0 },
  { key: "pending", label: "Pendente", getValue: (d?: StatsRevenue) => formatCurrency(d?.pending ?? 0), getCount: (d?: StatsRevenue) => d?.pendingCount ?? 0 },
  { key: "overdue", label: "Inadimplente", getValue: (d?: StatsRevenue) => formatCurrency(d?.overdue ?? 0), getCount: (d?: StatsRevenue) => d?.overdueCount ?? 0 },
] as const

export function RevenueCard({ data, isLoading, className }: RevenueCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Receita</CardTitle>
        <CardDescription>Resumo do período</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/30" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                  <p className="text-lg font-semibold tabular-nums">{item.getValue(data)}</p>
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {item.getCount(data)} cobrança{item.getCount(data) !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
