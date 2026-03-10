"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  CaretLeft,
  CaretRight,
  Plus,
  CalendarBlank,
  Clock,
  User,
  WhatsappLogo,
  CheckCircle,
  Circle,
  DotsThree,
  Funnel,
  MagnifyingGlass,
} from "@phosphor-icons/react"
import { useProfessionals } from "@/hooks/use-professionals"
import { useAppointments } from "@/hooks/use-appointments"
import { useMe } from "@/hooks/use-me"
import { NovoAgendamentoModal } from "@/components/calendar/novo-agendamento-modal"
import { ProfessionalCalendar } from "@/components/calendar/professional-calendar"
import { AppointmentStatusModal } from "@/components/calendar/appointment-status-modal"
import type { Appointment as ApiAppointment } from "@/lib/api/scheduling"
import { toYMD, formatTimeLocal } from "@/lib/date-utils"

const ease = [0.33, 1, 0.68, 1] as const

// ─── Types ────────────────────────────────────────────────────────────────────

type AppointmentStatus = "confirmed" | "pending" | "done" | "cancelled"

type CalendarAppointment = {
  id: string
  patientName: string
  doctorName: string
  doctorId: string
  time: string
  duration: number
  type: string
  status: AppointmentStatus
  statusApi: ApiAppointment["status"]
  paid: boolean
  day: number
  month: number
  year: number
  color: string
}

// ─── Helpers: map API → calendar ───────────────────────────────────────────────

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
    doctorName: api.professional?.fullName ?? "—",
    doctorId: api.professionalId,
    time: formatTimeLocal(api.scheduledAt),
    duration: api.durationMin ?? api.service?.durationMin ?? 50,
    type: api.service?.name ?? "Consulta",
    status: api.status === "CANCELLED" ? "cancelled" : mapApiStatus(api.status),
    statusApi: api.status,
    paid: api.charge?.status === "PAID",
    day: d.getDate(),
    month: d.getMonth(),
    year: d.getFullYear(),
    color: api.professionalId,
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TODAY = new Date()
const THIS_YEAR = TODAY.getFullYear()
const THIS_MONTH = TODAY.getMonth()
const TODAY_DAY = TODAY.getDate()

// ─── Constants ────────────────────────────────────────────────────────────────

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]
const HOURS = Array.from({ length: 12 }, (_, i) => i + 7)

type AptColorStyle = {
  bg: string
  border: string
  dot: string
  text: string
}

// Appointment color styles — fallbacks when professional has no calendarColor
const DEFAULT_PRO_COLORS: AptColorStyle[] = [
  { bg: "bg-white/[0.05]", border: "border-white/[0.10]", dot: "bg-white/50", text: "text-white/80" },
  { bg: "bg-white/[0.03]", border: "border-white/[0.07]", dot: "bg-white/30", text: "text-white/60" },
]

function buildProfessionalColorMap(
  professionals: { id: string }[] | undefined
): Record<string, AptColorStyle> {
  const map: Record<string, AptColorStyle> = {}
  if (!professionals) return map
  professionals.forEach((p, i) => {
    map[p.id] = DEFAULT_PRO_COLORS[i % DEFAULT_PRO_COLORS.length]
  })
  return map
}

function getAptColorStyle(
  professionalId: string,
  professionalColorMap: Record<string, AptColorStyle>
): AptColorStyle {
  const style = professionalColorMap[professionalId]
  if (style) return style
  const idx = Math.abs(hashCode(professionalId)) % DEFAULT_PRO_COLORS.length
  return DEFAULT_PRO_COLORS[idx] ?? DEFAULT_PRO_COLORS[0]
}

function hashCode(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i)
  return h
}

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; badge: string }> = {
  confirmed: { label: "Confirmado", badge: "bg-white/[0.06] text-white/50 border-white/[0.10]" },
  pending:   { label: "Pendente",   badge: "bg-white/[0.04] text-white/35 border-white/[0.07]" },
  done:      { label: "Realizado",  badge: "bg-white/[0.03] text-white/25 border-white/[0.05]" },
  cancelled: { label: "Cancelado",  badge: "bg-white/[0.02] text-white/20 border-white/[0.04]" },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

// ─── Paid badge ───────────────────────────────────────────────────────────────

function PaidBadge({ paid }: { paid: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-1.5 py-px text-[8px] font-bold tracking-wide shrink-0 ${
      paid
        ? "bg-white/[0.06] border-white/[0.12] text-white/50"
        : "bg-white/[0.02] border-white/[0.06] text-white/25"
    }`}>
      {paid ? "Pago" : "Pendente"}
    </span>
  )
}

// ─── Mini appointment chip (month grid) ──────────────────────────────────────

function MiniApt({
  apt,
  colorMap,
  onClick,
}: {
  apt: CalendarAppointment
  colorMap: Record<string, AptColorStyle>
  onClick?: () => void
}) {
  const c = getAptColorStyle(apt.color, colorMap)
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick?.() }}
      className={`w-full text-left flex items-center gap-1 rounded px-1 py-0.5 text-[8px] font-bold truncate border cursor-pointer hover:ring-1 hover:ring-accent/40 transition-all ${c.bg} ${c.border}
        ${apt.status === "done" ? "opacity-30" : ""}
        ${apt.status === "cancelled" ? "opacity-15 line-through" : ""}`}
    >
      <span className={`h-1 w-1 rounded-full shrink-0 ${c.dot}`} />
      <span className={`flex-1 truncate ${c.text}`}>{apt.time} {apt.patientName.split(" ")[0]}</span>
      <span className={`h-1 w-1 rounded-full shrink-0 ${apt.paid ? "bg-white/40" : "bg-white/10"}`} title={apt.paid ? "Pago" : "Pendente"} />
    </button>
  )
}

// ─── Day appointment card (day view) ─────────────────────────────────────────

function DayAptCard({
  apt,
  index,
  colorMap,
  onClick,
}: {
  apt: CalendarAppointment
  index: number
  colorMap: Record<string, AptColorStyle>
  onClick?: () => void
}) {
  const c = getAptColorStyle(apt.color, colorMap)
  const startMin = timeToMinutes(apt.time) - 7 * 60
  const top = (startMin / 60) * 64
  const height = Math.max((apt.duration / 60) * 64 - 4, 32)

  return (
    <motion.div
      initial={{ opacity: 0, x: 12, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease }}
      onClick={onClick}
      className={`absolute left-0 right-0 mx-1 rounded-lg border px-2.5 py-1.5 cursor-pointer group
        hover:bg-white/[0.07] hover:ring-2 hover:ring-accent/40 transition-all duration-200 ${c.bg} ${c.border}
        ${apt.status === "done" ? "opacity-40" : ""}
        ${apt.status === "cancelled" ? "opacity-20" : ""}`}
      style={{ top, height }}
    >
      <div className="flex items-start justify-between gap-1 h-full">
        <div className="min-w-0 flex flex-col justify-center gap-0.5">
          <div className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${c.dot}`} />
            <span className="text-[11px] font-bold text-white/90 truncate">{apt.patientName}</span>
          </div>
          {height > 38 && (
            <div className="flex items-center gap-1.5 pl-3">
              <span className="text-[10px] text-white/40">{apt.type}</span>
              <span className="text-white/15">·</span>
              <span className="text-[10px] text-white/30">{apt.doctorName}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end justify-between h-full">
          <div className="flex flex-col items-end gap-1">
            <span className="text-[9px] text-white/30 font-mono shrink-0">{apt.time}</span>
            <PaidBadge paid={apt.paid} />
          </div>
          <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-0.5 rounded hover:bg-white/5">
            <DotsThree className="h-3 w-3 text-white/30" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Side panel ───────────────────────────────────────────────────────────────

function SidePanel({
  appointments,
  selectedDate,
  colorMap,
  onOpenNewAppointment,
  onAppointmentClick,
}: {
  appointments: CalendarAppointment[]
  selectedDate: Date
  colorMap: Record<string, AptColorStyle>
  onOpenNewAppointment: () => void
  onAppointmentClick: (apt: CalendarAppointment) => void
}) {
  const dayApts = appointments.filter(
    a => a.day === selectedDate.getDate() && a.month === selectedDate.getMonth() && a.year === selectedDate.getFullYear()
  ).sort((a, b) => a.time.localeCompare(b.time))

  const confirmed = dayApts.filter(a => a.status === "confirmed").length
  const total = dayApts.length
  const isToday = selectedDate.toDateString() === new Date().toDateString()

  return (
    <div className="flex flex-col h-full">
      {/* Date heading */}
      <div className="px-5 pt-5 pb-4 border-b border-border/40">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/30 mb-1">
          {WEEKDAYS[selectedDate.getDay()]}
        </p>
        <p className={`text-3xl font-black tabular-nums leading-none ${isToday ? "text-accent" : "text-white/90"}`}>
          {selectedDate.getDate()}
        </p>
        <p className="text-[12px] font-semibold text-white/50 mt-1">
          {MONTHS_PT[selectedDate.getMonth()]} {selectedDate.getFullYear()}
        </p>
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-1.5">
            <CheckCircle className={`h-3 w-3 ${isToday ? "text-accent" : "text-white/30"}`} weight="fill" />
            <span className="text-[11px] font-semibold text-white/50">{confirmed} confirmados</span>
          </div>
          <span className="text-white/15">·</span>
          <div className="flex items-center gap-1.5">
            <Circle className="h-3 w-3 text-white/20" />
            <span className="text-[11px] text-white/30">{total} total</span>
          </div>
        </div>
      </div>

      {/* Appointment list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {dayApts.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center gap-3 py-12 text-center"
            >
              <div className="h-10 w-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                <CalendarBlank className="h-5 w-5 text-white/20" weight="duotone" />
              </div>
              <p className="text-[12px] font-medium text-white/25">Sem consultas neste dia</p>
            </motion.div>
          ) : (
            dayApts.map((apt, i) => {
              const c = getAptColorStyle(apt.color, colorMap)
              const cfg = STATUS_CONFIG[apt.status]
              return (
                <motion.div
                  key={apt.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, delay: i * 0.04, ease }}
                  onClick={() => onAppointmentClick(apt)}
                  className={`rounded-xl border p-3 cursor-pointer hover:bg-white/[0.06] hover:ring-1 hover:ring-accent/30 transition-all duration-200 ${c.bg} ${c.border}
                    ${apt.status === "done" ? "opacity-40" : ""}
                    ${apt.status === "cancelled" ? "opacity-20" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${c.dot}`} />
                        <span className="text-[12px] font-bold text-white/90 truncate">{apt.patientName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 pl-3">
                        <Clock className="h-2.5 w-2.5 text-white/20" />
                        <span className="text-[10px] font-semibold text-white/40 font-mono">{apt.time}</span>
                        <span className="text-white/15">·</span>
                        <span className="text-[10px] text-white/25">{apt.duration}min</span>
                      </div>
                      <div className="flex items-center gap-1.5 pl-3">
                        <User className="h-2.5 w-2.5 text-white/20" />
                        <span className="text-[10px] text-white/35 truncate">{apt.doctorName}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <PaidBadge paid={apt.paid} />
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                      <button className="p-0.5 rounded hover:bg-white/5 transition-colors">
                        <WhatsappLogo className="h-3 w-3 text-white/20 hover:text-white/50 transition-colors" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>

      {/* CTA */}
      <div className="shrink-0 px-4 pb-4">
        <button
          onClick={onOpenNewAppointment}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-[12px] font-bold text-accent-foreground hover:bg-accent/90 transition-all duration-200 group"
        >
          <Plus className="h-3.5 w-3.5 group-hover:rotate-90 transition-transform duration-300" />
          Nova consulta
        </button>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type ViewMode = "month" | "week" | "day"

export default function CalendarPage() {
  const { data: me } = useMe()
  const { data: professionals, isLoading: loadingProfessionals } = useProfessionals()
  const [viewMode, setViewMode] = useState<ViewMode>("month")
  const [currentDate, setCurrentDate] = useState(new Date(THIS_YEAR, THIS_MONTH, 1))
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [activeDoctor, setActiveDoctor] = useState("all")
  const [novoAgendamentoOpen, setNovoAgendamentoOpen] = useState(false)
  const [novoAgendamentoDefaultDate, setNovoAgendamentoDefaultDate] = useState<Date | undefined>(undefined)
  const [selectedAppointment, setSelectedAppointment] = useState<CalendarAppointment | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const appointmentsParams = useMemo(() => {
    const first = new Date(year, month, 1)
    const last = new Date(year, month + 1, 0)
    const from = new Date(first)
    from.setMonth(from.getMonth() - 1)
    const to = new Date(last)
    to.setMonth(to.getMonth() + 1)
    const fromStr = toYMD(from)
    const toStr = toYMD(to)
    const role = me?.role
    const professionalId = me?.professionalId
    let professionalIdParam: string | undefined
    if (role === "PROFESSIONAL" && professionalId) {
      professionalIdParam = professionalId
    } else if ((role === "ADMIN" || role === "SECRETARY") && activeDoctor !== "all") {
      professionalIdParam = activeDoctor
    }
    return {
      from: fromStr,
      to: toStr,
      professionalId: professionalIdParam,
      limit: 100,
    }
  }, [year, month, me?.role, me?.professionalId, activeDoctor])

  const { data: appointmentsData, isLoading: loadingAppointments } = useAppointments(appointmentsParams)

  const professionalColorMap = useMemo(
    () => buildProfessionalColorMap(professionals ?? []),
    [professionals]
  )

  const allAppointments = useMemo(() => {
    const raw = appointmentsData?.data ?? []
    return raw.map(toCalendarAppointment)
  }, [appointmentsData])

  const doctorsList = useMemo(() => {
    if (!professionals) return []
    if (professionals.length === 0) {
      return [{ id: "all", name: "Todos", color: "text-white/60" }]
    }
    return [
      { id: "all", name: "Todos", color: "text-white/60" },
      ...professionals.map((p, i) => ({
        id: p.id,
        name: p.fullName,
        color: i === 0 ? "text-accent" : "text-white/60",
      })),
    ]
  }, [professionals])

  const filteredApts = useMemo(
    () =>
      activeDoctor === "all"
        ? allAppointments
        : allAppointments.filter((a) => a.doctorId === activeDoctor),
    [activeDoctor, allAppointments]
  )

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) days.push(d)
    while (days.length % 7 !== 0) days.push(null)
    return days
  }, [firstDay, daysInMonth])

  const navigate = (dir: 1 | -1) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + dir, 1))
  }

  const aptsForDay = (day: number) =>
    filteredApts.filter(a => a.day === day && a.month === month && a.year === year)

  const role = me?.role ?? "SECRETARY"
  const profId = me?.professionalId

  // Profissional: sempre calendário próprio. Admin/Secretary: calendário do profissional quando um for selecionado
  const showProfessionalCalendar =
    (role === "PROFESSIONAL" && !!profId) ||
    ((role === "ADMIN" || role === "SECRETARY") && activeDoctor !== "all" && !!activeDoctor)

  const professionalCalendarId = role === "PROFESSIONAL" ? profId : activeDoctor

  if (showProfessionalCalendar && professionalCalendarId) {
    const pro = professionals?.find((p) => p.id === professionalCalendarId)
    const canEditAvailability = role === "ADMIN" || role === "PROFESSIONAL"
    return (
      <div className="flex h-full overflow-hidden">
        <div className="flex-1 min-w-0 overflow-hidden">
          <ProfessionalCalendar
            professionalId={professionalCalendarId}
            professionalName={pro?.fullName ?? "Calendário"}
            canEdit={canEditAvailability}
            accentColor={pro?.calendarColor ?? "#22c55e"}
            onBackToAll={
              role === "ADMIN" || role === "SECRETARY"
                ? () => setActiveDoctor("all")
                : undefined
            }
          />
        </div>
      </div>
    )
  }

  const dayViewApts = filteredApts.filter(
    a => a.day === selectedDate.getDate() && a.month === selectedDate.getMonth() && a.year === selectedDate.getFullYear()
  )

  const isToday = (day: number) =>
    day === TODAY_DAY && month === THIS_MONTH && year === THIS_YEAR

  const isSelected = (day: number) =>
    day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear()

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Main calendar area ── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <div className="flex flex-col border-b border-border/40 shrink-0">
          <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => navigate(-1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-white/30 hover:text-white/70 hover:border-white/[0.14] hover:bg-white/[0.04] transition-all duration-200"
              >
                <CaretLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => navigate(1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-white/30 hover:text-white/70 hover:border-white/[0.14] hover:bg-white/[0.04] transition-all duration-200"
              >
                <CaretRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.h1
                key={`${year}-${month}`}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.25, ease }}
                className="text-[16px] font-black text-white/90 tracking-tight"
              >
                {MONTHS_PT[month]}{" "}
                <span className="text-white/35 font-semibold">{year}</span>
              </motion.h1>
            </AnimatePresence>

            <button
              onClick={() => {
                setCurrentDate(new Date(THIS_YEAR, THIS_MONTH, 1))
                setSelectedDate(new Date())
              }}
              className="text-[11px] font-bold text-accent border border-accent/25 hover:border-accent/50 hover:bg-accent/8 rounded-lg px-2.5 py-1 transition-all duration-200"
            >
              Hoje
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-white/20 pointer-events-none" />
              <input
                placeholder="Buscar paciente..."
                className="h-8 w-44 rounded-lg border border-white/[0.08] bg-white/[0.03] pl-7 pr-3 text-[12px] font-medium text-white/70 placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/30 transition-all duration-200"
              />
            </div>

            <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-white/25 hover:text-white/60 hover:bg-white/[0.04] transition-all duration-200">
              <Funnel className="h-3.5 w-3.5" />
            </button>

            {/* View mode toggle */}
            <div className="flex items-center rounded-lg border border-white/[0.08] bg-white/[0.02] p-0.5">
              {(["month", "week", "day"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`relative px-3 py-1 text-[11px] font-bold rounded-md transition-all duration-200 ${
                    viewMode === mode ? "text-white/90" : "text-white/25 hover:text-white/50"
                  }`}
                >
                  {viewMode === mode && (
                    <motion.div
                      layoutId="view-pill"
                      className="absolute inset-0 bg-white/[0.07] border border-white/[0.10] rounded-md"
                      transition={{ duration: 0.25, ease }}
                    />
                  )}
                  <span className="relative z-10">
                    {mode === "month" ? "Mês" : mode === "week" ? "Semana" : "Dia"}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setNovoAgendamentoDefaultDate(undefined)
                setNovoAgendamentoOpen(true)
              }}
              className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-accent text-accent-foreground text-[12px] font-bold hover:bg-accent/90 transition-colors duration-200 group"
            >
              <Plus className="h-3.5 w-3.5 group-hover:rotate-90 transition-transform duration-300" />
              Agendar
            </button>
          </div>
          </div>

          {/* Doctor filter tabs */}
          <div className="flex items-center gap-1 px-6 pb-3">
            {loadingProfessionals ? (
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent/30 border-t-accent shrink-0" />
                <span className="text-[11px] font-medium text-white/40">Carregando profissionais...</span>
              </div>
            ) : (
              doctorsList.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setActiveDoctor(doc.id)}
                  className={`relative px-3 py-1 rounded-full text-[11px] font-bold transition-all duration-200 ${
                    activeDoctor === doc.id ? "text-white/90" : "text-white/25 hover:text-white/50"
                  }`}
                >
                  {activeDoctor === doc.id && (
                    <motion.div
                      layoutId="doctor-pill"
                      className="absolute inset-0 bg-white/[0.06] border border-white/[0.10] rounded-full"
                      transition={{ duration: 0.22, ease }}
                    />
                  )}
                  <span className="relative z-10">{doc.name}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Calendar body */}
        <div className="flex-1 overflow-y-auto relative">
          {loadingAppointments && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-[1px] z-10">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
            </div>
          )}
          <AnimatePresence mode="wait">

            {/* ── Month view ── */}
            {viewMode === "month" && (
              <motion.div
                key="month"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease }}
                className="h-full flex flex-col"
              >
                <div className="grid grid-cols-7 border-b border-white/[0.05]">
                  {WEEKDAYS.map((d) => (
                    <div key={d} className="py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest text-white/20">
                      {d}
                    </div>
                  ))}
                </div>

                <div className="flex-1 grid grid-cols-7" style={{ gridAutoRows: "1fr" }}>
                  {calendarDays.map((day, idx) => {
                    const apts = day ? aptsForDay(day) : []
                    const today = day ? isToday(day) : false
                    const selected = day ? isSelected(day) : false
                    const isPast = day ? (
                      year < THIS_YEAR || (year === THIS_YEAR && month < THIS_MONTH) ||
                      (year === THIS_YEAR && month === THIS_MONTH && day < TODAY_DAY)
                    ) : false

                    return (
                      <motion.div
                        key={idx}
                        onClick={() => day && setSelectedDate(new Date(year, month, day))}
                        className={`relative border-b border-r border-white/[0.05] p-1.5 flex flex-col gap-1 min-h-[90px] ${
                          day ? "cursor-pointer hover:bg-white/[0.02]" : ""
                        } ${selected && !today ? "bg-white/[0.02]" : ""} ${
                          isPast && !today ? "opacity-40" : ""
                        }`}
                      >
                        {day && (
                          <>
                            <div className="flex items-center justify-between">
                              <span
                                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-black transition-colors duration-150 ${
                                  today
                                    ? "bg-accent text-accent-foreground"
                                    : selected
                                    ? "bg-white/[0.10] text-white/90"
                                    : "text-white/50 hover:text-white/80"
                                }`}
                              >
                                {day}
                              </span>
                              {apts.length > 0 && (
                                <span className="text-[9px] font-bold text-white/20 font-mono pr-0.5">
                                  {apts.length}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col gap-0.5">
                              {apts.slice(0, 3).map((apt) => (
                                <MiniApt
                                  key={apt.id}
                                  apt={apt}
                                  colorMap={professionalColorMap}
                                  onClick={() => setSelectedAppointment(apt)}
                                />
                              ))}
                              {apts.length > 3 && (
                                <span className="text-[8px] font-semibold text-white/20 pl-1">
                                  +{apts.length - 3} mais
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* ── Day view ── */}
            {viewMode === "day" && (
              <motion.div
                key="day"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease }}
                className="flex flex-col"
              >
                <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.05]">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedDate(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1))}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.04] transition-all duration-200"
                    >
                      <CaretLeft className="h-3 w-3" />
                    </button>
                    <span className="text-[14px] font-black text-white/80">
                      {WEEKDAYS[selectedDate.getDay()]},{" "}
                      <span className="text-white/50 font-semibold">
                        {selectedDate.getDate()} de {MONTHS_PT[selectedDate.getMonth()]}
                      </span>
                    </span>
                    <button
                      onClick={() => setSelectedDate(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1))}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.04] transition-all duration-200"
                    >
                      <CaretRight className="h-3 w-3" />
                    </button>
                  </div>
                  <span className="text-[11px] font-semibold text-white/25">
                    {dayViewApts.length} consulta{dayViewApts.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="relative">
                  {HOURS.map((hour) => (
                    <div key={hour} className="flex border-b border-white/[0.04]" style={{ height: 64 }}>
                      <div className="w-16 shrink-0 flex items-start justify-end pr-3 pt-1">
                        <span className="text-[10px] font-bold text-white/20 font-mono tabular-nums">
                          {String(hour).padStart(2, "0")}:00
                        </span>
                      </div>
                      <div className="flex-1 relative border-l border-white/[0.04]">
                        <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-white/[0.03]" />
                      </div>
                    </div>
                  ))}

                  <div className="absolute left-16 right-0 top-0 bottom-0 pointer-events-none">
                    <div className="relative h-full pointer-events-auto">
                      <AnimatePresence>
                        {dayViewApts.map((apt, i) => (
                          <DayAptCard
                            key={apt.id}
                            apt={apt}
                            index={i}
                            colorMap={professionalColorMap}
                            onClick={() => setSelectedAppointment(apt)}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>

                  {selectedDate.toDateString() === new Date().toDateString() && (() => {
                    const now = new Date()
                    const nowMin = now.getHours() * 60 + now.getMinutes() - 7 * 60
                    if (nowMin < 0 || nowMin > 12 * 60) return null
                    const top = (nowMin / 60) * 64
                    return (
                      <div className="absolute left-14 right-0 pointer-events-none z-10" style={{ top }}>
                        <div className="flex items-center">
                          <div className="h-2 w-2 rounded-full bg-accent ml-0.5 shrink-0" />
                          <div className="flex-1 h-px bg-accent/40" />
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </motion.div>
            )}

            {/* ── Week view ── */}
            {viewMode === "week" && (
              <motion.div
                key="week"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease }}
              >
                {(() => {
                  const startOfWeek = new Date(selectedDate)
                  startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay())
                  const weekDays = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date(startOfWeek)
                    d.setDate(startOfWeek.getDate() + i)
                    return d
                  })
                  return (
                    <>
                      <div className="grid grid-cols-8 border-b border-white/[0.05]">
                        <div className="w-16" />
                        {weekDays.map((d, i) => {
                          const today = d.toDateString() === new Date().toDateString()
                          const sel = d.toDateString() === selectedDate.toDateString()
                          return (
                            <button
                              key={i}
                              onClick={() => setSelectedDate(d)}
                              className="py-3 flex flex-col items-center gap-0.5 hover:bg-white/[0.02] transition-colors duration-150"
                            >
                              <span className="text-[9px] font-extrabold uppercase tracking-widest text-white/20">{WEEKDAYS[d.getDay()]}</span>
                              <span className={`h-7 w-7 flex items-center justify-center rounded-full text-[13px] font-black transition-colors ${
                                today ? "bg-accent text-accent-foreground" : sel ? "bg-white/[0.10] text-white/90" : "text-white/40 hover:text-white/70"
                              }`}>{d.getDate()}</span>
                            </button>
                          )
                        })}
                      </div>
                      <div className="relative">
                        {HOURS.map((hour) => (
                          <div key={hour} className="flex border-b border-white/[0.04]" style={{ height: 56 }}>
                            <div className="w-16 shrink-0 flex items-start justify-end pr-3 pt-1">
                              <span className="text-[9px] font-bold text-white/20 font-mono">{String(hour).padStart(2,"0")}:00</span>
                            </div>
                            {weekDays.map((d, di) => {
                              const apts = filteredApts.filter(
                                a => a.day === d.getDate() && a.month === d.getMonth() && a.year === d.getFullYear() &&
                                  parseInt(a.time.split(":")[0]) === hour
                              )
                              return (
                                <div key={di} className="flex-1 border-l border-white/[0.04] relative px-0.5 py-0.5 flex flex-col gap-0.5">
                                  {apts.map((apt) => {
                                    const c = getAptColorStyle(apt.color, professionalColorMap)
                                    return (
                                      <button
                                        key={apt.id}
                                        onClick={() => setSelectedAppointment(apt)}
                                        className={`w-full text-left rounded px-1.5 py-0.5 text-[9px] font-bold truncate border cursor-pointer hover:ring-1 hover:ring-accent/40 transition-all ${c.bg} ${c.border} ${c.text} flex items-center gap-1`}
                                      >
                                        <span className="truncate">{apt.time} {apt.patientName.split(" ")[0]}</span>
                                        <span className={`h-1 w-1 rounded-full shrink-0 ${apt.paid ? "bg-white/40" : "bg-white/10"}`} />
                                      </button>
                                    )
                                  })}
                                </div>
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    </>
                  )
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <NovoAgendamentoModal
        open={novoAgendamentoOpen}
        onClose={() => setNovoAgendamentoOpen(false)}
        defaultDate={novoAgendamentoDefaultDate}
      />

      {selectedAppointment && (
        <AppointmentStatusModal
          open={!!selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          appointment={{
            id: selectedAppointment.id,
            patientName: selectedAppointment.patientName,
            time: selectedAppointment.time,
            type: selectedAppointment.type,
            doctorName: selectedAppointment.doctorName,
            status: selectedAppointment.statusApi,
          }}
        />
      )}

      {/* ── Side panel ── */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease }}
        className="hidden lg:flex w-[260px] shrink-0 flex-col border-l border-white/[0.06] bg-background/50 overflow-hidden"
      >
        <SidePanel
          appointments={filteredApts}
          selectedDate={selectedDate}
          colorMap={professionalColorMap}
          onOpenNewAppointment={() => {
            setNovoAgendamentoDefaultDate(selectedDate)
            setNovoAgendamentoOpen(true)
          }}
          onAppointmentClick={(apt) => setSelectedAppointment(apt)}
        />
      </motion.div>
    </div>
  )
}
