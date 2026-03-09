import { apiFetch } from "@/lib/api"

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW"

export interface Appointment {
  id: string
  tenantId: string
  contactId: string
  professionalId: string
  serviceId: string
  scheduledAt: string
  durationMin: number
  status: AppointmentStatus
  notes: string | null
  contact: { id: string; name: string | null; phone: string }
  professional: { id: string; fullName: string }
  service: { id: string; name: string; durationMin: number }
  charge?: { id: string; status: string; amount: number }
}

export interface AppointmentsResponse {
  data: Appointment[]
  total: number
  page: number
  limit: number
  pages: number
}

export interface SchedulingParams {
  professionalId?: string
  contactId?: string
  from: string
  to: string
  status?: AppointmentStatus
  page?: number
  limit?: number
}

export interface CreateAppointmentInput {
  contactId: string
  professionalId: string
  serviceId: string
  scheduledAt: string
  durationMin?: number
  notes?: string
}

export interface UpdateAppointmentInput {
  status?: AppointmentStatus
  scheduledAt?: string
  notes?: string
  cancelledReason?: string
}

export const schedulingApi = {
  list: (params: SchedulingParams) => {
    const qs = new URLSearchParams()
    if (params.professionalId) qs.set("professionalId", params.professionalId)
    if (params.contactId) qs.set("contactId", params.contactId)
    qs.set("from", params.from)
    qs.set("to", params.to)
    if (params.status) qs.set("status", params.status)
    if (params.page) qs.set("page", String(params.page))
    if (params.limit) qs.set("limit", String(params.limit))
    return apiFetch<AppointmentsResponse>(`/scheduling?${qs}`)
  },

  get: (id: string) => apiFetch<Appointment>(`/scheduling/${id}`),

  create: (body: CreateAppointmentInput) =>
    apiFetch<Appointment>("/scheduling", { method: "POST", body }),

  update: (id: string, body: UpdateAppointmentInput) =>
    apiFetch<Appointment>(`/scheduling/${id}`, { method: "PATCH", body }),

  delete: (id: string) => apiFetch<void>(`/scheduling/${id}`, { method: "DELETE" }),
}
