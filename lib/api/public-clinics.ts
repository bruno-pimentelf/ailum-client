/**
 * Public (unauthenticated) API for clinic profiles.
 * GET /v1/public/clinics/:slug — no credentials required.
 */

import { API_BASE } from "@/lib/api"

export type PublicClinicAddress = {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zip: string
}

export type PublicClinicService = {
  id: string
  name: string
  description?: string
  durationMin: number
  price: number
  isConsultation: boolean
  professionals: Array<{
    id: string
    fullName: string
    specialty?: string
    avatarUrl?: string
  }>
}

export type PublicClinicProfessional = {
  id: string
  fullName: string
  specialty?: string
  bio?: string
  avatarUrl?: string
  services: Array<{ id: string; name: string }>
}

export type PublicClinic = {
  id: string
  name: string
  slug: string
  description?: string
  logoUrl?: string
  phone?: string
  email?: string
  website?: string
  address?: PublicClinicAddress
  services: PublicClinicService[]
  professionals: PublicClinicProfessional[]
}

export async function getPublicClinic(slug: string): Promise<PublicClinic> {
  const res = await fetch(`${API_BASE}/public/clinics/${encodeURIComponent(slug)}`, {
    credentials: "omit",
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const message = (data as { error?: string } | null)?.error ?? `Clínica não encontrada`
    throw new Error(message)
  }

  return data as PublicClinic
}
