import { apiFetch } from "@/lib/api"

export interface MeResponse {
  id: string
  name: string | null
  email: string | null
  image: string | null
  createdAt: string
  memberId: string
  role: "ADMIN" | "PROFESSIONAL" | "SECRETARY"
  professionalId: string | null
  isSuperAdmin?: boolean
  tenant: {
    id: string
    name: string
    slug: string
  }
}

export const authApi = {
  me: () => apiFetch<MeResponse>("/auth/me"),
}
