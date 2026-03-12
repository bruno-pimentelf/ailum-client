"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  TextAa,
  Plus,
  Pencil,
  Trash,
  Check,
  X,
  Spinner,
  Warning,
  Image,
  FileText,
} from "@phosphor-icons/react"
import { useTemplates, useTemplateMutations } from "@/hooks/use-templates"
import type { MessageTemplate, TemplateInput, TemplateType } from "@/lib/api/templates"

const ease = [0.33, 1, 0.68, 1] as const

const inputCls =
  "w-full rounded-xl border border-border/60 bg-background/40 px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40"
const labelCls = "block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5"

const TYPES: { value: TemplateType; label: string }[] = [
  { value: "TEXT", label: "Texto" },
  { value: "IMAGE", label: "Imagem" },
  { value: "AUDIO", label: "Áudio" },
  { value: "VIDEO", label: "Vídeo" },
  { value: "DOCUMENT", label: "Documento" },
]

const VARIABLES = [
  "name",
  "appointmentTime",
  "appointmentDate",
  "appointmentTimeOnly",
  "professionalName",
  "serviceName",
]

const KEY_REGEX = /^[a-z0-9_-]+$/

const RESERVED_KEYS = ["reminder_24h", "reminder_1h"] as const

function isReservedKey(key: string): key is (typeof RESERVED_KEYS)[number] {
  return RESERVED_KEYS.includes(key as (typeof RESERVED_KEYS)[number])
}

function getReservedBadge(key: string) {
  if (key === "reminder_24h") return "Lembrete 24h"
  if (key === "reminder_1h") return "Lembrete 1h"
  return null
}

function previewBody(body: string) {
  return body
    .replace(/\{\{name\}\}/g, "Maria")
    .replace(/\{\{appointmentTime\}\}/g, "15/03/2026 10:00")
    .replace(/\{\{appointmentDate\}\}/g, "15/03/2026")
    .replace(/\{\{appointmentTimeOnly\}\}/g, "10:00")
    .replace(/\{\{professionalName\}\}/g, "Dr. João")
    .replace(/\{\{serviceName\}\}/g, "Consulta de rotina")
}

// ─── Form Modal ────────────────────────────────────────────────────────────────

function TemplateFormModal({
  onClose,
  template,
}: {
  onClose: () => void
  template: MessageTemplate | null
}) {
  const isEdit = !!template
  const { create, update } = useTemplateMutations()

  const [type, setType] = useState<TemplateType>("TEXT")
  const [key, setKey] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [body, setBody] = useState("")
  const [mediaUrl, setMediaUrl] = useState("")
  const [caption, setCaption] = useState("")
  const [fileName, setFileName] = useState("")
  const [showPreview, setShowPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (template) {
      setType(template.type)
      setKey(template.key)
      setName(template.name)
      setDescription(template.description ?? "")
      setBody(template.body)
      setMediaUrl(template.mediaUrl ?? "")
      setCaption(template.caption ?? "")
      setFileName(template.fileName ?? "")
    } else {
      setType("TEXT")
      setKey("")
      setName("")
      setDescription("")
      setBody("")
      setMediaUrl("")
      setCaption("")
      setFileName("")
    }
    setError(null)
  }, [template])

  const mediaTypes: TemplateType[] = ["IMAGE", "AUDIO", "VIDEO", "DOCUMENT"]
  const needsMedia = mediaTypes.includes(type)

  function validate(): string | null {
    if (!name.trim()) return "Nome é obrigatório"
    if (!key.trim()) return "Chave é obrigatória"
    if (!KEY_REGEX.test(key)) return "Chave deve conter apenas a-z, 0-9, _ e -"
    if (type === "TEXT" && !body.trim()) return "Corpo da mensagem é obrigatório"
    if (needsMedia && !mediaUrl.trim()) return "URL da mídia é obrigatória"
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validate()
    if (err) {
      setError(err)
      return
    }
    setSaving(true)
    setError(null)
    try {
      const input: TemplateInput = {
        key: key.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        body: body.trim() || "",
        mediaUrl: needsMedia ? mediaUrl.trim() || undefined : undefined,
        caption: caption.trim() || undefined,
        fileName: type === "DOCUMENT" ? fileName.trim() || undefined : undefined,
      }
      if (isEdit) {
        await update.mutateAsync({ id: template.id, body: { ...input, key: undefined } })
      } else {
        await create.mutateAsync(input)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        className="fixed inset-x-4 top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-full max-w-lg max-h-[94vh] rounded-2xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-3 shrink-0">
          <h3 className="text-[14px] font-semibold">{isEdit ? "Editar template" : "Novo template"}</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/40">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-4">
            <div>
              <label className={labelCls}>Tipo</label>
              <select value={type} onChange={(e) => setType(e.target.value as TemplateType)} className={inputCls}>
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Chave (identificador único)</label>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                placeholder="ex: reminder_24h, welcome"
                className={inputCls}
                disabled={isEdit}
              />
              {isReservedKey(key) && (
                <p className="mt-1.5 text-[11px] text-accent">Usado automaticamente em lembretes</p>
              )}
            </div>
            <div>
              <label className={labelCls}>Nome</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Lembrete 24h" className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Descrição (opcional)</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputCls} placeholder="Descrição interna" />
            </div>

            {type === "TEXT" ? (
              <div>
                <label className={labelCls}>Mensagem</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={5}
                  className={`${inputCls} resize-y`}
                  placeholder="Olá {{name}}! Sua consulta é em {{appointmentTime}}. Use {{name}}, {{appointmentTime}}, {{professionalName}}, etc."
                />
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Variáveis: {VARIABLES.map((v) => `{{${v}}}`).join(", ")}
                </p>
                <button type="button" onClick={() => setShowPreview(!showPreview)} className="mt-2 text-[11px] text-accent hover:underline">
                  {showPreview ? "Ocultar preview" : "Ver preview"}
                </button>
                {showPreview && (
                  <div className="mt-2 rounded-lg border border-border/50 bg-muted/30 p-3 text-[13px] text-foreground whitespace-pre-wrap">
                    {previewBody(body) || "(vazio)"}
                  </div>
                )}
              </div>
            ) : (
              <>
                <div>
                  <label className={labelCls}>URL da mídia</label>
                  <input type="url" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://..." className={inputCls} required={needsMedia} />
                </div>
                {type !== "AUDIO" && (
                  <div>
                    <label className={labelCls}>Legenda / descrição</label>
                    <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} className={inputCls} placeholder="Pode usar {{name}}, {{appointmentTime}}, etc." />
                  </div>
                )}
                {type === "DOCUMENT" && (
                  <div>
                    <label className={labelCls}>Nome do arquivo (opcional)</label>
                    <input type="text" value={fileName} onChange={(e) => setFileName(e.target.value)} className={inputCls} />
                  </div>
                )}
              </>
            )}
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2">
                <Warning className="h-4 w-4 text-rose-400 shrink-0" />
                <p className="text-[12px] text-rose-400">{error}</p>
              </div>
            )}
          </div>
          <div className="shrink-0 border-t border-border/50 px-5 py-3 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-[13px] font-medium text-muted-foreground hover:text-foreground">Cancelar</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-[13px] font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-60">
              {saving ? <Spinner className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" weight="bold" />}
              {isEdit ? "Salvar" : "Criar"}
            </button>
          </div>
        </form>
      </motion.div>
    </>
  )
}

// ─── Tab content ────────────────────────────────────────────────────────────────

export function TemplatesTab() {
  const { data: templates = [], isLoading } = useTemplates()
  const remove = useTemplateMutations().remove
  const [editing, setEditing] = useState<MessageTemplate | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  function handleCloseForm() {
    setFormOpen(false)
    setEditing(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Templates de mensagem</h2>
          <p className="text-[13px] text-muted-foreground mt-1">
            Mensagens reutilizáveis com variáveis. Use em lembretes (chaves reminder_24h, reminder_1h) e em triggers.
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setFormOpen(true) }}
          className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-[13px] font-semibold text-accent-foreground hover:bg-accent/90"
        >
          <Plus className="h-4 w-4" weight="bold" />
          Novo template
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner className="h-8 w-8 text-accent animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/50 bg-muted/5 py-12 text-center">
          <TextAa className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" weight="duotone" />
          <p className="text-[14px] font-medium text-foreground">Nenhum template</p>
          <p className="text-[12px] text-muted-foreground mt-1">Crie templates para lembretes e triggers.</p>
          <button
            onClick={() => setFormOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent/10 border border-accent/30 px-4 py-2 text-[12px] font-semibold text-accent hover:bg-accent/20"
          >
            <Plus className="h-4 w-4" /> Criar template
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence>
            {templates.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ delay: i * 0.03, ease }}
                className="group flex items-center gap-4 rounded-xl border border-border/50 bg-card/30 p-4"
              >
                <div className="h-10 w-10 shrink-0 rounded-lg bg-muted/50 flex items-center justify-center">
                  {t.type === "TEXT" ? (
                    <TextAa className="h-5 w-5 text-muted-foreground" weight="duotone" />
                  ) : t.type === "IMAGE" ? (
                    <Image className="h-5 w-5 text-muted-foreground" weight="duotone" />
                  ) : (
                    <FileText className="h-5 w-5 text-muted-foreground" weight="duotone" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[14px] font-semibold text-foreground">{t.name}</p>
                    <span className="text-[11px] font-mono text-muted-foreground">{t.key}</span>
                    {getReservedBadge(t.key) && (
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">
                        {getReservedBadge(t.key)}
                      </span>
                    )}
                  </div>
                  {t.description && <p className="text-[12px] text-muted-foreground mt-0.5">{t.description}</p>}
                  {t.type === "TEXT" && t.body && (
                    <p className="text-[11px] text-muted-foreground/80 mt-1 line-clamp-2">{t.body}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditing(t); setFormOpen(true) }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={async () => {
                      if (deleting === t.id) {
                        try {
                          await remove.mutateAsync(t.id)
                        } catch { /* ignore */ }
                        setDeleting(null)
                      } else {
                        setDeleting(t.id)
                        setTimeout(() => setDeleting(null), 3000)
                      }
                    }}
                    disabled={remove.isPending}
                    className={`flex h-8 items-center justify-center rounded-lg text-[11px] font-bold transition-all ${
                      deleting === t.id
                        ? "px-2 bg-rose-500/15 text-rose-400"
                        : "text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10"
                    }`}
                    title={deleting === t.id ? "Confirmar exclusão" : "Excluir"}
                  >
                    {deleting === t.id ? "Confirmar" : <Trash className="h-4 w-4" />}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {formOpen && (
          <TemplateFormModal onClose={handleCloseForm} template={editing} />
        )}
      </AnimatePresence>
    </div>
  )
}
