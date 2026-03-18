"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  PaperPlaneTilt,
  Microphone,
  Stop,
  Paperclip,
  Image as ImageIcon,
  FileDoc,
  X,
  Check,
  Checks,
  Robot,
  MapPin,
  UserCircle,
  SpeakerHigh,
  ChatCircleText,
  Phone,
  ArrowCounterClockwise,
  ArrowBendUpLeft,
  BookmarkSimple,
  Archive,
  DotsThree,
  Smiley,
  Quotes,
  Star,
  Warning,
  Clock,
  Play,
  Pause,
  ArrowsOutSimple,
  DownloadSimple,
  FilmStrip,
} from "@phosphor-icons/react"
import { PixChargeBlock } from "./pix-charge-block"
import { useMessages, useTypingStatus } from "@/hooks/use-chats"
import { useIntegrations } from "@/hooks/use-integrations"
import type { Integration } from "@/lib/api/integrations"
import { sendMessage, markAsRead } from "@/lib/api/conversations"
import type { FirestoreContact, FirestoreMessage } from "@/lib/types/firestore"

// ─── Optimistic message ───────────────────────────────────────────────────────
// A lightweight mirror of FirestoreMessage for instant UI feedback before
// Firestore confirms. The `_optimistic` flag marks it for deduplication.

interface OptimisticMessage extends Omit<FirestoreMessage, "createdAt"> {
  _optimistic: true
  createdAt: { toDate: () => Date }
}

const ease = [0.33, 1, 0.68, 1] as const

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({
  name,
  photoUrl,
  size = "md",
}: {
  name: string
  photoUrl?: string | null
  size?: "sm" | "md" | "lg"
}) {
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

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        className={`${sz} shrink-0 rounded-full object-cover border border-white/5`}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
      />
    )
  }

  return (
    <div className={`${sz} ${color} shrink-0 rounded-full flex items-center justify-center font-semibold border border-white/5`}>
      {initials}
    </div>
  )
}

// ─── Message status tick ───────────────────────────────────────────────────────

function MessageTick({ status, pending }: { status?: FirestoreMessage["status"]; pending?: boolean }) {
  if (pending) return <Clock className="h-3 w-3 text-muted-foreground/30" />
  if (!status) return <Check className="h-3 w-3 text-muted-foreground/40" />
  if (status === "READ" || status === "PLAYED") return <Checks className="h-3 w-3 text-accent" />
  if (status === "RECEIVED") return <Checks className="h-3 w-3 text-muted-foreground/40" />
  return <Check className="h-3 w-3 text-muted-foreground/40" />
}

// ─── Format Timestamp ─────────────────────────────────────────────────────────

function formatTime(ts: { toDate: () => Date } | undefined): string {
  if (!ts) return ""
  try {
    const date = ts.toDate()
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  } catch {
    return ""
  }
}

// ─── File → base64 ───────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.96 }}
      transition={{ duration: 0.2, ease }}
      className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-xl border border-rose-500/25 bg-[oklch(0.17_0.025_263)] px-4 py-2.5 shadow-xl"
    >
      <Warning className="h-4 w-4 text-rose-400 shrink-0" weight="fill" />
      <p className="text-[12px] text-rose-400 font-medium">{message}</p>
      <button onClick={onDismiss} className="cursor-pointer ml-1 text-rose-400/50 hover:text-rose-400 transition-colors">
        <X className="h-3 w-3" weight="bold" />
      </button>
    </motion.div>
  )
}

// ─── Attachment preview ───────────────────────────────────────────────────────

type PendingAttachment =
  | { kind: "image"; file: File; preview: string }
  | { kind: "document"; file: File }

function AttachmentPreview({ attachment, onRemove }: { attachment: PendingAttachment; onRemove: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2, ease }}
      className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-3 py-2 mx-4 mb-1"
    >
      {attachment.kind === "image" ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={attachment.preview} alt="preview" className="h-9 w-9 rounded-lg object-cover shrink-0 border border-border/40" />
          <span className="text-[12px] text-foreground/70 truncate flex-1">{attachment.file.name}</span>
        </>
      ) : (
        <>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-muted/30">
            <FileDoc className="h-4 w-4 text-muted-foreground/60" />
          </div>
          <span className="text-[12px] text-foreground/70 truncate flex-1">{attachment.file.name}</span>
        </>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="cursor-pointer shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-muted/50 text-muted-foreground/60 hover:bg-rose-500/15 hover:text-rose-400 transition-colors"
      >
        <X className="h-3 w-3" weight="bold" />
      </button>
    </motion.div>
  )
}

// ─── Audio waveform (recording indicator) ────────────────────────────────────

function RecordingIndicator({ seconds }: { seconds: number }) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const label = `${mins}:${String(secs).padStart(2, "0")}`

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-1 items-center gap-3 px-2"
    >
      <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse shrink-0" />
      <span className="text-[12px] font-mono text-rose-400">{label}</span>
      <div className="flex items-end gap-0.5 h-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.span
            key={i}
            className="w-0.5 rounded-full bg-muted-foreground/40"
            animate={{ height: ["4px", "12px", "4px"] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.12, ease: "easeInOut" }}
          />
        ))}
      </div>
      <span className="text-[11px] text-muted-foreground/40 ml-auto">Gravando...</span>
    </motion.div>
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────

type AnyMessage = FirestoreMessage | OptimisticMessage

type MediaViewerPayload =
  | { type: "image"; url: string; caption?: string | null }
  | { type: "video"; url: string; caption?: string | null }
  | { type: "audio"; url: string; caption?: string | null }
  | { type: "document"; url: string; fileName?: string | null }

function formatAudioTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00"
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${String(secs).padStart(2, "0")}`
}

function isMediaPlaceholder(value?: string | null) {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  if (!normalized) return false
  return [
    "[imagem]",
    "imagem",
    "[image]",
    "image",
    "[áudio]",
    "áudio",
    "[audio]",
    "audio",
    "[vídeo]",
    "vídeo",
    "[video]",
    "video",
    "[documento]",
    "documento",
    "[document]",
    "document",
    "[arquivo]",
    "arquivo",
    "[file]",
    "file",
  ].includes(normalized)
}

function AudioMessagePlayer({
  url,
  compact,
  onOpenFull,
}: {
  url: string
  compact?: boolean
  onOpenFull?: () => void
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    const el = audioRef.current
    if (!el) return

    const onLoaded = () => setDuration(el.duration || 0)
    const onTime = () => setCurrentTime(el.currentTime || 0)
    const onEnded = () => setPlaying(false)
    const onPause = () => setPlaying(false)
    const onPlay = () => setPlaying(true)

    el.addEventListener("loadedmetadata", onLoaded)
    el.addEventListener("timeupdate", onTime)
    el.addEventListener("ended", onEnded)
    el.addEventListener("pause", onPause)
    el.addEventListener("play", onPlay)

    return () => {
      el.removeEventListener("loadedmetadata", onLoaded)
      el.removeEventListener("timeupdate", onTime)
      el.removeEventListener("ended", onEnded)
      el.removeEventListener("pause", onPause)
      el.removeEventListener("play", onPlay)
    }
  }, [])

  const togglePlay = async () => {
    const el = audioRef.current
    if (!el) return
    if (el.paused) {
      try {
        await el.play()
      } catch {
        // Ignore autoplay/device restrictions in inline player.
      }
      return
    }
    el.pause()
  }

  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0

  return (
    <div className={`min-w-[190px] rounded-xl border border-border/60 bg-muted/20 p-2.5 ${compact ? "w-[230px]" : "w-full max-w-[300px]"}`}>
      <audio ref={audioRef} src={url} preload="metadata" />
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={togglePlay}
          className="cursor-pointer flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-card/90 text-foreground/85 hover:bg-accent/15 hover:text-accent transition-colors"
          aria-label={playing ? "Pausar áudio" : "Reproduzir áudio"}
        >
          {playing ? <Pause className="h-3.5 w-3.5" weight="fill" /> : <Play className="h-3.5 w-3.5 ml-0.5" weight="fill" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex h-4 items-end gap-0.5">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <motion.span
                key={i}
                className="w-0.5 rounded-full bg-muted-foreground/45"
                animate={playing ? { height: ["4px", "11px", "4px"] } : { height: "4px" }}
                transition={playing ? { duration: 0.9, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" } : { duration: 0.2 }}
              />
            ))}
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/60">
            <motion.div
              className="h-full rounded-full bg-accent/80"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.15, ease: "linear" }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted-foreground/60">{formatAudioTime(currentTime)}</span>
            <span className="text-[10px] font-mono text-muted-foreground/50">{formatAudioTime(duration)}</span>
          </div>
        </div>
        {onOpenFull && (
          <button
            type="button"
            onClick={onOpenFull}
            className="cursor-pointer flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/55 hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label="Abrir áudio em destaque"
            title="Abrir em destaque"
          >
            <ArrowsOutSimple className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

function MediaViewerModal({
  media,
  onClose,
}: {
  media: MediaViewerPayload | null
  onClose: () => void
}) {
  if (!media) return null

  return (
    <AnimatePresence>
      <motion.div
        key={`${media.type}-${media.url}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.2, ease }}
          className="relative w-full max-w-[840px] overflow-hidden rounded-2xl border border-white/10 bg-[oklch(0.18_0.02_260)] shadow-2xl"
        >
          <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
            <p className="truncate text-[12px] font-medium text-white/75">
              {media.type === "document" ? media.fileName || "Documento" : "Visualização de mídia"}
            </p>
            <div className="flex items-center gap-1.5">
              <a
                href={media.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/55 hover:text-white hover:bg-white/10 transition-colors"
                title="Abrir em nova aba"
              >
                <ArrowsOutSimple className="h-4 w-4" />
              </a>
              {media.type === "document" && (
                <a
                  href={media.url}
                  download={media.fileName ?? undefined}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/55 hover:text-white hover:bg-white/10 transition-colors"
                  title="Baixar"
                >
                  <DownloadSimple className="h-4 w-4" />
                </a>
              )}
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-lg text-white/55 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Fechar visualizador"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-[80vh] overflow-auto p-4">
            {media.type === "image" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={media.url} alt={media.caption || "imagem"} className="mx-auto max-h-[72vh] w-auto max-w-full rounded-xl object-contain" />
            )}
            {media.type === "video" && (
              <video controls src={media.url} className="mx-auto max-h-[72vh] w-full rounded-xl" />
            )}
            {media.type === "audio" && (
              <div className="mx-auto w-full max-w-[520px] py-3">
                <AudioMessagePlayer url={media.url} />
              </div>
            )}
            {media.type === "document" && (
              <div className="h-[72vh] overflow-hidden rounded-xl border border-white/10 bg-black/20">
                <iframe src={media.url} className="h-full w-full" title={media.fileName || "Documento"} />
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function MessageBubble({
  msg,
  animate,
  quotedText,
  onReply,
  onReact,
  onOpenMedia,
}: {
  msg: AnyMessage
  animate?: boolean
  quotedText?: string | null
  onReply?: (m: FirestoreMessage) => void
  onReact?: (m: FirestoreMessage, reaction: string) => void
  onOpenMedia?: (media: MediaViewerPayload) => void
}) {
  const isPending = "_optimistic" in msg && msg._optimistic
  const isMe = msg.role === "OPERATOR" || msg.role === "AGENT"
  const isAgent = msg.role === "AGENT"
  const time = formatTime(msg.createdAt)
  const canReplyOrReact = !isPending && !!msg.zapiMessageId
  const REACTIONS = ["❤️", "👍", "🙏", "😂"] as const

  const bubbleCls = `max-w-[72%] rounded-2xl px-4 py-2.5 transition-opacity duration-300 ${
    isPending ? "opacity-60" : "opacity-100"
  } ${
    isMe
      ? "bg-accent/15 border border-accent/20 rounded-br-sm text-foreground"
      : "bg-card border border-border/60 rounded-bl-sm text-foreground"
  }`

  const content = (() => {
    const m = msg.metadata

    // ── IMAGE ──────────────────────────────────────────────────────────────────
    if (msg.type === "IMAGE") {
      // Caption: prefer metadata.caption, fallback to msg.content
      const caption = (m?.caption && !isMediaPlaceholder(m.caption))
        ? m.caption
        : (!isMediaPlaceholder(msg.content) ? msg.content : null)

      if (m?.imageUrl) {
        return (
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => onOpenMedia?.({ type: "image", url: m.imageUrl as string, caption })}
              className="group relative cursor-pointer overflow-hidden rounded-xl"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.imageUrl}
                alt={caption || "imagem"}
                className="max-w-[260px] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />
              <span className="pointer-events-none absolute bottom-2 right-2 rounded-full border border-white/20 bg-black/40 px-2 py-1 text-[10px] text-white/85">
                Toque para ampliar
              </span>
            </button>
            {caption && <p className="text-[12px] text-foreground/80">{caption}</p>}
          </div>
        )
      }

      // Sent by operator — imageUrl not yet populated by backend
      return (
        <div className="space-y-1.5">
          <div className="flex h-24 w-[200px] items-center justify-center rounded-xl border border-border/40 bg-muted/20">
            <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
          </div>
          {caption && <p className="text-[12px] text-foreground/80">{caption}</p>}
        </div>
      )
    }

    // ── AUDIO ──────────────────────────────────────────────────────────────────
    if (msg.type === "AUDIO") {
      if (m?.audioUrl) {
        return (
          <AudioMessagePlayer
            url={m.audioUrl}
            compact
            onOpenFull={() => onOpenMedia?.({ type: "audio", url: m.audioUrl as string })}
          />
        )
      }
      // Sent by operator — audioUrl not yet populated
      return (
        <div className="flex items-center gap-2 min-w-[160px]">
          <SpeakerHigh className="h-4 w-4 text-muted-foreground/40 shrink-0" />
          <span className="text-[12px] text-muted-foreground/50 italic">Áudio enviado</span>
        </div>
      )
    }

    // ── DOCUMENT ───────────────────────────────────────────────────────────────
    if (msg.type === "DOCUMENT") {
      if (m?.mediaKind === "video" && m.videoUrl) {
        return (
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => onOpenMedia?.({ type: "video", url: m.videoUrl as string, caption: m.caption })}
              className="group relative cursor-pointer overflow-hidden rounded-xl"
            >
              <video controls={false} src={m.videoUrl} className="max-w-[260px] rounded-xl" />
              <span className="pointer-events-none absolute inset-0 bg-black/30 transition-colors duration-300 group-hover:bg-black/40" />
              <span className="pointer-events-none absolute inset-x-0 bottom-2 mx-auto flex w-fit items-center gap-1.5 rounded-full border border-white/20 bg-black/45 px-2.5 py-1 text-[10px] text-white/85">
                <FilmStrip className="h-3 w-3" />
                Abrir vídeo
              </span>
            </button>
            {m.caption && <p className="text-[12px] text-foreground/80">{m.caption}</p>}
          </div>
        )
      }

      const fileName = m?.fileName || msg.content || "Documento"
      if (m?.documentUrl) {
        return (
          <button
            type="button"
            onClick={() => onOpenMedia?.({ type: "document", url: m.documentUrl as string, fileName })}
            className="flex items-center gap-2.5 group"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/40 bg-muted/30 group-hover:bg-accent/10 transition-colors">
              <FileDoc className="h-4 w-4 text-muted-foreground/60 group-hover:text-accent transition-colors" />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-medium truncate max-w-[180px] group-hover:text-accent transition-colors">
                {fileName}
              </p>
              <p className="text-[10px] text-muted-foreground/40">Toque para visualizar</p>
            </div>
          </button>
        )
      }

      // Sent by operator — documentUrl not yet populated
      return (
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/40 bg-muted/20">
            <FileDoc className="h-4 w-4 text-muted-foreground/40" />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-medium truncate max-w-[180px] text-foreground/70">{fileName}</p>
            <p className="text-[10px] text-muted-foreground/40">Processando...</p>
          </div>
        </div>
      )
    }

    // ── PIX_CHARGE ─────────────────────────────────────────────────────────────
    if (msg.type === "PIX_CHARGE" && m) {
      return (
        <PixChargeBlock
          content={msg.content}
          metadata={{
            qrCodeUrl: m.qrCodeUrl,
            pixCopyPaste: m.pixCopyPaste,
            amount: m.amount,
            description: m.description,
          }}
        />
      )
    }

    // ── TEXT ───────────────────────────────────────────────────────────────────
    if (msg.type === "TEXT" && !m?.mediaKind) {
      return <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
    }

    // ── STICKER ────────────────────────────────────────────────────────────────
    if (m?.mediaKind === "sticker" && m.stickerUrl) {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={m.stickerUrl} alt="sticker" className="h-24 w-24 object-contain" />
    }

    // ── LOCATION ───────────────────────────────────────────────────────────────
    if (m?.mediaKind === "location" && m.latitude && m.longitude) {
      return (
        <a
          href={`https://maps.google.com/?q=${m.latitude},${m.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 group"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/40 bg-muted/30 group-hover:bg-emerald-500/10 transition-colors">
            <MapPin className="h-4 w-4 text-muted-foreground/60 group-hover:text-emerald-400 transition-colors" weight="fill" />
          </div>
          <div>
            <p className="text-[12px] font-medium group-hover:text-emerald-400 transition-colors">
              {msg.content || m.address || "Ver localização"}
            </p>
            <p className="text-[10px] text-muted-foreground/40">Abrir no Maps</p>
          </div>
        </a>
      )
    }

    // ── CONTACT vCard ──────────────────────────────────────────────────────────
    if (m?.mediaKind === "contact" && m.contactName) {
      return (
        <div className="flex items-center gap-2.5">
          <UserCircle className="h-9 w-9 text-muted-foreground/40 shrink-0" weight="duotone" />
          <div>
            <p className="text-[12px] font-semibold">{m.contactName}</p>
            {m.contactPhone && (
              <p className="text-[11px] text-muted-foreground/60 font-mono">{m.contactPhone}</p>
            )}
          </div>
        </div>
      )
    }

    // Fallback — render content as plain text
    return <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
  })()

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease }}
      className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}
    >
      {isAgent && (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 border border-accent/20 mb-1">
          <Robot className="h-3.5 w-3.5 text-accent" weight="fill" />
        </div>
      )}
      <div className={`group relative ${bubbleCls}`}>
        {quotedText && (
          <div className={`mb-2 rounded-lg border px-2.5 py-1.5 ${
            isMe
              ? "border-accent/25 bg-accent/8"
              : "border-border/50 bg-muted/25"
          }`}>
            <div className="flex items-center gap-1.5">
              <Quotes className="h-3 w-3 text-muted-foreground/50" />
              <span className="text-[10px] text-muted-foreground/60">Resposta</span>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground/75 line-clamp-2">{quotedText}</p>
          </div>
        )}
        {content}
        <div className={`mt-1 flex items-center gap-1 ${isMe ? "justify-end" : "justify-start"}`}>
          <span className="text-[10px] text-muted-foreground/40">{time}</span>
          {isMe && <MessageTick status={msg.status} pending={isPending} />}
        </div>
        {canReplyOrReact && (
          <div className={`absolute -top-2 ${isMe ? "left-0 -translate-x-[calc(100%+8px)]" : "right-0 translate-x-[calc(100%+8px)]"} opacity-0 group-hover:opacity-100 transition-opacity`}>
            <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-popover/95 backdrop-blur px-1 py-1 shadow-lg shadow-black/20">
              <button
                type="button"
                onClick={() => onReply?.(msg as FirestoreMessage)}
                className="cursor-pointer flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-muted/40 transition-colors"
                title="Responder"
              >
                <ArrowBendUpLeft className="h-3.5 w-3.5" />
              </button>
              {REACTIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onReact?.(msg as FirestoreMessage, r)}
                  className="cursor-pointer flex h-6 w-6 items-center justify-center rounded-md text-[12px] hover:bg-muted/40 transition-colors"
                  title={`Reagir com ${r}`}
                >
                  {r}
                </button>
              ))}
              <div className="h-4 w-px bg-border/70 mx-0.5" />
              <Smiley className="h-3.5 w-3.5 text-muted-foreground/40 mx-1" />
            </div>
          </div>
        )}
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [attachment, setAttachment] = useState<PendingAttachment | null>(null)
  const [attachMenuOpen, setAttachMenuOpen] = useState(false)
  const [replyTo, setReplyTo] = useState<FirestoreMessage | null>(null)
  const [mediaViewer, setMediaViewer] = useState<MediaViewerPayload | null>(null)

  // Optimistic messages — keyed by a local temp ID, removed when Firestore confirms
  const [optimisticMsgs, setOptimisticMsgs] = useState<OptimisticMessage[]>([])

  // Audio recording
  const [recording, setRecording] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const recChunksRef = useRef<Blob[]>([])
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const prevCountRef = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)

  const { messages, loading: messagesLoading, loadMoreOlder, hasMoreOlder, loadingMore } = useMessages(
    tenantId,
    contact.id ?? null
  )
  const { contactTyping, agentTyping } = useTypingStatus(tenantId, contact.id ?? null)
  const { data: integrations } = useIntegrations()

  const displayName = contact.contactName ?? contact.name ?? contact.contactPhone ?? contact.phone ?? "?"
  const displayPhone = contact.contactPhone ?? contact.phone ?? ""
  const preferredInstanceId = contact.zapiInstanceId ?? ""
  const zapiInstances: Integration[] = useMemo(
    () => (integrations ?? []).filter((i) => i.provider === "zapi" && i.instanceId),
    [integrations]
  )
  const fallbackInstance = useMemo(
    () => zapiInstances.find((i) => i.isDefault) ?? zapiInstances[0] ?? null,
    [zapiInstances]
  )
  const routedInstanceId = preferredInstanceId || fallbackInstance?.instanceId || ""
  const routedInstanceLabel = useMemo(() => {
    if (!routedInstanceId) return null
    const exact = zapiInstances.find((i) => i.instanceId === routedInstanceId)
    return exact?.label || exact?.instanceId || routedInstanceId
  }, [routedInstanceId, zapiInstances])

  // Remove optimistic messages that have been confirmed by Firestore
  // (matched by content to avoid keeping ghosts)
  useEffect(() => {
    if (optimisticMsgs.length === 0) return
    setOptimisticMsgs((prev) =>
      prev.filter((opt) => !messages.some((m) => m.content === opt.content && m.role === "OPERATOR"))
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages])

  // Merged list: real messages first, then any still-pending optimistic ones
  const allMessages: AnyMessage[] = [
    ...messages,
    ...optimisticMsgs.filter((opt) => !messages.some((m) => m.content === opt.content && m.role === "OPERATOR")),
  ]

  const messageById = useRef(new Map<string, AnyMessage>())
  const messageByZapi = useRef(new Map<string, AnyMessage>())
  useEffect(() => {
    const byId = new Map<string, AnyMessage>()
    const byZapi = new Map<string, AnyMessage>()
    for (const m of allMessages) {
      byId.set(m.id, m)
      if (m.zapiMessageId) byZapi.set(m.zapiMessageId, m)
    }
    messageById.current = byId
    messageByZapi.current = byZapi
  }, [allMessages])

  const previewText = useCallback((m: AnyMessage | null | undefined) => {
    if (!m) return ""
    if (m.type === "TEXT") return m.content || "Mensagem"
    if (m.type === "IMAGE") return "📷 Imagem"
    if (m.type === "AUDIO") return "🎤 Áudio"
    if (m.type === "DOCUMENT") return "📄 Documento"
    if (m.type === "PIX_CHARGE") return "💳 Cobrança PIX"
    return m.content || "Mensagem"
  }, [])

  // Mark as read when chat is opened
  useEffect(() => {
    if ((contact.unreadCount ?? 0) > 0 && contact.id) markAsRead(contact.id).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contact.id])

  // Scroll to bottom on new messages — only when 1 new message (not load-more batch)
  const prevLenRef = useRef(allMessages.length)
  useEffect(() => {
    const prevLen = prevLenRef.current
    prevLenRef.current = allMessages.length
    if (allMessages.length > prevLen && allMessages.length - prevLen === 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [allMessages.length])

  const handleMessagesScroll = useCallback(async () => {
    const el = messagesContainerRef.current
    if (!el || !hasMoreOlder || loadingMore) return
    if (el.scrollTop < 80) {
      const prevHeight = el.scrollHeight
      const prevTop = el.scrollTop
      await loadMoreOlder()
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const container = messagesContainerRef.current
          if (container) container.scrollTop = prevTop + (container.scrollHeight - prevHeight)
        })
      })
    }
  }, [hasMoreOlder, loadingMore, loadMoreOlder])

  // Scroll to bottom when opening chat (after messages load)
  useEffect(() => {
    if (!messagesLoading && allMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" })
    }
  }, [contact.id, messagesLoading, allMessages.length])

  // Reset state when contact changes
  useEffect(() => {
    setInputValue("")
    setAttachment(null)
    setAttachMenuOpen(false)
    setReplyTo(null)
    setMediaViewer(null)
    setErrorMsg(null)
    setOptimisticMsgs([])
    stopRecording(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contact.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Error helper ────────────────────────────────────────────────────────────

  const showError = (msg: string) => {
    setErrorMsg(msg)
  }

  // ── Optimistic append helper ─────────────────────────────────────────────────

  const addOptimistic = useCallback((content: string, type: FirestoreMessage["type"] = "TEXT"): string => {
    const tempId = `opt_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const optimistic: OptimisticMessage = {
      _optimistic: true,
      id: tempId,
      role: "OPERATOR",
      type,
      content,
      status: "SENT",
      createdAt: { toDate: () => new Date() },
    }
    setOptimisticMsgs((prev) => [...prev, optimistic])
    return tempId
  }, [])

  // ── Send wrapper ────────────────────────────────────────────────────────────

  const doSend = useCallback(async (
    payload: Parameters<typeof sendMessage>[1],
    optimisticContent: string,
    restoreText?: string,
  ) => {
    if (!contact.id) { showError("Contato não encontrado"); return false }

    // Instant optimistic bubble
    const type = payload.type === "TEXT" ? "TEXT"
      : payload.type === "IMAGE" ? "IMAGE"
      : payload.type === "AUDIO" ? "AUDIO"
      : "DOCUMENT"
    const tempId = addOptimistic(optimisticContent, type as FirestoreMessage["type"])

    try {
      const routedPayload = routedInstanceId ? { ...payload, instanceId: routedInstanceId } : payload
      await sendMessage(contact.id, routedPayload)
      setAttachment(null)
      setAttachMenuOpen(false)
      return true
    } catch (err) {
      // Remove the ghost on failure
      setOptimisticMsgs((prev) => prev.filter((m) => m.id !== tempId))
      const msg = err instanceof Error ? err.message : "Falha ao enviar mensagem"
      showError(msg)
      if (restoreText) setInputValue(restoreText)
      return false
    }
  }, [contact.id, addOptimistic, routedInstanceId])

  const handleReplyMessage = useCallback((m: FirestoreMessage) => {
    if (!m.zapiMessageId) {
      showError("Essa mensagem ainda não pode ser usada para resposta")
      return
    }
    setReplyTo(m)
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [])

  const handleReactToMessage = useCallback(async (m: FirestoreMessage, reaction: string) => {
    if (!contact.id) return
    if (!m.zapiMessageId) {
      showError("Essa mensagem ainda não pode receber reação")
      return
    }
    try {
      await sendMessage(contact.id, {
        type: "REACTION",
        reaction,
        replyToZapiMessageId: m.zapiMessageId,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao reagir"
      showError(msg)
    }
  }, [contact.id])

  // ── Send text ───────────────────────────────────────────────────────────────

  const handleSendText = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    // If there's a pending attachment, send that
    if (attachment) {
      const base64 = await fileToBase64(attachment.file).catch(() => null)
      if (!base64) { showError("Erro ao processar arquivo"); return }

      const caption = inputValue.trim()
      if (attachment.kind === "image") {
        await doSend(
          { type: "IMAGE", mediaUrl: base64, caption: caption || undefined },
          caption || `📷 ${attachment.file.name}`,
        )
      } else {
        await doSend(
          { type: "DOCUMENT", mediaUrl: base64, fileName: attachment.file.name },
          `📄 ${attachment.file.name}`,
        )
      }
      setInputValue("")
      return
    }

    const text = inputValue.trim()
    if (!text) return
    setInputValue("")
    // Keep focus on the input so the user can type the next message immediately
    requestAnimationFrame(() => inputRef.current?.focus())
    const ok = await doSend(
      {
        type: "TEXT",
        text,
        replyToZapiMessageId: replyTo?.zapiMessageId,
      },
      text,
      text,
    )
    if (ok) setReplyTo(null)
  }, [attachment, inputValue, doSend, replyTo?.zapiMessageId])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      // Prevent browser from blurring the input on Enter
      e.currentTarget.focus()
      handleSendText(e as unknown as React.FormEvent)
    }
  }

  // ── File attachment ─────────────────────────────────────────────────────────

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const preview = URL.createObjectURL(file)
    setAttachment({ kind: "image", file, preview })
    setAttachMenuOpen(false)
    e.target.value = ""
  }

  const handleDocFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAttachment({ kind: "document", file })
    setAttachMenuOpen(false)
    e.target.value = ""
  }

  // ── Audio recording ─────────────────────────────────────────────────────────

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      recChunksRef.current = []
      recorder.ondataavailable = (e) => recChunksRef.current.push(e.data)
      recorder.start()
      recorderRef.current = recorder
      setRecording(true)
      setRecordSeconds(0)
      recTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000)
    } catch {
      showError("Permissão de microfone negada")
    }
  }

  const stopRecording = useCallback((send = true) => {
    if (recTimerRef.current) { clearInterval(recTimerRef.current); recTimerRef.current = null }
    const recorder = recorderRef.current
    if (!recorder) return
    if (send) {
      recorder.onstop = async () => {
        const blob = new Blob(recChunksRef.current, { type: "audio/ogg; codecs=opus" })
        const base64 = await fileToBase64(new File([blob], "audio.ogg")).catch(() => null)
        if (base64) await doSend({ type: "AUDIO", mediaUrl: base64 }, "🎤 Áudio")
        recorder.stream.getTracks().forEach((t) => t.stop())
      }
      recorder.stop()
    } else {
      recorder.stream.getTracks().forEach((t) => t.stop())
    }
    recorderRef.current = null
    setRecording(false)
    setRecordSeconds(0)
  }, [doSend])

  // ── Rendered ─────────────────────────────────────────────────────────────────

  const canSend = !!inputValue.trim() || !!attachment
  const showMicSend = !inputValue.trim() && !attachment && !recording

  return (
    <motion.div
      key={contact.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-1 flex-col min-h-0 overflow-hidden relative"
    >
      <MediaViewerModal media={mediaViewer} onClose={() => setMediaViewer(null)} />

      {/* ── Toast ── */}
      <AnimatePresence>
        {errorMsg && (
          <Toast key="toast" message={errorMsg} onDismiss={() => setErrorMsg(null)} />
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="flex min-h-16 shrink-0 items-center justify-between border-b border-border px-5 py-2">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar name={displayName} photoUrl={contact.photoUrl} size="sm" />
            {contactTyping && (
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 border-2 border-background animate-pulse" />
            )}
          </div>
          <div>
            <p className="text-[13px] font-semibold text-foreground leading-tight">{displayName}</p>
            <p className="text-[11px] text-muted-foreground/50 leading-tight font-mono">
              {contactTyping ? "digitando..." : agentTyping ? "agente escrevendo..." : displayPhone}
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
      <div
        ref={messagesContainerRef}
        onScroll={handleMessagesScroll}
        className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3"
      >
        {hasMoreOlder && (
          <div className="flex justify-center py-2">
            {loadingMore ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-5 w-5 rounded-full border-2 border-accent/20 border-t-accent"
              />
            ) : (
              <p className="text-[11px] text-muted-foreground/50">Role para cima para carregar mais</p>
            )}
          </div>
        )}
        {messagesLoading && allMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-5 w-5 rounded-full border-2 border-accent/20 border-t-accent"
            />
            <p className="text-[11px] text-muted-foreground/30">Carregando mensagens...</p>
          </div>
        )}

        {!messagesLoading && allMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/30 border border-border/40">
              <ChatCircleText className="h-6 w-6 text-muted-foreground/30" weight="duotone" />
            </div>
            <p className="text-[12px] text-muted-foreground/40">Nenhuma mensagem ainda</p>
          </div>
        )}

        {allMessages.map((msg, i) => {
          const refId = msg.referenceMessageId
          const refMsg = refId
            ? (messageById.current.get(refId) ?? messageByZapi.current.get(refId) ?? null)
            : null
          return (
            <MessageBubble
              key={msg.id}
              msg={msg}
              animate={i >= allMessages.length - 1}
              quotedText={previewText(refMsg)}
              onReply={handleReplyMessage}
              onReact={handleReactToMessage}
              onOpenMedia={setMediaViewer}
            />
          )
        })}

        <AnimatePresence>
          {contactTyping && <TypingIndicator key="ct" label="digitando" />}
          {agentTyping && <TypingIndicator key="at" label="agente escrevendo" />}
        </AnimatePresence>

        {/* Instance routing hint — only shown when tenant has multiple Z-API instances */}
        {zapiInstances.length > 1 && routedInstanceLabel && (
          <div className="flex items-center justify-center gap-1.5 py-1">
            <span className="h-px w-8 bg-border/40" />
            <span className="text-[10px] text-muted-foreground/35 select-none">
              via {routedInstanceLabel}
            </span>
            <span className="h-px w-8 bg-border/40" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input area ── */}
      <div className="shrink-0 border-t border-border">
        <AnimatePresence>
          {replyTo && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              className="mx-4 mt-2 rounded-lg border border-accent/20 bg-accent/8 px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-accent">Respondendo</p>
                  <p className="text-[11px] text-foreground/80 truncate">
                    {previewText(replyTo)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="cursor-pointer flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/30 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attachment preview */}
        <AnimatePresence>
          {attachment && (
            <div className="pt-2">
              <AttachmentPreview attachment={attachment} onRemove={() => setAttachment(null)} />
            </div>
          )}
        </AnimatePresence>

        {/* Attach menu */}
        <AnimatePresence>
          {attachMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.18, ease }}
              className="flex items-center gap-2 px-4 pt-3"
            >
              {/* Image */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer flex items-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-[11px] font-medium text-muted-foreground hover:bg-accent/10 hover:text-accent hover:border-accent/20 transition-all duration-200"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Imagem
              </button>
              {/* Document */}
              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                className="cursor-pointer flex items-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-[11px] font-medium text-muted-foreground hover:bg-accent/10 hover:text-accent hover:border-accent/20 transition-all duration-200"
              >
                <FileDoc className="h-3.5 w-3.5" />
                Documento
              </button>
              <button
                type="button"
                onClick={() => setAttachMenuOpen(false)}
                className="cursor-pointer ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" weight="bold" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input row */}
        <form onSubmit={handleSendText} className="flex items-center gap-2 px-4 py-3">
          {/* Hidden file inputs */}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
          <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" className="hidden" onChange={handleDocFile} />

          {/* Attach button */}
          {!recording && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => setAttachMenuOpen((v) => !v)}
              className={`cursor-pointer flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-150 ${
                attachMenuOpen
                  ? "bg-accent/15 text-accent"
                  : "text-muted-foreground/50 hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <Paperclip className="h-4 w-4" />
            </motion.button>
          )}

          {/* Recording indicator or text input */}
          <AnimatePresence mode="wait">
            {recording ? (
              <RecordingIndicator key="rec" seconds={recordSeconds} />
            ) : (
              <input
                key="input"
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={attachment ? "Adicionar legenda (opcional)..." : "Digite uma mensagem..."}
                className="flex-1 h-9 rounded-xl border border-border bg-card/50 px-4 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all duration-300"
              />
            )}
          </AnimatePresence>

          {/* Mic / Stop / Send */}
          <AnimatePresence mode="wait">
            {recording ? (
              // Stop recording → send
              <motion.button
                key="stop"
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => stopRecording(true)}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="cursor-pointer flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 border border-rose-500/25 text-rose-400 hover:bg-rose-500/25 transition-all"
              >
                <Stop className="h-4 w-4" weight="fill" />
              </motion.button>
            ) : showMicSend ? (
              // Mic button
              <motion.button
                key="mic"
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={startRecording}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="cursor-pointer flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 transition-colors duration-150"
              >
                <Microphone className="h-4 w-4" />
              </motion.button>
            ) : (
              // Send button
              <motion.button
                key="send"
                type="button"
                onClick={(e) => handleSendText(e as unknown as React.FormEvent)}
                whileTap={{ scale: 0.92 }}
                disabled={!canSend}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className={`cursor-pointer flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 disabled:cursor-default ${
                  canSend
                    ? "bg-accent text-accent-foreground shadow-md shadow-accent/20"
                    : "bg-muted/40 text-muted-foreground/40"
                }`}
              >
                <PaperPlaneTilt className="h-4 w-4" weight="fill" />
              </motion.button>
            )}
          </AnimatePresence>
        </form>
      </div>
    </motion.div>
  )
}

// ─── Legacy type re-export ────────────────────────────────────────────────────
export type { FirestoreContact as ChatContact }
