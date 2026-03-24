"use client"

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  FlowArrow,
  UserCircle,
  Stethoscope,
  Wrench,
  At,
  EnvelopeSimple,
} from "@phosphor-icons/react"
import { useMentions } from "@/hooks/use-mentions"
import type { MentionItem } from "@/lib/api/agent"

// ─── Types ──────────────────────────────────────────────────────────────────

type MentionCategory = "stage" | "professional" | "service" | "tool" | "template"

interface FlatMention {
  category: MentionCategory
  mention: string
  label: string
  sublabel?: string
  description?: string
}

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  /** @deprecated Legacy prop, ignored. Mentions come from API. */
  allowedTools?: unknown[]
  className?: string
  id?: string
}

// ─── Constants ──────────────────────────────────────────────────────────────

const CATEGORY_META: Record<
  MentionCategory,
  { label: string; icon: React.ElementType; chipCls: string; tagColor: string }
> = {
  stage: {
    label: "Etapas",
    icon: FlowArrow,
    chipCls: "bg-violet-500/20 text-violet-300",
    tagColor: "text-violet-400",
  },
  professional: {
    label: "Profissionais",
    icon: UserCircle,
    chipCls: "bg-sky-500/20 text-sky-300",
    tagColor: "text-sky-400",
  },
  service: {
    label: "Serviços",
    icon: Stethoscope,
    chipCls: "bg-emerald-500/20 text-emerald-300",
    tagColor: "text-emerald-400",
  },
  tool: {
    label: "Ferramentas",
    icon: Wrench,
    chipCls: "bg-amber-500/20 text-amber-300",
    tagColor: "text-amber-400",
  },
  template: {
    label: "Modelos de mensagem",
    icon: EnvelopeSimple,
    chipCls: "bg-violet-500/20 text-violet-300",
    tagColor: "text-violet-400",
  },
}

const CATEGORY_PREFIXES: Record<string, MentionCategory> = {
  "stage:": "stage",
  "professional:": "professional",
  "service:": "service",
  "tool:": "tool",
  "template:": "template",
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function normalize(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
}

function parseMentionToken(text: string, cursor: number) {
  const before = text.slice(0, cursor)
  const atIdx = before.lastIndexOf("@")
  if (atIdx === -1) return null
  const token = before.slice(atIdx + 1)
  if (token.includes("\n")) return null
  if (!token.includes(":") && /\s/.test(token)) return null
  return { atIdx, token }
}

type Segment =
  | { type: "text"; value: string }
  | { type: "mention"; value: string; resolved: boolean; category?: MentionCategory }

function tokenize(text: string, knownSorted: string[]): Segment[] {
  const segments: Segment[] = []
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
      for (const m of knownSorted) {
        if (text.startsWith(m, i)) {
          const catMatch = m.match(/^@(stage|professional|service|tool):/)
          segments.push({
            type: "mention",
            value: m,
            resolved: true,
            category: catMatch?.[1] as MentionCategory | undefined,
          })
          i += m.length
          matched = true
          break
        }
      }
      if (!matched) {
        const rest = text.slice(i)
        const unresolvedMatch = rest.match(/^@(stage|professional|service|tool):\S+/)
        if (unresolvedMatch) {
          segments.push({
            type: "mention",
            value: unresolvedMatch[0],
            resolved: false,
            category: unresolvedMatch[1] as MentionCategory,
          })
          i += unresolvedMatch[0].length
        } else {
          pushText("@")
          i++
        }
      }
    } else {
      pushText(text[i]!)
      i++
    }
  }

  return segments
}

/**
 * Measures the pixel position of a character at `index` inside a textarea.
 * Uses a hidden mirror div with identical styling.
 */
function getCaretCoordinates(
  textarea: HTMLTextAreaElement,
  index: number,
): { top: number; left: number; lineHeight: number } {
  const style = window.getComputedStyle(textarea)

  const mirror = document.createElement("div")
  mirror.style.cssText = `
    position: absolute;
    top: -9999px;
    left: -9999px;
    width: ${style.width};
    padding: ${style.padding};
    border: ${style.border};
    font: ${style.font};
    font-size: ${style.fontSize};
    font-family: ${style.fontFamily};
    font-weight: ${style.fontWeight};
    line-height: ${style.lineHeight};
    letter-spacing: ${style.letterSpacing};
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-wrap: break-word;
    box-sizing: border-box;
    overflow: hidden;
  `

  const textBefore = textarea.value.slice(0, index)
  mirror.textContent = textBefore

  const caret = document.createElement("span")
  caret.textContent = "\u200b" // zero-width space
  mirror.appendChild(caret)

  document.body.appendChild(mirror)
  const caretRect = caret.getBoundingClientRect()
  const mirrorRect = mirror.getBoundingClientRect()
  document.body.removeChild(mirror)

  const lineHeight = parseFloat(style.lineHeight) || 20

  return {
    top: caretRect.top - mirrorRect.top,
    left: caretRect.left - mirrorRect.left,
    lineHeight,
  }
}

// ─── PopupList ───────────────────────────────────────────────────────────────
// Collapsible tree: categories → (for stages) funnels → items.
// highlightIdx navigates across ALL visible rows (categories + funnel headers + items).

import { CaretRight } from "@phosphor-icons/react"

type NavRow =
  | { kind: "cat"; cat: MentionCategory; count: number }
  | { kind: "funnel"; funnel: string; cat: MentionCategory; count: number }
  | { kind: "item"; item: FlatMention }

interface PopupListProps {
  filtered: FlatMention[]
  highlightIdx: number
  onHighlight: (idx: number) => void
  onSelect: (item: FlatMention) => void
  // Controlled open state lifted up so keyboard nav can toggle
  openCats: Set<MentionCategory>
  openFunnels: Set<string>
  onToggleCat: (cat: MentionCategory) => void
  onToggleFunnel: (funnel: string) => void
}

function PopupList({
  filtered,
  highlightIdx,
  onHighlight,
  onSelect,
  openCats,
  openFunnels,
  onToggleCat,
  onToggleFunnel,
}: PopupListProps) {
  // Build visible rows respecting open state
  const rows = useMemo<NavRow[]>(() => {
    const result: NavRow[] = []

    // Group filtered by category
    const byCategory = new Map<MentionCategory, FlatMention[]>()
    for (const item of filtered) {
      const arr = byCategory.get(item.category) ?? []
      arr.push(item)
      byCategory.set(item.category, arr)
    }

    for (const [cat, items] of byCategory) {
      result.push({ kind: "cat", cat, count: items.length })

      if (!openCats.has(cat)) continue

      if (cat === "stage") {
        // Group stages by funnel (sublabel)
        const byFunnel = new Map<string, FlatMention[]>()
        for (const item of items) {
          const key = item.sublabel ?? "Sem funil"
          const arr = byFunnel.get(key) ?? []
          arr.push(item)
          byFunnel.set(key, arr)
        }
        for (const [funnel, fItems] of byFunnel) {
          result.push({ kind: "funnel", funnel, cat, count: fItems.length })
          if (!openFunnels.has(funnel)) continue
          for (const item of fItems) result.push({ kind: "item", item })
        }
      } else {
        for (const item of items) result.push({ kind: "item", item })
      }
    }

    return result
  }, [filtered, openCats, openFunnels])

  return (
    <div className="py-1">
      {rows.map((row, i) => {
        const isHl = i === highlightIdx

        if (row.kind === "cat") {
          const meta = CATEGORY_META[row.cat]
          const Icon = meta.icon
          const open = openCats.has(row.cat)
          return (
            <button
              key={`cat-${row.cat}`}
              type="button"
              data-idx={i}
              onMouseEnter={() => onHighlight(i)}
              onClick={() => onToggleCat(row.cat)}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left cursor-pointer transition-colors ${
                isHl ? "bg-accent/10" : "hover:bg-muted/30"
              }`}
            >
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                isHl ? "border-accent/30 bg-accent/10" : "border-border/40 bg-muted/20"
              }`}>
                <Icon className={`h-3.5 w-3.5 ${isHl ? meta.tagColor : "text-muted-foreground/85"}`} weight="duotone" />
              </div>
              <span className={`flex-1 text-[13px] font-medium ${isHl ? "text-foreground" : "text-foreground/70"}`}>
                {meta.label}
              </span>
              <span className="text-[10px] text-muted-foreground/90 mr-1">{row.count}</span>
              <CaretRight
                className={`h-3 w-3 text-muted-foreground/90 transition-transform duration-150 ${open ? "rotate-90" : ""}`}
                weight="bold"
              />
            </button>
          )
        }

        if (row.kind === "funnel") {
          const open = openFunnels.has(row.funnel)
          return (
            <button
              key={`funnel-${row.funnel}`}
              type="button"
              data-idx={i}
              onMouseEnter={() => onHighlight(i)}
              onClick={() => onToggleFunnel(row.funnel)}
              className={`flex w-full items-center gap-2 pl-9 pr-3 py-1.5 text-left cursor-pointer transition-colors ${
                isHl ? "bg-accent/10" : "hover:bg-muted/20"
              }`}
            >
              <FlowArrow className={`h-3 w-3 shrink-0 ${isHl ? "text-violet-400" : "text-muted-foreground/85"}`} weight="duotone" />
              <span className={`flex-1 text-[12px] font-medium truncate ${isHl ? "text-foreground" : "text-muted-foreground/90"}`}>
                {row.funnel}
              </span>
              <span className="text-[10px] text-muted-foreground/85 mr-0.5">{row.count}</span>
              <CaretRight
                className={`h-2.5 w-2.5 text-muted-foreground/85 transition-transform duration-150 ${open ? "rotate-90" : ""}`}
                weight="bold"
              />
            </button>
          )
        }

        // item
        const { item } = row
        const meta = CATEGORY_META[item.category]
        const Icon = meta.icon
        const isStage = item.category === "stage"
        return (
          <button
            key={item.mention}
            type="button"
            role="option"
            data-idx={i}
            aria-selected={isHl}
            onMouseEnter={() => onHighlight(i)}
            onClick={() => onSelect(item)}
            className={`flex w-full items-center gap-2.5 text-left transition-colors cursor-pointer py-1.5 pr-3 ${
              isStage ? "pl-12" : "pl-9"
            } ${isHl ? "bg-accent/15" : "hover:bg-muted/40"}`}
          >
            <Icon
              className={`h-3.5 w-3.5 shrink-0 ${isHl ? meta.tagColor : "text-muted-foreground/85"}`}
              weight="duotone"
            />
            <span className={`flex-1 text-[13px] font-medium truncate ${isHl ? "text-foreground" : "text-foreground/80"}`}>
              {item.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Component ──────────────────────────────────────────────────────────────

export function InstructionTextarea({
  value,
  onChange,
  placeholder,
  rows = 5,
  className,
  id,
}: Props) {
  const { data: mentionData } = useMentions()

  const wrapperRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  const [showPopup, setShowPopup] = useState(false)
  const [atIdx, setAtIdx] = useState(0)
  const [token, setToken] = useState("")
  const [filterQuery, setFilterQuery] = useState("")
  const [highlightIdx, setHighlightIdx] = useState(0)
  const [openCats, setOpenCats] = useState<Set<MentionCategory>>(new Set())
  const [openFunnels, setOpenFunnels] = useState<Set<string>>(new Set())
  const [mounted, setMounted] = useState(false)
  const [popupPos, setPopupPos] = useState<{
    top: number
    left: number
    width: number
    above: boolean
  } | null>(null)

  useEffect(() => setMounted(true), [])

  // ── Flatten all mentions ────────────────────────────────────────────────

  const allMentions = useMemo<FlatMention[]>(() => {
    if (!mentionData) return []
    const map = (cat: MentionCategory, items: MentionItem[]): FlatMention[] =>
      items.map((it) => ({
        category: cat,
        mention: it.mention,
        label: it.label,
        sublabel: it.sublabel,
        description: it.description,
      }))
    return [
      ...map("stage", mentionData.stages ?? []),
      ...map("professional", mentionData.professionals ?? []),
      ...map("service", mentionData.services ?? []),
      ...map("tool", mentionData.tools ?? []),
      ...map("template", mentionData.templates ?? []),
    ]
  }, [mentionData])

  const knownSorted = useMemo(
    () => allMentions.map((m) => m.mention).sort((a, b) => b.length - a.length),
    [allMentions],
  )

  // ── Filter mentions for popup ───────────────────────────────────────────

  const filtered = useMemo<FlatMention[]>(() => {
    if (!showPopup) return []
    const q = normalize(filterQuery)
    let categoryFilter: MentionCategory | null = null
    let nameQuery = q

    for (const [prefix, cat] of Object.entries(CATEGORY_PREFIXES)) {
      if (q.startsWith(prefix)) {
        categoryFilter = cat
        nameQuery = q.slice(prefix.length)
        break
      }
    }

    return allMentions.filter((m) => {
      if (categoryFilter && m.category !== categoryFilter) return false
      if (!nameQuery) return true
      return (
        normalize(m.label).includes(nameQuery) ||
        (m.sublabel && normalize(m.sublabel).includes(nameQuery)) ||
        normalize(m.category).startsWith(nameQuery)
      )
    })
  }, [showPopup, filterQuery, allMentions])

  // ── Compute popup position near the @ caret ─────────────────────────────

  const updatePopupPos = useCallback((cursorIdx?: number) => {
    const ta = textareaRef.current
    if (!ta) return

    const idx = cursorIdx ?? ta.selectionStart ?? 0
    const taRect = ta.getBoundingClientRect()
    const coords = getCaretCoordinates(ta, idx)

    // Scroll offset inside textarea
    const scrollTop = ta.scrollTop

    // Absolute position of the caret on screen
    const caretTop = taRect.top + coords.top - scrollTop
    const caretLeft = taRect.left + coords.left
    const lineH = coords.lineHeight

    // Popup height estimate (max ~280px)
    const popupH = 280
    const spaceBelow = window.innerHeight - (caretTop + lineH)
    const above = spaceBelow < popupH + 16

    setPopupPos({
      top: above ? caretTop - 8 : caretTop + lineH + 4,
      left: Math.min(caretLeft, window.innerWidth - 420),
      width: Math.min(taRect.width, 400),
      above,
    })
  }, [])

  useEffect(() => {
    if (!showPopup) { setPopupPos(null); return }
    updatePopupPos(atIdx)
    // Recompute on scroll/resize
    const ta = textareaRef.current
    function onScroll() { updatePopupPos(atIdx) }
    ta?.addEventListener("scroll", onScroll)
    window.addEventListener("resize", onScroll)
    return () => {
      ta?.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [showPopup, atIdx, updatePopupPos])

  // ── Scroll highlighted into view ────────────────────────────────────────

  useEffect(() => {
    if (!popupRef.current) return
    const el = popupRef.current.querySelector(`[data-idx="${highlightIdx}"]`) as HTMLElement | null
    el?.scrollIntoView({ block: "nearest" })
  }, [highlightIdx])

  // ── Scroll sync overlay ──────────────────────────────────────────────────

  function syncScroll() {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  // ── Insert mention ──────────────────────────────────────────────────────

  const insertMention = useCallback(
    (item: FlatMention) => {
      const cursor = textareaRef.current?.selectionStart ?? (atIdx + 1 + token.length)
      const before = value.slice(0, atIdx)
      const after = value.slice(cursor)
      const newText = `${before}${item.mention} ${after}`
      onChange(newText)
      setShowPopup(false)
      setHighlightIdx(0)
      const newCursor = atIdx + item.mention.length + 1
      requestAnimationFrame(() => {
        const ta = textareaRef.current
        if (ta) {
          ta.focus()
          ta.setSelectionRange(newCursor, newCursor)
        }
      })
    },
    [value, atIdx, token, onChange],
  )

  // ── onChange ─────────────────────────────────────────────────────────────

  function openPopup(parsed: { atIdx: number; token: string }) {
    setAtIdx(parsed.atIdx)
    setToken(parsed.token)
    setFilterQuery(parsed.token)
    setShowPopup(true)
    setHighlightIdx(0)
    // Reset collapsed state on fresh open (no filter typed yet)
    if (!parsed.token) {
      setOpenCats(new Set())
      setOpenFunnels(new Set())
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const v = e.target.value
    onChange(v)
    const cursor = e.target.selectionStart ?? v.length
    const parsed = parseMentionToken(v, cursor)
    if (parsed) {
      // When user is actively filtering, auto-expand all categories
      if (parsed.token) {
        setOpenCats(new Set(["stage", "professional", "service", "tool"] as MentionCategory[]))
        setOpenFunnels((prev) => {
          // Keep existing open funnels, new ones will appear naturally
          return prev
        })
      }
      openPopup(parsed)
    } else {
      setShowPopup(false)
    }
  }

  // ── onClick ─────────────────────────────────────────────────────────────

  function handleClick() {
    if (!showPopup) return
    const cursor = textareaRef.current?.selectionStart ?? 0
    const parsed = parseMentionToken(value, cursor)
    if (!parsed) setShowPopup(false)
    else openPopup(parsed)
  }

  // ── Compute visible rows for keyboard nav ──────────────────────────────

  const visibleRows = useMemo<NavRow[]>(() => {
    if (!showPopup) return []
    const byCategory = new Map<MentionCategory, FlatMention[]>()
    for (const item of filtered) {
      const arr = byCategory.get(item.category) ?? []
      arr.push(item)
      byCategory.set(item.category, arr)
    }
    const result: NavRow[] = []
    for (const [cat, items] of byCategory) {
      result.push({ kind: "cat", cat, count: items.length })
      if (!openCats.has(cat)) continue
      if (cat === "stage") {
        const byFunnel = new Map<string, FlatMention[]>()
        for (const item of items) {
          const key = item.sublabel ?? "Sem funil"
          const arr = byFunnel.get(key) ?? []
          arr.push(item)
          byFunnel.set(key, arr)
        }
        for (const [funnel, fItems] of byFunnel) {
          result.push({ kind: "funnel", funnel, cat, count: fItems.length })
          if (!openFunnels.has(funnel)) continue
          for (const item of fItems) result.push({ kind: "item", item })
        }
      } else {
        for (const item of items) result.push({ kind: "item", item })
      }
    }
    return result
  }, [showPopup, filtered, openCats, openFunnels])

  // ── onKeyDown ───────────────────────────────────────────────────────────

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!showPopup || visibleRows.length === 0) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightIdx((i) => (i + 1) % visibleRows.length)
      return
    }
    if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightIdx((i) => (i - 1 + visibleRows.length) % visibleRows.length)
      return
    }
    if (e.key === "Escape") {
      e.preventDefault()
      setShowPopup(false)
      return
    }

    const row = visibleRows[highlightIdx]
    if (!row) return

    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault()
      if (row.kind === "item") {
        insertMention(row.item)
      } else if (row.kind === "cat") {
        setOpenCats((prev) => {
          const next = new Set(prev)
          if (next.has(row.cat)) next.delete(row.cat)
          else next.add(row.cat)
          return next
        })
      } else if (row.kind === "funnel") {
        setOpenFunnels((prev) => {
          const next = new Set(prev)
          if (next.has(row.funnel)) next.delete(row.funnel)
          else next.add(row.funnel)
          return next
        })
      }
      return
    }

    // ArrowRight expands, ArrowLeft collapses
    if (e.key === "ArrowRight") {
      e.preventDefault()
      if (row.kind === "cat") setOpenCats((p) => new Set([...p, row.cat]))
      else if (row.kind === "funnel") setOpenFunnels((p) => new Set([...p, row.funnel]))
      return
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault()
      if (row.kind === "cat") setOpenCats((p) => { const n = new Set(p); n.delete(row.cat); return n })
      else if (row.kind === "funnel") setOpenFunnels((p) => { const n = new Set(p); n.delete(row.funnel); return n })
      return
    }
  }

  // ── Close on outside click ──────────────────────────────────────────────

  useEffect(() => {
    if (!showPopup) return
    function onMd(e: MouseEvent) {
      if (
        !wrapperRef.current?.contains(e.target as Node) &&
        !popupRef.current?.contains(e.target as Node)
      ) {
        setShowPopup(false)
      }
    }
    document.addEventListener("mousedown", onMd)
    return () => document.removeEventListener("mousedown", onMd)
  }, [showPopup])

  // ── Tokenize for overlay ────────────────────────────────────────────────

  const segments = useMemo(() => tokenize(value, knownSorted), [value, knownSorted])
  const hasText = value.length > 0

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div
      ref={wrapperRef}
      className={`group relative w-full flex flex-col rounded-xl border border-border/60 bg-background/50 transition-all duration-200 focus-within:ring-2 focus-within:ring-accent/30 focus-within:border-accent/40${className ? ` ${className}` : ""}`}
    >
      {/* Editor area */}
      <div className="flex-1 relative">
        {/* Fake placeholder */}
        {!hasText && placeholder && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[1] overflow-hidden px-4 py-3 text-[14px] leading-[1.625] text-muted-foreground/90 whitespace-pre-wrap break-words"
          >
            {placeholder}
          </div>
        )}

        {/* Highlight overlay — same font metrics as textarea */}
        <div
          ref={overlayRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
        >
          <div className="px-4 py-3 text-[14px] leading-[1.625] whitespace-pre-wrap break-words">
            {hasText
              ? segments.map((seg, i) => {
                  if (seg.type === "text") {
                    return (
                      <span key={i} className="text-foreground">
                        {seg.value}
                      </span>
                    )
                  }
                  const meta = seg.category ? CATEGORY_META[seg.category] : null
                  return (
                    <span
                      key={i}
                      className={`rounded-[3px] ${
                        seg.resolved && meta
                          ? meta.chipCls
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

        {/* Actual textarea — transparent text so overlay shows, caret stays visible */}
        <textarea
          ref={textareaRef}
          id={id}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onClick={handleClick}
          onScroll={syncScroll}
          rows={rows}
          spellCheck={false}
          className="relative z-[2] w-full h-full resize-none bg-transparent px-4 py-3 text-[14px] leading-[1.625] outline-none selection:bg-accent/30"
          style={{
            color: "transparent",
            caretColor: "rgb(255 255 255 / 0.9)",
          }}
        />
      </div>

      {/* Bottom hint */}
      <div className="shrink-0 flex items-center gap-1.5 border-t border-border/30 px-3 py-1.5">
        <At className="h-3 w-3 text-muted-foreground/85" weight="bold" />
        <p className="text-[10px] text-muted-foreground/85 select-none">
          Digite{" "}
          <kbd className="rounded border border-border/30 bg-muted/20 px-1 py-px font-mono text-[9px]">
            @
          </kbd>{" "}
          para mencionar etapas, profissionais, serviços ou ferramentas
        </p>
      </div>

      {/* Autocomplete popup — portal so it escapes overflow:hidden */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {showPopup && filtered.length > 0 && popupPos && (
              <motion.div
                key="mention-popup"
                ref={popupRef}
                initial={{ opacity: 0, y: popupPos.above ? 4 : -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: popupPos.above ? 4 : -4, scale: 0.97 }}
                transition={{ duration: 0.1 }}
                role="listbox"
                style={{
                  position: "fixed",
                  top: popupPos.above ? undefined : popupPos.top,
                  bottom: popupPos.above
                    ? window.innerHeight - popupPos.top
                    : undefined,
                  left: popupPos.left,
                  width: popupPos.width,
                  zIndex: 99999,
                }}
                className="rounded-xl border border-border/60 bg-popover/95 backdrop-blur-xl shadow-2xl shadow-black/30 overflow-hidden"
              >
                <div className="max-h-[300px] overflow-y-auto">
                  <PopupList
                    filtered={filtered}
                    highlightIdx={highlightIdx}
                    onHighlight={setHighlightIdx}
                    onSelect={insertMention}
                    openCats={openCats}
                    openFunnels={openFunnels}
                    onToggleCat={(cat) =>
                      setOpenCats((prev) => {
                        const next = new Set(prev)
                        if (next.has(cat)) next.delete(cat)
                        else next.add(cat)
                        return next
                      })
                    }
                    onToggleFunnel={(funnel) =>
                      setOpenFunnels((prev) => {
                        const next = new Set(prev)
                        if (next.has(funnel)) next.delete(funnel)
                        else next.add(funnel)
                        return next
                      })
                    }
                  />
                </div>
                <div className="border-t border-border/30 px-3 py-1.5">
                  <p className="text-[10px] text-muted-foreground/90 select-none">
                    <kbd className="rounded border border-border/30 bg-muted/20 px-1 py-px font-mono text-[9px]">
                      ↑↓
                    </kbd>{" "}
                    navegar
                    <span className="mx-1.5 text-border">·</span>
                    <kbd className="rounded border border-border/30 bg-muted/20 px-1 py-px font-mono text-[9px]">
                      Enter
                    </kbd>{" "}
                    inserir
                    <span className="mx-1.5 text-border">·</span>
                    <kbd className="rounded border border-border/30 bg-muted/20 px-1 py-px font-mono text-[9px]">
                      Esc
                    </kbd>{" "}
                    fechar
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}

      {/* Empty state */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {showPopup && filtered.length === 0 && mentionData && popupPos && (
              <motion.div
                key="mention-empty"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.1 }}
                style={{
                  position: "fixed",
                  top: popupPos.above ? undefined : popupPos.top,
                  bottom: popupPos.above
                    ? window.innerHeight - popupPos.top
                    : undefined,
                  left: popupPos.left,
                  width: Math.min(popupPos.width, 360),
                  zIndex: 99999,
                }}
                className="rounded-xl border border-border/60 bg-popover/95 backdrop-blur-xl px-4 py-3 shadow-xl shadow-black/20"
              >
                <p className="text-[12px] text-muted-foreground">
                  Nenhuma menção para{" "}
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
