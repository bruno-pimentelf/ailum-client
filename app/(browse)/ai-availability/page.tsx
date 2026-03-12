"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  PaperPlaneTilt,
  CheckCircle,
  XCircle,
  Warning,
  UserCircle,
} from "@phosphor-icons/react"
import { useQueryClient } from "@tanstack/react-query"
import { ailumAiApi, type AilumAiAvailabilityToolCall } from "@/lib/api/ailum-ai"
import { ApiError } from "@/lib/api"
import { useMe } from "@/hooks/use-me"
import { useProfessionals } from "@/hooks/use-professionals"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const ease = [0.33, 1, 0.68, 1] as const

const TOOL_LABELS: Record<string, string> = {
  add_specific_day: "Adicionar horário",
  remove_exception: "Remover bloqueio",
  block_day: "Bloquear dia",
  block_range: "Bloquear período",
  put_availability: "Definir grade semanal",
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

function ToolChip({
  tc,
  index,
}: {
  tc: AilumAiAvailabilityToolCall
  index: number
}) {
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
        <p className="text-[13px] text-foreground mt-0.5 leading-snug">
          {tc.message}
        </p>
      </div>
    </motion.div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AiAvailabilityPage() {
  const queryClient = useQueryClient()
  const { data: me } = useMe()
  const { data: professionals } = useProfessionals()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const replyRef = useRef<HTMLDivElement>(null)

  const [message, setMessage] = useState("")
  const [professionalId, setProfessionalId] = useState<string>("")
  const [reply, setReply] = useState<string | null>(null)
  const [toolCalls, setToolCalls] = useState<AilumAiAvailabilityToolCall[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const role = me?.role ?? null
  const isAdmin = role === "ADMIN"
  const isProfessional = role === "PROFESSIONAL"

  const effectiveProfessionalId = isAdmin
    ? (professionalId || professionals?.[0]?.id) ?? ""
    : me?.professionalId ?? ""

  const hasNoProfessional =
    (isAdmin && (!professionals || professionals.length === 0)) ||
    (isProfessional && !me?.professionalId)

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const trimmed = message.trim()
    if (!trimmed || loading) return

    setLoading(true)
    setError(null)
    setReply(null)
    setToolCalls([])
    setMessage("")

    try {
      const res = await ailumAiApi.availability({
        message: trimmed,
        ...(isAdmin && effectiveProfessionalId
          ? { professionalId: effectiveProfessionalId }
          : {}),
      })

      setReply(res.reply)
      setToolCalls(res.toolCalls ?? [])

      if (res.toolCalls?.length) {
        queryClient.invalidateQueries({ queryKey: ["professionals"] })
        queryClient.invalidateQueries({
          queryKey: ["professional", effectiveProfessionalId],
        })
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 429) {
          setError(
            "Muitas requisições. Aguarde alguns segundos e tente novamente."
          )
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
  }

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (reply) {
      replyRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [reply])

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
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Sem permissão
        </h2>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Esta funcionalidade está disponível apenas para administradores e
          profissionais.
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease }}
      className="flex flex-col min-h-[calc(100vh-3.5rem)] overflow-y-auto"
    >
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 min-h-[500px]">
        {/* Hero / Empty state */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease }}
          className="text-center max-w-xl mb-10"
        >
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
            Peça ao seu{" "}
            <span className="text-accent font-display italic">Concierge</span>
          </h1>
          <p className="mt-3 text-[15px] text-muted-foreground leading-relaxed">
            Descreva em linguagem natural. Bloqueie dias, adicione horários,
            defina férias — ele entende.
          </p>
        </motion.div>

        {/* Admin: professional selector */}
        {isAdmin && professionals && professionals.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mb-6 w-full max-w-xl"
          >
            <Select
              value={(professionalId || professionals[0]?.id) ?? ""}
              onValueChange={setProfessionalId}
            >
              <SelectTrigger className="h-9 w-full max-w-[200px] mx-auto border-border/60 bg-card/50">
                <SelectValue placeholder="Selecionar profissional" />
              </SelectTrigger>
              <SelectContent>
                {professionals.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>
        )}

        {/* Input area — Claude/ChatGPT style */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease }}
          className="w-full max-w-2xl"
        >
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
                placeholder="Ex: bloqueia amanhã, férias 01/04 a 15/04, segunda a sexta 9h às 18h..."
                maxLength={2000}
                rows={1}
                disabled={loading || hasNoProfessional}
                className="flex-1 min-h-[44px] max-h-32 resize-none bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none py-2.5"
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
            <p className="text-[11px] text-muted-foreground/60 text-right mt-1.5 pr-1">
              {message.length}/2000
            </p>
          </form>
        </motion.div>

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

        {/* Error toast */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="mt-4 px-4 py-3 rounded-xl border border-destructive/30 bg-destructive/10"
            >
              <p className="text-[13px] text-destructive">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reply — appears below, scrolls into view */}
        <AnimatePresence>
          {reply && (
            <motion.div
              ref={replyRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.4, ease }}
              className="w-full max-w-2xl mt-10"
            >
              <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm overflow-hidden">
                <div className="p-5 space-y-5">
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 border border-accent/20">
                      <UserCircle className="h-4 w-4 text-accent" weight="fill" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-4">
                      <p className="text-[15px] text-foreground">
                        <ReplyContent text={reply} />
                      </p>
                      {toolCalls.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                            Ações realizadas
                          </p>
                          <div className="flex flex-col gap-2">
                            {toolCalls.map((tc, i) => (
                              <ToolChip key={i} tc={tc} index={i} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Subtle ambient glow */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-accent/5 blur-[100px]" />
      </div>
    </motion.div>
  )
}
