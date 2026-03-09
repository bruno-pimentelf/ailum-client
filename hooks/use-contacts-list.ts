import { useQuery } from "@tanstack/react-query"
import { contactsApi, type ContactsParams, type ContactsResponse } from "@/lib/api/contacts"

export function useContactsList(params: ContactsParams = {}) {
  return useQuery<ContactsResponse>({
    queryKey: ["contacts-list", params],
    queryFn: () => contactsApi.list(params),
    staleTime: 30_000,
    placeholderData: (prev) => prev, // keep previous data while fetching next page
  })
}
