import { apiFetch } from "@/lib/api"

export type ContactStatus =
  | "NEW_LEAD"
  | "ACTIVE"
  | "QUALIFIED"
  | "CONVERTED"
  | "INACTIVE"
  | "BLOCKED"
  | string

export interface ApiContact {
  id: string
  phone: string
  name: string | null
  email: string | null
  photoUrl: string | null
  zapiInstanceId?: string | null
  lastMessageAt: string | null
  status: ContactStatus
  currentFunnel: { id: string; name: string } | null
  currentStage: { id: string; name: string; color: string } | null
  assignedProfessional: { id: string; fullName: string } | null
}

export interface ContactsResponse {
  data: ApiContact[]
  total: number
  page: number
  pages: number
  limit: number
}

export interface ContactsParams {
  search?: string
  funnelId?: string
  stageId?: string
  status?: string
  page?: number
  limit?: number
}

export interface CreateContactInput {
  phone: string
  name?: string
  email?: string
  notes?: string
  funnelId?: string
  stageId?: string
  assignedProfessionalId?: string
}

export interface CreateContactResponse {
  id: string
  tenantId: string
  phone: string
  name: string | null
  email: string | null
  notes: string | null
  currentFunnelId: string | null
  currentStageId: string | null
  status: string
  stageEnteredAt: string | null
  lastMessageAt: string | null
  assignedProfessionalId: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export const contactsApi = {
  list: (params: ContactsParams = {}) => {
    const qs = new URLSearchParams()
    if (params.search)   qs.set("search",   params.search)
    if (params.funnelId) qs.set("funnelId", params.funnelId)
    if (params.stageId)  qs.set("stageId",  params.stageId)
    if (params.status)   qs.set("status",   params.status)
    if (params.page)     qs.set("page",     String(params.page))
    if (params.limit)    qs.set("limit",    String(params.limit))
    const q = qs.toString()
    return apiFetch<ContactsResponse>(`/contacts${q ? `?${q}` : ""}`)
  },

  create: (body: CreateContactInput) =>
    apiFetch<CreateContactResponse>("/contacts", { method: "POST", body }),
}
