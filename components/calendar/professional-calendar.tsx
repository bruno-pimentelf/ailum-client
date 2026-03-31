"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useCallback } from "react"
import {
  CaretLeft,
  CaretRight,
  Plus,
  CalendarBlank,
  Clock,
  User,
  ArrowLeft,
  WhatsappLogo,
  CheckCircle,
  Circle,
  DotsThree,
  Lock,
  LockOpen,
  Warning,
  X,
  MagnifyingGlass,
  Repeat,
  Pencil,
  Trash,
} from "@phosphor-icons/react"
// useQueryClient no longer needed — availability editing removed from calendar
import {
  useProfessional,
  useProfessionalMutations,
  useProfessionalOverrides,
} from "@/hooks/use-professionals"
import { useAppointments, useCreateAppointment } from "@/hooks/use-appointments"
import {
  useCalendarEvents,
  useCreateCalendarEvent,
  useUpdateCalendarEvent,
  useDeleteCalendarEvent,
  useDeleteCalendarEventOccurrence,
} from "@/hooks/use-calendar-events"
import type { CalendarEvent } from "@/lib/api/calendar-events"
import { useContactsList } from "@/hooks/use-contacts-list"
import { useServices } from "@/hooks/use-services"
import { NovoAgendamentoModal } from "@/components/calendar/novo-agendamento-modal"
import { AppointmentStatusModal } from "@/components/calendar/appointment-status-modal"
import type { Appointment as ApiAppointment } from "@/lib/api/scheduling"
import type {
  AvailabilityException,
  AvailabilityOverride,
} from "@/lib/api/professionals"
import { toYMD, formatTimeLocal } from "@/lib/date-utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
// AlertDialog removed — no longer clearing availability from calendar
import {
  computeDayAvailability,
  getBlockSource,
  timeToMinutes,
  HOUR_HEIGHT,
  timeToTop,
  durationToPx,
  pxToMinutes,
  snapTo15,
  minutesToHHMM,
  minutesToPx,
} from "@/lib/availability-utils"
import { AilumLoader } from "@/components/ui/ailum-loader"

const ease = [0.33, 1, 0.68, 1] as const

// Availability editing types removed — availability is managed in settings only

// ─── Toast ────────────────────────────────────────────────────────────────────

function CalendarToast({
  message,
  variant = "error",
  onDismiss,
}: {
  message: string
  variant?: "error" | "info"
  onDismiss: () => void
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000)
    return () => clearTimeout(t)
  }, [onDismiss])
  const isError = variant === "error"
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.2 }}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2.5 rounded-xl px-4 py-2.5 shadow-xl border ${
        isError
          ? "border-rose-500/25 bg-destructive/15"
          : "border-amber-500/25 bg-warning/15"
      }`}
    >
      {isError ? (
        <Warning className="h-4 w-4 text-rose-400 shrink-0" weight="fill" />
      ) : (
        <Clock className="h-4 w-4 text-amber-400 shrink-0" weight="fill" />
      )}
      <p className={`text-[12px] font-medium ${isError ? "text-rose-400" : "text-amber-300"}`}>
        {message}
      </p>
      <button onClick={onDismiss} className="ml-1 text-foreground hover:text-foreground/85 transition-colors">
        <X className="h-3.5 w-3.5" weight="bold" />
      </button>
    </motion.div>
  )
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7) // 7–20
const DAY_HEIGHT = HOURS.length * HOUR_HEIGHT // 14 * 64 = 896px

type ViewMode = "week" | "month"

type AppointmentStatus = "confirmed" | "pending" | "done" | "cancelled"

type CalendarAppointment = {
  id: string
  patientName: string
  contactId: string
  contactPhone: string
  doctorName: string
  doctorId: string
  time: string
  scheduledAt: string
  duration: number
  type: string
  status: AppointmentStatus
  statusApi: ApiAppointment["status"]
  paid: boolean
  day: number
  month: number
  year: number
  color: string
  notes: string | null
  chargeAmount: number | null
  chargeStatus: string | null
}

function mapApiStatus(api: ApiAppointment["status"]): AppointmentStatus {
  if (api === "CANCELLED") return "cancelled"
  if (api === "CONFIRMED") return "confirmed"
  if (api === "PENDING" || api === "NO_SHOW") return "pending"
  if (api === "COMPLETED") return "done"
  return "pending"
}

function toCalendarAppointment(api: ApiAppointment): CalendarAppointment {
  const d = new Date(api.scheduledAt)
  return {
    id: api.id,
    patientName: api.contact?.name ?? "—",
    contactId: api.contactId,
    contactPhone: api.contact?.phone ?? "",
    doctorName: api.professional?.fullName ?? "—",
    doctorId: api.professionalId,
    time: formatTimeLocal(api.scheduledAt),
    scheduledAt: api.scheduledAt,
    duration: api.durationMin ?? api.service?.durationMin ?? 50,
    type: api.service?.name ?? "Consulta",
    status: api.status === "CANCELLED" ? "cancelled" : mapApiStatus(api.status),
    statusApi: api.status,
    paid: api.charge?.status === "PAID",
    day: d.getDate(),
    month: d.getMonth(),
    year: d.getFullYear(),
    color: api.professionalId,
    notes: api.notes,
    chargeAmount: api.charge?.amount ?? null,
    chargeStatus: api.charge?.status ?? null,
  }
}

function PaidBadge({ paid }: { paid: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-1.5 py-px text-[8px] font-bold tracking-wide shrink-0 ${
        paid
          ? "bg-foreground/[0.06] border-border text-foreground/85"
          : "bg-foreground/[0.02] border-foreground/[0.06] text-foreground/85"
      }`}
    >
      {paid ? "Pago" : "Pendente"}
    </span>
  )
}

// ─── Block Day Modal ──────────────────────────────────────────────────────────

function BlockDayModal({
  open,
  date,
  onClose,
  onConfirm,
  isPending,
}: {
  open: boolean
  date: Date | null
  onClose: () => void
  onConfirm: (reason?: string) => void
  isPending: boolean
}) {
  const [reason, setReason] = useState("")
  if (!open || !date) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-sm rounded-2xl border border-border/60 bg-background shadow-2xl p-6"
      >
        <h3 className="text-[15px] font-bold text-foreground flex items-center gap-2">
          <Lock className="h-4 w-4 text-amber-400" />
          Bloquear dia
        </h3>
        <p className="text-[12px] text-foreground/85 mt-2">
          {WEEKDAYS[date.getDay()]}, {date.getDate()} de {MONTHS_PT[date.getMonth()]}
        </p>
        <div className="mt-4">
          <label className="block text-[10px] font-bold text-foreground/85 uppercase tracking-wider mb-1.5">
            Motivo (opcional)
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: Consulta externa"
            className="w-full h-10 rounded-xl border border-border/70 bg-foreground/[0.03] px-3 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-accent/50"
          />
        </div>
        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-border/60 text-foreground text-[13px] font-semibold hover:bg-foreground/[0.04]"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(reason.trim() || undefined)}
            disabled={isPending}
            className="flex-1 h-10 rounded-xl bg-amber-500/80 text-foreground text-[13px] font-bold hover:bg-amber-500 disabled:opacity-50"
          >
            {isPending ? "…" : "Bloquear"}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Block Range Modal ────────────────────────────────────────────────────────

function BlockRangeModal({
  open,
  dateFrom,
  dateTo,
  onClose,
  onConfirm,
  isPending,
}: {
  open: boolean
  dateFrom: Date | null
  dateTo: Date | null
  onClose: () => void
  onConfirm: (from: string, to: string, reason?: string) => void
  isPending: boolean
}) {
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [reason, setReason] = useState("")
  useEffect(() => {
    if (open && dateFrom) setFrom(toYMD(dateFrom))
    if (open && dateTo) setTo(toYMD(dateTo))
  }, [open, dateFrom, dateTo])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl border border-border/60 bg-background shadow-2xl p-6"
      >
        <h3 className="text-[15px] font-bold text-foreground flex items-center gap-2">
          <Lock className="h-4 w-4 text-amber-400" />
          Bloquear período
        </h3>
        <p className="text-[12px] text-foreground/85 mt-2">Ex.: férias, licença</p>
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-foreground/85 uppercase tracking-wider mb-1">
              De
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full h-10 rounded-xl border border-border/70 bg-foreground/[0.03] px-3 text-[13px]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-foreground/85 uppercase tracking-wider mb-1">
              Até
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full h-10 rounded-xl border border-border/70 bg-foreground/[0.03] px-3 text-[13px]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-foreground/85 uppercase tracking-wider mb-1">
              Motivo (opcional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Férias"
              className="w-full h-10 rounded-xl border border-border/70 bg-foreground/[0.03] px-3 text-[13px]"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-border/60 text-foreground text-[13px] font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={() => from && to && onConfirm(from, to, reason.trim() || undefined)}
            disabled={isPending || !from || !to}
            className="flex-1 h-10 rounded-xl bg-amber-500/80 text-foreground text-[13px] font-bold disabled:opacity-50"
          >
            {isPending ? "…" : "Bloquear"}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Quick Schedule Card (inline, Google Calendar style) ─────────────────────

const WEEKDAYS_FULL = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]
const MONTHS_FULL = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]

function QuickScheduleCard({
  date,
  time,
  x,
  y,
  professionalId,
  onBlock,
  onClose,
}: {
  date: Date
  time: string
  x: number
  y: number
  professionalId: string
  onBlock: () => void
  onClose: () => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ left: x, top: y })
  const [mode, setMode] = useState<"pick" | "schedule">("pick")

  useEffect(() => {
    const adjust = () => {
      if (!cardRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      const pad = 12
      let left = x + 12
      let top = y - 20

      if (left + rect.width + pad > window.innerWidth) left = x - rect.width - 12
      if (top + rect.height + pad > window.innerHeight) top = window.innerHeight - rect.height - pad
      if (left < pad) left = pad
      if (top < pad) top = pad

      setPos({ left, top })
    }
    adjust()
    // Re-adjust when mode changes (card size changes)
    const raf = requestAnimationFrame(adjust)
    return () => cancelAnimationFrame(raf)
  }, [x, y, mode])

  const dayLabel = `${WEEKDAYS_FULL[date.getDay()]}, ${date.getDate()} de ${MONTHS_FULL[date.getMonth()]}`

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: -6, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.97 }}
        transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
        className="fixed z-50 rounded-xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl shadow-black/40"
        style={{ left: pos.left, top: pos.top, width: mode === "schedule" ? 340 : 240 }}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3">
          <p className="text-[22px] font-bold tracking-tight text-foreground leading-none">
            {time}
          </p>
          <p className="text-[12px] text-muted-foreground/50 mt-1.5 leading-snug">
            {dayLabel}
          </p>
        </div>

        <div className="h-px bg-foreground/[0.06]" />

        {mode === "pick" ? (
          <div className="p-1.5">
            <button
              onClick={() => setMode("schedule")}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium text-foreground hover:bg-accent/10 transition-colors duration-150"
            >
              <Plus className="h-4 w-4 text-accent" weight="bold" />
              Agendar consulta
            </button>
            <button
              onClick={() => { onBlock(); onClose() }}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium text-foreground hover:bg-foreground/[0.06] transition-colors duration-150"
            >
              <Lock className="h-4 w-4 text-amber-400/70" weight="fill" />
              Bloquear horário
            </button>
          </div>
        ) : (
          <InlineScheduleForm
            date={date}
            time={time}
            professionalId={professionalId}
            onClose={onClose}
          />
        )}
      </motion.div>
    </>
  )
}

// ─── Inline schedule form (embedded in quick card) ───────────────────────────

function InlineScheduleForm({
  date,
  time,
  professionalId,
  onClose,
}: {
  date: Date
  time: string
  professionalId: string
  onClose: () => void
}) {
  const [patientSearch, setPatientSearch] = useState("")
  const [debounced, setDebounced] = useState("")
  const [selectedContact, setSelectedContact] = useState<{ id: string; name: string | null; phone: string | null } | null>(null)
  const [serviceId, setServiceId] = useState("")
  const [error, setError] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const createAppointment = useCreateAppointment()
  const { data: services } = useServices()
  const consultations = (services ?? []).filter((s: { isConsultation: boolean }) => s.isConsultation)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(patientSearch), 280)
    return () => clearTimeout(t)
  }, [patientSearch])

  const { data: contactsData } = useContactsList({ search: debounced || undefined })
  const contacts = contactsData?.data ?? []

  const canConfirm = !!selectedContact && !!serviceId
  const selectedService = consultations.find((s: { id: string }) => s.id === serviceId)

  const handleConfirm = async () => {
    setError(null)
    if (!canConfirm) return
    try {
      const [h, m] = time.split(":").map(Number)
      const d = new Date(date)
      d.setHours(h, m, 0, 0)
      await createAppointment.mutateAsync({
        contactId: selectedContact!.id,
        professionalId,
        serviceId,
        scheduledAt: d.toISOString(),
        durationMin: selectedService?.durationMin,
      })
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao criar agendamento.")
    }
  }

  return (
    <div className="p-3 space-y-3">
      {/* Patient */}
      {selectedContact ? (
        <div className="flex items-center justify-between rounded-lg border border-accent/30 bg-accent/[0.06] px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-6 w-6 rounded-full bg-foreground/[0.08] flex items-center justify-center text-[9px] font-bold text-foreground/80 shrink-0">
              {(selectedContact.name ?? "?").slice(0, 2).toUpperCase()}
            </div>
            <span className="text-[12px] font-medium text-foreground/85 truncate">{selectedContact.name}</span>
          </div>
          <button onClick={() => setSelectedContact(null)} className="text-muted-foreground/60 hover:text-muted-foreground p-0.5">
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
          <input
            ref={searchRef}
            type="text"
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
            placeholder="Buscar paciente..."
            autoFocus
            className="w-full h-9 rounded-lg border border-border/60 bg-foreground/[0.03] pl-8 pr-3 text-[12px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
          {patientSearch.length > 0 && contacts.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 rounded-lg border border-border/60 bg-background/95 backdrop-blur-xl overflow-hidden z-10 max-h-[140px] overflow-y-auto">
              {contacts.slice(0, 4).map((c: { id: string; name: string | null; phone: string | null }) => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedContact(c); setPatientSearch("") }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-foreground/[0.04] transition-colors"
                >
                  <div className="h-6 w-6 shrink-0 rounded-full bg-foreground/[0.08] flex items-center justify-center text-[9px] font-bold text-foreground/80">
                    {(c.name ?? c.phone ?? "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-medium text-foreground/85 truncate">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground/60 truncate">{c.phone}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Service */}
      {consultations.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {consultations.map((s: { id: string; name: string; durationMin: number }) => (
            <button
              key={s.id}
              onClick={() => setServiceId(s.id)}
              className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                serviceId === s.id
                  ? "bg-accent/15 border border-accent/30 text-accent"
                  : "border border-border/60 text-muted-foreground/70 hover:text-muted-foreground hover:border-border"
              }`}
            >
              {s.name} · {s.durationMin}min
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-[11px] text-rose-400 bg-rose-500/[0.08] border border-rose-500/20 rounded-lg px-2.5 py-1.5">
          {error}
        </p>
      )}

      {/* Confirm */}
      <button
        onClick={handleConfirm}
        disabled={!canConfirm || createAppointment.isPending}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent py-2 text-[12px] font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {createAppointment.isPending ? "Agendando..." : "Confirmar"}
      </button>
    </div>
  )
}

// ─── Calendar Event Colors ───────────────────────────────────────────────────

const EVENT_COLORS = [
  { name: "Indigo", value: "#6366f1" },
  { name: "Emerald", value: "#10b981" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Sky", value: "#0ea5e9" },
]

// ─── Inline Event Card (create/edit calendar event) ─────────────────────────

function InlineEventCard({
  date,
  time,
  x,
  y,
  professionalId,
  existingEvent,
  onClose,
  onPreviewChange,
}: {
  date: Date
  time: string
  x: number
  y: number
  professionalId: string
  existingEvent?: CalendarEvent | null
  onClose: () => void
  onPreviewChange?: (preview: { date: Date; startTime: string; endTime: string; color: string; title: string } | null) => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ left: x, top: y })
  const [title, setTitle] = useState(existingEvent?.title ?? "")
  const [startTime, setStartTime] = useState(existingEvent?.startTime ?? time)
  const endDefault = (() => {
    if (existingEvent?.endTime) return existingEvent.endTime
    const [h, m] = time.split(":").map(Number)
    const endMin = (h ?? 0) * 60 + (m ?? 0) + 60
    const eh = Math.floor(endMin / 60) % 24
    const em = endMin % 60
    return `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`
  })()
  const [endTime, setEndTime] = useState(endDefault)
  const [color, setColor] = useState(existingEvent?.color ?? "#6366f1")
  const [recurrence, setRecurrence] = useState<string | null>(existingEvent?.recurrence ?? null)
  const [error, setError] = useState<string | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  const createEvent = useCreateCalendarEvent()
  const updateEvent = useUpdateCalendarEvent()

  // Sync preview to parent
  useEffect(() => {
    onPreviewChange?.({ date, startTime, endTime, color, title })
    return () => { onPreviewChange?.(null) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTime, endTime, color, title])

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  useEffect(() => {
    const adjust = () => {
      if (!cardRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      const pad = 12
      let left = x + 12
      let top = y - 20
      if (left + rect.width + pad > window.innerWidth) left = x - rect.width - 12
      if (top + rect.height + pad > window.innerHeight) top = window.innerHeight - rect.height - pad
      if (left < pad) left = pad
      if (top < pad) top = pad
      setPos({ left, top })
    }
    adjust()
    const raf = requestAnimationFrame(adjust)
    return () => cancelAnimationFrame(raf)
  }, [x, y])

  const dayLabel = `${WEEKDAYS_FULL[date.getDay()]}, ${date.getDate()} de ${MONTHS_FULL[date.getMonth()]}`

  const handleSave = async () => {
    setError(null)
    if (!title.trim()) {
      setError("Insira um título para o evento.")
      return
    }
    try {
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
      if (existingEvent) {
        await updateEvent.mutateAsync({
          id: existingEvent.id,
          body: { title: title.trim(), startTime, endTime, color, recurrence, date: dateStr },
        })
      } else {
        await createEvent.mutateAsync({
          professionalId,
          title: title.trim(),
          date: dateStr,
          startTime,
          endTime,
          color,
          recurrence,
        })
      }
      onClose()
    } catch {
      setError("Erro ao salvar evento.")
    }
  }

  const isPending = createEvent.isPending || updateEvent.isPending

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: -6, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.97 }}
        transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
        className="fixed z-50 w-[280px] rounded-xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl shadow-black/40"
        style={{ left: pos.left, top: pos.top }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
            {existingEvent ? "Editar evento" : "Novo evento"}
          </p>
          <button onClick={onClose} className="text-muted-foreground/50 hover:text-muted-foreground">
            <X className="h-3.5 w-3.5" weight="bold" />
          </button>
        </div>

        <div className="px-4 pb-4 space-y-3">
          {/* Title */}
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Reuniao, Almoco, Curso..."
            onKeyDown={(e) => { if (e.key === "Enter") handleSave() }}
            className="w-full h-9 rounded-lg border border-border/60 bg-foreground/[0.03] px-3 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/40"
          />

          {/* Date label */}
          <p className="text-[11px] text-muted-foreground/50">{dayLabel}</p>

          {/* Time */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="block text-[9px] font-bold text-muted-foreground/50 uppercase mb-0.5">Inicio</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full h-8 rounded-lg border border-border/60 bg-foreground/[0.03] px-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-accent/40"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[9px] font-bold text-muted-foreground/50 uppercase mb-0.5">Fim</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full h-8 rounded-lg border border-border/60 bg-foreground/[0.03] px-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-accent/40"
              />
            </div>
          </div>

          {/* Color picker */}
          <div className="flex items-center gap-1.5">
            {EVENT_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                className={`h-5 w-5 rounded-full transition-all ${
                  color === c.value ? "ring-2 ring-offset-1 ring-offset-background" : "hover:scale-110"
                }`}
                style={{
                  backgroundColor: c.value,
                  ...(color === c.value ? { ringColor: c.value } : {}),
                }}
              />
            ))}
          </div>

          {/* Recurrence toggle */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setRecurrence(null)}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                recurrence === null
                  ? "bg-foreground/[0.08] border border-border text-foreground"
                  : "border border-border/40 text-muted-foreground/60 hover:text-muted-foreground"
              }`}
            >
              Uma vez
            </button>
            <button
              onClick={() => setRecurrence("weekly")}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                recurrence === "weekly"
                  ? "bg-foreground/[0.08] border border-border text-foreground"
                  : "border border-border/40 text-muted-foreground/60 hover:text-muted-foreground"
              }`}
            >
              <Repeat className="h-3 w-3" />
              Toda semana
            </button>
          </div>

          {/* Error */}
          {error && (
            <p className="text-[11px] text-rose-400 bg-rose-500/[0.08] border border-rose-500/20 rounded-lg px-2.5 py-1.5">
              {error}
            </p>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={isPending || !title.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-lg py-2 text-[12px] font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: color }}
          >
            {isPending ? "Salvando..." : existingEvent ? "Salvar" : "Criar evento"}
          </button>
        </div>
      </motion.div>
    </>
  )
}

// ─── Event Popover (view/edit/delete) ────────────────────────────────────────

function EventPopover({
  event,
  x,
  y,
  onEdit,
  onDelete,
  onClose,
}: {
  event: CalendarEvent
  x: number
  y: number
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ left: x, top: y })
  const [deleteMode, setDeleteMode] = useState<null | "pick" | "all">(null)
  const deleteEvent = useDeleteCalendarEvent()
  const deleteOccurrence = useDeleteCalendarEventOccurrence()
  const isRecurring = event.recurrence === "weekly"

  useEffect(() => {
    const adjust = () => {
      if (!cardRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      const pad = 12
      let left = x + 12
      let top = y - 20
      if (left + rect.width + pad > window.innerWidth) left = x - rect.width - 12
      if (top + rect.height + pad > window.innerHeight) top = window.innerHeight - rect.height - pad
      if (left < pad) left = pad
      if (top < pad) top = pad
      setPos({ left, top })
    }
    adjust()
    const raf = requestAnimationFrame(adjust)
    return () => cancelAnimationFrame(raf)
  }, [x, y])

  const handleDeleteAll = async () => {
    if (deleteMode !== "all") { setDeleteMode("all"); return }
    await deleteEvent.mutateAsync(event.id)
    onClose()
  }

  const handleDeleteOccurrence = async () => {
    const dateStr = event.occurrenceDate ?? (typeof event.date === "string" ? event.date.slice(0, 10) : new Date(event.date).toISOString().slice(0, 10))
    await deleteOccurrence.mutateAsync({ id: event.id, date: dateStr })
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: -6, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.97 }}
        transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
        className="fixed z-50 w-[220px] rounded-xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden"
        style={{ left: pos.left, top: pos.top }}
      >
        {/* Colored top bar */}
        <div className="h-1" style={{ backgroundColor: event.color }} />

        <div className="p-3 space-y-2">
          <p className="text-[13px] font-bold text-foreground">{event.title}</p>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
            <Clock className="h-3 w-3" />
            <span>{event.startTime} – {event.endTime}</span>
          </div>
          {event.recurrence === "weekly" && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
              <Repeat className="h-3 w-3" />
              <span>Toda semana</span>
            </div>
          )}
          {event.description && (
            <p className="text-[11px] text-muted-foreground/60">{event.description}</p>
          )}

          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center gap-1.5">
              <button
                onClick={onEdit}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium border border-border/60 text-foreground hover:bg-foreground/[0.04] transition-colors"
              >
                <Pencil className="h-3 w-3" />
                Editar
              </button>
              {!isRecurring && (
                <button
                  onClick={handleDeleteAll}
                  disabled={deleteEvent.isPending}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium border transition-colors ${
                    deleteMode === "all"
                      ? "border-rose-500/40 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                      : "border-border/60 text-foreground hover:bg-foreground/[0.04]"
                  }`}
                >
                  <Trash className="h-3 w-3" />
                  {deleteEvent.isPending ? "..." : deleteMode === "all" ? "Confirmar" : "Excluir"}
                </button>
              )}
            </div>
            {isRecurring && deleteMode === null && (
              <div className="flex flex-col gap-1">
                <button
                  onClick={handleDeleteOccurrence}
                  disabled={deleteOccurrence.isPending}
                  className="w-full flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium border border-border/60 text-foreground hover:bg-foreground/[0.04] transition-colors"
                >
                  <Trash className="h-3 w-3" />
                  {deleteOccurrence.isPending ? "..." : "Somente esta ocorrência"}
                </button>
                <button
                  onClick={() => setDeleteMode("all")}
                  className="w-full flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium border border-border/60 text-foreground hover:bg-foreground/[0.04] transition-colors"
                >
                  <Trash className="h-3 w-3" />
                  Todas as ocorrências
                </button>
              </div>
            )}
            {isRecurring && deleteMode === "all" && (
              <button
                onClick={handleDeleteAll}
                disabled={deleteEvent.isPending}
                className="w-full flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium border border-rose-500/40 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
              >
                <Trash className="h-3 w-3" />
                {deleteEvent.isPending ? "..." : "Confirmar exclusão total"}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </>
  )
}

// ─── Hover time indicator (shows time on mouse position) ─────────────────────

function useHoverTime(containerRef: React.RefObject<HTMLDivElement | null>, enabled: boolean) {
  const [hoverTime, setHoverTime] = useState<{ time: string; top: number } | null>(null)

  useEffect(() => {
    if (!enabled) return
    const el = containerRef.current
    if (!el) return

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const localY = e.clientY - rect.top + el.scrollTop
      const min = snapTo15(pxToMinutes(localY))
      const firstMin = HOURS[0] * 60
      const lastMin = HOURS[HOURS.length - 1] * 60
      if (min < firstMin || min > lastMin) {
        setHoverTime(null)
        return
      }
      setHoverTime({
        time: minutesToHHMM(min),
        top: minutesToPx(min),
      })
    }
    const onLeave = () => setHoverTime(null)

    el.addEventListener("mousemove", onMove)
    el.addEventListener("mouseleave", onLeave)
    return () => {
      el.removeEventListener("mousemove", onMove)
      el.removeEventListener("mouseleave", onLeave)
    }
  }, [containerRef, enabled])

  return hoverTime
}

// ─── Day Context Menu ─────────────────────────────────────────────────────────

function DayContextMenu({
  date,
  x,
  y,
  blockSource,
  slot,
  onBlockDay,
  onUnblockDay,
  onBlockSlot,
  onBlockRange,
  onSchedule,
  onClose,
  canEdit,
}: {
  date: Date
  x: number
  y: number
  blockSource: { type: "exception" } | { type: "blockRange" } | null
  slot?: { startTime: string; endTime: string }
  onBlockDay: () => void
  onUnblockDay: () => void
  onBlockSlot: () => void
  onBlockRange: () => void
  onSchedule: () => void
  onClose: () => void
  canEdit: boolean
}) {
  if (!canEdit) return null
  const isBlocked = !!blockSource
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed z-50 min-w-[180px] rounded-xl border border-border/60 bg-background/95 backdrop-blur py-1 shadow-xl"
        style={{ left: x, top: y }}
      >
        <button
          onClick={() => { onSchedule(); onClose() }}
          className="w-full flex items-center gap-2 px-4 py-2 text-left text-[12px] text-foreground hover:bg-foreground/[0.06]"
        >
          <CalendarBlank className="h-3.5 w-3.5 text-accent" weight="duotone" />
          Agendar consulta
        </button>
        <div className="mx-3 my-1 border-t border-foreground/[0.06]" />
        {slot && !isBlocked && (
          <button
            onClick={() => { onBlockSlot(); onClose() }}
            className="w-full flex items-center gap-2 px-4 py-2 text-left text-[12px] text-foreground hover:bg-foreground/[0.06]"
          >
            <Lock className="h-3.5 w-3.5 text-amber-400" />
            Bloquear {slot.startTime}–{slot.endTime}
          </button>
        )}
        {isBlocked ? (
          <button
            onClick={() => { onUnblockDay(); onClose() }}
            className="w-full flex items-center gap-2 px-4 py-2 text-left text-[12px] text-foreground hover:bg-foreground/[0.06]"
          >
            <LockOpen className="h-3.5 w-3.5 text-emerald-400" />
            Desbloquear dia
          </button>
        ) : (
          <button
            onClick={() => { onBlockDay(); onClose() }}
            className="w-full flex items-center gap-2 px-4 py-2 text-left text-[12px] text-foreground hover:bg-foreground/[0.06]"
          >
            <Lock className="h-3.5 w-3.5 text-amber-400" />
            Bloquear dia
          </button>
        )}
        <button
          onClick={() => { onBlockRange(); onClose() }}
          className="w-full flex items-center gap-2 px-4 py-2 text-left text-[12px] text-foreground hover:bg-foreground/[0.06]"
        >
          <Lock className="h-3.5 w-3.5 text-amber-400" />
          Bloquear período
        </button>
      </motion.div>
    </>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProfessionalCalendar({
  professionalId,
  professionalName,
  canEdit,
  accentColor = "#22c55e",
  onBackToAll,
  allProfessionals,
  onSwitchProfessional,
}: {
  professionalId: string
  professionalName: string
  canEdit: boolean
  accentColor?: string
  /** Se passado, exibe botão para voltar à visão de todos os profissionais (Admin/Secretary) */
  onBackToAll?: () => void
  /** Lista de todos os profissionais para switcher inline (admin only) */
  allProfessionals?: { id: string; fullName: string; calendarColor: string }[]
  /** Callback para trocar de profissional inline */
  onSwitchProfessional?: (id: string) => void
}) {
  const [viewMode, setViewMode] = useState<ViewMode>("week")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [novoAgendamentoOpen, setNovoAgendamentoOpen] = useState(false)
  const [novoAgendamentoDate, setNovoAgendamentoDate] = useState<Date | undefined>(undefined)
  const [novoAgendamentoTime, setNovoAgendamentoTime] = useState<string | undefined>(undefined)
  const [contextMenu, setContextMenu] = useState<{
    date: Date
    x: number
    y: number
    slot?: { startTime: string; endTime: string }
  } | null>(null)
  const [blockDayModal, setBlockDayModal] = useState<Date | null>(null)
  const [blockRangeModal, setBlockRangeModal] = useState<{ from: Date; to: Date } | null>(null)
  const [quickSchedule, setQuickSchedule] = useState<{
    date: Date
    time: string
    x: number
    y: number
  } | null>(null)
  const [toast, setToast] = useState<{ msg: string; variant: "error" | "info" } | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<CalendarAppointment | null>(null)
  // Calendar events state
  const updateEventMut = useUpdateCalendarEvent()
  // Action picker: shown on grid click to choose between agenda/event
  const [actionPicker, setActionPicker] = useState<{
    date: Date
    time: string
    x: number
    y: number
  } | null>(null)
  const [inlineEvent, setInlineEvent] = useState<{
    date: Date
    time: string
    x: number
    y: number
    existingEvent?: CalendarEvent | null
  } | null>(null)
  // Live preview state synced from InlineEventCard
  const [eventPreview, setEventPreview] = useState<{
    date: Date
    startTime: string
    endTime: string
    color: string
    title: string
  } | null>(null)
  // Drag state for existing events
  const [draggingEvent, setDraggingEvent] = useState<{
    event: CalendarEvent
    originCol: number
    originMin: number
    currentCol: number
    currentMin: number
  } | null>(null)
  const dragRef = useRef<{ startX: number; startY: number; colWidth: number } | null>(null)
  const justDraggedRef = useRef(false)
  // Optimistic override: event ID → { date, startTime, endTime } applied immediately on drop
  const [optimisticMoves, setOptimisticMoves] = useState<Map<string, { date: string; startTime: string; endTime: string }>>(new Map())
  const [eventPopover, setEventPopover] = useState<{
    event: CalendarEvent
    x: number
    y: number
  } | null>(null)
  const gridScrollRef = useRef<HTMLDivElement>(null)
  const hoverTime = useHoverTime(gridScrollRef, canEdit && viewMode === "week")

  const { data: professional, isLoading: loadingProf } = useProfessional(professionalId)
  const {
    addException,
    removeException,
    addBlockRange,
  } = useProfessionalMutations(professionalId)

  const fromDate = useMemo(() => {
    if (viewMode === "week") {
      const d = new Date(selectedDate)
      d.setDate(d.getDate() - d.getDay())
      return d
    }
    const y = selectedDate.getFullYear()
    const m = selectedDate.getMonth()
    const firstOfMonth = new Date(y, m, 1)
    const d = new Date(firstOfMonth)
    d.setDate(d.getDate() - d.getDay())
    return d
  }, [selectedDate, viewMode])

  const toDate = useMemo(() => {
    if (viewMode === "week") {
      const d = new Date(fromDate)
      d.setDate(d.getDate() + 6)
      return d
    }
    const y = selectedDate.getFullYear()
    const m = selectedDate.getMonth()
    const lastOfMonth = new Date(y, m + 1, 0)
    const d = new Date(lastOfMonth)
    d.setDate(d.getDate() + (6 - d.getDay()))
    return d
  }, [fromDate, selectedDate, viewMode])

  const { data: overridesInRange } = useProfessionalOverrides(
    professionalId,
    toYMD(fromDate),
    toYMD(toDate)
  )

  const availability = professional?.availability ?? []
  const exceptions = (professional?.availabilityExceptions ?? []) as AvailabilityException[]
  const overrides = overridesInRange ?? professional?.availabilityOverrides ?? []
  const blockRanges = professional?.availabilityBlockRanges ?? []

  const appointmentsParams = useMemo(
    () => ({
      professionalId,
      from: toYMD(fromDate),
      to: toYMD(toDate),
      limit: 100,
    }),
    [professionalId, fromDate, toDate]
  )

  const { data: appointmentsData } = useAppointments(appointmentsParams)
  const appointments = useMemo(
    () => (appointmentsData?.data ?? []).map(toCalendarAppointment),
    [appointmentsData]
  )

  const calendarEventsParams = useMemo(
    () => ({
      professionalId,
      from: toYMD(fromDate),
      to: toYMD(toDate),
    }),
    [professionalId, fromDate, toDate]
  )
  const { data: calendarEventsData } = useCalendarEvents(calendarEventsParams)
  const calendarEvents = useMemo(
    () => calendarEventsData?.data ?? [],
    [calendarEventsData]
  )

  const weekDays = useMemo(() => {
    const start = new Date(selectedDate)
    start.setDate(start.getDate() - start.getDay())
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [selectedDate])

  const opts = useMemo(
    () => ({
      availability,
      exceptions,
      overrides,
      blockRanges,
    }),
    [availability, exceptions, overrides, blockRanges]
  )

  return (
    <TooltipProvider>
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col border-b border-border/40 shrink-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            {onBackToAll && (
              <button
                onClick={onBackToAll}
                className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-border/60 text-foreground/85 hover:text-foreground hover:bg-foreground/[0.04] text-[12px] font-medium"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Ver todos
              </button>
            )}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() =>
                  setSelectedDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - (viewMode === "week" ? 7 : 1)))
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-foreground/85 hover:text-foreground/85"
              >
                <CaretLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() =>
                  setSelectedDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + (viewMode === "week" ? 7 : 1)))
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-foreground/85 hover:text-foreground/85"
              >
                <CaretRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <h1 className="text-[16px] font-black text-foreground">
              {viewMode === "week"
                ? `Semana de ${weekDays[0]?.getDate()} – ${weekDays[6]?.getDate()} ${MONTHS_PT[selectedDate.getMonth()]}`
                : `${MONTHS_PT[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`}
            </h1>
            <button
              onClick={() => {
                setSelectedDate(new Date())
              }}
              className="text-[11px] font-bold text-accent border border-accent/25 rounded-lg px-2.5 py-1"
            >
              Hoje
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-border/60 bg-foreground/[0.02] p-0.5">
              {(["week", "month"] as ViewMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  className={`relative px-3 py-1 text-[11px] font-bold rounded-md cursor-pointer ${
                    viewMode === m ? "text-foreground" : "text-foreground/85 hover:text-foreground/85"
                  }`}
                >
                  {viewMode === m && (
                    <motion.div
                      layoutId="view-pill-pro"
                      className="absolute inset-0 bg-foreground/[0.07] rounded-md"
                      transition={{ duration: 0.25, ease }}
                    />
                  )}
                  <span className="relative z-10">{m === "week" ? "Semana" : "Mês"}</span>
                </button>
              ))}
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setNovoAgendamentoOpen(true)}
                  className="flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3.5 text-[12px] font-bold text-accent-foreground"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Agendar
                </button>
              </TooltipTrigger>
              <TooltipContent>Novo agendamento</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Edit hint */}
        {canEdit && (
          <div className="px-6 pb-3 text-[10px]">
            <span className="text-muted-foreground/60">
              Clique no horário para agendar ou criar evento
            </span>
          </div>
        )}

        {/* Professional switcher strip (admin with multiple professionals) */}
        {allProfessionals && allProfessionals.length > 1 && onSwitchProfessional && (
          <div className="flex items-center gap-1.5 px-6 pb-3 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider shrink-0 mr-1">Profissionais</span>
            {allProfessionals.map((p) => {
              const active = p.id === professionalId
              return (
                <button
                  key={p.id}
                  onClick={() => onSwitchProfessional(p.id)}
                  className={`relative shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition-all duration-200 cursor-pointer ${
                    active ? "text-foreground" : "text-muted-foreground/70 hover:text-muted-foreground"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="pro-switch-pill"
                      className="absolute inset-0 rounded-full border"
                      style={{
                        backgroundColor: `${p.calendarColor}12`,
                        borderColor: `${p.calendarColor}30`,
                      }}
                      transition={{ duration: 0.22, ease }}
                    />
                  )}
                  <span
                    className="relative z-10 h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: p.calendarColor || "#3b82f6" }}
                  />
                  <span className="relative z-10">{p.fullName.split(" ")[0]}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Body: Week view */}
      <div className="flex-1 overflow-auto">
        {loadingProf ? (
          <AilumLoader variant="section" />
        ) : viewMode === "week" ? (
          <>
          {/* Legend */}
          <div className="flex items-center gap-4 px-4 py-1.5 border-b border-foreground/[0.04] text-[10px] text-muted-foreground/60">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-background border border-border/60" />
              Disponível
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "repeating-linear-gradient(-45deg, transparent, transparent 2px, rgba(255,255,255,0.04) 2px, rgba(255,255,255,0.04) 4px)" }} />
              Fora do horário
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "repeating-linear-gradient(-45deg, rgba(0,0,0,0.15), rgba(0,0,0,0.15) 2px, rgba(245,158,11,0.25) 2px, rgba(245,158,11,0.25) 4px)" }} />
              Bloqueado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-blue-500/50 border border-blue-500/60" />
              Consulta
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500/30 border-l-2 border-indigo-500" />
              Evento
            </span>
          </div>

          <div className="flex border-b border-border min-w-[800px] shrink-0">
            <div className="w-14 shrink-0" />
            <div className="flex-1 grid grid-cols-7">
            {weekDays.map((d) => {
              const today = d.toDateString() === new Date().toDateString()
              const dayAvail = computeDayAvailability(d, opts)
              return (
                <button
                  key={d.toISOString()}
                  onClick={(e) => {
                    if (canEdit) {
                      setContextMenu({
                        date: d,
                        x: e.clientX,
                        y: e.clientY,
                      })
                    }
                  }}
                  className={`py-2 flex flex-col items-center gap-0.5 border-l border-border/80 ${
                    today ? "bg-accent/5" : "hover:bg-foreground/[0.02]"
                  }`}
                >
                  <span className="text-[9px] font-extrabold uppercase text-foreground">
                    {WEEKDAYS[d.getDay()]}
                  </span>
                  <span
                    className={`h-6 w-6 flex items-center justify-center rounded-full text-[12px] font-bold ${
                      today ? "bg-accent text-accent-foreground" : "text-foreground/85"
                    }`}
                  >
                    {d.getDate()}
                  </span>
                  {dayAvail.blocked && (
                    <Lock className="h-3 w-3 text-amber-400/80" weight="fill" />
                  )}
                </button>
              )
            })}
            </div>
          </div>

          <div ref={gridScrollRef} className="flex-1 overflow-y-auto overflow-x-auto min-w-0 relative">
            {/* Hover time indicator */}
            {hoverTime && !quickSchedule && (
              <div
                className="absolute left-0 w-14 z-30 pointer-events-none flex items-center justify-end pr-1.5"
                style={{ top: hoverTime.top - 9 }}
              >
                <span className="text-[9px] font-bold text-accent bg-background/90 rounded px-1 py-0.5 tabular-nums font-mono">
                  {hoverTime.time}
                </span>
              </div>
            )}
            {hoverTime && !quickSchedule && (
              <div
                className="absolute left-14 right-0 z-20 pointer-events-none"
                style={{ top: hoverTime.top }}
              >
                <div className="h-px bg-accent/20 w-full" />
              </div>
            )}
            <div className="flex min-w-[800px] min-h-[500px]">
              {/* Hour labels */}
              <div className="w-14 shrink-0 flex flex-col">
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="flex items-start justify-end pr-2 pt-0.5 -mt-[1px]"
                    style={{ height: HOUR_HEIGHT }}
                  >
                    <span className="text-[9px] font-bold text-foreground font-mono tabular-nums">
                      {String(hour).padStart(2, "0")}:00
                    </span>
                  </div>
                ))}
              </div>

              {/* Day columns */}
              <div className="flex-1 grid grid-cols-7">
                {weekDays.map((d) => {
                  const dayAvail = computeDayAvailability(d, opts)
                  const dayApts = appointments.filter(
                    (a) =>
                      a.day === d.getDate() &&
                      a.month === d.getMonth() &&
                      a.year === d.getFullYear()
                  )
                  const dYMD = toYMD(d)
                  const dayEvents = calendarEvents
                    .map((ev) => {
                      const evKey = `${ev.id}-${ev.occurrenceDate ?? ""}`
                      const opt = optimisticMoves.get(evKey)
                      if (opt) return { ...ev, date: opt.date, startTime: opt.startTime, endTime: opt.endTime, occurrenceDate: opt.date }
                      return ev
                    })
                    .filter((ev) => {
                      const evDate = ev.occurrenceDate ?? (typeof ev.date === "string" ? ev.date.slice(0, 10) : "")
                      return evDate === dYMD
                    })
                  return (
                    <div
                      key={d.toISOString()}
                      className="relative border-l border-border/80"
                      style={{
                        minHeight: DAY_HEIGHT,
                        cursor: canEdit && !dayAvail.blocked ? "pointer" : undefined,
                      }}
                      onClick={
                        canEdit && !dayAvail.blocked
                          ? (e) => {
                              if (justDraggedRef.current) {
                                justDraggedRef.current = false
                                return
                              }
                              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                              const localY = Math.max(0, Math.min(rect.height, e.clientY - rect.top))
                              const clickedMin = snapTo15(pxToMinutes(localY))
                              const time = minutesToHHMM(clickedMin)
                              setActionPicker({ date: d, time, x: e.clientX, y: e.clientY })
                            }
                          : undefined
                      }
                    >
                      {/* Hour + half-hour lines */}
                      {HOURS.slice(0, -1).map((hour) => (
                        <div key={hour}>
                          <div
                            className="absolute left-0 right-0 border-t border-foreground/[0.06]"
                            style={{ top: (hour - 7) * HOUR_HEIGHT }}
                          />
                          <div
                            className="absolute left-0 right-0 border-t border-dashed border-white/[0.03]"
                            style={{ top: (hour - 7) * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
                          />
                        </div>
                      ))}

                      {/* Default: neutral hatch covering entire column — "no schedule" */}
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: "repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(255,255,255,0.025) 4px, rgba(255,255,255,0.025) 8px)",
                        }}
                      />

                      {/* Blocked overlay (amber hatch, replaces neutral) */}
                      {dayAvail.blocked && (
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: "repeating-linear-gradient(-45deg, rgba(0,0,0,0.15), rgba(0,0,0,0.15) 4px, rgba(245,158,11,0.20) 4px, rgba(245,158,11,0.20) 8px)",
                          }}
                        />
                      )}

                      {/* Available hours — clear the hatch where professional is available */}
                      {!dayAvail.blocked &&
                        dayAvail.slots.map((slot, i) => {
                          const top = timeToTop(slot.startTime)
                          const h = Math.max(4, timeToTop(slot.endTime) - top)
                          return (
                            <div
                              key={`avail-${slot.startTime}-${slot.endTime}-${i}`}
                              className="absolute left-0 right-0 pointer-events-none"
                              style={{
                                top,
                                height: h,
                                backgroundColor: "var(--background)",
                              }}
                            />
                          )
                        })}
                      {/* Quick schedule indicator — shows clicked time */}
                      {/* Appointments */}
                      {dayApts.map((apt) => {
                        const top = timeToTop(apt.time)
                        const h = Math.max(26, durationToPx(apt.duration) - 4)
                        const initial = (apt.patientName ?? "?")[0]?.toUpperCase() ?? "?"
                        const showService = h >= 44
                        return (
                          <button
                            key={apt.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedAppointment(apt)
                            }}
                            className={`absolute left-1 right-1 rounded-md px-1.5 py-1 text-left cursor-pointer hover:ring-2 hover:ring-accent/40 transition-all overflow-hidden z-[2] ${
                              apt.status === "confirmed"
                                ? "bg-blue-500/50 border border-blue-500/60 text-foreground"
                                : apt.status === "cancelled"
                                  ? "bg-foreground/[0.04] border border-border/70 opacity-40 line-through"
                                  : "border border-dashed border-white/30 bg-foreground/[0.06] text-foreground"
                            }`}
                            style={{ top, height: h }}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-black shrink-0 ${
                                apt.status === "confirmed" ? "bg-blue-400/30 text-foreground" : "bg-foreground/10 text-muted-foreground/80"
                              }`}>
                                {initial}
                              </span>
                              <span className="text-[9px] font-bold truncate">{apt.patientName.split(" ")[0]}</span>
                              <span className="text-[8px] font-medium opacity-60 shrink-0 ml-auto">{apt.time}</span>
                            </div>
                            {showService && (
                              <p className="text-[8px] font-medium opacity-50 truncate mt-0.5 pl-[22px]">{apt.type}</p>
                            )}
                          </button>
                        )
                      })}

                      {/* Calendar events */}
                      {dayEvents.map((ev) => {
                        const isDragging = draggingEvent?.event.id === ev.id && draggingEvent?.event.occurrenceDate === ev.occurrenceDate
                        const evTop = timeToTop(ev.startTime)
                        const evStartMin = timeToMinutes(ev.startTime)
                        const evEndMin = timeToMinutes(ev.endTime)
                        const evH = Math.max(20, durationToPx(evEndMin - evStartMin) - 4)
                        const showTime = evH >= 32
                        const colIdx = weekDays.findIndex((wd) => wd.getDate() === d.getDate() && wd.getMonth() === d.getMonth())
                        return (
                          <button
                            key={`ev-${ev.id}-${ev.occurrenceDate ?? ""}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (draggingEvent) return
                              setEventPopover({
                                event: ev,
                                x: e.clientX,
                                y: e.clientY,
                              })
                            }}
                            onMouseDown={(e) => {
                              if (!canEdit) return
                              e.stopPropagation()
                              const colEl = (e.currentTarget.parentElement as HTMLElement)
                              const colRect = colEl.getBoundingClientRect()
                              dragRef.current = {
                                startX: e.clientX,
                                startY: e.clientY,
                                colWidth: colRect.width,
                              }
                              const startMin = evStartMin

                              const onMove = (me: MouseEvent) => {
                                if (!dragRef.current) return
                                const dx = me.clientX - dragRef.current.startX
                                const dy = me.clientY - dragRef.current.startY
                                // Only start dragging after 5px threshold
                                if (!draggingEvent && Math.abs(dx) < 5 && Math.abs(dy) < 5) return
                                const colShift = Math.round(dx / dragRef.current.colWidth)
                                const minShift = snapTo15(Math.round(dy / (HOUR_HEIGHT / 60)))
                                setDraggingEvent({
                                  event: ev,
                                  originCol: colIdx,
                                  originMin: startMin,
                                  currentCol: Math.max(0, Math.min(6, colIdx + colShift)),
                                  currentMin: Math.max(HOURS[0] * 60, startMin + minShift),
                                })
                              }

                              const onUp = () => {
                                window.removeEventListener("mousemove", onMove)
                                window.removeEventListener("mouseup", onUp)
                                dragRef.current = null

                                setDraggingEvent((prev) => {
                                  if (prev && (prev.currentCol !== prev.originCol || prev.currentMin !== prev.originMin)) {
                                    justDraggedRef.current = true
                                    setTimeout(() => { justDraggedRef.current = false }, 100)

                                    const newDate = weekDays[prev.currentCol]
                                    const dateStr = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, "0")}-${String(newDate.getDate()).padStart(2, "0")}`
                                    const durMin = timeToMinutes(prev.event.endTime) - timeToMinutes(prev.event.startTime)
                                    const newStart = minutesToHHMM(prev.currentMin)
                                    const newEnd = minutesToHHMM(prev.currentMin + durMin)

                                    // Optimistic: move event instantly in UI
                                    const evKey = `${prev.event.id}-${prev.event.occurrenceDate ?? ""}`
                                    setOptimisticMoves((m) => { const n = new Map(m); n.set(evKey, { date: dateStr, startTime: newStart, endTime: newEnd }); return n })

                                    updateEventMut.mutate(
                                      { id: prev.event.id, body: { date: dateStr, startTime: newStart, endTime: newEnd } },
                                      { onSettled: () => setOptimisticMoves((m) => { const n = new Map(m); n.delete(evKey); return n }) },
                                    )
                                  }
                                  return null
                                })
                              }

                              window.addEventListener("mousemove", onMove)
                              window.addEventListener("mouseup", onUp)
                            }}
                            className={`absolute left-1 right-1 rounded-md px-1.5 py-1 text-left cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-white/20 transition-all overflow-hidden z-[3] ${isDragging ? "opacity-30" : ""}`}
                            style={{
                              top: evTop,
                              height: evH,
                              backgroundColor: `${ev.color}20`,
                              borderLeft: `3px solid ${ev.color}`,
                              borderTop: `1px solid ${ev.color}30`,
                              borderRight: `1px solid ${ev.color}30`,
                              borderBottom: `1px solid ${ev.color}30`,
                            }}
                          >
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="text-[9px] font-bold truncate" style={{ color: ev.color }}>
                                {ev.title}
                              </span>
                              {ev.recurrence === "weekly" && (
                                <Repeat className="h-2.5 w-2.5 shrink-0 opacity-60" style={{ color: ev.color }} />
                              )}
                            </div>
                            {showTime && (
                              <p className="text-[8px] font-medium opacity-60 mt-0.5" style={{ color: ev.color }}>
                                {ev.startTime} – {ev.endTime}
                              </p>
                            )}
                          </button>
                        )
                      })}

                      {/* Event preview ghost */}
                      {eventPreview && eventPreview.date.getDate() === d.getDate() && eventPreview.date.getMonth() === d.getMonth() && eventPreview.date.getFullYear() === d.getFullYear() && (
                        <div
                          className="absolute left-1 right-1 rounded-md px-1.5 py-1 pointer-events-none z-[2] animate-pulse"
                          style={{
                            top: timeToTop(eventPreview.startTime),
                            height: Math.max(20, durationToPx(timeToMinutes(eventPreview.endTime) - timeToMinutes(eventPreview.startTime)) - 4),
                            backgroundColor: `${eventPreview.color}15`,
                            borderLeft: `3px solid ${eventPreview.color}80`,
                            border: `1px dashed ${eventPreview.color}50`,
                            borderLeftWidth: 3,
                            borderLeftStyle: "solid",
                          }}
                        >
                          <span className="text-[9px] font-bold truncate opacity-70" style={{ color: eventPreview.color }}>
                            {eventPreview.title || "Novo evento"}
                          </span>
                        </div>
                      )}

                      {/* Drag ghost */}
                      {draggingEvent && (() => {
                        const colDate = d
                        const colIdx = weekDays.findIndex((wd) => wd.getDate() === colDate.getDate() && wd.getMonth() === colDate.getMonth())
                        if (colIdx !== draggingEvent.currentCol) return null
                        const durMin = timeToMinutes(draggingEvent.event.endTime) - timeToMinutes(draggingEvent.event.startTime)
                        const ghostStart = minutesToHHMM(draggingEvent.currentMin)
                        const ghostEnd = minutesToHHMM(draggingEvent.currentMin + durMin)
                        const ghostH = Math.max(20, durationToPx(durMin) - 4)
                        return (
                          <div
                            className="absolute left-1 right-1 rounded-md px-1.5 py-1 pointer-events-none z-[5]"
                            style={{
                              top: minutesToPx(draggingEvent.currentMin),
                              height: ghostH,
                              backgroundColor: `${draggingEvent.event.color}25`,
                              borderLeft: `3px solid ${draggingEvent.event.color}`,
                              border: `2px solid ${draggingEvent.event.color}60`,
                              borderLeftWidth: 3,
                            }}
                          >
                            <span className="text-[9px] font-bold truncate" style={{ color: draggingEvent.event.color }}>
                              {draggingEvent.event.title}
                            </span>
                            <p className="text-[8px] font-bold mt-0.5" style={{ color: draggingEvent.event.color }}>
                              {ghostStart} – {ghostEnd}
                            </p>
                          </div>
                        )
                      })()}

                      {/* Now indicator */}
                      {(() => {
                        const now = new Date()
                        const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
                        if (!isToday) return null
                        const nowMin = now.getHours() * 60 + now.getMinutes()
                        const firstMin = HOURS[0] * 60
                        const lastMin = HOURS[HOURS.length - 1] * 60
                        if (nowMin < firstMin || nowMin > lastMin) return null
                        const topPx = minutesToPx(nowMin)
                        return (
                          <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: topPx }}>
                            <div className="relative">
                              <div className="absolute -left-[3px] -top-[3px] h-[7px] w-[7px] rounded-full bg-rose-500" />
                              <div className="h-[1.5px] bg-rose-500/80 w-full" />
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          </>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-7 border-b border-border">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="py-2 text-center text-[10px] font-extrabold uppercase tracking-widest text-foreground"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7" style={{ gridAutoRows: "minmax(80px, 1fr)" }}>
              {(() => {
                const y = selectedDate.getFullYear()
                const m = selectedDate.getMonth()
                const firstDay = new Date(y, m, 1).getDay()
                const daysInMonth = new Date(y, m + 1, 0).getDate()
                const days: (number | null)[] = []
                for (let i = 0; i < firstDay; i++) days.push(null)
                for (let d = 1; d <= daysInMonth; d++) days.push(d)
                while (days.length % 7 !== 0) days.push(null)
                const today = new Date()
                return days.map((day, i) => {
                  if (day === null) {
                    return <div key={`empty-${i}`} className="border-b border-r border-border/80 p-1" />
                  }
                  const d = new Date(y, m, day)
                  const dayAvail = computeDayAvailability(d, opts)
                  const dayApts = appointments.filter(
                    (a) => a.day === day && a.month === m && a.year === y
                  )
                  const isToday =
                    day === today.getDate() && m === today.getMonth() && y === today.getFullYear()
                  return (
                    <div
                      key={i}
                      role={canEdit ? "button" : undefined}
                      tabIndex={canEdit ? 0 : undefined}
                      onClick={(e) => {
                        if (canEdit) {
                          setContextMenu({
                            date: d,
                            x: e.clientX,
                            y: e.clientY,
                          })
                        }
                      }}
                      onKeyDown={(e) => {
                        if (canEdit && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault()
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                          setContextMenu({ date: d, x: rect.left, y: rect.top })
                        }
                      }}
                      className={`flex flex-col gap-1 p-2 border-b border-r border-border/80 text-left transition-colors ${
                        canEdit ? "cursor-pointer hover:bg-foreground/[0.02]" : ""
                      } ${isToday ? "bg-accent/10" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`h-6 w-6 flex items-center justify-center rounded-full text-[12px] font-bold ${
                            isToday ? "bg-accent text-accent-foreground" : "text-foreground"
                          }`}
                        >
                          {day}
                        </span>
                        {dayAvail.blocked ? (
                          <Lock className="h-3 w-3 text-amber-400/80 shrink-0" weight="fill" />
                        ) : dayAvail.slots.length > 0 ? (
                          <span
                            className="h-1.5 w-1.5 rounded-full shrink-0"
                            style={{
                              backgroundColor: dayAvail.slots.some((s) => s.isOverride)
                                ? "#22c55e"
                                : accentColor,
                            }}
                          />
                        ) : null}
                      </div>
                      <div className="flex flex-col gap-0.5 min-h-0 flex-1">
                        {dayApts.slice(0, 3).map((apt) => (
                          <button
                            key={apt.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedAppointment(apt)
                            }}
                            className={`w-full text-left rounded px-1 py-0.5 text-[8px] font-semibold truncate cursor-pointer hover:ring-1 hover:ring-accent/40 transition-all ${
                              apt.status === "confirmed"
                                ? "bg-blue-500/40 text-blue-200"
                                : apt.status === "cancelled"
                                  ? "opacity-40 line-through"
                                  : "bg-foreground/[0.06] text-foreground/85"
                            }`}
                          >
                            {apt.time} {apt.patientName.split(" ")[0]}
                          </button>
                        ))}
                        {dayApts.length > 3 && (
                          <span className="text-[8px] text-foreground/85">+{dayApts.length - 3}</span>
                        )}
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <BlockDayModal
        open={!!blockDayModal}
        date={blockDayModal}
        onClose={() => setBlockDayModal(null)}
        onConfirm={(reason) => {
          if (!blockDayModal) return
          setBlockDayModal(null)
          addException.mutate(
            { date: toYMD(blockDayModal), isUnavailable: true, reason },
            { onError: () => setToast({ msg: "Falha ao bloquear dia.", variant: "error" }) }
          )
        }}
        isPending={addException.isPending}
      />

      <BlockRangeModal
        open={!!blockRangeModal}
        dateFrom={blockRangeModal?.from ?? null}
        dateTo={blockRangeModal?.to ?? null}
        onClose={() => setBlockRangeModal(null)}
        onConfirm={(from, to, reason) => {
          setBlockRangeModal(null)
          addBlockRange.mutate(
            { dateFrom: from, dateTo: to, reason },
            { onError: () => setToast({ msg: "Falha ao bloquear período.", variant: "error" }) }
          )
        }}
        isPending={addBlockRange.isPending}
      />

      {toast && (
        <AnimatePresence>
          <CalendarToast
            message={toast.msg}
            variant={toast.variant}
            onDismiss={() => setToast(null)}
          />
        </AnimatePresence>
      )}

      <AnimatePresence>
        {quickSchedule && (
          <QuickScheduleCard
            date={quickSchedule.date}
            time={quickSchedule.time}
            x={quickSchedule.x}
            y={quickSchedule.y}
            professionalId={professionalId}
            onBlock={() => {
              setBlockDayModal(quickSchedule.date)
            }}
            onClose={() => setQuickSchedule(null)}
          />
        )}
      </AnimatePresence>

      {/* Action picker — choose between appointment or event */}
      <AnimatePresence>
        {actionPicker && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setActionPicker(null)} aria-hidden />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -4 }}
              transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
              className="fixed z-50 flex gap-2 p-1.5 rounded-xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl shadow-black/30"
              style={{
                left: Math.min(actionPicker.x - 90, window.innerWidth - 200),
                top: Math.max(8, actionPicker.y - 50),
              }}
            >
              <button
                onClick={() => {
                  const ap = actionPicker
                  setActionPicker(null)
                  setQuickSchedule({ date: ap.date, time: ap.time, x: ap.x, y: ap.y })
                }}
                className="flex flex-col items-center gap-1.5 rounded-lg px-4 py-3 hover:bg-accent/10 transition-all cursor-pointer group"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
                  <CalendarBlank className="h-4 w-4 text-accent" weight="duotone" />
                </div>
                <span className="text-[11px] font-semibold text-foreground/85 group-hover:text-foreground">Agendar</span>
              </button>
              <div className="w-px bg-border/40 my-1" />
              <button
                onClick={() => {
                  const ap = actionPicker
                  setActionPicker(null)
                  setInlineEvent({ date: ap.date, time: ap.time, x: ap.x, y: ap.y })
                }}
                className="flex flex-col items-center gap-1.5 rounded-lg px-4 py-3 hover:bg-accent/10 transition-all cursor-pointer group"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 group-hover:bg-violet-500/20 transition-colors">
                  <Clock className="h-4 w-4 text-violet-400" weight="duotone" />
                </div>
                <span className="text-[11px] font-semibold text-foreground/85 group-hover:text-foreground">Evento</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {inlineEvent && (
          <InlineEventCard
            date={inlineEvent.date}
            time={inlineEvent.time}
            x={inlineEvent.x}
            y={inlineEvent.y}
            professionalId={professionalId}
            existingEvent={inlineEvent.existingEvent}
            onClose={() => { setInlineEvent(null); setEventPreview(null) }}
            onPreviewChange={setEventPreview}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {eventPopover && (
          <EventPopover
            event={eventPopover.event}
            x={eventPopover.x}
            y={eventPopover.y}
            onEdit={() => {
              const ev = eventPopover.event
              const evDate = ev.occurrenceDate
                ? new Date(ev.occurrenceDate + "T12:00:00")
                : new Date(typeof ev.date === "string" ? ev.date.slice(0, 10) + "T12:00:00" : ev.date)
              setEventPopover(null)
              setInlineEvent({
                date: evDate,
                time: ev.startTime,
                x: eventPopover.x,
                y: eventPopover.y,
                existingEvent: ev,
              })
            }}
            onDelete={() => setEventPopover(null)}
            onClose={() => setEventPopover(null)}
          />
        )}
      </AnimatePresence>

      {contextMenu && (
        <DayContextMenu
          date={contextMenu.date}
          x={contextMenu.x}
          y={contextMenu.y}
          blockSource={getBlockSource(contextMenu.date, { exceptions, blockRanges })}
          slot={contextMenu.slot}
          onBlockDay={() => setBlockDayModal(contextMenu.date)}
          onUnblockDay={() => {
            const src = getBlockSource(contextMenu!.date, { exceptions, blockRanges })
            if (!src) return
            if (src.type === "exception") {
              removeException.mutate(toYMD(contextMenu.date))
            } else {
              addException.mutate(
                { date: toYMD(contextMenu!.date), isUnavailable: false },
                { onError: () => setToast({ msg: "Falha ao desbloquear dia.", variant: "error" }) }
              )
            }
            setContextMenu(null)
          }}
          onBlockSlot={() => {
            const s = contextMenu!.slot
            if (!s) return
            const dateStr = toYMD(contextMenu!.date)
            const existing = exceptions.find(
              (e) => (e.date?.slice(0, 10) ?? e.date) === dateStr && e.isUnavailable === false && (e.slotMask?.length ?? 0) > 0
            )
            const newMaskInterval = { startTime: s.startTime, endTime: s.endTime }
            const mergedMask = existing?.slotMask
              ? [...(Array.isArray(existing.slotMask) ? existing.slotMask : []), newMaskInterval]
              : [newMaskInterval]
            const doAdd = () =>
              addException.mutate(
                { date: dateStr, isUnavailable: false, slotMask: mergedMask },
                { onError: () => setToast({ msg: "Falha ao bloquear horário.", variant: "error" }) }
              )
            if (existing) {
              removeException.mutate(dateStr, { onSuccess: () => doAdd() })
            } else {
              doAdd()
            }
            setContextMenu(null)
          }}
          onBlockRange={() =>
            setBlockRangeModal({
              from: contextMenu.date,
              to: new Date(contextMenu.date.getTime() + 86400000),
            })
          }
          onSchedule={() => {
            setNovoAgendamentoDate(contextMenu.date)
            setNovoAgendamentoTime(contextMenu.slot?.startTime)
            setNovoAgendamentoOpen(true)
          }}
          onClose={() => setContextMenu(null)}
          canEdit={canEdit}
        />
      )}

      <NovoAgendamentoModal
        open={novoAgendamentoOpen}
        onClose={() => {
          setNovoAgendamentoOpen(false)
          setNovoAgendamentoDate(undefined)
          setNovoAgendamentoTime(undefined)
        }}
        defaultDate={novoAgendamentoDate ?? selectedDate}
        defaultTime={novoAgendamentoTime}
        defaultProfessionalId={professionalId}
      />

      {selectedAppointment && (
        <AppointmentStatusModal
          open={!!selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          appointment={selectedAppointment}
        />
      )}
    </div>
    </TooltipProvider>
  )
}
