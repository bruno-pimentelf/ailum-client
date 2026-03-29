"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  CheckCircle,
  XCircle,
  Clock,
  Prohibit,
  Warning,
  CalendarBlank,
  User,
  Phone,
  WhatsappLogo,
  CurrencyDollar,
  Stethoscope,
  NotePencil,
} from "@phosphor-icons/react"
import { useUpdateAppointment } from "@/hooks/use-appointments"
import { useAuthStore } from "@/lib/auth-store"
import { ChatView } from "@/components/app/chat-view"
import type { AppointmentStatus } from "@/lib/api/scheduling"
import type { FirestoreContact } from "@/lib/types/firestore"
import { Timestamp } from "firebase/firestore"

const ease = [0.33, 1, 0.68, 1] as const

// ─── Status config ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  PENDING: {
    label: "Pendente",
    color: "text-amber-400",
    bg: "bg-amber-500/[0.08] border-amber-500/20",
    dot: "bg-amber-400",
  },
  CONFIRMED: {
    label: "Confirmado",
    color: "text-emerald-400",
    bg: "bg-emerald-500/[0.08] border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  CANCELLED: {
    label: "Cancelado",
    color: "text-muted-foreground/60",
    bg: "bg-foreground/[0.03] border-border/60",
    dot: "bg-foreground/30",
  },
  COMPLETED: {
    label: "Realizado",
    color: "text-cyan-400",
    bg: "bg-cyan-500/[0.08] border-cyan-500/20",
    dot: "bg-cyan-400",
  },
  NO_SHOW: {
    label: "Não compareceu",
    color: "text-rose-400",
    bg: "bg-rose-500/[0.06] border-rose-500/20",
    dot: "bg-rose-400",
  },
}

const STATUS_ACTIONS: {
  target: AppointmentStatus
  label: string
  icon: typeof CheckCircle
  color: string
  hoverBg: string
}[] = [
  { target: "CONFIRMED", label: "Confirmar", icon: CheckCircle, color: "text-emerald-400", hoverBg: "hover:bg-emerald-500/[0.08]" },
  { target: "COMPLETED", label: "Realizado", icon: CheckCircle, color: "text-cyan-400", hoverBg: "hover:bg-cyan-500/[0.08]" },
  { target: "NO_SHOW", label: "Não compareceu", icon: Prohibit, color: "text-amber-400", hoverBg: "hover:bg-amber-500/[0.08]" },
]

// ─── Types ──────────────────────────────────────────────────────────────────

interface AppointmentData {
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
  statusApi: AppointmentStatus
  paid: boolean
  notes: string | null
  chargeAmount: number | null
  chargeStatus: string | null
  [key: string]: unknown
}

interface AppointmentStatusModalProps {
  open: boolean
  onClose: () => void
  appointment: AppointmentData
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso)
  const day = d.getDate()
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]
  const weekdays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]
  return `${weekdays[d.getDay()]}, ${day} de ${months[d.getMonth()]}`
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100)
}

function formatPhone(phone: string) {
  const clean = phone.replace(/\D/g, "")
  if (clean.startsWith("55") && clean.length >= 12) {
    const local = clean.slice(2)
    const ddd = local.slice(0, 2)
    const rest = local.slice(2)
    if (rest.length === 9) return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`
    if (rest.length === 8) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`
  }
  return phone
}

// ─── Main Modal ─────────────────────────────────────────────────────────────

export function AppointmentStatusModal({
  open,
  onClose,
  appointment,
}: AppointmentStatusModalProps) {
  const [cancelledReason, setCancelledReason] = useState("")
  const [showCancelInput, setShowCancelInput] = useState(false)
  const updateMutation = useUpdateAppointment()
  const tenantId = useAuthStore((s) => s.tenantId)

  const firestoreContact = useMemo<FirestoreContact>(() => ({
    id: appointment.contactId,
    contactName: appointment.patientName,
    contactPhone: appointment.contactPhone,
    status: "ACTIVE",
    updatedAt: Timestamp.now(),
  }), [appointment.contactId, appointment.patientName, appointment.contactPhone])

  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose()
  }, [onClose])

  useEffect(() => {
    if (!open) return
    document.addEventListener("keydown", handleEsc)
    return () => document.removeEventListener("keydown", handleEsc)
  }, [open, handleEsc])

  if (!open) return null

  const handleUpdate = (status: AppointmentStatus, extra?: { cancelledReason?: string }) => {
    updateMutation.mutate(
      { id: appointment.id, body: { status, ...extra } },
      {
        onSuccess: () => {
          onClose()
          setCancelledReason("")
          setShowCancelInput(false)
        },
      }
    )
  }

  const isPending = updateMutation.isPending
  const statusCfg = STATUS_CONFIG[appointment.statusApi]
  const dateStr = appointment.scheduledAt ? formatDate(appointment.scheduledAt) : ""

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 10 }}
        transition={{ duration: 0.3, ease }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[1100px] h-[calc(100vh-1rem)] sm:h-[calc(100vh-1.5rem)] rounded-2xl border border-border/60 bg-background shadow-2xl overflow-hidden flex flex-row"
      >
        {/* ═══ Left panel — Info & Actions ═══ */}
        <div className="w-[380px] shrink-0 flex flex-col border-r border-foreground/[0.06] overflow-hidden">

          {/* Header */}
          <div className="px-5 pt-5 pb-4 border-b border-foreground/[0.06] shrink-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-accent/[0.08] border border-accent/10 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-accent/60" weight="bold" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold text-foreground truncate">
                    {appointment.patientName}
                  </h3>
                  {appointment.contactPhone && (
                    <p className="text-[12px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                      <Phone className="h-3 w-3 shrink-0" />
                      {formatPhone(appointment.contactPhone)}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 -m-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" weight="bold" />
              </button>
            </div>

            {/* Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${statusCfg.bg} ${statusCfg.color}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                {statusCfg.label}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-foreground/[0.06] bg-foreground/[0.02] px-2 py-0.5 text-[10px] text-muted-foreground">
                <CalendarBlank className="h-2.5 w-2.5" />
                {dateStr}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-foreground/[0.06] bg-foreground/[0.02] px-2 py-0.5 text-[10px] text-muted-foreground">
                <Clock className="h-2.5 w-2.5" />
                {appointment.time} · {appointment.duration}min
              </span>
              {appointment.chargeAmount != null && (
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                  appointment.chargeStatus === "PAID"
                    ? "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-400"
                    : "border-amber-500/20 bg-amber-500/[0.06] text-amber-400"
                }`}>
                  <CurrencyDollar className="h-2.5 w-2.5" />
                  {formatCurrency(appointment.chargeAmount)}
                </span>
              )}
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

            {/* Service + Doctor */}
            <div className="grid grid-cols-2 gap-2.5">
              <InfoBlock icon={Stethoscope} label="Serviço" value={appointment.type} />
              <InfoBlock icon={User} label="Profissional" value={appointment.doctorName} />
            </div>

            {/* Notes */}
            {appointment.notes && (
              <div className="rounded-xl border border-foreground/[0.06] bg-foreground/[0.015] p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <NotePencil className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Observações</span>
                </div>
                <p className="text-[12px] text-muted-foreground leading-relaxed">{appointment.notes}</p>
              </div>
            )}

            {/* Error */}
            <AnimatePresence>
              {updateMutation.isError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-[11px] text-destructive"
                >
                  <Warning className="h-3.5 w-3.5 shrink-0" weight="fill" />
                  Erro ao atualizar. Tente novamente.
                </motion.div>
              )}
            </AnimatePresence>

            {/* Status actions */}
            {appointment.statusApi !== "CANCELLED" ? (
              <div className="space-y-2">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Alterar status</span>
                <div className="space-y-1.5">
                  {STATUS_ACTIONS.filter((a) => a.target !== appointment.statusApi).map((action) => (
                    <button
                      key={action.target}
                      onClick={() => handleUpdate(action.target)}
                      disabled={isPending}
                      className={`w-full flex items-center gap-3 h-10 rounded-xl border border-foreground/[0.06] bg-foreground/[0.015] px-3.5 text-left text-[12px] font-medium text-foreground transition-all disabled:opacity-40 cursor-pointer ${action.hoverBg} hover:border-border group`}
                    >
                      <action.icon className={`h-4 w-4 ${action.color} opacity-60 group-hover:opacity-100 transition-opacity`} weight="bold" />
                      <span className="flex-1">{action.label}</span>
                    </button>
                  ))}
                </div>

                {/* Cancel */}
                <AnimatePresence>
                  {!showCancelInput ? (
                    <button
                      onClick={() => setShowCancelInput(true)}
                      className="w-full flex items-center justify-center gap-1.5 h-9 rounded-xl border border-foreground/[0.04] text-[11px] text-muted-foreground/50 hover:text-rose-400/70 hover:border-rose-500/15 hover:bg-rose-500/[0.04] transition-all cursor-pointer"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Cancelar consulta
                    </button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-xl border border-rose-500/15 bg-rose-500/[0.03] p-3 space-y-2">
                        <input
                          type="text"
                          value={cancelledReason}
                          onChange={(e) => setCancelledReason(e.target.value)}
                          placeholder="Motivo do cancelamento (opcional)"
                          autoFocus
                          className="w-full h-8 rounded-lg border border-border/60 bg-foreground/[0.03] px-3 text-[12px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-rose-500/30 transition-all"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setShowCancelInput(false); setCancelledReason("") }}
                            className="flex-1 h-8 rounded-lg text-[11px] text-muted-foreground/60 hover:text-muted-foreground/80 transition-colors cursor-pointer"
                          >
                            Voltar
                          </button>
                          <button
                            onClick={() => handleUpdate("CANCELLED", { cancelledReason: cancelledReason.trim() || undefined })}
                            disabled={isPending}
                            className="flex-1 h-8 rounded-lg bg-rose-500/15 text-rose-400 text-[11px] font-medium hover:bg-rose-500/25 transition-all disabled:opacity-40 cursor-pointer"
                          >
                            Confirmar
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center justify-center py-4 rounded-xl border border-foreground/[0.04] bg-foreground/[0.01]">
                <p className="text-[12px] text-muted-foreground/50">Esta consulta foi cancelada</p>
              </div>
            )}
          </div>
        </div>

        {/* ═══ Right panel — Chat ═══ */}
        <div className="flex-1 min-w-0 flex flex-col">
          {tenantId ? (
            <ChatView contact={firestoreContact} tenantId={tenantId} />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="h-5 w-5 rounded-full border-[1.5px] border-border/70 border-t-accent/60 animate-spin" />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// ─── Info Block ─────────────────────────────────────────────────────────────

function InfoBlock({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-foreground/[0.06] bg-foreground/[0.015] p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-[13px] font-medium text-foreground truncate">{value}</p>
    </div>
  )
}
