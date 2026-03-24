"use client"

import { useState, useEffect, useRef, type KeyboardEvent } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Plus,
  Trash,
  DotsSixVertical,
  Check,
  Warning,
  Spinner,
  FlowArrow,
  Tag,
} from "@phosphor-icons/react"
import { useFunnelMutations } from "@/hooks/use-board"
import type { FunnelListItem } from "@/lib/api/funnels"
import { InstructionTextarea } from "@/components/app/instruction-textarea"

const ease = [0.33, 1, 0.68, 1] as const

// ─── Preset colors for stage picker ──────────────────────────────────────────

const STAGE_COLORS = [
  "#64748b", // slate
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // rose
  "#ec4899", // pink
  "#f97316", // orange
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface DraftStage {
  _key: string      // local key for React list (not a server ID)
  id?: string       // present when editing existing stage
  name: string
  color: string
  isTerminal: boolean
  order: number
}

interface FunnelModalProps {
  open: boolean
  onClose: () => void
  /** When provided, edit mode; otherwise create mode */
  funnel?: FunnelListItem
}

// ─── Color swatch ─────────────────────────────────────────────────────────────

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {STAGE_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className="h-5 w-5 rounded-full border-2 transition-all duration-150 shrink-0"
          style={{
            background: c,
            borderColor: value === c ? "white" : "transparent",
            boxShadow: value === c ? `0 0 0 1px ${c}` : "none",
          }}
        />
      ))}
      {/* Custom hex input */}
      <div className="flex items-center gap-1 ml-1">
        <div className="h-5 w-5 rounded-full border border-border/60 shrink-0" style={{ background: value }} />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value
            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v)
          }}
          className="w-20 rounded-md border border-border/50 bg-muted/20 px-2 py-0.5 text-[11px] font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-accent/40"
          placeholder="#3b82f6"
        />
      </div>
    </div>
  )
}

// ─── Stage row ────────────────────────────────────────────────────────────────

function StageRow({
  stage,
  onChange,
  onRemove,
  canRemove,
}: {
  stage: DraftStage
  onChange: (s: DraftStage) => void
  onRemove: () => void
  canRemove: boolean
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.18, ease }}
      className="flex flex-col gap-2 rounded-xl border border-border/50 bg-muted/10 px-3 py-2.5"
    >
      <div className="flex items-center gap-2">
        <DotsSixVertical className="h-4 w-4 text-muted-foreground/85 shrink-0 cursor-grab" />

        {/* Color dot */}
        <div
          className="h-3 w-3 rounded-full shrink-0 border border-white/10"
          style={{ background: stage.color }}
        />

        {/* Name */}
        <input
          value={stage.name}
          onChange={(e) => onChange({ ...stage, name: e.target.value })}
          placeholder="Nome da etapa..."
          className="flex-1 min-w-0 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
        />

        {/* Terminal toggle */}
        <button
          type="button"
          onClick={() => onChange({ ...stage, isTerminal: !stage.isTerminal })}
          title={stage.isTerminal ? "Etapa final" : "Marcar como etapa final"}
          className={`shrink-0 flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors duration-150 ${
            stage.isTerminal
              ? "border-violet-500/30 bg-violet-500/10 text-violet-400"
              : "border-border/40 bg-transparent text-muted-foreground/90 hover:border-border hover:text-muted-foreground"
          }`}
        >
          final
        </button>

        {/* Remove */}
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/85 hover:text-rose-400 hover:bg-rose-500/10 transition-colors duration-150"
          >
            <Trash className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Color picker */}
      <div className="pl-6">
        <ColorPicker value={stage.color} onChange={(c) => onChange({ ...stage, color: c })} />
      </div>
    </motion.div>
  )
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export function FunnelModal({ open, onClose, funnel }: FunnelModalProps) {
  const isEdit = !!funnel
  const { createFunnel, updateFunnel, deleteFunnel, createStage, updateStage, deleteStage } = useFunnelMutations()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [stages, setStages] = useState<DraftStage[]>([])
  const [entryKeywords, setEntryKeywords] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState("")
  const [agentName, setAgentName] = useState("")
  const [agentPersonality, setAgentPersonality] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const keywordInputRef = useRef<HTMLInputElement>(null)

  // Populate from existing funnel when editing
  useEffect(() => {
    if (funnel) {
      setName(funnel.name)
      setDescription(funnel.description ?? "")
      setEntryKeywords(funnel.entryKeywords ?? [])
      setStages(
        funnel.stages.map((s, i) => ({
          _key: s.id,
          id: s.id,
          name: s.name,
          color: s.color,
          isTerminal: s.isTerminal,
          order: s.order ?? i,
        }))
      )
      setAgentName(funnel.agentName ?? "")
      setAgentPersonality(funnel.agentPersonality ?? "")
    } else {
      setName("")
      setDescription("")
      setEntryKeywords([])
      setAgentName("")
      setAgentPersonality("")
      setStages([
        { _key: "s0", name: "Novo contato", color: "#64748b", isTerminal: false, order: 0 },
        { _key: "s1", name: "Qualificando", color: "#f59e0b", isTerminal: false, order: 1 },
        { _key: "s2", name: "Concluído", color: "#10b981", isTerminal: true, order: 2 },
      ])
    }
    setKeywordInput("")
    setError(null)
    setDeleteConfirm(false)
  }, [funnel, open])

  function addKeyword(raw: string) {
    const kw = raw.trim().toLowerCase()
    if (!kw || entryKeywords.includes(kw)) return
    setEntryKeywords((prev) => [...prev, kw])
    setKeywordInput("")
  }

  function removeKeyword(kw: string) {
    setEntryKeywords((prev) => prev.filter((k) => k !== kw))
  }

  function handleKeywordKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addKeyword(keywordInput)
    } else if (e.key === "Backspace" && !keywordInput && entryKeywords.length > 0) {
      setEntryKeywords((prev) => prev.slice(0, -1))
    }
  }

  useEffect(() => {
    if (open) setTimeout(() => nameRef.current?.focus(), 60)
  }, [open])

  function addStage() {
    setStages((prev) => [
      ...prev,
      {
        _key: `s_${Date.now()}`,
        name: "",
        color: STAGE_COLORS[prev.length % STAGE_COLORS.length],
        isTerminal: false,
        order: prev.length,
      },
    ])
  }

  function updateStageLocal(key: string, updated: DraftStage) {
    setStages((prev) => prev.map((s) => (s._key === key ? updated : s)))
  }

  function removeStageLocal(key: string) {
    setStages((prev) => prev.filter((s) => s._key !== key))
  }

  async function handleSave() {
    if (!name.trim()) { setError("O nome do funil é obrigatório."); return }
    if (stages.length === 0) { setError("Adicione pelo menos uma etapa."); return }
    if (stages.some((s) => !s.name.trim())) { setError("Todas as etapas precisam de um nome."); return }

    setSaving(true)
    setError(null)

    try {
      if (isEdit && funnel) {
        // ── Edit mode ──
        await updateFunnel.mutateAsync({
          id: funnel.id,
          body: {
            name: name.trim(),
            description: description.trim() || null,
            entryKeywords,
            agentName: agentName.trim() || undefined,
            agentPersonality: agentPersonality.trim() || null,
          },
        })

        const existingIds = new Set(funnel.stages.map((s) => s.id))

        for (const [i, stage] of stages.entries()) {
          const body = { name: stage.name.trim(), color: stage.color, order: i, isTerminal: stage.isTerminal }
          if (stage.id && existingIds.has(stage.id)) {
            await updateStage.mutateAsync({ stageId: stage.id, funnelId: funnel.id, body })
          } else {
            await createStage.mutateAsync({ funnelId: funnel.id, body: { ...body, order: i } })
          }
        }

        // Delete removed stages
        for (const existing of funnel.stages) {
          if (!stages.find((s) => s.id === existing.id)) {
            await deleteStage.mutateAsync({ stageId: existing.id, funnelId: funnel.id })
          }
        }
      } else {
        // ── Create mode ──
        const created = await createFunnel.mutateAsync({
          name: name.trim(),
          description: description.trim() || null,
          entryKeywords,
          agentName: agentName.trim() || undefined,
          agentPersonality: agentPersonality.trim() || null,
        })
        for (const [i, stage] of stages.entries()) {
          await createStage.mutateAsync({
            funnelId: created.id,
            body: { name: stage.name.trim(), color: stage.color, order: i, isTerminal: stage.isTerminal },
          })
        }
      }

      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar o funil"
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!funnel) return
    setSaving(true)
    try {
      await deleteFunnel.mutateAsync(funnel.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir o funil")
      setSaving(false)
    }
  }

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
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.28, ease }}
            className="fixed inset-x-4 top-[10vh] z-50 mx-auto max-w-2xl rounded-2xl border border-border/60 bg-[oklch(0.14_0.02_263)] shadow-2xl shadow-black/60 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 border border-accent/20">
                  <FlowArrow className="h-4 w-4 text-accent" weight="duotone" />
                </div>
                <h2 className="text-[14px] font-semibold text-foreground">
                  {isEdit ? "Editar funil" : "Novo funil"}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/85 hover:text-foreground hover:bg-muted/40 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto max-h-[65vh] px-5 py-4 flex flex-col gap-5">

              {/* Funnel info */}
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground/90 uppercase tracking-wider">
                    Nome do funil *
                  </label>
                  <input
                    ref={nameRef}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Consulta Particular"
                    className="mt-1.5 w-full rounded-xl border border-border/60 bg-muted/20 px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground/90 uppercase tracking-wider">
                    Descrição
                  </label>
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Do primeiro contato à consulta paga"
                    className="mt-1.5 w-full rounded-xl border border-border/60 bg-muted/20 px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"
                  />
                </div>
              </div>

              {/* ─── Assistente do funil ─── */}
              <div className="flex flex-col gap-3">
                <label className="text-[11px] font-semibold text-muted-foreground/90 uppercase tracking-wider">
                  Assistente do funil
                </label>
                <div>
                  <label className="text-[11px] text-muted-foreground/85">Nome do assistente</label>
                  <input
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="Ex: Recepção, Miguel"
                    className="mt-1 w-full rounded-xl border border-border/60 bg-muted/20 px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground/85">Personalidade e instruções gerais</label>
                  <p className="text-[10px] text-muted-foreground/70 mb-1.5">
                    Como o assistente fala e age neste funil. Use @ para referenciar etapas, profissionais, serviços, ferramentas ou modelos de mensagem.
                  </p>
                  <InstructionTextarea
                    value={agentPersonality}
                    onChange={setAgentPersonality}
                    placeholder="Ex: Você é cordial e acolhedor. Use linguagem clara e evite termos técnicos."
                    className="min-h-[100px]"
                  />
                </div>
              </div>

              {/* Entry Keywords */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground/90" weight="duotone" />
                  <label className="text-[11px] font-semibold text-muted-foreground/90 uppercase tracking-wider">
                    Keywords de entrada
                  </label>
                </div>
                <p className="text-[11px] text-muted-foreground/85 mb-2">
                  Quando um novo contato mencionar alguma dessas palavras na primeira mensagem, será direcionado para este funil automaticamente.
                </p>

                {/* Chips + input */}
                <div
                  className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border/60 bg-muted/20 px-3 py-2 min-h-[42px] cursor-text focus-within:ring-2 focus-within:ring-accent/30 focus-within:border-accent/40 transition-all"
                  onClick={() => keywordInputRef.current?.focus()}
                >
                  <AnimatePresence initial={false}>
                    {entryKeywords.map((kw) => (
                      <motion.span
                        key={kw}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        transition={{ duration: 0.12 }}
                        className="inline-flex items-center gap-1 rounded-md border border-accent/25 bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent"
                      >
                        {kw}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeKeyword(kw) }}
                          className="cursor-pointer ml-0.5 text-accent/50 hover:text-accent transition-colors"
                          aria-label={`Remover ${kw}`}
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </motion.span>
                    ))}
                  </AnimatePresence>
                  <input
                    ref={keywordInputRef}
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={handleKeywordKeyDown}
                    onBlur={() => { if (keywordInput.trim()) addKeyword(keywordInput) }}
                    placeholder={entryKeywords.length === 0 ? "Ex: plano, convênio, urgente... (Enter para adicionar)" : "Adicionar..."}
                    className="flex-1 min-w-[140px] bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                  />
                </div>
                <p className="mt-1.5 text-[10px] text-muted-foreground/90">
                  Pressione <kbd className="rounded border border-border/30 bg-muted/20 px-1 font-mono text-[9px]">Enter</kbd> ou <kbd className="rounded border border-border/30 bg-muted/20 px-1 font-mono text-[9px]">,</kbd> para adicionar · <kbd className="rounded border border-border/30 bg-muted/20 px-1 font-mono text-[9px]">Backspace</kbd> para remover o último
                </p>
              </div>

              {/* Stages */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-[11px] font-semibold text-muted-foreground/90 uppercase tracking-wider">
                    Etapas ({stages.length})
                  </label>
                  <button
                    type="button"
                    onClick={addStage}
                    className="cursor-pointer flex items-center gap-1 rounded-lg border border-accent/25 bg-accent/[0.06] px-2.5 py-1 text-[11px] font-semibold text-accent/80 hover:text-accent hover:bg-accent/10 hover:border-accent/40 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    Adicionar etapa
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  <AnimatePresence initial={false}>
                    {stages.map((stage) => (
                      <StageRow
                        key={stage._key}
                        stage={stage}
                        onChange={(s) => updateStageLocal(stage._key, s)}
                        onRemove={() => removeStageLocal(stage._key)}
                        canRemove={stages.length > 1}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                <p className="mt-2 text-[11px] text-muted-foreground/85">
                  Marque como "final" etapas de conclusão (ex: Ganho, Perdido).
                </p>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/[0.08] px-3.5 py-2.5"
                  >
                    <Warning className="h-4 w-4 text-rose-400 shrink-0" weight="fill" />
                    <p className="text-[12px] text-rose-400">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border/50 px-5 py-4">
              {/* Delete (edit mode only) */}
              <div>
                {isEdit && (
                  deleteConfirm ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-rose-400/80">Confirmar exclusão?</span>
                      <button
                        onClick={handleDelete}
                        disabled={saving}
                        className="cursor-pointer flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[11px] font-bold text-rose-400 hover:bg-rose-500/20 transition-colors disabled:opacity-50"
                      >
                        <Check className="h-3 w-3" />
                        Sim, excluir
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(false)}
                        className="cursor-pointer text-[11px] text-muted-foreground/90 hover:text-muted-foreground transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(true)}
                      className="cursor-pointer flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] text-muted-foreground/90 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash className="h-3.5 w-3.5" />
                      Excluir funil
                    </button>
                  )
                )}
              </div>

              {/* Save / Cancel */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  disabled={saving}
                  className="cursor-pointer rounded-xl border border-border/60 px-4 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <motion.button
                  onClick={handleSave}
                  disabled={saving}
                  whileTap={{ scale: 0.97 }}
                  className="cursor-pointer flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-[13px] font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-60 disabled:cursor-default"
                >
                  {saving ? (
                    <Spinner className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  {saving ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar funil"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
