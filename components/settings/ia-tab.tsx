"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Robot, Check, ArrowsClockwise, Warning, Bell } from "@phosphor-icons/react"
import { useTenant, useUpdateTenant } from "@/hooks/use-tenant"
import { useMe } from "@/hooks/use-me"
import { InstructionTextarea } from "@/components/app/instruction-textarea"

const labelCls = "block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5"

export function IATab() {
  const { data: tenant, isLoading, error } = useTenant()
  const { data: me } = useMe()
  const update = useUpdateTenant()

  const canEdit = me?.role === "ADMIN" || me?.role === "SECRETARY"

  const [form, setForm] = useState({
    agentBasePrompt: "",
    guardrailRules: "",
  })
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!tenant) return
    setForm({
      agentBasePrompt: tenant.agentBasePrompt ?? "",
      guardrailRules: tenant.guardrailRules ?? "",
    })
  }, [tenant])

  const set = (k: keyof typeof form) => (val: string) =>
    setForm((prev) => ({ ...prev, [k]: val }))

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaveError(null)
    try {
      await update.mutateAsync({
        agentBasePrompt: form.agentBasePrompt.trim() || null,
        guardrailRules: form.guardrailRules.trim() || null,
      })
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
          <div className="h-3 w-28 rounded bg-muted/30 animate-pulse mb-4" />
          <div className="space-y-3">
            <div className="h-24 rounded-lg bg-muted/20 animate-pulse" />
            <div className="h-24 rounded-lg bg-muted/20 animate-pulse" />
          </div>
        </div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center gap-3 py-20 text-center"
      >
        <Warning className="h-8 w-8 text-rose-400/40" weight="duotone" />
        <p className="text-[13px] text-muted-foreground/85">Erro ao carregar configurações de IA</p>
      </motion.div>
    )
  }

  if (!canEdit) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full">
        <div className="rounded-xl border border-border/50 bg-card/30 p-5">
          <p className="text-[13px] text-muted-foreground">
            Apenas administradores e secretárias podem editar as configurações de IA.
          </p>
        </div>
      </motion.div>
    )
  }

  async function handleSlotRecallToggle() {
    if (!tenant) return
    const next = !tenant.isSlotRecallEnabled
    try {
      await update.mutateAsync({ isSlotRecallEnabled: next })
    } catch {
      // Error handled by mutation
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 w-full"
    >
      {/* Recall de vagas */}
      <div className="rounded-xl border border-border/50 bg-card/30 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent/10">
              <Bell className="h-4 w-4 text-accent" weight="duotone" />
            </div>
            <div>
              <h3 className="text-[13px] font-semibold text-foreground">
                Avisar lista de espera ao cancelar
              </h3>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                Quando alguém cancelar um agendamento, contatos que pediram para ser avisados serão notificados por WhatsApp
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={tenant?.isSlotRecallEnabled ?? false}
            onClick={handleSlotRecallToggle}
            disabled={update.isPending}
            className={`cursor-pointer relative h-7 w-12 shrink-0 rounded-full border-2 transition-colors duration-200 disabled:opacity-50 ${
              tenant?.isSlotRecallEnabled
                ? "border-accent bg-accent/20"
                : "border-border bg-muted/30"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full transition-all duration-200 ${
                tenant?.isSlotRecallEnabled
                  ? "left-6 bg-accent"
                  : "left-0.5 bg-muted-foreground/50"
              }`}
            />
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-xl border border-border/50 bg-card/30 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Robot className="h-4 w-4 text-muted-foreground" weight="duotone" />
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Prompt base do agente
            </span>
          </div>
          <p className="text-[12px] text-muted-foreground">
            Instruções gerais aplicadas a todos os estágios do funil. Use para definir o tom e regras globais da recepção.
          </p>
          <div>
            <label className={labelCls}>Prompt base</label>
            <InstructionTextarea
              value={form.agentBasePrompt}
              onChange={set("agentBasePrompt")}
              placeholder="Ex: Você representa a clínica X. Seja cordial e profissional... Use @ para mencionar etapas, profissionais, serviços ou ferramentas."
              rows={4}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/30 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Warning className="h-4 w-4 text-muted-foreground" weight="duotone" />
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Regras de guardrail
            </span>
          </div>
          <p className="text-[12px] text-muted-foreground">
            O que o agente não deve fazer. Ex: não dar diagnósticos médicos, não divulgar preços sem confirmar...
          </p>
          <div>
            <label className={labelCls}>Regras</label>
            <InstructionTextarea
              value={form.guardrailRules}
              onChange={set("guardrailRules")}
              placeholder="Ex: Não dê diagnósticos. Não confirme consultas sem verificar disponibilidade... Use @ para mencionar etapas ou ferramentas."
              rows={4}
            />
          </div>
        </div>

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
            type="submit"
            disabled={update.isPending}
            className="cursor-pointer flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-[13px] font-bold text-accent-foreground hover:bg-accent/90 disabled:opacity-60 transition-colors"
          >
            {update.isPending ? (
              <>
                <ArrowsClockwise className="h-4 w-4 animate-spin" /> Salvando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" weight="bold" /> Salvar alterações
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  )
}
