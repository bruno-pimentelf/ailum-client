import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { formsApi } from "@/lib/api/forms"

const FORMS_KEY = ["forms"] as const

export function useFormTemplates() {
  return useQuery({ queryKey: [...FORMS_KEY, "templates"], queryFn: formsApi.listTemplates })
}

export function useFormTemplate(id: string | null) {
  return useQuery({
    queryKey: [...FORMS_KEY, "templates", id],
    queryFn: () => formsApi.getTemplate(id!),
    enabled: !!id,
  })
}

export function useCreateFormTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: formsApi.createTemplate,
    onSuccess: () => qc.invalidateQueries({ queryKey: [...FORMS_KEY, "templates"] }),
  })
}

export function useUpdateFormTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: Parameters<typeof formsApi.updateTemplate>[1] & { id: string }) =>
      formsApi.updateTemplate(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...FORMS_KEY, "templates"] }),
  })
}

export function useDeleteFormTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: formsApi.deleteTemplate,
    onSuccess: () => qc.invalidateQueries({ queryKey: [...FORMS_KEY, "templates"] }),
  })
}

export function useFormResponses(params?: Parameters<typeof formsApi.listResponses>[0]) {
  return useQuery({
    queryKey: [...FORMS_KEY, "responses", params],
    queryFn: () => formsApi.listResponses(params),
  })
}

export function useFormResponse(id: string | null) {
  return useQuery({
    queryKey: [...FORMS_KEY, "responses", id],
    queryFn: () => formsApi.getResponse(id!),
    enabled: !!id,
  })
}

export function useCreateFormResponse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: formsApi.createResponse,
    onSuccess: () => qc.invalidateQueries({ queryKey: [...FORMS_KEY, "responses"] }),
  })
}

export function useUpdateFormResponse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, answers }: { id: string; answers: Record<string, unknown> }) =>
      formsApi.updateResponse(id, { answers }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...FORMS_KEY, "responses"] }),
  })
}

export function useSubmitFormResponse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => formsApi.submitResponse(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...FORMS_KEY, "responses"] }),
  })
}

export function useSendFormLink() {
  return useMutation({ mutationFn: (id: string) => formsApi.sendLink(id) })
}
