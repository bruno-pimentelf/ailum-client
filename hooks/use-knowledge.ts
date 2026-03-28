import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { knowledgeApi, type KnowledgeDocument, type KnowledgeDocumentInput } from "@/lib/api/knowledge"

const QK = ["knowledge"] as const

export function useKnowledgeDocuments() {
  return useQuery<KnowledgeDocument[]>({
    queryKey: QK,
    queryFn:  () => knowledgeApi.list(),
    staleTime: 60_000,
  })
}

export function useKnowledgeDocument(id: string | null) {
  return useQuery<KnowledgeDocument>({
    queryKey: ["knowledge", id],
    queryFn:  () => knowledgeApi.get(id!),
    enabled:  !!id,
    staleTime: 30_000,
  })
}

export function useCreateKnowledgeDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: KnowledgeDocumentInput) => knowledgeApi.create(body),
    onSuccess:  () => qc.invalidateQueries({ queryKey: QK }),
  })
}

export function useUploadKnowledgeDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ file, title }: { file: File; title?: string }) =>
      knowledgeApi.upload(file, title),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}

export function useUpdateKnowledgeDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: { title?: string; isActive?: boolean } }) =>
      knowledgeApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}

export function useReprocessKnowledgeDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      knowledgeApi.reprocess(id, content),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}

export function useRemoveKnowledgeDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => knowledgeApi.remove(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: QK }),
  })
}
