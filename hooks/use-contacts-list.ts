import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  contactsApi,
  type ContactsParams,
  type ContactsResponse,
  type CreateContactInput,
  type ContactImportCommitInput,
  type ContactImportPreviewInput,
} from "@/lib/api/contacts"

export function useContactsList(params: ContactsParams = {}) {
  return useQuery<ContactsResponse>({
    queryKey: ["contacts-list", params],
    queryFn: () => contactsApi.list(params),
    staleTime: 30_000,
    placeholderData: (prev) => prev, // keep previous data while fetching next page
  })
}

export function useCreateContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateContactInput) => contactsApi.create(body),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["contacts-list"] })
      if (variables.funnelId) {
        qc.invalidateQueries({ queryKey: ["board", variables.funnelId] })
      }
    },
  })
}

export function useContactsImportPreview() {
  return useMutation({
    mutationFn: (body: ContactImportPreviewInput) => contactsApi.importPreview(body),
  })
}

export function useContactsImportCommit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ContactImportCommitInput) => contactsApi.importCommit(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts-list"] })
      qc.invalidateQueries({ queryKey: ["contacts"] })
    },
  })
}

export function useDeleteContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (contactId: string) => contactsApi.delete(contactId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts-list"] })
      qc.invalidateQueries({ queryKey: ["contacts"] })
      qc.invalidateQueries({ queryKey: ["board"] })
    },
  })
}
