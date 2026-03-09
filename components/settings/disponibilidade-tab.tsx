"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQueryClient } from "@tanstack/react-query"
import {
  CalendarBlank,
  Clock,
  Check,
  Trash,
  ArrowsClockwise,
  Warning,
  User,
  IdentificationCard,
} from "@phosphor-icons/react"
import { useMe } from "@/hooks/use-me"
import { useProfessionals, useProfessional, useProfessionalMutations } from "@/hooks/use-professionals"
import { professionalsApi } from "@/lib/api/professionals"
import { membersApi } from "@/lib/api/members"
import { AvailabilityWeekGrid } from "@/components/settings/availability-week-grid"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { AvailabilitySlot, AvailabilityException } from "@/lib/api/professionals"

const ease = [0.33, 1, 0.68, 1] as const

const inputCls =
  "h-9 w-full rounded-xl border border-border/60 bg-background/40 px-3 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all duration-200"
const labelCls = "block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5"

function formatDateBR(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number)
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`
}

// ─── Criar Meu Perfil Profissional ────────────────────────────────────────────

function CriarMeuPerfilProfissional({
  memberId,
  onSuccess,
}: {
  memberId: string
  onSuccess: () => void
}) {
  const [fullName, setFullName] = useState("")
  const [specialty, setSpecialty] = useState("")
  const [calendarColor, setCalendarColor] = useState("#22c55e")
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) {
      setErr("Informe seu nome.")
      return
    }
    setErr(null)
    setLoading(true)
    try {
      const pro = await professionalsApi.create({
        fullName: fullName.trim(),
        specialty: specialty.trim() || undefined,
        calendarColor: calendarColor || undefined,
      })
      await membersApi.updateRole(memberId, { professionalId: pro.id })
      onSuccess()
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao criar perfil")
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
      className="max-w-md mx-auto"
    >
      <div className="rounded-2xl border border-border/50 bg-background/30 backdrop-blur-sm overflow-hidden shadow-xl shadow-black/10">
        <div className="px-6 py-5 border-b border-border/40 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <IdentificationCard className="h-5 w-5 text-accent" weight="duotone" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-foreground">Criar meu perfil profissional</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Vincule à sua conta para configurar disponibilidade
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className={labelCls}>Nome completo *</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Dr. João Silva"
              className={inputCls}
              autoFocus
            />
          </div>
          <div>
            <label className={labelCls}>Especialidade</label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="Ex: Fisioterapia"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Cor no calendário</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={calendarColor}
                onChange={(e) => setCalendarColor(e.target.value)}
                className="h-9 w-14 rounded-xl border border-border/60 cursor-pointer bg-transparent overflow-hidden"
              />
              <input
                type="text"
                value={calendarColor}
                onChange={(e) => setCalendarColor(e.target.value)}
                className={`${inputCls} flex-1 font-mono`}
                placeholder="#22c55e"
              />
            </div>
          </div>
          {err && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-red-400/90 text-[12px] font-medium"
            >
              <Warning className="h-4 w-4 shrink-0" />
              {err}
            </motion.div>
          )}
          <button
            type="submit"
            disabled={loading || !fullName.trim()}
            className="w-full h-11 rounded-xl bg-accent text-accent-foreground text-[13px] font-bold hover:bg-accent/90 transition-all duration-200 disabled:opacity-50 hover:shadow-lg hover:shadow-accent/10"
          >
            {loading ? "Criando…" : "Criar e vincular"}
          </button>
        </form>
      </div>
    </motion.div>
  )
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export function DisponibilidadeTab() {
  const queryClient = useQueryClient()
  const { data: me } = useMe()
  const { data: professionals, isLoading: loadingProfs } = useProfessionals()

  const role = me?.role ?? "SECRETARY"
  const professionalIdFromAuth = me?.professionalId ?? null
  const canEdit = role === "ADMIN" || role === "PROFESSIONAL"

  const [selectedProfId, setSelectedProfId] = useState<string | null>(null)
  const effectiveProfId = role === "PROFESSIONAL" ? professionalIdFromAuth : selectedProfId

  useEffect(() => {
    if (role === "ADMIN" && professionals?.length && !selectedProfId) {
      const ownId =
        professionalIdFromAuth && professionals.some((p) => p.id === professionalIdFromAuth)
          ? professionalIdFromAuth
          : null
      setSelectedProfId(ownId ?? professionals[0].id)
    } else if (role === "PROFESSIONAL" && professionalIdFromAuth) {
      setSelectedProfId(professionalIdFromAuth)
    }
  }, [role, professionals, professionalIdFromAuth, selectedProfId])

  const { data: professional, isLoading: loadingProf } = useProfessional(effectiveProfId)
  const { putAvailability, addException, removeException } = useProfessionalMutations(effectiveProfId)

  const [slots, setSlots] = useState<Array<{ dayOfWeek: number; startTime: string; endTime: string; slotDurationMin?: number }>>([])
  const [newExceptionDate, setNewExceptionDate] = useState("")
  const [newExceptionReason, setNewExceptionReason] = useState("")
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!professional?.availability) return
    const mapped = (professional.availability as AvailabilitySlot[]).map((a) => ({
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime ?? "09:00",
      endTime: a.endTime ?? "18:00",
      slotDurationMin: a.slotDurationMin ?? 50,
    }))
    setSlots(mapped)
  }, [professional?.availability])

  async function handleSaveSlots() {
    if (!effectiveProfId || !canEdit) return
    setError(null)
    try {
      await putAvailability.mutateAsync(slots)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar")
    }
  }

  function handleSlotsChange(newSlots: typeof slots) {
    setSlots(newSlots)
  }

  async function handleAddException() {
    if (!effectiveProfId || !newExceptionDate.trim()) return
    setError(null)
    try {
      await addException.mutateAsync({
        date: newExceptionDate.trim(),
        reason: newExceptionReason.trim() || undefined,
      })
      setNewExceptionDate("")
      setNewExceptionReason("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar exceção")
    }
  }

  async function handleRemoveException(date: string) {
    if (!effectiveProfId) return
    try {
      await removeException.mutateAsync(date)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover exceção")
    }
  }

  // ─── SECRETARY ─────────────────────────────────────────────────────────────
  if (role === "SECRETARY") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="h-16 w-16 rounded-2xl bg-background/50 border border-border/50 flex items-center justify-center mb-5">
          <CalendarBlank className="h-8 w-8 text-muted-foreground/40" weight="duotone" />
        </div>
        <p className="text-[15px] font-semibold text-foreground/80 mb-2">Sem permissão</p>
        <p className="text-[13px] text-muted-foreground max-w-sm">
          Apenas administradores e profissionais podem configurar horários de atendimento.
        </p>
      </motion.div>
    )
  }

  // ─── Loading (ADMIN) ───────────────────────────────────────────────────────
  if (loadingProfs && role === "ADMIN") {
    return (
      <div className="flex items-center justify-center py-24">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          className="h-8 w-8 rounded-full border-2 border-accent/30 border-t-accent"
        />
      </div>
    )
  }

  // ─── PROFESSIONAL sem vínculo ──────────────────────────────────────────────
  if (role === "PROFESSIONAL" && !professionalIdFromAuth) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease }}
        className="flex flex-col items-center justify-center py-20 text-center px-6"
      >
        <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5">
          <Warning className="h-8 w-8 text-amber-400/80" weight="duotone" />
        </div>
        <p className="text-[15px] font-semibold text-foreground/80 mb-2">Profissional não vinculado</p>
        <p className="text-[13px] text-muted-foreground max-w-sm">
          Você ainda não tem um profissional vinculado. Entre em contato com o administrador.
        </p>
      </motion.div>
    )
  }

  // ─── ADMIN sem professionalId → Criar perfil ────────────────────────────────
  if (role === "ADMIN" && !professionalIdFromAuth) {
    return (
      <CriarMeuPerfilProfissional
        memberId={me!.memberId}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["me"] })
          queryClient.invalidateQueries({ queryKey: ["professionals"] })
        }}
      />
    )
  }

  const exceptions = (professional?.availabilityExceptions ?? []) as AvailabilityException[]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
      className="space-y-8"
    >
      {/* Profissional (Admin) ou Nome (Professional) */}
      {role === "ADMIN" && professionals && professionals.length > 1 && (
        <div>
          <label className={labelCls}>Profissional</label>
          <Select value={selectedProfId ?? ""} onValueChange={(v) => setSelectedProfId(v || null)}>
            <SelectTrigger className="w-full max-w-xs h-10 rounded-xl border-border/60 bg-background/40">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {professionals.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {role === "PROFESSIONAL" && professional && (
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-background/30 border border-border/40"
        >
          <div
            className="h-3 w-3 rounded-full shrink-0"
            style={{ backgroundColor: professional.calendarColor || "#22c55e" }}
          />
          <User className="h-5 w-5 text-accent" weight="duotone" />
          <span className="text-[14px] font-semibold text-foreground">{professional.fullName}</span>
        </motion.div>
      )}

      {/* Grade semanal interativa */}
      <div className="rounded-2xl border border-border/50 bg-background/30 backdrop-blur-sm overflow-hidden shadow-lg shadow-black/5">
        <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <CalendarBlank className="h-4 w-4 text-accent" weight="duotone" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-foreground">Grade semanal recorrente</h3>
              <p className="text-[11px] text-muted-foreground">Clique nas células para marcar sua disponibilidade</p>
            </div>
          </div>
          {canEdit && (
            <button
              onClick={handleSaveSlots}
              disabled={putAvailability.isPending}
              className="flex items-center gap-2 h-9 px-5 rounded-xl bg-accent text-accent-foreground text-[12px] font-bold hover:bg-accent/90 transition-all duration-200 disabled:opacity-50 hover:shadow-md hover:shadow-accent/15"
            >
              {putAvailability.isPending ? (
                <ArrowsClockwise className="h-4 w-4 animate-spin" />
              ) : saved ? (
                <Check className="h-4 w-4" weight="bold" />
              ) : null}
              Salvar
            </button>
          )}
        </div>
        <div className="p-5">
          {loadingProf ? (
            <div className="flex items-center justify-center py-16">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                className="h-6 w-6 rounded-full border-2 border-accent/30 border-t-accent"
              />
            </div>
          ) : (
            <AvailabilityWeekGrid
              slots={slots}
              onChange={handleSlotsChange}
              disabled={!canEdit}
              accentColor={professional?.calendarColor || "#22c55e"}
            />
          )}
        </div>
      </div>

      {/* Exceções */}
      <div className="rounded-2xl border border-border/50 bg-background/30 backdrop-blur-sm overflow-hidden shadow-lg shadow-black/5">
        <div className="px-6 py-4 border-b border-border/40 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Clock className="h-4 w-4 text-accent" weight="duotone" />
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-foreground">Exceções</h3>
            <p className="text-[11px] text-muted-foreground">Folgas, feriados e dias indisponíveis</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          {canEdit && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap items-end gap-3"
            >
              <div className="flex-1 min-w-[140px]">
                <label className={labelCls}>Data</label>
                <input
                  type="date"
                  value={newExceptionDate}
                  onChange={(e) => setNewExceptionDate(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="flex-[2] min-w-[160px]">
                <label className={labelCls}>Motivo (opcional)</label>
                <input
                  type="text"
                  value={newExceptionReason}
                  onChange={(e) => setNewExceptionReason(e.target.value)}
                  placeholder="Ex: Férias, Natal"
                  className={inputCls}
                />
              </div>
              <button
                onClick={handleAddException}
                disabled={!newExceptionDate.trim() || addException.isPending}
                className="h-9 px-5 rounded-xl bg-accent/80 text-accent-foreground text-[12px] font-bold hover:bg-accent transition-all duration-200 disabled:opacity-50"
              >
                Adicionar
              </button>
            </motion.div>
          )}
          <div className="space-y-2">
            {exceptions.length === 0 ? (
              <p className="text-[12px] text-muted-foreground py-3">Nenhuma exceção cadastrada.</p>
            ) : (
              <AnimatePresence>
                {exceptions.map((ex) => (
                  <motion.div
                    key={ex.id}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-background/20 hover:bg-background/30 transition-colors"
                  >
                    <div>
                      <span className="text-[13px] font-semibold text-foreground">
                        {formatDateBR(ex.date.split("T")[0] ?? ex.date)}
                      </span>
                      {ex.reason && (
                        <span className="ml-2 text-[12px] text-muted-foreground">— {ex.reason}</span>
                      )}
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => handleRemoveException(ex.date.split("T")[0] ?? ex.date)}
                        disabled={removeException.isPending}
                        className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-red-400/90 text-[12px] font-medium"
        >
          <Warning className="h-4 w-4 shrink-0" />
          {error}
        </motion.div>
      )}
    </motion.div>
  )
}
