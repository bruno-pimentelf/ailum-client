import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { documentsApi } from "@/lib/api/documents"

const DOCS_KEY = ["documents"] as const

export function useDocumentTemplates() {
  return useQuery({ queryKey: [...DOCS_KEY, "templates"], queryFn: documentsApi.listTemplates })
}

export function useDocumentTemplate(id: string | null) {
  return useQuery({
    queryKey: [...DOCS_KEY, "templates", id],
    queryFn: () => documentsApi.getTemplate(id!),
    enabled: !!id,
  })
}

export function useCreateDocumentTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: documentsApi.createTemplate,
    onSuccess: () => qc.invalidateQueries({ queryKey: [...DOCS_KEY, "templates"] }),
  })
}

export function useUpdateDocumentTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: Parameters<typeof documentsApi.updateTemplate>[1] & { id: string }) =>
      documentsApi.updateTemplate(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...DOCS_KEY, "templates"] }),
  })
}

export function useDeleteDocumentTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: documentsApi.deleteTemplate,
    onSuccess: () => qc.invalidateQueries({ queryKey: [...DOCS_KEY, "templates"] }),
  })
}

export function useSignedDocuments(params?: Parameters<typeof documentsApi.list>[0]) {
  return useQuery({
    queryKey: [...DOCS_KEY, "signed", params],
    queryFn: () => documentsApi.list(params),
  })
}

export function useSignedDocument(id: string | null) {
  return useQuery({
    queryKey: [...DOCS_KEY, "signed", id],
    queryFn: () => documentsApi.get(id!),
    enabled: !!id,
  })
}

export function useCreateSignedDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: documentsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: DOCS_KEY }),
  })
}

export function useSendForSignature() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => documentsApi.sendForSignature(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: DOCS_KEY }),
  })
}

export function useCancelDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => documentsApi.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: DOCS_KEY }),
  })
}
