"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQueryClient } from "@tanstack/react-query"
import {
  Storefront,
  Warning,
  CaretDown,
  Clock,
  CurrencyDollar,
  Stethoscope,
  User,
  Check,
} from "@phosphor-icons/react"
import { useMe } from "@/hooks/use-me"
import { useProfessionals, useProfessional, useProfessionalServiceLinks } from "@/hooks/use-professionals"
import { useServices } from "@/hooks/use-services"
import type { Service } from "@/lib/api/services"

const ease = [0.33, 1, 0.68, 1] as const

function formatPrice(price: number) {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ checked, disabled, onChange }: { checked: boolean; disabled?: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full border-2 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? "border-accent bg-accent/20" : "border-border bg-muted/30"
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full transition-all duration-200 ${
          checked ? "left-[22px] bg-accent" : "left-0.5 bg-muted-foreground/50"
        }`}
      />
    </button>
  )
}

// ─── Service Card ─────────────────────────────────────────────────────────────
function ServiceCard({
  service,
  linked,
  pending,
  onToggle,
}: {
  service: Service
  linked: boolean
  pending: boolean
  onToggle: () => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative flex items-center gap-4 rounded-xl border px-4 py-3.5 transition-colors duration-150 ${
        linked
          ? "border-accent/30 bg-accent/5"
          : "border-border/40 bg-background/20 hover:bg-background/30"
      }`}
    >
      {/* Status stripe */}
      <div
        className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full transition-colors duration-200 ${
          linked ? "bg-accent" : "bg-transparent"
        }`}
      />

      {/* Icon */}
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors duration-150 ${
          linked
            ? "border-accent/25 bg-accent/10"
            : "border-border/40 bg-background/30"
        }`}
      >
        {service.isConsultation ? (
          <Stethoscope className={`h-4 w-4 ${linked ? "text-accent" : "text-muted-foreground/70"}`} weight="duotone" />
        ) : (
          <Storefront className={`h-4 w-4 ${linked ? "text-accent" : "text-muted-foreground/70"}`} weight="duotone" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[13px] font-semibold truncate ${linked ? "text-foreground" : "text-foreground/80"}`}>
            {service.name}
          </span>
          {service.isConsultation && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-accent/10 text-accent/80">
              Consulta
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" weight="bold" />
            {service.durationMin} min
          </span>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <CurrencyDollar className="h-3 w-3" weight="bold" />
            {formatPrice(service.price)}
          </span>
        </div>
      </div>

      {/* Toggle */}
      <Toggle checked={linked} disabled={pending} onChange={onToggle} />
    </motion.div>
  )
}

// ─── Professional Selector (Admin) ────────────────────────────────────────────
function ProfessionalSelector({
  professionals,
  selectedId,
  onSelect,
}: {
  professionals: { id: string; fullName: string; calendarColor: string; specialty: string | null }[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = professionals.find((p) => p.id === selectedId)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 w-full max-w-xs h-10 rounded-xl border border-border/60 bg-background/40 px-3 text-[13px] text-foreground hover:bg-background/60 transition-colors"
      >
        {selected ? (
          <>
            <div
              className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: selected.calendarColor || "#3b82f6" }}
            />
            <span className="flex-1 text-left truncate">{selected.fullName}</span>
          </>
        ) : (
          <span className="flex-1 text-left text-muted-foreground">Selecione um profissional</span>
        )}
        <CaretDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-[calc(100%+4px)] left-0 z-20 w-full max-w-xs rounded-xl border border-border/60 bg-card shadow-lg shadow-black/10 overflow-hidden"
          >
            {professionals.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => { onSelect(p.id); setOpen(false) }}
                className={`flex items-center gap-3 w-full px-3 py-2.5 text-[13px] text-left hover:bg-accent/10 transition-colors ${
                  p.id === selectedId ? "bg-accent/5 text-accent font-semibold" : "text-foreground"
                }`}
              >
                <div
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: p.calendarColor || "#3b82f6" }}
                />
                <div className="flex-1 min-w-0">
                  <div className="truncate">{p.fullName}</div>
                  {p.specialty && <div className="text-[11px] text-muted-foreground truncate">{p.specialty}</div>}
                </div>
                {p.id === selectedId && <Check className="h-3.5 w-3.5 shrink-0" weight="bold" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Services Panel ───────────────────────────────────────────────────────────
function ServicesPanel({
  professionalId,
  services,
  linkedServiceIds,
}: {
  professionalId: string
  services: Service[]
  linkedServiceIds: Set<string>
}) {
  const { link, unlink } = useProfessionalServiceLinks()
  const pending = link.isPending || unlink.isPending

  const consultation = services.filter((s) => s.isConsultation && s.isActive)
  const others = services.filter((s) => !s.isConsultation && s.isActive)

  function renderList(list: Service[]) {
    return list.map((s) => (
      <ServiceCard
        key={s.id}
        service={s}
        linked={linkedServiceIds.has(s.id)}
        pending={pending}
        onToggle={async () => {
          if (linkedServiceIds.has(s.id)) {
            await unlink.mutateAsync({ professionalId, serviceId: s.id })
          } else {
            await link.mutateAsync({ professionalId, serviceId: s.id })
          }
        }}
      />
    ))
  }

  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
        <Storefront className="h-8 w-8 text-muted-foreground/30" weight="duotone" />
        <p className="text-[13px] text-muted-foreground">
          Nenhum serviço cadastrado. Crie em <strong>Serviços</strong>.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {consultation.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Consultas</p>
          <div className="space-y-2">{renderList(consultation)}</div>
        </div>
      )}
      {others.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Outros serviços</p>
          <div className="space-y-2">{renderList(others)}</div>
        </div>
      )}
    </div>
  )
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────
export function DisponibilidadeTab() {
  const queryClient = useQueryClient()
  const { data: me } = useMe()
  const { data: professionals, isLoading: loadingProfs } = useProfessionals()
  const { data: services = [] } = useServices()

  const role = me?.role ?? "SECRETARY"
  const professionalIdFromAuth = me?.professionalId ?? null

  const [selectedProfId, setSelectedProfId] = useState<string | null>(null)
  const effectiveProfId = role === "PROFESSIONAL" ? professionalIdFromAuth : selectedProfId

  useEffect(() => {
    if (role === "ADMIN" && professionals?.length && !selectedProfId) {
      const ownId =
        professionalIdFromAuth && professionals.some((p) => p.id === professionalIdFromAuth)
          ? professionalIdFromAuth
          : null
      setSelectedProfId(ownId ?? professionals[0].id)
    }
  }, [role, professionals, professionalIdFromAuth, selectedProfId])

  const { data: professional, isLoading: loadingProfessional } = useProfessional(effectiveProfId)

  // ─── SECRETARY ───────────────────────────────────────────────────────────
  if (role === "SECRETARY") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease }}
        className="flex flex-col items-center justify-center py-24 text-center gap-3"
      >
        <div className="h-14 w-14 rounded-2xl bg-background/50 border border-border/50 flex items-center justify-center">
          <Storefront className="h-7 w-7 text-muted-foreground/60" weight="duotone" />
        </div>
        <p className="text-[14px] font-semibold text-foreground/80">Sem permissão</p>
        <p className="text-[13px] text-muted-foreground max-w-xs">
          Apenas administradores e profissionais podem gerenciar seus serviços.
        </p>
      </motion.div>
    )
  }

  // ─── PROFESSIONAL sem vínculo ─────────────────────────────────────────────
  if (role === "PROFESSIONAL" && !professionalIdFromAuth) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease }}
        className="flex flex-col items-center justify-center py-24 text-center gap-3 px-6"
      >
        <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Warning className="h-7 w-7 text-amber-400/80" weight="duotone" />
        </div>
        <p className="text-[14px] font-semibold text-foreground/80">Profissional não vinculado</p>
        <p className="text-[13px] text-muted-foreground max-w-xs">
          Você ainda não tem um perfil profissional vinculado. Entre em contato com o administrador.
        </p>
      </motion.div>
    )
  }

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loadingProfs || (effectiveProfId && loadingProfessional)) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
      </div>
    )
  }

  const linkedServiceIds = new Set(
    (professional?.professionalServices ?? []).map((ps) => ps.serviceId)
  )
  const linkedCount = linkedServiceIds.size

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease }}
      className="space-y-6 max-w-2xl"
    >
      {/* Header */}
      <div>
        <h2 className="text-[15px] font-bold text-foreground">Meus Serviços</h2>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Ative os serviços que este profissional oferece. Só serviços vinculados aparecem na agenda e na IA.
        </p>
      </div>

      {/* Admin: professional selector */}
      {role === "ADMIN" && professionals && professionals.length > 1 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Profissional</p>
          <ProfessionalSelector
            professionals={professionals}
            selectedId={selectedProfId}
            onSelect={setSelectedProfId}
          />
        </div>
      )}

      {/* Professional identity pill */}
      {professional && (
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-border/40 bg-background/20 w-fit">
          <div
            className="h-3 w-3 rounded-full shrink-0"
            style={{ backgroundColor: professional.calendarColor || "#3b82f6" }}
          />
          <User className="h-4 w-4 text-muted-foreground" weight="duotone" />
          <span className="text-[13px] font-semibold text-foreground">{professional.fullName}</span>
          {linkedCount > 0 && (
            <span className="ml-1 text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-accent/10 text-accent">
              {linkedCount} ativo{linkedCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {/* Services panel */}
      {professional && effectiveProfId && (
        <div className="rounded-2xl border border-border/50 bg-background/20 backdrop-blur-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                <Storefront className="h-4 w-4 text-accent" weight="duotone" />
              </div>
              <span className="text-[13px] font-bold text-foreground">Serviços disponíveis</span>
            </div>
            <span className="text-[12px] text-muted-foreground">
              {linkedCount} de {services.filter((s) => s.isActive).length} ativos
            </span>
          </div>
          <div className="p-5">
            <ServicesPanel
              professionalId={effectiveProfId}
              services={services}
              linkedServiceIds={linkedServiceIds}
            />
          </div>
        </div>
      )}

      {/* No professional selected (admin edge case) */}
      {!professional && role === "ADMIN" && !loadingProfessional && (
        <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
          <p className="text-[13px] text-muted-foreground">Selecione um profissional acima.</p>
        </div>
      )}
    </motion.div>
  )
}
