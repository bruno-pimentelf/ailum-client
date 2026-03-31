"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { schedulingApi } from "@/lib/api/scheduling"
import type {
  SchedulingParams,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from "@/lib/api/scheduling"

export function useAppointments(params: SchedulingParams | null) {
  return useQuery({
    queryKey: ["appointments", params],
    queryFn: () => schedulingApi.list(params!),
    enabled: !!params && !!params.from && !!params.to,
    staleTime: 30_000,
  })
}

export function useCreateAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateAppointmentInput) => schedulingApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] })
    },
  })
}

export function useUpdateAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateAppointmentInput }) =>
      schedulingApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] })
    },
  })
}

export function useDeleteAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => schedulingApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] })
    },
  })
}

export function useDeleteAppointmentPermanent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => schedulingApi.deletePermanent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] })
      qc.invalidateQueries({ queryKey: ["contact-appointments"] })
    },
  })
}
