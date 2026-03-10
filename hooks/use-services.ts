import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { servicesApi, type Service, type ServiceInput, type ServiceUpdateInput, type ServiceWithProfessionals } from "@/lib/api/services"

const QK = ["services"] as const

export function useServices() {
  return useQuery<Service[]>({
    queryKey: QK,
    queryFn:  () => servicesApi.list(),
    staleTime: 60_000,
  })
}

/** Serviço com profissionais vinculados (para edição e associações). */
export function useService(id: string | null) {
  return useQuery<ServiceWithProfessionals>({
    queryKey: ["service", id],
    queryFn: () => servicesApi.get(id!),
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useCreateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ServiceInput) => servicesApi.create(body),
    onSuccess:  () => qc.invalidateQueries({ queryKey: QK }),
  })
}

export function useUpdateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ServiceUpdateInput }) =>
      servicesApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}

export function useRemoveService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => servicesApi.remove(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: QK }),
  })
}
