"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ClipboardText, Plus, Trash, Check, PencilSimple, Sparkle, Warning, Star } from "@phosphor-icons/react"
import { useFormTemplates, useDeleteFormTemplate } from "@/hooks/use-forms"
import { FormTemplateEditor } from "@/components/forms/form-template-editor"
import type { FormTemplate } from "@/lib/api/forms"

const ease = [0.33, 1, 0.68, 1] as const

function Spinner({ className = "h-3 w-3" }: { className?: string }) {
  return <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
    className={`rounded-full border-2 border-border border-t-white/70 ${className}`} />
}

export function FichasTab() {
  const { data: templates, isLoading } = useFormTemplates()
  const deleteTemplate = useDeleteFormTemplate()
  const [editingTemplate, setEditingTemplate] = useState<FormTemplate | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
            <Sparkle className="h-5 w-5 text-accent" />
          </motion.div>
          <p className="text-[11px] text-muted-foreground/70">Carregando fichas...</p>
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
            <ClipboardText className="h-5 w-5 text-accent" weight="fill" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-foreground">Fichas de Anamnese</p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">Modelos de fichas para preenchimento antes da consulta</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-accent/25 bg-accent/8 px-3 py-1.5 text-[11px] font-bold text-accent hover:bg-accent/15 transition-all">
          <Plus className="h-3 w-3" weight="bold" /> Nova ficha
        </button>
      </div>

      {/* List */}
      {(templates ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-border/50 gap-3">
          <ClipboardText className="h-7 w-7 text-muted-foreground/30" weight="duotone" />
          <p className="text-[13px] font-bold text-foreground/85">Nenhum modelo de ficha criado</p>
          <p className="text-[11px] text-muted-foreground/60">Crie fichas de anamnese para seus pacientes preencherem</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 divide-y divide-foreground/[0.04] overflow-hidden">
          {(templates ?? []).map((t) => (
            <div key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-foreground/[0.02] transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-semibold text-foreground truncate">{t.name}</p>
                  {t.isDefault && (
                    <span className="flex items-center gap-0.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-bold text-amber-400">
                      <Star className="h-2 w-2" weight="fill" /> Padrão
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {t.specialty && <span className="text-[10px] text-muted-foreground/50">{t.specialty}</span>}
                  <span className="text-[10px] text-muted-foreground/40">{t.fields.length} campos</span>
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

      {/* Modals */}
      <AnimatePresence>
        {showCreate && <FormTemplateEditor onClose={() => setShowCreate(false)} onSaved={() => setShowCreate(false)} />}
        {editingTemplate && <FormTemplateEditor template={editingTemplate} onClose={() => setEditingTemplate(null)} onSaved={() => setEditingTemplate(null)} />}
      </AnimatePresence>
    </motion.div>
  )
}
