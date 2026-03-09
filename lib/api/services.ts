import { apiFetch } from "@/lib/api"

export interface Service {
  id: string
  name: string
  description: string | null
  durationMin: number
  price: number
  isActive: boolean
  createdAt: string
}

export interface ServiceInput {
  name: string
  description?: string | null
  durationMin?: number
  price: number
}

export type ServiceUpdateInput = Partial<ServiceInput>

export const servicesApi = {
  list:   ()                                    => apiFetch<Service[]>("/services"),
  get:    (id: string)                          => apiFetch<Service>(`/services/${id}`),
  create: (body: ServiceInput)                  => apiFetch<Service>("/services", { method: "POST", body }),
  update: (id: string, body: ServiceUpdateInput) => apiFetch<Service>(`/services/${id}`, { method: "PATCH", body }),
  remove: (id: string)                          => apiFetch<void>(`/services/${id}`, { method: "DELETE" }),
}
