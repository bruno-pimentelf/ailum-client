"use client"

import { CurrencyDollar, Clock, WarningCircle } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import type { StatsRevenue } from "@/lib/api/stats"

interface RevenueCardProps {
  data?: StatsRevenue
  isLoading?: boolean
  className?: string
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

const items: {
  key: string
  label: string
  icon: typeof CurrencyDollar
  getValue: (d?: StatsRevenue) => string
  getCount: (d?: StatsRevenue) => number
  color?: "success" | "warning" | "muted"
}[] = [
  { key: "paid", label: "Pago", icon: CurrencyDollar, getValue: (d) => formatCurrency(d?.paid ?? 0), getCount: (d) => d?.paidCount ?? 0, color: "success" },
  { key: "pending", label: "Pendente", icon: Clock, getValue: (d) => formatCurrency(d?.pending ?? 0), getCount: (d) => d?.pendingCount ?? 0, color: "warning" },
  { key: "overdue", label: "Inadimplente", icon: WarningCircle, getValue: (d) => formatCurrency(d?.overdue ?? 0), getCount: (d) => d?.overdueCount ?? 0, color: "muted" },
]

export function RevenueCard({ data, isLoading, className }: RevenueCardProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden", className)}>
      <div className="border-b border-border/50 px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">Financeiro</p>
        <h3 className="mt-1 text-[15px] font-semibold tracking-tight text-foreground">Receita</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Resumo do período</p>
      </div>
      <div className="p-5">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/20" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const Icon = item.icon
              const count = item.getCount(data)
              const colorClass =
                item.color === "success"
                  ? "text-emerald-400"
                  : item.color === "warning"
                  ? "text-amber-400"
                  : "text-muted-foreground"
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border/40 bg-muted/5 px-3.5 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        item.color === "success" && "bg-emerald-500/10",
                        item.color === "warning" && "bg-amber-500/10",
                        item.color === "muted" && "bg-muted/30"
                      )}
                    >
                      <Icon className={cn("h-4 w-4", colorClass)} weight="duotone" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-muted-foreground">{item.label}</p>
                      <p className="truncate text-base font-semibold tabular-nums text-foreground">
                        {item.getValue(data)}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                    {count} cobrança{count !== 1 ? "s" : ""}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
