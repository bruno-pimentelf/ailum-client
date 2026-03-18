"use client"

import { motion } from "framer-motion"
import {
  User,
  EnvelopeSimple,
  Phone,
  IdentificationCard,
  Heart,
  Clock,
  CalendarBlank,
  MapPin,
  Stethoscope,
  Star,
  BellSimple,
  ShieldCheck,
  ChatCircleText,
  ArrowRight,
  Brain,
  Smiley,
  Lightning,
  UsersThree,
} from "@phosphor-icons/react"
import { useContactDoc } from "@/hooks/use-contact-doc"
import type { FirestoreContact } from "@/lib/types/firestore"

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

function MemoryCard({ memKey, value }: { memKey: string; value: string }) {
  const meta = MEMORY_META[memKey]
  const Icon = meta?.icon ?? Brain
  const color = meta?.color ?? "text-muted-foreground"
  const label = meta?.label ?? memKey.replace(/_/g, " ")
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

// ─── Main component ───────────────────────────────────────────────────────────

interface ContactInfoPanelProps {
  contactId: string
  initialContact: FirestoreContact
}

export function ContactInfoPanel({ contactId, initialContact }: ContactInfoPanelProps) {
  const liveContact = useContactDoc(contactId)
  const contact = liveContact ?? initialContact

  const displayName = contact.contactName ?? contact.name ?? contact.contactPhone ?? contact.phone ?? "?"
  const memories = contact.memories ?? {}
  const memoryEntries = Object.entries(memories).filter(([, v]) => v?.trim())

  // Separate name from other memories (name shown in identity section if not already in contact.name)
  const filteredMemories = memoryEntries.filter(([k]) => k !== "name")

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
                <MemoryCard key={key} memKey={key} value={value} />
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
      </div>
    </motion.div>
  )
}
