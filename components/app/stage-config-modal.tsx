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
} from "@phosphor-icons/react"
import { useStageAgentConfig, useFunnelMutations, useTriggers, useFunnels } from "@/hooks/use-board"
import type { BoardStage } from "@/lib/api/funnels"
import type { AllowedTool, Trigger } from "@/lib/api/funnels"
import { TriggerEditorModal } from "./trigger-editor-modal"
import { InstructionTextarea } from "./instruction-textarea"

const ease = [0.33, 1, 0.68, 1] as const

const inputCls =
  "w-full rounded-xl border border-border/60 bg-background/40 px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all duration-200"
const textareaCls =
  "w-full rounded-xl border border-border/60 bg-background/40 px-4 py-3 text-[14px] text-foreground leading-relaxed placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all duration-200 resize-y min-h-[140px] max-h-[280px]"
const labelCls = "block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5"

const ALLOWED_TOOLS: { value: AllowedTool; label: string }[] = [
  { value: "search_availability", label: "Buscar disponibilidade por data" },
  { value: "create_appointment", label: "Agendar consulta" },
  { value: "cancel_appointment", label: "Cancelar consulta" },
  { value: "reschedule_appointment", label: "Remarcar consulta" },
  { value: "move_stage", label: "Mover entre etapas" },
  { value: "send_message", label: "Enviar mensagem programática" },
  { value: "notify_operator", label: "Escalar para humano" },
  { value: "generate_pix", label: "Gerar cobrança PIX" },
]

const MODELS = [
  { value: "HAIKU" as const, label: "Haiku (rápido)" },
  { value: "SONNET" as const, label: "Sonnet (mais preciso)" },
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

export function StageConfigModal({ open, onClose, stage }: StageConfigModalProps) {
  const stageId = stage?.id ?? null
  const [activeTab, setActiveTab] = useState<TabId>("agente")
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
  const [model, setModel] = useState<"HAIKU" | "SONNET">("SONNET")
  const [temperature, setTemperature] = useState(0.4)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) setActiveTab("agente")
  }, [open])

  useEffect(() => {
    if (config) {
      setFunnelAgentName(config.funnelAgentName ?? "")
      setFunnelAgentPersonality(config.funnelAgentPersonality ?? "")
      setStageContext(config.stageContext ?? "")
      setAllowedTools(config.allowedTools ?? [])
      setModel(config.model ?? "SONNET")
      setTemperature(config.temperature ?? 0.4)
    } else if (open && !isLoading) {
      setFunnelAgentName(stage?.name ?? "")
      setFunnelAgentPersonality("")
      setStageContext("")
      setAllowedTools(["search_availability", "create_appointment", "move_stage", "send_message", "notify_operator"])
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
      await upsertAgentConfig.mutateAsync({
        stageId,
        body: {
          funnelAgentName: funnelAgentName.trim() || undefined,
          funnelAgentPersonality: funnelAgentPersonality.trim() || undefined,
          stageContext: stageContext.trim() || undefined,
          allowedTools,
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
            className="fixed inset-x-5 sm:inset-x-8 top-[4vh] bottom-[4vh] z-50 mx-auto max-w-4xl w-full rounded-2xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl shadow-black/20 flex flex-col overflow-hidden"
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
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-0 border-b border-border/40 px-6 sm:px-8 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("agente")}
                className={`px-4 py-3 text-[12px] font-semibold transition-colors border-b-2 -mb-px ${
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
                className={`px-4 py-3 text-[12px] font-semibold transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
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

            {/* Body — scroll interno */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 sm:px-8 py-6 flex flex-col gap-6">
              {activeTab === "triggers" ? (
                /* Triggers tab */
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
                          className="flex items-center gap-1.5 rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-[12px] font-semibold text-accent hover:bg-accent/20 transition-colors"
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
                              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-accent/10 border border-accent/30 px-3 py-1.5 text-[12px] font-semibold text-accent hover:bg-accent/20"
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
                              className="shrink-0"
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
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40"
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
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10"
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
                <>
                  {/* Linha 1: Nome + Modelo + Temperatura */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-1.5">
                      <label className={labelCls}>Nome do assistente</label>
                      <div className="flex items-center gap-3">
                        <TextAa className="h-5 w-5 text-muted-foreground shrink-0" weight="duotone" />
                        <input
                          type="text"
                          value={funnelAgentName}
                          onChange={(e) => setFunnelAgentName(e.target.value)}
                          placeholder="Ex: Recepção, Pré-triagem"
                          className={inputCls}
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground/80">
                        Nome exibido ao contato quando a IA responder
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className={labelCls}>Modelo</label>
                        <select
                          value={model}
                          onChange={(e) => setModel(e.target.value as "HAIKU" | "SONNET")}
                          className="w-full rounded-xl border border-border/60 bg-background/40 px-4 py-3 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40"
                        >
                          {MODELS.map((m) => (
                            <option key={m.value} value={m.value}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className={labelCls}>Temperatura ({temperature.toFixed(1)})</label>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.1}
                          value={temperature}
                          onChange={(e) => setTemperature(parseFloat(e.target.value))}
                          className="w-full h-2.5 rounded-full accent-accent mt-1"
                        />
                        <p className="text-[11px] text-muted-foreground/80">
                          0 = conservador · 1 = criativo
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Linha 2: Tom e personalidade + Instruções (2 colunas em telas grandes) */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className={labelCls}>Tom e personalidade</label>
                      <div className="flex gap-3">
                        <Sparkle className="h-5 w-5 text-muted-foreground shrink-0 mt-1" weight="duotone" />
                        <InstructionTextarea
                          value={funnelAgentPersonality}
                          onChange={setFunnelAgentPersonality}
                          allowedTools={allowedTools}
                          placeholder="Ex: Você é cordial e acolhedor. Use linguagem clara e evite termos técnicos. Seja breve e objetivo. Digite @ para referenciar ferramentas."
                          rows={5}
                          className={textareaCls}
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground/80">
                        Como o assistente fala e age — tom, estilo, regras gerais. Use @ para citar ferramentas.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className={labelCls}>Instruções do estágio</label>
                      <div className="flex gap-3">
                        <ListChecks className="h-5 w-5 text-muted-foreground shrink-0 mt-1" weight="duotone" />
                        <InstructionTextarea
                          value={stageContext}
                          onChange={setStageContext}
                          allowedTools={allowedTools}
                          placeholder="Ex: Apresente a clínica, colete nome e motivo. Ofereça horários com @search_availability. Digite @ para referenciar ferramentas."
                          rows={5}
                          className={textareaCls}
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground/80">
                        O que o assistente deve fazer nesta etapa. Use @ para citar ferramentas habilitadas.
                      </p>
                    </div>
                  </div>

                  {/* Allowed tools — grid 2 colunas em telas médias+ */}
                  <div>
                    <h3 className="text-[12px] font-medium text-foreground/90 mb-3">
                      Ferramentas permitidas
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {ALLOWED_TOOLS.map((tool, i) => {
                        const checked = allowedTools.includes(tool.value)
                        return (
                          <motion.button
                            key={tool.value}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.02 }}
                            type="button"
                            onClick={() => toggleTool(tool.value)}
                            className={`flex items-center gap-3 w-full rounded-xl border px-4 py-3.5 text-left transition-all duration-200 ${
                              checked
                                ? "border-accent/40 bg-accent/10"
                                : "border-border/50 bg-muted/10 hover:bg-muted/20"
                            }`}
                          >
                            <motion.div
                              animate={{ scale: checked ? 1 : 0.8 }}
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                                checked ? "border-accent bg-accent" : "border-muted-foreground/40"
                              }`}
                            >
                              {checked && <Check className="h-3 w-3 text-accent-foreground" weight="bold" />}
                            </motion.div>
                            <span className="text-[13px] font-medium text-foreground">{tool.label}</span>
                          </motion.button>
                        )
                      })}
                    </div>
                    {!allowedTools.includes("create_appointment") && (
                      <p className="text-[11px] text-amber-500/90 mt-2 sm:col-span-2">
                        Sem &quot;Agendar consulta&quot;, a IA não consegue criar consultas.
                      </p>
                    )}
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
                className="px-4 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
              <motion.button
                type="button"
                onClick={handleSave}
                disabled={saving || isLoading}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-[13px] font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
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
