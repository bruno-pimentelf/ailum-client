import { apiFetch } from "@/lib/api"

// ─── Send message ─────────────────────────────────────────────────────────────

export type SendMessageInput =
  | { type: "TEXT"; text: string }
  | { type: "IMAGE"; mediaUrl: string; caption?: string }
  | { type: "AUDIO"; mediaUrl: string }
  | { type: "VIDEO"; mediaUrl: string; caption?: string }
  | { type: "DOCUMENT"; mediaUrl: string; fileName: string }
  | { type: "STICKER"; mediaUrl: string }
  | { type: "LOCATION"; latitude: string; longitude: string; locationTitle?: string; locationAddress?: string }
  | { type: "CONTACT"; contactName: string; contactPhone: string }
  | { type: "REACTION"; reaction: string; replyToZapiMessageId: string }

export function sendMessage(contactId: string, input: SendMessageInput) {
  return apiFetch<void>(`/conversations/${contactId}/messages`, {
    method: "POST",
    body: input,
  })
}

// ─── Mark as read ─────────────────────────────────────────────────────────────

export function markAsRead(contactId: string) {
  return apiFetch<void>(`/conversations/${contactId}/read`, {
    method: "PATCH",
  })
}
