import { apiFetch } from "@/lib/api"

export type TemplateType = "TEXT" | "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT"

export interface TemplateStep {
  order: number
  type: TemplateType
  body: string
  mediaUrl?: string | null
  caption?: string | null
  fileName?: string | null
  /** Delay in seconds before sending this step (0 = immediate) */
  delaySeconds?: number
}

export interface MessageTemplate {
  id: string
  tenantId: string
  key: string
  name: string
  description: string | null
  type: TemplateType
  body: string
  mediaUrl: string | null
  caption: string | null
  fileName: string | null
  variables: string[]
  /** Multi-step sequence. When present, overrides type/body/mediaUrl/caption/fileName. */
  steps: TemplateStep[] | null
  createdAt: string
  updatedAt: string
}

export interface TemplateInput {
  key: string
  name: string
  description?: string | null
  type: TemplateType
  body: string
  mediaUrl?: string | null
  caption?: string | null
  fileName?: string | null
  variables?: string[]
  steps?: TemplateStep[]
}

export const templatesApi = {
  list: () => apiFetch<MessageTemplate[]>("/templates"),

  get: (id: string) => apiFetch<MessageTemplate>(`/templates/${id}`),

  create: (body: TemplateInput) =>
    apiFetch<MessageTemplate>("/templates", { method: "POST", body }),

  update: (id: string, body: Partial<Omit<TemplateInput, "key">>) =>
    apiFetch<MessageTemplate>(`/templates/${id}`, { method: "PATCH", body }),

  delete: (id: string) =>
    apiFetch<void>(`/templates/${id}`, { method: "DELETE" }),
}
