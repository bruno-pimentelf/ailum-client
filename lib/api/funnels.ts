import { apiFetch } from "@/lib/api"

// ─── Types ────────────────────────────────────────────────────────────────────

export type ContactStatus =
  | "NEW_LEAD"
  | "ACTIVE"
  | "QUALIFIED"
  | "CONVERTED"
  | "INACTIVE"
  | "BLOCKED"
  | string

export interface BoardContact {
  id: string
  phone: string
  name: string | null
  photoUrl: string | null
  status: ContactStatus
  stageEnteredAt: string | null
  lastMessageAt: string | null
  lastPaymentStatus: string | null
  lastDetectedIntent: string | null
  currentStageId: string | null
  assignedProfessional: { id: string; fullName: string } | null
  messages: Array<{
    content: string
    type: string
    createdAt: string
    role: "CONTACT" | "OPERATOR" | "AGENT"
  }>
}

export interface BoardStage {
  id: string
  name: string
  color: string
  order: number
  isTerminal: boolean
  contacts: BoardContact[]
  _count: { contacts: number }
}

export interface BoardResponse {
  funnel: {
    id: string
    name: string
    description: string | null
  }
  stages: BoardStage[]
}

export interface FunnelListItem {
  id: string
  name: string
  description: string | null
  isDefault?: boolean
  entryKeywords?: string[]
  agentName?: string
  agentPersonality?: string | null
  zapiInstanceId?: string | null
  stages: Array<{
    id: string
    name: string
    color: string
    order: number
    isTerminal: boolean
  }>
}

export interface FunnelInput {
  name: string
  description?: string | null
  order?: number
  isDefault?: boolean
  entryKeywords?: string[]
  agentName?: string
  agentPersonality?: string | null
  zapiInstanceId?: string | null
}

export interface StageInput {
  name: string
  color: string
  order: number
  isTerminal?: boolean
}

export type AllowedTool =
  | "search_availability"
  | "create_appointment"
  | "cancel_appointment"
  | "reschedule_appointment"
  | "move_stage"
  | "send_message"
  | "notify_operator"
  | "generate_pix"
  | "collect_info"

export interface StageAgentConfig {
  id: string
  stageId: string
  stageContext: string | null
  allowedTools: AllowedTool[]
  requiredFields?: string[]
  allowedProfessionalIds?: string[]
  requirePaymentBeforeConfirm?: boolean
  model: "HAIKU" | "SONNET"
  temperature: number
  voiceId?: string | null
}

export interface StageAgentConfigInput {
  stageContext?: string
  allowedTools?: AllowedTool[]
  requiredFields?: string[]
  allowedProfessionalIds?: string[]
  requirePaymentBeforeConfirm?: boolean
  model?: "HAIKU" | "SONNET"
  temperature?: number
  voiceId?: string | null
}

// ─── Triggers ──────────────────────────────────────────────────────────────────

export type TriggerEvent =
  | "STAGE_ENTERED"
  | "STALE_IN_STAGE"
  | "PAYMENT_CONFIRMED"
  | "APPOINTMENT_APPROACHING"
  | "AI_INTENT"
  | "MESSAGE_RECEIVED"

export type TriggerAction =
  | "SEND_MESSAGE"
  | "MOVE_STAGE"
  | "GENERATE_PIX"
  | "NOTIFY_OPERATOR"
  | "WAIT_AND_REPEAT"

export interface SendMessageActionConfig {
  useAI?: boolean
  message?: string
  templateId?: string
}

export interface MoveStageActionConfig {
  stageId?: string
}

export interface GeneratePixActionConfig {
  amount?: number
  description?: string
  dueHours?: number
}

export type ActionConfig =
  | SendMessageActionConfig
  | MoveStageActionConfig
  | GeneratePixActionConfig
  | Record<string, unknown>

export interface ConditionConfig {
  path?: string[]
  equals?: string
}

export interface Trigger {
  id: string
  stageId: string
  tenantId: string
  event: TriggerEvent
  action: TriggerAction
  actionConfig: ActionConfig
  conditionConfig: ConditionConfig | null
  delayMinutes: number
  cooldownSeconds: number
  isActive: boolean
  createdAt: string
}

export interface TriggerInput {
  event: TriggerEvent
  action: TriggerAction
  actionConfig: ActionConfig
  conditionConfig?: ConditionConfig | null
  delayMinutes?: number
  cooldownSeconds?: number
  maxRepetitions?: number
}

// ─── API functions ────────────────────────────────────────────────────────────

export const funnelsApi = {
  // ── Funnels ──────────────────────────────────────────────────────────────

  list: () => apiFetch<FunnelListItem[]>("/funnels"),

  create: (body: FunnelInput) =>
    apiFetch<FunnelListItem>("/funnels", { method: "POST", body }),

  /** Cria o Funil Principal com stages padrão, IA e triggers. Sem body. */
  createDefault: () =>
    apiFetch<FunnelListItem>("/funnels/default", { method: "POST" }),

  update: (funnelId: string, body: Partial<FunnelInput>) =>
    apiFetch<FunnelListItem>(`/funnels/${funnelId}`, { method: "PATCH", body }),

  delete: (funnelId: string) =>
    apiFetch<void>(`/funnels/${funnelId}`, { method: "DELETE" }),

  // ── Board ────────────────────────────────────────────────────────────────

  board: (funnelId: string, params?: { search?: string; assignedProfessionalId?: string }) => {
    const qs = new URLSearchParams()
    if (params?.search) qs.set("search", params.search)
    if (params?.assignedProfessionalId) qs.set("assignedProfessionalId", params.assignedProfessionalId)
    const query = qs.toString()
    return apiFetch<BoardResponse>(`/funnels/${funnelId}/board${query ? `?${query}` : ""}`)
  },

  // ── Developer export/import ──────────────────────────────────────────────

  exportFunnel: (funnelId: string) =>
    apiFetch<Record<string, unknown>>(`/funnels/${funnelId}/export`),

  importFunnel: (funnelId: string, body: Record<string, unknown>) =>
    apiFetch<Record<string, unknown>>(`/funnels/${funnelId}/import`, { method: "PUT", body }),

  // ── Stages ───────────────────────────────────────────────────────────────

  listStages: (funnelId: string) =>
    apiFetch<BoardStage[]>(`/funnels/${funnelId}/stages`),

  createStage: (funnelId: string, body: StageInput) =>
    apiFetch<BoardStage>(`/funnels/${funnelId}/stages`, { method: "POST", body }),

  updateStage: (stageId: string, body: Partial<StageInput>) =>
    apiFetch<BoardStage>(`/funnels/stages/${stageId}`, { method: "PATCH", body }),

  deleteStage: (stageId: string) =>
    apiFetch<void>(`/funnels/stages/${stageId}`, { method: "DELETE" }),

  // ── Stage Agent Config ────────────────────────────────────────────────────

  getAgentConfig: (stageId: string) =>
    apiFetch<StageAgentConfig>(`/funnels/stages/${stageId}/agent-config`),

  upsertAgentConfig: (stageId: string, body: StageAgentConfigInput) =>
    apiFetch<StageAgentConfig>(`/funnels/stages/${stageId}/agent-config`, {
      method: "PUT",
      body,
    }),

  // ── Triggers ─────────────────────────────────────────────────────────────

  listTriggers: (stageId: string) =>
    apiFetch<Trigger[]>(`/funnels/stages/${stageId}/triggers`),

  createTrigger: (stageId: string, body: TriggerInput) =>
    apiFetch<Trigger>(`/funnels/stages/${stageId}/triggers`, { method: "POST", body }),

  updateTrigger: (triggerId: string, body: Partial<TriggerInput>) =>
    apiFetch<Trigger>(`/funnels/triggers/${triggerId}`, { method: "PATCH", body }),

  deleteTrigger: (triggerId: string) =>
    apiFetch<void>(`/funnels/triggers/${triggerId}`, { method: "DELETE" }),

  toggleTrigger: (triggerId: string) =>
    apiFetch<Trigger>(`/funnels/triggers/${triggerId}/toggle`, { method: "PATCH" }),

  // ── Contacts ─────────────────────────────────────────────────────────────

  moveContact: (contactId: string, stageId: string, funnelId?: string) =>
    apiFetch<void>(`/contacts/${contactId}/stage`, {
      method: "PATCH",
      body: funnelId ? { stageId, funnelId } : { stageId },
    }),
}
