"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
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
  Copy,
  Check,
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

// Generate deterministic waveform bars from URL hash
function generateWaveformBars(url: string, count: number): number[] {
  let hash = 0
  for (let i = 0; i < url.length; i++) hash = ((hash << 5) - hash + url.charCodeAt(i)) | 0
  return Array.from({ length: count }, (_, i) => Math.abs(Math.sin(hash * (i + 1) * 0.1)) * 0.7 + 0.3)
}

const SPEEDS = [1, 1.5, 2] as const

function AudioPlayer({ url, text }: { url: string; text?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speedIdx, setSpeedIdx] = useState(0)
  const [seeking, setSeeking] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const bars = useMemo(() => generateWaveformBars(url, 32), [url])

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    const onMeta = () => setDuration(a.duration || 0)
    const onTime = () => { if (!seeking) setCurrentTime(a.currentTime || 0) }
    const onEnd = () => setPlaying(false)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    a.addEventListener("loadedmetadata", onMeta)
    a.addEventListener("timeupdate", onTime)
    a.addEventListener("ended", onEnd)
    a.addEventListener("play", onPlay)
    a.addEventListener("pause", onPause)
    return () => { a.removeEventListener("loadedmetadata", onMeta); a.removeEventListener("timeupdate", onTime); a.removeEventListener("ended", onEnd); a.removeEventListener("play", onPlay); a.removeEventListener("pause", onPause) }
  }, [seeking])

  const toggle = async () => {
    const a = audioRef.current
    if (!a) return
    if (a.paused) { try { await a.play() } catch {} } else a.pause()
  }

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current; const b = barRef.current
    if (!a || !b || !duration) return
    const ratio = Math.max(0, Math.min(1, (e.clientX - b.getBoundingClientRect().left) / b.getBoundingClientRect().width))
    a.currentTime = ratio * duration; setCurrentTime(ratio * duration)
  }

  const cycleSpeed = () => {
    const next = (speedIdx + 1) % SPEEDS.length
    setSpeedIdx(next)
    if (audioRef.current) audioRef.current.playbackRate = SPEEDS[next]
  }

  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0
  const speed = SPEEDS[speedIdx]
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`
  const isLong = (text?.length ?? 0) > 100

  return (
    <div className="space-y-1.5 min-w-[220px]">
      <audio ref={audioRef} src={url} preload="metadata" />
      <div className="flex items-center gap-2">
        <button onClick={toggle}
          className="cursor-pointer flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/20 hover:bg-accent/30 transition-colors">
          {playing ? <Pause className="h-4 w-4 text-accent" weight="fill" /> : <Play className="h-4 w-4 text-accent ml-0.5" weight="fill" />}
        </button>
        <div className="flex-1 min-w-0">
          <div ref={barRef} className="flex items-end gap-px h-6 cursor-pointer"
            onClick={seekTo}
            onMouseDown={(e) => { setSeeking(true); seekTo(e) }}
            onMouseMove={(e) => { if (seeking) seekTo(e) }}
            onMouseUp={() => setSeeking(false)}
            onMouseLeave={() => setSeeking(false)}>
            {bars.map((h, i) => (
              <div key={i} className={`flex-1 rounded-full transition-colors duration-100 ${i / bars.length < progress ? "bg-accent" : "bg-muted-foreground/25"}`} style={{ height: `${h * 100}%`, minHeight: 3 }} />
            ))}
          </div>
          <div className="mt-0.5 flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted-foreground/70">{fmt(currentTime)}</span>
            <span className="text-[10px] font-mono text-muted-foreground/50">{fmt(duration)}</span>
          </div>
        </div>
        <button onClick={cycleSpeed}
          className={`cursor-pointer flex h-6 items-center justify-center rounded-md px-1.5 text-[9px] font-bold transition-colors ${speed !== 1 ? "bg-accent/15 text-accent border border-accent/25" : "text-muted-foreground/50 hover:text-muted-foreground/80"}`}>
          {speed}x
        </button>
      </div>
      {text && (
        <div className="rounded-lg border border-border/30 bg-muted/10 px-2.5 py-1.5">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-wider">Transcrição</span>
          </div>
          <p className={`text-[11px] text-muted-foreground/60 leading-relaxed ${!expanded && isLong ? "line-clamp-2" : ""}`}>{text}</p>
          {isLong && (
            <button onClick={() => setExpanded((v) => !v)} className="cursor-pointer text-[10px] font-semibold text-accent/60 hover:text-accent mt-0.5">
              {expanded ? "Ver menos" : "Ver mais"}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── PIX Copy Button (WhatsApp-style) ────────────────────────────────────────

function PixCopyButton({ pixCopyPaste, merchantName }: { pixCopyPaste: string; merchantName?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(pixCopyPaste).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={handleCopy}
      className="cursor-pointer w-full flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-3.5 py-2.5 hover:bg-emerald-500/12 transition-colors mt-2"
    >
      <div className="h-8 w-8 shrink-0 rounded-lg bg-emerald-500/15 flex items-center justify-center">
        {copied ? <Check className="h-4 w-4 text-emerald-400" weight="bold" /> : <Copy className="h-4 w-4 text-emerald-400" />}
      </div>
      <div className="text-left min-w-0">
        <p className="text-[11px] font-bold text-emerald-400">{copied ? "Copiado!" : "Copiar código PIX"}</p>
        <p className="text-[10px] text-muted-foreground/50 truncate">{merchantName ?? "Pix"}</p>
      </div>
    </button>
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
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 border border-accent/20">
        <Robot className="h-3 w-3 text-accent" weight="fill" />
      </div>
      <div className="rounded-2xl rounded-bl-sm px-4 py-2.5 bg-card border border-border/60">
        <div className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
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
              {/* Status + Provider badge */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                  entry.status === "REPLIED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : entry.status === "ERROR" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    : entry.status === "ESCALATED" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "bg-muted/30 text-muted-foreground border border-border/40"
                }`}>
                  {entry.status}
                </span>
                {entry.llmProvider && (
                  <span className="inline-flex items-center rounded-md bg-accent/10 border border-accent/20 px-1.5 py-0.5 text-[9px] font-medium text-accent">
                    {entry.llmProvider}{entry.llmModel ? ` / ${entry.llmModel}` : ""}
                  </span>
                )}
                {entry.contactSentiment && (
                  <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-medium border ${
                    entry.contactSentiment === "positive" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : entry.contactSentiment === "negative" || entry.contactSentiment === "frustrated" ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      : "bg-muted/20 text-muted-foreground border-border/40"
                  }`}>
                    {entry.contactSentiment === "positive" ? "😊" : entry.contactSentiment === "negative" ? "😞" : entry.contactSentiment === "frustrated" ? "😤" : "😐"} {entry.contactSentiment}
                  </span>
                )}
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {entry.durationMs != null && (
                  <div className="flex justify-between text-[11px] text-muted-foreground/85">
                    <span>Duração</span>
                    <span>{entry.durationMs}ms</span>
                  </div>
                )}
                {(entry.totalInputTokens ?? 0) > 0 && (
                  <div className="flex justify-between text-[11px] text-muted-foreground/85">
                    <span>Input</span>
                    <span>{(entry.totalInputTokens ?? 0).toLocaleString("pt-BR")} tk</span>
                  </div>
                )}
                {(entry.totalOutputTokens ?? 0) > 0 && (
                  <div className="flex justify-between text-[11px] text-muted-foreground/85">
                    <span>Output</span>
                    <span>{(entry.totalOutputTokens ?? 0).toLocaleString("pt-BR")} tk</span>
                  </div>
                )}
                {entry.estimatedCostUsd != null && entry.estimatedCostUsd > 0 && (
                  <div className="flex justify-between text-[11px] text-muted-foreground/85">
                    <span>Custo</span>
                    <span>${entry.estimatedCostUsd.toFixed(4)}</span>
                  </div>
                )}
                {entry.contactResponseTimeSec != null && (
                  <div className="flex justify-between text-[11px] text-muted-foreground/85">
                    <span>Resp. contato</span>
                    <span>{entry.contactResponseTimeSec < 60 ? `${entry.contactResponseTimeSec}s` : `${Math.round(entry.contactResponseTimeSec / 60)}min`}</span>
                  </div>
                )}
                {entry.routerIntent && (
                  <div className="flex justify-between text-[11px] text-muted-foreground/85">
                    <span>Router</span>
                    <span>{entry.routerIntent} ({entry.routerConfidence != null ? `${Math.round(entry.routerConfidence * 100)}%` : "?"})</span>
                  </div>
                )}
              </div>
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
      initial={animate ? { opacity: 0, y: 6 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease }}
      className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {!isUser && (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 border border-accent/20 mb-1">
          <Robot className="h-3 w-3 text-accent" weight="fill" />
        </div>
      )}
      <div
        className={`max-w-[72%] rounded-2xl px-3.5 py-2.5 ${
          isUser
            ? "bg-accent/15 border border-accent/20 rounded-br-sm"
            : "bg-card border border-border/60 rounded-bl-sm"
        }`}
      >
        {isPixCharge ? (
          <div>
            <PixChargeBlock
              content={msg.content}
              metadata={pixMeta ? { qrCodeUrl: pixMeta.qrCodeUrl, pixCopyPaste: pixMeta.pixCopyPaste, amount: pixMeta.amount, description: pixMeta.description } : undefined}
            />
            {!!(pixMeta as Record<string, unknown> | undefined)?.pixCopyPaste && (
              <PixCopyButton pixCopyPaste={(pixMeta as Record<string, unknown>).pixCopyPaste as string} />
            )}
          </div>
        ) : isAudio && audioUrl ? (
          <AudioPlayer url={audioUrl} text={msg.content} />
        ) : (
          <p className="text-[12px] leading-relaxed whitespace-pre-wrap break-words text-foreground/90">
            {msg.content}
          </p>
        )}
        <div className={`flex items-center mt-1 gap-1.5 ${isUser ? "justify-end" : ""}`}>
          {!isUser && msg.role === "AGENT" && (
            <Robot className="h-2.5 w-2.5 text-accent/50" weight="fill" />
          )}
          <span className="text-[10px] text-muted-foreground/50">{time}</span>
        </div>
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
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 shrink-0 h-11 px-4 md:px-5">
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
      <ResizablePanelGroup className="flex-1 min-h-0 overflow-hidden">
        {/* Chat panel */}
        <ResizablePanel defaultSize={60} minSize={40} className="flex flex-col min-w-0 min-h-0 overflow-hidden">
      {/* Chat body */}
      <div className="flex-1 flex flex-col min-h-0 h-0 overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex flex-col gap-3">
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
          <div className="shrink-0 border-t border-border/50 px-5 py-3">
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
        <ResizablePanel defaultSize={40} minSize={28} className="flex flex-col min-w-0 min-h-0 h-0 overflow-hidden border-l border-border/50 bg-muted/[0.03]">
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
