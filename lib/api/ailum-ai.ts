import { apiFetch } from "@/lib/api"

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface AilumAiAvailabilityToolCall {
  name: string
  input: Record<string, unknown>
  success: boolean
  message: string
}

export interface AilumAiAvailabilityResponse {
  reply: string
  toolCalls: AilumAiAvailabilityToolCall[]
}

export interface AilumAiAvailabilityInput {
  message: string
  professionalId?: string
}

// ─── API ───────────────────────────────────────────────────────────────────────

export const ailumAiApi = {
  availability: (body: AilumAiAvailabilityInput) =>
    apiFetch<AilumAiAvailabilityResponse>("/ailum-ai/availability", {
      method: "POST",
      body,
    }),
}
