"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  PaperPlaneTilt,
  CheckCircle,
  XCircle,
  Warning,
  Sparkle,
  X,
  User,
} from "@phosphor-icons/react"
import { useQueryClient } from "@tanstack/react-query"
import { ailumAiApi, type AilumAiAvailabilityToolCall } from "@/lib/api/ailum-ai"
import { ApiError } from "@/lib/api"
import { useMe } from "@/hooks/use-me"
import { useProfessionals } from "@/hooks/use-professionals"

const ease = [0.33, 1, 0.68, 1] as const

const TOOL_LABELS: Record<string, string> = {
  add_specific_day: "Adicionar horário",
  remove_exception: "Remover bloqueio",
  block_day: "Bloquear dia",
  block_range: "Bloquear período",
  put_availability: "Definir grade semanal",
  list_appointments: "Listar consultas",
  cancel_appointment: "Cancelar consulta",
  reschedule_appointment: "Remarcar consulta",
}

function toolLabel(name: string) {
  return TOOL_LABELS[name] ?? name.replace(/_/g, " ")
}

// ─── Markdown-like reply renderer ─────────────────────────────────────────────

function ReplyContent({ text }: { text: string }) {
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    const boldStart = remaining.indexOf("**")
    if (boldStart === -1) {
      parts.push(
        <span key={key++} className="whitespace-pre-wrap">
          {remaining}
        </span>
      )
      break
    }
    if (boldStart > 0) {
      parts.push(
        <span key={key++} className="whitespace-pre-wrap">
          {remaining.slice(0, boldStart)}
        </span>
      )
    }
    const boldEnd = remaining.indexOf("**", boldStart + 2)
    if (boldEnd === -1) {
      parts.push(
        <span key={key++} className="whitespace-pre-wrap font-semibold text-foreground">
          {remaining.slice(boldStart + 2)}
        </span>
      )
      break
    }
    parts.push(
      <span key={key++} className="whitespace-pre-wrap font-semibold text-foreground">
        {remaining.slice(boldStart + 2, boldEnd)}
      </span>
    )
    remaining = remaining.slice(boldEnd + 2)
  }
  return <span className="leading-relaxed">{parts}</span>
}

// ─── Tool call chip ────────────────────────────────────────────────────────────

function ToolChip({ tc, index }: { tc: AilumAiAvailabilityToolCall; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease }}
      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 bg-muted/40 border border-border/40"
    >
      {tc.success ? (
        <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" weight="fill" />
      ) : (
        <XCircle className="h-4 w-4 text-destructive shrink-0" weight="fill" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          {toolLabel(tc.name)}
        </p>
        <p className="text-[13px] text-foreground mt-0.5 leading-snug">{tc.message}</p>
      </div>
    </motion.div>
  )
}

// ─── Typing indicator ──────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2, ease }}
      className="flex items-end gap-2"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/15 border border-accent/20">
        <Sparkle className="h-3.5 w-3.5 text-accent" weight="duotone" />
      </div>
      <div className="rounded-2xl rounded-bl-md px-4 py-2.5 bg-card/60 border border-border/60">
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

// ─── Professional picker (compact for drawer) ─────────────────────────────────

function ProfessionalPickerDrawer({
  professionals,
  onSelect,
}: {
  professionals: { id: string; fullName: string; calendarColor: string; specialty: string | null }[]
  onSelect: (id: string) => void
}) {
  return (
    <div className="flex flex-col gap-3 px-4 py-4">
      <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">
        Selecione o profissional
      </p>
      <div className="flex flex-col gap-2">
        {professionals.map((p, i) => (
          <motion.button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05, ease }}
            className="group flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-left hover:border-accent/30 hover:bg-accent/[0.04] transition-all duration-150 cursor-pointer"
          >
            <div
              className="h-8 w-8 rounded-lg border border-white/10 flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${p.calendarColor}20` }}
            >
              <User
                className="h-4 w-4"
                weight="duotone"
                style={{ color: p.calendarColor || "#3b82f6" }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-foreground group-hover:text-accent transition-colors truncate">
                {p.fullName}
              </p>
              {p.specialty && (
                <p className="text-[11px] text-muted-foreground truncate">{p.specialty}</p>
              )}
            </div>
            <div
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: p.calendarColor || "#3b82f6" }}
            />
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ChatMessage =
  | { role: "user"; content: string }
  | {
      role: "assistant"
      content: string
      toolCalls?: AilumAiAvailabilityToolCall[]
      confirmation?: {
        token: string
        summary: string
        actionType: "cancel" | "reschedule"
      }
    }

// ─── AvailabilityDrawer ───────────────────────────────────────────────────────

interface AvailabilityDrawerProps {
  open: boolean
  onClose: () => void
  /** Pre-select a professional (e.g. when viewing a specific doctor's calendar) */
  defaultProfessionalId?: string
}

export function AvailabilityDrawer({ open, onClose, defaultProfessionalId }: AvailabilityDrawerProps) {
  const queryClient = useQueryClient()
  const { data: me } = useMe()
  const { data: professionals } = useProfessionals()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [message, setMessage] = useState("")
  const [professionalId, setProfessionalId] = useState<string>(defaultProfessionalId ?? "")
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successToast, setSuccessToast] = useState<string | null>(null)
  const [showPicker, setShowPicker] = useState(false)

  const role = me?.role ?? null
  const isAdmin = role === "ADMIN"
  const isProfessional = role === "PROFESSIONAL"

  // Sync defaultProfessionalId when it changes
  useEffect(() => {
    if (defaultProfessionalId) {
      setProfessionalId(defaultProfessionalId)
      setShowPicker(false)
    }
  }, [defaultProfessionalId])

  // Show picker for admin with multiple professionals and no pre-selected
  useEffect(() => {
    if (!open) return
    if (isAdmin && professionals && professionals.length > 1 && !professionalId) {
      setShowPicker(true)
    }
  }, [open, isAdmin, professionals, professionalId])

  // Reset on close
  useEffect(() => {
    if (!open) {
      setMessages([])
      setMessage("")
      setError(null)
      setSuccessToast(null)
      if (!defaultProfessionalId) {
        setProfessionalId("")
        if (isAdmin && professionals && professionals.length > 1) {
          setShowPicker(true)
        }
      }
    }
  }, [open, defaultProfessionalId, isAdmin, professionals])

  const effectiveProfessionalId = isAdmin
    ? (professionalId || (professionals?.length === 1 ? professionals[0].id : "")) ?? ""
    : me?.professionalId ?? ""

  const hasNoProfessional =
    (isAdmin && (!professionals || professionals.length === 0)) ||
    (isProfessional && !me?.professionalId)

  const selectedProfessional = professionals?.find((p) => p.id === effectiveProfessionalId)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  const showSuccess = useCallback((msg: string) => {
    setSuccessToast(msg)
    setTimeout(() => setSuccessToast(null), 4000)
  }, [])

  const handleSelectProfessional = useCallback((id: string) => {
    const wasOnPicker = !professionalId
    setProfessionalId(id)
    setShowPicker(false)
    if (wasOnPicker) setMessages([])
    else {
      // Switching inline — clear conversation for the new professional
      setMessages([])
      setError(null)
    }
  }, [professionalId])

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault()
      const trimmed = message.trim()
      if (!trimmed || loading || !effectiveProfessionalId || hasNoProfessional) return

      setLoading(true)
      setError(null)
      setMessage("")
      setMessages((prev) => [...prev, { role: "user", content: trimmed }])

      const history = messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }))

      try {
        const res = await ailumAiApi.availability({
          message: trimmed,
          messages: history.length > 0 ? history : undefined,
          ...(isAdmin ? { professionalId: effectiveProfessionalId } : {}),
        })

        const assistant: ChatMessage = {
          role: "assistant",
          content: res.reply,
          toolCalls: res.toolCalls ?? [],
          ...(res.requiresConfirmation &&
          res.confirmationToken &&
          res.confirmationSummary &&
          res.confirmationActionType
            ? {
                confirmation: {
                  token: res.confirmationToken,
                  summary: res.confirmationSummary,
                  actionType: res.confirmationActionType,
                },
              }
            : {}),
        }

        setMessages((prev) => [...prev, assistant])

        if (res.toolCalls?.length) {
          queryClient.invalidateQueries({ queryKey: ["professionals"] })
          queryClient.invalidateQueries({ queryKey: ["professional", effectiveProfessionalId] })
        }
        if (res.toolCalls?.length && !res.requiresConfirmation) {
          queryClient.invalidateQueries({ queryKey: ["appointments"] })
        }
      } catch (err) {
        setMessages((prev) => prev.slice(0, -1))
        if (err instanceof ApiError) {
          if (err.status === 429) {
            setError("Muitas requisições. Aguarde alguns segundos e tente novamente.")
          } else {
            setError(err.message)
          }
        } else {
          setError(err instanceof Error ? err.message : "Erro ao processar.")
        }
      } finally {
        setLoading(false)
        inputRef.current?.focus()
      }
    },
    [message, loading, effectiveProfessionalId, hasNoProfessional, messages, isAdmin, queryClient]
  )

  const handleConfirm = useCallback(
    async (token: string) => {
      setConfirming(true)
      setError(null)
      try {
        const res = await ailumAiApi.confirm({
          confirmationToken: token,
          ...(isAdmin && effectiveProfessionalId ? { professionalId: effectiveProfessionalId } : {}),
        })
        if (res.success) {
          showSuccess(res.message)
          setMessages((prev) =>
            prev.map((m) =>
              m.role === "assistant" && m.confirmation?.token === token
                ? { ...m, confirmation: undefined }
                : m
            )
          )
          queryClient.invalidateQueries({ queryKey: ["appointments"] })
          queryClient.invalidateQueries({ queryKey: ["professionals"] })
          queryClient.invalidateQueries({ queryKey: ["professional", effectiveProfessionalId] })
        } else {
          setError(res.message)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao confirmar.")
      } finally {
        setConfirming(false)
      }
    },
    [isAdmin, effectiveProfessionalId, showSuccess, queryClient]
  )

  const handleDismissConfirmation = useCallback((token: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.role === "assistant" && m.confirmation?.token === token
          ? { ...m, confirmation: undefined }
          : m
      )
    )
  }, [])

  useEffect(() => {
    if (open && !showPicker) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, showPicker])

  useEffect(() => {
    if (messages.length > 0) scrollToBottom()
  }, [messages.length, scrollToBottom])

  const isEmpty = messages.length === 0 && !loading

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
          />

          {/* Drawer panel */}
          <motion.div
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.35, ease }}
            className="fixed right-0 top-0 bottom-0 z-50 flex flex-col w-full max-w-[420px] bg-background border-l border-border/50 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 border border-accent/20">
                  <Sparkle className="h-3.5 w-3.5 text-accent" weight="duotone" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-foreground leading-none">Concierge IA</p>
                  {selectedProfessional && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-none">
                      {selectedProfessional.fullName}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.07] transition-all duration-150 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Professional switcher strip (admin with multiple professionals) */}
            {isAdmin && professionals && professionals.length > 1 && (
              <div className="px-3 py-2 border-b border-border/40 shrink-0">
                <div className="flex gap-1 overflow-x-auto no-scrollbar">
                  {professionals.map((p) => {
                    const active = p.id === effectiveProfessionalId
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectProfessional(p.id)}
                        className={`relative shrink-0 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all duration-150 cursor-pointer ${
                          active
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                        }`}
                      >
                        {active && (
                          <motion.div
                            layoutId="avail-pro-pill"
                            className="absolute inset-0 bg-accent/10 border border-accent/20 rounded-lg"
                            transition={{ duration: 0.2, ease }}
                          />
                        )}
                        <span
                          className="relative z-10 h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: p.calendarColor || "#3b82f6" }}
                        />
                        <span className="relative z-10 truncate max-w-[100px]">
                          {p.fullName.split(" ")[0]}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* No access for SECRETARY */}
            {role === "SECRETARY" ? (
              <div className="flex flex-col items-center justify-center flex-1 px-6 gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/40 border border-border/60">
                  <Warning className="h-6 w-6 text-muted-foreground" weight="duotone" />
                </div>
                <p className="text-[13px] font-semibold text-foreground">Sem permissão</p>
                <p className="text-[12px] text-muted-foreground text-center">
                  Disponível apenas para administradores e profissionais.
                </p>
              </div>
            ) : showPicker && professionals && professionals.length > 1 ? (
              /* Professional picker (initial state before first selection) */
              <div className="flex-1 overflow-y-auto">
                <ProfessionalPickerDrawer
                  professionals={professionals}
                  onSelect={handleSelectProfessional}
                />
              </div>
            ) : (
              /* Chat interface */
              <>
                {/* Messages */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                  <div className="flex flex-col px-4 py-5 gap-5">
                    {/* Empty state */}
                    {isEmpty && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease }}
                        className="text-center py-8"
                      >
                        <p className="text-[15px] font-semibold text-foreground">
                          Peça ao seu{" "}
                          <span className="text-accent italic">Concierge</span>
                        </p>
                        <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed">
                          Bloqueie dias, adicione horários, veja consultas — em linguagem natural.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2 justify-center">
                          {[
                            "Minhas consultas amanhã",
                            "Bloquear dia 20",
                            "Férias 01/04 a 15/04",
                          ].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setMessage(s)}
                              className="rounded-full border border-border/50 bg-muted/30 px-3 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/50 transition-all duration-150"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Messages */}
                    {messages.map((msg, i) =>
                      msg.role === "user" ? (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, ease }}
                          className="flex justify-end"
                        >
                          <div className="max-w-[85%] rounded-2xl rounded-br-md px-3.5 py-2.5 bg-accent/15 border border-accent/20">
                            <p className="text-[13px] text-foreground whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, ease }}
                          className="flex gap-2.5"
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/15 border border-accent/20 mt-0.5">
                            <Sparkle className="h-3.5 w-3.5 text-accent" weight="duotone" />
                          </div>
                          <div className="flex-1 min-w-0 space-y-2.5">
                            <div className="rounded-2xl rounded-bl-md border border-border/60 bg-card/60 backdrop-blur-sm px-3.5 py-2.5">
                              <p className="text-[13px] text-foreground">
                                <ReplyContent text={msg.content} />
                              </p>
                            </div>
                            {msg.toolCalls && msg.toolCalls.length > 0 && (
                              <div className="space-y-1.5">
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                  Ações realizadas
                                </p>
                                <div className="flex flex-col gap-1.5">
                                  {msg.toolCalls.map((tc, j) => (
                                    <ToolChip key={j} tc={tc} index={j} />
                                  ))}
                                </div>
                              </div>
                            )}
                            {msg.confirmation && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-2.5"
                              >
                                <p className="text-[12px] font-semibold text-foreground">
                                  Confirmar ação
                                </p>
                                <p className="text-[12px] text-muted-foreground">
                                  {msg.confirmation.summary}
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleConfirm(msg.confirmation!.token)}
                                    disabled={confirming}
                                    className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-1.5 text-[12px] font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-60 transition-colors"
                                  >
                                    {confirming ? (
                                      <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        className="h-3.5 w-3.5 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground"
                                      />
                                    ) : (
                                      <CheckCircle className="h-3.5 w-3.5" weight="fill" />
                                    )}
                                    {msg.confirmation.actionType === "cancel"
                                      ? "Confirmar cancelamento"
                                      : "Confirmar remarcação"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDismissConfirmation(msg.confirmation!.token)}
                                    disabled={confirming}
                                    className="rounded-lg border border-border/60 px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      )
                    )}

                    <AnimatePresence>{loading && <TypingIndicator />}</AnimatePresence>
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Input */}
                <div className="shrink-0 border-t border-border/40 px-4 py-3 bg-background/95 backdrop-blur-sm">
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="mb-2.5 px-3 py-2.5 rounded-xl border border-destructive/30 bg-destructive/10 flex items-center gap-2"
                      >
                        <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" weight="fill" />
                        <p className="text-[12px] text-destructive flex-1">{error}</p>
                        <button
                          type="button"
                          onClick={() => setError(null)}
                          className="text-destructive/70 hover:text-destructive text-[11px] font-medium"
                        >
                          Fechar
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <AnimatePresence>
                    {successToast && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="mb-2.5 px-3 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-2"
                      >
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" weight="fill" />
                        <p className="text-[12px] text-emerald-600 dark:text-emerald-400">{successToast}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <form onSubmit={handleSubmit}>
                    <div
                      className={`flex items-end gap-2 rounded-xl border bg-card/60 backdrop-blur-sm px-3.5 py-2.5 transition-all duration-300 ${
                        error
                          ? "border-destructive/50"
                          : "border-border/60 hover:border-border focus-within:border-accent/40 focus-within:ring-2 focus-within:ring-accent/20"
                      }`}
                    >
                      <textarea
                        ref={inputRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            handleSubmit()
                          }
                        }}
                        placeholder="Ex: bloqueia amanhã, férias 01/04..."
                        maxLength={2000}
                        rows={1}
                        disabled={loading || hasNoProfessional}
                        className="flex-1 min-h-[36px] max-h-28 resize-none bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none py-2"
                        style={{ minHeight: 36 }}
                      />
                      <button
                        type="submit"
                        disabled={loading || !message.trim() || !effectiveProfessionalId || hasNoProfessional}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        {loading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="h-3.5 w-3.5 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground"
                          />
                        ) : (
                          <PaperPlaneTilt className="h-3.5 w-3.5" weight="fill" />
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
