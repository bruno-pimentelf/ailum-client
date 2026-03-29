"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { OverviewCards } from "@/components/dashboard/overview-cards"
import { FunnelChart } from "@/components/dashboard/funnel-chart"
import { AgendaChart } from "@/components/dashboard/agenda-chart"
import { RevenueCard } from "@/components/dashboard/revenue-card"
import { AgentMetrics } from "@/components/dashboard/agent-metrics"
import { BehaviorAnalytics } from "@/components/dashboard/behavior-analytics"
import {
  DateRangePicker,
  getPresetRange,
  type DateRange,
} from "@/components/dashboard/date-range-picker"
import {
  useStatsOverview,
  useStatsAgenda,
  useStatsRevenue,
  useStatsAgent,
  useStatsBehavior,
} from "@/hooks/use-stats"
import { FadeIn } from "@/components/landing/motion"

export default function DashboardPage() {
  const [range, setRange] = useState<DateRange>(() => getPresetRange("30d"))

  const params = useMemo(
    () => ({ from: range.from, to: range.to }),
    [range.from, range.to]
  )

  const overview = useStatsOverview(params)
  const agenda = useStatsAgenda(params)
  const revenue = useStatsRevenue(params)
  const agent = useStatsAgent(params)
  const behavior = useStatsBehavior(params)

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Page header — alinhado ao financeiro/landing */}
      <header className="shrink-0 border-b border-border/50 bg-background/50 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-3 md:py-4">
          <FadeIn className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-bold tracking-tight text-foreground md:text-xl">
                  Dashboard
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/5 px-2.5 py-0.5">
                  <span className="relative flex h-1 w-1">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                    <span className="relative inline-flex h-1 w-1 rounded-full bg-accent" />
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">
                    Visão geral
                  </span>
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Métricas e desempenho do seu negócio
              </p>
            </div>
            <DateRangePicker value={range} onChange={setRange} />
          </FadeIn>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl space-y-5 p-4 md:p-5 lg:p-6">
          <OverviewCards data={overview.data} isLoading={overview.isLoading} />

          {/* Agenda + Receita — F-pattern: métricas principais em evidência */}
          <div className="grid gap-5 lg:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
              className="lg:col-span-2"
            >
              <AgendaChart data={agenda.data} isLoading={agenda.isLoading} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
            >
              <RevenueCard data={revenue.data} isLoading={revenue.isLoading} />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
          >
            <FunnelChart />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
          >
            <AgentMetrics data={agent.data} isLoading={agent.isLoading} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.25 }}
          >
            <BehaviorAnalytics data={behavior.data} />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
