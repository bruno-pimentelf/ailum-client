"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  PaperPlaneTilt,
  CheckCircle,
  XCircle,
  Warning,
  Sparkle,
  ArrowLeft,
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

// ─── Markdown-like reply renderer ────────────────────────────────────────────

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

// ─── Tool call chip ──────────────────────────────────────────────────────────

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

// ─── Typing indicator ────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2, ease }}
      className="flex items-end gap-2"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 border border-accent/20">
        <Sparkle className="h-4 w-4 text-accent" weight="duotone" />
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

// ─── Professional picker card ─────────────────────────────────────────────────

function ProfessionalCard({
  professional,
  index,
  onSelect,
}: {
  professional: { id: string; fullName: string; calendarColor: string; specialty: string | null }
  index: number
  onSelect: () => void
}) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 + index * 0.07, ease }}
      whileHover={{ y: -2 }}
      className="group relative flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.015] p-px backdrop-blur-sm text-left transition-all duration-200 hover:border-accent/30 hover:bg-accent/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 cursor-pointer"
    >
      {/* inner padding wrapper */}
      <div className="flex flex-col flex-1 w-full rounded-[calc(1rem-1px)] px-5 py-5 gap-3">
        {/* Icon + color dot */}
        <div className="flex items-center gap-2.5">
          <div
            className="h-10 w-10 rounded-xl border border-white/10 flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${professional.calendarColor}20` }}
          >
            <User
              className="h-5 w-5"
              weight="duotone"
              style={{ color: professional.calendarColor || "#3b82f6" }}
            />
          </div>
          <div
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: professional.calendarColor || "#3b82f6" }}
          />
        </div>

        {/* Name + specialty */}
        <div className="flex-1">
          <p className="text-[15px] font-semibold text-foreground group-hover:text-accent transition-colors duration-150 leading-snug">
            {professional.fullName}
          </p>
          {professional.specialty && (
            <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-1">
              {professional.specialty}
            </p>
          )}
        </div>

        {/* CTA */}
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent/10 border border-accent/20 px-3 py-1.5 text-[12px] font-semibold text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-all duration-150">
            <Sparkle className="h-3.5 w-3.5" weight="duotone" />
            Conversar
          </span>
        </div>
      </div>
    </motion.button>
  )
}

// ─── Step 1: Professional picker ──────────────────────────────────────────────

function ProfessionalPicker({
  professionals,
  onSelect,
}: {
  professionals: { id: string; fullName: string; calendarColor: string; specialty: string | null }[]
  onSelect: (id: string) => void
}) {
  return (
    <motion.div
      key="picker"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35, ease }}
      className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-6 py-12"
    >
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full bg-accent/6 blur-[120px]" />
      </div>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="text-center mb-10 max-w-md"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/8 px-4 py-1.5 mb-5">
          <Sparkle className="h-3.5 w-3.5 text-accent" weight="duotone" />
          <span className="text-[12px] font-semibold text-accent tracking-wide uppercase">Concierge IA</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
          Com qual profissional{" "}
          <span className="text-accent font-display italic">você quer conversar?</span>
        </h1>
        <p className="mt-3 text-[14px] text-muted-foreground leading-relaxed">
          Selecione o profissional para gerenciar agenda, horários e consultas via linguagem natural.
        </p>
      </motion.div>

      {/* Grid */}
      <div
        className={`grid gap-4 w-full max-w-2xl ${
          professionals.length === 1
            ? "grid-cols-1 max-w-xs"
            : professionals.length === 2
            ? "grid-cols-1 sm:grid-cols-2"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {professionals.map((p, i) => (
          <ProfessionalCard
            key={p.id}
            professional={p}
            index={i}
            onSelect={() => onSelect(p.id)}
          />
        ))}
      </div>
    </motion.div>
  )
}

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

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AiAvailabilityPage() {
  const queryClient = useQueryClient()
  const { data: me } = useMe()
  const { data: professionals } = useProfessionals()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [message, setMessage] = useState("")
  const [professionalId, setProfessionalId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  const role = me?.role ?? null
  const isAdmin = role === "ADMIN"
  const isProfessional = role === "PROFESSIONAL"

  // For admins with multiple professionals, require explicit selection
  const needsPicker = isAdmin && !!professionals && professionals.length > 1 && !professionalId
  const [showPicker, setShowPicker] = useState(false)

  // Initialise picker state once professionals load
  useEffect(() => {
    if (isAdmin && professionals && professionals.length > 1 && !professionalId) {
      setShowPicker(true)
    }
  }, [isAdmin, professionals, professionalId])

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
    setProfessionalId(id)
    setShowPicker(false)
    setMessages([])
  }, [])

  const handleBackToPicker = useCallback(() => {
    setProfessionalId("")
    setMessages([])
    setError(null)
    setShowPicker(true)
  }, [])

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
          queryClient.invalidateQueries({
            queryKey: ["professional", effectiveProfessionalId],
          })
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
    [
      message,
      loading,
      effectiveProfessionalId,
      hasNoProfessional,
      messages,
      isAdmin,
      queryClient,
    ]
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
          queryClient.invalidateQueries({
            queryKey: ["professional", effectiveProfessionalId],
          })
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

  const handleDismissConfirmation = useCallback(
    (token: string) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.role === "assistant" && m.confirmation?.token === token
            ? { ...m, confirmation: undefined }
            : m
        )
      )
    },
    []
  )

  useEffect(() => {
    if (!showPicker) {
      inputRef.current?.focus()
    }
  }, [showPicker])

  useEffect(() => {
    if (messages.length > 0) scrollToBottom()
  }, [messages.length, scrollToBottom])

  // SECRETARY: no access
  if (role === "SECRETARY") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease }}
        className="flex flex-col items-center justify-center min-h-[60vh] px-6"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/40 border border-border/60 mb-4">
          <Warning className="h-7 w-7 text-muted-foreground" weight="duotone" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Sem permissão</h2>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Esta funcionalidade está disponível apenas para administradores e profissionais.
        </p>
      </motion.div>
    )
  }

  const isEmpty = messages.length === 0 && !loading

  return (
    <AnimatePresence mode="wait">
      {/* ── Step 1: pick professional ── */}
      {showPicker && professionals && professionals.length > 1 ? (
        <ProfessionalPicker
          key="picker"
          professionals={professionals}
          onSelect={handleSelectProfessional}
        />
      ) : (
        /* ── Step 2: chat ── */
        <motion.div
          key="chat"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease }}
          className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden"
        >
          {/* Messages area */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="flex flex-col items-center px-6 py-8 max-w-2xl mx-auto w-full">

              {/* Hero when empty */}
              {isEmpty && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease }}
                  className="text-center max-w-xl mb-8"
                >
                  <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
                    Peça ao seu{" "}
                    <span className="text-accent font-display italic">Concierge</span>
                  </h1>
                  <p className="mt-3 text-[15px] text-muted-foreground leading-relaxed">
                    Descreva em linguagem natural. Bloqueie dias, adicione horários, veja consultas — ele
                    entende.
                  </p>
                </motion.div>
              )}

              {/* Active professional pill (admin with picker) */}
              {isAdmin && selectedProfessional && professionals && professionals.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.3, ease }}
                  className="mb-6 w-full"
                >
                  <button
                    type="button"
                    onClick={handleBackToPicker}
                    className="group flex items-center gap-2.5 rounded-xl border border-border/50 bg-background/30 hover:bg-background/50 hover:border-border/80 px-3.5 py-2 transition-all duration-150 cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <div
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: selectedProfessional.calendarColor || "#3b82f6" }}
                    />
                    <span className="text-[13px] font-semibold text-foreground">
                      {selectedProfessional.fullName}
                    </span>
                    <span className="text-[11px] text-muted-foreground group-hover:text-foreground/60 transition-colors">
                      Trocar
                    </span>
                  </button>
                </motion.div>
              )}

              {/* Chat messages */}
              <div className="w-full space-y-6">
                {messages.map((msg, i) =>
                  msg.role === "user" ? (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease }}
                      className="flex justify-end"
                    >
                      <div className="max-w-[85%] rounded-2xl rounded-br-md px-4 py-2.5 bg-accent/15 border border-accent/20">
                        <p className="text-[15px] text-foreground whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease }}
                      className="flex gap-3"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 border border-accent/20">
                        <Sparkle className="h-4 w-4 text-accent" weight="duotone" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="rounded-2xl rounded-bl-md border border-border/60 bg-card/60 backdrop-blur-sm px-4 py-3">
                          <p className="text-[15px] text-foreground">
                            <ReplyContent text={msg.content} />
                          </p>
                        </div>
                        {msg.toolCalls && msg.toolCalls.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                              Ações realizadas
                            </p>
                            <div className="flex flex-col gap-2">
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
                            className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3"
                          >
                            <p className="text-[12px] font-semibold text-foreground">
                              Confirmar ação
                            </p>
                            <p className="text-[13px] text-muted-foreground">
                              {msg.confirmation.summary}
                            </p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleConfirm(msg.confirmation!.token)}
                                disabled={confirming}
                                className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-[13px] font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-60 transition-colors"
                              >
                                {confirming ? (
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="h-4 w-4 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground"
                                  />
                                ) : (
                                  <CheckCircle className="h-4 w-4" weight="fill" />
                                )}
                                {msg.confirmation.actionType === "cancel"
                                  ? "Confirmar cancelamento"
                                  : "Confirmar remarcação"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDismissConfirmation(msg.confirmation!.token)}
                                disabled={confirming}
                                className="rounded-lg border border-border/60 px-4 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
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

              {hasNoProfessional && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 text-[13px] text-amber-500/90 flex items-center gap-2"
                >
                  <Warning className="h-4 w-4 shrink-0" weight="fill" />
                  {isProfessional
                    ? "Nenhum perfil de profissional vinculado."
                    : "Adicione um profissional nas configurações."}
                </motion.p>
              )}
            </div>
          </div>

          {/* Input — fixed at bottom */}
          <div className="shrink-0 border-t border-border/50 px-6 py-4 bg-background/95 backdrop-blur-sm">
            <div className="max-w-2xl mx-auto">
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-3 px-4 py-3 rounded-xl border border-destructive/30 bg-destructive/10 flex items-center gap-2"
                  >
                    <XCircle className="h-4 w-4 text-destructive shrink-0" weight="fill" />
                    <p className="text-[13px] text-destructive flex-1">{error}</p>
                    <button
                      type="button"
                      onClick={() => setError(null)}
                      className="text-destructive/70 hover:text-destructive text-[12px] font-medium"
                    >
                      Fechar
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {successToast && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-3 px-4 py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" weight="fill" />
                    <p className="text-[13px] text-emerald-600 dark:text-emerald-400">{successToast}</p>
                  </motion.div>
                )}
              </AnimatePresence>
              <form onSubmit={handleSubmit} className="relative">
                <div
                  className={`flex items-end gap-2 rounded-2xl border bg-card/60 backdrop-blur-sm px-4 py-3 transition-all duration-300 ${
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
                    placeholder="Ex: minhas consultas amanhã, bloqueia dia 20, férias 01/04 a 15/04..."
                    maxLength={2000}
                    rows={1}
                    disabled={loading || hasNoProfessional}
                    className="flex-1 min-h-[44px] max-h-32 resize-none bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none py-2.5"
                    style={{ minHeight: 44 }}
                  />
                  <button
                    type="submit"
                    disabled={
                      loading ||
                      !message.trim() ||
                      !effectiveProfessionalId ||
                      hasNoProfessional
                    }
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-4 w-4 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground"
                      />
                    ) : (
                      <PaperPlaneTilt className="h-4 w-4" weight="fill" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground/90 text-right mt-1.5 pr-1">
                  {message.length}/2000
                </p>
              </form>
            </div>
          </div>

          {/* Ambient glow */}
          <div className="fixed inset-0 pointer-events-none -z-10">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-accent/5 blur-[100px]" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
