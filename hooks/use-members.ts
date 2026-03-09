import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { membersApi, type Member, type Invitation, type InviteInput, type UpdateRoleInput } from "@/lib/api/members"

const KEY = ["members"] as const
const INVITATIONS_KEY = ["members", "invitations"] as const

export function useMembers() {
  return useQuery<Member[]>({
    queryKey: KEY,
    queryFn: () => membersApi.list(),
    staleTime: 60_000,
  })
}

export function useInvitations() {
  return useQuery<Invitation[]>({
    queryKey: INVITATIONS_KEY,
    queryFn: () => membersApi.invitations(),
    staleTime: 60_000,
  })
}

export function useInviteMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: InviteInput) => membersApi.invite(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: INVITATIONS_KEY })
    },
  })
}

export function useUpdateMemberRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ memberId, body }: { memberId: string; body: UpdateRoleInput }) =>
      membersApi.updateRole(memberId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useRemoveMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (memberId: string) => membersApi.remove(memberId),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
