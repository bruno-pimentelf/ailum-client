"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  PaperPlaneTilt,
  Robot,
  WifiSlash,
  ArrowClockwise,
  ChartLineUp,
  CaretDown,
  CaretRight,
  CheckCircle,
  ArrowsClockwise,
} from "@phosphor-icons/react"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"
import { usePlaygroundContact, usePlaygroundMessages, usePlaygroundTyping, useAgentAudit } from "@/hooks/use-playground"
import { sendPlaygroundMessage, confirmPlayground } from "@/lib/api/agent"
import type { FirestoreMessage } from "@/lib/types/firestore"
import type { AgentAuditEntry } from "@/lib/api/agent"

const ease = [0.33, 1, 0.68, 1] as const

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2, ease }}
      className="flex items-end gap-2"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 border border-accent/20">
        <Robot className="h-3.5 w-3.5 text-accent" weight="fill" />
      </div>
      <div className="rounded-2xl rounded-bl-md px-4 py-2.5 bg-card border border-border/60">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12, ease: "easeInOut" }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Audit entry card ─────────────────────────────────────────────────────────

function AuditEntryCard({ entry }: { entry: AgentAuditEntry }) {
  const [open, setOpen] = useState(false)
  const date = new Date(entry.createdAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          {open ? (
            <CaretDown className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
          ) : (
            <CaretRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
          )}
          <span className="text-[11px] font-medium text-foreground truncate">
            {entry.routerIntent ?? entry.status}
          </span>
          {entry.routerConfidence != null && (
            <span className="text-[10px] text-muted-foreground/50 shrink-0">
              {Math.round(entry.routerConfidence * 100)}%
            </span>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground/40 shrink-0">{date}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-0 flex flex-col gap-1.5 border-t border-border/40">
              {entry.durationMs != null && (
                <div className="flex justify-between text-[10px] text-muted-foreground/60">
                  <span>Duração</span>
                  <span>{entry.durationMs}ms</span>
                </div>
              )}
              {(entry.totalInputTokens ?? 0) + (entry.totalOutputTokens ?? 0) > 0 && (
                <div className="flex justify-between text-[10px] text-muted-foreground/60">
                  <span>Tokens</span>
                  <span>
                    {(entry.totalInputTokens ?? 0) + (entry.totalOutputTokens ?? 0)} total
                  </span>
                </div>
              )}
              {entry.auditDetails?.map((d) => (
                <div
                  key={d.label}
                  className="flex flex-col gap-0.5 py-1 border-b border-border/30 last:border-0"
                >
                  <span className="text-[10px] font-medium text-muted-foreground/80">{d.label}</span>
                  <span className="text-[11px] text-foreground/90">{d.detail}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  isUser,
  animate,
}: {
  msg: FirestoreMessage | { id: string; role: string; content: string; createdAt?: { toDate: () => Date } }
  isUser: boolean
  animate?: boolean
}) {
  const time = msg.createdAt?.toDate?.()
    ? new Date(msg.createdAt.toDate()).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : ""

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease }}
      className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 border border-accent/20 mb-1">
          <Robot className="h-3.5 w-3.5 text-accent" weight="fill" />
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? "bg-accent/15 border border-accent/20 rounded-br-md"
            : "bg-card border border-border/60 rounded-bl-md"
        }`}
      >
        <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words text-foreground">
          {msg.content}
        </p>
        <span className="text-[10px] text-muted-foreground/40 mt-1 block">{time}</span>
      </div>
    </motion.div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PlaygroundPage() {
  const [inputValue, setInputValue] = useState("")
  const [optimisticMsgs, setOptimisticMsgs] = useState<
    Array<Pick<FirestoreMessage, "id" | "role" | "type" | "content"> & { createdAt: { toDate: () => Date } }>
  >([])
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const sessionIdRef = useRef<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const prevCountRef = useRef(0)

  if (!sessionIdRef.current && typeof crypto !== "undefined" && crypto.randomUUID) {
    sessionIdRef.current = crypto.randomUUID()
  }
  const sessionId = sessionIdRef.current ?? undefined

  const { data: contact, isLoading: contactLoading, error: contactError, refetch } = usePlaygroundContact()
  const contactId = contact?.id ?? null
  const { messages } = usePlaygroundMessages(contactId)
  const { agentTyping } = usePlaygroundTyping(contactId)
  const { data: audit = [], refetch: refetchAudit } = useAgentAudit(contactId)

  // Merge real + optimistic; dedupe by content
  const allMessages = [
    ...messages,
    ...optimisticMsgs.filter((opt) => !messages.some((m) => m.content === opt.content && m.role === "CONTACT")),
  ].sort((a, b) => {
    const at = a.createdAt?.toDate?.()?.getTime() ?? 0
    const bt = b.createdAt?.toDate?.()?.getTime() ?? 0
    return at - bt
  })

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    if (allMessages.length !== prevCountRef.current) {
      prevCountRef.current = allMessages.length
      scrollToBottom()
    }
  }, [allMessages.length, scrollToBottom])

  const handleSend = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const text = inputValue.trim()
      if (!text || !contactId) return

      setInputValue("")
      requestAnimationFrame(() => inputRef.current?.focus())

      // Optimistic (fake Timestamp for display)
      const tempMsg = {
        id: `opt_${Date.now()}`,
        role: "CONTACT" as const,
        type: "TEXT" as const,
        content: text,
        createdAt: { toDate: () => new Date() },
      }
      setOptimisticMsgs((prev) => [...prev, tempMsg])

      try {
        await sendPlaygroundMessage(contactId, text, sessionId)
        refetchAudit()
      } catch {
        setOptimisticMsgs((prev) => prev.filter((m) => m.id !== tempMsg.id))
        setError("Falha ao enviar. Tente novamente.")
      }
    },
    [inputValue, contactId, sessionId, refetchAudit],
  )

  const handleConfirm = useCallback(async () => {
    if (!contactId) return
    setConfirming(true)
    try {
      await confirmPlayground(contactId)
      refetchAudit()
    } catch {
      setError("Falha ao confirmar.")
    } finally {
      setConfirming(false)
    }
  }, [contactId, refetchAudit])

  useEffect(() => {
    if (optimisticMsgs.length > 0) {
      setOptimisticMsgs((prev) =>
        prev.filter((opt) => !messages.some((m) => m.content === opt.content && m.role === "CONTACT")),
      )
    }
  }, [messages]) // eslint-disable-line react-hooks/exhaustive-deps

  const isEmpty = allMessages.length === 0 && !agentTyping
  const isReady = !!contactId && !contactLoading

  if (contactError) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-6"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20">
          <WifiSlash className="h-8 w-8 text-rose-400/70" weight="duotone" />
        </div>
        <div className="text-center max-w-sm">
          <h3 className="text-[15px] font-semibold text-foreground">Erro ao carregar Playground</h3>
          <p className="mt-2 text-[13px] text-muted-foreground/70">
            Não foi possível obter o contato de teste. Verifique sua conexão e tente novamente.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 rounded-xl border border-border/60 px-4 py-2.5 text-[13px] font-medium text-foreground hover:bg-muted/40 transition-colors"
        >
          <ArrowClockwise className="h-4 w-4" />
          Tentar novamente
        </button>
      </motion.div>
    )
  }

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="flex flex-col h-full overflow-hidden px-4 md:px-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 shrink-0 h-11">
        <div className="flex items-center gap-2.5">
          <Robot className="h-4 w-4 text-accent" weight="fill" />
          <span className="text-[13px] font-semibold text-foreground">Playground</span>
          <span className="text-[11px] text-muted-foreground/50 hidden sm:inline">— teste a IA sem WhatsApp</span>
        </div>
      </div>

      {!mounted ? (
        <div className="flex-1 min-h-0 overflow-hidden" suppressHydrationWarning />
      ) : (
      <ResizablePanelGroup className="flex-1 min-h-0 h-full">
        {/* Chat panel */}
        <ResizablePanel defaultSize={60} minSize={40} className="flex flex-col min-w-0">
      {/* Chat body */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
            {contactLoading && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-6 w-6 rounded-full border-2 border-accent/20 border-t-accent"
                />
                <p className="text-[12px] text-muted-foreground/50">Preparando ambiente...</p>
              </div>
            )}

            {isReady && isEmpty && (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <p className="text-[13px] text-muted-foreground/50">
                  Digite uma mensagem abaixo para começar. Ex: &quot;Oi, quero marcar uma consulta&quot;
                </p>
              </div>
            )}

            {isReady && allMessages.map((msg, i) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isUser={msg.role === "CONTACT"}
                animate={i === allMessages.length - 1}
              />
            ))}

            <AnimatePresence>{agentTyping && <TypingIndicator />}</AnimatePresence>

            <div ref={messagesEndRef} />
          </div>

        {/* Input area */}
        {isReady && (
          <div className="shrink-0 border-t border-border/50 px-6 py-4">
              {error && (
                <p className="text-[12px] text-rose-400 mb-3">{error}</p>
              )}
              <form onSubmit={handleSend} className="flex gap-3 items-end">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value)
                    setError(null)
                  }}
                  placeholder="Digite uma mensagem..."
                  disabled={!isReady}
                  className="flex-1 min-w-0 rounded-lg border border-border/60 bg-muted/30 px-4 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/40 transition-all duration-200"
                />
                <motion.button
                  type="submit"
                  disabled={!inputValue.trim()}
                  whileTap={{ scale: 0.96 }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <PaperPlaneTilt className="h-4 w-4" weight="fill" />
                </motion.button>
              </form>
          </div>
        )}
      </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-border/60 hover:bg-border transition-colors data-[resize-handle-state=drag]:bg-accent/30" />

        {/* Audit panel */}
        <ResizablePanel defaultSize={40} minSize={28} className="flex flex-col min-w-0 border-l border-border/50 bg-muted/[0.03]">
          <div className="shrink-0 flex items-center justify-between gap-2 p-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <ChartLineUp className="h-4 w-4 text-accent" weight="duotone" />
              <span className="text-[12px] font-semibold text-foreground">Detalhes da IA</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!contactId || confirming}
                className="flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-1.5 text-[11px] font-medium text-accent hover:bg-accent/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <CheckCircle className="h-3.5 w-3.5" weight="fill" />
                Confirmar
              </button>
              <button
                type="button"
                onClick={() => refetchAudit()}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/50 text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 transition-colors"
                title="Atualizar"
              >
                <ArrowsClockwise className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {audit.length === 0 ? (
              <p className="text-[12px] text-muted-foreground/50 py-4 text-center">
                Envie mensagens para ver o que a IA fez em cada resposta.
              </p>
            ) : (
              audit.map((e) => <AuditEntryCard key={e.id} entry={e} />)
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
      )}
    </div>
  )
}
