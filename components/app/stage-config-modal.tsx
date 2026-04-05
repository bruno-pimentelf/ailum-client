"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Robot,
  Check,
  Spinner,
  ListChecks,
  Lightning,
  Plus,
  PencilSimple,
  Trash,
  ToggleLeft,
  ToggleRight,
  CurrencyDollar,
  UserCircle,
} from "@phosphor-icons/react"
import { useStageAgentConfig, useFunnelMutations, useTriggers, useFunnels } from "@/hooks/use-board"
import { useProfessionals } from "@/hooks/use-professionals"
import { voicesApi } from "@/lib/api/voices"
import { useQuery } from "@tanstack/react-query"
import { SpeakerHigh } from "@phosphor-icons/react"
import { funnelsApi } from "@/lib/api/funnels"
import type { BoardStage } from "@/lib/api/funnels"
import type { AllowedTool, Trigger } from "@/lib/api/funnels"
import { TriggerEditorModal } from "./trigger-editor-modal"
import { InstructionTextarea } from "./instruction-textarea"

const ease = [0.33, 1, 0.68, 1] as const

const inputCls =
  "w-full rounded-xl border border-border/60 bg-background/40 px-4 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all duration-200"
const labelCls = "block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5"

const ALLOWED_TOOLS: { value: AllowedTool; label: string }[] = [
  { value: "search_availability", label: "Buscar disponibilidade" },
  { value: "create_appointment", label: "Agendar consulta" },
  { value: "cancel_appointment", label: "Cancelar consulta" },
  { value: "reschedule_appointment", label: "Remarcar consulta" },
  { value: "move_stage", label: "Mover entre etapas" },
  { value: "send_message", label: "Enviar mensagem" },
  { value: "notify_operator", label: "Escalar para humano" },
  { value: "generate_pix", label: "Gerar cobrança PIX" },
  { value: "collect_info", label: "Coletar dados do paciente" },
  { value: "send_template", label: "Enviar template" },
]

const FALLBACK_MODELS = [
  { value: "HAIKU" as const, label: "Haiku (rápido)" },
  { value: "SONNET" as const, label: "Sonnet (inteligente)" },
]

const EVENT_LABELS: Record<string, string> = {
  STAGE_ENTERED: "Entrar na etapa",
  STALE_IN_STAGE: "Parado na etapa",
  PAYMENT_CONFIRMED: "Pagamento confirmado",
  APPOINTMENT_APPROACHING: "Consulta próxima",
  AI_INTENT: "Intenção IA",
  MESSAGE_RECEIVED: "Mensagem recebida",
}
const ACTION_LABELS: Record<string, string> = {
  SEND_MESSAGE: "Enviar mensagem",
  MOVE_STAGE: "Mover etapa",
  GENERATE_PIX: "Gerar PIX",
  NOTIFY_OPERATOR: "Notificar operador",
  WAIT_AND_REPEAT: "Aguardar e repetir",
  GENERATE_SUMMARY: "Gerar resumo",
}

function getTriggerMessage(ac: unknown): string {
  if (ac && typeof ac === "object" && "message" in ac && typeof (ac as { message: unknown }).message === "string")
    return ((ac as { message: string }).message).slice(0, 80)
  return ""
}

function formatDelay(minutes: number): string {
  if (minutes < 60) return `${minutes}min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

function getTriggerUseAI(ac: unknown): boolean {
  if (ac && typeof ac === "object" && "useAI" in ac) return Boolean((ac as { useAI: unknown }).useAI)
  return false
}

function ProfessionalsSection({
  professionals,
  allowedIds,
  onChange,
}: {
  professionals: Array<{ id: string; fullName: string; calendarColor: string; specialty: string | null }>
  allowedIds: string[]
  onChange: (ids: string[]) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const allSelected = allowedIds.length === 0

  return (
    <div className="space-y-2 pt-2 border-t border-border/20">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Profissionais</p>
        {!allSelected && (
          <button type="button" onClick={() => onChange([])}
            className="text-[9px] text-muted-foreground/50 hover:text-foreground cursor-pointer">Limpar</button>
        )}
      </div>

      {allSelected && !expanded ? (
        <button type="button" onClick={() => setExpanded(true)}
          className="w-full flex items-center justify-between rounded-lg border border-border/40 bg-muted/10 px-3 py-2 cursor-pointer hover:bg-muted/20 transition-colors">
          <div className="flex items-center gap-2">
            <UserCircle className="h-3.5 w-3.5 text-emerald-400" weight="fill" />
            <span className="text-[11px] font-medium text-foreground">Todos os profissionais</span>
          </div>
          <span className="text-[9px] text-muted-foreground/50">Clique para filtrar</span>
        </button>
      ) : (
        <div className="space-y-1">
          {professionals.map((prof) => {
            const checked = allowedIds.includes(prof.id)
            return (
              <button key={prof.id} type="button"
                onClick={() => onChange(
                  allowedIds.includes(prof.id)
                    ? allowedIds.filter((id) => id !== prof.id)
                    : [...allowedIds, prof.id]
                )}
                className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-all cursor-pointer border ${
                  checked ? "border-accent/30 bg-accent/10" : "border-transparent hover:bg-muted/20"
                }`}>
                <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: prof.calendarColor || "#3b82f6" }} />
                <span className="text-[11px] font-medium text-foreground truncate flex-1">{prof.fullName}</span>
                {checked && <Check className="h-3 w-3 text-accent" weight="bold" />}
              </button>
            )
          })}
          {allowedIds.length === 0 && expanded && (
            <button type="button" onClick={() => setExpanded(false)}
              className="text-[9px] text-muted-foreground/40 hover:text-foreground cursor-pointer">Fechar</button>
          )}
        </div>
      )}
    </div>
  )
}

interface StageConfigModalProps {
  open: boolean
  onClose: () => void
  stage: BoardStage | null
}

type TabId = "agente" | "triggers"
// PromptTab removed — personality moved to funnel-modal

export function StageConfigModal({ open, onClose, stage }: StageConfigModalProps) {
  const stageId = stage?.id ?? null
  const [activeTab, setActiveTab] = useState<TabId>("agente")
  // promptTab removed — personality now lives in funnel-modal
  const { data: config, isLoading } = useStageAgentConfig(stageId)
  const { data: triggers = [], isLoading: triggersLoading } = useTriggers(stageId)
  const { data: funnels = [] } = useFunnels()
  const { data: professionals = [] } = useProfessionals()
  const {
    upsertAgentConfig,
    updateStage,
    deleteStage,
    createTrigger,
    updateTrigger,
    deleteTrigger,
    toggleTrigger,
  } = useFunnelMutations()

  const currentFunnel = funnels.find((f) => f.stages.some((s) => s.id === stageId))
  const stages: BoardStage[] = currentFunnel?.stages?.map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
    order: s.order,
    isTerminal: s.isTerminal,
    contacts: [],
    _count: { contacts: 0 },
  })) ?? []

  const [editingTrigger, setEditingTrigger] = useState<Trigger | null>(null)
  const [addingTrigger, setAddingTrigger] = useState(false)

  const [stageContext, setStageContext] = useState("")
  const [allowedTools, setAllowedTools] = useState<AllowedTool[]>([])
  const [requiredFields, setRequiredFields] = useState<string[]>([])
  const [allowedProfessionalIds, setAllowedProfessionalIds] = useState<string[]>([])
  const [requirePaymentBeforeConfirm, setRequirePaymentBeforeConfirm] = useState(false)
  const [model, setModel] = useState<"HAIKU" | "SONNET">("SONNET")
  const [llmProvider, setLlmProvider] = useState<string | null>(null)
  const [llmModel, setLlmModel] = useState<string | null>(null)
  const [temperature, setTemperature] = useState(0.4)
  const llmModelsQuery = useQuery({ queryKey: ["llm-models"], queryFn: funnelsApi.llmModels, staleTime: 300_000 })
  const llmData = llmModelsQuery.data
  const [voiceId, setVoiceId] = useState<string | null>(null)
  const [voiceChance, setVoiceChance] = useState(100)
  const [isTerminal, setIsTerminal] = useState(false)
  const [confirmDeleteStage, setConfirmDeleteStage] = useState(false)
  const [saving, setSaving] = useState(false)
  const voicesQuery = useQuery({ queryKey: ["voices"], queryFn: voicesApi.list, staleTime: 60_000 })
  const voices = voicesQuery.data ?? []
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setActiveTab("agente")
    }
  }, [open])

  useEffect(() => {
    if (config) {
      setStageContext(config.stageContext ?? "")
      setAllowedTools(config.allowedTools ?? [])
      setRequiredFields(config.requiredFields ?? [])
      setAllowedProfessionalIds(config.allowedProfessionalIds ?? [])
      setRequirePaymentBeforeConfirm(config.requirePaymentBeforeConfirm ?? false)
      setModel(config.model ?? "SONNET")
      setLlmProvider(config.llmProvider ?? null)
      setLlmModel(config.llmModel ?? null)
      setTemperature(config.temperature ?? 0.4)
      setVoiceId(config.voiceId ?? null)
      setVoiceChance((config as unknown as { voiceChance?: number }).voiceChance ?? 100)
      setIsTerminal(stage?.isTerminal ?? false)
    } else if (open && !isLoading) {
      setStageContext("")
      setAllowedTools(["search_availability", "create_appointment", "move_stage", "send_message", "notify_operator"])
      setRequiredFields([])
      setAllowedProfessionalIds([])
      setRequirePaymentBeforeConfirm(false)
      setModel("SONNET")
      setLlmProvider(null)
      setLlmModel(null)
      setTemperature(0.4)
      setVoiceId(null)
      setIsTerminal(stage?.isTerminal ?? false)
    }
    setError(null)
  }, [config, isLoading, open, stage?.name, stage?.isTerminal])

  function toggleTool(tool: AllowedTool) {
    setAllowedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool],
    )
  }

  async function handleSave() {
    if (!stageId) return
    setSaving(true)
    setError(null)
    try {
      const finalAllowedTools = (requirePaymentBeforeConfirm
        ? [...allowedTools.filter((t) => t !== "create_appointment"), "generate_pix"].filter(
            (t, i, a) => a.indexOf(t) === i
          )
        : allowedTools) as AllowedTool[]

      await upsertAgentConfig.mutateAsync({
        stageId,
        body: {
          stageContext: stageContext.trim() || undefined,
          allowedTools: finalAllowedTools,
          requiredFields: requiredFields.length > 0 ? requiredFields : [],
          allowedProfessionalIds: allowedProfessionalIds.length > 0 ? allowedProfessionalIds : [],
          requirePaymentBeforeConfirm: requirePaymentBeforeConfirm || undefined,
          model,
          llmProvider: llmProvider || null,
          llmModel: llmModel || null,
          temperature,
          voiceId: voiceId || null,
          voiceChance,
        },
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.25, ease }}
            className="fixed inset-x-5 sm:inset-x-8 top-[4vh] bottom-[4vh] z-50 mx-auto max-w-5xl w-full rounded-2xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl shadow-black/20 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/50 px-6 sm:px-8 py-4 shrink-0">
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, ease }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 border border-accent/20"
                >
                  <Robot className="h-4.5 w-4 text-accent" weight="duotone" />
                </motion.div>
                <div>
                  <h2 className="text-[14px] font-semibold text-foreground">
                    Configurar — {stage?.name ?? "Etapa"}
                  </h2>
                  <p className="text-[11px] text-muted-foreground/90 mt-0.5">
                    Agente de IA e triggers automáticos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/85 hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-0 border-b border-border/40 px-6 sm:px-8 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("agente")}
                className={`px-4 py-3 text-[12px] font-semibold transition-colors border-b-2 -mb-px cursor-pointer ${
                  activeTab === "agente"
                    ? "border-accent text-accent"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Agente
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("triggers")}
                className={`px-4 py-3 text-[12px] font-semibold transition-colors border-b-2 -mb-px flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "triggers"
                    ? "border-accent text-accent"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Lightning className="h-3.5 w-3.5" weight="duotone" />
                Triggers
                {triggers.length > 0 && (
                  <span className="rounded-full bg-muted/60 px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                    {triggers.length}
                  </span>
                )}
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 min-h-0 flex flex-col">
              {activeTab === "triggers" ? (
                /* ─── Triggers tab ─── */
                <div className="flex-1 overflow-y-auto overscroll-contain px-6 sm:px-8 py-5 flex flex-col gap-6">
                {triggersLoading ? (
                    <div className="flex justify-center py-12">
                      <Spinner className="h-6 w-6 text-accent animate-spin" />
                    </div>
                  ) : (
                    <>
                      {/* ── Follow-ups section (STALE_IN_STAGE) ── */}
                      {(() => {
                        const followUps = triggers
                          .filter((t) => t.event === "STALE_IN_STAGE")
                          .sort((a, b) => a.delayMinutes - b.delayMinutes)
                        const otherTriggers = triggers.filter((t) => t.event !== "STALE_IN_STAGE")

                        return (
                          <>
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <p className="text-[13px] font-semibold text-foreground">Follow-ups</p>
                                  <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                                    Mensagens enviadas quando o contato para de responder
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setAddingTrigger(true)}
                                  className="flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-1.5 text-[11px] font-bold text-accent hover:bg-accent/20 transition-colors cursor-pointer"
                                >
                                  <Plus className="h-3 w-3" weight="bold" /> Novo
                                </button>
                              </div>

                              {followUps.length > 0 ? (
                                <div className="relative">
                                  {/* Timeline line */}
                                  <div className="absolute left-[15px] top-3 bottom-3 w-px bg-border/40" />

                                  <div className="space-y-1">
                                    {followUps.map((t, i) => (
                                      <motion.div
                                        key={t.id}
                                        initial={{ opacity: 0, x: -4 }}
                                        animate={{ opacity: t.isActive ? 1 : 0.45, x: 0 }}
                                        transition={{ duration: 0.2, delay: i * 0.05 }}
                                        className="group relative flex items-start gap-3 pl-1"
                                      >
                                        {/* Timeline dot */}
                                        <div className={`relative z-10 mt-3 flex h-[10px] w-[10px] shrink-0 items-center justify-center rounded-full border-2 ${
                                          t.isActive
                                            ? "border-accent bg-accent/30"
                                            : "border-muted-foreground/30 bg-muted/30"
                                        }`}>
                                          <span className={`h-1 w-1 rounded-full ${t.isActive ? "bg-accent" : "bg-muted-foreground/40"}`} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 rounded-lg border border-border/30 bg-muted/5 px-3 py-2.5 hover:border-border/50 transition-colors">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-bold text-accent/70 bg-accent/10 rounded px-1.5 py-0.5">
                                              {formatDelay(t.delayMinutes)}
                                            </span>
                                            {t.maxRepetitions > 0 && (
                                              <span className="text-[9px] text-muted-foreground/50">
                                                {t.maxRepetitions}x máx
                                              </span>
                                            )}
                                            {getTriggerUseAI(t.actionConfig) && (
                                              <span className="text-[9px] text-violet-400/70 bg-violet-500/10 rounded px-1 py-px font-medium">IA</span>
                                            )}
                                          </div>
                                          <p className="text-[12px] text-foreground/80 line-clamp-2 leading-relaxed">
                                            {getTriggerMessage(t.actionConfig) || (ACTION_LABELS[t.action] ?? t.action)}
                                          </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-0.5 shrink-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button type="button" onClick={() => toggleTrigger.mutate(t.id)}
                                            className="cursor-pointer shrink-0" title={t.isActive ? "Desativar" : "Ativar"}>
                                            {t.isActive
                                              ? <ToggleRight className="h-5 w-5 text-accent" weight="fill" />
                                              : <ToggleLeft className="h-5 w-5 text-muted-foreground/60" />}
                                          </button>
                                          <button type="button" onClick={() => setEditingTrigger(t)}
                                            className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/30" title="Editar">
                                            <PencilSimple className="h-3.5 w-3.5" />
                                          </button>
                                          <button type="button" onClick={async () => { if (confirm("Excluir este follow-up?")) await deleteTrigger.mutateAsync(t.id) }}
                                            disabled={deleteTrigger.isPending}
                                            className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/50 hover:text-rose-400 hover:bg-rose-500/10" title="Excluir">
                                            <Trash className="h-3.5 w-3.5" />
                                          </button>
                                        </div>
                                      </motion.div>
                                    ))}
                                  </div>

                                  {/* Summary */}
                                  <div className="mt-3 ml-8 flex items-center gap-2">
                                    <span className="text-[10px] text-muted-foreground/40">
                                      {followUps.filter((t) => t.isActive).length} follow-up{followUps.filter((t) => t.isActive).length !== 1 ? "s" : ""} ativo{followUps.filter((t) => t.isActive).length !== 1 ? "s" : ""}
                                      {followUps.length > followUps.filter((t) => t.isActive).length && ` · ${followUps.length - followUps.filter((t) => t.isActive).length} inativo${followUps.length - followUps.filter((t) => t.isActive).length !== 1 ? "s" : ""}`}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="rounded-xl border border-dashed border-border/40 py-6 text-center">
                                  <p className="text-[12px] text-muted-foreground/50">Nenhum follow-up configurado</p>
                                  <p className="text-[10px] text-muted-foreground/35 mt-0.5">O contato não receberá mensagens automáticas se parar de responder</p>
                                </div>
                              )}
                            </div>

                            {/* ── Other triggers ── */}
                            {otherTriggers.length > 0 && (
                              <div>
                                <p className="text-[13px] font-semibold text-foreground mb-3">Outros triggers</p>
                                <div className="space-y-1.5">
                                  {otherTriggers.map((t) => (
                                    <motion.div
                                      key={t.id}
                                      initial={{ opacity: 0, y: 4 }}
                                      animate={{ opacity: t.isActive ? 1 : 0.45, y: 0 }}
                                      className="group flex items-center gap-3 rounded-xl border border-border/40 bg-muted/5 px-3 py-2.5"
                                    >
                                      <button type="button" onClick={() => toggleTrigger.mutate(t.id)} className="shrink-0 cursor-pointer" title={t.isActive ? "Desativar" : "Ativar"}>
                                        {t.isActive ? <ToggleRight className="h-5 w-5 text-accent" weight="fill" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground/60" />}
                                      </button>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[12px] font-medium text-foreground/80">
                                          {EVENT_LABELS[t.event] ?? t.event} → {ACTION_LABELS[t.action] ?? t.action}
                                        </p>
                                        {t.action === "SEND_MESSAGE" && (
                                          <p className="text-[11px] text-muted-foreground/50 truncate">{getTriggerMessage(t.actionConfig) || "Sem mensagem"}</p>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button type="button" onClick={() => setEditingTrigger(t)}
                                          className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/30" title="Editar">
                                          <PencilSimple className="h-3.5 w-3.5" />
                                        </button>
                                        <button type="button" onClick={async () => { if (confirm("Excluir?")) await deleteTrigger.mutateAsync(t.id) }}
                                          disabled={deleteTrigger.isPending}
                                          className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/50 hover:text-rose-400 hover:bg-rose-500/10" title="Excluir">
                                          <Trash className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )
                      })()}
                    </>
                  )}
                  <TriggerEditorModal
                    open={addingTrigger || !!editingTrigger}
                    onClose={() => {
                      setAddingTrigger(false)
                      setEditingTrigger(null)
                    }}
                    trigger={editingTrigger}
                    stageId={stageId!}
                    stages={stages}
                    onSave={async (body) => {
                      if (editingTrigger)
                        await updateTrigger.mutateAsync({ triggerId: editingTrigger.id, body })
                      else
                        await createTrigger.mutateAsync({ stageId: stageId!, body })
                    }}
                  />
                </div>
              ) : isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Spinner className="h-6 w-6 text-accent animate-spin" />
                </div>
              ) : (
                /* ─── Agente tab — two-column layout ─── */
                <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">

                  {/* ═══ Left: Prompt (full height) ═══ */}
                  <div className="flex-1 min-h-0 min-w-0 flex flex-col p-5 lg:pr-0">
                    <div className="shrink-0 flex items-center gap-1.5 mb-2">
                      <ListChecks className="h-3.5 w-3.5 text-muted-foreground/90" weight="duotone" />
                      <label className={labelCls}>Instrucoes da etapa</label>
                    </div>
                    <p className="shrink-0 text-[11px] text-muted-foreground/70 mb-2">
                      Use @ para referenciar etapas, profissionais, servicos, ferramentas ou templates.
                    </p>
                    <InstructionTextarea
                      value={stageContext}
                      onChange={setStageContext}
                      placeholder="Ex: Apresente a clinica, colete nome e motivo. Ofereca horarios com @tool:search_availability."
                      className="flex-1 min-h-0"
                    />

                    {error && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="shrink-0 text-[12px] text-rose-400 mt-2">
                        {error}
                      </motion.p>
                    )}
                  </div>

                  {/* ═══ Right: Config panel (scrollable) ═══ */}
                  <div className="lg:w-[300px] shrink-0 border-t lg:border-t-0 lg:border-l border-border/30 overflow-y-auto overscroll-contain p-5 space-y-4">

                    {/* Tools */}
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Ferramentas</p>
                      <div className="flex flex-wrap gap-1.5">
                        {ALLOWED_TOOLS.map((tool) => {
                          const checked = allowedTools.includes(tool.value)
                          return (
                            <button
                              key={tool.value}
                              type="button"
                              onClick={() => toggleTool(tool.value)}
                              className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all cursor-pointer border ${
                                checked
                                  ? "border-accent/40 bg-accent/10 text-accent"
                                  : "border-border/40 text-muted-foreground/60 hover:border-border hover:text-foreground"
                              }`}
                            >
                              {tool.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Model + Temperature */}
                    <div className="space-y-3 pt-2 border-t border-border/20">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Modelo</p>
                      <div className="grid grid-cols-2 gap-2">
                        {llmData ? (
                          <>
                            <div>
                              <label className="text-[9px] font-bold text-muted-foreground/60 uppercase mb-1 block">Provider</label>
                              <select
                                value={llmProvider ?? ""}
                                onChange={(e) => {
                                  const p = e.target.value || null
                                  setLlmProvider(p)
                                  if (p && llmData.models[p]?.[0]) setLlmModel(llmData.models[p][0].id)
                                  else setLlmModel(null)
                                }}
                                className="w-full rounded-lg border border-border/50 bg-background/40 px-2.5 py-1.5 text-[11px] cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent/30"
                              >
                                <option value="">Padrao</option>
                                {Object.entries(llmData.providers).map(([k, l]) => (
                                  <option key={k} value={k}>{l}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-muted-foreground/60 uppercase mb-1 block">Modelo</label>
                              <select
                                value={llmModel ?? ""}
                                onChange={(e) => setLlmModel(e.target.value || null)}
                                disabled={!llmProvider}
                                className="w-full rounded-lg border border-border/50 bg-background/40 px-2.5 py-1.5 text-[11px] cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent/30 disabled:opacity-50"
                              >
                                {!llmProvider && <option value="">Padrao</option>}
                                {llmProvider && (llmData.models[llmProvider] ?? []).map((m) => (
                                  <option key={m.id} value={m.id}>{m.label}</option>
                                ))}
                              </select>
                            </div>
                          </>
                        ) : (
                          <div className="col-span-2">
                            <select
                              value={model}
                              onChange={(e) => setModel(e.target.value as "HAIKU" | "SONNET")}
                              className="w-full rounded-lg border border-border/50 bg-background/40 px-2.5 py-1.5 text-[11px] cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent/30"
                            >
                              {FALLBACK_MODELS.map((m) => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[9px] font-bold text-muted-foreground/60 uppercase">Temperatura</label>
                          <span className="text-[10px] font-bold text-accent tabular-nums">{temperature.toFixed(1)}</span>
                        </div>
                        <input type="range" min={0} max={1} step={0.1} value={temperature}
                          onChange={(e) => setTemperature(parseFloat(e.target.value))}
                          className="w-full h-1.5 rounded-full appearance-none bg-border/40 accent-accent cursor-pointer" />
                        <p className="text-[9px] text-muted-foreground/50 mt-0.5">0 conservador · 1 criativo</p>
                      </div>
                    </div>

                    {/* Voice */}
                    <div className="space-y-2 pt-2 border-t border-border/20">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Voz</p>
                      <select
                        value={voiceId ?? ""}
                        onChange={(e) => setVoiceId(e.target.value || null)}
                        className="w-full rounded-lg border border-border/50 bg-background/40 px-2.5 py-1.5 text-[11px] cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent/30"
                      >
                        <option value="">Sem voz (texto)</option>
                        {voices.map((v) => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                      {voiceId && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[9px] font-bold text-muted-foreground/60 uppercase">Chance de audio</label>
                            <span className="text-[10px] font-bold text-accent tabular-nums">{voiceChance}%</span>
                          </div>
                          <input type="range" min={0} max={100} step={10} value={voiceChance}
                            onChange={(e) => setVoiceChance(Number(e.target.value))}
                            className="w-full h-1.5 rounded-full appearance-none bg-border/40 accent-accent cursor-pointer" />
                        </div>
                      )}
                    </div>

                    {/* Required fields */}
                    {(allowedTools.includes("generate_pix") || allowedTools.includes("create_appointment") || requirePaymentBeforeConfirm) && (
                      <div className="space-y-2 pt-2 border-t border-border/20">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Dados obrigatorios</p>
                        <p className="text-[9px] text-muted-foreground/50">Exigidos antes de pagar/agendar</p>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { value: "cpf", label: "CPF" },
                            { value: "birth_date", label: "Nascimento" },
                            { value: "insurance", label: "Plano" },
                            { value: "email", label: "E-mail" },
                            { value: "name", label: "Nome" },
                          ].map((field) => {
                            const pixActive = allowedTools.includes("generate_pix") || requirePaymentBeforeConfirm
                            const locked = field.value === "cpf" && pixActive
                            const checked = locked || requiredFields.includes(field.value)
                            return (
                              <button
                                key={field.value}
                                type="button"
                                disabled={locked}
                                onClick={() => setRequiredFields((prev) =>
                                  prev.includes(field.value) ? prev.filter((f) => f !== field.value) : [...prev, field.value]
                                )}
                                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all border ${
                                  checked
                                    ? "border-accent/40 bg-accent/10 text-accent"
                                    : "border-border/40 text-muted-foreground/60 hover:border-border cursor-pointer"
                                } ${locked ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
                              >
                                {field.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Professionals */}
                    {professionals.length > 1 && (
                      <ProfessionalsSection
                        professionals={professionals}
                        allowedIds={allowedProfessionalIds}
                        onChange={setAllowedProfessionalIds}
                      />
                    )}

                    {/* PIX toggle */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/20">
                      <div>
                        <p className="text-[11px] font-medium text-foreground">PIX antes de agendar</p>
                        <p className="text-[9px] text-muted-foreground/50">Cobrar antes de confirmar</p>
                      </div>
                      <button type="button" role="switch" aria-checked={requirePaymentBeforeConfirm}
                        onClick={() => setRequirePaymentBeforeConfirm((v) => !v)}
                        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors cursor-pointer ${
                          requirePaymentBeforeConfirm ? "bg-accent" : "bg-muted"
                        }`}>
                        <motion.div animate={{ x: requirePaymentBeforeConfirm ? 16 : 2 }} transition={{ duration: 0.2 }}
                          className="h-4 w-4 rounded-full bg-white shadow" />
                      </button>
                    </div>

                    {/* Terminal toggle */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/20">
                      <div>
                        <p className="text-[11px] font-medium text-foreground">Etapa final</p>
                        <p className="text-[9px] text-muted-foreground/50">Encerra o fluxo</p>
                      </div>
                      <button type="button" role="switch" aria-checked={isTerminal}
                        onClick={() => {
                          if (!stage || !currentFunnel) return
                          const next = !isTerminal
                          setIsTerminal(next)
                          updateStage.mutate({ stageId: stage.id, funnelId: currentFunnel.id, body: { isTerminal: next } })
                        }}
                        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors cursor-pointer ${
                          isTerminal ? "bg-accent" : "bg-muted"
                        }`}>
                        <motion.div animate={{ x: isTerminal ? 16 : 2 }} transition={{ duration: 0.2 }}
                          className="h-4 w-4 rounded-full bg-white shadow" />
                      </button>
                    </div>

                  </div>
                </div>
              )}
            </div>

            {/* Footer — only for Agente tab */}
            {activeTab === "agente" && (
              <div key="footer" className="flex items-center gap-3 border-t border-border/50 px-6 sm:px-8 py-4 shrink-0 bg-background/95">
                {/* Delete stage */}
                {confirmDeleteStage ? (
                  <div className="flex items-center gap-2 mr-auto">
                    <span className="text-[11px] text-rose-400">Contatos serao movidos pro primeiro estagio.</span>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!stage || !currentFunnel) return
                        await deleteStage.mutateAsync({ stageId: stage.id, funnelId: currentFunnel.id })
                        setConfirmDeleteStage(false)
                        onClose()
                      }}
                      disabled={deleteStage.isPending}
                      className="text-[11px] font-bold text-rose-400 hover:text-rose-300 px-2 py-1 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {deleteStage.isPending ? "Excluindo..." : "Confirmar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteStage(false)}
                      className="text-[11px] text-muted-foreground hover:text-foreground px-1 cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteStage(true)}
                    className="flex items-center gap-1.5 text-[11px] font-medium text-rose-400/60 hover:text-rose-400 transition-colors cursor-pointer mr-auto"
                  >
                    <Trash className="h-3.5 w-3.5" />
                    Excluir etapa
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <motion.button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || isLoading}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-[13px] font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {saving ? (
                    <Spinner className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" weight="bold" />
                  )}
                  Salvar
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
