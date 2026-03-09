"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Robot, Check, Spinner } from "@phosphor-icons/react"
import { useStageAgentConfig, useFunnelMutations } from "@/hooks/use-board"
import type { BoardStage } from "@/lib/api/funnels"
import type { AllowedTool } from "@/lib/api/funnels"

const ease = [0.33, 1, 0.68, 1] as const

const ALLOWED_TOOLS: { value: AllowedTool; label: string }[] = [
  { value: "search_availability", label: "Buscar disponibilidade por data" },
  { value: "create_appointment", label: "Agendar consulta" },
  { value: "move_stage", label: "Mover entre etapas" },
  { value: "send_message", label: "Enviar mensagem programática" },
  { value: "notify_operator", label: "Escalar para humano" },
  { value: "generate_pix", label: "Gerar cobrança PIX" },
]

const MODELS = [
  { value: "HAIKU" as const, label: "Haiku (rápido)" },
  { value: "SONNET" as const, label: "Sonnet (preciso)" },
]

interface StageConfigModalProps {
  open: boolean
  onClose: () => void
  stage: BoardStage | null
}

export function StageConfigModal({ open, onClose, stage }: StageConfigModalProps) {
  const stageId = stage?.id ?? null
  const { data: config, isLoading } = useStageAgentConfig(stageId)
  const { upsertAgentConfig } = useFunnelMutations()

  const [allowedTools, setAllowedTools] = useState<AllowedTool[]>([])
  const [model, setModel] = useState<"HAIKU" | "SONNET">("SONNET")
  const [temperature, setTemperature] = useState(0.4)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (config) {
      setAllowedTools(config.allowedTools ?? [])
      setModel(config.model ?? "SONNET")
      setTemperature(config.temperature ?? 0.4)
    } else if (open && !isLoading) {
      setAllowedTools(["search_availability", "create_appointment", "move_stage", "send_message", "notify_operator"])
      setModel("SONNET")
      setTemperature(0.4)
    }
    setError(null)
  }, [config, isLoading, open])

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
        body: { allowedTools, model, temperature },
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
            className="fixed inset-x-4 top-[12vh] z-50 mx-auto max-w-md rounded-2xl border border-border/60 bg-[oklch(0.14_0.02_263)] shadow-2xl shadow-black/50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
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
                    Configurar IA — {stage?.name ?? "Etapa"}
                  </h2>
                  <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                    O que o agente pode fazer nesta etapa
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

            {/* Body */}
            <div className="overflow-y-auto max-h-[60vh] px-5 py-4 flex flex-col gap-5">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner className="h-6 w-6 text-accent animate-spin" />
                </div>
              ) : (
                <>
                  {/* Allowed tools */}
                  <div>
                    <h3 className="text-[12px] font-medium text-foreground/90 mb-3">
                      Ferramentas permitidas
                    </h3>
                    <div className="flex flex-col gap-2">
                      {ALLOWED_TOOLS.map((tool, i) => {
                        const checked = allowedTools.includes(tool.value)
                        return (
                          <motion.button
                            key={tool.value}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            type="button"
                            onClick={() => toggleTool(tool.value)}
                            className={`flex items-center gap-3 w-full rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
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
                      <p className="text-[11px] text-amber-500/90 mt-2">
                        Sem &quot;Agendar consulta&quot;, a IA não consegue criar consultas.
                      </p>
                    )}
                  </div>

                  {/* Model & Temperature */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[12px] font-medium text-foreground/90 mb-2 block">
                        Modelo
                      </label>
                      <select
                        value={model}
                        onChange={(e) => setModel(e.target.value as "HAIKU" | "SONNET")}
                        className="w-full rounded-xl border border-border/60 bg-muted/20 px-4 py-2.5 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
                      >
                        {MODELS.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[12px] font-medium text-foreground/90 mb-2 block">
                        Temperatura ({temperature.toFixed(1)})
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.1}
                        value={temperature}
                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                        className="w-full h-2 rounded-full accent-accent"
                      />
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

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-border/50 px-5 py-4 shrink-0">
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
