"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check, Warning, Plus, Code } from "@phosphor-icons/react"
import { useCreateDocumentTemplate, useUpdateDocumentTemplate } from "@/hooks/use-documents"
import type { DocumentTemplate } from "@/lib/api/documents"

const ease = [0.33, 1, 0.68, 1] as const
const inputCls = "w-full h-10 rounded-xl border border-border/70 bg-foreground/[0.03] px-3.5 text-[12px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/30 transition-all"

function Spinner({ className = "h-3 w-3" }: { className?: string }) {
  return <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
    className={`rounded-full border-2 border-border border-t-white/70 ${className}`} />
}

const CATEGORIES = [
  { value: "consent", label: "Termo de consentimento" },
  { value: "contract", label: "Contrato" },
  { value: "treatment_agreement", label: "Acordo de tratamento" },
  { value: "other", label: "Outro" },
]

const COMMON_VARIABLES = [
  "patient_name", "patient_cpf", "patient_phone", "patient_email",
  "date", "time", "procedure", "professional_name", "clinic_name",
]

export function DocumentTemplateEditor({ template, onClose, onSaved }: {
  template?: DocumentTemplate | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!template
  const create = useCreateDocumentTemplate()
  const update = useUpdateDocumentTemplate()
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const [name, setName] = useState(template?.name ?? "")
  const [description, setDescription] = useState(template?.description ?? "")
  const [category, setCategory] = useState(template?.category ?? "consent")
  const [body, setBody] = useState(template?.body ?? "")
  const [requiresSignature, setRequiresSignature] = useState(template?.requiresSignature ?? true)

  const isPending = create.isPending || update.isPending
  const error = create.isError || update.isError

  // Extract variables from body
  const detectedVars = Array.from(new Set(body.match(/\{\{(\w+)\}\}/g)?.map((m) => m.slice(2, -2)) ?? []))

  function insertVariable(varName: string) {
    const textarea = bodyRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = `{{${varName}}}`
    const newBody = body.slice(0, start) + text + body.slice(end)
    setBody(newBody)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + text.length, start + text.length)
    }, 0)
  }

  function handleSave() {
    if (isEdit && template) {
      update.mutate({ id: template.id, name, description, category, body, variables: detectedVars, requiresSignature }, { onSuccess: () => { onSaved(); onClose() } })
    } else {
      create.mutate({ name, description, category, body, variables: detectedVars, requiresSignature }, { onSuccess: () => { onSaved(); onClose() } })
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 backdrop-blur-sm px-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 8 }}
        transition={{ duration: 0.22, ease }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[85vh] rounded-2xl border border-border/80 bg-overlay shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4 shrink-0">
          <h2 className="text-[14px] font-semibold text-foreground">{isEdit ? "Editar documento" : "Novo modelo de documento"}</h2>
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
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: Termo de Consentimento - Botox" className={inputCls} autoFocus />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider mb-1.5">Categoria</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider mb-1.5">Descrição</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opcional" className={inputCls} />
            </div>
          </div>

          {/* Variable inserter */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <label className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider">Variáveis</label>
              <Code className="h-3 w-3 text-muted-foreground/40" />
            </div>
            <div className="flex flex-wrap gap-1">
              {COMMON_VARIABLES.map((v) => (
                <button key={v} type="button" onClick={() => insertVariable(v)}
                  className="cursor-pointer rounded-md border border-border/50 bg-foreground/[0.02] px-2 py-0.5 text-[9px] font-mono text-muted-foreground/60 hover:text-accent hover:border-accent/30 transition-all">
                  {`{{${v}}}`}
                </button>
              ))}
            </div>
          </div>

          {/* Body editor */}
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider mb-1.5">Conteúdo do documento *</label>
            <textarea
              ref={bodyRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Escreva o conteúdo do documento... Use {{variavel}} para inserir dados dinâmicos."
              rows={12}
              className="w-full rounded-xl border border-border/70 bg-foreground/[0.03] px-3.5 py-3 text-[12px] font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/30 transition-all resize-y leading-relaxed"
            />
            {detectedVars.length > 0 && (
              <p className="text-[9px] text-muted-foreground/40 mt-1">
                Variáveis detectadas: {detectedVars.map((v) => `{{${v}}}`).join(", ")}
              </p>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={requiresSignature} onChange={(e) => setRequiresSignature(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-border text-accent focus:ring-accent/30" />
            <span className="text-[11px] text-muted-foreground/70">Requer assinatura do paciente</span>
          </label>
        </div>

        <div className="flex items-center gap-2 border-t border-border/50 px-5 py-3 shrink-0">
          <button type="button" onClick={onClose}
            className="cursor-pointer flex-1 rounded-xl border border-border/70 py-2.5 text-[12px] text-muted-foreground/70 hover:text-foreground/85 hover:bg-foreground/[0.04] transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={isPending || !name.trim() || !body.trim()}
            className="cursor-pointer flex-1 flex items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-[12px] font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50">
            {isPending ? <Spinner /> : <Check className="h-3.5 w-3.5" weight="bold" />}
            {isEdit ? "Salvar" : "Criar modelo"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
