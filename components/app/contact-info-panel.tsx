"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  User,
  EnvelopeSimple,
  Phone,
  Heart,
  Clock,
  Sparkle,
  ArrowsClockwise,
  CalendarBlank,
  MapPin,
  Stethoscope,
  Star,
  BellSimple,
  ShieldCheck,
  ChatCircleText,
  Brain,
  Smiley,
  Lightning,
  UsersThree,
  Plus,
  Check,
  Trash,
  X,
  Warning,
} from "@phosphor-icons/react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useContactDoc } from "@/hooks/use-contact-doc"
import { useTenant } from "@/hooks/use-tenant"
import { useDeleteContact } from "@/hooks/use-contacts-list"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { FirestoreContact, FirestoreReminder } from "@/lib/types/firestore"
import { createReminder, toggleReminder, deleteReminder, generateSummary } from "@/lib/api/conversations"

// ─── Memory key labels & icons ────────────────────────────────────────────────

const MEMORY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  name:                     { label: "Nome",                  icon: User,               color: "text-accent" },
  preferred_time:           { label: "Horário preferido",     icon: Clock,              color: "text-violet-400" },
  main_complaint:           { label: "Queixa principal",      icon: Stethoscope,        color: "text-rose-400" },
  insurance:                { label: "Plano de saúde",        icon: ShieldCheck,        color: "text-emerald-400" },
  cancelled_once:           { label: "Cancelou antes",        icon: CalendarBlank,      color: "text-amber-400" },
  price_sensitive:          { label: "Sensível a preço",      icon: Star,               color: "text-amber-400" },
  preferred_professional:   { label: "Profissional preferido", icon: User,              color: "text-violet-400" },
  preferred_weekday:        { label: "Dia preferido",         icon: CalendarBlank,      color: "text-blue-400" },
  preferred_time_of_day:    { label: "Turno preferido",       icon: Clock,              color: "text-blue-400" },
  wants_slot_on_cancellation: { label: "Lista de espera",     icon: BellSimple,         color: "text-accent" },
  flexible_schedule:        { label: "Aceita outros horários", icon: CalendarBlank,     color: "text-emerald-400" },
  preferred_service:        { label: "Serviço preferido",     icon: Heart,              color: "text-rose-400" },
  has_children:             { label: "Tem filhos",            icon: UsersThree,         color: "text-amber-400" },
  chronic_condition:        { label: "Condição crônica",      icon: Stethoscope,        color: "text-rose-400" },
  location:                 { label: "Bairro / Cidade",       icon: MapPin,             color: "text-emerald-400" },
  contact_preference:       { label: "Prefere contato",       icon: ChatCircleText,     color: "text-violet-400" },
  urgency:                  { label: "Urgência",              icon: Lightning,          color: "text-amber-400" },
  referral_source:          { label: "Como soube",            icon: Smiley,             color: "text-blue-400" },
}

const BOOLEAN_LABELS: Record<string, { true: string; false: string }> = {
  cancelled_once:             { true: "Sim",  false: "Não" },
  price_sensitive:            { true: "Sim",  false: "Não" },
  wants_slot_on_cancellation: { true: "Sim",  false: "Não" },
  flexible_schedule:          { true: "Sim",  false: "Não" },
  has_children:               { true: "Sim",  false: "Não" },
}

function formatMemoryValue(key: string, value: string): string {
  if (key in BOOLEAN_LABELS) {
    const lc = value.toLowerCase()
    if (lc === "true")  return BOOLEAN_LABELS[key].true
    if (lc === "false") return BOOLEAN_LABELS[key].false
  }
  return value
}

// ─── Identity section ────────────────────────────────────────────────────────

function IdentityRow({ icon: Icon, value, color }: { icon: React.ElementType; value: string; color: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={`shrink-0 flex h-6 w-6 items-center justify-center rounded-md bg-muted/40 ${color}`}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="text-[12px] text-foreground/90 truncate font-mono">{value}</span>
    </div>
  )
}

// ─── Memory fact card ─────────────────────────────────────────────────────────

function MemoryCard({ memKey, value, label }: { memKey: string; value: string; label: string }) {
  const meta = MEMORY_META[memKey]
  const Icon = meta?.icon ?? Brain
  const color = meta?.color ?? "text-muted-foreground"
  const display = formatMemoryValue(memKey, value)

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-2.5 rounded-lg border border-border/40 bg-card/20 px-3 py-2.5"
    >
      <span className={`shrink-0 flex h-6 w-6 items-center justify-center rounded-md bg-muted/40 mt-0.5 ${color}`}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-none mb-0.5">
          {label}
        </p>
        <p className="text-[12px] text-foreground/90 leading-snug break-words">{display}</p>
      </div>
    </motion.div>
  )
}

// ─── Reminder item ───────────────────────────────────────────────────────────

function formatDueDate(dueAt: FirestoreReminder["dueAt"]): { text: string; isOverdue: boolean } | null {
  if (!dueAt) return null
  const ts = (dueAt as unknown as { seconds: number }).seconds
  if (!ts) return null
  const date = new Date(ts * 1000)
  const now = new Date()
  const isOverdue = date < now

  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  let text: string
  if (diffDays === 0) text = "Hoje"
  else if (diffDays === 1) text = "Amanhã"
  else if (diffDays === -1) text = "Ontem"
  else if (diffDays > 1 && diffDays <= 7) text = `Em ${diffDays} dias`
  else if (diffDays < -1 && diffDays >= -7) text = `${Math.abs(diffDays)} dias atrás`
  else text = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })

  return { text, isOverdue }
}

function ReminderItem({ reminder, contactId }: { reminder: FirestoreReminder; contactId: string }) {
  const [deleting, setDeleting] = useState(false)

  const due = formatDueDate(reminder.dueAt)

  async function handleToggle() {
    try { await toggleReminder(contactId, reminder.id) } catch { /* snapshot updates */ }
  }

  async function handleDelete() {
    setDeleting(true)
    try { await deleteReminder(contactId, reminder.id) } catch { /* */ }
    setDeleting(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.2 }}
      className="group relative"
    >
      <div className={`flex items-start gap-2.5 rounded-xl px-3 py-2 transition-all ${
        reminder.isDone
          ? "opacity-50"
          : due?.isOverdue
            ? "bg-rose-500/[0.05]"
            : "hover:bg-card/30"
      }`}>
        {/* Checkbox */}
        <button
          onClick={handleToggle}
          className={`cursor-pointer mt-[3px] shrink-0 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 transition-all duration-200 ${
            reminder.isDone
              ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-400"
              : "border-muted-foreground/25 text-transparent hover:border-accent/50 hover:text-accent/30"
          }`}
        >
          <Check className="h-2.5 w-2.5" weight="bold" />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-[12px] leading-snug break-words transition-all ${
            reminder.isDone ? "line-through text-muted-foreground/50" : "text-foreground/85"
          }`}>
            {reminder.content}
          </p>
          {due && !reminder.isDone && (
            <span className={`inline-flex items-center gap-1 mt-1 text-[10px] font-medium ${
              due.isOverdue ? "text-rose-400" : "text-muted-foreground/50"
            }`}>
              <CalendarBlank className="h-3 w-3" />
              {due.text}
            </span>
          )}
        </div>

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="cursor-pointer shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 flex h-5 w-5 items-center justify-center rounded text-muted-foreground/30 hover:text-rose-400 transition-all"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </motion.div>
  )
}

// ─── New reminder form ───────────────────────────────────────────────────────

function addDays(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

function nextMonday(): Date {
  const d = new Date()
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? 1 : 8 - day))
  return d
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

const QUICK_DATES = [
  { label: "Hoje", date: () => new Date() },
  { label: "Amanhã", date: () => addDays(1) },
  { label: "Seg", date: nextMonday },
  { label: "1 sem", date: () => addDays(7) },
] as const

function NewReminderForm({ contactId, onClose }: { contactId: string; onClose: () => void }) {
  const [content, setContent] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!content.trim()) return
    setSaving(true)
    try {
      const dueAt = selectedDate ? selectedDate.toISOString() : undefined
      await createReminder(contactId, content.trim(), dueAt)
      onClose()
    } catch { /* snapshot updates */ }
    setSaving(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === "Escape") onClose()
  }

  function toggleQuickDate(dateFn: () => Date) {
    const d = dateFn()
    setSelectedDate((prev) => prev && isSameDay(prev, d) ? undefined : d)
  }

  const isCustomDate = selectedDate && !QUICK_DATES.some((qd) => isSameDay(qd.date(), selectedDate))

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="rounded-xl border border-accent/15 bg-accent/[0.03] p-3"
    >
      <form onSubmit={handleSubmit} className="space-y-2.5">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="O que precisa lembrar?"
          autoFocus
          className="w-full rounded-lg border-0 bg-transparent px-0.5 py-0.5 text-[12px] text-foreground placeholder:text-muted-foreground/35 focus:outline-none"
        />

        {/* Date selection: quick pills + calendar popover */}
        <div className="flex items-center gap-1 flex-wrap">
          {QUICK_DATES.map((qd) => {
            const d = qd.date()
            const active = selectedDate && isSameDay(selectedDate, d)
            return (
              <button
                key={qd.label}
                type="button"
                onClick={() => toggleQuickDate(qd.date)}
                className={`cursor-pointer h-6 rounded-full px-2 text-[10px] font-medium transition-all ${
                  active
                    ? "bg-accent/20 text-accent border border-accent/30"
                    : "bg-card/30 text-muted-foreground/50 border border-border/30 hover:text-muted-foreground/80 hover:border-border/50"
                }`}
              >
                {qd.label}
              </button>
            )
          })}

          {/* Calendar popover for custom date */}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={`cursor-pointer h-6 rounded-full px-2 text-[10px] font-medium transition-all flex items-center gap-1 ${
                  isCustomDate
                    ? "bg-accent/20 text-accent border border-accent/30"
                    : "bg-card/30 text-muted-foreground/50 border border-border/30 hover:text-muted-foreground/80 hover:border-border/50"
                }`}
              >
                <CalendarBlank className="h-3 w-3" />
                {isCustomDate
                  ? format(selectedDate, "d MMM", { locale: ptBR })
                  : "Outra"
                }
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start" side="top" sideOffset={8}>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date ?? undefined)
                  setCalendarOpen(false)
                }}
                locale={ptBR}
                disabled={{ before: new Date() }}
                className="[--cell-size:--spacing(8)]"
              />
            </PopoverContent>
          </Popover>

          {selectedDate && (
            <button
              type="button"
              onClick={() => setSelectedDate(undefined)}
              className="cursor-pointer h-5 w-5 flex items-center justify-center rounded-full text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
              title="Remover data"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-1.5 pt-0.5">
          <button type="button" onClick={onClose}
            className="cursor-pointer h-7 px-2.5 rounded-lg text-[10px] text-muted-foreground/50 hover:text-muted-foreground hover:bg-card/30 transition-all">
            Cancelar
          </button>
          <button type="submit" disabled={saving || !content.trim()}
            className="cursor-pointer flex items-center gap-1 h-7 rounded-lg bg-accent/15 border border-accent/25 px-3 text-[10px] font-bold text-accent hover:bg-accent/25 transition-all disabled:opacity-40">
            {saving
              ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }} className="h-3 w-3 rounded-full border-[1.5px] border-accent/30 border-t-accent" />
              : <Check className="h-3 w-3" weight="bold" />
            }
            Salvar
          </button>
        </div>
      </form>
    </motion.div>
  )
}

// ─── Summary section ─────────────────────────────────────────────────────────

function SummarySection({ contactId, summary, summaryUpdatedAt }: {
  contactId: string
  summary?: string | null
  summaryUpdatedAt?: { toDate?: () => Date } | null
}) {
  const [generating, setGenerating] = useState(false)
  const [expanded, setExpanded] = useState(false)

  async function handleGenerate() {
    setGenerating(true)
    try {
      await generateSummary(contactId)
      // Firestore snapshot will update the UI automatically
    } catch { /* */ }
    setGenerating(false)
  }

  const updatedLabel = (() => {
    if (!summaryUpdatedAt) return null
    const date = summaryUpdatedAt.toDate?.() ?? (typeof summaryUpdatedAt === 'string' ? new Date(summaryUpdatedAt as unknown as string) : null)
    if (!date) return null
    const now = Date.now()
    const diffMin = Math.floor((now - date.getTime()) / 60_000)
    if (diffMin < 1) return "agora"
    if (diffMin < 60) return `${diffMin}min atrás`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `${diffH}h atrás`
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
  })()

  const isLong = (summary?.length ?? 0) > 200

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <Sparkle className="h-3.5 w-3.5 text-accent" weight="fill" />
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Resumo</p>
          {updatedLabel && (
            <span className="text-[9px] text-muted-foreground/40">{updatedLabel}</span>
          )}
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="cursor-pointer flex items-center gap-1 text-[10px] font-bold text-accent/60 hover:text-accent transition-colors disabled:opacity-50"
          title={summary ? "Regerar resumo" : "Gerar resumo da conversa"}
        >
          {generating
            ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} className="h-3 w-3 rounded-full border-[1.5px] border-accent/30 border-t-accent" />
            : <ArrowsClockwise className="h-3 w-3" />
          }
          {summary ? "Atualizar" : "Gerar"}
        </button>
      </div>

      {summary ? (
        <div className="rounded-xl border border-accent/15 bg-accent/[0.03] px-3.5 py-3">
          <div className={`text-[11px] text-foreground/80 leading-relaxed space-y-2 ${!expanded && isLong ? "line-clamp-6" : ""}`}>
            {summary.split(/\n\n+/).map((block, i) => {
              const boldMatch = block.match(/^\*\*(.+?)\*\*\s*\n?([\s\S]*)$/)
              if (boldMatch) {
                return (
                  <div key={i}>
                    <p className="text-[10px] font-bold text-accent/70 uppercase tracking-wider mb-0.5">{boldMatch[1]}</p>
                    {boldMatch[2] && <p>{boldMatch[2].trim()}</p>}
                  </div>
                )
              }
              return <p key={i}>{block}</p>
            })}
          </div>
          {isLong && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="cursor-pointer mt-1.5 text-[10px] font-semibold text-accent/70 hover:text-accent transition-colors"
            >
              {expanded ? "Ver menos" : "Ver mais"}
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="cursor-pointer w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-accent/20 py-4 text-[11px] text-accent/50 hover:text-accent/70 hover:border-accent/30 transition-all disabled:opacity-50"
        >
          {generating
            ? <><motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} className="h-3.5 w-3.5 rounded-full border-2 border-accent/20 border-t-accent" /> Gerando resumo...</>
            : <><Sparkle className="h-3.5 w-3.5" weight="fill" /> Gerar resumo da conversa</>
          }
        </button>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ContactInfoPanelProps {
  contactId: string
  initialContact: FirestoreContact
  onDeleted?: () => void
}

export function ContactInfoPanel({ contactId, initialContact, onDeleted }: ContactInfoPanelProps) {
  const liveContact = useContactDoc(contactId)
  const contact = liveContact ?? initialContact
  const { data: tenant } = useTenant()
  const [showNewReminder, setShowNewReminder] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState("")
  const deleteContact = useDeleteContact()

  // Build label lookup for custom keys (stored as "Label::description for AI")
  const customLabelMap = new Map<string, string>()
  if (Array.isArray(tenant?.customMemoryKeys)) {
    for (const ck of tenant.customMemoryKeys as Array<{ key: string; description: string }>) {
      const sep = ck.description.indexOf("::")
      const label = sep === -1 ? ck.key : ck.description.slice(0, sep)
      customLabelMap.set(ck.key, label)
    }
  }

  function getLabel(key: string): string {
    return MEMORY_META[key]?.label ?? customLabelMap.get(key) ?? key.replace(/_/g, " ")
  }

  const displayName = contact.contactName ?? contact.name ?? contact.contactPhone ?? contact.phone ?? "?"
  const memories = contact.memories ?? {}
  const memoryEntries = Object.entries(memories).filter(([, v]) => v?.trim())
  const filteredMemories = memoryEntries.filter(([k]) => k !== "name")
  const reminders = contact.reminders ?? []
  const pendingReminders = reminders.filter((r) => !r.isDone)
  const doneReminders = reminders.filter((r) => r.isDone)

  const formattedPhone = (() => {
    const raw = (contact.contactPhone ?? contact.phone ?? "").replace(/\D/g, "").replace(/^0+/, "")
    if (!raw) return null
    const digits = raw.startsWith("55") ? raw.slice(2) : raw
    if (digits.length >= 11 && digits[2] === "9") {
      return `+55 (${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`
    }
    if (digits.length >= 10) {
      return `+55 (${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`
    }
    return raw
  })()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-1 flex-col min-h-0 overflow-hidden"
    >
      {/* Header */}
      <div className="flex min-h-16 shrink-0 items-center border-b border-border px-5 py-2">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
            <span className="text-[13px] font-bold">
              {displayName.split(" ").slice(0,2).map((w: string) => w[0]).join("").toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-foreground leading-tight">{displayName}</p>
            <p className="text-[11px] text-muted-foreground/70 leading-tight">Perfil do contato</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Identity card */}
        <div className="rounded-xl border border-border/40 bg-card/20 p-4 space-y-2.5">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Identificação</p>
          {formattedPhone && <IdentityRow icon={Phone} value={formattedPhone} color="text-emerald-400" />}
          {contact.email && <IdentityRow icon={EnvelopeSimple} value={contact.email} color="text-blue-400" />}
          {memories["name"] && !contact.name && (
            <IdentityRow icon={User} value={memories["name"]} color="text-accent" />
          )}
          {!formattedPhone && !contact.email && !memories["name"] && (
            <p className="text-[12px] text-muted-foreground/60">Nenhuma informação de contato registrada</p>
          )}
        </div>

        {/* Summary */}
        <SummarySection contactId={contactId} summary={contact.summary} summaryUpdatedAt={contact.summaryUpdatedAt} />

        {/* Reminders */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-2">
              <BellSimple className="h-3.5 w-3.5 text-muted-foreground/70" weight="duotone" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Lembretes
              </p>
              {pendingReminders.length > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent/15 px-1 text-[9px] font-bold text-accent">
                  {pendingReminders.length}
                </span>
              )}
            </div>
            {!showNewReminder && (
              <button
                onClick={() => setShowNewReminder(true)}
                className="cursor-pointer flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/40 hover:text-accent hover:bg-accent/10 transition-all"
                title="Novo lembrete"
              >
                <Plus className="h-3.5 w-3.5" weight="bold" />
              </button>
            )}
          </div>

          <AnimatePresence>
            {showNewReminder && (
              <NewReminderForm contactId={contactId} onClose={() => setShowNewReminder(false)} />
            )}
          </AnimatePresence>

          {reminders.length > 0 ? (
            <div className="rounded-xl border border-border/30 bg-card/10 divide-y divide-border/20 overflow-hidden">
              <AnimatePresence initial={false}>
                {pendingReminders.map((r) => (
                  <ReminderItem key={r.id} reminder={r} contactId={contactId} />
                ))}
                {doneReminders.map((r) => (
                  <ReminderItem key={r.id} reminder={r} contactId={contactId} />
                ))}
              </AnimatePresence>
            </div>
          ) : !showNewReminder ? (
            <button
              onClick={() => setShowNewReminder(true)}
              className="cursor-pointer w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/30 py-4 text-[11px] text-muted-foreground/35 hover:text-muted-foreground/60 hover:border-border/50 transition-all"
            >
              <Plus className="h-3 w-3" />
              Adicionar lembrete
            </button>
          ) : null}
        </div>

        {/* Memories */}
        {filteredMemories.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-0.5">
              <Brain className="h-3.5 w-3.5 text-muted-foreground/70" weight="duotone" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Captado pela IA
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {filteredMemories.map(([key, value]) => (
                <MemoryCard key={key} memKey={key} value={value} label={getLabel(key)} />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <Brain className="h-8 w-8 text-muted-foreground/20" weight="duotone" />
            <p className="text-[12px] text-muted-foreground/60">
              Nenhuma informação captada ainda
            </p>
            <p className="text-[11px] text-muted-foreground/40 max-w-[180px]">
              A IA vai registrando detalhes à medida que o paciente conversa
            </p>
          </div>
        )}

        {/* Delete contact */}
        <div className="pt-4 border-t border-border/30">
          <button
            onClick={() => { setDeleteOpen(true); setDeleteConfirm("") }}
            className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-[12px] font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash className="h-3.5 w-3.5" weight="regular" />
            Excluir contato
          </button>
        </div>

        <AlertDialog open={deleteOpen} onOpenChange={(v) => { setDeleteOpen(v); if (!v) setDeleteConfirm("") }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir contato permanentemente</AlertDialogTitle>
              <AlertDialogDescription>
                Isso vai apagar <strong>{displayName}</strong> e todos os dados associados: mensagens, agendamentos, cobranças, memórias e logs.
                <br /><br />
                Essa ação é <strong>irreversível</strong>. Digite <strong>confirmar</strong> para prosseguir.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder='Digite "confirmar"'
              className="h-9 w-full rounded-lg border border-border bg-muted/30 px-3 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-destructive/30"
              autoFocus
            />
            <AlertDialogFooter className="grid grid-cols-2 gap-2 sm:flex-none">
              <AlertDialogCancel className="w-full">Cancelar</AlertDialogCancel>
              <button
                disabled={deleteConfirm.toLowerCase().trim() !== "confirmar" || deleteContact.isPending}
                onClick={async () => {
                  await deleteContact.mutateAsync(contactId)
                  setDeleteOpen(false)
                  onDeleted?.()
                }}
                className="inline-flex h-9 w-full items-center justify-center rounded-md bg-destructive px-4 text-[13px] font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                {deleteContact.isPending ? "Excluindo..." : "Excluir"}
              </button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </motion.div>
  )
}
