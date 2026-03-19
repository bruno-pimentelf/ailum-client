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
  Lock,
} from "@phosphor-icons/react"
import { useTenant, useUpdateTenant } from "@/hooks/use-tenant"
import { useMe } from "@/hooks/use-me"

interface MemoryKey {
  key: string
  description: string
}

// Chaves padrão com label em português e descrição para a IA
const PREDEFINED: Array<{ key: string; label: string; description: string }> = [
  { key: "name",                      label: "Nome",                    description: "nome pelo qual o paciente se identificou" },
  { key: "main_complaint",            label: "Queixa principal",        description: "queixa principal ou motivo de busca" },
  { key: "insurance",                 label: "Plano de saúde",          description: "plano de saúde ou convênio" },
  { key: "preferred_professional",    label: "Profissional preferido",  description: "nome do profissional preferido" },
  { key: "preferred_service",         label: "Serviço preferido",       description: "serviço preferido quando há vários" },
  { key: "preferred_weekday",         label: "Dia preferido",           description: "dia da semana preferido" },
  { key: "preferred_time_of_day",     label: "Turno preferido",         description: "turno preferido (manhã, tarde, qualquer)" },
  { key: "preferred_time",            label: "Horário preferido",       description: "horário preferido de consulta" },
  { key: "flexible_schedule",         label: "Aceita outros horários",  description: "se aceita horários alternativos" },
  { key: "wants_slot_on_cancellation",label: "Lista de espera",         description: "pediu para ser avisado quando abrir vaga" },
  { key: "urgency",                   label: "Urgência",                description: "se demonstrou urgência no atendimento" },
  { key: "price_sensitive",           label: "Sensível a preço",        description: "se demonstrou sensibilidade a preço" },
  { key: "cancelled_once",            label: "Cancelou antes",          description: "se já cancelou consulta" },
  { key: "chronic_condition",         label: "Condição crônica",        description: "condição crônica mencionada pelo paciente" },
  { key: "has_children",              label: "Tem filhos",              description: "se tem filhos" },
  { key: "location",                  label: "Bairro / Cidade",         description: "bairro ou cidade" },
  { key: "contact_preference",        label: "Preferência de contato",  description: "como prefere ser contatado" },
  { key: "referral_source",           label: "Como soube",              description: "como soube da clínica" },
]

const PREDEFINED_KEYS = new Set(PREDEFINED.map((p) => p.key))

const labelCls = "block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5"
const inputCls = "h-9 w-full rounded-lg bg-muted/30 px-3 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all duration-200 border border-border/40"

export function CaptacaoTab() {
  const { data: tenant, isLoading, error } = useTenant()
  const { data: me } = useMe()
  const update = useUpdateTenant()

  const canEdit = me?.role === "ADMIN" || me?.role === "SECRETARY"

  const [customKeys, setCustomKeys] = useState<MemoryKey[]>([])
  const [newKey, setNewKey] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [newLabel, setNewLabel] = useState("")
  const [addError, setAddError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!tenant) return
    const stored = Array.isArray(tenant.customMemoryKeys) ? tenant.customMemoryKeys : []
    // Filter out any that are now predefined (cleanup)
    setCustomKeys(stored.filter((k: MemoryKey) => !PREDEFINED_KEYS.has(k.key)))
  }, [tenant])

  function handleAdd() {
    const k = newKey.trim().toLowerCase().replace(/\s+/g, "_")
    const d = newDesc.trim()
    const l = newLabel.trim()
    if (!k) { setAddError("Informe um identificador"); return }
    if (!d) { setAddError("Informe uma descrição para a IA"); return }
    if (!l) { setAddError("Informe um nome de exibição"); return }
    if (PREDEFINED_KEYS.has(k)) { setAddError("Essa chave já existe por padrão"); return }
    if (customKeys.some((m) => m.key === k)) { setAddError("Chave já adicionada"); return }
    if (!/^[a-z0-9_]+$/.test(k)) { setAddError("Use apenas letras minúsculas, números e _"); return }
    setAddError(null)
    // Store both key, description (for AI), and label (for display) in description field as "label::description"
    setCustomKeys((prev) => [...prev, { key: k, description: `${l}::${d}` }])
    setNewKey("")
    setNewDesc("")
    setNewLabel("")
  }

  function handleRemove(key: string) {
    setCustomKeys((prev) => prev.filter((m) => m.key !== key))
  }

  async function handleSave() {
    setSaveError(null)
    try {
      await update.mutateAsync({ customMemoryKeys: customKeys.length > 0 ? customKeys : null })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Erro ao salvar")
    }
  }

  function parseCustomKey(k: MemoryKey): { label: string; description: string } {
    const sep = k.description.indexOf("::")
    if (sep === -1) return { label: k.key, description: k.description }
    return { label: k.description.slice(0, sep), description: k.description.slice(sep + 2) }
  }

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full">
        <div className="rounded-xl border border-border/50 bg-card/30 p-5">
          <div className="h-3 w-36 rounded bg-muted/30 animate-pulse mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-muted/20 animate-pulse" />
            ))}
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
      {/* Header */}
      <div className="rounded-xl border border-border/50 bg-card/30 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent/10">
            <Brain className="h-4 w-4 text-accent" weight="duotone" />
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-foreground">Informações captadas pela IA</h3>
            <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed">
              A IA coleta essas informações naturalmente durante as conversas, sem perguntar diretamente.
              Os campos padrão já estão ativos. Adicione campos extras específicos para a sua clínica.
            </p>
          </div>
        </div>
      </div>

      {/* All keys list */}
      <div className="rounded-xl border border-border/50 bg-card/30 p-5 space-y-2">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
          Campos ativos
        </p>

        {/* Predefined — locked */}
        {PREDEFINED.map((p) => (
          <div
            key={p.key}
            className="flex items-center gap-3 rounded-lg border border-border/30 bg-muted/10 px-3 py-2.5"
          >
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <span className="text-[12px] font-medium text-foreground/90 shrink-0">{p.label}</span>
              <span className="text-[10px] font-mono text-muted-foreground/50 truncate hidden sm:block">
                {p.key}
              </span>
            </div>
            <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/30">
              <Lock className="h-3 w-3" weight="fill" />
            </span>
          </div>
        ))}

        {/* Custom — removable */}
        <AnimatePresence initial={false}>
          {customKeys.map((m) => {
            const { label, description } = parseCustomKey(m)
            return (
              <motion.div
                key={m.key}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-3 rounded-lg border border-accent/20 bg-accent/[0.04] px-3 py-2.5"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-medium text-foreground/90 shrink-0">{label}</span>
                    <span className="text-[10px] font-mono text-muted-foreground/50 truncate hidden sm:block">
                      {m.key}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground/60 truncate mt-0.5">{description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(m.key)}
                  className="cursor-pointer flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/40 hover:text-rose-400 hover:bg-rose-400/10 transition-colors"
                >
                  <Trash className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Add custom key */}
      <div className="rounded-xl border border-border/50 bg-card/30 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-muted-foreground" weight="duotone" />
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Adicionar campo personalizado
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Nome de exibição</label>
            <input
              value={newLabel}
              onChange={(e) => { setNewLabel(e.target.value); setAddError(null) }}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="ex: Tipo de pele"
              className={inputCls}
            />
          </div>
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
          <Plus className="h-3.5 w-3.5" /> Adicionar
        </button>
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
            <><Check className="h-4 w-4" weight="bold" /> Salvar campos extras</>
          )}
        </button>
      </div>
    </motion.div>
  )
}
