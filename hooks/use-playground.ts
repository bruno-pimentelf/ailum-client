"use client"

import { useQuery } from "@tanstack/react-query"
import { getPlaygroundContact, getAgentAudit } from "@/lib/api/agent"
import { useMessages, useTypingStatus } from "@/hooks/use-chats"
import { useAuthStore } from "@/lib/auth-store"

/**
 * Fetches or creates the playground test contact.
 * Uses the same contact for all sessions — phone: "__playground__".
 */
export function usePlaygroundContact() {
  const tenantId = useAuthStore((s) => s.tenantId)

  return useQuery({
    queryKey: ["playground-contact"],
    queryFn: getPlaygroundContact,
    staleTime: 5 * 60_000,
    enabled: !!tenantId,
  })
}

/**
 * Real-time messages for the playground contact.
 * Reuses the same Firestore subscription as regular chats.
 */
export function usePlaygroundMessages(contactId: string | null) {
  const tenantId = useAuthStore((s) => s.tenantId)
  return useMessages(tenantId, contactId)
}

/**
 * Typing indicators for the playground contact.
 */
export function usePlaygroundTyping(contactId: string | null) {
  const tenantId = useAuthStore((s) => s.tenantId)
  return useTypingStatus(tenantId, contactId)
}

/**
 * Agent audit entries for a contact.
 */
export function useAgentAudit(contactId: string | null, limit = 20) {
  return useQuery({
    queryKey: ["agent-audit", contactId, limit],
    queryFn: () => getAgentAudit(contactId!, limit),
    enabled: !!contactId,
    staleTime: 15_000,
  })
}
