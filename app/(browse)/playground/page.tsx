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
  ChatCircleText,
  ArrowsClockwise,
  Trash,
  Play,
  Pause,
  DownloadSimple,
} from "@phosphor-icons/react"
import { PixChargeBlock } from "@/components/app/pix-charge-block"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"
import { useQueryClient } from "@tanstack/react-query"
import { usePlaygroundContact, usePlaygroundMessages, usePlaygroundTyping, useAgentAudit } from "@/hooks/use-playground"
import { sendPlaygroundMessage, confirmPlayground, resetPlayground, type PlaygroundResetScope } from "@/lib/api/agent"
import { useIntegrations } from "@/hooks/use-integrations"
import { useInstanceStore } from "@/lib/instance-store"
import type { FirestoreMessage } from "@/lib/types/firestore"
import type { AgentAuditEntry, AuditDetail, ToolExecution } from "@/lib/api/agent"

const ease = [0.33, 1, 0.68, 1] as const

// ─── Audio player (WhatsApp-style) ───────────────────────────────────────────

function AudioPlayer({ url, text }: { url: string; text?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    const onTime = () => setProgress(a.duration > 0 ? a.currentTime / a.duration : 0)
    const onMeta = () => setDuration(a.duration)
    const onEnd = () => { setPlaying(false); setProgress(0) }
    a.addEventListener("timeupdate", onTime)
    a.addEventListener("loadedmetadata", onMeta)
    a.addEventListener("ended", onEnd)
    return () => {
      a.removeEventListener("timeupdate", onTime)
      a.removeEventListener("loadedmetadata", onMeta)
      a.removeEventListener("ended", onEnd)
    }
  }, [])

  const toggle = () => {
    const a = audioRef.current
    if (!a) return
    if (playing) { a.pause(); setPlaying(false) }
    else { a.play(); setPlaying(true) }
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current
    if (!a || !a.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    a.currentTime = pct * a.duration
    setProgress(pct)
  }

  const fmt = (s: number) => {
    if (!s || !isFinite(s)) return "0:00"
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-1.5">
      <audio ref={audioRef} src={url} preload="metadata" />
      <div className="flex items-center gap-2.5">
        <button
          onClick={toggle}
          className="cursor-pointer flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 hover:bg-accent/30 transition-colors"
        >
          {playing ? (
            <Pause className="h-3.5 w-3.5 text-accent" weight="fill" />
          ) : (
            <Play className="h-3.5 w-3.5 text-accent ml-0.5" weight="fill" />
          )}
        </button>
        <div className="flex-1 space-y-1">
          <div
            className="h-1.5 rounded-full bg-muted/40 cursor-pointer relative overflow-hidden"
            onClick={seek}
          >
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-accent/60"
              style={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground/60">
            <span>{fmt(duration * progress)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>
        <a
          href={url}
          download="audio.mp3"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full hover:bg-muted/40 transition-colors"
          title="Baixar áudio"
        >
          <DownloadSimple className="h-3 w-3 text-muted-foreground/50 hover:text-foreground transition-colors" weight="bold" />
        </a>
      </div>
      {text && (
        <p className="text-[11px] text-muted-foreground/60 leading-relaxed italic">{text}</p>
      )}
    </div>
  )
}

const TOOL_LABELS: Record<string, string> = {
  create_appointment: "Agendar consulta",
  cancel_appointment: "Cancelar consulta",
  reschedule_appointment: "Remarcar consulta",
  send_message: "Enviar mensagem",
  notify_operator: "Escalar para humano",
  move_stage: "Mover etapa",
  search_availability: "Buscar disponibilidade",
  generate_pix: "Gerar PIX",
}

function toolLabel(tool: string) {
  return TOOL_LABELS[tool] ?? tool
}

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

// ─── Audit detail block (label + detail + optional tool executions) ────────────

function AuditDetailBlock({ detail, stageAgentToolCalls }: { detail: AuditDetail; stageAgentToolCalls?: number }) {
  const [showTools, setShowTools] = useState(false)
  const rawExecutions = detail.data?.toolExecutions ?? (detail.data as { tool_executions?: ToolExecution[] })?.tool_executions ?? []
  const rawTools = (detail.data?.tools as string[] | undefined) ?? []
  // Use toolExecutions; else build from tools array; else for "Stage Agent" with count, show placeholder
  const executions: ToolExecution[] =
    rawExecutions.length > 0
      ? rawExecutions
      : rawTools.map((tool) => ({ tool, success: true }))
  const hasToolCount = detail.label === "Stage Agent" && (stageAgentToolCalls ?? 0) > 0
  const showExpand = executions.length > 0 || hasToolCount

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-medium text-muted-foreground/90">{detail.label}</span>
      <span className="text-[11px] text-foreground/90 break-words leading-relaxed">{detail.detail}</span>
      {showExpand && (
        <div className="mt-1">
          <button
            type="button"
            onClick={() => setShowTools((v) => !v)}
            className="flex items-center gap-1.5 text-[10px] font-medium text-accent/90 hover:text-accent transition-colors"
          >
            {showTools ? (
              <CaretDown className="h-3 w-3" weight="bold" />
            ) : (
              <CaretRight className="h-3 w-3" weight="bold" />
            )}
            {executions.length > 0 ? `${executions.length} tool(s)` : `${stageAgentToolCalls} tool(s)`} — {showTools ? "ocultar" : "expandir"}
          </button>
          <AnimatePresence>
            {showTools && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-2 pl-4 mt-2 border-l-2 border-accent/20">
                  {detail.data?.inputTokens != null && detail.data?.outputTokens != null && (
                    <div className="flex justify-between text-[10px] text-muted-foreground/85 pb-1">
                      <span>{detail.data.inputTokens} tokens in</span>
                      <span>{detail.data.outputTokens} tokens out</span>
                    </div>
                  )}
                  {executions.length > 0 ? (
                    executions.map((ex, i) => (
                      <ToolExecutionRow key={i} execution={ex} />
                    ))
                  ) : (
                    <p className="text-[10px] text-muted-foreground/85 py-1">
                      Detalhes das tools serão exibidos quando o backend enviar <code className="text-[9px] bg-muted/40 px-1 rounded">data.toolExecutions</code>.
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

function ToolExecutionRow({ execution }: { execution: ToolExecution }) {
  const inputStr =
    execution.input && Object.keys(execution.input).length > 0
      ? Object.entries(execution.input)
          .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
          .join(", ")
      : null

  return (
    <div className="flex flex-col gap-0.5 py-1.5">
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold ${
            execution.success ? "bg-emerald-500/20 text-emerald-500" : "bg-rose-500/20 text-rose-500"
          }`}
        >
          {execution.success ? "✓" : "✗"}
        </span>
        <span className="text-[11px] font-medium text-foreground">{toolLabel(execution.tool)}</span>
      </div>
      {inputStr && (
        <p className="text-[10px] text-muted-foreground/90 pl-6 break-all">{inputStr}</p>
      )}
      {execution.summary && (
        <p className="text-[10px] text-foreground/70 pl-6 italic">{execution.summary}</p>
      )}
      {!execution.success && execution.reason && (
        <p className="text-[10px] text-rose-500/90 pl-6">{execution.reason}</p>
      )}
    </div>
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
    <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          {open ? (
            <CaretDown className="h-3.5 w-3.5 text-muted-foreground/85 shrink-0" />
          ) : (
            <CaretRight className="h-3.5 w-3.5 text-muted-foreground/85 shrink-0" />
          )}
          <span className="text-[11px] font-medium text-foreground truncate">
            {entry.routerIntent ?? entry.status}
          </span>
          {entry.routerConfidence != null && (
            <span className="text-[10px] text-muted-foreground/85 shrink-0">
              {Math.round(entry.routerConfidence * 100)}%
            </span>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground/90 shrink-0">{date}</span>
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
            <div className="px-3.5 pb-3.5 pt-2 flex flex-col gap-2 border-t border-border/40">
              {entry.durationMs != null && (
                <div className="flex justify-between text-[11px] text-muted-foreground/85">
                  <span>Duração</span>
                  <span>{entry.durationMs}ms</span>
                </div>
              )}
              {(entry.totalInputTokens ?? 0) + (entry.totalOutputTokens ?? 0) > 0 && (
                <div className="flex justify-between text-[11px] text-muted-foreground/85">
                  <span>Tokens</span>
                  <span>{(entry.totalInputTokens ?? 0) + (entry.totalOutputTokens ?? 0)} total</span>
                </div>
              )}
              {entry.auditDetails && entry.auditDetails.length > 0 && (
                <div className="flex flex-col gap-3">
                  {entry.auditDetails.map((d) => (
                    <AuditDetailBlock key={d.label} detail={d} stageAgentToolCalls={entry.stageAgentToolCalls} />
                  ))}
                </div>
              )}
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
  msg: FirestoreMessage | { id: string; role: string; type?: string; content: string; metadata?: { qrCodeUrl?: string; pixCopyPaste?: string; amount?: string; description?: string }; createdAt?: { toDate: () => Date } }
  isUser: boolean
  animate?: boolean
}) {
  const time = msg.createdAt?.toDate?.()
    ? new Date(msg.createdAt.toDate()).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : ""

  const isPixCharge = "type" in msg && msg.type === "PIX_CHARGE"
  const isAudio = "type" in msg && msg.type === "AUDIO"
  const pixMeta = "metadata" in msg ? msg.metadata : undefined
  const audioUrl = (pixMeta as Record<string, unknown> | undefined)?.audioUrl as string | undefined

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
        {isPixCharge ? (
          <PixChargeBlock
            content={msg.content}
            metadata={pixMeta ? { qrCodeUrl: pixMeta.qrCodeUrl, pixCopyPaste: pixMeta.pixCopyPaste, amount: pixMeta.amount, description: pixMeta.description } : undefined}
          />
        ) : isAudio && audioUrl ? (
          <AudioPlayer url={audioUrl} text={msg.content} />
        ) : (
          <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words text-foreground">
            {msg.content}
          </p>
        )}
        <span className="text-[10px] text-muted-foreground/90 mt-1 block">{time}</span>
      </div>
    </motion.div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PlaygroundPage() {
  const queryClient = useQueryClient()
  const [inputValue, setInputValue] = useState("")
  const [optimisticMsgs, setOptimisticMsgs] = useState<
    Array<Pick<FirestoreMessage, "id" | "role" | "type" | "content"> & { createdAt: { toDate: () => Date } }>
  >([])
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [resetting, setResetting] = useState(false)
  const sessionIdRef = useRef<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const prevCountRef = useRef(0)

  if (!sessionIdRef.current && typeof crypto !== "undefined" && crypto.randomUUID) {
    sessionIdRef.current = crypto.randomUUID()
  }
  const sessionId = sessionIdRef.current ?? undefined

  const { data: integrations } = useIntegrations()
  const zapiInstances = (integrations ?? []).filter((i: { provider: string; instanceId: string | null; isActive: boolean }) => i.provider === "zapi" && i.instanceId && i.isActive)
  const { selectedInstanceId, setSelectedInstanceId } = useInstanceStore()

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
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
    } catch {
      setError("Falha ao confirmar.")
    } finally {
      setConfirming(false)
    }
  }, [contactId, refetchAudit, queryClient])

  const [resetMenuOpen, setResetMenuOpen] = useState(false)

  const handleReset = useCallback(async (scope: PlaygroundResetScope) => {
    setResetting(true)
    setError(null)
    setResetMenuOpen(false)
    try {
      await resetPlayground(scope)
      if (scope === 'chat' || scope === 'all') setOptimisticMsgs([])
      refetchAudit()
    } catch {
      setError("Falha ao resetar.")
    } finally {
      setResetting(false)
    }
  }, [refetchAudit])

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
          <p className="mt-2 text-[13px] text-muted-foreground/85">
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
          {zapiInstances.length > 1 && (
            <select
              value={selectedInstanceId ?? ""}
              onChange={(e) => setSelectedInstanceId(e.target.value || null)}
              className="rounded-md border border-border/50 bg-muted/20 px-2 py-0.5 text-[10px] text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/30 cursor-pointer"
            >
              {zapiInstances.map((inst) => (
                <option key={inst.instanceId} value={inst.instanceId!}>
                  {inst.label || inst.instanceId?.slice(0, 10)}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setResetMenuOpen(!resetMenuOpen)}
            disabled={!isReady || resetting}
            className="flex items-center gap-1.5 rounded-lg border border-border/50 px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resetting ? (
              <ArrowsClockwise className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash className="h-3.5 w-3.5" />
            )}
            Limpar
          </button>
          <AnimatePresence>
            {resetMenuOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40"
                  onClick={() => setResetMenuOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden"
                >
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => handleReset("chat")}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] text-foreground/90 hover:bg-muted/40 transition-colors text-left cursor-pointer"
                    >
                      <ChatCircleText className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                      <div>
                        <p className="font-medium">Limpar conversa</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Mensagens e memorias da IA</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReset("appointments")}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] text-foreground/90 hover:bg-muted/40 transition-colors text-left cursor-pointer"
                    >
                      <CheckCircle className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                      <div>
                        <p className="font-medium">Limpar agendamentos</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Consultas e cobranças</p>
                      </div>
                    </button>
                    <div className="border-t border-border/30 my-1" />
                    <button
                      type="button"
                      onClick={() => handleReset("all")}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] text-rose-400/90 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                    >
                      <Trash className="h-3.5 w-3.5 shrink-0" />
                      <div>
                        <p className="font-medium">Limpar tudo</p>
                        <p className="text-[10px] text-rose-400/60 mt-0.5">Conversa, agendamentos e cobranças</p>
                      </div>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
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
                <p className="text-[12px] text-muted-foreground/85">Preparando ambiente...</p>
              </div>
            )}

            {isReady && isEmpty && (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <p className="text-[13px] text-muted-foreground/85">
                  Digite uma mensagem abaixo para começar. Ex: &quot;Oi, quero marcar uma consulta&quot;
                </p>
                <p className="text-[11px] text-muted-foreground/90 max-w-xs text-center mt-2">
                  Lembretes (reminder_24h, reminder_1h) e triggers com template aparecem aqui quando houver consulta na janela correta. O job roda a cada 30 min.
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
                  className="flex-1 min-w-0 rounded-lg border border-border/60 bg-muted/30 px-4 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/40 transition-all duration-200"
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

        {/* Audit panel — scrollable container */}
        <ResizablePanel defaultSize={40} minSize={28} className="flex flex-col min-w-0 min-h-0 border-l border-border/50 bg-muted/[0.03]">
          <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-3 border-b border-border/50">
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
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/50 text-muted-foreground/85 hover:text-foreground hover:bg-muted/40 transition-colors"
                title="Atualizar"
              >
                <ArrowsClockwise className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-4 flex flex-col gap-3">
            {audit.length === 0 ? (
              <p className="text-[12px] text-muted-foreground/85 py-8 text-center">
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
