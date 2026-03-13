"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
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
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { useFunnels } from "@/hooks/use-board"
import { useStatsFunnel } from "@/hooks/use-stats"

const ease = [0.33, 1, 0.68, 1] as const

interface FunnelChartProps {
  className?: string
}

export function FunnelChart({ className }: FunnelChartProps) {
  const [selectedFunnelId, setSelectedFunnelId] = useState<string | null>(null)

  const { data: funnels, isLoading: funnelsLoading } = useFunnels()
  const { data, isLoading } = useStatsFunnel(
    selectedFunnelId ? { funnelId: selectedFunnelId } : {}
  )

  const tabs = useMemo(() => {
    const list: { id: string; label: string }[] = [{ id: "", label: "Todos" }]
    if (funnels?.length) {
      funnels.forEach((f) => list.push({ id: f.id, label: f.name }))
    }
    return list
  }, [funnels])

  const chartData = useMemo(() => {
    if (!data?.byStage?.length) return []
    return data.byStage.map((s) => ({
      name: s.stageName,
      value: s.count,
    }))
  }, [data])

  const chartConfig = {
    value: { label: "Leads", color: "var(--chart-1)" },
    name: { label: "Estágio" },
  } satisfies ChartConfig

  const isLoadingOrEmpty = funnelsLoading || isLoading

  if (isLoadingOrEmpty && !chartData.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Funil</CardTitle>
          <CardDescription>Contatos por estágio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] animate-pulse rounded-lg bg-muted/30" />
        </CardContent>
      </Card>
    )
  }

  const total = chartData.reduce((s, d) => s + d.value, 0)
  const activeTabId = selectedFunnelId ?? ""

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Funil</CardTitle>
            <CardDescription>Contatos por estágio</CardDescription>
          </div>
          <span className="text-2xl font-bold tabular-nums">{total}</span>
        </div>

        {/* Tab selector — mesmo estilo da tela de settings */}
        <div className="flex items-stretch gap-0 overflow-x-auto scrollbar-none border-b border-border/50 -mx-4 px-4 mt-4 h-11">
          {tabs.map((tab) => {
            const active = activeTabId === tab.id
            return (
              <button
                key={tab.id || "all"}
                onClick={() => setSelectedFunnelId(tab.id || null)}
                className={`relative shrink-0 flex items-center gap-2 px-4 h-full text-[12px] font-bold transition-colors duration-150 cursor-pointer ${
                  active ? "text-white/90" : "text-white/25 hover:text-white/60"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="funnel-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-accent"
                    transition={{ duration: 0.22, ease }}
                  />
                )}
                <span className="relative">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </CardHeader>

      <CardContent>
        {!chartData.length ? (
          <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">
            {selectedFunnelId
              ? "Nenhum contato neste funil"
              : "Configure um funil para ver os dados"}
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <BarChart data={chartData} margin={{ left: 8, right: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(v) => (v?.length > 12 ? v.slice(0, 12) + "…" : v)}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
