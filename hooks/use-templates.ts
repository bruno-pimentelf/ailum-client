import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { templatesApi, type MessageTemplate, type TemplateInput } from "@/lib/api/templates"

export function useTemplates() {
  return useQuery<MessageTemplate[]>({
    queryKey: ["templates"],
    queryFn: () => templatesApi.list(),
  })
}

export function useTemplate(id: string | null) {
  return useQuery({
    queryKey: ["template", id],
    queryFn: () => templatesApi.get(id!),
    enabled: !!id,
  })
}

export function useTemplateMutations() {
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: (body: TemplateInput) => templatesApi.create(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["templates"] }),
  })

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Omit<TemplateInput, "key">> }) =>
      templatesApi.update(id, body),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["templates"] })
      queryClient.invalidateQueries({ queryKey: ["template", id] })
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => templatesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["templates"] }),
  })

  return { create, update, remove }
}
