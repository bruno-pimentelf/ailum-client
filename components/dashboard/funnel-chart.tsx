"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
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
      <div className={cn("rounded-xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden", className)}>
        <div className="border-b border-border/50 px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">Funil de vendas</p>
          <h3 className="mt-1 text-[15px] font-semibold tracking-tight text-foreground">Contatos por estágio</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Configure um funil para ver os dados</p>
        </div>
        <div className="p-5">
          <div className="h-[240px] animate-pulse rounded-lg bg-muted/20" />
        </div>
      </div>
    )
  }

  const total = chartData.reduce((s, d) => s + d.value, 0)
  const activeTabId = selectedFunnelId ?? ""

  return (
    <div className={cn("rounded-xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden", className)}>
      <div className="border-b border-border/50 px-5 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">Funil de vendas</p>
            <h3 className="mt-1 text-[15px] font-semibold tracking-tight text-foreground">Contatos por estágio</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Leads distribuídos por etapa</p>
          </div>
          <span className="text-xl font-bold tabular-nums text-foreground">{total}</span>
        </div>

        {/* Tab selector */}
        <div className="flex items-stretch gap-0 overflow-x-auto scrollbar-none -mx-5 mt-4 px-5 h-10 border-b border-border/50">
          {tabs.map((tab) => {
            const active = activeTabId === tab.id
            return (
              <button
                key={tab.id || "all"}
                onClick={() => setSelectedFunnelId(tab.id || null)}
                className={`cursor-pointer relative shrink-0 flex items-center gap-2 px-5 h-full text-[12px] font-semibold transition-colors duration-150 ${
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
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
      </div>

      <div className="p-5">
        {!chartData.length ? (
          <div className="flex h-[200px] items-center justify-center text-muted-foreground text-[13px]">
            {selectedFunnelId
              ? "Nenhum contato neste funil"
              : "Configure um funil para ver os dados"}
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[240px] w-full">
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
      </div>
    </div>
  )
}
