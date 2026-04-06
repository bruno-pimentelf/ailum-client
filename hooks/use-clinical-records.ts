import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { clinicalRecordsApi } from "@/lib/api/clinical-records"

const RECORDS_KEY = ["clinical-records"] as const

export function useClinicalRecords(params?: Parameters<typeof clinicalRecordsApi.list>[0]) {
  return useQuery({
    queryKey: [...RECORDS_KEY, params],
    queryFn: () => clinicalRecordsApi.list(params),
  })
}

export function useClinicalRecord(id: string | null) {
  return useQuery({
    queryKey: [...RECORDS_KEY, id],
    queryFn: () => clinicalRecordsApi.get(id!),
    enabled: !!id,
  })
}

export function usePatientTimeline(contactId: string | null, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...RECORDS_KEY, "timeline", contactId, params],
    queryFn: () => clinicalRecordsApi.timeline(contactId!, params),
    enabled: !!contactId,
  })
}

export function useCreateClinicalRecord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: clinicalRecordsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: RECORDS_KEY }),
  })
}

export function useUpdateClinicalRecord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: Parameters<typeof clinicalRecordsApi.update>[1] & { id: string }) =>
      clinicalRecordsApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: RECORDS_KEY }),
  })
}

export function useDeleteClinicalRecord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: clinicalRecordsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: RECORDS_KEY }),
  })
}

export function useUploadAttachment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ recordId, file, options }: { recordId: string; file: File; options?: { category?: string; notes?: string } }) =>
      clinicalRecordsApi.uploadAttachment(recordId, file, options),
    onSuccess: () => qc.invalidateQueries({ queryKey: RECORDS_KEY }),
  })
}

export function useDeleteAttachment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ recordId, attachmentId }: { recordId: string; attachmentId: string }) =>
      clinicalRecordsApi.deleteAttachment(recordId, attachmentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: RECORDS_KEY }),
  })
}
