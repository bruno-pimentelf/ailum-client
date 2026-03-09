import { apiFetch } from "@/lib/api"

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface AvailabilitySlot {
  id?: string
  professionalId?: string
  dayOfWeek: number // 0=Domingo, 1=Segunda, ..., 6=Sábado
  startTime: string // "HH:mm"
  endTime: string
  slotDurationMin?: number
}

export interface AvailabilityException {
  id: string
  professionalId: string
  date: string // YYYY-MM-DD
  isUnavailable: boolean
  reason: string | null
}

export interface Professional {
  id: string
  tenantId: string
  fullName: string
  specialty: string | null
  bio: string | null
  avatarUrl: string | null
  calendarColor: string
  availability: AvailabilitySlot[]
  availabilityExceptions: AvailabilityException[]
}

export interface AvailabilityInput {
  dayOfWeek: number
  startTime: string
  endTime: string
  slotDurationMin?: number
}

export interface ExceptionInput {
  date: string // YYYY-MM-DD
  isUnavailable?: boolean
  reason?: string
}

// ─── API ───────────────────────────────────────────────────────────────────────

export interface CreateProfessionalInput {
  fullName: string
  specialty?: string
  calendarColor?: string
}

export const professionalsApi = {
  list: () => apiFetch<Professional[]>("/professionals"),

  create: (body: CreateProfessionalInput) =>
    apiFetch<Professional>("/professionals", { method: "POST", body }),

  get: (id: string) => apiFetch<Professional>(`/professionals/${id}`),

  getAvailability: (id: string) =>
    apiFetch<AvailabilitySlot[]>(`/professionals/${id}/availability`),

  putAvailability: (id: string, body: AvailabilityInput[]) =>
    apiFetch<AvailabilitySlot[]>(`/professionals/${id}/availability`, {
      method: "PUT",
      body,
    }),

  addException: (id: string, body: ExceptionInput) =>
    apiFetch<AvailabilityException>(`/professionals/${id}/exceptions`, {
      method: "POST",
      body,
    }),

  removeException: (id: string, date: string) =>
    apiFetch<void>(`/professionals/${id}/exceptions/${date}`, {
      method: "DELETE",
    }),

  getSlots: (id: string, params: { date: string; serviceId: string }) =>
    apiFetch<{
      slots: Array<{ time: string; endTime: string; scheduledAt: string }>
      professional: { id: string; fullName: string }
      reason?: string
    }>(
      `/scheduling/professionals/${id}/availability?date=${params.date}&serviceId=${params.serviceId}`
    ),
}
