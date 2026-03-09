"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  PaperclipHorizontal,
  Microphone,
  PaperPlaneTilt,
  Smiley,
  Star,
  ArrowCounterClockwise,
  ChatCircleText,
  BookmarkSimple,
  Archive,
  DotsThree,
  Phone,
  Check,
  Checks,
  Robot,
  Image as ImageIcon,
  FileDoc,
  MapPin,
  UserCircle,
  SpeakerHigh,
  VideoCamera,
} from "@phosphor-icons/react"
import { useMessages, useTypingStatus } from "@/hooks/use-chats"
import { sendMessage, markAsRead } from "@/lib/api/conversations"
import type { FirestoreContact, FirestoreMessage } from "@/lib/types/firestore"

const ease = [0.33, 1, 0.68, 1] as const

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = (name || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
  const colors = [
    "bg-accent/20 text-accent",
    "bg-violet-500/20 text-violet-400",
    "bg-emerald-500/20 text-emerald-400",
    "bg-rose-500/20 text-rose-400",
    "bg-amber-500/20 text-amber-400",
  ]
  const color = colors[(name || "").charCodeAt(0) % colors.length]
  const sz = size === "sm" ? "h-8 w-8 text-[11px]" : size === "lg" ? "h-10 w-10 text-[14px]" : "h-9 w-9 text-[12px]"
  return (
    <div className={`${sz} ${color} shrink-0 rounded-full flex items-center justify-center font-semibold border border-white/5`}>
      {initials}
    </div>
  )
}

// ─── Message status tick ───────────────────────────────────────────────────────

function MessageTick({ status }: { status?: FirestoreMessage["status"] }) {
  if (!status) return null
  if (status === "READ" || status === "PLAYED") return <Checks className="h-3 w-3 text-accent" />
  if (status === "RECEIVED") return <Checks className="h-3 w-3 text-muted-foreground/40" />
  return <Check className="h-3 w-3 text-muted-foreground/40" />
}

// ─── Format Firestore Timestamp ───────────────────────────────────────────────

function formatTime(ts: FirestoreMessage["createdAt"] | undefined): string {
  if (!ts) return ""
  try {
    const date = ts.toDate()
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  } catch {
    return ""
  }
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg, animate }: { msg: FirestoreMessage; animate?: boolean }) {
  const isMe = msg.role === "OPERATOR" || msg.role === "AGENT"
  const isAgent = msg.role === "AGENT"
  const time = formatTime(msg.createdAt)

  const bubbleCls = `max-w-[72%] rounded-2xl px-4 py-2.5 ${
    isMe
      ? "bg-accent/15 border border-accent/20 rounded-br-sm text-foreground"
      : "bg-card border border-border/60 rounded-bl-sm text-foreground"
  }`

  const content = (() => {
    const m = msg.metadata

    if (msg.type === "TEXT" && !m?.mediaKind) {
      return <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
    }

    if (msg.type === "IMAGE" && m?.imageUrl) {
      return (
        <div className="space-y-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={m.imageUrl} alt={m.caption || "imagem"} className="rounded-xl max-w-[260px] w-full object-cover" />
          {m.caption && <p className="text-[12px] text-foreground/80">{m.caption}</p>}
        </div>
      )
    }

    if (msg.type === "AUDIO" && m?.audioUrl) {
      return (
        <div className="flex items-center gap-2">
          <SpeakerHigh className="h-4 w-4 text-muted-foreground/60 shrink-0" />
          <audio controls src={m.audioUrl} className="h-8 max-w-[220px]" />
          {m.ptt && <span className="text-[10px] text-muted-foreground/40">voz</span>}
        </div>
      )
    }

    if (msg.type === "DOCUMENT" && m?.mediaKind === "video" && m.videoUrl) {
      return (
        <div className="space-y-1">
          <video controls src={m.videoUrl} className="rounded-xl max-w-[260px]" />
          {m.caption && <p className="text-[12px] text-foreground/80">{m.caption}</p>}
        </div>
      )
    }

    if (msg.type === "DOCUMENT" && !m?.mediaKind && m?.documentUrl) {
      return (
        <a href={m.documentUrl} target="_blank" rel="noopener noreferrer" download={m.fileName} className="flex items-center gap-2 text-accent hover:underline">
          <FileDoc className="h-4 w-4 shrink-0" />
          <span className="text-[12px] truncate max-w-[180px]">{m.fileName || msg.content || "Documento"}</span>
        </a>
      )
    }

    if (m?.mediaKind === "sticker" && m.stickerUrl) {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={m.stickerUrl} alt="sticker" className="h-24 w-24 object-contain" />
    }

    if (m?.mediaKind === "location" && m.latitude && m.longitude) {
      return (
        <a
          href={`https://maps.google.com/?q=${m.latitude},${m.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-accent hover:underline"
        >
          <MapPin className="h-4 w-4 shrink-0" weight="fill" />
          <span className="text-[12px]">{msg.content || m.address || "Ver localização"}</span>
        </a>
      )
    }

    if (m?.mediaKind === "contact" && m.contactName) {
      return (
        <div className="flex items-center gap-2">
          <UserCircle className="h-8 w-8 text-muted-foreground/50 shrink-0" weight="duotone" />
          <div>
            <p className="text-[12px] font-semibold">{m.contactName}</p>
            {m.contactPhone && <p className="text-[11px] text-muted-foreground/60 font-mono">{m.contactPhone}</p>}
          </div>
        </div>
      )
    }

    // Fallback — show content as text
    return <p className="text-[13px] leading-relaxed">{msg.content}</p>
  })()

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease }}
      className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}
    >
      {isAgent && !isMe && (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 border border-accent/20 mb-1">
          <Robot className="h-3.5 w-3.5 text-accent" weight="fill" />
        </div>
      )}
      <div className={bubbleCls}>
        {content}
        <div className={`mt-1 flex items-center gap-1 ${isMe ? "justify-end" : "justify-start"}`}>
          <span className="text-[10px] text-muted-foreground/40">{time}</span>
          {isMe && <MessageTick status={msg.status} />}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2, ease }}
      className="flex items-center gap-2"
    >
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/40" />
      <div className="rounded-2xl rounded-bl-sm border border-border/60 bg-card px-4 py-2.5 flex items-center gap-1.5">
        <span className="text-[11px] text-muted-foreground/50 italic">{label}</span>
        <span className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </span>
      </div>
    </motion.div>
  )
}

// ─── ChatView ─────────────────────────────────────────────────────────────────

export interface ChatViewProps {
  contact: FirestoreContact
  tenantId: string
}

export function ChatView({ contact, tenantId }: ChatViewProps) {
  const [inputValue, setInputValue] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const prevCountRef = useRef(0)

  const { messages, loading: messagesLoading } = useMessages(tenantId, contact.id)
  const { contactTyping, agentTyping } = useTypingStatus(tenantId, contact.id)

  // Mark as read when chat is opened
  useEffect(() => {
    if (contact.unreadCount > 0) {
      markAsRead(contact.id).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contact.id])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length !== prevCountRef.current) {
      prevCountRef.current = messages.length
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages.length])

  // Scroll to bottom when chat first opens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" })
  }, [contact.id])

  const handleSend = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const text = inputValue.trim()
      if (!text || sending) return
      setInputValue("")
      setSending(true)
      try {
        await sendMessage(contact.id, { type: "TEXT", text })
      } catch {
        // Firestore will not add the message — restore input so user can retry
        setInputValue(text)
      } finally {
        setSending(false)
      }
    },
    [contact.id, inputValue, sending]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend(e as unknown as React.FormEvent)
    }
  }

  const displayName = contact.name || contact.phone

  return (
    <motion.div
      key={contact.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-1 flex-col min-h-0 overflow-hidden"
    >
      {/* ── Header ── */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar name={displayName} size="sm" />
            {contactTyping && (
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 border-2 border-background animate-pulse" />
            )}
          </div>
          <div>
            <p className="text-[13px] font-semibold text-foreground leading-tight">{displayName}</p>
            <p className="text-[11px] text-muted-foreground/50 leading-tight font-mono">
              {contactTyping
                ? "digitando..."
                : agentTyping
                  ? "agente escrevendo..."
                  : contact.phone}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          {[Phone, ArrowCounterClockwise, ChatCircleText, Smiley, Star, BookmarkSimple, Archive, DotsThree].map((Icon, i) => (
            <button
              key={i}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 transition-colors duration-150"
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3">
        {messagesLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-5 w-5 rounded-full border-2 border-accent/20 border-t-accent"
            />
            <p className="text-[11px] text-muted-foreground/30">Carregando mensagens...</p>
          </div>
        )}

        {!messagesLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/30 border border-border/40">
              <ChatCircleText className="h-6 w-6 text-muted-foreground/30" weight="duotone" />
            </div>
            <p className="text-[12px] text-muted-foreground/40">Nenhuma mensagem ainda</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            animate={i >= messages.length - 1}
          />
        ))}

        <AnimatePresence>
          {contactTyping && <TypingIndicator key="contact-typing" label="digitando" />}
          {agentTyping && <TypingIndicator key="agent-typing" label="agente escrevendo" />}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ── */}
      <div className="shrink-0 border-t border-border px-4 py-3">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-9 w-9 cursor-pointer shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 transition-colors duration-150"
          >
            <PaperclipHorizontal className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="flex h-9 w-9 cursor-pointer shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 transition-colors duration-150"
          >
            <Microphone className="h-4 w-4" />
          </button>
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite uma mensagem..."
            disabled={sending}
            className="flex-1 h-9 rounded-xl border border-border bg-card/50 px-4 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all duration-300 disabled:opacity-60"
          />
          <motion.button
            type="submit"
            whileTap={{ scale: 0.92 }}
            disabled={!inputValue.trim() || sending}
            className={`flex h-9 w-9 cursor-pointer shrink-0 items-center justify-center rounded-xl transition-all duration-200 disabled:cursor-default ${
              inputValue.trim() && !sending
                ? "bg-accent text-accent-foreground shadow-md shadow-accent/20"
                : "bg-muted/40 text-muted-foreground/40"
            }`}
          >
            {sending ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                className="h-4 w-4 rounded-full border-2 border-current/30 border-t-current"
              />
            ) : (
              <PaperPlaneTilt className="h-4 w-4" weight="fill" />
            )}
          </motion.button>
        </form>
      </div>
    </motion.div>
  )
}

// ─── Legacy type re-export (for backward compatibility) ───────────────────────
export type { FirestoreContact as ChatContact }
