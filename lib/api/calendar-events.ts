import { apiFetch } from "@/lib/api"

export interface CalendarEvent {
  id: string
  tenantId: string
  professionalId: string
  title: string
  description: string | null
  date: string // ISO date string
  startTime: string // HH:mm
  endTime: string // HH:mm
  color: string
  recurrence: string | null // null | "weekly"
  occurrenceDate?: string // YYYY-MM-DD (for expanded weekly events)
}

export interface CalendarEventsResponse {
  data: CalendarEvent[]
}

export interface CalendarEventListParams {
  professionalId?: string
  from: string
  to: string
}

export interface CreateCalendarEventInput {
  professionalId: string
  title: string
  description?: string
  date: string // YYYY-MM-DD
  startTime: string // HH:mm
  endTime: string // HH:mm
  color?: string
  recurrence?: string | null
}

export interface UpdateCalendarEventInput {
  title?: string
  description?: string | null
  date?: string
  startTime?: string
  endTime?: string
  color?: string
  recurrence?: string | null
}

export const calendarEventsApi = {
  list: (params: CalendarEventListParams) => {
    const qs = new URLSearchParams()
    if (params.professionalId) qs.set("professionalId", params.professionalId)
    qs.set("from", params.from)
    qs.set("to", params.to)
    return apiFetch<CalendarEventsResponse>(
      `/scheduling/calendar-events?${qs}`
    )
  },

  create: (body: CreateCalendarEventInput) =>
    apiFetch<CalendarEvent>("/scheduling/calendar-events", {
      method: "POST",
      body,
    }),

  update: (id: string, body: UpdateCalendarEventInput) =>
    apiFetch<CalendarEvent>(`/scheduling/calendar-events/${id}`, {
      method: "PATCH",
      body,
    }),

  delete: (id: string) =>
    apiFetch<void>(`/scheduling/calendar-events/${id}`, {
      method: "DELETE",
    }),

  /** Delete only a single occurrence of a recurring event */
  deleteOccurrence: (id: string, date: string) =>
    apiFetch<{ ok: boolean }>(`/scheduling/calendar-events/${id}?mode=occurrence&date=${date}`, {
      method: "DELETE",
    }),
}
