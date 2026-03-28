import { apiFetch, API_BASE } from "@/lib/api"

export interface KnowledgeDocument {
  id: string
  tenantId: string
  title: string
  sourceType: "TEXT" | "FAQ" | "IMAGE" | "PDF" | "AUDIO" | "VIDEO"
  rawContent: string | null
  mimeType: string | null
  fileName: string | null
  fileSize: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count: { chunks: number }
}

export interface KnowledgeDocumentInput {
  title: string
  sourceType: "TEXT" | "FAQ"
  content: string
}

export const knowledgeApi = {
  list:       ()                                         => apiFetch<KnowledgeDocument[]>("/knowledge"),
  get:        (id: string)                               => apiFetch<KnowledgeDocument>(`/knowledge/${id}`),
  create:     (body: KnowledgeDocumentInput)              => apiFetch<KnowledgeDocument>("/knowledge", { method: "POST", body }),
  update:     (id: string, body: { title?: string; isActive?: boolean }) => apiFetch<KnowledgeDocument>(`/knowledge/${id}`, { method: "PATCH", body }),
  reprocess:  (id: string, content: string)              => apiFetch<KnowledgeDocument>(`/knowledge/${id}/reprocess`, { method: "PUT", body: { content } }),
  remove:     (id: string)                               => apiFetch<void>(`/knowledge/${id}`, { method: "DELETE" }),

  /** Upload a file (image, PDF, audio, video) as a knowledge document. */
  upload: async (file: File, title?: string): Promise<KnowledgeDocument> => {
    const formData = new FormData()
    formData.append("file", file)
    if (title) formData.append("title", title)

    const res = await fetch(`${API_BASE}/knowledge/upload`, {
      method: "POST",
      credentials: "include",
      body: formData,
    })

    if (!res.ok) {
      const data = await res.json().catch(() => null) as { message?: string } | null
      throw new Error(data?.message ?? `Upload failed (${res.status})`)
    }

    return res.json() as Promise<KnowledgeDocument>
  },
}

export const ACCEPTED_FILE_TYPES = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "application/pdf": [".pdf"],
  "audio/mpeg": [".mp3"],
  "audio/wav": [".wav"],
  "video/mp4": [".mp4"],
  "video/quicktime": [".mov"],
} as const

export const ACCEPTED_EXTENSIONS = Object.values(ACCEPTED_FILE_TYPES).flat().join(", ")
export const ACCEPTED_MIME_STRING = Object.keys(ACCEPTED_FILE_TYPES).join(", ")
