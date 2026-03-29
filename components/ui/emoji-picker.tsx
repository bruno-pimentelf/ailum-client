"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MagnifyingGlass, X } from "@phosphor-icons/react"

const EMOJI_CATEGORIES: { label: string; icon: string; emojis: string[] }[] = [
  {
    label: "Frequentes",
    icon: "⏰",
    emojis: ["👋", "🤖", "🔍", "💳", "📅", "✨", "💬", "📞", "🎯", "💡", "⚡", "🚀", "✅", "❌", "⚠️", "📊", "🏥", "💊", "🩺", "🧬"],
  },
  {
    label: "Pessoas",
    icon: "😊",
    emojis: ["😀", "😊", "🤝", "👍", "👏", "🙌", "💪", "🧠", "👀", "👂", "🫀", "🦷", "🦴", "💆", "🧑‍⚕️", "👨‍⚕️", "👩‍⚕️", "🧑‍💼", "👨‍💼", "👩‍💼"],
  },
  {
    label: "Objetos",
    icon: "💼",
    emojis: ["💼", "📋", "📁", "📌", "📍", "🗓️", "⏱️", "🔔", "📧", "📱", "💻", "🖥️", "⌨️", "🖱️", "📠", "📟", "📡", "🔧", "🔩", "⚙️"],
  },
  {
    label: "Símbolos",
    icon: "💫",
    emojis: ["💫", "✨", "🔥", "💥", "❄️", "🌊", "🌪️", "⚡", "🌟", "⭐", "🏆", "🥇", "🎯", "💎", "♾️", "🔄", "↩️", "⏩", "⏪", "🔁"],
  },
  {
    label: "Saúde",
    icon: "🏥",
    emojis: ["🏥", "💊", "🩺", "🧬", "🩻", "🩹", "💉", "🧪", "🔬", "🧫", "🧲", "♿", "🩼", "🩺", "🏋️", "🧘", "🤸", "❤️", "🫀", "🧠"],
  },
  {
    label: "Dinheiro",
    icon: "💰",
    emojis: ["💰", "💵", "💴", "💶", "💷", "💸", "💳", "🏦", "📈", "📉", "💹", "🤑", "💱", "🪙", "💲", "🏷️", "🎁", "🛒", "🛍️", "🧾"],
  },
]

interface EmojiPickerProps {
  value: string
  onChange: (emoji: string) => void
  onClose?: () => void
}

export function EmojiPicker({ value, onChange, onClose }: EmojiPickerProps) {
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState(0)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  const filtered = search.trim()
    ? EMOJI_CATEGORIES.flatMap((c) => c.emojis).filter(() => true) // all when searching
    : null

  // Simple search: return all emojis when search is active (emoji search by description isn't trivial)
  const displayEmojis = search.trim()
    ? EMOJI_CATEGORIES.flatMap((c) => c.emojis)
    : EMOJI_CATEGORIES[activeCategory].emojis

  const handleSelect = useCallback(
    (emoji: string) => {
      onChange(emoji)
      onClose?.()
    },
    [onChange, onClose]
  )

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -4 }}
      transition={{ duration: 0.15, ease: [0.33, 1, 0.68, 1] }}
      className="w-72 rounded-2xl border border-border/80 bg-surface shadow-2xl shadow-foreground/12 flex flex-col overflow-hidden"
    >
      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-foreground/[0.06]">
        <MagnifyingGlass className="h-3.5 w-3.5 text-foreground/85 shrink-0" />
        <input
          ref={searchRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar emoji..."
          className="flex-1 bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
        />
        {search && (
          <button onClick={() => setSearch("")} className="cursor-pointer text-foreground/85 hover:text-foreground transition-colors">
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Category tabs */}
      {!search.trim() && (
        <div className="flex items-center gap-0.5 px-2 pt-2 pb-1">
          {EMOJI_CATEGORIES.map((cat, i) => (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(i)}
              title={cat.label}
              className={`cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg text-base transition-all duration-150 ${
                activeCategory === i
                  ? "bg-foreground/10 shadow-sm"
                  : "hover:bg-foreground/[0.05] opacity-50 hover:opacity-80"
              }`}
            >
              {cat.icon}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-8 gap-0.5 px-2 py-2 max-h-44 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/[0.08]">
        {displayEmojis.map((emoji, i) => (
          <button
            key={`${emoji}-${i}`}
            onClick={() => handleSelect(emoji)}
            className={`cursor-pointer flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-all duration-100 hover:bg-foreground/10 hover:scale-110 ${
              value === emoji ? "bg-foreground/[0.12] ring-1 ring-white/20" : ""
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Current selection */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-foreground/[0.06]">
        <span className="text-xl">{value}</span>
        <span className="text-[11px] text-foreground/85">Selecionado</span>
      </div>
    </motion.div>
  )
}

interface EmojiButtonProps {
  value: string
  onChange: (emoji: string) => void
  className?: string
}

export function EmojiButton({ value, onChange, className }: EmojiButtonProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="cursor-pointer flex h-11 w-11 items-center justify-center rounded-xl border border-border/80 bg-foreground/[0.04] text-2xl transition-all duration-150 hover:bg-foreground/[0.08] hover:border-white/[0.18] hover:scale-105 active:scale-95"
        title="Escolher emoji"
      >
        {value}
      </button>
      <AnimatePresence>
        {open && (
          <div className="absolute left-0 top-full mt-2 z-[100]">
            <EmojiPicker
              value={value}
              onChange={(e) => { onChange(e); setOpen(false) }}
              onClose={() => setOpen(false)}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
