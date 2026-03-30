import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  superAdminApi,
  type TenantDetail,
  type FunnelDuplicateInput,
  type FunnelTransferInput,
  type PlanCreateInput,
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

export function useSuperAdminPlans() {
  return useQuery({
    queryKey: ["super-admin", "plans"],
    queryFn: superAdminApi.listPlans,
  })
}

export function useSuperAdminCreatePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: superAdminApi.createPlan,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["super-admin", "plans"] }),
  })
}

export function useSuperAdminUpdatePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      planId,
      ...body
    }: { planId: string } & Partial<PlanCreateInput>) =>
      superAdminApi.updatePlan(planId, body),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["super-admin", "plans"] }),
  })
}

export function useSuperAdminDeletePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: superAdminApi.deletePlan,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["super-admin", "plans"] }),
  })
}

export function useSuperAdminTenantSubscription(tenantId: string | null) {
  return useQuery({
    queryKey: ["super-admin", "subscription", tenantId],
    queryFn: () => superAdminApi.getTenantSubscription(tenantId!),
    enabled: !!tenantId,
  })
}

export function useSuperAdminAssignPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      tenantId,
      planId,
    }: {
      tenantId: string
      planId: string
    }) => superAdminApi.assignPlan(tenantId, planId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({
        queryKey: ["super-admin", "subscription", vars.tenantId],
      })
      qc.invalidateQueries({ queryKey: ["super-admin", "tenants"] })
    },
  })
}

export function useSuperAdminResetUsage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (tenantId: string) => superAdminApi.resetUsage(tenantId),
    onSuccess: (_, tenantId) =>
      qc.invalidateQueries({
        queryKey: ["super-admin", "subscription", tenantId],
      }),
  })
}
