"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X, Check, Warning, Plus, Trash, Lock, Notebook, Pill, TestTube,
  ListChecks, Ruler, Camera, Paperclip, UploadSimple,
} from "@phosphor-icons/react"
import { useCreateClinicalRecord, useUpdateClinicalRecord, useUploadAttachment } from "@/hooks/use-clinical-records"
import type { ClinicalRecord } from "@/lib/api/clinical-records"

const ease = [0.33, 1, 0.68, 1] as const
const inputCls = "w-full h-10 rounded-xl border border-border/70 bg-foreground/[0.03] px-3.5 text-[12px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/30 transition-all"

function Spinner({ className = "h-3 w-3" }: { className?: string }) {
  return <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
    className={`rounded-full border-2 border-border border-t-white/70 ${className}`} />
}

const RECORD_TYPES = [
  { value: "EVOLUTION", label: "Evolução", icon: Notebook },
  { value: "PRESCRIPTION", label: "Prescrição", icon: Pill },
  { value: "EXAM_RESULT", label: "Exame", icon: TestTube },
  { value: "TREATMENT_PLAN", label: "Plano de tratamento", icon: ListChecks },
  { value: "MEASUREMENT", label: "Medidas", icon: Ruler },
  { value: "PHOTO", label: "Foto", icon: Camera },
  { value: "ATTACHMENT", label: "Anexo", icon: Paperclip },
] as const

const VITAL_PRESETS = [
  { key: "peso", label: "Peso", unit: "kg" },
  { key: "altura", label: "Altura", unit: "cm" },
  { key: "pa", label: "PA", unit: "mmHg" },
  { key: "fc", label: "FC", unit: "bpm" },
  { key: "temp", label: "Temp", unit: "°C" },
]

export function ClinicalRecordEditor({ contactId, appointmentId, professionalId, record, onClose, onSaved }: {
  contactId: string
  appointmentId?: string
  professionalId: string
  record?: ClinicalRecord | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!record
  const create = useCreateClinicalRecord()
  const update = useUpdateClinicalRecord()
  const uploadAttachment = useUploadAttachment()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [type, setType] = useState<string>(record?.type ?? "EVOLUTION")
  const [title, setTitle] = useState(record?.title ?? "")
  const [content, setContent] = useState(record?.content ?? "")
  const [measurements, setMeasurements] = useState<Record<string, string>>(
    (record?.measurements as Record<string, string>) ?? {}
  )
  const [isPrivate, setIsPrivate] = useState(record?.isPrivate ?? false)
  const [showMeasurements, setShowMeasurements] = useState(Object.keys(measurements).length > 0)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])

  const isPending = create.isPending || update.isPending
  const error = create.isError || update.isError

  async function handleSave() {
    if (isEdit && record) {
      update.mutate(
        { id: record.id, title: title || undefined, content, measurements: showMeasurements ? measurements : undefined, isPrivate },
        {
          onSuccess: async (saved) => {
            for (const file of pendingFiles) {
              await uploadAttachment.mutateAsync({ recordId: saved.id, file })
            }
            onSaved()
            onClose()
          },
        },
      )
    } else {
      create.mutate(
        { contactId, appointmentId, professionalId, type: type as ClinicalRecord["type"], title: title || undefined, content, measurements: showMeasurements ? measurements : undefined, isPrivate },
        {
          onSuccess: async (saved) => {
            for (const file of pendingFiles) {
              await uploadAttachment.mutateAsync({ recordId: saved.id, file })
            }
            onSaved()
            onClose()
          },
        },
      )
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
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4 shrink-0">
          <h2 className="text-[14px] font-semibold text-foreground">{isEdit ? "Editar registro" : "Novo registro clínico"}</h2>
          <button onClick={onClose} className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/70 hover:text-foreground/85 hover:bg-foreground/[0.06] transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/[0.08] px-3.5 py-2.5 text-[11px] text-rose-400">
                <Warning className="h-3.5 w-3.5 shrink-0" weight="fill" /> Erro ao salvar registro.
              </motion.div>
            )}
          </AnimatePresence>

          {/* Type selector */}
          {!isEdit && (
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider mb-1.5">Tipo</label>
              <div className="flex flex-wrap gap-1.5">
                {RECORD_TYPES.map((t) => {
                  const Icon = t.icon
                  const active = type === t.value
                  return (
                    <button key={t.value} type="button" onClick={() => setType(t.value)}
                      className={`cursor-pointer flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold transition-all ${
                        active ? "border-accent/40 bg-accent/10 text-accent" : "border-border/60 bg-foreground/[0.02] text-muted-foreground/60 hover:text-muted-foreground/80"
                      }`}>
                      <Icon className="h-3 w-3" weight={active ? "fill" : "regular"} /> {t.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider mb-1.5">Título (opcional)</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ex: Retorno - Sessão 3" className={inputCls} />
          </div>

          {/* Content */}
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider mb-1.5">Anotações</label>
            <textarea
              value={content} onChange={(e) => setContent(e.target.value)}
              placeholder="Descreva a evolução clínica, prescrição, observações..."
              rows={8}
              className="w-full rounded-xl border border-border/70 bg-foreground/[0.03] px-3.5 py-3 text-[12px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/30 transition-all resize-y"
            />
          </div>

          {/* Measurements */}
          <div>
            <button type="button" onClick={() => setShowMeasurements((v) => !v)}
              className="cursor-pointer flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider hover:text-muted-foreground/70 transition-colors">
              <Ruler className="h-3 w-3" /> Sinais vitais / medidas
            </button>
            {showMeasurements && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-2 space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  {VITAL_PRESETS.map((v) => (
                    <div key={v.key}>
                      <label className="block text-[9px] text-muted-foreground/50 mb-0.5">{v.label} ({v.unit})</label>
                      <input
                        value={measurements[v.key] ?? ""}
                        onChange={(e) => setMeasurements((p) => ({ ...p, [v.key]: e.target.value }))}
                        placeholder="--"
                        className="w-full h-8 rounded-lg border border-border/60 bg-foreground/[0.02] px-2 text-[11px] text-foreground text-center focus:outline-none focus:ring-1 focus:ring-accent/30"
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Files */}
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider mb-1.5">Anexos</label>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => {
              if (e.target.files) setPendingFiles((p) => [...p, ...Array.from(e.target.files!)])
            }} />
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-dashed border-border/60 px-3 py-2 text-[10px] font-semibold text-muted-foreground/50 hover:text-muted-foreground/80 hover:border-accent/30 transition-all w-full justify-center">
              <UploadSimple className="h-3 w-3" /> Adicionar arquivo
            </button>
            {pendingFiles.length > 0 && (
              <div className="mt-2 space-y-1">
                {pendingFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
                    <Paperclip className="h-3 w-3 shrink-0" />
                    <span className="truncate flex-1">{f.name}</span>
                    <button onClick={() => setPendingFiles((p) => p.filter((_, j) => j !== i))}
                      className="cursor-pointer text-rose-400/60 hover:text-rose-400"><Trash className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Private */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-border bg-foreground/[0.04] text-accent focus:ring-accent/30" />
            <Lock className="h-3 w-3 text-muted-foreground/40" />
            <span className="text-[11px] text-muted-foreground/70">Visível apenas para mim</span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 border-t border-border/50 px-5 py-3 shrink-0">
          <button type="button" onClick={onClose}
            className="cursor-pointer flex-1 rounded-xl border border-border/70 py-2.5 text-[12px] text-muted-foreground/70 hover:text-foreground/85 hover:bg-foreground/[0.04] transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={isPending || !content.trim()}
            className="cursor-pointer flex-1 flex items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-[12px] font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50">
            {isPending ? <Spinner /> : <Check className="h-3.5 w-3.5" weight="bold" />}
            {isEdit ? "Salvar" : "Criar registro"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
