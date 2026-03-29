import { apiFetch } from "@/lib/api"

export interface StatsOverview {
  leadsTotal: number
  appointmentScheduledTotal: number
  appointmentsToday: number
  revenuePaid: number
  chargesOverdueCount: number
  chargesOverdueAmount: number
  escalationsCount: number
  noShowRate: number
}

export interface StatsOverviewParams {
  from?: string
  to?: string
  professionalId?: string
}

export interface FunnelStageItem {
  stageId: string
  stageName: string
  funnelName: string
  count: number
}

export interface StatsFunnel {
  byStage: FunnelStageItem[]
}

export interface StatsFunnelParams {
  funnelId?: string
}

export interface AgendaDayItem {
  date: string
  total: number
  pending: number
  confirmed: number
  completed: number
  cancelled: number
  noShow: number
  slotsCapacity?: number
}

export interface AgendaByProfessional {
  professionalId: string
  byDay: AgendaDayItem[]
}

export interface StatsAgenda {
  byDay: AgendaDayItem[]
  byProfessional?: AgendaByProfessional[]
}

export interface StatsAgendaParams {
  from?: string
  to?: string
  professionalId?: string
  groupByProfessional?: boolean
}

export interface StatsRevenue {
  paid: number
  paidCount: number
  pending: number
  pendingCount: number
  overdue: number
  overdueCount: number
}

export interface StatsRevenueParams {
  from?: string
  to?: string
}

export interface StatsAgent {
  messagesFromAgent: number
  escalations: number
  guardrailViolations: number
  guardrailBlocked: number
  resolutionRate: number
  totalInputTokens: number
  totalOutputTokens: number
}

export interface StatsAgentParams {
  from?: string
  to?: string
}

function buildQuery(params?: Record<string, string | undefined>): string {
  if (!params) return ""
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "") qs.set(k, v)
  })
  const s = qs.toString()
  return s ? `?${s}` : ""
}

export const statsApi = {
  overview: (params?: StatsOverviewParams) =>
    apiFetch<StatsOverview>(`/stats/overview${buildQuery(params as Record<string, string | undefined>)}`),

  funnel: (params?: StatsFunnelParams) =>
    apiFetch<StatsFunnel>(`/stats/funnel${buildQuery(params as Record<string, string | undefined>)}`),

  agenda: (params?: StatsAgendaParams) => {
    const p: Record<string, string | undefined> = {}
    if (params?.from) p.from = params.from
    if (params?.to) p.to = params.to
    if (params?.professionalId) p.professionalId = params.professionalId
    if (params?.groupByProfessional) p.groupByProfessional = "true"
    return apiFetch<StatsAgenda>(`/stats/agenda${buildQuery(p)}`)
  },

  revenue: (params?: StatsRevenueParams) =>
    apiFetch<StatsRevenue>(`/stats/revenue${buildQuery(params as Record<string, string | undefined>)}`),

  agent: (params?: StatsAgentParams) =>
    apiFetch<StatsAgent>(`/stats/agent${buildQuery(params as Record<string, string | undefined>)}`),

  behavior: (params?: { from?: string; to?: string }) =>
    apiFetch<StatsBehavior>(`/stats/behavior${buildQuery(params as Record<string, string | undefined>)}`),
}

export interface StatsBehavior {
  responseTime: {
    avgSeconds: number
    sampleCount: number
  }
  sentiment: {
    positive: number
    neutral: number
    negative: number
    frustrated: number
    total: number
  }
  dropOff: Array<{
    stageId: string
    stageName: string
    funnelName: string
    staleCount: number
  }>
  sessions: {
    total: number
    uniqueContacts: number
    avgPerContact: number
    peakHours: Array<{ hour: number; count: number }>
  }
}
