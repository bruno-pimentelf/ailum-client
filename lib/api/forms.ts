import { apiFetch } from "@/lib/api"

// ─── Types ─────────────────────────────────────

export interface FormFieldDefinition {
  id: string
  label: string
  type: "TEXT" | "TEXTAREA" | "SELECT" | "MULTI_SELECT" | "CHECKBOX" | "RADIO" | "DATE" | "NUMBER" | "FILE" | "SIGNATURE" | "PHONE" | "EMAIL" | "CPF" | "SCALE"
  required: boolean
  placeholder?: string
  helpText?: string
  options?: string[]
  validation?: { min?: number; max?: number; pattern?: string }
  order: number
  section?: string
}

export interface FormTemplate {
  id: string
  name: string
  description?: string | null
  specialty?: string | null
  serviceId?: string | null
  fields: FormFieldDefinition[]
  isActive: boolean
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface FormResponse {
  id: string
  templateId: string
  contactId: string
  appointmentId?: string | null
  professionalId?: string | null
  answers: Record<string, unknown>
  status: "DRAFT" | "SUBMITTED"
  filledBy: string
  publicToken?: string | null
  submittedAt?: string | null
  createdAt: string
  template?: { id: string; name: string }
  contact?: { id: string; name: string | null; phone: string }
  professional?: { id: string; fullName: string } | null
}

export interface FormResponseList {
  data: FormResponse[]
  total: number
  page: number
  limit: number
  pages: number
}

// ─── API ──────────────────────────────────────

export const formsApi = {
  // Templates
  listTemplates: () => apiFetch<FormTemplate[]>("/forms/templates"),
  getTemplate: (id: string) => apiFetch<FormTemplate>(`/forms/templates/${id}`),
  createTemplate: (body: { name: string; description?: string; specialty?: string; serviceId?: string; fields: FormFieldDefinition[]; isDefault?: boolean }) =>
    apiFetch<FormTemplate>("/forms/templates", { method: "POST", body }),
  updateTemplate: (id: string, body: Partial<{ name: string; description: string; specialty: string; serviceId: string; fields: FormFieldDefinition[]; isActive: boolean; isDefault: boolean }>) =>
    apiFetch<FormTemplate>(`/forms/templates/${id}`, { method: "PATCH", body }),
  deleteTemplate: (id: string) => apiFetch<void>(`/forms/templates/${id}`, { method: "DELETE" }),

  // Responses
  listResponses: (params?: { contactId?: string; templateId?: string; appointmentId?: string; status?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams()
    if (params) Object.entries(params).forEach(([k, v]) => { if (v != null) qs.set(k, String(v)) })
    const s = qs.toString()
    return apiFetch<FormResponseList>(`/forms/responses${s ? `?${s}` : ""}`)
  },
  getResponse: (id: string) => apiFetch<FormResponse>(`/forms/responses/${id}`),
  createResponse: (body: { templateId: string; contactId: string; appointmentId?: string; professionalId?: string; answers: Record<string, unknown>; filledBy: string }) =>
    apiFetch<FormResponse>("/forms/responses", { method: "POST", body }),
  updateResponse: (id: string, body: { answers: Record<string, unknown> }) =>
    apiFetch<FormResponse>(`/forms/responses/${id}`, { method: "PATCH", body }),
  submitResponse: (id: string) => apiFetch<FormResponse>(`/forms/responses/${id}/submit`, { method: "POST" }),
  sendLink: (id: string) => apiFetch<{ token: string }>(`/forms/responses/${id}/send-link`, { method: "POST" }),

  // Public (no auth — uses same cookie-based fetch)
  getPublicForm: (token: string) => apiFetch<{ template: FormTemplate; answers: Record<string, unknown>; contactName?: string }>(`/public/forms/${token}`),
  submitPublicForm: (token: string, answers: Record<string, unknown>) => apiFetch<FormResponse>(`/public/forms/${token}`, { method: "POST", body: { answers } }),
}
