import { apiFetch } from "@/lib/api"

// ─── Types ─────────────────────────────────────

export interface DocumentTemplate {
  id: string
  name: string
  description?: string | null
  category?: string | null
  body: string
  variables: string[]
  requiresSignature: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface SignedDocument {
  id: string
  templateId?: string | null
  contactId: string
  appointmentId?: string | null
  professionalId?: string | null
  title: string
  renderedBody: string
  status: "DRAFT" | "PENDING_SIGNATURE" | "SIGNED" | "CANCELLED_DOC"
  signatureDataUrl?: string | null
  signedAt?: string | null
  signerName?: string | null
  contentHash?: string | null
  pdfUrl?: string | null
  publicToken?: string | null
  createdAt: string
  contact?: { id: string; name: string | null; phone: string }
  professional?: { id: string; fullName: string } | null
  template?: { id: string; name: string } | null
  auditTrail?: DocumentAuditEntry[]
}

export interface DocumentAuditEntry {
  id: string
  action: string
  actorType: string
  actorId?: string | null
  ip?: string | null
  createdAt: string
}

export interface SignedDocumentList {
  data: SignedDocument[]
  total: number
  page: number
  limit: number
  pages: number
}

// ─── API ──────────────────────────────────────

export const documentsApi = {
  // Templates
  listTemplates: () => apiFetch<DocumentTemplate[]>("/documents/templates"),
  getTemplate: (id: string) => apiFetch<DocumentTemplate>(`/documents/templates/${id}`),
  createTemplate: (body: { name: string; description?: string; category?: string; body: string; variables?: string[]; requiresSignature?: boolean }) =>
    apiFetch<DocumentTemplate>("/documents/templates", { method: "POST", body }),
  updateTemplate: (id: string, body: Partial<{ name: string; description: string; category: string; body: string; variables: string[]; requiresSignature: boolean; isActive: boolean }>) =>
    apiFetch<DocumentTemplate>(`/documents/templates/${id}`, { method: "PATCH", body }),
  deleteTemplate: (id: string) => apiFetch<void>(`/documents/templates/${id}`, { method: "DELETE" }),

  // Signed Documents
  list: (params?: { contactId?: string; status?: string; templateId?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams()
    if (params) Object.entries(params).forEach(([k, v]) => { if (v != null) qs.set(k, String(v)) })
    const s = qs.toString()
    return apiFetch<SignedDocumentList>(`/documents${s ? `?${s}` : ""}`)
  },
  get: (id: string) => apiFetch<SignedDocument>(`/documents/${id}`),
  create: (body: { templateId?: string; contactId: string; appointmentId?: string; professionalId?: string; title: string; variables?: Record<string, string>; customBody?: string }) =>
    apiFetch<SignedDocument>("/documents", { method: "POST", body }),
  sendForSignature: (id: string) => apiFetch<{ token: string }>(`/documents/${id}/send-for-signature`, { method: "POST" }),
  cancel: (id: string) => apiFetch<SignedDocument>(`/documents/${id}/cancel`, { method: "POST" }),

  // Public
  getPublicDocument: (token: string) => apiFetch<{ title: string; renderedBody: string }>(`/public/documents/${token}`),
  signPublicDocument: (token: string, body: { signatureDataUrl: string; signerName: string }) =>
    apiFetch<SignedDocument>(`/public/documents/${token}/sign`, { method: "POST", body }),
}
