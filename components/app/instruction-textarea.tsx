"use client"

import { useState, useRef, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import type { AllowedTool } from "@/lib/api/funnels"

const TOOL_LABELS: Record<string, string> = {
  search_availability: "Buscar horários",
  create_appointment: "Agendar consulta",
  cancel_appointment: "Cancelar consulta",
  reschedule_appointment: "Remarcar consulta",
  generate_pix: "Gerar cobrança PIX",
  move_stage: "Mover entre etapas",
  notify_operator: "Escalar para humano",
  send_message: "Enviar mensagem",
}

type Props = {
  value: string
  onChange: (value: string) => void
  allowedTools: AllowedTool[]
  placeholder?: string
  rows?: number
  className?: string
  id?: string
}

export function InstructionTextarea({
  value,
  onChange,
  allowedTools,
  placeholder,
  rows = 5,
  className,
  id,
}: Props) {
  const [showMention, setShowMention] = useState(false)
  const [mentionStart, setMentionStart] = useState(0)
  const [highlightIndex, setHighlightIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const toolsForMention = allowedTools.map((id) => ({
    id,
    label: TOOL_LABELS[id] ?? id,
  }))

  useEffect(() => {
    if (!showMention || toolsForMention.length === 0) return
    function handleClickOutside(e: MouseEvent) {
      const el = textareaRef.current
      if (!el?.parentElement?.contains(e.target as Node)) setShowMention(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showMention, toolsForMention.length])

  function insertTool(toolId: string) {
    const before = value.slice(0, mentionStart)
    const after = value.slice(mentionStart + 1)
    const inserted = `${before}${toolId} `
    onChange(inserted + after)
    setShowMention(false)
    setHighlightIndex(0)
    requestAnimationFrame(() => {
      const ta = textareaRef.current
      if (ta) {
        ta.focus()
        const pos = inserted.length
        ta.setSelectionRange(pos, pos)
      }
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (showMention && toolsForMention.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setHighlightIndex((i) => (i + 1) % toolsForMention.length)
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setHighlightIndex((i) => (i - 1 + toolsForMention.length) % toolsForMention.length)
        return
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault()
        insertTool(toolsForMention[highlightIndex]!.id)
        return
      }
      if (e.key === "Escape") {
        e.preventDefault()
        setShowMention(false)
        return
      }
    }

    if (e.key === "@") {
      const ta = e.currentTarget
      const start = ta.selectionStart ?? 0
      setMentionStart(start)
      setShowMention(true)
      setHighlightIndex(0)
    }
  }

  return (
    <div className="relative w-full">
      <Textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={className}
      />
      {showMention && toolsForMention.length > 0 && (
        <div
          className="absolute z-50 mt-1 w-full min-w-[200px] max-w-md rounded-xl border border-border/60 bg-popover shadow-xl shadow-black/20 overflow-hidden"
          role="listbox"
        >
          <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 border-b border-border/40">
            Referenciar ferramenta
          </p>
          <div className="max-h-[180px] overflow-y-auto py-1">
            {toolsForMention.map((tool, i) => (
              <button
                key={tool.id}
                type="button"
                role="option"
                aria-selected={i === highlightIndex}
                onMouseEnter={() => setHighlightIndex(i)}
                onClick={() => insertTool(tool.id)}
                className={`block w-full px-3 py-2.5 text-left text-[13px] transition-colors ${
                  i === highlightIndex ? "bg-accent/15 text-accent" : "text-foreground hover:bg-muted/50"
                }`}
              >
                <span className="font-medium">{tool.label}</span>
                <span className="ml-2 text-[11px] text-muted-foreground/80 font-mono">({tool.id})</span>
              </button>
            ))}
          </div>
          <p className="px-3 py-1.5 text-[10px] text-muted-foreground/60 border-t border-border/40">
            ↑↓ navegar · Enter inserir
          </p>
        </div>
      )}
    </div>
  )
}
