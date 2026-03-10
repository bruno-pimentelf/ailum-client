"use client"

import { useState, useEffect } from "react"
import type React from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useQueryClient } from "@tanstack/react-query"
import {
  CalendarBlank,
  Warning,
  User,
  IdentificationCard,
  Storefront,
  CalendarCheck,
  ArrowRight,
} from "@phosphor-icons/react"
import { useMe } from "@/hooks/use-me"
import { useProfessionals, useProfessional, useProfessionalMutations, useProfessionalServiceLinks } from "@/hooks/use-professionals"
import { useServices } from "@/hooks/use-services"
import { professionalsApi } from "@/lib/api/professionals"
import { membersApi } from "@/lib/api/members"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const ease = [0.33, 1, 0.68, 1] as const

const inputCls =
  "h-9 w-full rounded-xl border border-border/60 bg-background/40 px-3 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all duration-200"
const labelCls = "block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5"

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

  const { data: professional } = useProfessional(effectiveProfId)
  const { data: services } = useServices()
  const { link: linkService, unlink: unlinkService } = useProfessionalServiceLinks()

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

  // Para PROFESSIONAL: CTA principal leva ao calendário (doc: calendário único)
  if (role === "PROFESSIONAL" && professional) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="space-y-6"
      >
        <div className="rounded-2xl border border-accent/25 bg-accent/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-accent/15 border border-accent/25 flex items-center justify-center">
              <CalendarCheck className="h-7 w-7 text-accent" weight="duotone" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-foreground">
                Configure sua agenda no Calendário
              </h3>
              <p className="text-[13px] text-muted-foreground mt-1 max-w-md">
                Veja sua disponibilidade, consultas e configure horários em um único lugar — sem trocar de tela.
              </p>
            </div>
          </div>
          <Link
            href="/calendar"
            className="flex items-center gap-2 h-11 px-5 rounded-xl bg-accent text-accent-foreground text-[13px] font-bold hover:bg-accent/90 transition-colors shrink-0"
          >
            Ir para Calendário
            <ArrowRight className="h-4 w-4" weight="bold" />
          </Link>
        </div>

        <div className="rounded-2xl border border-border/50 bg-background/30 p-6">
          <h4 className="text-[13px] font-semibold text-foreground mb-3">Serviços que oferece</h4>
          <p className="text-[12px] text-muted-foreground mb-4">
            Só serviços vinculados aparecem na agenda e na IA. Bloqueios e horários são configurados no calendário.
          </p>
          {professional && canEdit && (
            <div className="flex flex-wrap gap-2">
              {(services ?? [])
                .filter((s) => s.isConsultation)
                .map((s) => {
                  const linked = (professional.professionalServices ?? []).some((ps) => ps.serviceId === s.id)
                  return (
                    <label
                      key={s.id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/40 bg-background/20 cursor-pointer text-[12px]"
                    >
                      <input
                        type="checkbox"
                        checked={linked}
                        disabled={linkService.isPending || unlinkService.isPending}
                        onChange={async () => {
                          if (!effectiveProfId) return
                          if (linked) {
                            await unlinkService.mutateAsync({ professionalId: effectiveProfId, serviceId: s.id })
                          } else {
                            await linkService.mutateAsync({ professionalId: effectiveProfId, serviceId: s.id })
                          }
                        }}
                        className="rounded border-border/60 text-accent"
                      />
                      {s.name}
                    </label>
                  )
                })}
            </div>
          )}
          {(services ?? []).filter((s) => s.isConsultation).length === 0 && (
            <p className="text-[12px] text-muted-foreground">Nenhum serviço de consulta. Crie em Serviços.</p>
          )}
        </div>
      </motion.div>
    )
  }

  // ADMIN: CTA + serviços
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
      className="space-y-8"
    >
      <div className="rounded-2xl border border-accent/25 bg-accent/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-accent/15 border border-accent/25 flex items-center justify-center">
            <CalendarCheck className="h-7 w-7 text-accent" weight="duotone" />
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-foreground">
              Configure disponibilidade no Calendário
            </h3>
            <p className="text-[13px] text-muted-foreground mt-1 max-w-md">
              Horários, bloqueios e overrides são configurados diretamente no calendário. Arraste para adicionar disponibilidade.
            </p>
          </div>
        </div>
        <Link
          href="/calendar"
          className="flex items-center gap-2 h-11 px-5 rounded-xl bg-accent text-accent-foreground text-[13px] font-bold hover:bg-accent/90 transition-colors shrink-0"
        >
          Ir para Calendário
          <ArrowRight className="h-4 w-4" weight="bold" />
        </Link>
      </div>

      {/* Profissional (Admin) — selector */}
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

      {/* Serviços que este profissional oferece */}
      {professional && canEdit && (
        <div className="rounded-2xl border border-border/50 bg-background/30 backdrop-blur-sm overflow-hidden shadow-lg shadow-black/5">
          <div className="px-6 py-4 border-b border-border/40 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Storefront className="h-4 w-4 text-accent" weight="duotone" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-foreground">Serviços que este profissional oferece</h3>
              <p className="text-[11px] text-muted-foreground">Só serviços vinculados aparecem na agenda e na IA</p>
            </div>
          </div>
          <div className="p-5">
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {(services ?? [])
                .filter((s) => s.isConsultation)
                .map((s) => {
                  const linked = (professional.professionalServices ?? []).some((ps) => ps.serviceId === s.id)
                  const isLoading = linkService.isPending || unlinkService.isPending
                  return (
                    <label
                      key={s.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border/40 bg-background/20 hover:bg-background/30 cursor-pointer transition-colors disabled:opacity-50"
                    >
                      <input
                        type="checkbox"
                        checked={linked}
                        disabled={isLoading}
                        onChange={async () => {
                          if (!effectiveProfId) return
                          try {
                            if (linked) {
                              await unlinkService.mutateAsync({ professionalId: effectiveProfId, serviceId: s.id })
                            } else {
                              await linkService.mutateAsync({ professionalId: effectiveProfId, serviceId: s.id })
                            }
                          } catch {
                            // invalidation already in mutation
                          }
                        }}
                        className="h-4 w-4 rounded border-border/60 bg-background/40 text-accent focus:ring-accent/30"
                      />
                      <span className="text-[13px] font-medium text-foreground">{s.name}</span>
                      <span className="text-[11px] text-muted-foreground ml-auto">
                        {s.durationMin} min · R$ {s.price.toLocaleString("pt-BR")}
                      </span>
                    </label>
                  )
                })}
              {(services ?? []).filter((s) => s.isConsultation).length === 0 && (
                <p className="text-[12px] text-muted-foreground py-2">Nenhum serviço de consulta cadastrado. Crie em Serviços.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
