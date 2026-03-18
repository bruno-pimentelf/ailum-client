"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Brain,
  Plus,
  Trash,
  Check,
  Warning,
  ArrowsClockwise,
  Info,
} from "@phosphor-icons/react"
import { useTenant, useUpdateTenant } from "@/hooks/use-tenant"
import { useMe } from "@/hooks/use-me"

interface MemoryKey {
  key: string
  description: string
}

const PREDEFINED_KEYS = [
  "name", "preferred_time", "main_complaint", "insurance", "cancelled_once",
  "price_sensitive", "preferred_professional", "preferred_weekday",
  "preferred_time_of_day", "wants_slot_on_cancellation", "flexible_schedule",
  "preferred_service", "has_children", "chronic_condition", "location",
  "contact_preference", "urgency", "referral_source",
]

const labelCls = "block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5"
const inputCls = "h-9 w-full rounded-lg bg-muted/30 px-3 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all duration-200 border border-border/40"

export function CaptacaoTab() {
  const { data: tenant, isLoading, error } = useTenant()
  const { data: me } = useMe()
  const update = useUpdateTenant()

  const canEdit = me?.role === "ADMIN" || me?.role === "SECRETARY"

  const [keys, setKeys] = useState<MemoryKey[]>([])
  const [newKey, setNewKey] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [addError, setAddError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!tenant) return
    setKeys(Array.isArray(tenant.customMemoryKeys) ? tenant.customMemoryKeys : [])
  }, [tenant])

  function handleAdd() {
    const k = newKey.trim().toLowerCase().replace(/\s+/g, "_")
    const d = newDesc.trim()
    if (!k) { setAddError("Informe um identificador"); return }
    if (!d) { setAddError("Informe uma descrição"); return }
    if (PREDEFINED_KEYS.includes(k)) { setAddError("Essa chave já existe por padrão"); return }
    if (keys.some((m) => m.key === k)) { setAddError("Chave já adicionada"); return }
    if (!/^[a-z0-9_]+$/.test(k)) { setAddError("Use apenas letras minúsculas, números e _"); return }
    setAddError(null)
    setKeys((prev) => [...prev, { key: k, description: d }])
    setNewKey("")
    setNewDesc("")
  }

  function handleRemove(key: string) {
    setKeys((prev) => prev.filter((m) => m.key !== key))
  }

  async function handleSave() {
    setSaveError(null)
    try {
      await update.mutateAsync({ customMemoryKeys: keys.length > 0 ? keys : null })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Erro ao salvar")
    }
  }

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full">
        <div className="rounded-xl border border-border/50 bg-card/30 p-5">
          <div className="h-3 w-36 rounded bg-muted/30 animate-pulse mb-4" />
          <div className="space-y-3">
            <div className="h-20 rounded-lg bg-muted/20 animate-pulse" />
            <div className="h-20 rounded-lg bg-muted/20 animate-pulse" />
          </div>
        </div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <Warning className="h-8 w-8 text-rose-400/40" weight="duotone" />
        <p className="text-[13px] text-muted-foreground/85">Erro ao carregar configurações</p>
      </motion.div>
    )
  }

  if (!canEdit) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full">
        <div className="rounded-xl border border-border/50 bg-card/30 p-5">
          <p className="text-[13px] text-muted-foreground">
            Apenas administradores e secretárias podem editar as configurações de captação.
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 w-full"
    >
      {/* Info card */}
      <div className="rounded-xl border border-border/50 bg-card/30 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent/10">
            <Brain className="h-4 w-4 text-accent" weight="duotone" />
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-foreground">Informações captadas pela IA</h3>
            <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed">
              A IA coleta automaticamente informações como nome, plano de saúde, horário preferido e motivo da consulta
              a partir das conversas. Aqui você pode adicionar campos extras específicos para a sua clínica.
            </p>
          </div>
        </div>
      </div>

      {/* Default keys reference */}
      <div className="rounded-xl border border-border/50 bg-card/30 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-muted-foreground" weight="duotone" />
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Campos padrão (já ativos)
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PREDEFINED_KEYS.map((k) => (
            <span key={k}
              className="inline-flex items-center rounded-md border border-border/40 bg-muted/20 px-2 py-0.5 text-[10px] font-mono text-muted-foreground/80">
              {k}
            </span>
          ))}
        </div>
      </div>

      {/* Custom keys */}
      <div className="rounded-xl border border-border/50 bg-card/30 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-muted-foreground" weight="duotone" />
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Campos personalizados
          </span>
        </div>

        {/* Existing custom keys */}
        <AnimatePresence initial={false}>
          {keys.length === 0 ? (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-[12px] text-muted-foreground/60 py-2">
              Nenhum campo personalizado adicionado ainda.
            </motion.p>
          ) : (
            <div className="space-y-2">
              {keys.map((m) => (
                <motion.div
                  key={m.key}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/15 px-3 py-2.5"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-mono text-accent/80 leading-none mb-0.5">{m.key}</p>
                    <p className="text-[12px] text-foreground/80 truncate">{m.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(m.key)}
                    className="cursor-pointer flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 hover:text-rose-400 hover:bg-rose-400/10 transition-colors"
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Add form */}
        <div className="rounded-lg border border-dashed border-border/50 bg-muted/10 p-4 space-y-3">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Adicionar campo
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Identificador</label>
              <input
                value={newKey}
                onChange={(e) => { setNewKey(e.target.value); setAddError(null) }}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="ex: tipo_pele"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Descrição para a IA</label>
              <input
                value={newDesc}
                onChange={(e) => { setNewDesc(e.target.value); setAddError(null) }}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="ex: tipo de pele do paciente"
                className={inputCls}
              />
            </div>
          </div>
          {addError && (
            <p className="text-[11px] text-rose-400 flex items-center gap-1">
              <Warning className="h-3 w-3" /> {addError}
            </p>
          )}
          <button
            type="button"
            onClick={handleAdd}
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-accent/25 bg-accent/10 px-3 py-2 text-[12px] font-semibold text-accent hover:bg-accent/15 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar campo
          </button>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center justify-between pt-1">
        <div>
          {saveError && (
            <p className="text-[12px] text-rose-400 flex items-center gap-1.5">
              <Warning className="h-3.5 w-3.5" /> {saveError}
            </p>
          )}
          {saved && (
            <p className="text-[12px] text-emerald-400 flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5" weight="bold" /> Alterações salvas
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={update.isPending}
          className="cursor-pointer flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-[13px] font-bold text-accent-foreground hover:bg-accent/90 disabled:opacity-60 transition-colors"
        >
          {update.isPending ? (
            <><ArrowsClockwise className="h-4 w-4 animate-spin" /> Salvando...</>
          ) : (
            <><Check className="h-4 w-4" weight="bold" /> Salvar alterações</>
          )}
        </button>
      </div>
    </motion.div>
  )
}
