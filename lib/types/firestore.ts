import type { Timestamp } from "firebase/firestore"

export interface FirestoreContact {
  id: string
  phone: string
  name: string | null
  email: string | null
  status: string
  stageId: string | null
  funnelId: string | null
  lastMessage: string
  lastMessageAt: Timestamp
  unreadCount: number
  contactTyping: boolean
  agentTyping: boolean
  whatsappConnected: boolean
  assignedProfessionalId: string | null
  updatedAt: Timestamp
}

export interface FirestoreMessage {
  id: string
  role: "CONTACT" | "OPERATOR" | "AGENT"
  type: "TEXT" | "IMAGE" | "AUDIO" | "DOCUMENT" | "VIDEO" | "STICKER" | "LOCATION" | "CONTACT_CARD" | "REACTION"
  content: string
  createdAt: Timestamp
  status?: "SENT" | "RECEIVED" | "READ" | "PLAYED"
  metadata?: {
    // IMAGE
    imageUrl?: string
    thumbnailUrl?: string
    mimeType?: string
    width?: number
    height?: number
    viewOnce?: boolean
    caption?: string
    // AUDIO
    audioUrl?: string
    ptt?: boolean
    seconds?: number
    // VIDEO / STICKER / LOCATION / CONTACT / TEMPLATE
    videoUrl?: string
    mediaKind?: "video" | "sticker" | "location" | "contact" | "template"
    // DOCUMENT
    documentUrl?: string
    fileName?: string
    // LOCATION
    latitude?: string
    longitude?: string
    address?: string
    // CONTACT (vCard)
    contactName?: string
    contactPhone?: string
    // LINK
    url?: string
    // STICKER
    stickerUrl?: string
  }
}
