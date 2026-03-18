"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { X, Lightning, Check, Spinner, Warning, ShieldWarning } from "@phosphor-icons/react"
import { Textarea } from "@/components/ui/textarea"
import { useTemplates } from "@/hooks/use-templates"
import type {
  Trigger,
  TriggerInput,
  TriggerEvent,
  TriggerAction,
} from "@/lib/api/funnels"
import type { BoardStage } from "@/lib/api/funnels"

// Mínimos de segurança anti-ban (espelham os valores do backend)
const MIN_COOLDOWN_SECONDS = 3600      // 1h
const MIN_STALE_DELAY_MINUTES = 30     // 30min
const MIN_WAIT_REPEAT_MINUTES = 60     // 1h

const ease = [0.33, 1, 0.68, 1] as const

const inputCls =
  "w-full rounded-xl border border-border/60 bg-background/40 px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40"
const labelCls = "block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5"

const EVENTS: { value: TriggerEvent; label: string }[] = [
  { value: "STAGE_ENTERED", label: "Ao entrar na etapa" },
  { value: "STALE_IN_STAGE", label: "Contato parado na etapa" },
  { value: "PAYMENT_CONFIRMED", label: "Pagamento confirmado" },
  { value: "APPOINTMENT_APPROACHING", label: "Consulta próxima" },
  { value: "AI_INTENT", label: "Intenção detectada pela IA" },
  { value: "MESSAGE_RECEIVED", label: "Mensagem recebida" },
]

const ACTIONS: { value: TriggerAction; label: string }[] = [
  { value: "SEND_MESSAGE", label: "Enviar mensagem" },
  { value: "MOVE_STAGE", label: "Mover para etapa" },
  { value: "GENERATE_PIX", label: "Gerar cobrança PIX" },
  { value: "NOTIFY_OPERATOR", label: "Notificar operador" },
  { value: "WAIT_AND_REPEAT", label: "Aguardar e repetir" },
]

interface TriggerEditorModalProps {
  open: boolean
  onClose: () => void
  trigger: Trigger | null
  stageId: string
  stages: BoardStage[]
  onSave: (body: TriggerInput) => Promise<void>
}

function getMessageFromConfig(config: Record<string, unknown>): string {
  const msg = config?.message
  return typeof msg === "string" ? msg : ""
}

function getUseAIFromConfig(config: Record<string, unknown>): boolean {
  return config?.useAI === true
}

function getTemplateIdFromConfig(config: Record<string, unknown>): string {
  const id = config?.templateId
  return typeof id === "string" ? id : ""
}

export function TriggerEditorModal({
  open,
  onClose,
  trigger,
  stageId,
  stages,
  onSave,
}: TriggerEditorModalProps) {
  const isEdit = !!trigger
  const { data: templates = [] } = useTemplates()
  const [event, setEvent] = useState<TriggerEvent>("STAGE_ENTERED")
  const [action, setAction] = useState<TriggerAction>("SEND_MESSAGE")
  const [messageMode, setMessageMode] = useState<"custom" | "template">("custom")
  const [message, setMessage] = useState("")
  const [templateId, setTemplateId] = useState("")
  const [useAI, setUseAI] = useState(false)
  const [moveStageId, setMoveStageId] = useState("")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [delayMinutes, setDelayMinutes] = useState(0)
  const [cooldownSeconds, setCooldownSeconds] = useState(MIN_COOLDOWN_SECONDS)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (trigger) {
      setEvent(trigger.event)
      setAction(trigger.action)
      setDelayMinutes(trigger.delayMinutes ?? 0)
      setCooldownSeconds(trigger.cooldownSeconds ?? 86400)
      const ac = trigger.actionConfig as Record<string, unknown>
      const tid = getTemplateIdFromConfig(ac)
      if (tid) {
        setMessageMode("template")
        setTemplateId(tid)
        setMessage(getMessageFromConfig(ac))
      } else {
        setMessageMode("custom")
        setTemplateId("")
        setMessage(getMessageFromConfig(ac))
      }
      setUseAI(getUseAIFromConfig(ac))
      setMoveStageId((ac?.stageId as string) ?? "")
      setAmount(String((ac?.amount as number) ?? ""))
      setDescription((ac?.description as string) ?? "")
    } else if (open) {
      setEvent("STAGE_ENTERED")
      setAction("SEND_MESSAGE")
      setMessageMode("custom")
      setMessage("")
      setTemplateId("")
      setUseAI(false)
      setMoveStageId("")
      setAmount("")
      setDescription("")
      setDelayMinutes(0)
      setCooldownSeconds(MIN_COOLDOWN_SECONDS)
    }
    setError(null)
  }, [trigger, open])

  function buildActionConfig(): Record<string, unknown> {
    if (action === "SEND_MESSAGE") {
      if (messageMode === "template" && templateId) {
        return { templateId }
      }
      return { useAI, message }
    }
    if (action === "MOVE_STAGE") {
      return { stageId: moveStageId || undefined }
    }
    if (action === "GENERATE_PIX") {
      return {
        amount: amount ? Number(amount) : undefined,
        description: description || undefined,
      }
    }
    return {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (action === "SEND_MESSAGE" && messageMode === "template" && !templateId) {
      setError("Selecione um template")
      return
    }
    if (cooldownSeconds < MIN_COOLDOWN_SECONDS) {
      setError(`Cooldown mínimo é ${MIN_COOLDOWN_SECONDS} segundos (1 hora) para evitar spam.`)
      return
    }
    if (action === "WAIT_AND_REPEAT" && delayMinutes < MIN_WAIT_REPEAT_MINUTES) {
      setError(`Atraso mínimo para "Aguardar e repetir" é ${MIN_WAIT_REPEAT_MINUTES} minutos (1 hora).`)
      return
    }
    if (event === "STALE_IN_STAGE" && delayMinutes < MIN_STALE_DELAY_MINUTES) {
      setError(`Atraso mínimo para "Contato parado na etapa" é ${MIN_STALE_DELAY_MINUTES} minutos.`)
      return
    }
    setError(null)
    setSaving(true)
    try {
      await onSave({
        event,
        action,
        actionConfig: buildActionConfig(),
        delayMinutes,
        cooldownSeconds,
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
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease }}
            className="fixed inset-x-4 top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-full max-w-lg max-h-[94vh] rounded-2xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-3 shrink-0">
              <div className="flex items-center gap-2">
                <Lightning className="h-5 w-5 text-accent" weight="duotone" />
                <h3 className="text-[14px] font-semibold">
                  {isEdit ? "Editar trigger" : "Novo trigger"}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/85 hover:text-foreground hover:bg-muted/40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Evento</label>
                  <select
                    value={event}
                    onChange={(e) => setEvent(e.target.value as TriggerEvent)}
                    className={inputCls}
                  >
                    {EVENTS.map((ev) => (
                      <option key={ev.value} value={ev.value}>
                        {ev.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Ação</label>
                  <select
                    value={action}
                    onChange={(e) => setAction(e.target.value as TriggerAction)}
                    className={inputCls}
                  >
                    {ACTIONS.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {action === "SEND_MESSAGE" && (
                <div className="space-y-3">
                  <label className={labelCls}>Modo de mensagem</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="messageMode"
                        checked={messageMode === "custom"}
                        onChange={() => setMessageMode("custom")}
                        className="rounded-full border-border/60 text-accent focus:ring-accent/30"
                      />
                      <span className="text-[12px]">Texto personalizado</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="messageMode"
                        checked={messageMode === "template"}
                        onChange={() => setMessageMode("template")}
                        className="rounded-full border-border/60 text-accent focus:ring-accent/30"
                      />
                      <span className="text-[12px]">Usar template</span>
                    </label>
                  </div>
                  {messageMode === "custom" ? (
                    <>
                      <label className={labelCls}>Mensagem</label>
                      <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Olá, tudo bem? Que bom falar com você. Como posso ajudar hoje?"
                        rows={4}
                        className={`${inputCls} resize-y min-h-[100px] max-h-[200px]`}
                      />
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useAI}
                          onChange={(e) => setUseAI(e.target.checked)}
                          className="rounded border-border/60 text-accent focus:ring-accent/30"
                        />
                        <span className="text-[12px] text-muted-foreground">
                          Usar IA para personalizar (variáveis: {`{{name}}`}, {`{{appointmentTime}}`})
                        </span>
                      </label>
                    </>
                  ) : (
                    <>
                      <label className={labelCls}>Template</label>
                      <select
                        value={templateId}
                        onChange={(e) => setTemplateId(e.target.value)}
                        className={inputCls}
                      >
                        <option value="">Selecione um template</option>
                        {templates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.type}) — {t.key}
                          </option>
                        ))}
                      </select>
                      {templates.length === 0 && (
                        <p className="text-[11px] text-muted-foreground">
                          Nenhum template.{" "}
                          <Link href="/settings?tab=templates" target="_blank" className="text-accent hover:underline">
                            Criar template
                          </Link>
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              {action === "MOVE_STAGE" && (
                <div>
                  <label className={labelCls}>Mover para etapa</label>
                  <select
                    value={moveStageId}
                    onChange={(e) => setMoveStageId(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Selecione</option>
                    {stages
                      .filter((s) => s.id !== stageId)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {action === "GENERATE_PIX" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Valor (R$)</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="150"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Descrição</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Consulta"
                      className={inputCls}
                    />
                  </div>
                </div>
              )}

              {/* Aviso anti-ban para eventos/ações de risco */}
              {(event === "STALE_IN_STAGE" || action === "WAIT_AND_REPEAT") && (
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/8 px-3 py-2.5">
                  <ShieldWarning className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" weight="fill" />
                  <div className="space-y-0.5">
                    <p className="text-[12px] font-semibold text-amber-400">Risco de ban no WhatsApp</p>
                    <p className="text-[11px] text-amber-400/80 leading-relaxed">
                      {action === "WAIT_AND_REPEAT"
                        ? "Repetições muito frequentes são detectadas como spam pela Meta. Use no mínimo 1h de intervalo e 1h de cooldown."
                        : "Mensagens automáticas para contatos parados podem ser marcadas como spam. Use no mínimo 30min de atraso e 1h de cooldown."}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>
                    Atraso (min)
                    {event === "STALE_IN_STAGE" && (
                      <span className="ml-1 text-[10px] text-amber-400 font-normal normal-case tracking-normal">mín. 30</span>
                    )}
                    {action === "WAIT_AND_REPEAT" && (
                      <span className="ml-1 text-[10px] text-amber-400 font-normal normal-case tracking-normal">mín. 60</span>
                    )}
                  </label>
                  <input
                    type="number"
                    min={
                      action === "WAIT_AND_REPEAT"
                        ? MIN_WAIT_REPEAT_MINUTES
                        : event === "STALE_IN_STAGE"
                          ? MIN_STALE_DELAY_MINUTES
                          : 0
                    }
                    value={delayMinutes}
                    onChange={(e) => setDelayMinutes(Number(e.target.value) || 0)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    Cooldown (seg)
                    <span className="ml-1 text-[10px] text-amber-400 font-normal normal-case tracking-normal">mín. 3600</span>
                  </label>
                  <input
                    type="number"
                    min={MIN_COOLDOWN_SECONDS}
                    value={cooldownSeconds}
                    onChange={(e) => setCooldownSeconds(Number(e.target.value) || MIN_COOLDOWN_SECONDS)}
                    className={inputCls}
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground/90">
                    Tempo mínimo entre disparos para o mesmo contato (1h = 3600)
                  </p>
                </div>
              </div>
              </div>

              <div className="shrink-0 border-t border-border/50 px-5 py-3 space-y-3">
              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2">
                  <Warning className="h-4 w-4 text-rose-400 shrink-0" />
                  <p className="text-[12px] text-rose-400">{error}</p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-[13px] font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-60"
                >
                  {saving ? (
                    <Spinner className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" weight="bold" />
                  )}
                  {isEdit ? "Salvar" : "Criar"}
                </button>
              </div>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
