"use client"

import { useQuery } from "@tanstack/react-query"
import { getAgentMentions } from "@/lib/api/agent"
import { useAuthStore } from "@/lib/auth-store"

export function useMentions() {
  const tenantId = useAuthStore((s) => s.tenantId)

  return useQuery({
    queryKey: ["agent-mentions"],
    queryFn: getAgentMentions,
    staleTime: 2 * 60_000,
    enabled: !!tenantId,
  })
}
