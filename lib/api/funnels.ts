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

// ─── API functions ────────────────────────────────────────────────────────────

export const funnelsApi = {
  // ── Funnels ──────────────────────────────────────────────────────────────

  list: () => apiFetch<FunnelListItem[]>("/funnels"),

  create: (body: FunnelInput) =>
    apiFetch<FunnelListItem>("/funnels", { method: "POST", body }),

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

  // ── Contacts ─────────────────────────────────────────────────────────────

  moveContact: (contactId: string, stageId: string) =>
    apiFetch<void>(`/contacts/${contactId}/stage`, {
      method: "PATCH",
      body: { stageId },
    }),
}
