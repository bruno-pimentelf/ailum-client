"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check, Plus, Trash, Warning, ArrowUp, ArrowDown } from "@phosphor-icons/react"
import { useCreateFormTemplate, useUpdateFormTemplate } from "@/hooks/use-forms"
import type { FormTemplate, FormFieldDefinition } from "@/lib/api/forms"
import { v4 as uuid } from "uuid"

const ease = [0.33, 1, 0.68, 1] as const
const inputCls = "w-full h-10 rounded-xl border border-border/70 bg-foreground/[0.03] px-3.5 text-[12px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/30 transition-all"

function Spinner({ className = "h-3 w-3" }: { className?: string }) {
  return <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
    className={`rounded-full border-2 border-border border-t-white/70 ${className}`} />
}

const FIELD_TYPES: { value: FormFieldDefinition["type"]; label: string }[] = [
  { value: "TEXT", label: "Texto" },
  { value: "TEXTAREA", label: "Texto longo" },
  { value: "SELECT", label: "Seleção" },
  { value: "MULTI_SELECT", label: "Múltipla escolha" },
  { value: "CHECKBOX", label: "Checkbox" },
  { value: "RADIO", label: "Opção única" },
  { value: "DATE", label: "Data" },
  { value: "NUMBER", label: "Número" },
  { value: "PHONE", label: "Telefone" },
  { value: "EMAIL", label: "Email" },
  { value: "CPF", label: "CPF" },
  { value: "SCALE", label: "Escala 1-10" },
]

const needsOptions = (t: string) => ["SELECT", "MULTI_SELECT", "CHECKBOX", "RADIO"].includes(t)

function newField(order: number): FormFieldDefinition {
  return { id: uuid(), label: "", type: "TEXT", required: false, order, options: [] }
}

export function FormTemplateEditor({ template, onClose, onSaved }: {
  template?: FormTemplate | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!template
  const create = useCreateFormTemplate()
  const update = useUpdateFormTemplate()

  const [name, setName] = useState(template?.name ?? "")
  const [description, setDescription] = useState(template?.description ?? "")
  const [specialty, setSpecialty] = useState(template?.specialty ?? "")
  const [isDefault, setIsDefault] = useState(template?.isDefault ?? false)
  const [fields, setFields] = useState<FormFieldDefinition[]>(template?.fields ?? [newField(0)])
  const [optionInput, setOptionInput] = useState<Record<string, string>>({})

  const isPending = create.isPending || update.isPending
  const error = create.isError || update.isError

  function updateField(id: string, patch: Partial<FormFieldDefinition>) {
    setFields((f) => f.map((field) => field.id === id ? { ...field, ...patch } : field))
  }
  function removeField(id: string) { setFields((f) => f.filter((field) => field.id !== id)) }
  function moveField(id: string, dir: -1 | 1) {
    setFields((f) => {
      const idx = f.findIndex((field) => field.id === id)
      if (idx < 0) return f
      const newIdx = idx + dir
      if (newIdx < 0 || newIdx >= f.length) return f
      const copy = [...f]
      ;[copy[idx], copy[newIdx]] = [copy[newIdx]!, copy[idx]!]
      return copy.map((field, i) => ({ ...field, order: i }))
    })
  }
  function addOption(fieldId: string) {
    const val = optionInput[fieldId]?.trim()
    if (!val) return
    setFields((f) => f.map((field) => field.id === fieldId ? { ...field, options: [...(field.options ?? []), val] } : field))
    setOptionInput((p) => ({ ...p, [fieldId]: "" }))
  }
  function removeOption(fieldId: string, opt: string) {
    setFields((f) => f.map((field) => field.id === fieldId ? { ...field, options: (field.options ?? []).filter((o) => o !== opt) } : field))
  }

  function handleSave() {
    const orderedFields = fields.map((f, i) => ({ ...f, order: i }))
    if (isEdit && template) {
      update.mutate({ id: template.id, name, description, specialty, isDefault, fields: orderedFields }, { onSuccess: () => { onSaved(); onClose() } })
    } else {
      create.mutate({ name, description, specialty, isDefault, fields: orderedFields }, { onSuccess: () => { onSaved(); onClose() } })
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 backdrop-blur-sm px-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 8 }}
        transition={{ duration: 0.22, ease }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl max-h-[85vh] rounded-2xl border border-border/80 bg-overlay shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4 shrink-0">
          <h2 className="text-[14px] font-semibold text-foreground">{isEdit ? "Editar ficha" : "Nova ficha de anamnese"}</h2>
          <button onClick={onClose} className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/70 hover:text-foreground/85 hover:bg-foreground/[0.06] transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/[0.08] px-3.5 py-2.5 text-[11px] text-rose-400">
                <Warning className="h-3.5 w-3.5 shrink-0" weight="fill" /> Erro ao salvar.
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider mb-1.5">Nome *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: Anamnese Dermatologia" className={inputCls} autoFocus />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider mb-1.5">Especialidade</label>
              <input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="ex: Dermatologia" className={inputCls} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider mb-1.5">Descrição</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opcional" className={inputCls} />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-border text-accent focus:ring-accent/30" />
            <span className="text-[11px] text-muted-foreground/70">Ficha padrão (usada automaticamente)</span>
          </label>

          {/* Fields */}
          <div>
            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider mb-2">Campos</p>
            <div className="space-y-3">
              {fields.map((field, idx) => (
                <div key={field.id} className="rounded-xl border border-border/50 bg-foreground/[0.02] p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input value={field.label} onChange={(e) => updateField(field.id, { label: e.target.value })}
                      placeholder="Nome do campo" className="flex-1 h-8 rounded-lg border border-border/60 bg-foreground/[0.02] px-2.5 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-accent/30" />
                    <select value={field.type} onChange={(e) => updateField(field.id, { type: e.target.value as FormFieldDefinition["type"] })}
                      className="h-8 rounded-lg border border-border/60 bg-foreground/[0.02] px-2 text-[10px] text-foreground focus:outline-none">
                      {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <label className="flex items-center gap-1 cursor-pointer shrink-0">
                      <input type="checkbox" checked={field.required} onChange={(e) => updateField(field.id, { required: e.target.checked })}
                        className="h-3 w-3 rounded border-border text-accent" />
                      <span className="text-[9px] text-muted-foreground/50">Obrig.</span>
                    </label>
                    <button onClick={() => moveField(field.id, -1)} disabled={idx === 0} className="cursor-pointer text-muted-foreground/30 hover:text-foreground/60 disabled:opacity-20"><ArrowUp className="h-3 w-3" /></button>
                    <button onClick={() => moveField(field.id, 1)} disabled={idx === fields.length - 1} className="cursor-pointer text-muted-foreground/30 hover:text-foreground/60 disabled:opacity-20"><ArrowDown className="h-3 w-3" /></button>
                    <button onClick={() => removeField(field.id)} className="cursor-pointer text-rose-400/40 hover:text-rose-400"><Trash className="h-3 w-3" /></button>
                  </div>
                  {/* Options for select/radio/checkbox */}
                  {needsOptions(field.type) && (
                    <div className="pl-2 space-y-1">
                      <div className="flex flex-wrap gap-1">
                        {(field.options ?? []).map((o) => (
                          <span key={o} className="flex items-center gap-1 rounded-md border border-border/50 bg-foreground/[0.03] px-1.5 py-0.5 text-[9px] text-muted-foreground/70">
                            {o} <button onClick={() => removeOption(field.id, o)} className="cursor-pointer text-rose-400/50 hover:text-rose-400"><X className="h-2 w-2" /></button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-1">
                        <input value={optionInput[field.id] ?? ""} onChange={(e) => setOptionInput((p) => ({ ...p, [field.id]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addOption(field.id) } }}
                          placeholder="Nova opção..." className="flex-1 h-7 rounded-md border border-border/50 bg-foreground/[0.02] px-2 text-[10px] focus:outline-none" />
                        <button onClick={() => addOption(field.id)} className="cursor-pointer h-7 px-2 rounded-md border border-accent/30 bg-accent/5 text-[9px] font-bold text-accent">+</button>
                      </div>
                    </div>
                  )}
                  {/* Section grouping */}
                  <input value={field.section ?? ""} onChange={(e) => updateField(field.id, { section: e.target.value || undefined })}
                    placeholder="Seção (agrupamento)" className="h-7 rounded-md border border-border/40 bg-foreground/[0.01] px-2 text-[9px] text-muted-foreground/50 focus:outline-none w-full" />
                </div>
              ))}
            </div>
            <button onClick={() => setFields((f) => [...f, newField(f.length)])}
              className="cursor-pointer mt-2 flex items-center gap-1.5 rounded-lg border border-dashed border-border/50 px-3 py-2 text-[10px] font-semibold text-muted-foreground/50 hover:text-accent hover:border-accent/30 transition-all w-full justify-center">
              <Plus className="h-3 w-3" /> Adicionar campo
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-border/50 px-5 py-3 shrink-0">
          <button type="button" onClick={onClose}
            className="cursor-pointer flex-1 rounded-xl border border-border/70 py-2.5 text-[12px] text-muted-foreground/70 hover:text-foreground/85 hover:bg-foreground/[0.04] transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={isPending || !name.trim() || fields.length === 0}
            className="cursor-pointer flex-1 flex items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-[12px] font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50">
            {isPending ? <Spinner /> : <Check className="h-3.5 w-3.5" weight="bold" />}
            {isEdit ? "Salvar" : "Criar ficha"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
