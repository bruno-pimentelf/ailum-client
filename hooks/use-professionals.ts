"use client"

import { useQuery, useQueries, useMutation, useQueryClient } from "@tanstack/react-query"
import { professionalsApi } from "@/lib/api/professionals"
import type {
  Professional,
  AvailabilityInput,
  ExceptionInput,
  OverrideInput,
  BlockRangeInput,
  AvailabilityOverride,
} from "@/lib/api/professionals"

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
    staleTime: 30_000,
  })
}

/** Overrides do profissional no intervalo from–to (cheatsheet: GET overrides?from=&to=) */
export function useProfessionalOverrides(
  professionalId: string | null,
  from: string,
  to: string
) {
  return useQuery({
    queryKey: ["professionalOverrides", professionalId, from, to],
    queryFn: () =>
      professionalsApi.getOverrides(professionalId!, { from, to }),
    enabled: !!professionalId && !!from && !!to,
    staleTime: 15_000,
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
  const queryKey = ["professional", professionalId] as const

  const putAvailability = useMutation({
    mutationFn: (body: AvailabilityInput[]) =>
      professionalsApi.putAvailability(professionalId!, body),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({ queryKey: ["professionals"] })
    },
  })

  const addException = useMutation({
    mutationFn: (body: ExceptionInput) =>
      professionalsApi.addException(professionalId!, body),
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })

  const removeException = useMutation({
    mutationFn: (date: string) =>
      professionalsApi.removeException(professionalId!, date),
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })

  const addOverride = useMutation({
    mutationFn: (body: OverrideInput) =>
      professionalsApi.addOverride(professionalId!, body),
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })

  const removeOverride = useMutation({
    mutationFn: (overrideId: string) =>
      professionalsApi.removeOverride(professionalId!, overrideId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({
        queryKey: ["professionalOverrides", professionalId],
      })
    },
  })

  const addBlockRange = useMutation({
    mutationFn: (body: BlockRangeInput) =>
      professionalsApi.addBlockRange(professionalId!, body),
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })

  type ReplaceOverridesVars = {
    removeIds: string[]
    addSlots: OverrideInput[]
    dateStr?: string
    from?: string
    to?: string
    onOptimisticApply?: () => void
  }

  const replaceOverridesForDate = useMutation({
    mutationFn: async ({ removeIds, addSlots }: ReplaceOverridesVars) => {
      for (const id of removeIds) {
        try {
          await professionalsApi.removeOverride(professionalId!, id)
        } catch (e) {
          const status = (e as { status?: number })?.status
          if (status !== 404) throw e
        }
      }
      for (const slot of addSlots) {
        await professionalsApi.addOverride(professionalId!, slot)
      }
    },
    onMutate: async (vars) => {
      const { removeIds, addSlots, dateStr, from, to, onOptimisticApply } = vars
      if (!from || !to || !dateStr) return
      const overrideKey = [
        "professionalOverrides",
        professionalId,
        from,
        to,
      ] as const
      const prev = queryClient.getQueryData<AvailabilityOverride[]>(overrideKey)
      const optimisticOverrides = [
        ...(prev ?? []).filter(
          (o) => (o.date?.slice(0, 10) ?? o.date) !== dateStr
        ),
        ...addSlots.map((s, i) => ({
          id: `opt-${dateStr}-${i}-${Date.now()}`,
          professionalId: professionalId!,
          date: dateStr,
          startTime: s.startTime,
          endTime: s.endTime,
          slotDurationMin: s.slotDurationMin,
        })),
      ]
      queryClient.setQueryData(overrideKey, optimisticOverrides)
      onOptimisticApply?.()
      return { prev, overrideKey }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.overrideKey) {
        queryClient.setQueryData(ctx.overrideKey, ctx.prev ?? [])
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({
        queryKey: ["professionalOverrides", professionalId],
      })
    },
  })

  const removeBlockRange = useMutation({
    mutationFn: (blockRangeId: string) =>
      professionalsApi.removeBlockRange(professionalId!, blockRangeId),
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })

  const deleteAvailability = useMutation({
    mutationFn: () => professionalsApi.deleteAvailability(professionalId!),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({
        queryKey: ["professionalOverrides", professionalId],
      })
    },
  })

  return {
    putAvailability,
    deleteAvailability,
    addException,
    removeException,
    addOverride,
    removeOverride,
    replaceOverridesForDate,
    addBlockRange,
    removeBlockRange,
  }
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
