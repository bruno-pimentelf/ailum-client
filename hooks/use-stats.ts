import { useQuery } from "@tanstack/react-query"
import {
  statsApi,
  type StatsOverviewParams,
  type StatsFunnelParams,
  type StatsAgendaParams,
  type StatsRevenueParams,
  type StatsAgentParams,
} from "@/lib/api/stats"

export function useStatsOverview(params?: StatsOverviewParams) {
  return useQuery({
    queryKey: ["stats", "overview", params],
    queryFn: () => statsApi.overview(params),
  })
}

export function useStatsFunnel(params?: StatsFunnelParams) {
  return useQuery({
    queryKey: ["stats", "funnel", params],
    queryFn: () => statsApi.funnel(params),
  })
}

export function useStatsAgenda(params?: StatsAgendaParams) {
  return useQuery({
    queryKey: ["stats", "agenda", params],
    queryFn: () => statsApi.agenda(params),
  })
}

export function useStatsRevenue(params?: StatsRevenueParams) {
  return useQuery({
    queryKey: ["stats", "revenue", params],
    queryFn: () => statsApi.revenue(params),
  })
}

export function useStatsAgent(params?: StatsAgentParams) {
  return useQuery({
    queryKey: ["stats", "agent", params],
    queryFn: () => statsApi.agent(params),
  })
}
