"use client"

import { useQuery, useQueries, useMutation, useQueryClient } from "@tanstack/react-query"
import { professionalsApi } from "@/lib/api/professionals"
import type { Professional, AvailabilityInput, ExceptionInput } from "@/lib/api/professionals"

export function useProfessionals() {
  return useQuery({
    queryKey: ["professionals"],
    queryFn: () => professionalsApi.list(),
    staleTime: 60_000,
  })
}

export function useProfessional(id: string | null) {
  return useQuery({
    queryKey: ["professional", id],
    queryFn: () => professionalsApi.get(id!),
    enabled: !!id,
  })
}

/** Lista profissionais com detalhes completos (availability + exceptions) para a view de Disponibilidade */
export function useProfessionalsWithAvailability() {
  const listQuery = useProfessionals()
  const ids = listQuery.data?.map((p) => p.id) ?? []
  const detailQueries = useQueries({
    queries: ids.map((id) => ({
      queryKey: ["professional", id],
      queryFn: () => professionalsApi.get(id),
      staleTime: 60_000,
    })),
  })

  const professionals: Professional[] = detailQueries
    .map((q) => q.data)
    .filter((p): p is Professional => p != null)

  return {
    data: professionals,
    isLoading: listQuery.isLoading || detailQueries.some((q) => q.isLoading),
    error: listQuery.error,
  }
}

export function useProfessionalMutations(professionalId: string | null) {
  const queryClient = useQueryClient()

  const putAvailability = useMutation({
    mutationFn: (body: AvailabilityInput[]) =>
      professionalsApi.putAvailability(professionalId!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional", professionalId] })
      queryClient.invalidateQueries({ queryKey: ["professionals"] })
    },
  })

  const addException = useMutation({
    mutationFn: (body: ExceptionInput) =>
      professionalsApi.addException(professionalId!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional", professionalId] })
    },
  })

  const removeException = useMutation({
    mutationFn: (date: string) =>
      professionalsApi.removeException(professionalId!, date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional", professionalId] })
    },
  })

  return { putAvailability, addException, removeException }
}

/** Vincular/desvincular profissional ↔ serviço. Invalida services e professionals. */
export function useProfessionalServiceLinks() {
  const queryClient = useQueryClient()

  const link = useMutation({
    mutationFn: ({
      professionalId,
      serviceId,
      customPrice,
    }: {
      professionalId: string
      serviceId: string
      customPrice?: number
    }) =>
      professionalsApi.linkService(professionalId, serviceId, customPrice != null ? { customPrice } : undefined),
    onSuccess: (_, { professionalId }) => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] })
      queryClient.invalidateQueries({ queryKey: ["professional", professionalId] })
      queryClient.invalidateQueries({ queryKey: ["services"] })
      queryClient.invalidateQueries({ queryKey: ["service"] })
    },
  })

  const unlink = useMutation({
    mutationFn: ({ professionalId, serviceId }: { professionalId: string; serviceId: string }) =>
      professionalsApi.unlinkService(professionalId, serviceId),
    onSuccess: (_, { professionalId }) => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] })
      queryClient.invalidateQueries({ queryKey: ["professional", professionalId] })
      queryClient.invalidateQueries({ queryKey: ["services"] })
      queryClient.invalidateQueries({ queryKey: ["service"] })
    },
  })

  return { link, unlink }
}
