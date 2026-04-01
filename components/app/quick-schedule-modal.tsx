"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Check,
  CalendarBlank,
  Clock,
  Warning,
  CaretLeft,
  CaretRight,
  Spinner,
} from "@phosphor-icons/react"
import { useProfessionals } from "@/hooks/use-professionals"
import { useServices } from "@/hooks/use-services"
import { useCreateAppointment } from "@/hooks/use-appointments"
import { professionalsApi } from "@/lib/api/professionals"
import { useQuery } from "@tanstack/react-query"
import { toYMD, todayYMD } from "@/lib/date-utils"

const ease = [0.33, 1, 0.68, 1] as const

const WEEKDAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"]
const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

function formatDateShort(d: Date) {
  return `${WEEKDAYS_PT[d.getDay()]}, ${d.getDate()} de ${MONTHS_PT[d.getMonth()]?.toLowerCase()}`
}

// ─── Mini calendar ────────────────────────────────────────────────────────────

function MiniCalendar({
  selected,
  onSelect,
}: {
  selected: string
  onSelect: (ymd: string) => void
}) {
  const today = new Date()
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [viewYear, setViewYear] = useState(today.getFullYear())

  const todayStr = todayYMD()

  const days = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1)
    const startDay = first.getDay()
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

    const cells: Array<{ date: Date; ymd: string; inMonth: boolean }> = []
    for (let i = 0; i < startDay; i++) cells.push({ date: new Date(0), ymd: "", inMonth: false })
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d)
      cells.push({ date, ymd: toYMD(date), inMonth: true })
    }
    return cells
  }, [viewMonth, viewYear])

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) }
    else setViewMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) }
    else setViewMonth((m) => m + 1)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={prevMonth} className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted/40 text-muted-foreground cursor-pointer">
          <CaretLeft className="h-3.5 w-3.5" weight="bold" />
        </button>
        <span className="text-[11px] font-semibold text-foreground">
          {MONTHS_PT[viewMonth]} {viewYear}
        </span>
        <button type="button" onClick={nextMonth} className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted/40 text-muted-foreground cursor-pointer">
          <CaretRight className="h-3.5 w-3.5" weight="bold" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {WEEKDAYS_PT.map((wd) => (
          <div key={wd} className="text-center text-[9px] font-bold text-muted-foreground/60 uppercase py-1">
            {wd}
          </div>
        ))}
        {days.map((cell, i) => {
          if (!cell.inMonth) return <div key={`empty-${i}`} />
          const isPast = cell.ymd < todayStr
          const isSelected = cell.ymd === selected
          const isToday = cell.ymd === todayStr
          return (
            <button
              key={cell.ymd}
              type="button"
              disabled={isPast}
              onClick={() => onSelect(cell.ymd)}
              className={`h-7 w-7 mx-auto flex items-center justify-center rounded-lg text-[11px] font-medium transition-all cursor-pointer
                ${isPast ? "text-muted-foreground/30 cursor-not-allowed" : ""}
                ${isSelected ? "bg-accent text-accent-foreground" : ""}
                ${!isSelected && !isPast ? "hover:bg-accent/15 text-foreground" : ""}
                ${isToday && !isSelected ? "ring-1 ring-accent/40" : ""}
              `}
            >
              {cell.date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export interface QuickScheduleContact {
  id: string
  name: string | null
  phone: string
}

export function QuickScheduleModal({
  contact,
  onClose,
}: {
  contact: QuickScheduleContact
  onClose: () => void
}) {
  const { data: professionals } = useProfessionals()
  const { data: services } = useServices()
  const createAppointment = useCreateAppointment()

  const [professionalId, setProfessionalId] = useState("")
  const [serviceId, setServiceId] = useState("")
  const [selectedDate, setSelectedDate] = useState(todayYMD())
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [showNotes, setShowNotes] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeProfessionals = professionals ?? []
  const consultations = (services ?? []).filter((s) => s.isConsultation && s.isActive)
  const selectedService = consultations.find((s) => s.id === serviceId)
  const selectedPro = activeProfessionals.find((p) => p.id === professionalId)

  // Fetch available slots when professional, service and date are set
  const slotsQuery = useQuery({
    queryKey: ["quick-schedule-slots", professionalId, serviceId, selectedDate],
    queryFn: () => professionalsApi.getSlots(professionalId, { date: selectedDate, serviceId }),
    enabled: !!professionalId && !!serviceId && !!selectedDate,
    staleTime: 15_000,
  })

  const slots = slotsQuery.data?.slots ?? []

  const canConfirm = !!professionalId && !!serviceId && !!selectedSlot

  const handleConfirm = async () => {
    setError(null)
    if (!canConfirm) return
    const slot = slots.find((s) => s.time === selectedSlot)
    try {
      await createAppointment.mutateAsync({
        contactId: contact.id,
        professionalId,
        serviceId,
        scheduledAt: slot?.scheduledAt ?? new Date(`${selectedDate}T${selectedSlot}:00`).toISOString(),
        durationMin: selectedService?.durationMin,
        notes: notes.trim() || undefined,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar agendamento.")
    }
  }

  // Auto-select when there's only one option
  if (activeProfessionals.length === 1 && !professionalId) setProfessionalId(activeProfessionals[0].id)
  if (consultations.length === 1 && !serviceId) setServiceId(consultations[0].id)

  const displayName = contact.name || contact.phone

  return (
    <AnimatePresence>
      <motion.div
        key="quick-schedule-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      >
        <motion.div
          key="quick-schedule-modal"
          initial={{ scale: 0.95, y: 12 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 8 }}
          transition={{ duration: 0.2, ease }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-2xl border border-border/80 bg-overlay shadow-2xl shadow-foreground/10 overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
                <CalendarBlank className="h-4 w-4 text-accent" weight="duotone" />
              </div>
              <div>
                <h2 className="text-[13px] font-semibold text-foreground leading-none">Agendar consulta</h2>
                <p className="text-[11px] text-muted-foreground/85 mt-0.5">{displayName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            {/* Professional */}
            {activeProfessionals.length > 1 && (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Profissional</label>
                <div className="flex flex-wrap gap-1.5">
                  {activeProfessionals.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setProfessionalId(p.id); setSelectedSlot(null) }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-all cursor-pointer ${
                        professionalId === p.id
                          ? "border-accent/50 bg-accent/10 text-accent"
                          : "border-border/60 text-foreground hover:border-border hover:bg-muted/20"
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: p.calendarColor || "#22c55e" }} />
                      {p.fullName}
                      {professionalId === p.id && <Check className="h-3 w-3" weight="bold" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Service */}
            {consultations.length > 1 && (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Servico</label>
                <div className="flex flex-wrap gap-1.5">
                  {consultations.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => { setServiceId(s.id); setSelectedSlot(null) }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-all cursor-pointer ${
                        serviceId === s.id
                          ? "border-accent/50 bg-accent/10 text-accent"
                          : "border-border/60 text-foreground hover:border-border hover:bg-muted/20"
                      }`}
                    >
                      {s.name}
                      <span className="text-[10px] text-muted-foreground">{s.durationMin}min</span>
                      {serviceId === s.id && <Check className="h-3 w-3" weight="bold" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Date picker */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Data</label>
              <MiniCalendar
                selected={selectedDate}
                onSelect={(ymd) => { setSelectedDate(ymd); setSelectedSlot(null) }}
              />
            </div>

            {/* Time slots */}
            {professionalId && serviceId && selectedDate && (
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <Clock className="h-3 w-3" />
                  Horarios disponiveis
                  {selectedPro && (
                    <span className="font-normal normal-case text-muted-foreground/60">
                      - {formatDateShort(new Date(selectedDate + "T12:00:00"))}
                    </span>
                  )}
                </label>
                {slotsQuery.isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Spinner className="h-5 w-5 text-accent animate-spin" />
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground/70 py-2">
                    {slotsQuery.data?.reason || "Nenhum horario disponivel nesta data."}
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-1.5">
                    {slots.map((s) => (
                      <button
                        key={s.time}
                        type="button"
                        onClick={() => setSelectedSlot(s.time)}
                        className={`py-1.5 rounded-lg border text-[12px] font-medium tabular-nums transition-all cursor-pointer ${
                          selectedSlot === s.time
                            ? "border-accent/50 bg-accent/10 text-accent"
                            : "border-border/60 text-foreground hover:border-accent/30 hover:bg-accent/5"
                        }`}
                      >
                        {s.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            {!showNotes ? (
              <button
                type="button"
                onClick={() => setShowNotes(true)}
                className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 decoration-border/40 cursor-pointer"
              >
                + Adicionar observacao
              </button>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Observacoes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas sobre a consulta..."
                  rows={2}
                  autoFocus
                  className="w-full rounded-xl border border-border/70 bg-foreground/[0.03] px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all min-h-[60px] resize-none"
                />
              </div>
            )}
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mx-5 mb-2 flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/[0.08] px-3.5 py-2.5"
              >
                <Warning className="h-4 w-4 text-rose-400 shrink-0" weight="fill" />
                <p className="text-[12px] text-rose-400">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <div className="px-5 pb-5">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!canConfirm || createAppointment.isPending}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-[13px] font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {createAppointment.isPending ? (
                <Spinner className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" weight="bold" />
              )}
              {createAppointment.isPending ? "Agendando..." : "Confirmar agendamento"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
