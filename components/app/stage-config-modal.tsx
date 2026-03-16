"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Robot,
  Check,
  Spinner,
  TextAa,
  Sparkle,
  ListChecks,
  Lightning,
  Plus,
  PencilSimple,
  Trash,
  ToggleLeft,
  ToggleRight,
  CurrencyDollar,
} from "@phosphor-icons/react"
import { useStageAgentConfig, useFunnelMutations, useTriggers, useFunnels } from "@/hooks/use-board"
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
]

const MODELS = [
  { value: "HAIKU" as const, label: "Haiku" },
  { value: "SONNET" as const, label: "Sonnet" },
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
}

function getTriggerMessage(ac: unknown): string {
  if (ac && typeof ac === "object" && "message" in ac && typeof (ac as { message: unknown }).message === "string")
    return ((ac as { message: string }).message).slice(0, 60)
  return ""
}

interface StageConfigModalProps {
  open: boolean
  onClose: () => void
  stage: BoardStage | null
}

type TabId = "agente" | "triggers"
type PromptTab = "personality" | "context"

export function StageConfigModal({ open, onClose, stage }: StageConfigModalProps) {
  const stageId = stage?.id ?? null
  const [activeTab, setActiveTab] = useState<TabId>("agente")
  const [promptTab, setPromptTab] = useState<PromptTab>("personality")
  const { data: config, isLoading } = useStageAgentConfig(stageId)
  const { data: triggers = [], isLoading: triggersLoading } = useTriggers(stageId)
  const { data: funnels = [] } = useFunnels()
  const {
    upsertAgentConfig,
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

  const [funnelAgentName, setFunnelAgentName] = useState("")
  const [funnelAgentPersonality, setFunnelAgentPersonality] = useState("")
  const [stageContext, setStageContext] = useState("")
  const [allowedTools, setAllowedTools] = useState<AllowedTool[]>([])
  const [requirePaymentBeforeConfirm, setRequirePaymentBeforeConfirm] = useState(false)
  const [model, setModel] = useState<"HAIKU" | "SONNET">("SONNET")
  const [temperature, setTemperature] = useState(0.4)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setActiveTab("agente")
      setPromptTab("personality")
    }
  }, [open])

  useEffect(() => {
    if (config) {
      setFunnelAgentName(config.funnelAgentName ?? "")
      setFunnelAgentPersonality(config.funnelAgentPersonality ?? "")
      setStageContext(config.stageContext ?? "")
      setAllowedTools(config.allowedTools ?? [])
      setRequirePaymentBeforeConfirm(config.requirePaymentBeforeConfirm ?? false)
      setModel(config.model ?? "SONNET")
      setTemperature(config.temperature ?? 0.4)
    } else if (open && !isLoading) {
      setFunnelAgentName(stage?.name ?? "")
      setFunnelAgentPersonality("")
      setStageContext("")
      setAllowedTools(["search_availability", "create_appointment", "move_stage", "send_message", "notify_operator"])
      setRequirePaymentBeforeConfirm(false)
      setModel("SONNET")
      setTemperature(0.4)
    }
    setError(null)
  }, [config, isLoading, open, stage?.name])

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
          funnelAgentName: funnelAgentName.trim() || undefined,
          funnelAgentPersonality: funnelAgentPersonality.trim() || undefined,
          stageContext: stageContext.trim() || undefined,
          allowedTools: finalAllowedTools,
          requirePaymentBeforeConfirm: requirePaymentBeforeConfirm || undefined,
          model,
          temperature,
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
                  <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                    Agente de IA e triggers automáticos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
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
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 sm:px-8 py-5 flex flex-col gap-5">
              {activeTab === "triggers" ? (
                /* ─── Triggers tab ─── */
                <>
                  {triggersLoading ? (
                    <div className="flex justify-center py-12">
                      <Spinner className="h-6 w-6 text-accent animate-spin" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-[12px] text-muted-foreground">
                          Mensagens e ações automáticas ao entrar na etapa ou em eventos
                        </p>
                        <button
                          type="button"
                          onClick={() => setAddingTrigger(true)}
                          className="flex items-center gap-1.5 rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-[12px] font-semibold text-accent hover:bg-accent/20 transition-colors cursor-pointer"
                        >
                          <Plus className="h-4 w-4" weight="bold" />
                          Novo trigger
                        </button>
                      </div>
                      <div className="flex flex-col gap-2">
                        {triggers.length === 0 && (
                          <div className="rounded-xl border border-dashed border-border/50 bg-muted/5 py-10 text-center">
                            <Lightning className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" weight="duotone" />
                            <p className="text-[13px] text-muted-foreground">Nenhum trigger configurado</p>
                            <p className="text-[11px] text-muted-foreground/70 mt-1">Adicione triggers para enviar mensagens automáticas</p>
                            <button
                              type="button"
                              onClick={() => setAddingTrigger(true)}
                              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-accent/10 border border-accent/30 px-3 py-1.5 text-[12px] font-semibold text-accent hover:bg-accent/20 cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5" /> Adicionar trigger
                            </button>
                          </div>
                        )}
                        {triggers.map((t) => (
                          <motion.div
                            key={t.id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/5 px-4 py-3"
                          >
                            <button
                              type="button"
                              onClick={() => toggleTrigger.mutate(t.id)}
                              className="shrink-0 cursor-pointer"
                              title={t.isActive ? "Desativar" : "Ativar"}
                            >
                              {t.isActive ? (
                                <ToggleRight className="h-6 w-6 text-accent" weight="fill" />
                              ) : (
                                <ToggleLeft className="h-6 w-6 text-muted-foreground/40" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-semibold text-foreground">
                                {EVENT_LABELS[t.event] ?? t.event} → {ACTION_LABELS[t.action] ?? t.action}
                              </p>
                              {t.action === "SEND_MESSAGE" && (
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {getTriggerMessage(t.actionConfig) || "Sem mensagem"}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => setEditingTrigger(t)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 cursor-pointer"
                                title="Editar"
                              >
                                <PencilSimple className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (confirm("Excluir este trigger?"))
                                    await deleteTrigger.mutateAsync(t.id)
                                }}
                                disabled={deleteTrigger.isPending}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                                title="Excluir"
                              >
                                <Trash className="h-4 w-4" />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
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
                </>
              ) : isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner className="h-6 w-6 text-accent animate-spin" />
                </div>
              ) : (
                /* ─── Agente tab ─── */
                <>
                  {/* Row 1: Name + Model + Temperature */}
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-4 items-end">
                    <div className="space-y-1.5">
                      <label className={labelCls}>Nome do assistente</label>
                      <div className="flex items-center gap-2.5">
                        <TextAa className="h-4 w-4 text-muted-foreground/60 shrink-0" weight="duotone" />
                        <input
                          type="text"
                          value={funnelAgentName}
                          onChange={(e) => setFunnelAgentName(e.target.value)}
                          placeholder="Ex: Recepção, Pré-triagem"
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5 sm:w-[130px]">
                      <label className={labelCls}>Modelo</label>
                      <select
                        value={model}
                        onChange={(e) => setModel(e.target.value as "HAIKU" | "SONNET")}
                        className="w-full rounded-xl border border-border/60 bg-background/40 px-3 py-2.5 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 cursor-pointer"
                      >
                        {MODELS.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5 sm:w-[120px]">
                      <label className={labelCls}>Temp. ({temperature.toFixed(1)})</label>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.1}
                        value={temperature}
                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                        className="w-full h-2.5 rounded-full accent-accent mt-2 cursor-pointer"
                      />
                      <p className="text-[10px] text-muted-foreground/60">0 conservador · 1 criativo</p>
                    </div>
                  </div>

                  {/* Row 2: Prompts (left) + Tools (right) — side by side on large screens */}
                  <div className="flex flex-col lg:flex-row gap-5">
                    {/* Left: Prompt tabs */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      {/* Sub-tabs */}
                      <div className="flex items-center gap-1 mb-3">
                        <button
                          type="button"
                          onClick={() => setPromptTab("personality")}
                          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                            promptTab === "personality"
                              ? "bg-accent/15 text-accent"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                          }`}
                        >
                          <Sparkle className="h-3.5 w-3.5" weight="duotone" />
                          Personalidade
                        </button>
                        <button
                          type="button"
                          onClick={() => setPromptTab("context")}
                          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                            promptTab === "context"
                              ? "bg-accent/15 text-accent"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                          }`}
                        >
                          <ListChecks className="h-3.5 w-3.5" weight="duotone" />
                          Instruções
                        </button>
                      </div>

                      {/* Tab content */}
                      <AnimatePresence mode="wait">
                        {promptTab === "personality" ? (
                          <motion.div
                            key="personality"
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 6 }}
                            transition={{ duration: 0.12 }}
                            className="flex flex-col gap-2"
                          >
                            <p className="text-[11px] text-muted-foreground/70">
                              Como o assistente fala e age — tom, estilo, regras gerais.
                            </p>
                            <InstructionTextarea
                              value={funnelAgentPersonality}
                              onChange={setFunnelAgentPersonality}
                              placeholder="Ex: Você é cordial e acolhedor. Use linguagem clara e evite termos técnicos. Seja breve e objetivo. Use @ para mencionar etapas, profissionais, serviços ou ferramentas."
                              rows={9}
                            />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="context"
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 6 }}
                            transition={{ duration: 0.12 }}
                            className="flex flex-col gap-2"
                          >
                            <p className="text-[11px] text-muted-foreground/70">
                              O que o assistente deve fazer nesta etapa. Instruções específicas.
                            </p>
                            <InstructionTextarea
                              value={stageContext}
                              onChange={setStageContext}
                              placeholder="Ex: Apresente a clínica, colete nome e motivo. Ofereça horários com @tool:search_availability. Use @ para mencionar etapas, profissionais, serviços ou ferramentas."
                              rows={9}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Right: Tools + PIX */}
                    <div className="lg:w-[250px] shrink-0 flex flex-col gap-4">
                      <div>
                        <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                          Ferramentas permitidas
                        </h3>
                        <div className="flex flex-col gap-1">
                          {ALLOWED_TOOLS.map((tool) => {
                            const checked = allowedTools.includes(tool.value)
                            return (
                              <button
                                key={tool.value}
                                type="button"
                                onClick={() => toggleTool(tool.value)}
                                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all cursor-pointer ${
                                  checked
                                    ? "bg-accent/10 border border-accent/30"
                                    : "bg-transparent border border-transparent hover:bg-muted/20"
                                }`}
                              >
                                <div
                                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-[1.5px] transition-colors ${
                                    checked ? "border-accent bg-accent" : "border-muted-foreground/30"
                                  }`}
                                >
                                  {checked && <Check className="h-2.5 w-2.5 text-accent-foreground" weight="bold" />}
                                </div>
                                <span className="text-[12px] font-medium text-foreground">{tool.label}</span>
                              </button>
                            )
                          })}
                        </div>
                        {!allowedTools.includes("create_appointment") && (
                          <p className="text-[10px] text-amber-500/80 mt-1.5 px-1">
                            Sem &quot;Agendar consulta&quot;, a IA não consegue criar consultas.
                          </p>
                        )}
                      </div>

                      {/* PIX toggle */}
                      <div className="rounded-xl border border-border/40 bg-muted/5 px-3 py-3">
                        <div className="flex items-start gap-2.5">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={requirePaymentBeforeConfirm}
                            onClick={() => setRequirePaymentBeforeConfirm((v) => !v)}
                            className={`flex h-5 w-9 shrink-0 mt-0.5 items-center rounded-full transition-colors cursor-pointer ${
                              requirePaymentBeforeConfirm ? "bg-accent" : "bg-muted"
                            }`}
                          >
                            <motion.div
                              animate={{ x: requirePaymentBeforeConfirm ? 16 : 2 }}
                              transition={{ duration: 0.2 }}
                              className="h-4 w-4 rounded-full bg-white shadow"
                            />
                          </button>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <CurrencyDollar className="h-3.5 w-3.5 text-muted-foreground/60" weight="duotone" />
                              <p className="text-[12px] font-medium text-foreground">PIX antes de agendar</p>
                            </div>
                            <p className="text-[10px] text-muted-foreground/60 mt-0.5 leading-relaxed">
                              Horário → PIX → consulta criada após pagamento.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[12px] text-rose-400"
                    >
                      {error}
                    </motion.p>
                  )}
                </>
              )}
            </div>

            {/* Footer — only for Agente tab */}
            {activeTab === "agente" && (
              <div key="footer" className="flex items-center justify-end gap-3 border-t border-border/50 px-6 sm:px-8 py-4 shrink-0 bg-background/95">
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
