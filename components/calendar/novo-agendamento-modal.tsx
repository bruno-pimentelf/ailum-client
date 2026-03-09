"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Check,
  CaretRight,
  UserCircle,
  User,
  Storefront,
  CalendarBlank,
  Clock,
  NotePencil,
  MagnifyingGlass,
  Warning,
} from "@phosphor-icons/react"
import { useContactsList } from "@/hooks/use-contacts-list"
import { useProfessionals } from "@/hooks/use-professionals"
import { useServices } from "@/hooks/use-services"
import { useCreateAppointment } from "@/hooks/use-appointments"
import { professionalsApi } from "@/lib/api/professionals"
import type { ApiContact } from "@/lib/api/contacts"
import { useQuery } from "@tanstack/react-query"
import { toYMD, todayYMD } from "@/lib/date-utils"

const inputCls =
  "w-full h-10 rounded-xl border border-white/[0.09] bg-white/[0.03] px-3.5 text-[13px] text-white/90 placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"

const ease = [0.33, 1, 0.68, 1] as const

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7

const STEPS: { n: Step; label: string; icon: React.ElementType }[] = [
  { n: 1, label: "Contato", icon: UserCircle },
  { n: 2, label: "Profissional", icon: User },
  { n: 3, label: "Serviço", icon: Storefront },
  { n: 4, label: "Data", icon: CalendarBlank },
  { n: 5, label: "Horário", icon: Clock },
  { n: 6, label: "Observações", icon: NotePencil },
  { n: 7, label: "Confirmar", icon: Check },
]

export function NovoAgendamentoModal({
  open,
  onClose,
  defaultDate,
}: {
  open: boolean
  onClose: () => void
  defaultDate?: Date
}) {
  const [step, setStep] = useState<Step>(1)
  const [contact, setContact] = useState<ApiContact | null>(null)
  const [contactSearch, setContactSearch] = useState("")
  const [debouncedContactSearch, setDebouncedContactSearch] = useState("")
  const [professionalId, setProfessionalId] = useState<string>("")
  const [serviceId, setServiceId] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<string>(
    defaultDate ? toYMD(defaultDate) : todayYMD()
  )
  const [selectedSlot, setSelectedSlot] = useState<{ time: string; scheduledAt: string } | null>(null)
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)

  const { data: contactsData } = useContactsList({ search: debouncedContactSearch || undefined })
  const { data: professionals } = useProfessionals()
  const { data: services } = useServices()
  const createAppointment = useCreateAppointment()

  const consultations = (services ?? []).filter((s) => s.isConsultation)

  const slotsQuery = useQuery({
    queryKey: ["slots", professionalId, selectedDate, serviceId],
    queryFn: () =>
      professionalsApi.getSlots(professionalId, { date: selectedDate, serviceId }),
    enabled:
      !!professionalId && !!selectedDate && !!serviceId && step >= 5,
  })

  const slots = slotsQuery.data?.slots ?? []

  useEffect(() => {
    const t = setTimeout(() => setDebouncedContactSearch(contactSearch), 300)
    return () => clearTimeout(t)
  }, [contactSearch])

  useEffect(() => {
    setSelectedSlot(null)
  }, [selectedDate, professionalId, serviceId])

  useEffect(() => {
    if (open) {
      setStep(1)
      setContact(null)
      setContactSearch("")
      setProfessionalId("")
      setServiceId("")
      setSelectedDate(defaultDate ? toYMD(defaultDate) : todayYMD())
      setSelectedSlot(null)
      setNotes("")
      setError(null)
    }
  }, [open, defaultDate])

  const contacts = contactsData?.data ?? []

  const selectedProfessional = (professionals ?? []).find((p) => p.id === professionalId)
  const selectedService = consultations.find((s) => s.id === serviceId)

  const canProceed = () => {
    if (step === 1) return !!contact
    if (step === 2) return !!professionalId
    if (step === 3) return !!serviceId
    if (step === 4) return !!selectedDate
    if (step === 5) return !!selectedSlot
    return true
  }

  const handleNext = () => {
    setError(null)
    if (step < 7) setStep((s) => (s + 1) as Step)
  }

  const handleBack = () => {
    setError(null)
    if (step > 1) setStep((s) => (s - 1) as Step)
  }

  const handleConfirm = async () => {
    setError(null)
    if (!contact || !professionalId || !serviceId || !selectedSlot) {
      setError("Dados incompletos. Preencha todos os campos.")
      return
    }
    try {
      await createAppointment.mutateAsync({
        contactId: contact.id,
        professionalId,
        serviceId,
        scheduledAt: selectedSlot.scheduledAt,
        durationMin: selectedService?.durationMin,
        notes: notes.trim() || undefined,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar agendamento.")
    }
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.96, y: 12 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.96, y: 8 }}
          transition={{ duration: 0.22, ease }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg rounded-2xl border border-white/[0.10] bg-[oklch(0.14_0.02_263)] shadow-2xl shadow-black/60 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
                <CalendarBlank className="h-4 w-4 text-accent" weight="duotone" />
              </div>
              <div>
                <h2 className="text-[14px] font-semibold text-white/90">Nova consulta</h2>
                <p className="text-[11px] text-white/40">
                  Passo {step} de 7 — {STEPS[step - 1].label}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex gap-1 px-5 py-2 border-b border-white/[0.05] overflow-x-auto">
            {STEPS.map(({ n, label }) => (
              <button
                key={n}
                type="button"
                onClick={() => n <= step && setStep(n)}
                className={`shrink-0 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                  step === n
                    ? "bg-accent/20 text-accent"
                    : n < step
                      ? "text-white/50 hover:text-white/70"
                      : "text-white/20"
                }`}
              >
                {n}. {label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="p-5 min-h-[280px]">
            <AnimatePresence mode="wait">
              {/* Step 1: Contact */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2, ease }}
                  className="space-y-3"
                >
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider">
                    Paciente
                  </label>
                  <div className="relative">
                    <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25" />
                    <input
                      type="text"
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      placeholder="Buscar por nome ou telefone..."
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-white/[0.06] divide-y divide-white/[0.04]">
                    {contacts.length === 0 ? (
                      <div className="py-8 text-center text-[12px] text-white/30">
                        {contactSearch ? "Nenhum contato encontrado" : "Digite para buscar"}
                      </div>
                    ) : (
                      contacts.map((c) => {
                        const name = c.name ?? c.phone
                        const selected = contact?.id === c.id
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setContact(c)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                              selected ? "bg-accent/15 border-l-2 border-accent" : "hover:bg-white/[0.04]"
                            }`}
                          >
                            <div className="h-9 w-9 shrink-0 rounded-full bg-white/[0.08] flex items-center justify-center text-[11px] font-bold text-white/60">
                              {(name ?? "?").slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium text-white/90 truncate">{name}</p>
                              <p className="text-[11px] text-white/40 truncate">{c.phone}</p>
                            </div>
                            {selected && <Check className="h-4 w-4 text-accent shrink-0" weight="bold" />}
                          </button>
                        )
                      })
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Professional */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2, ease }}
                  className="space-y-3"
                >
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider">
                    Profissional
                  </label>
                  <div className="grid gap-2">
                    {(professionals ?? []).map((p) => {
                      const selected = professionalId === p.id
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setProfessionalId(p.id)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                            selected
                              ? "border-accent/50 bg-accent/10"
                              : "border-white/[0.08] hover:border-white/[0.12] hover:bg-white/[0.03]"
                          }`}
                        >
                          <div
                            className="h-3 w-3 rounded-full shrink-0"
                            style={{ backgroundColor: p.calendarColor || "#22c55e" }}
                          />
                          <span className="text-[13px] font-medium text-white/90">{p.fullName}</span>
                          {selected && <Check className="h-4 w-4 text-accent ml-auto" weight="bold" />}
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {/* Step 3: Service */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2, ease }}
                  className="space-y-3"
                >
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider">
                    Serviço (consultas)
                  </label>
                  <div className="grid gap-2">
                    {consultations.length === 0 ? (
                      <p className="text-[12px] text-white/40 py-4">
                        Nenhum serviço marcado como consulta. Configure em Configurações → Serviços.
                      </p>
                    ) : (
                      consultations.map((s) => {
                        const selected = serviceId === s.id
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setServiceId(s.id)}
                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-all ${
                              selected
                                ? "border-accent/50 bg-accent/10"
                                : "border-white/[0.08] hover:border-white/[0.12] hover:bg-white/[0.03]"
                            }`}
                          >
                            <span className="text-[13px] font-medium text-white/90">{s.name}</span>
                            <span className="text-[11px] text-white/40">{s.durationMin} min</span>
                          </button>
                        )
                      })
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 4: Date */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2, ease }}
                  className="space-y-3"
                >
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider">
                    Data
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={todayYMD()}
                    className={inputCls}
                  />
                </motion.div>
              )}

              {/* Step 5: Slots */}
              {step === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2, ease }}
                  className="space-y-3"
                >
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider">
                    Horário disponível
                  </label>
                  {slotsQuery.isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
                    </div>
                  ) : slots.length === 0 ? (
                    <p className="text-[12px] text-white/40 py-4">
                      {slotsQuery.data?.reason ?? "Nenhum horário disponível nesta data."}
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {slots.map((slot) => {
                        const selected = selectedSlot?.scheduledAt === slot.scheduledAt
                        return (
                          <button
                            key={slot.scheduledAt}
                            type="button"
                            onClick={() => setSelectedSlot({ time: slot.time, scheduledAt: slot.scheduledAt })}
                            className={`py-2 rounded-xl border text-[12px] font-semibold transition-all ${
                              selected
                                ? "border-accent/50 bg-accent/15 text-accent"
                                : "border-white/[0.08] text-white/80 hover:border-white/[0.14] hover:bg-white/[0.04]"
                            }`}
                          >
                            {slot.time}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 6: Notes */}
              {step === 6 && (
                <motion.div
                  key="step6"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2, ease }}
                  className="space-y-3"
                >
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider">
                    Observações (opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notas sobre a consulta..."
                    rows={3}
                    className={`${inputCls} py-2.5 min-h-[80px] resize-none`}
                  />
                </motion.div>
              )}

              {/* Step 7: Confirm */}
              {step === 7 && (
                <motion.div
                  key="step7"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2, ease }}
                  className="space-y-3"
                >
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-2">
                    <p className="text-[11px] text-white/40">Paciente</p>
                    <p className="text-[13px] font-semibold text-white/90">
                      {contact?.name ?? contact?.phone ?? "—"}
                    </p>
                    <p className="text-[11px] text-white/40 mt-3">Profissional</p>
                    <p className="text-[13px] font-semibold text-white/90">
                      {selectedProfessional?.fullName ?? "—"}
                    </p>
                    <p className="text-[11px] text-white/40 mt-3">Serviço</p>
                    <p className="text-[13px] font-semibold text-white/90">
                      {selectedService?.name ?? "—"} ({selectedService?.durationMin} min)
                    </p>
                    <p className="text-[11px] text-white/40 mt-3">Data e horário</p>
                    <p className="text-[13px] font-semibold text-white/90">
                      {selectedDate} às {selectedSlot?.time ?? "—"}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
          <div className="flex items-center gap-2 px-5 pb-5">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 rounded-xl border border-white/[0.09] py-2 text-[13px] font-medium text-white/70 hover:text-white/90 hover:bg-white/[0.04] transition-colors"
              >
                Voltar
              </button>
            ) : (
              <div className="flex-1" />
            )}
            {step < 7 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-accent py-2 text-[13px] font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo
                <CaretRight className="h-4 w-4" weight="bold" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={createAppointment.isPending}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-accent py-2 text-[13px] font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-60"
              >
                {createAppointment.isPending ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                      className="h-4 w-4 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground"
                    />
                    Agendando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" weight="bold" />
                    Confirmar agendamento
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
