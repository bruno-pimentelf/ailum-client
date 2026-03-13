"use client"

import { useMemo } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
      <Card className={className}>
        <CardHeader>
          <CardTitle>Agenda</CardTitle>
          <CardDescription>Consultas por dia no período</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] animate-pulse rounded-lg bg-muted/30" />
        </CardContent>
      </Card>
    )
  }

  if (!chartData.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Agenda</CardTitle>
          <CardDescription>Nenhum dado de agenda no período</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">
            Nenhuma consulta registrada
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalConsultas = chartData.reduce((s, d) => s + d.total, 0)

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Agenda</CardTitle>
            <CardDescription>Consultas por dia no período</CardDescription>
          </div>
          <span className="text-2xl font-bold tabular-nums">{totalConsultas}</span>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
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
      </CardContent>
    </Card>
  )
}
