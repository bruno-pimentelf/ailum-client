"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Notebook, Pill, TestTube, ListChecks, Ruler, Camera, Paperclip,
  CalendarCheck, FileText, PencilSimple, Plus, Clock,
} from "@phosphor-icons/react"
import { usePatientTimeline } from "@/hooks/use-clinical-records"
import type { TimelineEntry } from "@/lib/api/clinical-records"

const ease = [0.33, 1, 0.68, 1] as const

const typeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  clinical_record: { icon: Notebook, color: "text-sky-400 bg-sky-500/10 border-sky-500/20", label: "Evolução" },
  form_response: { icon: FileText, color: "text-violet-400 bg-violet-500/10 border-violet-500/20", label: "Ficha" },
  signed_document: { icon: PencilSimple, color: "text-amber-400 bg-amber-500/10 border-amber-500/20", label: "Documento" },
  appointment: { icon: CalendarCheck, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", label: "Consulta" },
}

const recordIcons: Record<string, React.ElementType> = {
  EVOLUTION: Notebook, PRESCRIPTION: Pill, EXAM_RESULT: TestTube,
  TREATMENT_PLAN: ListChecks, MEASUREMENT: Ruler, PHOTO: Camera, ATTACHMENT: Paperclip,
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " às " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
    className={`rounded-full border-2 border-border border-t-accent ${className}`} />
}

export function ClinicalTimeline({ contactId, onCreateRecord, onViewRecord }: {
  contactId: string
  onCreateRecord?: () => void
  onViewRecord?: (entry: TimelineEntry) => void
}) {
  const [page, setPage] = useState(1)
  const { data, isLoading } = usePatientTimeline(contactId, { page, limit: 20 })
  const entries = data?.data ?? []
  const hasMore = (data?.pages ?? 0) > page

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-foreground">Prontuário</h2>
        {onCreateRecord && (
          <button onClick={onCreateRecord}
            className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-accent/25 bg-accent/8 px-3 py-1.5 text-[11px] font-bold text-accent hover:bg-accent/15 transition-all">
            <Plus className="h-3 w-3" weight="bold" /> Nova evolução
          </button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-5 w-5" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && entries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-border/50 gap-3">
          <Notebook className="h-7 w-7 text-muted-foreground/30" weight="duotone" />
          <p className="text-[13px] font-bold text-foreground/85">Nenhum registro clínico</p>
          <p className="text-[11px] text-muted-foreground/60">Crie uma evolução para começar o prontuário</p>
        </div>
      )}

      {/* Timeline */}
      {entries.length > 0 && (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border/40" />

          <AnimatePresence initial={false}>
            {entries.map((entry, i) => {
              const config = typeConfig[entry.type] ?? typeConfig.clinical_record
              const Icon = entry.type === "clinical_record"
                ? (recordIcons[(entry.metadata?.recordType as string) ?? "EVOLUTION"] ?? Notebook)
                : config.icon

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03, ease }}
                  className="relative flex gap-3 pb-4 cursor-pointer group"
                  onClick={() => onViewRecord?.(entry)}
                >
                  {/* Dot */}
                  <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${config.color}`}>
                    <Icon className="h-3.5 w-3.5" weight="fill" />
                  </div>

                  {/* Card */}
                  <div className="flex-1 rounded-xl border border-border/50 bg-foreground/[0.02] p-3 group-hover:bg-foreground/[0.04] transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${config.color}`}>
                        {config.label}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
                        <Clock className="h-2.5 w-2.5" /> {formatDate(entry.date)}
                      </span>
                    </div>
                    <p className="text-[13px] font-semibold text-foreground truncate">{entry.title}</p>
                    {entry.summary && (
                      <p className="text-[11px] text-muted-foreground/60 mt-0.5 line-clamp-2">{entry.summary}</p>
                    )}
                    {entry.professionalName && (
                      <p className="text-[10px] text-muted-foreground/40 mt-1">{entry.professionalName}</p>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <button onClick={() => setPage((p) => p + 1)}
                className="cursor-pointer text-[11px] font-bold text-accent hover:text-accent/80 transition-colors">
                Carregar mais
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
