import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { tenantApi, type Tenant, type TenantUpdateInput } from "@/lib/api/tenant"

export function useTenant() {
  return useQuery<Tenant>({
    queryKey: ["tenant"],
    queryFn: () => tenantApi.get(),
    staleTime: 5 * 60_000,
    retry: false,
  })
}

export function useUpdateTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: TenantUpdateInput) => tenantApi.update(body),
    onSuccess: (updated) => {
      qc.setQueryData(["tenant"], updated)
    },
  })
}
