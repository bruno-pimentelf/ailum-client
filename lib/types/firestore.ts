import type { Timestamp } from "firebase/firestore"

// ─── Tenant root ──────────────────────────────────────────────────────────────

export interface FirestoreTenant {
  whatsappConnected: boolean
  whatsappError?: string
  whatsappStatusAt: Timestamp
  updatedAt: Timestamp
}

// ─── Contact ──────────────────────────────────────────────────────────────────
//
// The Firestore doc ID (doc.id) is always the contactId to use in API calls.
// The optional `id` field (written by syncContact) is the same Postgres UUID.
//
// Two sets of name/phone fields may coexist:
//   - contactName / contactPhone  — written by syncConversationMessage (webhook)
//   - name / phone                — written by syncContact (CRM sync)
// Always prefer: contactName ?? name  |  contactPhone ?? phone

export interface FirestoreContact {
  // Set by Firestore doc ID (always use doc.id as contactId)
  id?: string

  // Identity — from syncContact
  phone?: string
  name?: string | null
  email?: string | null

  // Identity — from syncConversationMessage
  contactName?: string | null
  contactPhone?: string

  // Photo (may be temporary Z-API URL or permanent Firebase Storage URL)
  photoUrl?: string | null

  // CRM
  status: string
  stageId?: string | null
  funnelId?: string | null
  assignedProfessionalId?: string | null

  // Conversation preview
  lastMessage?: string
  lastMessageAt?: Timestamp | null
  unreadCount?: number

  // Presence indicators
  contactTyping?: boolean
  agentTyping?: boolean
  // Sticky routing for multi-instance WhatsApp/Z-API
  zapiInstanceId?: string | null

  // Metadata
  updatedAt: Timestamp
}

// ─── Message ──────────────────────────────────────────────────────────────────

export interface MessageReaction {
  emoji: string
  fromMe: boolean
  at: Timestamp
}

export interface FirestoreMessage {
  id: string
  role: "CONTACT" | "OPERATOR" | "AGENT"
  type: "TEXT" | "IMAGE" | "AUDIO" | "DOCUMENT" | "PIX_CHARGE"
  content: string
  createdAt: Timestamp
  status?: "SENT" | "RECEIVED" | "READ" | "PLAYED"
  updatedAt?: Timestamp
  // WhatsApp integration fields for reply/reaction
  zapiMessageId?: string
  referenceMessageId?: string
  reactions?: MessageReaction[]
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
    // VIDEO / special
    videoUrl?: string
    mediaKind?: "video" | "sticker" | "location" | "contact" | "template"
    // DOCUMENT
    documentUrl?: string
    fileName?: string
    // LOCATION
    latitude?: string
    longitude?: string
    address?: string
    // CONTACT vCard
    contactName?: string
    contactPhone?: string
    // LINK
    url?: string
    // BUTTON / LIST response
    buttonId?: string
    selectedRowId?: string
    // TEMPLATE
    templateId?: string
    // STICKER
    stickerUrl?: string
    // PIX_CHARGE
    qrCodeUrl?: string
    pixCopyPaste?: string
    amount?: string
    description?: string
  }
}

// ─── Appointment ──────────────────────────────────────────────────────────────

export interface FirestoreAppointment {
  id: string
  contactId: string
  professionalId: string
  serviceId: string
  scheduledAt: Timestamp
  durationMin: number
  status: string // 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  notes: string | null
  updatedAt: Timestamp
}

// ─── Charge ───────────────────────────────────────────────────────────────────

export interface FirestoreCharge {
  id: string
  contactId: string
  amount: string
  description: string
  status: string // 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  pixCopyPaste: string | null
  dueAt: Timestamp | null
  paidAt: Timestamp | null
  updatedAt: Timestamp
}
