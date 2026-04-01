import { apiFetch } from "@/lib/api"

export interface TenantListItem {
  id: string
  name: string
  slug: string | null
  isActive: boolean
  createdAt: string
  _count: { contacts: number; tenantMembers: number; funnels: number }
}

export interface TenantDetail extends TenantListItem {
  agentBasePrompt: string | null
  notificationsEnabled: boolean
}

export interface GlobalStats {
  totalTenants: number
  totalContacts: number
  totalMessages: number
  totalAgentJobs: number
}

export interface FunnelDuplicateInput {
  sourceTenantId: string
  sourceFunnelId: string
  targetTenantId: string
  newName?: string
}

export interface FunnelTransferInput {
  sourceTenantId: string
  funnelId: string
  targetTenantId: string
}

export interface TenantFunnel {
  id: string
  name: string
  description: string | null
  isActive: boolean
  stages: Array<{ id: string; name: string }>
}

export interface PlanItem {
  id: string
  name: string
  slug: string
  description: string | null
  maxConversationsPerMonth: number // -1 = unlimited
  maxAudioMinutesPerMonth: number // -1 = unlimited
  price: string // decimal as string
  isActive: boolean
  displayOrder: number
}

export interface TenantSubscriptionDetail {
  id: string
  tenantId: string
  planId: string
  plan: PlanItem
  periodStart: string
  periodEnd: string
  conversationsUsed: number
  audioMinutesUsed: number
  lastResetAt: string
}

export interface PlanCreateInput {
  name: string
  slug: string
  description?: string
  maxConversationsPerMonth: number
  maxAudioMinutesPerMonth: number
  price: number
  displayOrder?: number
}

export interface DryRunAction {
  type: string // WHATSAPP_SEND, APPOINTMENT_CREATE, PIX_CHARGE, STAGE_MOVE, TRIGGER_DISPATCH, etc.
  description: string
  data?: Record<string, unknown>
}

export interface SAPlaygroundResult {
  status: string
  reply: string | null
  confirmationSummary?: string
  intent?: string
  confidence?: number
  interceptedActions: DryRunAction[]
  inputTokens?: number
  outputTokens?: number
  llmProvider?: string
  llmModel?: string
  estimatedCostUsd?: number
  durationMs?: number
  contactSentiment?: string
  auditDetails?: Array<{ label: string; detail: string; data?: Record<string, unknown> }>
}

export interface TenantInstance {
  id: string
  instanceId: string
  label: string | null
  connectedPhone: string | null
  isAiEnabled: boolean
  isDefault: boolean
  isActive: boolean
}

export const superAdminApi = {
  listTenants: (params?: { search?: string; page?: number }) => {
    const qs = new URLSearchParams()
    if (params?.search) qs.set("search", params.search)
    if (params?.page) qs.set("page", String(params.page))
    const q = qs.toString()
    return apiFetch<{
      tenants: TenantListItem[]
      total: number
      page: number
      pageSize: number
      totalPages: number
    }>(`/super-admin/tenants${q ? `?${q}` : ""}`)
  },

  getTenant: (tenantId: string) =>
    apiFetch<TenantDetail>(`/super-admin/tenants/${tenantId}`),

  updateTenant: (tenantId: string, body: Partial<TenantDetail>) =>
    apiFetch<TenantDetail>(`/super-admin/tenants/${tenantId}`, {
      method: "PATCH",
      body,
    }),

  getOverviewStats: () =>
    apiFetch<GlobalStats>("/super-admin/stats/overview"),

  getTenantFunnels: (tenantId: string) =>
    apiFetch<TenantFunnel[]>(`/super-admin/tenants/${tenantId}/funnels`),

  duplicateFunnel: (body: FunnelDuplicateInput) =>
    apiFetch<{ funnelId: string }>("/super-admin/funnels/duplicate", {
      method: "POST",
      body,
    }),

  transferFunnel: (body: FunnelTransferInput) =>
    apiFetch<{ ok: boolean }>("/super-admin/funnels/transfer", {
      method: "POST",
      body,
    }),

  listPlans: () => apiFetch<PlanItem[]>("/super-admin/plans"),

  createPlan: (body: PlanCreateInput) =>
    apiFetch<PlanItem>("/super-admin/plans", { method: "POST", body }),

  updatePlan: (planId: string, body: Partial<PlanCreateInput>) =>
    apiFetch<PlanItem>(`/super-admin/plans/${planId}`, {
      method: "PATCH",
      body,
    }),

  deletePlan: (planId: string) =>
    apiFetch<void>(`/super-admin/plans/${planId}`, { method: "DELETE" }),

  getTenantSubscription: (tenantId: string) =>
    apiFetch<TenantSubscriptionDetail | null>(
      `/super-admin/tenants/${tenantId}/subscription`
    ),

  assignPlan: (tenantId: string, planId: string) =>
    apiFetch<TenantSubscriptionDetail>(
      `/super-admin/tenants/${tenantId}/subscription`,
      { method: "POST", body: { planId } }
    ),

  resetUsage: (tenantId: string) =>
    apiFetch<TenantSubscriptionDetail>(
      `/super-admin/tenants/${tenantId}/subscription/reset`,
      { method: "POST" }
    ),

  listTenantInstances: (tenantId: string) =>
    apiFetch<TenantInstance[]>(`/super-admin/tenants/${tenantId}/instances`),

  initPlayground: (body: { tenantId: string; funnelId: string; stageId?: string }) =>
    apiFetch<{ contactId: string; contact: Record<string, unknown> }>("/super-admin/playground/init", { method: "POST", body }),

  sendPlaygroundMessage: (body: { tenantId: string; contactId: string; message: string }) =>
    apiFetch<SAPlaygroundResult>("/super-admin/playground/message", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(120_000),
    }),

  resetPlayground: (tenantId: string) =>
    apiFetch<void>("/super-admin/playground/reset", { method: "POST", body: { tenantId } }),

  getPlaygroundAudit: (tenantId: string, limit?: number) =>
    apiFetch<Array<Record<string, unknown>>>(`/super-admin/playground/audit?tenantId=${tenantId}&limit=${limit ?? 20}`),
}
