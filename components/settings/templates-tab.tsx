"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  TextAa,
  Plus,
  Pencil,
  Trash,
  Check,
  X,
  Spinner,
  Warning,
  Image as ImageIcon,
  FileText,
  MusicNote,
  VideoCamera,
  CloudArrowUp,
  Eye,
  EyeSlash,
  Copy,
  Info,
  Clock,
  Bell,
  Gear,
  Checks,
} from "@phosphor-icons/react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTemplates, useTemplateMutations } from "@/hooks/use-templates"
import { useAuthStore } from "@/lib/auth-store"
import { uploadTemplateMedia } from "@/lib/firebase"
import type { MessageTemplate, TemplateInput, TemplateType } from "@/lib/api/templates"

const ease = [0.33, 1, 0.68, 1] as const

const inputCls =
  "w-full rounded-xl border border-border/60 bg-background/40 px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"
const labelCls = "block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5"

// ─── Config ────────────────────────────────────────────────────────────────────

const TYPES: { value: TemplateType; label: string; icon: typeof TextAa }[] = [
  { value: "TEXT", label: "Texto", icon: TextAa },
  { value: "IMAGE", label: "Imagem", icon: ImageIcon },
  { value: "AUDIO", label: "Áudio", icon: MusicNote },
  { value: "VIDEO", label: "Vídeo", icon: VideoCamera },
  { value: "DOCUMENT", label: "Documento", icon: FileText },
]

const PURPOSES: { key: string; label: string; description: string; icon: typeof Bell }[] = [
  { key: "reminder_24h", label: "Lembrete 24h antes", description: "Enviado automaticamente 24 horas antes da consulta", icon: Clock },
  { key: "reminder_1h", label: "Lembrete 1h antes", description: "Enviado automaticamente 1 hora antes da consulta", icon: Bell },
  { key: "_custom", label: "Uso livre", description: "Para automações, campanhas ou envio manual", icon: Gear },
]

const VARIABLES: { key: string; label: string; example: string }[] = [
  { key: "name", label: "Nome do paciente", example: "Maria" },
  { key: "appointmentTime", label: "Data e hora", example: "15/03/2026 10:00" },
  { key: "appointmentDate", label: "Data", example: "15/03/2026" },
  { key: "appointmentTimeOnly", label: "Hora", example: "10:00" },
  { key: "professionalName", label: "Profissional", example: "Dr. João" },
  { key: "serviceName", label: "Serviço", example: "Consulta de rotina" },
]

const KEY_REGEX = /^[a-z0-9_-]+$/

const RESERVED_KEY_LABELS: Record<string, string> = {
  reminder_24h: "Lembrete 24h antes",
  reminder_1h: "Lembrete 1h antes",
}

const ACCEPTED_FILES: Record<TemplateType, { accept: string; label: string; maxMB: number }> = {
  TEXT: { accept: "", label: "", maxMB: 0 },
  IMAGE: { accept: "image/jpeg,image/png,image/webp", label: "JPG, PNG ou WebP", maxMB: 5 },
  AUDIO: { accept: "audio/mpeg,audio/ogg,audio/mp4,audio/wav", label: "MP3, OGG, M4A ou WAV", maxMB: 16 },
  VIDEO: { accept: "video/mp4,video/3gpp", label: "MP4 ou 3GP", maxMB: 16 },
  DOCUMENT: { accept: "application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt", label: "PDF, DOC, XLS, PPT, CSV ou TXT", maxMB: 100 },
}

function previewBody(body: string) {
  let result = body
  for (const v of VARIABLES) {
    // Display format: @Label → example
    result = result.replaceAll(`@${v.label}`, v.example)
    // Storage format fallback: {{key}} → example
    result = result.replace(new RegExp(`\\{\\{${v.key}\\}\\}`, "g"), v.example)
  }
  return result
}

// ─── Mention-style variable system ──────────────────────────────────────────────
//
// In the textarea the user sees:  @Nome do paciente
// Stored in the DB as:            {{name}}
// Conversion happens on load (toDisplay) and save (toStorage).

const VAR_MENTIONS_SORTED = VARIABLES.map((v) => `@${v.label}`).sort((a, b) => b.length - a.length)
const MENTION_TO_KEY = new Map(VARIABLES.map((v) => [`@${v.label}`, v.key]))

/** Convert storage format {{key}} → display format @Label */
function toDisplay(text: string): string {
  let result = text
  for (const v of VARIABLES) {
    result = result.replace(new RegExp(`\\{\\{${v.key}\\}\\}`, "g"), `@${v.label}`)
  }
  return result
}

/** Convert display format @Label → storage format {{key}} */
function toStorage(text: string): string {
  let result = text
  // Sort by length desc to avoid partial matches
  for (const mention of VAR_MENTIONS_SORTED) {
    const key = MENTION_TO_KEY.get(mention)
    if (key) result = result.replaceAll(mention, `{{${key}}}`)
  }
  return result
}

type BodySegment =
  | { type: "text"; value: string }
  | { type: "mention"; value: string; known: boolean }

function tokenizeBody(text: string): BodySegment[] {
  const segments: BodySegment[] = []
  let i = 0

  function pushText(val: string) {
    if (!val) return
    const last = segments[segments.length - 1]
    if (last?.type === "text") last.value += val
    else segments.push({ type: "text", value: val })
  }

  while (i < text.length) {
    if (text[i] === "@") {
      let matched = false
      for (const mention of VAR_MENTIONS_SORTED) {
        if (text.startsWith(mention, i)) {
          segments.push({ type: "mention", value: mention, known: true })
          i += mention.length
          matched = true
          break
        }
      }
      if (!matched) {
        pushText("@")
        i++
      }
    } else {
      pushText(text[i]!)
      i++
    }
  }
  return segments
}

function getTypeConfig(type: TemplateType) {
  return TYPES.find((t) => t.value === type) ?? TYPES[0]
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getPurposeFromKey(key: string): string {
  const found = PURPOSES.find((p) => p.key === key)
  return found ? found.key : "_custom"
}

// ─── Variable Textarea with @ popup (identical UX to InstructionTextarea) ───────

function getCaretCoords(
  textarea: HTMLTextAreaElement,
  index: number,
): { top: number; left: number; lineHeight: number } {
  const style = window.getComputedStyle(textarea)
  const mirror = document.createElement("div")
  mirror.style.cssText = `position:absolute;top:-9999px;left:-9999px;width:${style.width};padding:${style.padding};border:${style.border};font:${style.font};font-size:${style.fontSize};font-family:${style.fontFamily};font-weight:${style.fontWeight};line-height:${style.lineHeight};letter-spacing:${style.letterSpacing};white-space:pre-wrap;word-wrap:break-word;overflow-wrap:break-word;box-sizing:border-box;overflow:hidden;`
  mirror.textContent = textarea.value.slice(0, index)
  const caret = document.createElement("span")
  caret.textContent = "\u200b"
  mirror.appendChild(caret)
  document.body.appendChild(mirror)
  const caretRect = caret.getBoundingClientRect()
  const mirrorRect = mirror.getBoundingClientRect()
  document.body.removeChild(mirror)
  return {
    top: caretRect.top - mirrorRect.top,
    left: caretRect.left - mirrorRect.left,
    lineHeight: parseFloat(style.lineHeight) || 20,
  }
}

function normalizeStr(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
}

function VariableTextarea({
  value,
  onChange,
  rows = 7,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  rows?: number
  placeholder?: string
}) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  const [showPopup, setShowPopup] = useState(false)
  const [atIdx, setAtIdx] = useState(0)
  const [filterQuery, setFilterQuery] = useState("")
  const [highlightIdx, setHighlightIdx] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [popupPos, setPopupPos] = useState<{ top: number; left: number; width: number; above: boolean } | null>(null)

  useEffect(() => setMounted(true), [])

  // Filter variables based on query
  const filtered = useMemo(() => {
    if (!showPopup) return []
    const q = normalizeStr(filterQuery)
    return VARIABLES.filter((v) =>
      !q || normalizeStr(v.label).includes(q) || normalizeStr(v.key).includes(q),
    )
  }, [showPopup, filterQuery])

  // Popup position
  const updatePopupPos = useCallback((cursorIdx?: number) => {
    const ta = textareaRef.current
    if (!ta) return
    const idx = cursorIdx ?? ta.selectionStart ?? 0
    const taRect = ta.getBoundingClientRect()
    const coords = getCaretCoords(ta, idx)
    const caretTop = taRect.top + coords.top - ta.scrollTop
    const caretLeft = taRect.left + coords.left
    const lineH = coords.lineHeight
    const popupH = 260
    const spaceBelow = window.innerHeight - (caretTop + lineH)
    const above = spaceBelow < popupH + 16
    setPopupPos({
      top: above ? caretTop - 8 : caretTop + lineH + 4,
      left: Math.min(caretLeft, window.innerWidth - 340),
      width: Math.min(taRect.width, 320),
      above,
    })
  }, [])

  useEffect(() => {
    if (!showPopup) { setPopupPos(null); return }
    updatePopupPos(atIdx)
    const ta = textareaRef.current
    function onScroll() { updatePopupPos(atIdx) }
    ta?.addEventListener("scroll", onScroll)
    window.addEventListener("resize", onScroll)
    return () => { ta?.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll) }
  }, [showPopup, atIdx, updatePopupPos])

  // Scroll highlight into view
  useEffect(() => {
    if (!popupRef.current) return
    const el = popupRef.current.querySelector(`[data-idx="${highlightIdx}"]`) as HTMLElement | null
    el?.scrollIntoView({ block: "nearest" })
  }, [highlightIdx])

  // Close on outside click
  useEffect(() => {
    if (!showPopup) return
    function onMd(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node) && !popupRef.current?.contains(e.target as Node)) {
        setShowPopup(false)
      }
    }
    document.addEventListener("mousedown", onMd)
    return () => document.removeEventListener("mousedown", onMd)
  }, [showPopup])

  // Parse @ token at cursor
  function parseAtToken(text: string, cursor: number) {
    const before = text.slice(0, cursor)
    const atPos = before.lastIndexOf("@")
    if (atPos === -1) return null
    const token = before.slice(atPos + 1)
    if (token.includes("\n")) return null
    // If the full @token is already a resolved mention followed by a space, don't reopen
    const fullMention = `@${token}`
    for (const mention of VAR_MENTIONS_SORTED) {
      if (fullMention === mention && text[cursor] === " ") return null
      if (fullMention.startsWith(mention) && fullMention.length > mention.length) return null
    }
    return { atPos, token }
  }

  // Insert variable
  const insertVariable = useCallback(
    (v: typeof VARIABLES[number]) => {
      const cursor = textareaRef.current?.selectionStart ?? (atIdx + 1 + filterQuery.length)
      const before = value.slice(0, atIdx)
      const after = value.slice(cursor)
      const mention = `@${v.label}`
      const newText = `${before}${mention} ${after}`
      onChange(newText)
      setShowPopup(false)
      setHighlightIdx(0)
      const newCursor = atIdx + mention.length + 1
      requestAnimationFrame(() => {
        const ta = textareaRef.current
        if (ta) { ta.focus(); ta.setSelectionRange(newCursor, newCursor) }
      })
    },
    [value, atIdx, filterQuery, onChange],
  )

  function openPopup(parsed: { atPos: number; token: string }) {
    setAtIdx(parsed.atPos)
    setFilterQuery(parsed.token)
    setShowPopup(true)
    setHighlightIdx(0)
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const v = e.target.value
    onChange(v)
    const cursor = e.target.selectionStart ?? v.length
    const parsed = parseAtToken(v, cursor)
    if (parsed) openPopup(parsed)
    else setShowPopup(false)
  }

  function handleClick() {
    if (!showPopup) return
    const cursor = textareaRef.current?.selectionStart ?? 0
    const parsed = parseAtToken(value, cursor)
    if (!parsed) setShowPopup(false)
    else openPopup(parsed)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!showPopup || filtered.length === 0) return
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlightIdx((i) => (i + 1) % filtered.length); return }
    if (e.key === "ArrowUp") { e.preventDefault(); setHighlightIdx((i) => (i - 1 + filtered.length) % filtered.length); return }
    if (e.key === "Escape") { e.preventDefault(); setShowPopup(false); return }
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault()
      const item = filtered[highlightIdx]
      if (item) insertVariable(item)
      return
    }
  }

  function syncScroll() {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  // Tokenize for overlay
  const segments = useMemo(() => tokenizeBody(value), [value])
  const hasText = value.length > 0

  return (
    <div ref={wrapperRef} className="group relative w-full flex flex-col rounded-xl border border-border/60 bg-background/40 transition-all duration-200 focus-within:ring-2 focus-within:ring-accent/30 focus-within:border-accent/40">
      <div className="flex-1 relative">
        {/* Placeholder */}
        {!hasText && placeholder && (
          <div aria-hidden className="pointer-events-none absolute inset-0 z-[1] overflow-hidden px-3 py-2.5 text-[13px] leading-relaxed text-muted-foreground/50 whitespace-pre-wrap break-words">
            {placeholder}
          </div>
        )}

        {/* Highlight overlay */}
        <div ref={overlayRef} aria-hidden className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
          <div className="px-3 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap break-words">
            {hasText
              ? segments.map((seg: BodySegment, i: number) => {
                  if (seg.type === "text") {
                    return <span key={i} className="text-foreground">{seg.value}</span>
                  }
                  return (
                    <span
                      key={i}
                      className={`rounded-[3px] px-0.5 ${
                        seg.known
                          ? "bg-accent/20 text-accent"
                          : "bg-rose-500/20 text-rose-400 underline decoration-wavy decoration-rose-400/50"
                      }`}
                    >
                      {seg.value}
                    </span>
                  )
                })
              : null}
          </div>
        </div>

        {/* Actual textarea — transparent text */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onClick={handleClick}
          onScroll={syncScroll}
          rows={rows}
          spellCheck={false}
          className="relative z-[2] w-full resize-y bg-transparent px-3 py-2.5 text-[13px] leading-relaxed outline-none selection:bg-accent/30"
          style={{ color: "transparent", caretColor: "rgb(255 255 255 / 0.9)" }}
        />
      </div>

      {/* Bottom hint */}
      <div className="shrink-0 flex items-center gap-1.5 border-t border-border/30 px-3 py-1.5">
        <Copy className="h-3 w-3 text-muted-foreground/85" weight="bold" />
        <p className="text-[10px] text-muted-foreground/85 select-none">
          Digite{" "}
          <kbd className="rounded border border-border/30 bg-muted/20 px-1 py-px font-mono text-[9px]">@</kbd>{" "}
          para inserir dados automáticos do paciente
        </p>
      </div>

      {/* Autocomplete popup — portal */}
      {mounted && createPortal(
        <AnimatePresence>
          {showPopup && filtered.length > 0 && popupPos && (
            <motion.div
              key="var-popup"
              ref={popupRef}
              initial={{ opacity: 0, y: popupPos.above ? 4 : -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: popupPos.above ? 4 : -4, scale: 0.97 }}
              transition={{ duration: 0.1 }}
              role="listbox"
              style={{
                position: "fixed",
                top: popupPos.above ? undefined : popupPos.top,
                bottom: popupPos.above ? window.innerHeight - popupPos.top : undefined,
                left: popupPos.left,
                width: popupPos.width,
                zIndex: 99999,
              }}
              className="rounded-xl border border-border/60 bg-popover/95 backdrop-blur-xl shadow-2xl shadow-black/30 overflow-hidden"
            >
              <div className="max-h-[260px] overflow-y-auto py-1">
                {filtered.map((v, i) => {
                  const isHl = i === highlightIdx
                  return (
                    <button
                      key={v.key}
                      type="button"
                      role="option"
                      data-idx={i}
                      aria-selected={isHl}
                      onMouseEnter={() => setHighlightIdx(i)}
                      onClick={() => insertVariable(v)}
                      className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors cursor-pointer ${
                        isHl ? "bg-accent/15" : "hover:bg-muted/40"
                      }`}
                    >
                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                        isHl ? "border-accent/30 bg-accent/10" : "border-border/40 bg-muted/20"
                      }`}>
                        <Copy className={`h-3 w-3 ${isHl ? "text-accent" : "text-muted-foreground/85"}`} weight="duotone" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] font-medium truncate ${isHl ? "text-foreground" : "text-foreground/80"}`}>
                          {v.label}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          Ex: {v.example}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
              <div className="border-t border-border/30 px-3 py-1.5">
                <p className="text-[10px] text-muted-foreground/90 select-none">
                  <kbd className="rounded border border-border/30 bg-muted/20 px-1 py-px font-mono text-[9px]">↑↓</kbd>{" "}navegar
                  <span className="mx-1.5 text-border">·</span>
                  <kbd className="rounded border border-border/30 bg-muted/20 px-1 py-px font-mono text-[9px]">Enter</kbd>{" "}inserir
                  <span className="mx-1.5 text-border">·</span>
                  <kbd className="rounded border border-border/30 bg-muted/20 px-1 py-px font-mono text-[9px]">Esc</kbd>{" "}fechar
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}

      {/* Empty state */}
      {mounted && createPortal(
        <AnimatePresence>
          {showPopup && filtered.length === 0 && popupPos && (
            <motion.div
              key="var-empty"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.1 }}
              style={{
                position: "fixed",
                top: popupPos.above ? undefined : popupPos.top,
                bottom: popupPos.above ? window.innerHeight - popupPos.top : undefined,
                left: popupPos.left,
                width: Math.min(popupPos.width, 300),
                zIndex: 99999,
              }}
              className="rounded-xl border border-border/60 bg-popover/95 backdrop-blur-xl px-4 py-3 shadow-xl shadow-black/20"
            >
              <p className="text-[12px] text-muted-foreground">
                Nenhum dado disponível para{" "}
                <span className="font-mono text-accent">@{filterQuery}</span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  )
}

// ─── Media Upload Zone ─────────────────────────────────────────────────────────

function MediaUploadZone({
  type,
  mediaUrl,
  onUpload,
  uploading,
  onClear,
}: {
  type: TemplateType
  mediaUrl: string
  onUpload: (file: File) => void
  uploading: boolean
  onClear: () => void
}) {
  const fileConfig = ACCEPTED_FILES[type]
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) onUpload(file)
    },
    [onUpload],
  )

  if (mediaUrl) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Check className="h-4 w-4 text-emerald-400 shrink-0" weight="bold" />
            <span className="text-[12px] font-medium text-emerald-400 truncate">Arquivo enviado</span>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="text-[11px] text-muted-foreground hover:text-rose-400 transition-colors cursor-pointer"
          >
            Remover
          </button>
        </div>
        {type === "IMAGE" && (
          <img src={mediaUrl} alt="Preview" className="mt-2 rounded-lg max-h-32 object-contain" />
        )}
        {type === "AUDIO" && (
          <audio src={mediaUrl} controls className="mt-2 w-full h-8" />
        )}
        {type === "VIDEO" && (
          <video src={mediaUrl} controls className="mt-2 rounded-lg max-h-32 w-full" />
        )}
      </div>
    )
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer ${
        dragOver
          ? "border-accent bg-accent/[0.06]"
          : "border-border/50 bg-muted/[0.02] hover:border-accent/30 hover:bg-accent/[0.02]"
      } p-5 flex flex-col items-center gap-2`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={fileConfig.accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ""
          if (file) onUpload(file)
        }}
      />
      {uploading ? (
        <>
          <Spinner className="h-6 w-6 text-accent animate-spin" />
          <p className="text-[12px] text-muted-foreground">Enviando arquivo…</p>
        </>
      ) : (
        <>
          <CloudArrowUp className={`h-6 w-6 ${dragOver ? "text-accent" : "text-muted-foreground/60"}`} weight="duotone" />
          <p className="text-[12px] text-foreground font-medium">
            Arraste aqui ou <span className="text-accent">clique para escolher</span>
          </p>
          <p className="text-[10px] text-muted-foreground">
            {fileConfig.label} · até {fileConfig.maxMB} MB
          </p>
        </>
      )}
    </div>
  )
}

// ─── Variable Chips ────────────────────────────────────────────────────────────

function VariableChips({ onInsert }: { onInsert: (v: string) => void }) {
  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {VARIABLES.map((v) => (
          <Tooltip key={v.key}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onInsert(`{{${v.key}}}`)}
                className="inline-flex items-center gap-1 rounded-lg border border-accent/20 bg-accent/[0.04] px-2 py-1 text-[10px] font-medium text-accent hover:bg-accent/[0.1] transition-colors cursor-pointer"
              >
                <Copy className="h-2.5 w-2.5" />
                {v.label}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p>Insere <code className="font-mono">{`{{${v.key}}}`}</code></p>
              <p className="text-muted-foreground">Ex: {v.example}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}

// ─── Form Modal ────────────────────────────────────────────────────────────────

function TemplateFormModal({
  onClose,
  template,
}: {
  onClose: () => void
  template: MessageTemplate | null
}) {
  const isEdit = !!template
  const { create, update } = useTemplateMutations()
  const tenantId = useAuthStore((s) => s.tenantId)

  const [purpose, setPurpose] = useState("_custom")
  const [type, setType] = useState<TemplateType>("TEXT")
  const [key, setKey] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [body, setBody] = useState("")
  const [mediaUrl, setMediaUrl] = useState("")
  const [caption, setCaption] = useState("")
  const [fileName, setFileName] = useState("")
  const [showPreview, setShowPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (template) {
      setType(template.type)
      setKey(template.key)
      setPurpose(getPurposeFromKey(template.key))
      setName(template.name)
      setDescription(template.description ?? "")
      setBody(toDisplay(template.body))
      setMediaUrl(template.mediaUrl ?? "")
      setCaption(toDisplay(template.caption ?? ""))
      setFileName(template.fileName ?? "")
    } else {
      setType("TEXT")
      setKey("")
      setPurpose("_custom")
      setName("")
      setDescription("")
      setBody("")
      setMediaUrl("")
      setCaption("")
      setFileName("")
    }
    setError(null)
    setShowPreview(false)
  }, [template])

  const isMedia = type !== "TEXT"
  const resolvedKey = purpose === "_custom" ? key : purpose

  function handlePurposeChange(newPurpose: string) {
    setPurpose(newPurpose)
    if (newPurpose !== "_custom") {
      setKey(newPurpose)
      // Auto-fill name if empty
      const p = PURPOSES.find((x) => x.key === newPurpose)
      if (p && !name.trim()) setName(p.label)
    }
  }

  function validate(): string | null {
    if (!name.trim()) return "O nome é obrigatório"
    if (purpose === "_custom") {
      if (!key.trim()) return "O identificador é obrigatório"
      if (!KEY_REGEX.test(key)) return "Use apenas letras minúsculas, números, _ e -"
    }
    if (type === "TEXT" && !body.trim()) return "O texto da mensagem é obrigatório"
    if (isMedia && !mediaUrl.trim()) return "Envie um arquivo para continuar"
    return null
  }

  async function handleUpload(file: File) {
    if (!tenantId) return
    const maxMB = ACCEPTED_FILES[type].maxMB
    if (file.size > maxMB * 1024 * 1024) {
      setError(`Arquivo muito grande. Máximo: ${maxMB} MB (enviado: ${formatBytes(file.size)})`)
      return
    }
    setError(null)
    setUploading(true)
    try {
      const url = await uploadTemplateMedia(tenantId, file)
      setMediaUrl(url)
      if (type === "DOCUMENT" && !fileName) setFileName(file.name)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar arquivo")
    } finally {
      setUploading(false)
    }
  }


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setSaving(true)
    setError(null)
    try {
      const input: TemplateInput = {
        key: resolvedKey.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        body: type === "TEXT" ? toStorage(body.trim()) : toStorage(caption.trim()) || "",
        mediaUrl: isMedia ? mediaUrl.trim() || undefined : undefined,
        caption: isMedia ? toStorage(caption.trim()) || undefined : undefined,
        fileName: type === "DOCUMENT" ? fileName.trim() || undefined : undefined,
      }
      if (isEdit) {
        const { key: _k, ...rest } = input
        await update.mutateAsync({ id: template.id, body: rest })
      } else {
        await create.mutateAsync(input)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        className="fixed inset-x-4 top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-full max-w-4xl max-h-[94vh] rounded-2xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-3.5 shrink-0">
          <h3 className="text-[15px] font-semibold">
            {isEdit ? "Editar modelo de mensagem" : "Novo modelo de mensagem"}
          </h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/85 hover:text-foreground hover:bg-muted/40 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Two-column layout with independent scrolls */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0 overflow-hidden">

            {/* ═══ Left column — Configuração ═══ */}
            <div className="overflow-y-auto overscroll-contain p-6 space-y-5 lg:border-r border-border/30">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Configuração</p>

                {/* Purpose selector */}
                <div>
                  <label className={labelCls}>Finalidade</label>
                  <div className="space-y-1.5">
                    {PURPOSES.map((p) => {
                      const Icon = p.icon
                      const active = purpose === p.key
                      return (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => !isEdit && handlePurposeChange(p.key)}
                          disabled={isEdit}
                          className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                            active
                              ? "border-accent/40 bg-accent/[0.06]"
                              : "border-border/40 bg-transparent hover:border-border/80 hover:bg-muted/10"
                          } ${isEdit ? "opacity-60 cursor-default" : "cursor-pointer"}`}
                        >
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                            active ? "bg-accent/15" : "bg-muted/30"
                          }`}>
                            <Icon className={`h-4 w-4 ${active ? "text-accent" : "text-muted-foreground"}`} weight={active ? "fill" : "duotone"} />
                          </div>
                          <div className="min-w-0">
                            <p className={`text-[13px] font-medium ${active ? "text-foreground" : "text-foreground/80"}`}>{p.label}</p>
                            <p className="text-[10px] text-muted-foreground">{p.description}</p>
                          </div>
                          {active && <Check className="h-4 w-4 text-accent shrink-0 ml-auto" weight="bold" />}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Custom key — only if purpose is custom */}
                {purpose === "_custom" && (
                  <div>
                    <label className={labelCls}>
                      Identificador
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="inline h-3 w-3 ml-1 text-muted-foreground/60 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[240px] text-xs">
                            Código único usado nas automações. Use letras minúsculas, números, _ e -
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </label>
                    <input
                      type="text"
                      value={key}
                      onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                      placeholder="ex: boas_vindas, pos_consulta"
                      className={inputCls}
                      disabled={isEdit}
                    />
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className={labelCls}>Nome do modelo</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Lembrete de consulta, Boas-vindas"
                    className={inputCls}
                  />
                </div>

                {/* Type selector */}
                <div>
                  <label className={labelCls}>Tipo de mensagem</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {TYPES.map((t) => {
                      const Icon = t.icon
                      const active = type === t.value
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => { setType(t.value); if (t.value === "TEXT") setMediaUrl("") }}
                          className={`flex flex-col items-center gap-1 rounded-xl border p-2 transition-all cursor-pointer ${
                            active
                              ? "border-accent/40 bg-accent/[0.08] text-accent"
                              : "border-border/40 bg-transparent text-muted-foreground hover:border-border/80 hover:bg-muted/20"
                          }`}
                        >
                          <Icon className="h-4 w-4" weight={active ? "fill" : "duotone"} />
                          <span className="text-[10px] font-semibold">{t.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className={labelCls}>Descrição <span className="font-normal text-muted-foreground/50">(opcional)</span></label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className={inputCls}
                    placeholder="Anotação interna sobre este modelo"
                  />
                </div>
            </div>

            {/* ═══ Right column — Conteúdo ═══ */}
            <div className="overflow-y-auto overscroll-contain p-6 space-y-5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Conteúdo da mensagem</p>

              {/* TEXT body */}
              {type === "TEXT" && (
                <div>
                  <label className={labelCls}>Texto</label>
                  <VariableTextarea
                    value={body}
                    onChange={setBody}
                    rows={7}
                    placeholder={"Olá! Sua consulta está agendada.\n\nDigite @ para inserir dados automáticos como nome, data e horário."}
                  />

                  <div className="flex items-center gap-3 mt-3">
                    <button
                      type="button"
                      onClick={() => setShowPreview(!showPreview)}
                      className="flex items-center gap-1.5 text-[11px] font-medium text-accent hover:text-accent/80 transition-colors cursor-pointer"
                    >
                      {showPreview ? <EyeSlash className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      {showPreview ? "Ocultar prévia" : "Ver como fica"}
                    </button>
                  </div>
                  <AnimatePresence>
                    {showPreview && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 rounded-xl border border-border/30 bg-black/20 p-4">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Prévia no WhatsApp</p>
                          {/* WhatsApp-style bubble */}
                          <div className="flex items-end gap-2 justify-end">
                            <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-accent/15 border border-accent/20">
                              <div className="px-3.5 pt-2.5 pb-1.5">
                                <p className="text-[13px] text-foreground whitespace-pre-wrap leading-relaxed break-words">
                                  {previewBody(body) || "(mensagem vazia)"}
                                </p>
                              </div>
                              <div className="flex items-center justify-end gap-1 px-3 pb-1.5">
                                <span className="text-[10px] text-muted-foreground/75">14:30</span>
                                <Checks className="h-3.5 w-3.5 text-accent/60" weight="bold" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Media upload */}
              {isMedia && (
                <>
                  <div>
                    <label className={labelCls}>Arquivo</label>
                    <MediaUploadZone
                      type={type}
                      mediaUrl={mediaUrl}
                      onUpload={handleUpload}
                      uploading={uploading}
                      onClear={() => setMediaUrl("")}
                    />
                  </div>

                  {type !== "AUDIO" && (
                    <div>
                      <label className={labelCls}>
                        Legenda <span className="font-normal text-muted-foreground/50">(opcional)</span>
                      </label>
                      <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        rows={3}
                        className={inputCls}
                        placeholder="Texto que acompanha o arquivo. Pode usar variáveis."
                      />
                      <VariableChips onInsert={(v) => setCaption((prev) => prev + v)} />
                    </div>
                  )}

                  {type === "DOCUMENT" && (
                    <div>
                      <label className={labelCls}>
                        Nome do arquivo <span className="font-normal text-muted-foreground/50">(opcional)</span>
                      </label>
                      <input
                        type="text"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        className={inputCls}
                        placeholder="Ex: contrato.pdf"
                      />
                    </div>
                  )}

                  {/* Media preview bubble */}
                  {mediaUrl && (
                    <div className="rounded-xl border border-border/30 bg-black/20 p-4">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Prévia no WhatsApp</p>
                      <div className="flex items-end gap-2 justify-end">
                        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-accent/15 border border-accent/20 overflow-hidden">
                          {type === "IMAGE" && (
                            <img src={mediaUrl} alt="Preview" className="w-full max-h-48 object-cover" />
                          )}
                          {type === "VIDEO" && (
                            <video src={mediaUrl} className="w-full max-h-48 object-cover" />
                          )}
                          {type === "AUDIO" && (
                            <div className="px-3.5 pt-2.5 pb-1.5 flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                                <MusicNote className="h-4 w-4 text-accent" weight="fill" />
                              </div>
                              <div className="flex-1 h-1 rounded-full bg-accent/20" />
                              <span className="text-[11px] text-muted-foreground">0:00</span>
                            </div>
                          )}
                          {type === "DOCUMENT" && (
                            <div className="px-3.5 pt-2.5 pb-1.5 flex items-center gap-2">
                              <FileText className="h-8 w-8 text-accent/60 shrink-0" weight="duotone" />
                              <div className="min-w-0">
                                <p className="text-[12px] font-medium text-foreground truncate">{fileName || "documento"}</p>
                                <p className="text-[10px] text-muted-foreground">Documento</p>
                              </div>
                            </div>
                          )}
                          {caption && type !== "AUDIO" && (
                            <div className="px-3.5 pt-1.5 pb-1.5">
                              <p className="text-[13px] text-foreground whitespace-pre-wrap leading-relaxed break-words">
                                {previewBody(caption)}
                              </p>
                            </div>
                          )}
                          <div className="flex items-center justify-end gap-1 px-3 pb-1.5">
                            <span className="text-[10px] text-muted-foreground/75">14:30</span>
                            <Checks className="h-3.5 w-3.5 text-accent/60" weight="bold" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2.5"
                  >
                    <Warning className="h-4 w-4 text-rose-400 shrink-0" weight="fill" />
                    <p className="text-[12px] text-rose-400">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-border/50 px-6 py-3.5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-[13px] font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-60 transition-all cursor-pointer"
            >
              {saving ? <Spinner className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" weight="bold" />}
              {isEdit ? "Salvar alterações" : "Criar modelo"}
            </button>
          </div>
        </form>
      </motion.div>
    </>
  )
}

// ─── Tab content ────────────────────────────────────────────────────────────────

export function TemplatesTab() {
  const { data: templates = [], isLoading } = useTemplates()
  const remove = useTemplateMutations().remove
  const [editing, setEditing] = useState<MessageTemplate | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  function handleCloseForm() {
    setFormOpen(false)
    setEditing(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Modelos de mensagem</h2>
          <p className="text-[13px] text-muted-foreground mt-1">
            Crie mensagens reutilizáveis para enviar automaticamente nos lembretes e automações.
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setFormOpen(true) }}
          className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-[13px] font-semibold text-accent-foreground hover:bg-accent/90 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" weight="bold" />
          Novo modelo
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner className="h-8 w-8 text-accent animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/50 bg-muted/5 py-12 text-center">
          <TextAa className="h-12 w-12 text-muted-foreground/85 mx-auto mb-3" weight="duotone" />
          <p className="text-[14px] font-medium text-foreground">Nenhum modelo criado ainda</p>
          <p className="text-[12px] text-muted-foreground mt-1 max-w-xs mx-auto">
            Modelos são mensagens prontas que podem ser enviadas automaticamente nos lembretes e automações.
          </p>
          <button
            onClick={() => setFormOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent/10 border border-accent/30 px-4 py-2 text-[12px] font-semibold text-accent hover:bg-accent/20 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Criar primeiro modelo
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence>
            {templates.map((t, i) => {
              const typeCfg = getTypeConfig(t.type)
              const Icon = typeCfg.icon
              const reserved = RESERVED_KEY_LABELS[t.key]
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ delay: i * 0.03, ease }}
                  className="group flex items-center gap-4 rounded-xl border border-border/50 bg-card/30 p-4 hover:border-border/80 transition-colors"
                >
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-muted/50 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-muted-foreground" weight="duotone" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[14px] font-semibold text-foreground">{t.name}</p>
                      <span className="rounded-lg border border-border/40 bg-muted/20 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {typeCfg.label}
                      </span>
                      {reserved && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent cursor-help">
                                {reserved}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs max-w-[220px]">
                              Este modelo é enviado automaticamente pelo sistema antes da consulta
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    {t.description && <p className="text-[12px] text-muted-foreground mt-0.5">{t.description}</p>}
                    {t.type === "TEXT" && t.body && (
                      <p className="text-[11px] text-muted-foreground/80 mt-1 line-clamp-2 italic">{t.body}</p>
                    )}
                    {t.type !== "TEXT" && t.mediaUrl && (
                      <p className="text-[11px] text-muted-foreground/80 mt-1">
                        Arquivo anexado
                        {t.caption ? ` · "${t.caption.slice(0, 40)}${t.caption.length > 40 ? "…" : ""}"` : ""}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditing(t); setFormOpen(true) }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={async () => {
                        if (deleting === t.id) {
                          try { await remove.mutateAsync(t.id) } catch { /* ignore */ }
                          setDeleting(null)
                        } else {
                          setDeleting(t.id)
                          setTimeout(() => setDeleting(null), 3000)
                        }
                      }}
                      disabled={remove.isPending}
                      className={`flex h-8 items-center justify-center rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        deleting === t.id
                          ? "px-2 bg-rose-500/15 text-rose-400"
                          : "w-8 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10"
                      }`}
                      title={deleting === t.id ? "Confirmar exclusão" : "Excluir"}
                    >
                      {deleting === t.id ? "Confirmar" : <Trash className="h-4 w-4" />}
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {formOpen && (
          <TemplateFormModal onClose={handleCloseForm} template={editing} />
        )}
      </AnimatePresence>
    </div>
  )
}
