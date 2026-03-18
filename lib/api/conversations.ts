import { apiFetch } from "@/lib/api"

// ─── Send message ─────────────────────────────────────────────────────────────

type SendRoute = {
  instanceId?: string
}

export type SendMessageInput =
  | (SendRoute & { type: "TEXT"; text: string; replyToZapiMessageId?: string })
  | (SendRoute & { type: "IMAGE"; mediaUrl: string; caption?: string })
  | (SendRoute & { type: "AUDIO"; mediaUrl: string })
  | (SendRoute & { type: "VIDEO"; mediaUrl: string; caption?: string })
  | (SendRoute & { type: "DOCUMENT"; mediaUrl: string; fileName: string })
  | (SendRoute & { type: "STICKER"; mediaUrl: string })
  | (SendRoute & { type: "LOCATION"; latitude: string; longitude: string; locationTitle?: string; locationAddress?: string })
  | (SendRoute & { type: "CONTACT"; contactName: string; contactPhone: string })
  | (SendRoute & { type: "REACTION"; reaction: string; replyToZapiMessageId: string })

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
