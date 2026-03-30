import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  superAdminApi,
  type TenantDetail,
  type FunnelDuplicateInput,
  type FunnelTransferInput,
} from "@/lib/api/super-admin"

export function useSuperAdminTenants(params?: {
  search?: string
  page?: number
}) {
  return useQuery({
    queryKey: ["super-admin", "tenants", params],
    queryFn: () => superAdminApi.listTenants(params),
    placeholderData: (prev) => prev,
  })
}

export function useSuperAdminTenant(tenantId: string | null) {
  return useQuery({
    queryKey: ["super-admin", "tenant", tenantId],
    queryFn: () => superAdminApi.getTenant(tenantId!),
    enabled: !!tenantId,
  })
}

export function useSuperAdminUpdateTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      tenantId,
      body,
    }: {
      tenantId: string
      body: Partial<TenantDetail>
    }) => superAdminApi.updateTenant(tenantId, body),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["super-admin", "tenants"] })
      qc.invalidateQueries({
        queryKey: ["super-admin", "tenant", variables.tenantId],
      })
    },
  })
}

export function useSuperAdminOverviewStats() {
  return useQuery({
    queryKey: ["super-admin", "stats", "overview"],
    queryFn: () => superAdminApi.getOverviewStats(),
  })
}

export function useSuperAdminTenantFunnels(tenantId: string | null) {
  return useQuery({
    queryKey: ["super-admin", "tenant-funnels", tenantId],
    queryFn: () => superAdminApi.getTenantFunnels(tenantId!),
    enabled: !!tenantId,
  })
}

export function useSuperAdminDuplicateFunnel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: FunnelDuplicateInput) =>
      superAdminApi.duplicateFunnel(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin", "tenant-funnels"] })
    },
  })
}

export function useSuperAdminTransferFunnel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: FunnelTransferInput) =>
      superAdminApi.transferFunnel(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin", "tenant-funnels"] })
    },
  })
}
