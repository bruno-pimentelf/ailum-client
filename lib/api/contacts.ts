import { API_BASE, ApiError, apiFetch } from "@/lib/api"

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

export type ContactImportDelimiter = ";" | ","

export type ContactImportMode = "create_only" | "skip_existing" | "upsert"

export interface ContactImportIssue {
  rowNumber: number
  reason: string
}

export interface ContactImportSampleRow {
  rowNumber: number
  phone: string
  name: string | null
  email: string | null
  notes: string | null
  status: string | null
}

export interface ContactImportPreviewInput {
  fileName: string
  contentBase64: string
  delimiter?: ContactImportDelimiter
}

export interface ContactImportPreviewResponse {
  previewId: string
  expiresInSec: number
  totalRows: number
  validRows: number
  invalidRows: number
  wouldCreate: number
  wouldMatchExisting: number
  issues: ContactImportIssue[]
  sample: ContactImportSampleRow[]
}

export interface ContactImportCommitInput {
  previewId: string
  mode?: ContactImportMode
}

export interface ContactImportCommitResponse {
  previewId: string
  mode: ContactImportMode
  totalProcessed: number
  created: number
  updated: number
  skippedExisting: number
  failed: number
  changedContactIds: string[]
  errors: Array<{ rowNumber?: number; reason: string }>
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

  importPreview: (body: ContactImportPreviewInput) =>
    apiFetch<ContactImportPreviewResponse>("/contacts/imports/preview", { method: "POST", body }),

  importCommit: (body: ContactImportCommitInput) =>
    apiFetch<ContactImportCommitResponse>("/contacts/imports/commit", { method: "POST", body }),

  toggleAi: (contactId: string, enabled: boolean) =>
    apiFetch<{ id: string; isAiEnabled: boolean }>(`/contacts/${contactId}/ai`, {
      method: "PATCH",
      body: { enabled },
    }),

  delete: (contactId: string) =>
    apiFetch<{ ok: boolean }>(`/contacts/${contactId}`, { method: "DELETE" }),

  downloadImportTemplate: async () => {
    const res = await fetch(`${API_BASE}/contacts/import-template.csv`, {
      credentials: "include",
    })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      const message =
        (data as { message?: string } | null)?.message ??
        `API error ${res.status}`
      throw new ApiError(res.status, message, data)
    }
    const blob = await res.blob()
    const filenameHeader = res.headers.get("content-disposition") ?? ""
    const filenameMatch = filenameHeader.match(/filename="?([^"]+)"?/)
    return {
      blob,
      filename: filenameMatch?.[1] ?? "contacts-import-template.csv",
    }
  },
}
