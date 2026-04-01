"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  TestTube,
  PaperPlaneTilt,
  Robot,
  ArrowClockwise,
  CaretDown,
  CaretRight,
  Play,
  WhatsappLogo,
  CalendarBlank,
  CurrencyCircleDollar,
  ArrowRight,
  Lightning,
  Brain,
  SpeakerHigh,
  Bell,
  ChatCircleText,
  Database,
  Info,
  MagnifyingGlass,
  Check,
  Warning,
  Coins,
  ListChecks,
  Gauge,
  ShieldCheck,
  Heartbeat,
  ArrowsCounterClockwise,
  CalendarX,
  ClockCounterClockwise,
  CheckCircle,
} from "@phosphor-icons/react"
import {
  useSuperAdminTenants,
  useSuperAdminTenantFunnels,
} from "@/hooks/use-super-admin"
import {
  useTenantInstances,
  useSAPlaygroundInit,
  useSAPlaygroundSend,
  useSAPlaygroundReset,
} from "@/hooks/use-sa-playground"
import type {
  SAPlaygroundResult,
  DryRunAction,
  TenantListItem,
} from "@/lib/api/super-admin"

const ease = [0.33, 1, 0.68, 1] as const

// ─── Types ──────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp: Date
  tokenCount?: number
  /** Index into the results array — only for assistant messages */
  resultIndex?: number
}

// ─── Typing indicator ───────────────────────────────────────────────────────

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
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.12,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Action icon map ────────────────────────────────────────────────────────

const ACTION_STYLES: Record<
  string,
  { icon: React.ElementType; color: string; bg: string; label: string }
> = {
  WHATSAPP_SEND: { icon: WhatsappLogo, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: "Envio WhatsApp" },
  SEND_MESSAGE: { icon: WhatsappLogo, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: "Envio de mensagem" },
  APPOINTMENT_CREATE: { icon: CalendarBlank, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", label: "Criar agendamento" },
  PIX_CHARGE: { icon: CurrencyCircleDollar, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", label: "Cobranca PIX" },
  STAGE_MOVE: { icon: ArrowRight, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20", label: "Mover etapa" },
  TRIGGER_DISPATCH: { icon: Lightning, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", label: "Disparar trigger" },
  TRIGGER_RESOLVED: { icon: Lightning, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", label: "Trigger resolvido" },
  COLLECT_INFO: { icon: Brain, color: "text-accent", bg: "bg-accent/10 border-accent/20", label: "Coletar informacao" },
  TTS_AUDIO: { icon: SpeakerHigh, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20", label: "Audio TTS" },
  AUDIO_GENERATION: { icon: SpeakerHigh, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20", label: "Gerar audio" },
  NOTIFY_OPERATOR: { icon: Bell, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20", label: "Notificar operador" },
  DB_MESSAGE: { icon: ChatCircleText, color: "text-muted-foreground", bg: "bg-muted/20 border-border/30", label: "Mensagem DB" },
  FIRESTORE_SYNC: { icon: Database, color: "text-muted-foreground", bg: "bg-muted/20 border-border/30", label: "Sync Firestore" },
  USAGE_CHECK: { icon: Gauge, color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20", label: "Verificar uso" },
  USAGE_INCREMENT: { icon: Heartbeat, color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20", label: "Incrementar uso" },
  MEMORY_CONSOLIDATION: { icon: Brain, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20", label: "Consolidar memorias" },
  GUARDRAIL: { icon: ShieldCheck, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20", label: "Guardrail" },
  AUTO_CONFIRM_APPOINTMENT: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: "Auto-confirmar consulta" },
  CANCEL_APPOINTMENT: { icon: CalendarX, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20", label: "Cancelar agendamento" },
  RESCHEDULE_APPOINTMENT: { icon: ClockCounterClockwise, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", label: "Remarcar agendamento" },
}

function ActionIcon({ type }: { type: string }) {
  const entry = ACTION_STYLES[type] ?? { icon: Info, color: "text-muted-foreground", bg: "bg-muted/20 border-border/30", label: type }
  const Icon = entry.icon
  return <Icon className={`h-4 w-4 ${entry.color}`} weight="duotone" />
}

// ─── Searchable dropdown ────────────────────────────────────────────────────

function SearchableSelect<T extends { id: string }>({
  items,
  value,
  onChange,
  renderLabel,
  searchText,
  placeholder,
  searchPlaceholder,
  loading,
}: {
  items: T[]
  value: string | null
  onChange: (id: string | null) => void
  renderLabel: (item: T) => React.ReactNode
  searchText?: (item: T) => string
  placeholder: string
  searchPlaceholder?: string
  loading?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const filtered = items.filter((item) => {
    const text = searchText ? searchText(item) : String(renderLabel(item))
    return text.toLowerCase().includes(search.toLowerCase())
  })

  const selected = items.find((i) => i.id === value)

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-full items-center gap-2 rounded-lg border border-border bg-card/50 px-2.5 text-[12px] text-foreground hover:bg-muted/40 transition-colors duration-200 cursor-pointer"
      >
        <span className="flex-1 text-left truncate">
          {loading ? (
            <span className="text-muted-foreground/60">Carregando...</span>
          ) : selected ? (
            renderLabel(selected)
          ) : (
            <span className="text-muted-foreground/60">{placeholder}</span>
          )}
        </span>
        <CaretDown className="h-3 w-3 text-muted-foreground shrink-0" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.2, ease }}
            className="absolute left-0 top-full mt-1 w-full rounded-xl border border-border bg-popover shadow-xl shadow-foreground/8 overflow-hidden z-50 max-h-60"
          >
            {searchPlaceholder && (
              <div className="p-1.5 border-b border-border/60">
                <div className="flex items-center gap-2 rounded-lg bg-muted/30 px-2.5 py-1.5">
                  <MagnifyingGlass className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="flex-1 bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground/50 outline-none"
                    autoFocus
                  />
                </div>
              </div>
            )}
            <div className="p-1.5 max-h-48 overflow-y-auto scrollbar-none">
              {filtered.length === 0 && (
                <p className="px-2.5 py-2 text-[11px] text-muted-foreground/60">
                  Nenhum resultado
                </p>
              )}
              {filtered.map((item) => {
                const active = item.id === value
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onChange(item.id)
                      setOpen(false)
                      setSearch("")
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] transition-colors duration-150 cursor-pointer ${
                      active
                        ? "bg-accent/10 text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    <span className="flex-1 text-left truncate">
                      {renderLabel(item)}
                    </span>
                    {active && (
                      <Check
                        className="h-3.5 w-3.5 text-accent shrink-0"
                        weight="bold"
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Action card ────────────────────────────────────────────────────────────

function ActionCard({ action }: { action: DryRunAction }) {
  const [expanded, setExpanded] = useState(false)
  const style = ACTION_STYLES[action.type] ?? { icon: Info, color: "text-muted-foreground", bg: "bg-muted/20 border-border/30", label: action.type }

  return (
    <div className={`rounded-lg border p-3 ${style.bg}`}>
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5">
          <ActionIcon type={action.type} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-[10px] font-bold uppercase tracking-wider ${style.color} opacity-80`}>
            {style.label}
          </p>
          <p className="text-[12px] text-foreground/90 mt-0.5 leading-relaxed">
            {action.description}
          </p>
          {action.data && Object.keys(action.data).length > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 mt-1.5 text-[10px] font-medium text-accent/80 hover:text-accent transition-colors cursor-pointer"
            >
              {expanded ? (
                <CaretDown className="h-3 w-3" weight="bold" />
              ) : (
                <CaretRight className="h-3 w-3" weight="bold" />
              )}
              {expanded ? "Ocultar dados" : "Ver dados"}
            </button>
          )}
          <AnimatePresence>
            {expanded && action.data && (
              <motion.pre
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-2 overflow-hidden rounded-md bg-muted/20 border border-border/30 p-2 text-[10px] text-muted-foreground/80 font-mono leading-relaxed overflow-x-auto"
              >
                {JSON.stringify(action.data, null, 2)}
              </motion.pre>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// ─── Badge helpers ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    REPLIED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    ERROR: "bg-rose-500/15 text-rose-400 border-rose-500/25",
    ESCALATED: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    TRIGGER_RESOLVED: "bg-violet-500/15 text-violet-400 border-violet-500/25",
    CONFIRMATION_REQUIRED: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  }
  const cls =
    colors[status] ??
    "bg-muted/30 text-muted-foreground border-border/40"
  return (
    <span
      className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cls}`}
    >
      {status}
    </span>
  )
}

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const colors: Record<string, string> = {
    positive: "bg-emerald-500/15 text-emerald-400",
    neutral: "bg-muted/30 text-muted-foreground",
    negative: "bg-rose-500/15 text-rose-400",
  }
  const cls = colors[sentiment.toLowerCase()] ?? "bg-muted/30 text-muted-foreground"
  return (
    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${cls}`}>
      {sentiment}
    </span>
  )
}

// ─── Left Panel — Configuration ─────────────────────────────────────────────

function ConfigPanel({
  tenantId,
  setTenantId,
  funnelId,
  setFunnelId,
  stageId,
  setStageId,
  llmProvider,
  setLlmProvider,
  llmModel,
  setLlmModel,
  onInit,
  onReset,
  initPending,
  resetPending,
  sessionActive,
}: {
  tenantId: string | null
  setTenantId: (id: string | null) => void
  funnelId: string | null
  setFunnelId: (id: string | null) => void
  stageId: string | null
  setStageId: (id: string | null) => void
  llmProvider: string | null
  setLlmProvider: (v: string | null) => void
  llmModel: string | null
  setLlmModel: (v: string | null) => void
  onInit: () => void
  onReset: () => void
  initPending: boolean
  resetPending: boolean
  sessionActive: boolean
}) {
  const { data: tenantsData, isLoading: tenantsLoading } =
    useSuperAdminTenants()
  const tenants = tenantsData?.tenants ?? []

  const { data: instancesData, isLoading: instancesLoading } =
    useTenantInstances(tenantId)

  const { data: funnels, isLoading: funnelsLoading } =
    useSuperAdminTenantFunnels(tenantId)

  const selectedFunnel = funnels?.find((f) => f.id === funnelId)
  const stages = selectedFunnel?.stages ?? []

  // Auto-select first stage when funnel changes
  useEffect(() => {
    if (stages.length > 0 && !stageId) {
      setStageId(stages[0].id)
    }
  }, [stages, stageId, setStageId])

  const canInit = !!tenantId && !!funnelId && !initPending

  return (
    <div className="flex h-full w-[280px] shrink-0 flex-col border-r border-border/60 bg-background/50">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/60">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10">
          <TestTube className="h-4 w-4 text-accent" weight="duotone" />
        </div>
        <div>
          <p className="text-[13px] font-bold text-foreground">Playground</p>
          <p className="text-[10px] text-muted-foreground/70">
            Super Admin dry-run
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none">
        {/* Tenant selector */}
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 mb-1.5 block">
            Tenant
          </label>
          <SearchableSelect
            items={tenants.map((t) => ({ ...t, id: t.id }))}
            value={tenantId}
            onChange={(id) => {
              setTenantId(id)
              setFunnelId(null)
              setStageId(null)
            }}
            renderLabel={(t: TenantListItem & { id: string }) => (
              <span className="flex items-center gap-1.5">
                <span className="truncate">{t.name}</span>
                {t._count && (
                  <span className="text-muted-foreground/40 text-[10px] shrink-0">
                    {t._count.funnels}f
                  </span>
                )}
              </span>
            )}
            searchText={(t) => `${t.name} ${t.slug ?? ""}`}
            placeholder="Selecionar tenant..."
            searchPlaceholder="Buscar tenant..."
            loading={tenantsLoading}
          />
        </div>

        {/* Instance info */}
        {tenantId && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 mb-1.5 block">
              Instancias
            </label>
            {instancesLoading ? (
              <div className="h-8 w-full animate-pulse rounded-lg bg-muted/30" />
            ) : (instancesData ?? []).length === 0 ? (
              <p className="text-[11px] text-muted-foreground/60 px-1">
                Nenhuma instancia encontrada
              </p>
            ) : (
              <div className="space-y-1">
                {(instancesData ?? []).map((inst) => (
                  <div
                    key={inst.instanceId}
                    className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/30 px-2.5 py-1.5"
                  >
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${
                        inst.isActive ? "bg-emerald-400" : "bg-muted-foreground/40"
                      }`}
                    />
                    <span className="text-[11px] text-foreground/80 truncate flex-1">
                      {inst.label ?? inst.instanceId.slice(0, 12)}
                    </span>
                    {inst.connectedPhone && (
                      <span className="text-[10px] text-muted-foreground/50">
                        {inst.connectedPhone}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Funnel selector */}
        {tenantId && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 mb-1.5 block">
              Funil
            </label>
            <SearchableSelect
              items={(funnels ?? []).map((f) => ({ ...f, id: f.id }))}
              value={funnelId}
              onChange={(id) => {
                setFunnelId(id)
                setStageId(null)
              }}
              renderLabel={(f) => f.name}
              placeholder="Selecionar funil..."
              loading={funnelsLoading}
            />
          </motion.div>
        )}

        {/* Stage selector */}
        {funnelId && stages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 mb-1.5 block">
              Etapa
            </label>
            <SearchableSelect
              items={stages.map((s) => ({ ...s, id: s.id }))}
              value={stageId}
              onChange={setStageId}
              renderLabel={(s) => s.name}
              placeholder="Selecionar etapa..."
            />
          </motion.div>
        )}
        {/* LLM Override */}
        <div className="pt-3 border-t border-border/40">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 mb-1.5 block">
            Modelo (override)
          </label>
          <select
            value={llmProvider ?? ""}
            onChange={(e) => {
              const p = e.target.value || null
              setLlmProvider(p)
              setLlmModel(null)
            }}
            className="w-full h-8 rounded-lg border border-border/60 bg-card/50 px-2 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-accent/30 cursor-pointer mb-1.5"
          >
            <option value="">Config do tenant</option>
            <option value="anthropic">Anthropic (Claude)</option>
            <option value="openai">OpenAI (GPT)</option>
            <option value="gemini">Google (Gemini)</option>
          </select>
          {llmProvider && (
            <select
              value={llmModel ?? ""}
              onChange={(e) => setLlmModel(e.target.value || null)}
              className="w-full h-8 rounded-lg border border-border/60 bg-card/50 px-2 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-accent/30 cursor-pointer"
            >
              <option value="">Selecionar modelo</option>
              {llmProvider === "anthropic" && (
                <>
                  <option value="claude-haiku-4-5">Claude Haiku 4.5</option>
                  <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
                </>
              )}
              {llmProvider === "openai" && (
                <>
                  <option value="gpt-5.4-mini">GPT-5.4 Mini</option>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                  <option value="gpt-4o">GPT-4o</option>
                </>
              )}
              {llmProvider === "gemini" && (
                <>
                  <option value="gemini-3-flash-preview">Gemini 3 Flash (Preview)</option>
                  <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash-Lite (Preview)</option>
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                </>
              )}
            </select>
          )}
          {!llmProvider && (
            <p className="text-[9px] text-muted-foreground/50 mt-1">Usa o modelo configurado no stage/env</p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-4 border-t border-border/60 space-y-2">
        <button
          type="button"
          onClick={onInit}
          disabled={!canInit || initPending}
          className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-accent text-accent-foreground text-[12px] font-semibold transition-colors hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {initPending ? (
            <ArrowClockwise className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5" weight="fill" />
          )}
          Iniciar Sessao
        </button>
        {sessionActive && (
          <button
            type="button"
            onClick={onReset}
            disabled={resetPending}
            className="flex h-8 w-full items-center justify-center gap-2 rounded-lg border border-border bg-card/50 text-muted-foreground text-[12px] font-medium transition-colors hover:bg-muted/40 disabled:opacity-40 cursor-pointer"
          >
            {resetPending ? (
              <ArrowClockwise className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ArrowClockwise className="h-3.5 w-3.5" />
            )}
            Resetar
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Center Panel — Chat ────────────────────────────────────────────────────

function ChatPanel({
  messages,
  sending,
  sessionActive,
  selectedResultIdx,
  onSend,
  onSelectMessage,
}: {
  messages: ChatMessage[]
  sending: boolean
  sessionActive: boolean
  selectedResultIdx: number | null
  onSend: (message: string) => void
  onSelectMessage: (resultIndex: number) => void
}) {
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, sending])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text || sending || !sessionActive) return
    onSend(text)
    setInput("")
  }, [input, sending, sessionActive, onSend])

  return (
    <div className="flex flex-1 flex-col min-w-0">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none">
        {!sessionActive && messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <TestTube
                className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3"
                weight="duotone"
              />
              <p className="text-[13px] text-muted-foreground/60">
                Configure e inicie uma sessao para comecar
              </p>
            </div>
          </div>
        )}

        {sessionActive && messages.length === 0 && !sending && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <ChatCircleText
                className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3"
                weight="duotone"
              />
              <p className="text-[13px] text-muted-foreground/60">
                Sessao ativa — envie uma mensagem
              </p>
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            const isSelected = msg.role === "assistant" && msg.resultIndex != null && msg.resultIndex === selectedResultIdx
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease }}
                className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 border border-accent/20">
                    <Robot className="h-3.5 w-3.5 text-accent" weight="fill" />
                  </div>
                )}
                <div
                  onClick={() => {
                    if (msg.role === "assistant" && msg.resultIndex != null) onSelectMessage(msg.resultIndex)
                  }}
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 transition-all ${
                    msg.role === "user"
                      ? "rounded-br-md bg-accent text-accent-foreground"
                      : `rounded-bl-md bg-card border text-foreground cursor-pointer hover:border-accent/40 ${isSelected ? "border-accent/50 ring-1 ring-accent/20" : "border-border/60"}`
                  }`}
                >
                  <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                  <div className={`flex items-center gap-1.5 mt-1 ${msg.role === "user" ? "text-accent-foreground/50" : "text-muted-foreground/50"}`}>
                    <span className="text-[9px]">
                      {msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {msg.role === "assistant" && msg.tokenCount != null && (
                      <span className="text-[9px] bg-muted/30 rounded px-1 py-0.5 font-mono">
                        {msg.tokenCount.toLocaleString("pt-BR")} tk
                      </span>
                    )}
                    {isSelected && (
                      <span className="text-[8px] text-accent font-semibold">● selecionado</span>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        <AnimatePresence>{sending && <TypingIndicator />}</AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border/60 p-3">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder={
              sessionActive
                ? "Digite uma mensagem..."
                : "Inicie uma sessao primeiro"
            }
            disabled={!sessionActive || sending}
            className="flex-1 h-9 rounded-lg border border-border bg-card/50 px-3 text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-accent/50 transition-colors disabled:opacity-40"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || sending || !sessionActive}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <PaperPlaneTilt className="h-4 w-4" weight="fill" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Right Panel — Audit ────────────────────────────────────────────────────

type AuditTab = "acoes" | "auditoria" | "custo"

function AuditPanel({ result, results }: { result: SAPlaygroundResult | null; results: SAPlaygroundResult[] }) {
  const [tab, setTab] = useState<AuditTab>("acoes")

  const tabs: Array<{ key: AuditTab; label: string; icon: React.ElementType }> = [
    { key: "acoes", label: "Acoes", icon: ListChecks },
    { key: "auditoria", label: "Auditoria", icon: Gauge },
    { key: "custo", label: "Custo", icon: Coins },
  ]

  return (
    <div className="flex h-full w-[350px] shrink-0 flex-col border-l border-border/60 bg-background/50">
      {/* Tab navigation */}
      <div className="flex border-b border-border/60">
        {tabs.map((t) => {
          const Icon = t.icon
          const active = tab === t.key
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
                active
                  ? "text-accent border-accent"
                  : "text-muted-foreground/60 border-transparent hover:text-muted-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" weight={active ? "duotone" : "regular"} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-none">
        {!result ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-[12px] text-muted-foreground/50">
              Envie uma mensagem para ver os resultados
            </p>
          </div>
        ) : (
          <>
            {tab === "acoes" && <ActionsTab result={result} />}
            {tab === "auditoria" && <AuditTab result={result} />}
            {tab === "custo" && <CostTab result={result} results={results} />}
          </>
        )}
      </div>
    </div>
  )
}

function ActionsTab({ result }: { result: SAPlaygroundResult }) {
  const actions = result.interceptedActions ?? []

  if (actions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Info
          className="h-8 w-8 text-muted-foreground/30 mb-2"
          weight="duotone"
        />
        <p className="text-[12px] text-muted-foreground/60">
          Nenhuma acao interceptada
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {actions.map((action, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: i * 0.05 }}
        >
          <ActionCard action={action} />
        </motion.div>
      ))}
    </div>
  )
}

function AuditTab({ result }: { result: SAPlaygroundResult }) {
  return (
    <div className="space-y-4">
      {/* Status */}
      <div>
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 block mb-1">
          Status
        </label>
        <StatusBadge status={result.status} />
      </div>

      {/* Router */}
      {(result.intent || result.confidence != null) && (
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 block mb-1">
            Router
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {result.intent && (
              <span className="inline-flex items-center rounded-md bg-accent/10 border border-accent/20 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                {result.intent}
              </span>
            )}
            {result.confidence != null && (
              <span className="text-[10px] text-muted-foreground/70">
                {(result.confidence * 100).toFixed(0)}% confianca
              </span>
            )}
          </div>
        </div>
      )}

      {/* Provider + Model */}
      {(result.llmProvider || result.llmModel) && (
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 block mb-1">
            Modelo
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {result.llmProvider && (
              <span className="inline-flex items-center rounded-md bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 text-[10px] font-medium text-violet-400">
                {result.llmProvider}
              </span>
            )}
            {result.llmModel && (
              <span className="inline-flex items-center rounded-md bg-muted/30 border border-border/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {result.llmModel}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Sentiment */}
      {result.contactSentiment && (
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 block mb-1">
            Sentimento
          </label>
          <SentimentBadge sentiment={result.contactSentiment} />
        </div>
      )}

      {/* Audit details */}
      {result.auditDetails && result.auditDetails.length > 0 && (
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 block mb-2">
            Detalhes
          </label>
          <div className="space-y-3">
            {result.auditDetails.map((detail, i) => (
              <AuditDetailItem key={i} detail={detail} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AuditDetailItem({
  detail,
}: {
  detail: { label: string; detail: string; data?: Record<string, unknown> }
}) {
  const [expanded, setExpanded] = useState(false)
  const hasData = detail.data && Object.keys(detail.data).length > 0

  return (
    <div className="rounded-lg border border-border/40 bg-card/30 p-2.5">
      <p className="text-[10px] font-medium text-muted-foreground/80">
        {detail.label}
      </p>
      <p className="text-[11px] text-foreground/85 mt-0.5 leading-relaxed">
        {detail.detail}
      </p>
      {hasData && (
        <>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 mt-1 text-[10px] font-medium text-accent/80 hover:text-accent transition-colors cursor-pointer"
          >
            {expanded ? (
              <CaretDown className="h-3 w-3" weight="bold" />
            ) : (
              <CaretRight className="h-3 w-3" weight="bold" />
            )}
            {expanded ? "Ocultar" : "Ver dados"}
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.pre
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-1.5 overflow-hidden rounded-md bg-muted/20 border border-border/30 p-2 text-[10px] text-muted-foreground/80 font-mono leading-relaxed overflow-x-auto"
              >
                {JSON.stringify(detail.data, null, 2)}
              </motion.pre>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  )
}

function CostTab({ result, results }: { result: SAPlaygroundResult; results: SAPlaygroundResult[] }) {
  const totalCost = results.reduce((sum, r) => sum + (r.estimatedCostUsd ?? 0), 0)
  const totalInput = results.reduce((sum, r) => sum + (r.inputTokens ?? 0), 0)
  const totalOutput = results.reduce((sum, r) => sum + (r.outputTokens ?? 0), 0)
  const totalDuration = results.reduce((sum, r) => sum + (r.durationMs ?? 0), 0)
  const rows: Array<{ label: string; value: string | number | undefined }> = [
    { label: "Provider", value: result.llmProvider },
    { label: "Modelo", value: result.llmModel },
    { label: "Input tokens", value: result.inputTokens?.toLocaleString("pt-BR") },
    { label: "Output tokens", value: result.outputTokens?.toLocaleString("pt-BR") },
    {
      label: "Custo estimado (USD)",
      value:
        result.estimatedCostUsd != null
          ? `$${result.estimatedCostUsd.toFixed(6)}`
          : undefined,
    },
    {
      label: "Duracao",
      value:
        result.durationMs != null
          ? `${(result.durationMs / 1000).toFixed(2)}s`
          : undefined,
    },
  ]

  return (
    <div className="space-y-4">
      {/* This message */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">Esta mensagem</p>
        <div className="space-y-1.5">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between rounded-lg border border-border/40 bg-card/30 px-3 py-2">
              <span className="text-[11px] text-muted-foreground/80">{row.label}</span>
              <span className="text-[12px] font-medium text-foreground tabular-nums">{row.value ?? "—"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Session totals */}
      {results.length > 1 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">Total da sessão ({results.length} msgs)</p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between rounded-lg border border-accent/20 bg-accent/5 px-3 py-2">
              <span className="text-[11px] text-accent/80">Custo total</span>
              <span className="text-[12px] font-bold text-accent tabular-nums">${totalCost.toFixed(4)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/40 bg-card/30 px-3 py-2">
              <span className="text-[11px] text-muted-foreground/80">Tokens totais</span>
              <span className="text-[12px] font-medium text-foreground tabular-nums">{(totalInput + totalOutput).toLocaleString("pt-BR")}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/40 bg-card/30 px-3 py-2">
              <span className="text-[11px] text-muted-foreground/80">Duração total</span>
              <span className="text-[12px] font-medium text-foreground tabular-nums">{(totalDuration / 1000).toFixed(1)}s</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function SAPlaygroundPage() {
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [funnelId, setFunnelId] = useState<string | null>(null)
  const [stageId, setStageId] = useState<string | null>(null)
  const [contactId, setContactId] = useState<string | null>(null)
  const [llmProvider, setLlmProvider] = useState<string | null>(null)
  const [llmModel, setLlmModel] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [results, setResults] = useState<SAPlaygroundResult[]>([])
  const [selectedResultIdx, setSelectedResultIdx] = useState<number | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initMut = useSAPlaygroundInit()
  const sendMut = useSAPlaygroundSend()
  const resetMut = useSAPlaygroundReset()

  const sessionActive = !!contactId

  const handleInit = useCallback(() => {
    if (!tenantId || !funnelId) return
    setError(null)
    initMut.mutate(
      { tenantId, funnelId, stageId: stageId ?? undefined },
      {
        onSuccess: (data) => {
          setContactId(data.contactId)
          setMessages([])
          setResults([])
          setSelectedResultIdx(null)
        },
        onError: (err) => {
          setError(
            err.message === "Failed to fetch"
              ? "Erro de conexao ao iniciar sessao."
              : `Falha ao iniciar sessao: ${err.message}`,
          )
        },
      }
    )
  }, [tenantId, funnelId, stageId, initMut])

  const handleReset = useCallback(() => {
    if (!tenantId) return
    setError(null)
    resetMut.mutate(tenantId, {
      onSuccess: () => {
        setContactId(null)
        setMessages([])
        setResults([])
        setSelectedResultIdx(null)
      },
      onError: (err) => {
        setError(
          err.message === "Failed to fetch"
            ? "Erro de conexao ao resetar."
            : `Falha ao resetar: ${err.message}`,
        )
      },
    })
  }, [tenantId, resetMut])

  const handleSend = useCallback(
    (message: string) => {
      if (!tenantId || !contactId) return
      setError(null)
      setSending(true)

      setMessages((prev) => [
        ...prev,
        { role: "user", content: message, timestamp: new Date() },
      ])

      sendMut.mutate(
        {
          tenantId,
          contactId,
          message,
          llmProviderOverride: llmProvider ?? undefined,
          llmModelOverride: llmModel ?? undefined,
        },
        {
          onSuccess: (result) => {
            setSending(false)
            const newResultIdx = results.length
            setResults((prev) => [...prev, result])
            setSelectedResultIdx(newResultIdx)
            // Use WHATSAPP_SEND chunks from interceptedActions to replicate actual WhatsApp delivery
            const whatsappChunks = (result.interceptedActions ?? [])
              .filter((a: { type: string; data?: Record<string, unknown> }) => a.type === "WHATSAPP_SEND" && a.data?.content)
              .map((a: { data?: Record<string, unknown> }) => a.data!.content as string)

            if (whatsappChunks.length > 0) {
              setMessages((prev) => [
                ...prev,
                ...whatsappChunks.map((chunk: string, i: number) => ({
                  role: "assistant" as const,
                  content: chunk,
                  timestamp: new Date(Date.now() + i),
                  tokenCount: i === 0 ? ((result.inputTokens ?? 0) + (result.outputTokens ?? 0) || undefined) : undefined,
                  resultIndex: newResultIdx,
                })),
              ])
            } else if (result.reply) {
              setMessages((prev) => [
                ...prev,
                {
                  role: "assistant" as const,
                  content: result.reply!,
                  timestamp: new Date(),
                  tokenCount: (result.inputTokens ?? 0) + (result.outputTokens ?? 0) || undefined,
                  resultIndex: newResultIdx,
                },
              ])
            }
          },
          onError: (err) => {
            setSending(false)
            setError(
              err.message === "Failed to fetch"
                ? "Erro de conexao. Verifique sua rede e tente novamente."
                : err.message.includes("timeout")
                  ? "Tempo esgotado. A requisicao demorou demais."
                  : `Erro: ${err.message}`,
            )
          },
        }
      )
    },
    [tenantId, contactId, sendMut]
  )

  return (
    <div className="flex h-full">
      <ConfigPanel
        tenantId={tenantId}
        setTenantId={setTenantId}
        funnelId={funnelId}
        setFunnelId={setFunnelId}
        stageId={stageId}
        setStageId={setStageId}
        llmProvider={llmProvider}
        setLlmProvider={setLlmProvider}
        llmModel={llmModel}
        setLlmModel={setLlmModel}
        onInit={handleInit}
        onReset={handleReset}
        initPending={initMut.isPending}
        resetPending={resetMut.isPending}
        sessionActive={sessionActive}
      />

      <div className="flex flex-1 flex-col min-w-0 relative">
        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="absolute top-0 left-0 right-0 z-10 flex items-center gap-2 border-b border-rose-500/20 bg-rose-500/5 px-4 py-2.5"
            >
              <Warning
                className="h-4 w-4 text-rose-400 shrink-0"
                weight="duotone"
              />
              <p className="flex-1 text-[12px] text-rose-300/90">{error}</p>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-[11px] text-rose-400/60 hover:text-rose-400 transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <ChatPanel
          messages={messages}
          sending={sending}
          sessionActive={sessionActive}
          selectedResultIdx={selectedResultIdx}
          onSend={handleSend}
          onSelectMessage={setSelectedResultIdx}
        />
      </div>

      <AuditPanel result={selectedResultIdx != null ? results[selectedResultIdx] ?? null : null} results={results} />
    </div>
  )
}
