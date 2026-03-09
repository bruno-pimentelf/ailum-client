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
  | "move_stage"
  | "send_message"
  | "notify_operator"
  | "generate_pix"

export interface StageAgentConfig {
  id: string
  stageId: string
  funnelAgentName: string
  funnelAgentPersonality: string | null
  stageContext: string | null
  allowedTools: AllowedTool[]
  model: "HAIKU" | "SONNET"
  temperature: number
}

export interface StageAgentConfigInput {
  funnelAgentName?: string
  funnelAgentPersonality?: string
  stageContext?: string
  allowedTools?: AllowedTool[]
  model?: "HAIKU" | "SONNET"
  temperature?: number
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

  // ── Contacts ─────────────────────────────────────────────────────────────

  moveContact: (contactId: string, stageId: string) =>
    apiFetch<void>(`/contacts/${contactId}/stage`, {
      method: "PATCH",
      body: { stageId },
    }),
}
