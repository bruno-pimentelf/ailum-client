import { useQuery, useMutation } from "@tanstack/react-query"
import {
  superAdminApi,
  type SAPlaygroundResult,
} from "@/lib/api/super-admin"

export function useTenantInstances(tenantId: string | null) {
  return useQuery({
    queryKey: ["super-admin", "tenant-instances", tenantId],
    queryFn: () => superAdminApi.listTenantInstances(tenantId!),
    enabled: !!tenantId,
  })
}

export function useSAPlaygroundInit() {
  return useMutation({
    mutationFn: (body: { tenantId: string; funnelId: string; stageId?: string }) =>
      superAdminApi.initPlayground(body),
  })
}

export function useSAPlaygroundSend() {
  return useMutation<
    SAPlaygroundResult,
    Error,
    { tenantId: string; contactId: string; message: string; llmProviderOverride?: string; llmModelOverride?: string }
  >({
    mutationFn: (body) => superAdminApi.sendPlaygroundMessage(body),
  })
}

export function useSAPlaygroundReset() {
  return useMutation({
    mutationFn: (tenantId: string) => superAdminApi.resetPlayground(tenantId),
  })
}
