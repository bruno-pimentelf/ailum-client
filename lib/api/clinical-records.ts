import { apiFetch, API_BASE, ApiError } from "@/lib/api"

// ─── Types ─────────────────────────────────────

export interface ClinicalRecord {
  id: string
  contactId: string
  appointmentId?: string | null
  professionalId: string
  type: "EVOLUTION" | "PRESCRIPTION" | "EXAM_RESULT" | "TREATMENT_PLAN" | "MEASUREMENT" | "PHOTO" | "ATTACHMENT"
  title?: string | null
  content?: string | null
  measurements?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
  isPrivate: boolean
  createdAt: string
  updatedAt: string
  contact?: { id: string; name: string | null; phone: string }
  professional?: { id: string; fullName: string; specialty?: string | null }
  attachments?: ClinicalAttachment[]
  _count?: { attachments: number }
}

export interface ClinicalAttachment {
  id: string
  clinicalRecordId: string
  fileName: string
  fileUrl: string
  mimeType: string
  fileSize: number
  category?: string | null
  notes?: string | null
  createdAt: string
}

export interface ClinicalRecordList {
  data: ClinicalRecord[]
  total: number
  page: number
  limit: number
  pages: number
}

export interface TimelineEntry {
  id: string
  type: "clinical_record" | "form_response" | "signed_document" | "appointment"
  date: string
  title: string
  summary?: string
  professionalName?: string
  metadata: Record<string, unknown>
}

export interface TimelineResponse {
  data: TimelineEntry[]
  total: number
  page: number
  limit: number
  pages: number
}

// ─── API ──────────────────────────────────────

export const clinicalRecordsApi = {
  list: (params?: { contactId?: string; appointmentId?: string; type?: string; professionalId?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams()
    if (params) Object.entries(params).forEach(([k, v]) => { if (v != null) qs.set(k, String(v)) })
    const s = qs.toString()
    return apiFetch<ClinicalRecordList>(`/clinical-records${s ? `?${s}` : ""}`)
  },

  get: (id: string) => apiFetch<ClinicalRecord>(`/clinical-records/${id}`),

  create: (body: {
    contactId: string; appointmentId?: string; professionalId: string;
    type?: ClinicalRecord["type"]; title?: string; content?: string;
    measurements?: Record<string, unknown>; metadata?: Record<string, unknown>; isPrivate?: boolean;
  }) => apiFetch<ClinicalRecord>("/clinical-records", { method: "POST", body }),

  update: (id: string, body: Partial<{
    title: string; content: string; measurements: Record<string, unknown>;
    metadata: Record<string, unknown>; isPrivate: boolean;
  }>) => apiFetch<ClinicalRecord>(`/clinical-records/${id}`, { method: "PATCH", body }),

  delete: (id: string) => apiFetch<void>(`/clinical-records/${id}`, { method: "DELETE" }),

  timeline: (contactId: string, params?: { page?: number; limit?: number }) => {
    const qs = new URLSearchParams()
    if (params?.page) qs.set("page", String(params.page))
    if (params?.limit) qs.set("limit", String(params.limit))
    const s = qs.toString()
    return apiFetch<TimelineResponse>(`/clinical-records/timeline/${contactId}${s ? `?${s}` : ""}`)
  },

  // File upload — uses native fetch because apiFetch always JSON-stringifies the body
  uploadAttachment: async (recordId: string, file: File, options?: { category?: string; notes?: string }): Promise<ClinicalAttachment> => {
    const formData = new FormData()
    formData.append("file", file)
    if (options?.category) formData.append("category", options.category)
    if (options?.notes) formData.append("notes", options.notes)

    const res = await fetch(`${API_BASE}/clinical-records/${recordId}/attachments`, {
      method: "POST",
      credentials: "include",
      body: formData,
    })

    if (res.status === 204) return undefined as unknown as ClinicalAttachment

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      const message =
        (data as { message?: string } | null)?.message ??
        `API error ${res.status}`
      throw new ApiError(res.status, message, data)
    }

    return data as ClinicalAttachment
  },

  deleteAttachment: (recordId: string, attachmentId: string) =>
    apiFetch<void>(`/clinical-records/${recordId}/attachments/${attachmentId}`, { method: "DELETE" }),
}
