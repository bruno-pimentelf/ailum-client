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
  ArrowBendUpLeft,
  Smiley,
  Quotes,
  Warning,
  Clock,
  Play,
  Pause,
  ArrowsOutSimple,
  DownloadSimple,
  FilmStrip,
  Copy,
  TextAa,
  NoteBlank,
  NotePencil,
  Flask,
  Eye,
  ArrowsClockwise,
  CalendarPlus,
} from "@phosphor-icons/react"
import { QuickScheduleModal } from "./quick-schedule-modal"
import type { QuickScheduleContact } from "./quick-schedule-modal"
import { ResponsibleSelector } from "./responsible-selector"
import { PixChargeBlock } from "./pix-charge-block"
import { useMessages, useTypingStatus } from "@/hooks/use-chats"
import { useIntegrations } from "@/hooks/use-integrations"
import { useInstanceStore } from "@/lib/instance-store"
import type { Integration } from "@/lib/api/integrations"
import { sendMessage, markAsRead, createNote, describeImage, summarizeDocument, type SendMessageInput } from "@/lib/api/conversations"
import { ContactInfoPanel } from "@/components/app/contact-info-panel"
import { contactsApi } from "@/lib/api/contacts"
import { useMutation } from "@tanstack/react-query"
import { useTemplates } from "@/hooks/use-templates"
import type { MessageTemplate } from "@/lib/api/templates"
import { useTenant } from "@/hooks/use-tenant"
import type { FirestoreContact, FirestoreMessage, MessageReaction } from "@/lib/types/firestore"

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
  if (pending) return <Clock className="h-3 w-3 text-muted-foreground/85" />
  if (!status) return <Check className="h-3 w-3 text-muted-foreground/90" />
  if (status === "READ" || status === "PLAYED") return <Checks className="h-3 w-3 text-accent" />
  if (status === "RECEIVED") return <Checks className="h-3 w-3 text-muted-foreground/90" />
  return <Check className="h-3 w-3 text-muted-foreground/90" />
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

// ─── Format Date label ────────────────────────────────────────────────────────

function formatDateLabel(ts: { toDate: () => Date } | undefined): string {
  if (!ts) return ""
  try {
    const date = ts.toDate()
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    const isSameDay = (a: Date, b: Date) =>
      a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
    if (isSameDay(date, today)) return "Hoje"
    if (isSameDay(date, yesterday)) return "Ontem"
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
  } catch {
    return ""
  }
}

function getMsgDateKey(ts: { toDate: () => Date } | undefined): string {
  if (!ts) return ""
  try {
    const d = ts.toDate()
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  } catch {
    return ""
  }
}

// ─── Linkify text ─────────────────────────────────────────────────────────────

// Email regex — must run before URL regex so emails aren't partially matched as domains
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

// Matches:
//   - Full URLs: http(s)://... or ftp://...
//   - www. prefixed: www.example.com
//   - wa.me/... links (WhatsApp)
//   - Bare domains with common TLDs (with optional path/query): example.com, example.com.br/path
const URL_REGEX =
  /(?:https?:\/\/|ftp:\/\/|www\.)[^\s<>"')\]]+|(?:^|(?<=\s))(?:wa\.me\/[^\s<>"')\]]+)|(?<![/@\w])(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+(?:com|net|org|io|app|dev|ai|br|co|uk|de|fr|pt|me|info|online|store|tech|gov|edu|mil|int|mobi|biz|pro|tv|cc|us|ca|au|jp|cn|in|mx|ar|cl|pe|uy|py|bo|ec|ve|co\.uk|com\.br|com\.ar|com\.mx|com\.au|co\.jp|net\.br|org\.br|gov\.br|edu\.br)(?:\/[^\s<>"')\]]*)?(?=[^\w]|$)/gi

// Combined regex: emails first, then URLs (order matters — first match wins)
const LINK_REGEX = new RegExp(`(${EMAIL_REGEX.source})|(${URL_REGEX.source})`, "gi")

function normalizeHref(url: string): string {
  if (/^(?:https?|ftp):\/\//i.test(url)) return url
  return `https://${url}`
}

// WhatsApp-style formatting: *bold*, _italic_, ~strikethrough_, ```monospace```
function formatWhatsAppText(text: string): React.ReactNode[] {
  // Order matters: monospace first (greedy), then bold, italic, strikethrough
  const WA_REGEX = /```([\s\S]+?)```|\*(.+?)\*|_(.+?)_|~(.+?)~/g
  const result: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = WA_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push(text.slice(lastIndex, match.index))
    }
    if (match[1] != null) {
      result.push(<code key={match.index} className="px-1 py-0.5 rounded bg-foreground/[0.06] text-[12px] font-mono">{match[1]}</code>)
    } else if (match[2] != null) {
      result.push(<strong key={match.index} className="font-semibold">{match[2]}</strong>)
    } else if (match[3] != null) {
      result.push(<em key={match.index}>{match[3]}</em>)
    } else if (match[4] != null) {
      result.push(<s key={match.index} className="opacity-60">{match[4]}</s>)
    }
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex))
  }
  return result
}

const MSG_COLLAPSE_THRESHOLD = 700

function LinkifiedText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  const shouldCollapse = text.length > MSG_COLLAPSE_THRESHOLD
  const displayText = shouldCollapse && !expanded ? text.slice(0, MSG_COLLAPSE_THRESHOLD) : text

  // Build segments by walking LINK_REGEX matches
  const segments: { text: string; isLink: boolean; isEmail: boolean }[] = []
  let lastIdx = 0
  LINK_REGEX.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = LINK_REGEX.exec(displayText)) !== null) {
    if (m.index > lastIdx) segments.push({ text: displayText.slice(lastIdx, m.index), isLink: false, isEmail: false })
    const isEmail = /^[^@]+@/.test(m[0])
    segments.push({ text: m[0], isLink: true, isEmail })
    lastIdx = m.index + m[0].length
  }
  if (lastIdx < displayText.length) segments.push({ text: displayText.slice(lastIdx), isLink: false, isEmail: false })

  return (
    <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">
      {segments.map((seg, i) =>
        seg.isLink ? (
          <a
            key={i}
            href={seg.isEmail ? `mailto:${seg.text}` : normalizeHref(seg.text)}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 text-accent hover:text-accent/80 transition-colors break-all"
          >
            {seg.text}
          </a>
        ) : (
          <span key={i}>{formatWhatsAppText(seg.text)}</span>
        )
      )}
      {shouldCollapse && !expanded && (
        <>
          {"... "}
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="inline text-accent hover:text-accent/80 font-medium cursor-pointer"
          >
            Ver mais
          </button>
        </>
      )}
      {shouldCollapse && expanded && (
        <>
          {" "}
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="inline text-accent hover:text-accent/80 font-medium cursor-pointer"
          >
            Ver menos
          </button>
        </>
      )}
    </p>
  )
}

// ─── Date Divider ─────────────────────────────────────────────────────────────

function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1 select-none">
      <div className="flex-1 h-px bg-border/40" />
      <span className="text-[10px] font-semibold text-muted-foreground/70 bg-background/60 px-2.5 py-0.5 rounded-full border border-border/30 backdrop-blur-sm">
        {label}
      </span>
      <div className="flex-1 h-px bg-border/40" />
    </div>
  )
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
      className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-xl border border-rose-500/25 bg-overlay px-4 py-2.5 shadow-xl"
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

function DocumentPreview({ attachment, onRemove }: { attachment: PendingAttachment & { kind: "document" }; onRemove: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2, ease }}
      className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-3 py-2 mx-4 mb-1"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-muted/30">
        <FileDoc className="h-4 w-4 text-muted-foreground/90" />
      </div>
      <span className="text-[12px] text-foreground/70 truncate flex-1">{attachment.file.name}</span>
      <button
        type="button"
        onClick={onRemove}
        className="cursor-pointer shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-muted/50 text-muted-foreground/90 hover:bg-rose-500/15 hover:text-rose-400 transition-colors"
      >
        <X className="h-3 w-3" weight="bold" />
      </button>
    </motion.div>
  )
}

function ImagePreviewOverlay({
  attachment,
  caption,
  onCaptionChange,
  onSend,
  onClose,
}: {
  attachment: PendingAttachment & { kind: "image" }
  caption: string
  onCaptionChange: (v: string) => void
  onSend: () => void
  onClose: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { inputRef.current?.focus() }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-xl"
    >
      {/* Top bar */}
      <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-border/40">
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" weight="bold" />
          Fechar
        </button>
        <span className="text-[12px] text-muted-foreground/70 truncate max-w-[200px]">{attachment.file.name}</span>
      </div>

      {/* Image preview */}
      <div className="flex-1 min-h-0 flex items-center justify-center p-6 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={attachment.preview}
          alt="preview"
          className="max-w-full max-h-full object-contain rounded-xl border border-border/30 shadow-lg shadow-black/20"
        />
      </div>

      {/* Caption + send */}
      <div className="shrink-0 border-t border-border/40 px-5 py-3">
        <form
          onSubmit={(e) => { e.preventDefault(); onSend() }}
          className="flex items-center gap-3"
        >
          <input
            ref={inputRef}
            value={caption}
            onChange={(e) => onCaptionChange(e.target.value)}
            placeholder="Adicionar legenda..."
            className="flex-1 h-9 rounded-xl border border-border bg-card/50 px-4 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all duration-300"
          />
          <motion.button
            type="submit"
            whileTap={{ scale: 0.95 }}
            className="cursor-pointer flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground hover:brightness-110 transition-all"
          >
            <PaperPlaneTilt className="h-4 w-4" weight="fill" />
          </motion.button>
        </form>
      </div>
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
      <span className="text-[11px] text-muted-foreground/90 ml-auto">Gravando...</span>
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

// Generate deterministic waveform bars from URL hash
function generateWaveformBars(url: string, count: number): number[] {
  let hash = 0
  for (let i = 0; i < url.length; i++) hash = ((hash << 5) - hash + url.charCodeAt(i)) | 0
  return Array.from({ length: count }, (_, i) => {
    const v = Math.abs(Math.sin(hash * (i + 1) * 0.1)) * 0.7 + 0.3
    return v
  })
}

const PLAYBACK_SPEEDS = [1, 1.5, 2] as const

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
  const progressRef = useRef<HTMLDivElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [speedIdx, setSpeedIdx] = useState(0)
  const [seeking, setSeeking] = useState(false)

  const bars = useMemo(() => generateWaveformBars(url, compact ? 28 : 40), [url, compact])

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const onLoaded = () => setDuration(el.duration || 0)
    const onTime = () => { if (!seeking) setCurrentTime(el.currentTime || 0) }
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
  }, [seeking])

  const togglePlay = async () => {
    const el = audioRef.current
    if (!el) return
    if (el.paused) { try { await el.play() } catch {} return }
    el.pause()
  }

  const cycleSpeed = () => {
    const next = (speedIdx + 1) % PLAYBACK_SPEEDS.length
    setSpeedIdx(next)
    if (audioRef.current) audioRef.current.playbackRate = PLAYBACK_SPEEDS[next]
  }

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current
    const bar = progressRef.current
    if (!el || !bar || !duration) return
    const rect = bar.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    el.currentTime = ratio * duration
    setCurrentTime(ratio * duration)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!seeking) return
    seekTo(e)
  }

  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0
  const speed = PLAYBACK_SPEEDS[speedIdx]

  return (
    <div className={`min-w-[200px] rounded-xl border border-border/60 bg-muted/20 p-2.5 ${compact ? "w-[260px]" : "w-full max-w-[320px]"}`}>
      <audio ref={audioRef} src={url} preload="metadata" />
      <div className="flex items-center gap-2">
        {/* Play/Pause */}
        <button type="button" onClick={togglePlay}
          className="cursor-pointer flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-card/90 text-foreground/85 hover:bg-accent/15 hover:text-accent transition-colors"
          aria-label={playing ? "Pausar" : "Reproduzir"}>
          {playing ? <Pause className="h-4 w-4" weight="fill" /> : <Play className="h-4 w-4 ml-0.5" weight="fill" />}
        </button>

        {/* Waveform + seek */}
        <div className="flex-1 min-w-0">
          <div
            ref={progressRef}
            className="flex items-end gap-px h-6 cursor-pointer"
            onClick={seekTo}
            onMouseDown={(e) => { setSeeking(true); seekTo(e) }}
            onMouseMove={handleMouseMove}
            onMouseUp={() => setSeeking(false)}
            onMouseLeave={() => setSeeking(false)}
          >
            {bars.map((h, i) => {
              const barProgress = i / bars.length
              const isPast = barProgress < progress
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-colors duration-100 ${
                    isPast ? "bg-accent" : "bg-muted-foreground/25"
                  }`}
                  style={{ height: `${h * 100}%`, minHeight: 3 }}
                />
              )
            })}
          </div>
          <div className="mt-0.5 flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted-foreground/80">{formatAudioTime(currentTime)}</span>
            <span className="text-[10px] font-mono text-muted-foreground/50">{formatAudioTime(duration)}</span>
          </div>
        </div>

        {/* Speed + expand */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <button type="button" onClick={cycleSpeed}
            className={`cursor-pointer flex h-6 items-center justify-center rounded-md px-1.5 text-[9px] font-bold transition-colors ${
              speed !== 1
                ? "bg-accent/15 text-accent border border-accent/25"
                : "text-muted-foreground/50 hover:text-muted-foreground/80"
            }`}>
            {speed}x
          </button>
          {onOpenFull && (
            <button type="button" onClick={onOpenFull}
              className="cursor-pointer flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 transition-colors"
              title="Expandir">
              <ArrowsOutSimple className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function AudioTranscription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = text.length > 120

  return (
    <div className="rounded-lg border border-border/40 bg-muted/10 px-3 py-2 max-w-[230px]">
      <div className="flex items-center gap-1.5 mb-1">
        <TextAa className="h-3 w-3 text-muted-foreground/60 shrink-0" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50">Transcrição</span>
      </div>
      <p className={`text-[11px] text-foreground/70 leading-relaxed ${!expanded && isLong ? "line-clamp-3" : ""}`}>
        {text}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="cursor-pointer mt-1 text-[10px] font-semibold text-accent/70 hover:text-accent transition-colors"
        >
          {expanded ? "Ver menos" : "Ver mais"}
        </button>
      )}
    </div>
  )
}

function ImageDescription({
  contactId,
  messageId,
  cachedDescription,
}: {
  contactId: string
  messageId: string
  cachedDescription: string | null
}) {
  const [description, setDescription] = useState<string | null>(cachedDescription)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [error, setError] = useState(false)

  async function handleDescribe() {
    setLoading(true)
    setError(false)
    try {
      const res = await describeImage(contactId, messageId)
      setDescription(res.description)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  if (!description) {
    return (
      <button
        type="button"
        onClick={handleDescribe}
        disabled={loading}
        className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-border/40 bg-muted/10 px-2.5 py-1.5 text-[10px] text-muted-foreground/70 hover:text-foreground hover:bg-muted/20 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <ArrowsClockwise className="h-3 w-3 animate-spin" />
        ) : (
          <Eye className="h-3 w-3" />
        )}
        {loading ? "Descrevendo..." : error ? "Tentar novamente" : "Descrever imagem"}
      </button>
    )
  }

  const isLong = description.length > 120

  return (
    <div className="rounded-lg border border-border/40 bg-muted/10 px-3 py-2 max-w-[260px]">
      <div className="flex items-center gap-1.5 mb-1">
        <Eye className="h-3 w-3 text-muted-foreground/60 shrink-0" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50">Descrição</span>
      </div>
      <p className={`text-[11px] text-foreground/70 leading-relaxed ${!expanded && isLong ? "line-clamp-3" : ""}`}>
        {description}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="cursor-pointer mt-1 text-[10px] font-semibold text-accent/70 hover:text-accent transition-colors"
        >
          {expanded ? "Ver menos" : "Ver mais"}
        </button>
      )}
    </div>
  )
}

function DocumentSummary({
  contactId,
  messageId,
  cachedSummary,
}: {
  contactId: string
  messageId: string
  cachedSummary: string | null
}) {
  const [summary, setSummary] = useState<string | null>(cachedSummary)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [error, setError] = useState(false)

  async function handleSummarize() {
    setLoading(true)
    setError(false)
    try {
      const res = await summarizeDocument(contactId, messageId)
      setSummary(res.summary)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  if (!summary) {
    return (
      <button
        type="button"
        onClick={handleSummarize}
        disabled={loading}
        className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-border/40 bg-muted/10 px-2.5 py-1.5 text-[10px] text-muted-foreground/70 hover:text-foreground hover:bg-muted/20 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <ArrowsClockwise className="h-3 w-3 animate-spin" />
        ) : (
          <FileDoc className="h-3 w-3" />
        )}
        {loading ? "Resumindo..." : error ? "Tentar novamente" : "Resumir documento"}
      </button>
    )
  }

  const isLong = summary.length > 150

  return (
    <div className="rounded-lg border border-border/40 bg-muted/10 px-3 py-2 max-w-[260px]">
      <div className="flex items-center gap-1.5 mb-1">
        <FileDoc className="h-3 w-3 text-muted-foreground/60 shrink-0" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50">Resumo</span>
      </div>
      <p className={`text-[11px] text-foreground/70 leading-relaxed ${!expanded && isLong ? "line-clamp-4" : ""}`}>
        {summary}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="cursor-pointer mt-1 text-[10px] font-semibold text-accent/70 hover:text-accent transition-colors"
        >
          {expanded ? "Ver menos" : "Ver mais"}
        </button>
      )}
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
          className="relative w-full max-w-[840px] overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xl"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border/70 px-4 py-3">
            <p className="truncate text-[12px] font-medium text-foreground/85">
              {media.type === "document" ? media.fileName || "Documento" : "Visualização de mídia"}
            </p>
            <div className="flex items-center gap-1.5">
              <a
                href={media.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground/85 hover:text-foreground hover:bg-foreground/10 transition-colors"
                title="Abrir em nova aba"
              >
                <ArrowsOutSimple className="h-4 w-4" />
              </a>
              {media.type === "document" && (
                <a
                  href={media.url}
                  download={media.fileName ?? undefined}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground/85 hover:text-foreground hover:bg-foreground/10 transition-colors"
                  title="Baixar"
                >
                  <DownloadSimple className="h-4 w-4" />
                </a>
              )}
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-lg text-foreground/85 hover:text-foreground hover:bg-foreground/10 transition-colors"
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
              <div className="h-[72vh] overflow-hidden rounded-xl border border-border/70 bg-black/20">
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
  contactId,
  animate,
  quotedText,
  onReply,
  onReact,
  onOpenMedia,
}: {
  msg: AnyMessage
  contactId: string
  animate?: boolean
  quotedText?: string | null
  onReply?: (m: FirestoreMessage) => void
  onReact?: (m: FirestoreMessage, reaction: string) => void
  onOpenMedia?: (media: MediaViewerPayload) => void
}) {
  const isPending = "_optimistic" in msg && msg._optimistic
  const isNote = msg.role === "NOTE"
  const isMe = msg.role === "OPERATOR" || msg.role === "AGENT"
  const isAgent = msg.role === "AGENT"
  const time = formatTime(msg.createdAt)
  const canReplyOrReact = !isPending && !isNote && !!msg.zapiMessageId

  // ── NOTE (internal note — aligned right like operator messages) ──
  if (isNote) {
    return (
      <motion.div
        initial={animate ? { opacity: 0, y: 6 } : false}
        animate={{ opacity: isPending ? 0.6 : 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-end gap-2 justify-end"
      >
        <div className="max-w-[75%] rounded-2xl rounded-br-sm border border-amber-500/20 bg-amber-500/[0.06] px-3.5 py-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <NoteBlank className="h-3 w-3 text-amber-400/70" weight="fill" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400/60">Nota interna</span>
          </div>
          <p className="text-[12px] text-foreground/80 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
          <div className="flex items-center justify-end mt-1 gap-1.5">
            <span className="text-[10px] text-amber-400/40">{time}</span>
          </div>
        </div>
      </motion.div>
    )
  }
  const QUICK_REACTIONS = ["❤️", "👍", "🙏", "😂"] as const
  const [copied, setCopied] = useState(false)
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!emojiPickerOpen) return
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setEmojiPickerOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [emojiPickerOpen])

  const copyableText = msg.type === "TEXT" || !msg.type ? msg.content : null

  // Reactions: filter out empty-emoji entries (deleted reactions)
  const activeReactions = (msg.reactions ?? []).filter((r) => r.emoji !== "")

  const EMOJI_GRID = [
    "❤️","👍","👎","😂","😮","😢","😡","🙏",
    "🔥","🎉","👏","💯","✅","🤔","😍","🥰",
    "😎","🤣","😅","😭","🥺","😤","🤯","😱",
    "💪","🙌","👀","✨","💀","🫡","🤝","🫶",
  ]

  const handleCopy = () => {
    if (!copyableText) return
    navigator.clipboard.writeText(copyableText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  const bubbleCls = `max-w-[72%] rounded-2xl transition-opacity duration-300 ${
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
      const cachedImageDesc = ((m as Record<string, unknown>)?.imageDescription as string) || null

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
              <span className="pointer-events-none absolute bottom-2 right-2 rounded-full border border-border bg-black/40 px-2 py-1 text-[10px] text-foreground/85">
                Toque para ampliar
              </span>
            </button>
            {caption && <p className="text-[12px] text-foreground/80">{caption}</p>}
            <ImageDescription contactId={contactId} messageId={msg.id} cachedDescription={cachedImageDesc} />
          </div>
        )
      }

      // Sent by operator — imageUrl not yet populated by backend
      return (
        <div className="space-y-1.5">
          <div className="flex h-24 w-[200px] items-center justify-center rounded-xl border border-border/40 bg-muted/20">
            <ImageIcon className="h-6 w-6 text-muted-foreground/85" />
          </div>
          {caption && <p className="text-[12px] text-foreground/80">{caption}</p>}
        </div>
      )
    }

    // ── AUDIO ──────────────────────────────────────────────────────────────────
    if (msg.type === "AUDIO") {
      const transcription = ((m as Record<string, unknown>)?.transcription as string) || null
      const hasTranscription = !!transcription && transcription !== "[Mensagem de voz]" && transcription !== "[Áudio]"

      if (m?.audioUrl) {
        return (
          <div className="space-y-1.5">
            <AudioMessagePlayer
              url={m.audioUrl}
              compact
              onOpenFull={() => onOpenMedia?.({ type: "audio", url: m.audioUrl as string })}
            />
            {hasTranscription && <AudioTranscription text={transcription!} />}
          </div>
        )
      }
      // Sent by operator — audioUrl not yet populated
      return (
        <div className="flex items-center gap-2 min-w-[160px]">
          <SpeakerHigh className="h-4 w-4 text-muted-foreground/90 shrink-0" />
          <span className="text-[12px] text-muted-foreground/85 italic">Áudio enviado</span>
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
              <span className="pointer-events-none absolute inset-x-0 bottom-2 mx-auto flex w-fit items-center gap-1.5 rounded-full border border-border bg-black/45 px-2.5 py-1 text-[10px] text-foreground/85">
                <FilmStrip className="h-3 w-3" />
                Abrir vídeo
              </span>
            </button>
            {m.caption && <p className="text-[12px] text-foreground/80">{m.caption}</p>}
          </div>
        )
      }

      const fileName = m?.fileName || msg.content || "Documento"
      const fName = (fileName as string).toLowerCase()
      const mimeStr = ((m?.mimeType as string) ?? "").toLowerCase()
      const canSummarize = m?.documentUrl && (
        mimeStr.includes("pdf") || fName.endsWith(".pdf") ||
        mimeStr.includes("wordprocessingml") || mimeStr.includes("msword") ||
        fName.endsWith(".docx") || fName.endsWith(".doc")
      )
      const cachedDocSummary = ((m as Record<string, unknown>)?.documentSummary as string) || null

      if (m?.documentUrl) {
        return (
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => onOpenMedia?.({ type: "document", url: m.documentUrl as string, fileName })}
              className="flex items-center gap-2.5 group"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/40 bg-muted/30 group-hover:bg-accent/10 transition-colors">
                <FileDoc className="h-4 w-4 text-muted-foreground/90 group-hover:text-accent transition-colors" />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-medium truncate max-w-[180px] group-hover:text-accent transition-colors">
                  {fileName}
                </p>
                <p className="text-[10px] text-muted-foreground/90">Toque para visualizar</p>
              </div>
            </button>
            {canSummarize && (
              <DocumentSummary contactId={contactId} messageId={msg.id} cachedSummary={cachedDocSummary} />
            )}
          </div>
        )
      }

      // Sent by operator — documentUrl not yet populated
      return (
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/40 bg-muted/20">
            <FileDoc className="h-4 w-4 text-muted-foreground/90" />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-medium truncate max-w-[180px] text-foreground/70">{fileName}</p>
            <p className="text-[10px] text-muted-foreground/90">Processando...</p>
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
      return <LinkifiedText text={msg.content} />
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
            <MapPin className="h-4 w-4 text-muted-foreground/90 group-hover:text-emerald-400 transition-colors" weight="fill" />
          </div>
          <div>
            <p className="text-[12px] font-medium group-hover:text-emerald-400 transition-colors">
              {msg.content || m.address || "Ver localização"}
            </p>
            <p className="text-[10px] text-muted-foreground/90">Abrir no Maps</p>
          </div>
        </a>
      )
    }

    // ── CONTACT vCard ──────────────────────────────────────────────────────────
    if (m?.mediaKind === "contact" && m.contactName) {
      return (
        <div className="flex items-center gap-2.5">
          <UserCircle className="h-9 w-9 text-muted-foreground/90 shrink-0" weight="duotone" />
          <div>
            <p className="text-[12px] font-semibold">{m.contactName}</p>
            {m.contactPhone && (
              <p className="text-[11px] text-muted-foreground/90 font-mono">{m.contactPhone}</p>
            )}
          </div>
        </div>
      )
    }

    // Fallback — render content as plain text
    return <LinkifiedText text={msg.content} />
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
      <div className={`group relative ${bubbleCls} ${activeReactions.length > 0 ? "mb-3" : ""}`}>
        {/* Content area */}
        <div className="px-4 pt-2.5 pb-2">
          {quotedText && (
            <div className={`mb-2 rounded-lg border px-2.5 py-1.5 ${
              isMe
                ? "border-accent/25 bg-accent/8"
                : "border-border/50 bg-muted/25"
            }`}>
              <div className="flex items-center gap-1.5">
                <Quotes className="h-3 w-3 text-muted-foreground/85" />
                <span className="text-[10px] text-muted-foreground/90">Resposta</span>
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground/88 line-clamp-2">{quotedText}</p>
            </div>
          )}
          {content}
        </div>
        {/* Divider */}
        <div className={`mx-3 h-px ${isMe ? "bg-accent/15" : "bg-border/40"}`} />
        {/* Footer: time + copy */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 ${isMe ? "justify-end" : "justify-between"}`}>
          {!isMe && copyableText && (
            <button
              type="button"
              onClick={handleCopy}
              className="cursor-pointer flex items-center justify-center h-5 w-5 rounded-md text-muted-foreground/50 hover:text-muted-foreground/90 hover:bg-muted/30 transition-colors"
              title="Copiar mensagem"
            >
              {copied
                ? <Check className="h-3 w-3 text-accent" weight="bold" />
                : <Copy className="h-3 w-3" />
              }
            </button>
          )}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground/75">{time}</span>
            {isMe && <MessageTick status={msg.status} pending={isPending} />}
          </div>
          {isMe && copyableText && (
            <button
              type="button"
              onClick={handleCopy}
              className="cursor-pointer flex items-center justify-center h-5 w-5 rounded-md text-muted-foreground/50 hover:text-muted-foreground/90 hover:bg-muted/30 transition-colors"
              title="Copiar mensagem"
            >
              {copied
                ? <Check className="h-3 w-3 text-accent" weight="bold" />
                : <Copy className="h-3 w-3" />
              }
            </button>
          )}
        </div>
        {/* Reactions pill — always anchored to the left */}
        {activeReactions.length > 0 && (
          <div className="absolute -bottom-3 left-2 flex items-center gap-0.5">
            <div className="flex items-center gap-0.5 rounded-full border border-border/50 bg-popover/95 backdrop-blur px-1.5 py-0.5 shadow-sm shadow-black/20">
              {activeReactions.map((r, i) => (
                <span
                  key={i}
                  className="text-[13px] leading-none"
                  title={r.fromMe ? "Você" : "Contato"}
                >
                  {r.emoji}
                </span>
              ))}
            </div>
          </div>
        )}
        {canReplyOrReact && (
          <div ref={pickerRef} className={`absolute bottom-0 ${isMe ? "right-full mr-2" : "left-full ml-2"} opacity-0 group-hover:opacity-100 transition-opacity z-20`}>
            <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-popover/95 backdrop-blur px-1 py-1 shadow-lg shadow-black/20">
              <button
                type="button"
                onClick={() => onReply?.(msg as FirestoreMessage)}
                className="cursor-pointer flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/85 hover:text-foreground hover:bg-muted/40 transition-colors"
                title="Responder"
              >
                <ArrowBendUpLeft className="h-3.5 w-3.5" />
              </button>
              {QUICK_REACTIONS.map((r) => (
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
              {/* More emojis button */}
              <button
                type="button"
                onClick={() => setEmojiPickerOpen((v) => !v)}
                className={`cursor-pointer flex h-6 w-6 items-center justify-center rounded-md transition-colors ${
                  emojiPickerOpen
                    ? "bg-accent/20 text-accent"
                    : "text-muted-foreground/85 hover:text-foreground hover:bg-muted/40"
                }`}
                title="Mais emojis"
              >
                <Smiley className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Emoji picker panel */}
            <AnimatePresence>
              {emojiPickerOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 4 }}
                  transition={{ duration: 0.15, ease }}
                  className={`absolute bottom-full mb-1.5 z-30 rounded-xl border border-border/60 bg-popover/98 backdrop-blur-md shadow-xl shadow-foreground/8 p-2 ${
                    isMe ? "right-0" : "left-0"
                  }`}
                >
                  <div className="grid grid-cols-8 gap-0.5 w-[224px]">
                    {EMOJI_GRID.map((emoji) => {
                      const myReaction = activeReactions.find((r) => r.fromMe)
                      const isActive = myReaction?.emoji === emoji
                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            onReact?.(msg as FirestoreMessage, isActive ? "" : emoji)
                            setEmojiPickerOpen(false)
                          }}
                          className={`cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg text-[16px] transition-all hover:scale-110 hover:bg-muted/40 ${
                            isActive ? "bg-accent/20 ring-1 ring-accent/40" : ""
                          }`}
                          title={emoji}
                        >
                          {emoji}
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator({ label, side = "left" }: { label: string; side?: "left" | "right" }) {
  const isRight = side === "right"
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2, ease }}
      className={`flex items-center gap-2 ${isRight ? "flex-row-reverse" : ""}`}
    >
      {!isRight && <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/40" />}
      <div className={`rounded-2xl border border-border/60 px-4 py-2.5 flex items-center gap-1.5 ${isRight ? "rounded-br-sm bg-accent/15" : "rounded-bl-sm bg-card"}`}>
        <span className="text-[11px] text-muted-foreground/85 italic">{label}</span>
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

// ─── Template Picker ──────────────────────────────────────────────────────────

const TEMPLATE_TYPE_META: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  TEXT:     { icon: TextAa,       label: "Texto",     color: "text-sky-400" },
  IMAGE:    { icon: ImageIcon,    label: "Imagem",    color: "text-violet-400" },
  AUDIO:    { icon: SpeakerHigh,  label: "Áudio",     color: "text-emerald-400" },
  VIDEO:    { icon: FilmStrip,    label: "Vídeo",     color: "text-orange-400" },
  DOCUMENT: { icon: FileDoc,      label: "Documento", color: "text-rose-400" },
}

function TemplatePicker({
  query,
  templates,
  selectedIndex,
  onSelect,
}: {
  query: string
  templates: MessageTemplate[]
  selectedIndex: number
  onSelect: (template: MessageTemplate) => void
}) {
  const filtered = templates.filter((t) => {
    const q = query.toLowerCase()
    return t.name.toLowerCase().includes(q) || t.key.toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q)
  })

  if (filtered.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.15 }}
        className="absolute bottom-full left-0 right-0 mb-2 mx-4 rounded-xl border border-border/60 bg-popover shadow-xl shadow-foreground/8 overflow-hidden z-50"
      >
        <div className="px-4 py-6 text-center">
          <p className="text-[12px] text-muted-foreground/50">Nenhum template encontrado</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.15 }}
      className="absolute bottom-full left-0 right-0 mb-2 mx-4 rounded-xl border border-border/60 bg-popover shadow-xl shadow-foreground/8 overflow-hidden z-50"
    >
      <div className="px-3 py-2 border-b border-border/40">
        <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">Templates</p>
      </div>
      <div className="max-h-[280px] overflow-y-auto py-1">
        {filtered.map((t, i) => {
          const meta = TEMPLATE_TYPE_META[t.type] ?? TEMPLATE_TYPE_META.TEXT!
          const TypeIcon = meta.icon
          const isActive = i === selectedIndex
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t)}
              onMouseDown={(e) => e.preventDefault()}
              className={`cursor-pointer w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors ${
                isActive ? "bg-accent/10" : "hover:bg-muted/30"
              }`}
            >
              <div className={`shrink-0 mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg border border-border/40 bg-card/30 ${meta.color}`}>
                <TypeIcon className="h-4 w-4" weight="duotone" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[12px] font-semibold text-foreground/90 truncate">{t.name}</p>
                  <span className="shrink-0 text-[9px] font-mono text-muted-foreground/40">/{t.key}</span>
                  {t.steps && Array.isArray(t.steps) && t.steps.length > 1 && (
                    <span className="shrink-0 rounded bg-violet-500/15 border border-violet-500/20 px-1 py-px text-[9px] font-semibold text-violet-400">{t.steps.length} etapas</span>
                  )}
                </div>
                {t.type === "TEXT" ? (
                  <p className="text-[11px] text-muted-foreground/60 line-clamp-2 mt-0.5 leading-relaxed">{t.body}</p>
                ) : (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[10px] font-medium ${meta.color}`}>{meta.label}</span>
                    {t.caption && <span className="text-[10px] text-muted-foreground/40 truncate">— {t.caption}</span>}
                  </div>
                )}
                {t.variables.length > 0 && (
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    {t.variables.map((v) => (
                      <span key={v} className="rounded bg-accent/10 border border-accent/15 px-1 py-px text-[9px] font-mono text-accent/70">{`{{${v}}}`}</span>
                    ))}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
      <div className="px-3 py-1.5 border-t border-border/40 flex items-center gap-3">
        <span className="text-[9px] text-muted-foreground/40">↑↓ navegar</span>
        <span className="text-[9px] text-muted-foreground/40">Enter selecionar</span>
        <span className="text-[9px] text-muted-foreground/40">Esc fechar</span>
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
  const [draggingOver, setDraggingOver] = useState(false)
  const dragCounterRef = useRef(0)
  const [replyTo, setReplyTo] = useState<FirestoreMessage | null>(null)
  const [mediaViewer, setMediaViewer] = useState<MediaViewerPayload | null>(null)

  // Optimistic messages — keyed by a local temp ID, removed when Firestore confirms
  const [optimisticMsgs, setOptimisticMsgs] = useState<OptimisticMessage[]>([])

  // Optimistic reactions — keyed by messageId, overrides msg.reactions until onSnapshot confirms
  const [optimisticReactions, setOptimisticReactions] = useState<Record<string, MessageReaction[]>>({})

  // Note mode
  const [noteMode, setNoteMode] = useState(false)
  // Profile panel
  const [showProfile, setShowProfile] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  // Template picker
  const { data: allTemplates } = useTemplates()
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false)
  const [templateQuery, setTemplateQuery] = useState("")
  const [templateSelectedIdx, setTemplateSelectedIdx] = useState(0)

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
  const { data: tenant } = useTenant()
  const [isAiEnabled, setIsAiEnabled] = useState(contact.isAiEnabled !== false)
  const aiToggle = useMutation({
    mutationFn: (enabled: boolean) => contactsApi.toggleAi(contact.id!, enabled),
    onMutate: (enabled) => setIsAiEnabled(enabled),
  })

  // Sync from Firestore when contact changes
  useEffect(() => { setIsAiEnabled(contact.isAiEnabled !== false) }, [contact.isAiEnabled])
  const preferredInstanceId = contact.zapiInstanceId ?? ""
  const zapiInstances: Integration[] = useMemo(
    () => (integrations ?? []).filter((i) => i.provider === "zapi" && i.instanceId),
    [integrations]
  )
  const fallbackInstance = useMemo(
    () => zapiInstances[0] ?? null,
    [zapiInstances]
  )
  const routedInstanceId = preferredInstanceId || fallbackInstance?.instanceId || ""
  const routedInstanceLabel = useMemo(() => {
    if (!routedInstanceId) return null
    const exact = zapiInstances.find((i) => i.instanceId === routedInstanceId)
    return exact?.label || exact?.instanceId || routedInstanceId
  }, [routedInstanceId, zapiInstances])
  // AI settings are per-instance now
  const routedInstance = zapiInstances.find((i) => i.instanceId === routedInstanceId)
  const globalAiEnabled = routedInstance?.isAiEnabled === true
  const testModeActive = !globalAiEnabled && routedInstance?.isAiTestMode === true

  // In test mode, check if this contact's phone is whitelisted
  const isWhitelistedForTest = useMemo(() => {
    if (!testModeActive) return false
    const testPhones = routedInstance?.aiTestPhones ?? []
    if (testPhones.length === 0) return false
    const contactPhone = (contact.contactPhone ?? contact.phone ?? "").replace(/\D/g, "")
    return testPhones.some((tp: string) => contactPhone.endsWith(tp.replace(/\D/g, "")))
  }, [testModeActive, routedInstance?.aiTestPhones, contact.contactPhone, contact.phone])

  // Effective AI state: is the AI actually going to respond to this contact?
  const aiEffectivelyActive = isAiEnabled && (globalAiEnabled || isWhitelistedForTest)

  // Remove optimistic messages that have been confirmed by Firestore
  // Match by: same content (TEXT/NOTE) OR same type within 30s (media)
  useEffect(() => {
    if (optimisticMsgs.length === 0) return
    setOptimisticMsgs((prev) =>
      prev.filter((opt) => {
        const optTime = opt.createdAt.toDate().getTime()
        return !messages.some((m) => {
          if (m.role !== "OPERATOR" && m.role !== "NOTE") return false
          // Text/Note: match by content
          if (opt.type === "TEXT" && m.content === opt.content) return true
          if (opt.role === "NOTE" && m.role === "NOTE" && m.content === opt.content) return true
          // Media: match by type + close timing (within 30s)
          if (opt.type !== "TEXT" && m.type === opt.type) {
            const mTime = m.createdAt?.toDate?.()?.getTime?.() ?? 0
            if (Math.abs(mTime - optTime) < 30_000) return true
          }
          return false
        })
      })
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages])

  // Clear optimistic reactions that have been confirmed by Firestore
  useEffect(() => {
    if (Object.keys(optimisticReactions).length === 0) return
    setOptimisticReactions((prev) => {
      const next = { ...prev }
      for (const msg of messages) {
        if (next[msg.id] && msg.reactions !== undefined) {
          delete next[msg.id]
        }
      }
      return next
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages])

  // Merged list: real messages first, then any still-pending optimistic ones (re-dedup inline)
  const allMessages: AnyMessage[] = [
    ...messages,
    ...optimisticMsgs.filter((opt) => {
      const optTime = opt.createdAt.toDate().getTime()
      return !messages.some((m) => {
        if (m.role !== "OPERATOR" && m.role !== "NOTE") return false
        if (opt.type === "TEXT" && m.content === opt.content) return true
        if (opt.role === "NOTE" && m.role === "NOTE" && m.content === opt.content) return true
        if (opt.type !== "TEXT" && m.type === opt.type) {
          const mTime = m.createdAt?.toDate?.()?.getTime?.() ?? 0
          if (Math.abs(mTime - optTime) < 30_000) return true
        }
        return false
      })
    }),
  ].map((m) =>
    optimisticReactions[m.id] !== undefined
      ? { ...m, reactions: optimisticReactions[m.id] }
      : m
  )

  // Instance-aware filtering
  const selectedInstanceId = useInstanceStore((s) => s.selectedInstanceId)
  const multiInstance = zapiInstances.length > 1

  const visibleMessages = useMemo(() => {
    if (!selectedInstanceId || !multiInstance) return allMessages
    return allMessages.filter((msg) => {
      // Notes are instance-agnostic — always show
      if (msg.role === "NOTE") return true
      const msgInstance = (msg.metadata as Record<string, unknown> | undefined)?.zapiInstanceId as string | undefined
      if (msgInstance) return msgInstance === selectedInstanceId
      // Outgoing messages without instance tag — show (legacy)
      if (msg.role === "OPERATOR" || msg.role === "AGENT") return true
      return true
    })
  }, [allMessages, selectedInstanceId, multiInstance])

  // Instance label map for badges
  const instanceLabelMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const inst of zapiInstances) {
      if (inst.instanceId) m.set(inst.instanceId, inst.label || inst.instanceId)
    }
    return m
  }, [zapiInstances])

  const { messageById, messageByZapi } = useMemo(() => {
    const byId = new Map<string, AnyMessage>()
    const byZapi = new Map<string, AnyMessage>()
    for (const m of visibleMessages) {
      byId.set(m.id, m)
      if (m.zapiMessageId) byZapi.set(m.zapiMessageId, m)
    }
    return { messageById: byId, messageByZapi: byZapi }
  }, [visibleMessages])

  const previewText = useCallback((m: AnyMessage | null | undefined) => {
    if (!m) return ""
    if (m.type === "TEXT") return m.content || "Mensagem"
    if (m.type === "IMAGE") return "📷 Imagem"
    if (m.type === "AUDIO") return "🎤 Áudio"
    if (m.type === "DOCUMENT") return "📄 Documento"
    if (m.type === "PIX_CHARGE") return "💳 Cobrança PIX"
    return m.content || "Mensagem"
  }, [])

  // Mark as read when chat is opened or new messages arrive while viewing
  const markReadTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!contact.id) return
    // Small debounce to batch rapid unreadCount changes
    if (markReadTimer.current) clearTimeout(markReadTimer.current)
    markReadTimer.current = setTimeout(() => {
      markAsRead(contact.id!).catch(() => {})
    }, 300)
    return () => { if (markReadTimer.current) clearTimeout(markReadTimer.current) }
    // Re-run whenever unreadCount changes (new messages while chat is open)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contact.id, contact.unreadCount])

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
    setOptimisticReactions({})
    setNoteMode(false)
    setShowProfile(false)
    setTemplatePickerOpen(false)
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

    // Optimistic update: upsert fromMe reaction immediately
    setOptimisticReactions((prev) => {
      const current = prev[m.id] ?? m.reactions ?? []
      const withoutMe = current.filter((r) => !r.fromMe)
      const next: MessageReaction[] = reaction
        ? [...withoutMe, { emoji: reaction, fromMe: true, at: { toDate: () => new Date() } as never }]
        : withoutMe
      return { ...prev, [m.id]: next }
    })

    try {
      await sendMessage(contact.id, {
        type: "REACTION",
        reaction,
        replyToZapiMessageId: m.zapiMessageId,
      })
    } catch (err) {
      // Rollback optimistic reaction on failure
      setOptimisticReactions((prev) => {
        const { [m.id]: _, ...rest } = prev
        return rest
      })
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
    requestAnimationFrame(() => inputRef.current?.focus())

    // Note mode — save as internal note (not sent to WhatsApp)
    if (noteMode) {
      const tempId = `opt_${Date.now()}_${Math.random().toString(36).slice(2)}`
      setOptimisticMsgs((prev) => [...prev, {
        _optimistic: true,
        id: tempId,
        role: "NOTE",
        type: "TEXT",
        content: text,
        status: "SENT",
        createdAt: { toDate: () => new Date() },
      } as OptimisticMessage])

      try {
        await createNote(contact.id!, text)
      } catch {
        setOptimisticMsgs((prev) => prev.filter((m) => m.id !== tempId))
        showError("Falha ao salvar nota")
        setInputValue(text)
      }
      return
    }

    // Normal send
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
  }, [attachment, inputValue, doSend, replyTo?.zapiMessageId, noteMode, contact.id])

  // ── Template picker logic ──────────────────────────────────────────────────

  const templateList = allTemplates ?? []
  const filteredTemplates = templateList.filter((t) => {
    const q = templateQuery.toLowerCase()
    return t.name.toLowerCase().includes(q) || t.key.toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q)
  })

  function substituteVariables(text: string): string {
    return text
      .replace(/\{\{name\}\}/gi, contact.contactName ?? contact.name ?? "")
      .replace(/\{\{phone\}\}/gi, contact.contactPhone ?? contact.phone ?? "")
      .replace(/\{\{email\}\}/gi, contact.email ?? "")
  }

  async function handleTemplateSelect(template: MessageTemplate) {
    setTemplatePickerOpen(false)
    setTemplateQuery("")
    setTemplateSelectedIdx(0)

    // Multi-step sequence — send all steps with delays
    if (template.steps && Array.isArray(template.steps) && template.steps.length > 0) {
      const steps = [...template.steps].sort((a, b) => a.order - b.order)
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        if (i > 0 && step.delaySeconds && step.delaySeconds > 0) {
          await new Promise((r) => setTimeout(r, step.delaySeconds! * 1000))
        }
        if (step.type === "TEXT") {
          const text = substituteVariables(step.body)
          doSend({ type: "TEXT", text }, text)
        } else if (step.mediaUrl) {
          const caption = step.caption ? substituteVariables(step.caption) : undefined
          doSend({ type: step.type, mediaUrl: step.mediaUrl, caption, fileName: step.fileName ?? undefined } as SendMessageInput, caption || `[${step.type}]`)
        }
      }
      return
    }

    // Legacy single-message
    if (template.type === "TEXT") {
      const text = substituteVariables(template.body)
      setInputValue(text)
      requestAnimationFrame(() => inputRef.current?.focus())
    } else {
      const caption = template.caption ? substituteVariables(template.caption) : undefined
      if (template.type === "IMAGE" && template.mediaUrl) {
        doSend({ type: "IMAGE", mediaUrl: template.mediaUrl, caption }, caption || `📷 ${template.name}`)
      } else if (template.type === "AUDIO" && template.mediaUrl) {
        doSend({ type: "AUDIO", mediaUrl: template.mediaUrl }, `🎤 ${template.name}`)
      } else if (template.type === "VIDEO" && template.mediaUrl) {
        doSend({ type: "VIDEO", mediaUrl: template.mediaUrl, caption }, caption || `🎬 ${template.name}`)
      } else if (template.type === "DOCUMENT" && template.mediaUrl) {
        doSend({ type: "DOCUMENT", mediaUrl: template.mediaUrl, fileName: template.fileName ?? template.name }, `📄 ${template.fileName ?? template.name}`)
      }
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setInputValue(val)

    // Detect / at start → open template picker
    if (val.startsWith("/")) {
      setTemplatePickerOpen(true)
      setTemplateQuery(val.slice(1))
      setTemplateSelectedIdx(0)
    } else {
      setTemplatePickerOpen(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Template picker navigation
    if (templatePickerOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setTemplateSelectedIdx((i) => Math.min(i + 1, filteredTemplates.length - 1))
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setTemplateSelectedIdx((i) => Math.max(i - 1, 0))
        return
      }
      if (e.key === "Enter") {
        e.preventDefault()
        if (filteredTemplates[templateSelectedIdx]) {
          handleTemplateSelect(filteredTemplates[templateSelectedIdx])
        }
        return
      }
      if (e.key === "Escape") {
        e.preventDefault()
        setTemplatePickerOpen(false)
        setInputValue("")
        return
      }
      if (e.key === "Tab") {
        e.preventDefault()
        if (filteredTemplates[templateSelectedIdx]) {
          handleTemplateSelect(filteredTemplates[templateSelectedIdx])
        }
        return
      }
      return
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      e.currentTarget.focus()
      handleSendText(e as unknown as React.FormEvent)
    }
  }

  // ── Paste image from clipboard ──────────────────────────────────────────────

  function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault()
        const file = item.getAsFile()
        if (!file) return
        const preview = URL.createObjectURL(file)
        setAttachment({ kind: "image", file, preview })
        return
      }
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
    <div className="flex flex-1 min-h-0 overflow-hidden">
    <motion.div
      key={contact.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-1 flex-col min-h-0 overflow-hidden relative"
      onDragEnter={(e) => {
        e.preventDefault()
        dragCounterRef.current++
        if (e.dataTransfer?.types?.includes("Files")) setDraggingOver(true)
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        e.preventDefault()
        dragCounterRef.current--
        if (dragCounterRef.current <= 0) { setDraggingOver(false); dragCounterRef.current = 0 }
      }}
      onDrop={(e) => {
        e.preventDefault()
        setDraggingOver(false)
        dragCounterRef.current = 0
        const file = e.dataTransfer?.files?.[0]
        if (!file) return
        if (file.type.startsWith("image/")) {
          setAttachment({ kind: "image", file, preview: URL.createObjectURL(file) })
        } else {
          setAttachment({ kind: "document", file })
        }
      }}
    >
      <MediaViewerModal media={mediaViewer} onClose={() => setMediaViewer(null)} />

      {/* ── Image preview overlay (WhatsApp-style) ── */}
      <AnimatePresence>
        {attachment && attachment.kind === "image" && (
          <ImagePreviewOverlay
            key="img-preview"
            attachment={attachment}
            caption={inputValue}
            onCaptionChange={setInputValue}
            onSend={() => {
              handleSendText({ preventDefault: () => {} } as React.FormEvent)
            }}
            onClose={() => { setAttachment(null); setInputValue("") }}
          />
        )}
      </AnimatePresence>

      {/* ── Drag-drop overlay ── */}
      <AnimatePresence>
        {draggingOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm border-2 border-dashed border-accent/40 rounded-xl"
          >
            <div className="flex flex-col items-center gap-2">
              <ImageIcon className="h-8 w-8 text-accent/70" />
              <span className="text-[13px] font-medium text-accent/80">Solte a imagem aqui</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toast ── */}
      <AnimatePresence>
        {errorMsg && (
          <Toast key="toast" message={errorMsg} onDismiss={() => setErrorMsg(null)} />
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="flex min-h-16 shrink-0 items-center justify-between border-b border-border px-5 py-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowProfile((v) => !v)}
            className="relative cursor-pointer group"
            title="Ver perfil do contato"
          >
            <Avatar name={displayName} photoUrl={contact.photoUrl} size="sm" />
            {contactTyping && (
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 border-2 border-background animate-pulse" />
            )}
            <span className="absolute inset-0 rounded-full ring-2 ring-transparent group-hover:ring-accent/30 transition-all" />
          </button>
          <div>
            <button
              type="button"
              onClick={() => setShowProfile((v) => !v)}
              className="cursor-pointer text-[13px] font-semibold text-foreground leading-tight hover:text-accent transition-colors text-left"
            >
              {displayName}
            </button>
            <p className="text-[11px] text-muted-foreground/85 leading-tight font-mono">
              {contactTyping ? "digitando..." : agentTyping ? "agente escrevendo..." : displayPhone}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Schedule button */}
          <button
            type="button"
            onClick={() => setShowSchedule(true)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium border border-border/50 bg-muted/20 text-muted-foreground/70 hover:bg-accent/10 hover:text-accent hover:border-accent/30 transition-all cursor-pointer"
            title="Agendar consulta"
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            <span>Agendar</span>
          </button>
          {/* Responsible selector */}
          <ResponsibleSelector
            contactId={contact.id ?? ""}
            assignedMemberId={contact.assignedMemberId as string | null ?? null}
            compact
          />
          {/* AI toggle */}
          <div className="relative group">
            <button
              onClick={() => aiToggle.mutate(!isAiEnabled)}
              disabled={aiToggle.isPending || (!globalAiEnabled && !testModeActive)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all duration-200 cursor-pointer border ${
                !globalAiEnabled && !testModeActive
                  ? "border-rose-500/20 bg-rose-500/[0.06] text-rose-400/60 cursor-not-allowed"
                  : aiEffectivelyActive
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15"
                    : testModeActive && isAiEnabled && !isWhitelistedForTest
                      ? "border-amber-500/20 bg-amber-500/[0.06] text-amber-400/70 hover:bg-amber-500/10"
                      : isAiEnabled
                        ? "border-accent/30 bg-accent/10 text-accent hover:bg-accent/20"
                        : "border-border/50 bg-muted/20 text-muted-foreground/50 hover:bg-muted/40 hover:text-muted-foreground/70"
              } disabled:opacity-50`}
            >
              <Robot className="h-3.5 w-3.5" weight={aiEffectivelyActive ? "fill" : "regular"} />
              <span>
                {!globalAiEnabled && !testModeActive
                  ? "IA desativada"
                  : aiEffectivelyActive
                    ? "IA respondendo"
                    : testModeActive && isAiEnabled && !isWhitelistedForTest
                      ? "Fora do teste"
                      : isAiEnabled ? "IA ativa" : "IA pausada"
                }
              </span>
              {testModeActive && (
                <span className="flex h-4 items-center rounded px-1 bg-amber-500/15 text-[8px] font-bold uppercase tracking-wider text-amber-400/80">
                  <Flask className="h-2.5 w-2.5 mr-0.5" weight="fill" />
                  Teste
                </span>
              )}
            </button>

            {/* Tooltip */}
            <div className="absolute right-0 top-full mt-1.5 z-50 hidden group-hover:block">
              <div className="rounded-lg border border-border/30 bg-background/95 backdrop-blur-sm px-3 py-2 shadow-lg max-w-[250px]">
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  {!globalAiEnabled && !testModeActive ? (
                    <>A IA está <span className="font-semibold text-rose-400">desabilitada nas configurações gerais</span>. Ative em Configurações &rarr; IA.</>
                  ) : testModeActive && isAiEnabled && !isWhitelistedForTest ? (
                    <>A IA está em <span className="font-semibold text-amber-400">modo teste</span> e este número <span className="font-semibold text-amber-400">não está na lista autorizada</span>. A IA não vai responder este contato.</>
                  ) : testModeActive && isAiEnabled && isWhitelistedForTest ? (
                    <>A IA está em <span className="font-semibold text-amber-400">modo teste</span> e este número <span className="font-semibold text-emerald-400">está autorizado</span>. A IA vai responder normalmente.</>
                  ) : testModeActive && !isAiEnabled ? (
                    <>A IA está <span className="font-semibold text-muted-foreground">pausada</span> neste contato. Clique para ativar.</>
                  ) : isAiEnabled ? (
                    <>A IA está <span className="font-semibold text-emerald-400">respondendo</span> este contato. Clique para pausar.</>
                  ) : (
                    <>A IA está <span className="font-semibold text-muted-foreground">pausada</span> neste contato. Clique para ativar.</>
                  )}
                </p>
              </div>
            </div>
          </div>
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
              <p className="text-[11px] text-muted-foreground/85">Role para cima para carregar mais</p>
            )}
          </div>
        )}
        {messagesLoading && visibleMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-5 w-5 rounded-full border-2 border-accent/20 border-t-accent"
            />
            <p className="text-[11px] text-muted-foreground/85">Carregando mensagens...</p>
          </div>
        )}

        {!messagesLoading && visibleMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/30 border border-border/40">
              <ChatCircleText className="h-6 w-6 text-muted-foreground/85" weight="duotone" />
            </div>
            <p className="text-[12px] text-muted-foreground/90">Nenhuma mensagem ainda</p>
          </div>
        )}

        {visibleMessages.map((msg, i) => {
          const refId = msg.referenceMessageId
          const refMsg = refId
            ? (messageById.get(refId) ?? messageByZapi.get(refId) ?? null)
            : null
          const currentKey = getMsgDateKey(msg.createdAt)
          const prevKey = i > 0 ? getMsgDateKey(visibleMessages[i - 1].createdAt) : null
          const showDateDivider = currentKey && currentKey !== prevKey

          // Instance change divider (only when viewing all instances with multi-instance)
          const msgInstance = (msg.metadata as Record<string, unknown> | undefined)?.zapiInstanceId as string | undefined
          const prevMsgInstance = i > 0 ? ((visibleMessages[i - 1].metadata as Record<string, unknown> | undefined)?.zapiInstanceId as string | undefined) : undefined
          const showInstanceDivider = !selectedInstanceId && multiInstance && msgInstance && msgInstance !== prevMsgInstance && i > 0

          return (
            <div key={msg.id} className="flex flex-col gap-3">
              {showDateDivider && (
                <DateDivider label={formatDateLabel(msg.createdAt)} />
              )}
              {showInstanceDivider && (
                <div className="flex items-center gap-2 px-2">
                  <div className="flex-1 h-px bg-border/40" />
                  <span className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-wider whitespace-nowrap">
                    via {instanceLabelMap.get(msgInstance!) ?? msgInstance}
                  </span>
                  <div className="flex-1 h-px bg-border/40" />
                </div>
              )}
              <MessageBubble
                msg={msg}
                contactId={contact.id!}
                animate={i >= visibleMessages.length - 1}
                quotedText={previewText(refMsg)}
                onReply={handleReplyMessage}
                onReact={handleReactToMessage}
                onOpenMedia={setMediaViewer}
              />
            </div>
          )
        })}

        <AnimatePresence>
          {contactTyping && <TypingIndicator key="ct" label="digitando" />}
          {agentTyping && <TypingIndicator key="at" label="agente escrevendo" side="right" />}
        </AnimatePresence>

        {/* Instance routing hint — only shown when tenant has multiple Z-API instances */}
        {zapiInstances.length > 1 && routedInstanceLabel && (
          <div className="flex items-center justify-center gap-1.5 py-1">
            <span className="h-px w-8 bg-border/40" />
            <span className="text-[10px] text-muted-foreground/88 select-none">
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
                  className="cursor-pointer flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/90 hover:text-foreground hover:bg-muted/30 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Document attachment preview (images use the full overlay) */}
        <AnimatePresence>
          {attachment && attachment.kind === "document" && (
            <div className="pt-2">
              <DocumentPreview attachment={attachment} onRemove={() => setAttachment(null)} />
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
                className="cursor-pointer ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/90 hover:text-muted-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" weight="bold" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI-managed notice or Input row */}
        {isAiEnabled && !contact.assignedMemberId ? (
          <div className="flex items-center justify-center gap-2 px-4 py-4 border-t border-border/30">
            <Robot className="h-4 w-4 text-accent/60" weight="fill" />
            <p className="text-[12px] text-muted-foreground/70">A IA esta respondendo este contato. Assuma a conversa para enviar mensagens.</p>
          </div>
        ) : (
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
                  : "text-muted-foreground/85 hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <Paperclip className="h-4 w-4" />
            </motion.button>
          )}

          {/* Note toggle */}
          {!recording && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => setNoteMode((v) => !v)}
              title={noteMode ? "Voltar para mensagem normal" : "Escrever nota interna"}
              className={`cursor-pointer flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-150 ${
                noteMode
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                  : "text-muted-foreground/85 hover:text-amber-400 hover:bg-amber-500/10"
              }`}
            >
              <NotePencil className="h-4 w-4" weight={noteMode ? "fill" : "regular"} />
            </motion.button>
          )}

          {/* Recording indicator or text input */}
          <AnimatePresence mode="wait">
            {recording ? (
              <RecordingIndicator key="rec" seconds={recordSeconds} />
            ) : (
              <div key="input-wrap" className="relative flex-1">
                {/* Template picker popup */}
                <AnimatePresence>
                  {templatePickerOpen && (
                    <TemplatePicker
                      query={templateQuery}
                      templates={templateList}
                      selectedIndex={templateSelectedIdx}
                      onSelect={handleTemplateSelect}
                    />
                  )}
                </AnimatePresence>
                <input
                  ref={inputRef}
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  onBlur={() => { setTimeout(() => setTemplatePickerOpen(false), 150) }}
                  placeholder={attachment ? "Adicionar legenda (opcional)..." : noteMode ? "Escrever nota interna..." : "/ para templates — ou digite uma mensagem..."}
                  className={`w-full h-9 rounded-xl border px-4 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-all duration-300 ${
                    templatePickerOpen
                      ? "border-accent/40 bg-accent/[0.03] focus:ring-2 focus:ring-accent/30"
                      : noteMode
                        ? "border-amber-500/25 bg-amber-500/[0.04] focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/30"
                        : "border-border bg-card/50 focus:ring-2 focus:ring-accent/30 focus:border-accent/40"
                  }`}
                />
              </div>
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
                className="cursor-pointer flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground/85 hover:text-foreground hover:bg-muted/40 transition-colors duration-150"
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
                    : "bg-muted/40 text-muted-foreground/90"
                }`}
              >
                <PaperPlaneTilt className="h-4 w-4" weight="fill" />
              </motion.button>
            )}
          </AnimatePresence>
        </form>
        )}
      </div>
    </motion.div>

    {/* ── Profile side panel ── */}
    <AnimatePresence>
      {showProfile && contact.id && (
        <motion.div
          key="profile-panel"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.33, 1, 0.68, 1] }}
          className="shrink-0 border-l border-border overflow-hidden h-full"
        >
          <div className="w-[320px] h-full flex flex-col min-h-0">
            <ContactInfoPanel
              contactId={contact.id}
              initialContact={contact}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Quick schedule modal */}
    {showSchedule && (
      <QuickScheduleModal
        contact={{ id: contact.id ?? "", name: contact.name ?? null, phone: contact.phone ?? "" }}
        onClose={() => setShowSchedule(false)}
      />
    )}
    </div>
  )
}

// ─── Legacy type re-export ────────────────────────────────────────────────────
export type { FirestoreContact as ChatContact }
