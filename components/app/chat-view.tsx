"use client"

import { useState, useRef, useEffect } from "react"
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
} from "@phosphor-icons/react"

const ease = [0.33, 1, 0.68, 1] as const

// ─── Types ────────────────────────────────────────────────────────────────────

export type Message = {
  id: string
  text: string
  time: string
  from: "ai" | "contact"
  read?: boolean
}

export type ChatContact = {
  id: string
  name: string
  online?: boolean
  time: string
  messages: Message[]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
  const colors = [
    "bg-accent/20 text-accent",
    "bg-violet-500/20 text-violet-400",
    "bg-emerald-500/20 text-emerald-400",
    "bg-rose-500/20 text-rose-400",
    "bg-amber-500/20 text-amber-400",
  ]
  const color = colors[name.charCodeAt(0) % colors.length]
  const sz = size === "sm" ? "h-8 w-8 text-[11px]" : size === "lg" ? "h-10 w-10 text-[14px]" : "h-9 w-9 text-[12px]"
  return (
    <div className={`${sz} ${color} shrink-0 rounded-full flex items-center justify-center font-semibold border border-white/5`}>
      {initials}
    </div>
  )
}

function MessageBubble({ msg, index }: { msg: Message; index: number }) {
  const isAI = msg.from === "ai"
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease }}
      className={`flex ${isAI ? "justify-start" : "justify-end"}`}
    >
      {isAI && (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 border border-accent/20 mr-2 mt-1 self-end">
          <Robot className="h-3.5 w-3.5 text-accent" weight="fill" />
        </div>
      )}
      <div
        className={`max-w-[72%] rounded-2xl px-4 py-2.5 ${
          isAI
            ? "bg-card border border-border/60 rounded-bl-sm text-foreground"
            : "bg-accent/15 border border-accent/20 rounded-br-sm text-foreground"
        }`}
      >
        <p className="text-[13px] leading-relaxed">{msg.text}</p>
        <div className={`mt-1 flex items-center gap-1 ${isAI ? "justify-start" : "justify-end"}`}>
          <span className="text-[10px] text-muted-foreground/40">{msg.time}</span>
          {!isAI && (
            msg.read
              ? <Checks className="h-3 w-3 text-accent" />
              : <Check className="h-3 w-3 text-muted-foreground/40" />
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── ChatView ─────────────────────────────────────────────────────────────────

interface ChatViewProps {
  contact: ChatContact
}

export function ChatView({ contact }: ChatViewProps) {
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [contact.id])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    setInputValue("")
  }

  return (
    <motion.div
      key={contact.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-1 flex-col min-h-0 overflow-hidden"
    >
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar name={contact.name} size="sm" />
            {contact.online && (
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 border-2 border-background" />
            )}
          </div>
          <div>
            <p className="text-[13px] font-semibold text-foreground leading-tight">{contact.name}</p>
            <p className="text-[11px] text-muted-foreground/50 leading-tight">
              {contact.online ? "Online agora" : `Visto às ${contact.time}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          {[Phone, ArrowCounterClockwise, ChatCircleText, Smiley, Star, BookmarkSimple, Archive, DotsThree].map((Icon, i) => (
            <button
              key={i}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 transition-colors duration-150"
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3">
        {contact.messages.map((msg, i) => (
          <MessageBubble key={msg.id} msg={msg} index={i} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-border px-4 py-3">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 transition-colors duration-150"
          >
            <PaperclipHorizontal className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 transition-colors duration-150"
          >
            <Microphone className="h-4 w-4" />
          </button>
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Digite uma mensagem..."
            className="flex-1 h-9 rounded-xl border border-border bg-card/50 px-4 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all duration-300"
          />
          <motion.button
            type="submit"
            whileTap={{ scale: 0.92 }}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
              inputValue.trim()
                ? "bg-accent text-accent-foreground shadow-md shadow-accent/20"
                : "bg-muted/40 text-muted-foreground/40"
            }`}
          >
            <PaperPlaneTilt className="h-4 w-4" weight="fill" />
          </motion.button>
        </form>
      </div>
    </motion.div>
  )
}
