import { apiFetch } from "@/lib/api"

export interface Voice {
  id: string
  name: string
  provider: "ELEVENLABS" | "AZURE" | "OPENAI"
  providerVoiceId: string
  sampleUrl: string | null
  isDefault: boolean
  createdAt: string
}

export interface CreateVoiceInput {
  name: string
  provider: "ELEVENLABS" | "AZURE" | "OPENAI"
  providerVoiceId: string
  sampleUrl?: string
}

export interface UpdateVoiceInput {
  name?: string
  providerVoiceId?: string
  sampleUrl?: string
}

export const voicesApi = {
  list: () => apiFetch<Voice[]>("/voices"),

  get: (id: string) => apiFetch<Voice>(`/voices/${id}`),

  create: (body: CreateVoiceInput) =>
    apiFetch<Voice>("/voices", { method: "POST", body }),

  update: (id: string, body: UpdateVoiceInput) =>
    apiFetch<Voice>(`/voices/${id}`, { method: "PATCH", body }),

  delete: (id: string) =>
    apiFetch<void>(`/voices/${id}`, { method: "DELETE" }),

  setDefault: (id: string) =>
    apiFetch<Voice>(`/voices/${id}/default`, { method: "PATCH" }),

  /** Clone a voice from an audio recording */
  clone: async (name: string, audioBlob: Blob): Promise<Voice> => {
    const { API_BASE, ApiError } = await import("@/lib/api")
    const formData = new FormData()
    formData.append("name", name)
    formData.append("file", audioBlob, "recording.webm")

    const res = await fetch(`${API_BASE}/voices/clone`, {
      method: "POST",
      credentials: "include",
      body: formData,
      // No Content-Type header — browser sets multipart boundary automatically
    })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      throw new ApiError(res.status, (data as { message?: string } | null)?.message ?? `Erro ${res.status}`, data)
    }
    return res.json() as Promise<Voice>
  },

  /** Get audio preview of a voice */
  previewUrl: (id: string) =>
    `${process.env.NEXT_PUBLIC_API_URL ?? ""}/v1/voices/${id}/preview`,
}
