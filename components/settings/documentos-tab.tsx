"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FileText, Plus, Trash, Check, PencilSimple, Sparkle, PencilLine, Warning } from "@phosphor-icons/react"
import { useDocumentTemplates, useDeleteDocumentTemplate } from "@/hooks/use-documents"
import { DocumentTemplateEditor } from "@/components/documents/document-template-editor"
import type { DocumentTemplate } from "@/lib/api/documents"

const ease = [0.33, 1, 0.68, 1] as const

const categoryLabels: Record<string, string> = {
  consent: "Consentimento",
  contract: "Contrato",
  treatment_agreement: "Acordo",
  other: "Outro",
}

function Spinner({ className = "h-3 w-3" }: { className?: string }) {
  return <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
    className={`rounded-full border-2 border-border border-t-white/70 ${className}`} />
}

export function DocumentosTab() {
  const { data: templates, isLoading } = useDocumentTemplates()
  const deleteTemplate = useDeleteDocumentTemplate()
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
            <Sparkle className="h-5 w-5 text-accent" />
          </motion.div>
          <p className="text-[11px] text-muted-foreground/70">Carregando modelos...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-foreground/[0.03]">
            <FileText className="h-5 w-5 text-accent" weight="fill" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-foreground">Modelos de Documentos</p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">Termos, contratos e documentos com assinatura eletrônica</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-accent/25 bg-accent/8 px-3 py-1.5 text-[11px] font-bold text-accent hover:bg-accent/15 transition-all">
          <Plus className="h-3 w-3" weight="bold" /> Novo modelo
        </button>
      </div>

      {/* List */}
      {(templates ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-border/50 gap-3">
          <FileText className="h-7 w-7 text-muted-foreground/30" weight="duotone" />
          <p className="text-[13px] font-bold text-foreground/85">Nenhum modelo de documento criado</p>
          <p className="text-[11px] text-muted-foreground/60">Crie modelos de termos e contratos para seus pacientes assinarem</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 divide-y divide-foreground/[0.04] overflow-hidden">
          {(templates ?? []).map((t) => (
            <div key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-foreground/[0.02] transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-semibold text-foreground truncate">{t.name}</p>
                  {t.category && (
                    <span className="rounded-full border border-foreground/[0.08] bg-foreground/[0.03] px-1.5 py-0.5 text-[8px] font-bold text-muted-foreground/60">
                      {categoryLabels[t.category] ?? t.category}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted-foreground/40">{t.variables.length} variáveis</span>
                  {t.requiresSignature && (
                    <span className="flex items-center gap-0.5 text-[10px] text-amber-400/60">
                      <PencilLine className="h-2.5 w-2.5" /> Assinatura
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setEditingTemplate(t)}
                className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/40 hover:text-accent hover:bg-accent/[0.08] transition-colors">
                <PencilSimple className="h-3 w-3" />
              </button>
              <button
                onClick={() => confirmDelete === t.id ? deleteTemplate.mutate(t.id, { onSuccess: () => setConfirmDelete(null) }) : setConfirmDelete(t.id)}
                onBlur={() => setConfirmDelete(null)}
                className={`cursor-pointer flex h-7 items-center justify-center rounded-lg text-[10px] font-bold transition-all ${
                  confirmDelete === t.id
                    ? "gap-1 px-2 bg-rose-500/15 border border-rose-500/30 text-rose-400"
                    : "w-7 text-muted-foreground/40 hover:text-rose-400 hover:bg-rose-500/[0.08]"
                }`}>
                {confirmDelete === t.id ? <><Check className="h-3 w-3" weight="bold" /> Excluir</> : <Trash className="h-3 w-3" />}
              </button>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showCreate && <DocumentTemplateEditor onClose={() => setShowCreate(false)} onSaved={() => setShowCreate(false)} />}
        {editingTemplate && <DocumentTemplateEditor template={editingTemplate} onClose={() => setEditingTemplate(null)} onSaved={() => setEditingTemplate(null)} />}
      </AnimatePresence>
    </motion.div>
  )
}
