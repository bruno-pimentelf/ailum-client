import { apiFetch } from "@/lib/api"

export type MemberRole = "ADMIN" | "PROFESSIONAL" | "SECRETARY"

export interface Member {
  id: string          // memberId
  userId: string
  role: MemberRole
  isActive: boolean
  joinedAt: string
  professional: {
    id: string
    fullName: string
    specialty: string | null
  } | null
  user: {
    id: string
    name: string
    email: string
    image: string | null
  } | null
}

export type InvitationStatus = "pending" | "accepted" | "expired"

export type InvitationRole = MemberRole | "Membro"

export interface Invitation {
  id: string
  email: string
  role: InvitationRole
  status: InvitationStatus
  expiresAt: string
  createdAt: string
}

export interface InviteInput {
  email: string
  role: MemberRole
  professionalId?: string
}

export interface InviteResponse {
  id: string
  email: string
  role: string
  status: "pending"
}

export interface UpdateRoleInput {
  role?: MemberRole
  professionalId?: string | null
}

export const membersApi = {
  list: () => apiFetch<Member[]>("/members"),

  invitations: () => apiFetch<Invitation[]>("/members/invitations"),

  invite: (body: InviteInput) =>
    apiFetch<InviteResponse>("/members/invite", { method: "POST", body }),

  updateRole: (memberId: string, body: UpdateRoleInput) =>
    apiFetch<Member>(`/members/${memberId}/role`, { method: "PATCH", body }),

  remove: (memberId: string) =>
    apiFetch<void>(`/members/${memberId}`, { method: "DELETE" }),
}
