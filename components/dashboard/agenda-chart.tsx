"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import type { StatsAgenda } from "@/lib/api/stats"

interface AgendaChartProps {
  data?: StatsAgenda
  isLoading?: boolean
  className?: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  })
}

export function AgendaChart({ data, isLoading, className }: AgendaChartProps) {
  const chartData = useMemo(() => {
    if (!data?.byDay?.length) return []
    return data.byDay.map((d) => ({
      date: formatDate(d.date),
      total: d.total,
      fullDate: d.date,
    }))
  }, [data])

  const chartConfig = {
    total: { label: "Consultas", color: "var(--chart-1)" },
    date: { label: "Data" },
  } satisfies ChartConfig

  if (isLoading) {
    return (
      <div className={cn("rounded-xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden", className)}>
        <div className="border-b border-border/50 px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">Métricas</p>
          <h3 className="mt-1 text-[15px] font-semibold tracking-tight text-foreground">Agenda</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Consultas por dia no período</p>
        </div>
        <div className="p-5">
          <div className="h-[240px] animate-pulse rounded-lg bg-muted/20" />
        </div>
      </div>
    )
  }

  if (!chartData.length) {
    return (
      <div className={cn("rounded-xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden", className)}>
        <div className="border-b border-border/50 px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">Métricas</p>
          <h3 className="mt-1 text-[15px] font-semibold tracking-tight text-foreground">Agenda</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Nenhum dado de agenda no período</p>
        </div>
        <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">
          Nenhuma consulta registrada
        </div>
      </div>
    )
  }

  const totalConsultas = chartData.reduce((s, d) => s + d.total, 0)

  return (
    <div className={cn("rounded-xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden", className)}>
      <div className="border-b border-border/50 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">Métricas</p>
            <h3 className="mt-1 text-[15px] font-semibold tracking-tight text-foreground">Agenda</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Consultas por dia no período</p>
          </div>
          <span className="shrink-0 text-xl font-bold tabular-nums text-foreground">{totalConsultas}</span>
        </div>
      </div>
      <div className="p-5">
        <ChartContainer config={chartConfig} className="h-[240px] w-full">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value, payload) => {
                    const fullDate = payload?.[0]?.payload?.fullDate
                    if (fullDate) {
                      return new Date(fullDate).toLocaleDateString("pt-BR", {
                        weekday: "long",
                        day: "numeric",
                        month: "short",
                      })
                    }
                    return value
                  }}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="var(--color-total)"
              strokeWidth={2}
              fill="url(#fillTotal)"
              dot={false}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  )
}
