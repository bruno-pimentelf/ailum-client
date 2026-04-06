"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MagnifyingGlass, Stethoscope, User, X } from "@phosphor-icons/react"
import { ClinicalTimeline } from "@/components/clinical-records/clinical-timeline"
import { ClinicalRecordEditor } from "@/components/clinical-records/clinical-record-editor"
import { useMe } from "@/hooks/use-me"
import type { TimelineEntry } from "@/lib/api/clinical-records"

const ease = [0.33, 1, 0.68, 1] as const
const inputCls = "w-full h-11 rounded-xl border border-border/70 bg-foreground/[0.03] px-4 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"

interface ContactResult {
  id: string
  name: string | null
  phone: string
  photoUrl?: string | null
}

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
    className={`rounded-full border-2 border-border border-t-accent ${className}`} />
}

export default function ClinicalPage() {
  const { data: me } = useMe()
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<ContactResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedContact, setSelectedContact] = useState<ContactResult | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  // Debounced search
  useEffect(() => {
    if (search.trim().length < 2) { setResults([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/v1/contacts?search=${encodeURIComponent(search.trim())}&limit=8`, {
          credentials: "include",
        })
        if (res.ok) {
          const data = await res.json()
          setResults((data.data ?? data) as ContactResult[])
        }
      } catch { /* ignore */ }
      setSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const selectContact = useCallback((c: ContactResult) => {
    setSelectedContact(c)
    setSearch("")
    setResults([])
  }, [])

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <header className="shrink-0 border-b border-border/50 bg-background/50 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-4 md:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-foreground/[0.03]">
              <Stethoscope className="h-5 w-5 text-accent" weight="fill" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">Prontuário</h1>
              <p className="text-[11px] text-muted-foreground/60">Evolução clínica e histórico do paciente</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 md:px-6 py-6 space-y-6">

          {/* Search */}
          <div className="relative">
            <div className="relative">
              <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar paciente por nome ou telefone..."
                className={`${inputCls} pl-10`}
              />
              {searching && <Spinner className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4" />}
            </div>

            {/* Search results dropdown */}
            <AnimatePresence>
              {results.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="absolute z-20 top-full mt-1 w-full rounded-xl border border-border/60 bg-overlay shadow-xl overflow-hidden">
                  {results.map((c) => (
                    <button key={c.id} onClick={() => selectContact(c)}
                      className="cursor-pointer w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-foreground/[0.04] transition-colors">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground/[0.06]">
                        <User className="h-3.5 w-3.5 text-muted-foreground/50" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-foreground truncate">{c.name ?? "Sem nome"}</p>
                        <p className="text-[11px] text-muted-foreground/50">{c.phone}</p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Selected contact + timeline */}
          {selectedContact ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ease }}>
              {/* Patient card */}
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-foreground/[0.02] p-4 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 border border-accent/20">
                  <User className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-bold text-foreground">{selectedContact.name ?? "Sem nome"}</p>
                  <p className="text-[12px] text-muted-foreground/60">{selectedContact.phone}</p>
                </div>
                <button onClick={() => setSelectedContact(null)}
                  className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/40 hover:text-foreground/70 hover:bg-foreground/[0.06] transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Timeline */}
              <ClinicalTimeline
                contactId={selectedContact.id}
                onCreateRecord={() => setShowEditor(true)}
              />
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border/50 bg-foreground/[0.02]">
                <Stethoscope className="h-7 w-7 text-muted-foreground/30" weight="duotone" />
              </div>
              <div className="text-center">
                <p className="text-[14px] font-bold text-foreground/85">Selecione um paciente</p>
                <p className="text-[12px] text-muted-foreground/60 mt-1">Busque pelo nome ou telefone para ver o prontuário</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Editor modal */}
      <AnimatePresence>
        {showEditor && selectedContact && me && (
          <ClinicalRecordEditor
            contactId={selectedContact.id}
            professionalId={me.professionalId ?? me.id}
            onClose={() => setShowEditor(false)}
            onSaved={() => setShowEditor(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
