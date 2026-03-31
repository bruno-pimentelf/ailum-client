"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  calendarEventsApi,
  type CalendarEventListParams,
  type CreateCalendarEventInput,
  type UpdateCalendarEventInput,
} from "@/lib/api/calendar-events"

export function useCalendarEvents(params: CalendarEventListParams | null) {
  return useQuery({
    queryKey: ["calendar-events", params],
    queryFn: () => calendarEventsApi.list(params!),
    enabled: !!params && !!params.from && !!params.to,
    staleTime: 30_000,
  })
}

export function useCreateCalendarEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateCalendarEventInput) =>
      calendarEventsApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar-events"] })
    },
  })
}

export function useUpdateCalendarEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateCalendarEventInput }) =>
      calendarEventsApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar-events"] })
    },
  })
}

export function useDeleteCalendarEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => calendarEventsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar-events"] })
    },
  })
}

export function useDeleteCalendarEventOccurrence() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) =>
      calendarEventsApi.deleteOccurrence(id, date),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar-events"] })
    },
  })
}
