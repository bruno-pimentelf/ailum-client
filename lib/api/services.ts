import { apiFetch } from "@/lib/api"

export interface Service {
  id: string
  name: string
  description: string | null
  durationMin: number
  price: number
  isActive: boolean
  isConsultation: boolean
  createdAt: string
}

/** Serviço com profissionais que o oferecem (GET /services/:id) */
export interface ProfessionalServiceLink {
  professionalId: string
  serviceId: string
  customPrice: number | null
  professional: { id: string; fullName: string; isActive: boolean }
}

export interface ServiceWithProfessionals extends Service {
  professionalServices: ProfessionalServiceLink[]
}

export interface ServiceInput {
  name: string
  description?: string | null
  durationMin?: number
  price: number
  isConsultation?: boolean
}

export type ServiceUpdateInput = Partial<ServiceInput>

export const servicesApi = {
  list:   ()                                    => apiFetch<Service[]>("/services"),
  get:    (id: string)                          => apiFetch<ServiceWithProfessionals>(`/services/${id}`),
  create: (body: ServiceInput)                  => apiFetch<Service>("/services", { method: "POST", body }),
  update: (id: string, body: ServiceUpdateInput) => apiFetch<Service>(`/services/${id}`, { method: "PATCH", body }),
  remove: (id: string)                          => apiFetch<void>(`/services/${id}`, { method: "DELETE" }),
}
