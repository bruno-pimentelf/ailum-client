"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Check,
  CaretRight,
  UserCircle,
  UserPlus,
  Storefront,
  CalendarBlank,
  NotePencil,
  MagnifyingGlass,
  Warning,
  ArrowLeft,
} from "@phosphor-icons/react"
import { useContactsList, useCreateContact } from "@/hooks/use-contacts-list"
import { useProfessionals } from "@/hooks/use-professionals"
import { useServices } from "@/hooks/use-services"
import { useCreateAppointment } from "@/hooks/use-appointments"
import { professionalsApi } from "@/lib/api/professionals"
import type { ApiContact } from "@/lib/api/contacts"
import { useQuery } from "@tanstack/react-query"
import { toYMD, todayYMD } from "@/lib/date-utils"
import { AilumLoader } from "@/components/ui/ailum-loader"

const inputCls =
  "w-full h-10 rounded-xl border border-border/70 bg-foreground/[0.03] px-3.5 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"

const ease = [0.33, 1, 0.68, 1] as const

const MONTHS_PT = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"]
const WEEKDAYS_PT = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"]

function formatDateLabel(date: Date) {
  return `${WEEKDAYS_PT[date.getDay()]}, ${date.getDate()} ${MONTHS_PT[date.getMonth()]}`
}

// ─── Shared patient field ─────────────────────────────────────────────────────

function PatientField({
  contact,
  onSelect,
  onClear,
}: {
  contact: ApiContact | null
  onSelect: (c: ApiContact) => void
  onClear: () => void
}) {
  const [search, setSearch] = useState("")
  const [debounced, setDebounced] = useState("")
  const [focused, setFocused] = useState(false)
  const [mode, setMode] = useState<"search" | "create">("search")
  const [newName, setNewName] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)
  const createContact = useCreateContact()

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 280)
    return () => clearTimeout(t)
  }, [search])

  const { data: contactsData, isLoading: contactsLoading } = useContactsList({ search: debounced || undefined, limit: 8 })
  const contacts = contactsData?.data ?? []
  const showResults = (focused || search.length > 0) && mode === "search"

  const handleCreate = async () => {
    if (!newName.trim() || !newPhone.trim()) return
    try {
      const created = await createContact.mutateAsync({ name: newName.trim(), phone: newPhone.trim() })
      onSelect({ id: created.id, name: newName.trim(), phone: newPhone.trim() } as ApiContact)
    } catch {
      // ignore — error shown inline
    }
  }

  if (contact) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-accent/40 bg-accent/10 px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-foreground/[0.08] flex items-center justify-center text-[10px] font-bold text-foreground">
            {(contact.name ?? contact.phone ?? "?").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-[13px] font-medium text-foreground">{contact.name ?? contact.phone}</p>
            <p className="text-[11px] text-foreground/85">{contact.phone}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-foreground/85 hover:text-foreground/85 p-1 rounded-lg hover:bg-foreground/[0.06] transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  if (mode === "create") {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setMode("search")}
          className="flex items-center gap-1.5 text-[11px] text-foreground/85 hover:text-foreground/85 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Buscar existente
        </button>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nome completo"
          autoFocus
          className={inputCls}
        />
        <input
          type="tel"
          value={newPhone}
          onChange={(e) => setNewPhone(e.target.value)}
          placeholder="Telefone (ex: 11999999999)"
          className={inputCls}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={!newName.trim() || !newPhone.trim() || createContact.isPending}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent/20 border border-accent/30 py-2 text-[12px] font-semibold text-accent hover:bg-accent/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createContact.isPending ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }} className="h-3.5 w-3.5 rounded-full border-2 border-accent/30 border-t-accent" />
          ) : (
            <UserPlus className="h-3.5 w-3.5" />
          )}
          Criar paciente
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/85" />
        <input
          ref={searchRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Nome ou telefone..."
          autoFocus
          className={`${inputCls} pl-9`}
        />
      </div>
      {showResults && (
        <div className="rounded-xl border border-foreground/[0.06] divide-y divide-white/[0.04] overflow-hidden max-h-[280px] overflow-y-auto">
          {contactsLoading && debounced ? (
            <div className="px-3 py-4 flex items-center justify-center">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }} className="h-4 w-4 rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground/60" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="px-3 py-3 flex flex-col items-center gap-2">
              <span className="text-[12px] text-muted-foreground/70">{debounced ? "Nenhum contato encontrado" : "Digite para buscar..."}</span>
              {debounced && (
                <button
                  type="button"
                  onClick={() => { setNewName(search); setMode("create") }}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-accent hover:text-accent/80 transition-colors"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Cadastrar "{search}"
                </button>
              )}
            </div>
          ) : (
            <>
              {contacts.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { onSelect(c); setSearch("") }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-foreground/[0.04] transition-colors"
                >
                  {c.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.photoUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="h-8 w-8 shrink-0 rounded-full bg-accent/10 flex items-center justify-center text-[10px] font-bold text-accent">
                      {(c.name ?? c.phone ?? "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground truncate">{c.name ?? "Sem nome"}</p>
                    <p className="text-[10px] text-muted-foreground/70 font-mono truncate">{c.phone}</p>
                  </div>
                </button>
              ))}
              <button
                type="button"
                onClick={() => { setNewName(search); setMode("create") }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-[12px] font-semibold text-accent hover:bg-accent/[0.04] transition-colors"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Cadastrar novo paciente
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Contextual modal (pro + date + time pre-filled) ─────────────────────────

function ContextualForm({
  defaultDate,
  defaultTime,
  defaultProfessionalId,
  professionals,
  onClose,
}: {
  defaultDate: Date
  defaultTime: string
  defaultProfessionalId?: string
  professionals: { id: string; fullName: string; calendarColor: string }[]
  onClose: () => void
}) {
  const [contact, setContact] = useState<ApiContact | null>(null)
  const [professionalId, setProfessionalId] = useState(defaultProfessionalId ?? "")
  const [serviceId, setServiceId] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [showNotes, setShowNotes] = useState(false)

  const { data: services } = useServices()
  const createAppointment = useCreateAppointment()

  const consultations = (services ?? []).filter((s) => s.isConsultation)
  const selectedPro = professionals.find((p) => p.id === professionalId)
  const selectedService = consultations.find((s) => s.id === serviceId)

  const buildScheduledAt = () => {
    const [h, m] = defaultTime.split(":").map(Number)
    const d = new Date(defaultDate)
    d.setHours(h, m, 0, 0)
    return d.toISOString()
  }

  const canConfirm = !!contact && !!professionalId && !!serviceId

  const handleConfirm = async () => {
    setError(null)
    if (!canConfirm) return
    try {
      await createAppointment.mutateAsync({
        contactId: contact!.id,
        professionalId,
        serviceId,
        scheduledAt: buildScheduledAt(),
        durationMin: selectedService?.durationMin,
        notes: notes.trim() || undefined,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar agendamento.")
    }
  }

  return (
    <motion.div
      initial={{ scale: 0.97, y: 10 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.97, y: 8 }}
      transition={{ duration: 0.2, ease }}
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-md rounded-2xl border border-border/80 bg-overlay shadow-2xl shadow-foreground/10 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
            <CalendarBlank className="h-4 w-4 text-accent" weight="duotone" />
          </div>
          <div>
            <h2 className="text-[13px] font-semibold text-foreground leading-none">Nova consulta</h2>
            <div className="flex items-center gap-1.5 mt-1">
              {selectedPro && (
                <>
                  <span
                    className="h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: selectedPro.calendarColor || "#22c55e" }}
                  />
                  <span className="text-[11px] text-foreground/85 font-medium">{selectedPro.fullName}</span>
                  <span className="text-foreground">·</span>
                </>
              )}
              <span className="text-[11px] text-foreground/85">{formatDateLabel(defaultDate)}</span>
              <span className="text-foreground">·</span>
              <span className="text-[11px] text-accent font-semibold">{defaultTime}</span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground/85 hover:text-foreground/85 hover:bg-foreground/[0.06] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {/* Professional selector — only if not pre-filled */}
        {!defaultProfessionalId && (
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-foreground uppercase tracking-wider">Profissional</label>
            <div className="grid gap-1.5">
              {professionals.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProfessionalId(p.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-all ${
                    professionalId === p.id
                      ? "border-accent/50 bg-accent/10"
                      : "border-border/60 hover:border-border hover:bg-foreground/[0.03]"
                  }`}
                >
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: p.calendarColor || "#22c55e" }} />
                  <span className="text-[13px] font-medium text-foreground">{p.fullName}</span>
                  {professionalId === p.id && <Check className="h-3.5 w-3.5 text-accent ml-auto" weight="bold" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Patient */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-foreground uppercase tracking-wider">Paciente</label>
          <PatientField contact={contact} onSelect={setContact} onClear={() => setContact(null)} />
        </div>

        {/* Service */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-foreground uppercase tracking-wider">Serviço</label>
          {consultations.length === 0 ? (
            <p className="text-[12px] text-foreground/85">Nenhum serviço disponível. Configure em Configurações → Serviços.</p>
          ) : (
            <div className="grid gap-1.5">
              {consultations.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setServiceId(s.id)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl border text-left transition-all ${
                    serviceId === s.id
                      ? "border-accent/50 bg-accent/10"
                      : "border-border/60 hover:border-border hover:bg-foreground/[0.03]"
                  }`}
                >
                  <span className="text-[13px] font-medium text-foreground">{s.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-foreground/85">{s.durationMin} min</span>
                    {serviceId === s.id && <Check className="h-3.5 w-3.5 text-accent" weight="bold" />}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notes toggle */}
        {!showNotes ? (
          <button
            type="button"
            onClick={() => setShowNotes(true)}
            className="text-[11px] text-foreground hover:text-foreground/85 underline underline-offset-2 decoration-white/20"
          >
            + Adicionar observação
          </button>
        ) : (
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-foreground uppercase tracking-wider">Observações</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas sobre a consulta..."
              rows={2}
              autoFocus
              className={`${inputCls} py-2.5 min-h-[60px] resize-none`}
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
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-[13px] font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>
    </motion.div>
  )
}

// ─── Wizard modal (standard flow) ────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4

const STEPS: { n: Step; label: string; icon: React.ElementType }[] = [
  { n: 1, label: "Paciente", icon: UserCircle },
  { n: 2, label: "Profissional + Serviço", icon: Storefront },
  { n: 3, label: "Data + Horário", icon: CalendarBlank },
  { n: 4, label: "Observações", icon: NotePencil },
]

function WizardForm({
  defaultDate,
  defaultProfessionalId,
  onClose,
}: {
  defaultDate?: Date
  defaultProfessionalId?: string
  onClose: () => void
}) {
  const [step, setStep] = useState<Step>(1)
  const [contact, setContact] = useState<ApiContact | null>(null)
  const [professionalId, setProfessionalId] = useState<string>(defaultProfessionalId ?? "")
  const [serviceId, setServiceId] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<string>(
    defaultDate ? toYMD(defaultDate) : todayYMD()
  )
  const [selectedSlot, setSelectedSlot] = useState<{ time: string; scheduledAt: string } | null>(null)
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)

  const { data: professionals } = useProfessionals()
  const { data: services } = useServices()
  const createAppointment = useCreateAppointment()

  const consultations = (services ?? []).filter((s) => s.isConsultation)

  const slotsQuery = useQuery({
    queryKey: ["slots", professionalId, selectedDate, serviceId],
    queryFn: () => professionalsApi.getSlots(professionalId, { date: selectedDate, serviceId }),
    enabled: !!professionalId && !!selectedDate && !!serviceId && step >= 3,
  })

  const slots = slotsQuery.data?.slots ?? []

  useEffect(() => {
    setSelectedSlot(null)
  }, [selectedDate, professionalId, serviceId])

  const selectedProfessional = (professionals ?? []).find((p) => p.id === professionalId)
  const selectedService = consultations.find((s) => s.id === serviceId)

  const canProceed = () => {
    if (step === 1) return !!contact
    if (step === 2) return !!professionalId && !!serviceId
    if (step === 3) return !!selectedDate && !!selectedSlot
    return true
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

  const stepLabel = step === 4 ? "Observações + Confirmar" : STEPS[step - 1].label

  return (
    <motion.div
      initial={{ scale: 0.96, y: 12 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.96, y: 8 }}
      transition={{ duration: 0.22, ease }}
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-lg rounded-2xl border border-border/80 bg-overlay shadow-2xl shadow-foreground/10 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
            <CalendarBlank className="h-4 w-4 text-accent" weight="duotone" />
          </div>
          <div>
            <h2 className="text-[14px] font-semibold text-foreground">Nova consulta</h2>
            <p className="text-[11px] text-foreground">
              Passo {step} de 4 — {stepLabel}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground/85 hover:text-foreground/85 hover:bg-foreground/[0.06] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Step indicator */}
      <div className="flex gap-1 px-5 py-2 border-b border-foreground/[0.05]">
        {STEPS.map(({ n, label }) => (
          <button
            key={n}
            type="button"
            onClick={() => n <= step && setStep(n)}
            className={`shrink-0 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
              step === n
                ? "bg-accent/20 text-accent"
                : n < step
                  ? "text-foreground/85 hover:text-foreground/85"
                  : "text-foreground"
            }`}
          >
            {n}. {n === 2 ? "Pro + Serviço" : n === 3 ? "Data + Hora" : n === 4 ? "Observações" : label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="p-5 min-h-[260px]">
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
              <label className="block text-[10px] font-bold text-foreground uppercase tracking-wider">Paciente</label>
              <PatientField contact={contact} onSelect={setContact} onClear={() => setContact(null)} />
            </motion.div>
          )}

          {/* Step 2: Professional + Service */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2, ease }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-foreground uppercase tracking-wider">Profissional</label>
                <div className="grid gap-2">
                  {(professionals ?? []).map((p) => {
                    const selected = professionalId === p.id
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setProfessionalId(p.id)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                          selected ? "border-accent/50 bg-accent/10" : "border-border/60 hover:border-border hover:bg-foreground/[0.03]"
                        }`}
                      >
                        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: p.calendarColor || "#22c55e" }} />
                        <span className="text-[13px] font-medium text-foreground">{p.fullName}</span>
                        {selected && <Check className="h-4 w-4 text-accent ml-auto" weight="bold" />}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-foreground uppercase tracking-wider">Serviço</label>
                <div className="grid gap-2">
                  {consultations.length === 0 ? (
                    <p className="text-[12px] text-foreground py-2">Configure serviços em Configurações → Serviços.</p>
                  ) : (
                    consultations.map((s) => {
                      const selected = serviceId === s.id
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setServiceId(s.id)}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-all ${
                            selected ? "border-accent/50 bg-accent/10" : "border-border/60 hover:border-border hover:bg-foreground/[0.03]"
                          }`}
                        >
                          <span className="text-[13px] font-medium text-foreground">{s.name}</span>
                          <span className="text-[11px] text-foreground">{s.durationMin} min</span>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Date + Slots */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2, ease }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-foreground uppercase tracking-wider">Data</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={todayYMD()}
                  className={inputCls}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-foreground uppercase tracking-wider">Horário disponível</label>
                {slotsQuery.isLoading ? (
                  <AilumLoader variant="section" className="py-6" />
                ) : slots.length === 0 ? (
                  <p className="text-[12px] text-foreground py-2">
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
                              : "border-border/60 text-foreground hover:border-border hover:bg-foreground/[0.04]"
                          }`}
                        >
                          {slot.time}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 4: Notes + Confirm */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2, ease }}
              className="space-y-4"
            >
              <div className="rounded-xl border border-border/60 bg-foreground/[0.02] p-4 space-y-2 text-[12px]">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <p className="text-foreground/85">Paciente</p>
                    <p className="font-semibold text-foreground">{contact?.name ?? contact?.phone ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-foreground/85">Profissional</p>
                    <p className="font-semibold text-foreground">{selectedProfessional?.fullName ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-foreground/85">Serviço</p>
                    <p className="font-semibold text-foreground">{selectedService?.name ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-foreground/85">Horário</p>
                    <p className="font-semibold text-foreground">{selectedDate} · {selectedSlot?.time ?? "—"}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-foreground uppercase tracking-wider">
                  Observações <span className="text-foreground/85 normal-case font-normal">(opcional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas sobre a consulta..."
                  rows={2}
                  className={`${inputCls} py-2.5 min-h-[60px] resize-none`}
                />
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
            onClick={() => { setError(null); setStep((s) => (s - 1) as Step) }}
            className="flex-1 rounded-xl border border-border/70 py-2 text-[13px] font-medium text-foreground/85 hover:text-foreground hover:bg-foreground/[0.04] transition-colors"
          >
            Voltar
          </button>
        ) : (
          <div className="flex-1" />
        )}
        {step < 4 ? (
          <button
            type="button"
            onClick={() => { setError(null); setStep((s) => (s + 1) as Step) }}
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
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

export function NovoAgendamentoModal({
  open,
  onClose,
  defaultDate,
  defaultTime,
  defaultProfessionalId,
}: {
  open: boolean
  onClose: () => void
  defaultDate?: Date
  defaultTime?: string
  defaultProfessionalId?: string
}) {
  const { data: professionals } = useProfessionals()

  const isContextual = !!defaultProfessionalId || (!!defaultDate && !!defaultTime)
  // Only use fast path when we have date + time at minimum
  const useFastPath = !!defaultDate && !!defaultTime

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
        {useFastPath ? (
          <ContextualForm
            key={`${defaultDate?.toISOString()}-${defaultTime}`}
            defaultDate={defaultDate!}
            defaultTime={defaultTime!}
            defaultProfessionalId={defaultProfessionalId}
            professionals={professionals ?? []}
            onClose={onClose}
          />
        ) : (
          <WizardForm
            key="wizard"
            defaultDate={defaultDate}
            defaultProfessionalId={defaultProfessionalId}
            onClose={onClose}
          />
        )}
      </motion.div>
    </AnimatePresence>
  )
}
