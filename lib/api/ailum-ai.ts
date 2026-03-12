import { apiFetch } from "@/lib/api"

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface AilumAiAvailabilityToolCall {
  name: string
  input: Record<string, unknown>
  success: boolean
  message: string
}

export type ConfirmationActionType = "cancel" | "reschedule"

export interface AilumAiAvailabilityResponse {
  reply: string
  toolCalls: AilumAiAvailabilityToolCall[]
  /** Indica que precisa de confirmação do usuário (cancelar/remarcar) */
  requiresConfirmation?: boolean
  confirmationToken?: string
  confirmationSummary?: string
  confirmationActionType?: ConfirmationActionType
}

export interface AilumAiAvailabilityInput {
  message: string
  professionalId?: string
  messages?: Array<{ role: "user" | "assistant"; content: string }>
}

export interface AilumAiConfirmResponse {
  success: boolean
  message: string
}

export interface AilumAiConfirmInput {
  confirmationToken: string
  professionalId?: string
}

// ─── API ───────────────────────────────────────────────────────────────────────

export const ailumAiApi = {
  availability: (body: AilumAiAvailabilityInput) =>
    apiFetch<AilumAiAvailabilityResponse>("/ailum-ai/availability", {
      method: "POST",
      body,
    }),

  confirm: (body: AilumAiConfirmInput) =>
    apiFetch<AilumAiConfirmResponse>("/ailum-ai/confirm", {
      method: "POST",
      body,
    }),
}
