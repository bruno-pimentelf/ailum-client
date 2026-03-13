"use client"

import { useMemo, useState } from "react"
import { OverviewCards } from "@/components/dashboard/overview-cards"
import { FunnelChart } from "@/components/dashboard/funnel-chart"
import { AgendaChart } from "@/components/dashboard/agenda-chart"
import { RevenueCard } from "@/components/dashboard/revenue-card"
import { AgentMetrics } from "@/components/dashboard/agent-metrics"
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
} from "@/hooks/use-stats"

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

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Visão geral do seu negócio
          </p>
        </div>
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      <OverviewCards data={overview.data} isLoading={overview.isLoading} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AgendaChart data={agenda.data} isLoading={agenda.isLoading} />
        </div>
        <RevenueCard data={revenue.data} isLoading={revenue.isLoading} />
      </div>

      <FunnelChart />

      <AgentMetrics data={agent.data} isLoading={agent.isLoading} />
    </div>
  )
}
