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

export interface SlotMaskInterval {
  startTime: string // HH:mm
  endTime: string
}

export interface AvailabilityException {
  id: string
  professionalId: string
  date: string // YYYY-MM-DD
  isUnavailable: boolean
  reason: string | null
  /** Quando isUnavailable=false, remove esses intervalos do dia (bloqueio parcial). */
  slotMask?: SlotMaskInterval[] | null
}

export interface AvailabilityOverride {
  id: string
  professionalId: string
  date: string // YYYY-MM-DD
  startTime: string
  endTime: string
  slotDurationMin?: number
}

export interface AvailabilityBlockRange {
  id: string
  professionalId: string
  dateFrom: string
  dateTo: string
  reason: string | null
}

/** Vínculo profissional ↔ serviço (incluído em GET /professionals e /professionals/:id) */
export interface ProfessionalServiceLink {
  professionalId: string
  serviceId: string
  customPrice: number | null
  service?: { id: string; name: string; price: number }
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
  availabilityOverrides?: AvailabilityOverride[]
  availabilityBlockRanges?: AvailabilityBlockRange[]
  professionalServices?: ProfessionalServiceLink[]
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
  /** Apenas quando isUnavailable=false. Remove esses intervalos do dia. */
  slotMask?: SlotMaskInterval[]
}

export interface OverrideInput {
  date: string // YYYY-MM-DD
  startTime: string
  endTime: string
  slotDurationMin?: number
}

export interface BlockRangeInput {
  dateFrom: string
  dateTo: string
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

  deleteAvailability: (id: string) =>
    apiFetch<{ cleared: boolean }>(`/professionals/${id}/availability`, {
      method: "DELETE",
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

  getOverrides: (id: string, params?: { from?: string; to?: string }) => {
    const qs = new URLSearchParams()
    if (params?.from) qs.set("from", params.from)
    if (params?.to) qs.set("to", params.to)
    return apiFetch<AvailabilityOverride[]>(
      `/professionals/${id}/overrides${qs.toString() ? `?${qs}` : ""}`
    )
  },

  addOverride: (id: string, body: OverrideInput) =>
    apiFetch<AvailabilityOverride>(`/professionals/${id}/overrides`, {
      method: "POST",
      body,
    }),

  removeOverride: (id: string, overrideId: string) =>
    apiFetch<void>(`/professionals/${id}/overrides/${overrideId}`, {
      method: "DELETE",
    }),

  getBlockRanges: (id: string) =>
    apiFetch<AvailabilityBlockRange[]>(`/professionals/${id}/block-ranges`),

  addBlockRange: (id: string, body: BlockRangeInput) =>
    apiFetch<AvailabilityBlockRange>(`/professionals/${id}/block-ranges`, {
      method: "POST",
      body,
    }),

  removeBlockRange: (id: string, blockRangeId: string) =>
    apiFetch<void>(`/professionals/${id}/block-ranges/${blockRangeId}`, {
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

  /** Vincular profissional a um serviço (para agendamento e IA). */
  linkService: (
    professionalId: string,
    serviceId: string,
    body?: { customPrice?: number }
  ) =>
    apiFetch<{ professionalId: string; serviceId: string; customPrice: number | null }>(
      `/professionals/${professionalId}/services/${serviceId}`,
      { method: "POST", body: body ?? {} }
    ),

  /** Desvincular profissional de um serviço. */
  unlinkService: (professionalId: string, serviceId: string) =>
    apiFetch<void>(`/professionals/${professionalId}/services/${serviceId}`, {
      method: "DELETE",
    }),
}
