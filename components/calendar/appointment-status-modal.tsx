"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  X,
  CheckCircle,
  XCircle,
  Clock,
  Prohibit,
  Warning,
  CalendarBlank,
  User,
} from "@phosphor-icons/react"
import { useUpdateAppointment } from "@/hooks/use-appointments"
import type { AppointmentStatus } from "@/lib/api/scheduling"

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; dot: string; card: string }
> = {
  PENDING: {
    label: "Pendente",
    dot: "bg-amber-500/50",
    card: "border-l-amber-500/30 bg-amber-500/[0.04]",
  },
  CONFIRMED: {
    label: "Confirmado",
    dot: "bg-emerald-500/50",
    card: "border-l-emerald-500/30 bg-emerald-500/[0.04]",
  },
  CANCELLED: {
    label: "Cancelado",
    dot: "bg-white/20",
    card: "border-l-white/10 bg-white/[0.02]",
  },
  COMPLETED: {
    label: "Realizado",
    dot: "bg-cyan-500/50",
    card: "border-l-cyan-500/30 bg-cyan-500/[0.04]",
  },
  NO_SHOW: {
    label: "Não compareceu",
    dot: "bg-rose-500/40",
    card: "border-l-rose-500/25 bg-rose-500/[0.03]",
  },
}


interface AppointmentStatusModalProps {
  open: boolean
  onClose: () => void
  appointment: {
    id: string
    patientName: string
    time: string
    type: string
    doctorName?: string
    status: AppointmentStatus
    scheduledAt?: string
  }
}

export function AppointmentStatusModal({
  open,
  onClose,
  appointment,
}: AppointmentStatusModalProps) {
  const [cancelledReason, setCancelledReason] = useState("")
  const updateMutation = useUpdateAppointment()

  if (!open) return null

  const handleUpdate = (status: AppointmentStatus, extra?: { cancelledReason?: string }) => {
    updateMutation.mutate(
      {
        id: appointment.id,
        body: { status, ...extra },
      },
      {
        onSuccess: () => {
          onClose()
          setCancelledReason("")
        },
      }
    )
  }

  const isPending = updateMutation.isPending
  const statusCfg = STATUS_CONFIG[appointment.status]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] rounded-2xl border border-white/[0.08] bg-background shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h3 className="text-[15px] font-semibold text-foreground flex items-center gap-2">
            <CalendarBlank className="h-4 w-4 text-muted-foreground" weight="duotone" />
            Atualizar status
          </h3>
          <button
            onClick={onClose}
            className="p-2 -m-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors"
          >
            <X className="h-4 w-4" weight="bold" />
          </button>
        </div>

        {/* Appointment info */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <div className="flex items-center gap-2.5">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-[15px] font-semibold text-foreground">
                {appointment.patientName}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1.5 ml-6 text-[13px] text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>{appointment.time}</span>
              <span className="text-white/20">·</span>
              <span>{appointment.type}</span>
              {appointment.doctorName && (
                <>
                  <span className="text-white/20">·</span>
                  <span>{appointment.doctorName}</span>
                </>
              )}
            </div>
          </div>

          {/* Status badge */}
          <div
            className={`flex items-center gap-2.5 rounded-xl border-l-2 px-4 py-3 ${statusCfg.card}`}
          >
            <span className={`h-2 w-2 rounded-full shrink-0 ${statusCfg.dot}`} />
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Status atual
              </p>
              <p className="text-[13px] font-semibold text-foreground mt-0.5">
                {statusCfg.label}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 space-y-3">
          {updateMutation.isError && (
            <div className="flex items-center gap-2.5 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-[12px] text-destructive">
              <Warning className="h-3.5 w-3.5 shrink-0" weight="fill" />
              Erro ao atualizar. Tente novamente.
            </div>
          )}

          {appointment.status !== "CANCELLED" && (
            <div className="space-y-2">
              {appointment.status !== "CONFIRMED" && (
                <ActionCard
                  dot="bg-emerald-500/40"
                  cardClass="hover:border-emerald-500/20 hover:bg-emerald-500/[0.06]"
                  icon={CheckCircle}
                  label="Marcar como confirmado"
                  onClick={() => handleUpdate("CONFIRMED")}
                  disabled={isPending}
                />
              )}

              {appointment.status !== "COMPLETED" && (
                <ActionCard
                  dot="bg-cyan-500/40"
                  cardClass="hover:border-cyan-500/20 hover:bg-cyan-500/[0.06]"
                  icon={CheckCircle}
                  label="Marcar como realizado"
                  onClick={() => handleUpdate("COMPLETED")}
                  disabled={isPending}
                />
              )}

              {appointment.status !== "NO_SHOW" && (
                <ActionCard
                  dot="bg-amber-500/40"
                  cardClass="hover:border-amber-500/20 hover:bg-amber-500/[0.06]"
                  icon={Prohibit}
                  label="Marcar como não compareceu"
                  onClick={() => handleUpdate("NO_SHOW")}
                  disabled={isPending}
                />
              )}

              {/* Cancelar */}
              <div className="pt-3 mt-3 border-t border-white/[0.06] space-y-2">
                <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Cancelar consulta
                </label>
                <input
                  type="text"
                  value={cancelledReason}
                  onChange={(e) => setCancelledReason(e.target.value)}
                  placeholder="Motivo (opcional)"
                  className="w-full h-10 rounded-xl border border-white/[0.09] bg-white/[0.03] px-3.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/40 transition-all"
                />
                <button
                  onClick={() =>
                    handleUpdate("CANCELLED", {
                      cancelledReason: cancelledReason.trim() || undefined,
                    })
                  }
                  disabled={isPending}
                  className="w-full flex items-center gap-2.5 h-10 rounded-xl border border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:border-white/15 hover:bg-white/[0.05] hover:text-foreground text-[13px] font-medium transition-colors disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" weight="regular" />
                  Cancelar consulta
                </button>
              </div>
            </div>
          )}

          {appointment.status === "CANCELLED" && (
            <p className="text-[13px] text-muted-foreground text-center py-6">
              Esta consulta já está cancelada.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  )
}

function ActionCard({
  dot,
  cardClass,
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  dot: string
  cardClass: string
  icon: typeof CheckCircle
  label: string
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 h-11 rounded-xl border border-white/[0.06] px-4 text-left text-[13px] font-medium text-foreground transition-all disabled:opacity-50 ${cardClass}`}
    >
      <span className={`h-2 w-2 rounded-full shrink-0 ${dot}`} />
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" weight="regular" />
      <span className="flex-1">{label}</span>
    </button>
  )
}
