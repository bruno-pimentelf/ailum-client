"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
  CalendarPlus,
  Warning,
  X,
  Trash,
  Sparkle,
} from "@phosphor-icons/react"
import { useQueryClient } from "@tanstack/react-query"
import {
  useProfessional,
  useProfessionalMutations,
  useProfessionalOverrides,
} from "@/hooks/use-professionals"
import { useAppointments } from "@/hooks/use-appointments"
import { NovoAgendamentoModal } from "@/components/calendar/novo-agendamento-modal"
import { AppointmentStatusModal } from "@/components/calendar/appointment-status-modal"
import type { Appointment as ApiAppointment } from "@/lib/api/scheduling"
import type {
  AvailabilityException,
  AvailabilityOverride,
  Professional,
} from "@/lib/api/professionals"
import { toYMD, formatTimeLocal } from "@/lib/date-utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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

type PendingAddition =
  | { id: string; type: "weekly"; dayOfWeek: number; startTime: string; endTime: string; slotDurationMin?: number }
  | { id: string; type: "override"; date: string; slots: Array<{ startTime: string; endTime: string }> }
  | { id: string; type: "override-add"; date: string; startTime: string; endTime: string }

type EffectiveSlot = {
  startTime: string
  endTime: string
  isOverride?: boolean
  overrideId?: string
  dayOfWeek?: number
  pending?: boolean
}

function getEffectiveSlots(
  d: Date,
  dayAvail: { slots: Array<{ startTime: string; endTime: string; isOverride?: boolean; overrideId?: string; dayOfWeek?: number }> },
  pendingAdditions: PendingAddition[]
): EffectiveSlot[] {
  const dateStr = toYMD(d)
  const pendingOverride = pendingAdditions.find(
    (p): p is PendingAddition & { type: "override" } =>
      p.type === "override" && p.date === dateStr
  )
  if (pendingOverride) {
    return pendingOverride.slots.map((s) => ({
      ...s,
      isOverride: true,
      pending: true,
    } as EffectiveSlot))
  }
  const base: EffectiveSlot[] = dayAvail.slots.map((s) => ({ ...s }))
  const pendingOverrideAdd = pendingAdditions.find(
    (p): p is PendingAddition & { type: "override-add" } =>
      p.type === "override-add" && p.date === dateStr
  )
  if (pendingOverrideAdd) {
    base.push({
      startTime: pendingOverrideAdd.startTime,
      endTime: pendingOverrideAdd.endTime,
      isOverride: true,
      pending: true,
    })
  }
  const pendingWeekly = pendingAdditions.filter(
    (p): p is PendingAddition & { type: "weekly" } =>
      p.type === "weekly" && p.dayOfWeek === d.getDay()
  )
  for (const p of pendingWeekly) {
    base.push({
      startTime: p.startTime,
      endTime: p.endTime,
      isOverride: false,
      dayOfWeek: p.dayOfWeek,
      pending: true,
    })
  }
  return base
}

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
          ? "border-rose-500/25 bg-rose-950/90"
          : "border-amber-500/25 bg-amber-950/90"
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
      <button onClick={onDismiss} className="ml-1 text-white/90 hover:text-white/85 transition-colors">
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
          ? "bg-white/[0.06] border-white/[0.12] text-white/85"
          : "bg-white/[0.02] border-white/[0.06] text-white/85"
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
        className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-background shadow-2xl p-6"
      >
        <h3 className="text-[15px] font-bold text-white/90 flex items-center gap-2">
          <Lock className="h-4 w-4 text-amber-400" />
          Bloquear dia
        </h3>
        <p className="text-[12px] text-white/85 mt-2">
          {WEEKDAYS[date.getDay()]}, {date.getDate()} de {MONTHS_PT[date.getMonth()]}
        </p>
        <div className="mt-4">
          <label className="block text-[10px] font-bold text-white/85 uppercase tracking-wider mb-1.5">
            Motivo (opcional)
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: Consulta externa"
            className="w-full h-10 rounded-xl border border-white/[0.09] bg-white/[0.03] px-3 text-[13px] text-white/90 placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-accent/50"
          />
        </div>
        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-white/[0.08] text-white/90 text-[13px] font-semibold hover:bg-white/[0.04]"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(reason.trim() || undefined)}
            disabled={isPending}
            className="flex-1 h-10 rounded-xl bg-amber-500/80 text-white text-[13px] font-bold hover:bg-amber-500 disabled:opacity-50"
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
        className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-background shadow-2xl p-6"
      >
        <h3 className="text-[15px] font-bold text-white/90 flex items-center gap-2">
          <Lock className="h-4 w-4 text-amber-400" />
          Bloquear período
        </h3>
        <p className="text-[12px] text-white/85 mt-2">Ex.: férias, licença</p>
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-white/85 uppercase tracking-wider mb-1">
              De
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full h-10 rounded-xl border border-white/[0.09] bg-white/[0.03] px-3 text-[13px]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-white/85 uppercase tracking-wider mb-1">
              Até
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full h-10 rounded-xl border border-white/[0.09] bg-white/[0.03] px-3 text-[13px]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-white/85 uppercase tracking-wider mb-1">
              Motivo (opcional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Férias"
              className="w-full h-10 rounded-xl border border-white/[0.09] bg-white/[0.03] px-3 text-[13px]"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-white/[0.08] text-white/90 text-[13px] font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={() => from && to && onConfirm(from, to, reason.trim() || undefined)}
            disabled={isPending || !from || !to}
            className="flex-1 h-10 rounded-xl bg-amber-500/80 text-white text-[13px] font-bold disabled:opacity-50"
          >
            {isPending ? "…" : "Bloquear"}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Add Override Modal ───────────────────────────────────────────────────────

function AddOverrideModal({
  open,
  date,
  onClose,
  onConfirm,
  isPending,
}: {
  open: boolean
  date: Date | null
  onClose: () => void
  onConfirm: (date: string, startTime: string, endTime: string) => void
  isPending: boolean
}) {
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("12:00")
  if (!open || !date) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-background shadow-2xl p-6"
      >
        <h3 className="text-[15px] font-bold text-white/90 flex items-center gap-2">
          <CalendarPlus className="h-4 w-4 text-emerald-400" />
          Adicionar horário neste dia
        </h3>
        <p className="text-[12px] text-white/85 mt-2">
          {WEEKDAYS[date.getDay()]}, {date.getDate()} de {MONTHS_PT[date.getMonth()]}
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-white/85 uppercase tracking-wider mb-1">
              Das
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              step={300}
              className="w-full h-10 rounded-xl border border-white/[0.09] bg-white/[0.03] px-3 text-[13px]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-white/85 uppercase tracking-wider mb-1">
              Até
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              step={300}
              className="w-full h-10 rounded-xl border border-white/[0.09] bg-white/[0.03] px-3 text-[13px]"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-white/[0.08] text-white/90 text-[13px] font-semibold">
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(toYMD(date), startTime, endTime)}
            disabled={isPending}
            className="flex-1 h-10 rounded-xl bg-emerald-500/80 text-white text-[13px] font-bold disabled:opacity-50"
          >
            {isPending ? "…" : "Adicionar"}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Drag Create Modal (após arrastar) ────────────────────────────────────────

function DragCreateModal({
  open,
  date,
  startMin,
  endMin,
  onClose,
  onConfirm,
  isPending,
}: {
  open: boolean
  date: Date | null
  startMin: number
  endMin: number
  onClose: () => void
  onConfirm: (date: string, startTime: string, endTime: string, repeatWeekly: boolean, slotDurationMin: number) => void
  isPending: boolean
}) {
  const [repeatWeekly, setRepeatWeekly] = useState(true)
  const [slotDurationMin, setSlotDurationMin] = useState(30)
  const startTime = minutesToHHMM(Math.min(startMin, endMin))
  const endTime = minutesToHHMM(Math.max(startMin, endMin))
  if (!open || !date) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-background shadow-2xl p-6"
      >
        <h3 className="text-[15px] font-bold text-white/90 flex items-center gap-2">
          <CalendarPlus className="h-4 w-4 text-emerald-400" />
          Adicionar disponibilidade
        </h3>
        <p className="text-[12px] text-white/85 mt-2">
          {WEEKDAYS[date.getDay()]}, {date.getDate()} de {MONTHS_PT[date.getMonth()]} — {startTime} – {endTime}
        </p>
        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={repeatWeekly}
              onChange={(e) => setRepeatWeekly(e.target.checked)}
              className="rounded border-border/60 text-accent"
            />
            <span className="text-[13px] text-white/90">Repetir toda semana neste horário</span>
          </label>
          <div>
            <label className="block text-[10px] font-bold text-white/85 uppercase tracking-wider mb-1">
              Duração do slot
            </label>
            <select
              value={slotDurationMin}
              onChange={(e) => setSlotDurationMin(Number(e.target.value))}
              className="w-full h-10 rounded-xl border border-white/[0.09] bg-white/[0.03] px-3 text-[13px]"
            >
              {[15, 30, 45, 50, 60].map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-white/[0.08] text-white/90 text-[13px] font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(toYMD(date), startTime, endTime, repeatWeekly, slotDurationMin)}
            disabled={isPending}
            className="flex-1 h-10 rounded-xl bg-emerald-500/80 text-white text-[13px] font-bold disabled:opacity-50"
          >
            {isPending ? "…" : "Adicionar"}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Day Context Menu ─────────────────────────────────────────────────────────

function DayContextMenu({
  date,
  x,
  y,
  blockSource,
  onBlockDay,
  onUnblockDay,
  onAddOverride,
  onBlockRange,
  onSchedule,
  onClose,
  canEdit,
}: {
  date: Date
  x: number
  y: number
  blockSource: { type: "exception" } | { type: "blockRange" } | null
  onBlockDay: () => void
  onUnblockDay: () => void
  onAddOverride: () => void
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
        className="fixed z-50 min-w-[180px] rounded-xl border border-white/[0.08] bg-background/95 backdrop-blur py-1 shadow-xl"
        style={{ left: x, top: y }}
      >
        <button
          onClick={() => { onSchedule(); onClose() }}
          className="w-full flex items-center gap-2 px-4 py-2 text-left text-[12px] text-white/90 hover:bg-white/[0.06]"
        >
          <CalendarBlank className="h-3.5 w-3.5 text-accent" weight="duotone" />
          Agendar consulta
        </button>
        <div className="mx-3 my-1 border-t border-white/[0.06]" />
        {isBlocked ? (
          <button
            onClick={() => { onUnblockDay(); onClose() }}
            className="w-full flex items-center gap-2 px-4 py-2 text-left text-[12px] text-white/90 hover:bg-white/[0.06]"
          >
            <LockOpen className="h-3.5 w-3.5 text-emerald-400" />
            Desbloquear dia
          </button>
        ) : (
          <button
            onClick={() => { onBlockDay(); onClose() }}
            className="w-full flex items-center gap-2 px-4 py-2 text-left text-[12px] text-white/90 hover:bg-white/[0.06]"
          >
            <Lock className="h-3.5 w-3.5 text-amber-400" />
            Bloquear dia
          </button>
        )}
        {!isBlocked && (
          <button
            onClick={() => { onAddOverride(); onClose() }}
            className="w-full flex items-center gap-2 px-4 py-2 text-left text-[12px] text-white/90 hover:bg-white/[0.06]"
          >
            <CalendarPlus className="h-3.5 w-3.5 text-emerald-400" />
            Adicionar horário neste dia
          </button>
        )}
        <button
          onClick={() => { onBlockRange(); onClose() }}
          className="w-full flex items-center gap-2 px-4 py-2 text-left text-[12px] text-white/90 hover:bg-white/[0.06]"
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
  onOpenAvailability,
  allProfessionals,
  onSwitchProfessional,
}: {
  professionalId: string
  professionalName: string
  canEdit: boolean
  accentColor?: string
  /** Se passado, exibe botão para voltar à visão de todos os profissionais (Admin/Secretary) */
  onBackToAll?: () => void
  /** Abre o drawer de disponibilidade IA */
  onOpenAvailability?: () => void
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
  } | null>(null)
  const [blockDayModal, setBlockDayModal] = useState<Date | null>(null)
  const [blockRangeModal, setBlockRangeModal] = useState<{ from: Date; to: Date } | null>(null)
  const [overrideModal, setOverrideModal] = useState<Date | null>(null)
  const [dragPreview, setDragPreview] = useState<{
    date: Date
    startMin: number
    endMin: number
    rect: { top: number; height: number }
  } | null>(null)
  const [dragCreateModal, setDragCreateModal] = useState<{ date: Date; startMin: number; endMin: number } | null>(null)
  const [pendingAdditions, setPendingAdditions] = useState<PendingAddition[]>([])
  const [toast, setToast] = useState<{ msg: string; variant: "error" | "info" } | null>(null)
  const [selectedBlock, setSelectedBlock] = useState<{
    date: Date
    slot: { startTime: string; endTime: string; overrideId?: string; dayOfWeek?: number }
  } | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<CalendarAppointment | null>(null)

  useEffect(() => {
    if (!dragPreview) return
    const rect = dragPreview.rect
    const onMove = (e: MouseEvent) => {
      const localY = Math.max(0, Math.min(rect.height, e.clientY - rect.top))
      const endMin = snapTo15(pxToMinutes(localY))
      setDragPreview((p) => (p ? { ...p, endMin } : null))
    }
    const onUp = () => {
      setDragPreview((p) => {
        if (!p) return null
        const sm = snapTo15(p.startMin)
        const em = snapTo15(p.endMin)
        if (Math.abs(em - sm) >= 15) {
          setDragCreateModal({
            date: p.date,
            startMin: Math.min(sm, em),
            endMin: Math.max(sm, em),
          })
        }
        return null
      })
    }
    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup", onUp)
    return () => {
      document.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseup", onUp)
    }
  }, [!!dragPreview])

  const queryClient = useQueryClient()
  const mutatingDatesRef = useRef<Set<string>>(new Set())

  const { data: professional, isLoading: loadingProf } = useProfessional(professionalId)
  const {
    putAvailability,
    deleteAvailability,
    addException,
    removeException,
    removeOverride,
    replaceOverridesForDate,
    addBlockRange,
    removeBlockRange,
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
                className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-white/[0.08] text-white/85 hover:text-white/90 hover:bg-white/[0.04] text-[12px] font-medium"
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
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-white/85 hover:text-white/85"
              >
                <CaretLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() =>
                  setSelectedDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + (viewMode === "week" ? 7 : 1)))
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-white/85 hover:text-white/85"
              >
                <CaretRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <h1 className="text-[16px] font-black text-white/90">
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
            <div className="flex items-center rounded-lg border border-white/[0.08] bg-white/[0.02] p-0.5">
              {(["week", "month"] as ViewMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  className={`relative px-3 py-1 text-[11px] font-bold rounded-md ${
                    viewMode === m ? "text-white/90" : "text-white/85 hover:text-white/85"
                  }`}
                >
                  {viewMode === m && (
                    <motion.div
                      layoutId="view-pill-pro"
                      className="absolute inset-0 bg-white/[0.07] rounded-md"
                      transition={{ duration: 0.25, ease }}
                    />
                  )}
                  <span className="relative z-10">{m === "week" ? "Semana" : "Mês"}</span>
                </button>
              ))}
            </div>

            {canEdit && (
              <AlertDialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                      <button
                        className="flex h-8 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-[11px] font-bold text-white/90 hover:bg-white/5 hover:text-white/90"
                        aria-label="Limpar disponibilidade"
                      >
                        <Trash className="h-3.5 w-3.5" />
                        Limpar
                      </button>
                    </AlertDialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Limpar toda a disponibilidade</TooltipContent>
                </Tooltip>
                <AlertDialogContent className="max-w-sm">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Limpar disponibilidade</AlertDialogTitle>
                    <AlertDialogDescription>
                      Limpar toda a disponibilidade deste profissional? Isso remove grade
                      semanal, exceções, overrides e bloqueios. Os agendamentos não serão
                      alterados.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={() => deleteAvailability.mutate()}
                    >
                      {deleteAvailability.isPending ? "Limpando…" : "Limpar"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {onOpenAvailability && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onOpenAvailability}
                    className="flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.05] px-3.5 text-[12px] font-bold text-white/85 hover:bg-white/[0.08] hover:border-white/[0.14] transition-colors duration-200 group"
                  >
                    <Sparkle className="h-3.5 w-3.5 text-accent group-hover:scale-110 transition-transform duration-200" weight="duotone" />
                    Disponibilidade
                  </button>
                </TooltipTrigger>
                <TooltipContent>Gerenciar disponibilidade com IA</TooltipContent>
              </Tooltip>
            )}
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

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 px-6 pb-3 text-[10px]">
          {canEdit && (
            <span className="text-white/85">Arraste para adicionar · Clique no bloco para excluir</span>
          )}
          <div className="flex items-center gap-1.5">
            <div
              className="h-2 w-4 rounded-sm"
              style={{
                background: "repeating-linear-gradient(-45deg, transparent, transparent 2px, rgba(255,255,255,0.06) 2px, rgba(255,255,255,0.06) 4px)",
              }}
            />
            <span className="text-white/90">Sem agenda</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="h-2 w-4 rounded-sm bg-background"
              style={{ borderLeft: `2px solid ${accentColor}40` }}
            />
            <span className="text-white/90">Toda semana</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-4 rounded-sm border-l-2 border-emerald-500/50 bg-background" />
            <span className="text-white/90">Avulso</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="h-2 w-4 rounded-sm"
              style={{
                background: "repeating-linear-gradient(-45deg, transparent, transparent 2px, rgba(245,158,11,0.20) 2px, rgba(245,158,11,0.20) 4px)",
              }}
            />
            <span className="text-white/90">Bloqueado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-4 rounded-sm bg-blue-500/50 border border-blue-500/60" />
            <span className="text-white/90">Confirmado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-4 rounded-sm border border-dashed border-white/30 bg-white/[0.06]" />
            <span className="text-white/90">Pendente</span>
          </div>
        </div>

        {/* Professional switcher strip (admin with multiple professionals) */}
        {allProfessionals && allProfessionals.length > 1 && onSwitchProfessional && (
          <div className="flex items-center gap-1 px-6 pb-3 overflow-x-auto no-scrollbar">
            {allProfessionals.map((p) => {
              const active = p.id === professionalId
              return (
                <button
                  key={p.id}
                  onClick={() => onSwitchProfessional(p.id)}
                  className={`relative shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition-all duration-200 cursor-pointer ${
                    active ? "text-white/90" : "text-white/50 hover:text-white/70"
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
          <div className="flex border-b border-white/[0.14] min-w-[800px] shrink-0">
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
                  className={`py-2 flex flex-col items-center gap-0.5 border-l border-white/[0.10] ${
                    today ? "bg-accent/5" : "hover:bg-white/[0.02]"
                  }`}
                >
                  <span className="text-[9px] font-extrabold uppercase text-white/90">
                    {WEEKDAYS[d.getDay()]}
                  </span>
                  <span
                    className={`h-6 w-6 flex items-center justify-center rounded-full text-[12px] font-bold ${
                      today ? "bg-accent text-accent-foreground" : "text-white/85"
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

          <div className="flex-1 overflow-y-auto overflow-x-auto min-w-0">
            <div className="flex min-w-[800px] min-h-[500px]">
              {/* Hour labels */}
              <div className="w-14 shrink-0 flex flex-col">
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="flex items-start justify-end pr-2 pt-0.5 -mt-[1px]"
                    style={{ height: HOUR_HEIGHT }}
                  >
                    <span className="text-[9px] font-bold text-white/90 font-mono tabular-nums">
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
                  const dragForThisDay = dragPreview?.date.toDateString() === d.toDateString()
                  return (
                    <div
                      key={d.toISOString()}
                      className="relative border-l border-white/[0.10]"
                      style={{
                        minHeight: DAY_HEIGHT,
                        cursor: canEdit && !dayAvail.blocked ? "crosshair" : undefined,
                      }}
                      onMouseDown={
                        canEdit && !dayAvail.blocked
                          ? (e) => {
                              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                              const localY = Math.max(0, Math.min(rect.height, e.clientY - rect.top))
                              const startMin = snapTo15(pxToMinutes(localY))
                              setDragPreview({
                                date: d,
                                startMin,
                                endMin: startMin,
                                rect: { top: rect.top, height: rect.height },
                              })
                            }
                          : undefined
                      }
                    >
                      {/* Hour + half-hour lines */}
                      {HOURS.slice(0, -1).map((hour) => (
                        <div key={hour}>
                          <div
                            className="absolute left-0 right-0 border-t border-white/[0.06]"
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

                      {/* Availability blocks — "clear" the hatch where the professional is available */}
                      {!dayAvail.blocked &&
                        getEffectiveSlots(d, dayAvail, pendingAdditions).map((slot, i) => {
                          const top = timeToTop(slot.startTime)
                          const endPx = timeToTop(slot.endTime)
                          const h = Math.max(4, endPx - top)
                          const isRecurring = !slot.isOverride
                          const isPending = !!slot.pending
                          const isSelected =
                            selectedBlock?.date.toDateString() === d.toDateString() &&
                            selectedBlock?.slot.startTime === slot.startTime &&
                            selectedBlock?.slot.endTime === slot.endTime
                          const blockEl = (
                            <div
                              key={`${slot.startTime}-${slot.endTime}-${i}`}
                              className={`absolute left-0 right-0 group/slot transition-all ${
                                canEdit ? "cursor-pointer" : "pointer-events-none"
                              } ${isSelected ? "ring-2 ring-white/40 ring-inset" : ""}`}
                              style={{
                                top,
                                height: h,
                                backgroundColor: isRecurring
                                  ? `color-mix(in srgb, ${accentColor} 3%, var(--background))`
                                  : "color-mix(in srgb, rgb(34,197,94) 3%, var(--background))",
                                borderLeft: `2px solid ${isRecurring ? accentColor + "40" : "rgba(34,197,94,0.50)"}`,
                                opacity: isPending ? 0.6 : 1,
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation()
                                if (!canEdit) return
                                setSelectedBlock({
                                  date: d,
                                  slot: {
                                    startTime: slot.startTime,
                                    endTime: slot.endTime,
                                    overrideId: slot.overrideId,
                                    dayOfWeek: slot.dayOfWeek,
                                  },
                                })
                              }}
                            >
                              {isPending && (
                                <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-80">
                                  <Clock className="h-3 w-3 text-white/90" weight="fill" />
                                </div>
                              )}
                            </div>
                          )
                          return isRecurring ? (
                            <Tooltip key={`${slot.startTime}-${slot.endTime}-${i}`}>
                              <TooltipTrigger asChild>{blockEl}</TooltipTrigger>
                              <TooltipContent side="top">Toda semana</TooltipContent>
                            </Tooltip>
                          ) : (
                            <Tooltip key={`${slot.startTime}-${slot.endTime}-${i}`}>
                              <TooltipTrigger asChild>{blockEl}</TooltipTrigger>
                              <TooltipContent side="top">Disponibilidade avulsa</TooltipContent>
                            </Tooltip>
                          )
                        })}
                      {/* Drag preview */}
                      {dragForThisDay && dragPreview && (() => {
                        const sm = Math.min(dragPreview.startMin, dragPreview.endMin)
                        const em = Math.max(dragPreview.startMin, dragPreview.endMin)
                        const topPx = minutesToPx(sm)
                        const hPx = (em - sm) * (HOUR_HEIGHT / 60)
                        return (
                          <div
                            className="absolute left-0.5 right-0.5 rounded bg-accent/40 border-2 border-accent pointer-events-none z-10"
                            style={{
                              top: topPx,
                              height: Math.max(8, hPx),
                            }}
                          />
                        )
                      })()}
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
                                ? "bg-blue-500/50 border border-blue-500/60 text-white/95"
                                : apt.status === "cancelled"
                                  ? "bg-white/[0.04] border border-white/10 opacity-40 line-through"
                                  : "border border-dashed border-white/30 bg-white/[0.06] text-white/90"
                            }`}
                            style={{ top, height: h }}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-black shrink-0 ${
                                apt.status === "confirmed" ? "bg-blue-400/30 text-white/90" : "bg-white/10 text-white/60"
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
            <div className="grid grid-cols-7 border-b border-white/[0.14]">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="py-2 text-center text-[10px] font-extrabold uppercase tracking-widest text-white/90"
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
                    return <div key={`empty-${i}`} className="border-b border-r border-white/[0.10] p-1" />
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
                      className={`flex flex-col gap-1 p-2 border-b border-r border-white/[0.10] text-left transition-colors ${
                        canEdit ? "cursor-pointer hover:bg-white/[0.02]" : ""
                      } ${isToday ? "bg-accent/10" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`h-6 w-6 flex items-center justify-center rounded-full text-[12px] font-bold ${
                            isToday ? "bg-accent text-accent-foreground" : "text-white/90"
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
                                  : "bg-white/[0.06] text-white/85"
                            }`}
                          >
                            {apt.time} {apt.patientName.split(" ")[0]}
                          </button>
                        ))}
                        {dayApts.length > 3 && (
                          <span className="text-[8px] text-white/85">+{dayApts.length - 3}</span>
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

      <AddOverrideModal
        open={!!overrideModal}
        date={overrideModal}
        onClose={() => setOverrideModal(null)}
        onConfirm={(date, startTime, endTime) => {
          if (!overrideModal) return
          setOverrideModal(null)
          const dateStr = date
          if (mutatingDatesRef.current.has(dateStr)) return
          mutatingDatesRef.current.add(dateStr)

          const freshProf = queryClient.getQueryData<Professional>([
            "professional",
            professionalId,
          ]) as Professional | undefined
          const freshOverrides =
            (queryClient.getQueryData<AvailabilityOverride[]>([
              "professionalOverrides",
              professionalId,
              toYMD(fromDate),
              toYMD(toDate),
            ]) as AvailabilityOverride[] | undefined) ??
            freshProf?.availabilityOverrides ??
            []

          const optsForDate = {
            availability: freshProf?.availability ?? [],
            exceptions: (freshProf?.availabilityExceptions ?? []) as AvailabilityException[],
            overrides: freshOverrides,
            blockRanges: freshProf?.availabilityBlockRanges ?? [],
          }
          const dayAvail = computeDayAvailability(overrideModal, optsForDate)
          const existingOverridesForDate = freshOverrides.filter(
            (o) => (o.date?.slice(0, 10) ?? o.date) === dateStr
          )

          const slotDurationMin = 50
          const effectiveSlots = dayAvail.blocked
            ? []
            : dayAvail.slots.map((s) => ({
                startTime: s.startTime,
                endTime: s.endTime,
                slotDurationMin: s.slotDurationMin ?? 50,
              }))
          const merged = [
            ...effectiveSlots,
            { startTime, endTime, slotDurationMin },
          ]
          const pendingId = `override-add-${Date.now()}`
          setPendingAdditions((prev) => [
            ...prev,
            {
              id: pendingId,
              type: "override",
              date: dateStr,
              slots: merged.map((s) => ({
                startTime: s.startTime,
                endTime: s.endTime,
              })),
            },
          ])
          replaceOverridesForDate.mutate(
            {
              removeIds: existingOverridesForDate.map((o) => o.id),
              addSlots: merged.map((s) => ({
                date: dateStr,
                startTime: s.startTime,
                endTime: s.endTime,
                slotDurationMin: s.slotDurationMin,
              })),
              dateStr,
              from: toYMD(fromDate),
              to: toYMD(toDate),
              onOptimisticApply: () =>
                setPendingAdditions((prev) =>
                  prev.filter((p) => p.id !== pendingId)
                ),
            },
            {
              onError: () => {
                setPendingAdditions((prev) =>
                  prev.filter((p) => p.id !== pendingId)
                )
                setToast({ msg: "Falha ao adicionar horário.", variant: "error" })
              },
              onSettled: () => {
                mutatingDatesRef.current.delete(dateStr)
              },
            }
          )
        }}
        isPending={replaceOverridesForDate.isPending}
      />

      <DragCreateModal
        open={!!dragCreateModal}
        date={dragCreateModal?.date ?? null}
        startMin={dragCreateModal?.startMin ?? 0}
        endMin={dragCreateModal?.endMin ?? 0}
        onClose={() => setDragCreateModal(null)}
        onConfirm={(date, startTime, endTime, repeatWeekly, slotDurationMin) => {
          if (!dragCreateModal) return
          setDragCreateModal(null)
          const today = new Date()
          const todayDow = today.getDay()
          if (repeatWeekly) {
            const dayOfWeek = dragCreateModal.date.getDay()
            const pendingId = `weekly-${Date.now()}`
            setPendingAdditions((prev) => [
              ...prev,
              { id: pendingId, type: "weekly", dayOfWeek, startTime, endTime, slotDurationMin },
            ])
            const freshProf = queryClient.getQueryData<Professional>([
              "professional",
              professionalId,
            ]) as Professional | undefined
            const freshAvailability = freshProf?.availability ?? []
            const newSlot = {
              dayOfWeek,
              startTime,
              endTime,
              slotDurationMin,
            }
            const otherDays = freshAvailability.filter((s) => s.dayOfWeek !== dayOfWeek)
            const sameDay = freshAvailability.filter((s) => s.dayOfWeek === dayOfWeek)
            const merged = [...otherDays, ...sameDay, newSlot]
            putAvailability.mutate(merged, {
              onSuccess: () => {
                setPendingAdditions((prev) => prev.filter((p) => p.id !== pendingId))
                if (dayOfWeek < todayDow) {
                  const next = WEEKDAYS[dayOfWeek]
                  setToast({
                    msg: `Esse horário passa a valer na próxima semana (próxima ${next}).`,
                    variant: "info",
                  })
                }
              },
              onError: () => {
                setPendingAdditions((prev) => prev.filter((p) => p.id !== pendingId))
                setToast({ msg: "Falha ao salvar. Tente novamente.", variant: "error" })
              },
            })
          } else {
            const dateStr = toYMD(dragCreateModal.date)
            if (mutatingDatesRef.current.has(dateStr)) return
            mutatingDatesRef.current.add(dateStr)

            const freshProf = queryClient.getQueryData<Professional>([
              "professional",
              professionalId,
            ]) as Professional | undefined
            const freshOverrides =
              (queryClient.getQueryData<AvailabilityOverride[]>([
                "professionalOverrides",
                professionalId,
                toYMD(fromDate),
                toYMD(toDate),
              ]) as AvailabilityOverride[] | undefined) ??
              freshProf?.availabilityOverrides ??
              []

            const optsForDate = {
              availability: freshProf?.availability ?? [],
              exceptions: (freshProf?.availabilityExceptions ?? []) as AvailabilityException[],
              overrides: freshOverrides,
              blockRanges: freshProf?.availabilityBlockRanges ?? [],
            }
            const dayAvail = computeDayAvailability(dragCreateModal.date, optsForDate)
            const existingOverridesForDate = freshOverrides.filter(
              (o) => (o.date?.slice(0, 10) ?? o.date) === dateStr
            )

            const effectiveSlots = dayAvail.blocked
              ? []
              : dayAvail.slots.map((s) => ({
                  startTime: s.startTime,
                  endTime: s.endTime,
                  slotDurationMin: s.slotDurationMin ?? 50,
                }))
            const merged = [...effectiveSlots, { startTime, endTime, slotDurationMin }]
            const pendingId = `override-${Date.now()}`
            setPendingAdditions((prev) => [
              ...prev,
              {
                id: pendingId,
                type: "override",
                date: dateStr,
                slots: merged.map((s) => ({ startTime: s.startTime, endTime: s.endTime })),
              },
            ])
            replaceOverridesForDate.mutate(
              {
                removeIds: existingOverridesForDate.map((o) => o.id),
                addSlots: merged.map((s) => ({
                  date: dateStr,
                  startTime: s.startTime,
                  endTime: s.endTime,
                  slotDurationMin: s.slotDurationMin,
                })),
                dateStr,
                from: toYMD(fromDate),
                to: toYMD(toDate),
                onOptimisticApply: () =>
                  setPendingAdditions((prev) =>
                    prev.filter((p) => p.id !== pendingId)
                  ),
              },
              {
                onError: () => {
                  setPendingAdditions((prev) =>
                    prev.filter((p) => p.id !== pendingId)
                  )
                  setToast({ msg: "Falha ao salvar. Tente novamente.", variant: "error" })
                },
                onSettled: () => {
                  mutatingDatesRef.current.delete(dateStr)
                },
              }
            )
          }
        }}
        isPending={putAvailability.isPending || replaceOverridesForDate.isPending}
      />

      {/* Delete block popover */}
      {selectedBlock && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setSelectedBlock(null)}
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed left-1/2 top-40 -translate-x-1/2 z-50 rounded-xl border border-white/[0.12] bg-background/95 backdrop-blur py-2 shadow-xl min-w-[220px]"
          >
            <p className="px-4 py-1 text-[12px] text-white/85">
              {selectedBlock.slot.overrideId ? "Excluir este horário?" : "Excluir horário recorrente?"}
            </p>
            <div className="flex flex-wrap gap-2 px-4 pt-2">
              <button
                onClick={() => setSelectedBlock(null)}
                className="flex-1 min-w-[70px] h-8 rounded-lg border border-white/[0.08] text-[11px] font-semibold text-white/90 hover:bg-white/[0.04]"
              >
                Cancelar
              </button>
              {selectedBlock.slot.overrideId ? (
                <button
                  onClick={() => {
                    removeOverride.mutate(selectedBlock.slot.overrideId!, {
                      onError: () => setToast({ msg: "Falha ao excluir.", variant: "error" }),
                    })
                    setSelectedBlock(null)
                  }}
                  className="flex-1 min-w-[70px] h-8 rounded-lg bg-rose-500/80 text-white text-[11px] font-bold hover:bg-rose-500/90 flex items-center justify-center gap-1"
                >
                  <Trash className="h-3 w-3" weight="fill" />
                  Excluir
                </button>
              ) : selectedBlock.slot.dayOfWeek != null ? (
                <>
                  <button
                    onClick={() => {
                      const { date, slot } = selectedBlock
                      setSelectedBlock(null)
                      const dateStr = toYMD(date)
                      const existing = exceptions.find(
                        (e) => (e.date?.slice(0, 10) ?? e.date) === dateStr && e.isUnavailable === false && (e.slotMask?.length ?? 0) > 0
                      )
                      const newMaskInterval = { startTime: slot.startTime, endTime: slot.endTime }
                      const mergedMask = existing?.slotMask
                        ? [...(Array.isArray(existing.slotMask) ? existing.slotMask : []), newMaskInterval]
                        : [newMaskInterval]
                      const tempException: AvailabilityException = {
                        id: `temp-slotmask-${Date.now()}`,
                        professionalId: professionalId,
                        date: dateStr,
                        isUnavailable: false,
                        reason: null,
                        slotMask: mergedMask,
                      }
                      queryClient.setQueryData(
                        ["professional", professionalId],
                        (old: typeof professional) =>
                          old
                            ? {
                                ...old,
                                availabilityExceptions: [
                                  ...(old.availabilityExceptions ?? []).filter(
                                    (e) => (e.date?.slice(0, 10) ?? e.date) !== dateStr
                                  ),
                                  tempException,
                                ],
                              }
                            : old
                      )
                      const doAdd = () =>
                        addException.mutate(
                          { date: dateStr, isUnavailable: false, slotMask: mergedMask },
                          { onError: () => setToast({ msg: "Falha ao excluir.", variant: "error" }) }
                        )
                      if (existing) {
                        removeException.mutate(dateStr, {
                          onSuccess: () => doAdd(),
                          onError: () => setToast({ msg: "Falha ao excluir.", variant: "error" }),
                        })
                      } else {
                        doAdd()
                      }
                    }}
                    className="flex-1 min-w-[90px] h-8 rounded-lg bg-amber-500/80 text-white text-[11px] font-bold hover:bg-amber-500/90"
                  >
                    Só este dia
                  </button>
                  <button
                    onClick={() => {
                      const { slot } = selectedBlock
                      const filtered = availability.filter(
                        (s) =>
                          !(
                            s.dayOfWeek === slot.dayOfWeek &&
                            (s.startTime ?? "09:00") === slot.startTime &&
                            (s.endTime ?? "18:00") === slot.endTime
                          )
                      )
                      putAvailability.mutate(filtered, {
                        onError: () => setToast({ msg: "Falha ao excluir.", variant: "error" }),
                      })
                      setSelectedBlock(null)
                    }}
                    className="flex-1 min-w-[90px] h-8 rounded-lg bg-rose-500/80 text-white text-[11px] font-bold hover:bg-rose-500/90 flex items-center justify-center gap-1"
                  >
                    <Trash className="h-3 w-3" weight="fill" />
                    Todas as semanas
                  </button>
                </>
              ) : null}
            </div>
          </motion.div>
        </>
      )}

      {toast && (
        <AnimatePresence>
          <CalendarToast
            message={toast.msg}
            variant={toast.variant}
            onDismiss={() => setToast(null)}
          />
        </AnimatePresence>
      )}

      {contextMenu && (
        <DayContextMenu
          date={contextMenu.date}
          x={contextMenu.x}
          y={contextMenu.y}
          blockSource={getBlockSource(contextMenu.date, { exceptions, blockRanges })}
          onBlockDay={() => setBlockDayModal(contextMenu.date)}
          onUnblockDay={() => {
            const src = getBlockSource(contextMenu!.date, { exceptions, blockRanges })
            if (!src) return
            if (src.type === "exception") {
              removeException.mutate(toYMD(contextMenu.date))
            } else {
              removeBlockRange.mutate(src.blockRange.id)
            }
            setContextMenu(null)
          }}
          onAddOverride={() => setOverrideModal(contextMenu.date)}
          onBlockRange={() =>
            setBlockRangeModal({
              from: contextMenu.date,
              to: new Date(contextMenu.date.getTime() + 86400000),
            })
          }
          onSchedule={() => {
            setNovoAgendamentoDate(contextMenu.date)
            setNovoAgendamentoTime(undefined)
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
