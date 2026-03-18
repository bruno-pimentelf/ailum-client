"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Storefront,
  Plus,
  Pencil,
  Trash,
  Check,
  X,
  Clock,
  CurrencyDollar,
  Warning,
  ArrowsClockwise,
} from "@phosphor-icons/react"
import { useServices, useCreateService, useUpdateService, useRemoveService, useService } from "@/hooks/use-services"
import { useProfessionals } from "@/hooks/use-professionals"
import { useProfessionalServiceLinks } from "@/hooks/use-professionals"
import type { Service, ServiceInput } from "@/lib/api/services"

const ease = [0.33, 1, 0.68, 1] as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number) {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDuration(min: number) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m === 0 ? `${h}h` : `${h}h ${m}min`
}

// ─── Service Card ─────────────────────────────────────────────────────────────

function ServiceCard({
  service,
  index,
  onEdit,
  onDelete,
}: {
  service: Service
  index: number
  onEdit: () => void
  onDelete: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const remove = useRemoveService()

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    try {
      await remove.mutateAsync(service.id)
      onDelete()
    } catch { /* query refetches on error too */ }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ duration: 0.28, delay: index * 0.03, ease }}
      className="group flex items-start gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 transition-all hover:border-white/[0.12] hover:bg-white/[0.035]"
    >
      {/* Icon */}
      <div className="h-12 w-12 shrink-0 rounded-xl border border-white/[0.08] bg-white/[0.04] flex items-center justify-center">
        <Storefront className="h-5 w-5 text-white/85" weight="duotone" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-white/90 truncate leading-tight">{service.name}</p>
        {service.description && (
          <p className="text-[11px] text-white/90 line-clamp-2 mt-0.5 leading-relaxed">{service.description}</p>
        )}
        <div className="flex items-center gap-3 mt-2">
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400/80">
            <CurrencyDollar className="h-3.5 w-3.5" weight="fill" />
            {formatPrice(service.price)}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-white/88">
            <Clock className="h-3 w-3" />
            {formatDuration(service.durationMin)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <button
          onClick={onEdit}
          className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg text-white/85 hover:text-white/85 hover:bg-white/[0.06] transition-all"
          title="Editar"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleDelete}
          disabled={remove.isPending}
          onBlur={() => setConfirmDelete(false)}
          className={`cursor-pointer flex h-7 items-center justify-center rounded-lg text-[10px] font-bold transition-all disabled:opacity-50 ${
            confirmDelete
              ? "gap-1 px-2 bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25 w-auto"
              : "w-7 text-white/85 hover:text-rose-400 hover:bg-rose-500/[0.08]"
          }`}
          title={confirmDelete ? "Confirmar exclusão" : "Excluir"}
        >
          {remove.isPending
            ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }} className="h-3 w-3 rounded-full border-2 border-rose-400/30 border-t-rose-400" />
            : confirmDelete
              ? <><Check className="h-3 w-3" weight="bold" /> Confirmar</>
              : <Trash className="h-3.5 w-3.5" />
          }
        </button>
      </div>
    </motion.div>
  )
}

// ─── Service Editor Modal ─────────────────────────────────────────────────────

type FormState = {
  name: string
  description: string
  durationMin: string
  price: string
  isConsultation: boolean
}

function ServiceEditorModal({
  service,
  onClose,
}: {
  service: Service | null // null = create mode
  onClose: () => void
}) {
  const isNew = service === null
  const create = useCreateService()
  const update = useUpdateService()
  const { link, unlink } = useProfessionalServiceLinks()
  const { data: serviceDetail } = useService(service?.id ?? null)
  const { data: professionals } = useProfessionals()
  const isPending = create.isPending || update.isPending || link.isPending || unlink.isPending

  const [form, setForm] = useState<FormState>({
    name:           service?.name ?? "",
    description:    service?.description ?? "",
    durationMin:    String(service?.durationMin ?? 50),
    price:          service?.price != null ? String(service.price) : "",
    isConsultation: service?.isConsultation ?? true,
  })
  const [error, setError] = useState<string | null>(null)
  const [selectedProfessionalIds, setSelectedProfessionalIds] = useState<string[]>([])

  const linkedProfessionalIds = serviceDetail?.professionalServices?.map((ps) => ps.professional.id) ?? []

  useEffect(() => {
    if (serviceDetail?.professionalServices) {
      setSelectedProfessionalIds(serviceDetail.professionalServices.map((ps) => ps.professional.id))
    }
  }, [serviceDetail?.professionalServices])

  // Keep form in sync when editing service changes (shouldn't happen but defensive)
  useEffect(() => {
    if (service) {
      setForm({
        name:           service.name,
        description:    service.description ?? "",
        durationMin:    String(service.durationMin),
        price:          String(service.price),
        isConsultation: service.isConsultation ?? true,
      })
    }
  }, [service])

  const set = (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const name  = form.name.trim()
    const price = parseFloat(form.price.replace(",", "."))
    const dur   = parseInt(form.durationMin, 10)

    if (!name)          { setError("Nome é obrigatório."); return }
    if (isNaN(price) || price < 0) { setError("Informe um preço válido."); return }
    if (isNaN(dur)   || dur < 1)   { setError("Duração inválida."); return }

    const body: ServiceInput = {
      name,
      description: form.description.trim() || null,
      durationMin: dur,
      price,
      isConsultation: form.isConsultation,
    }

    try {
      if (isNew) {
        await create.mutateAsync(body)
      } else {
        await update.mutateAsync({ id: service!.id, body })
        const toAdd = selectedProfessionalIds.filter((id) => !linkedProfessionalIds.includes(id))
        const toRemove = linkedProfessionalIds.filter((id) => !selectedProfessionalIds.includes(id))
        await Promise.all([
          ...toAdd.map((professionalId) =>
            link.mutateAsync({ professionalId, serviceId: service!.id })
          ),
          ...toRemove.map((professionalId) =>
            unlink.mutateAsync({ professionalId, serviceId: service!.id })
          ),
        ])
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar serviço")
    }
  }

  function toggleProfessional(professionalId: string) {
    setSelectedProfessionalIds((prev) =>
      prev.includes(professionalId)
        ? prev.filter((id) => id !== professionalId)
        : [...prev, professionalId]
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 8 }}
        transition={{ duration: 0.22, ease }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-white/[0.10] bg-[oklch(0.14_0.02_263)] shadow-2xl shadow-black/60 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 border border-accent/20">
              <Storefront className="h-4 w-4 text-accent" weight="duotone" />
            </div>
            <h2 className="text-[14px] font-semibold text-white/90">
              {isNew ? "Novo serviço" : "Editar serviço"}
            </h2>
          </div>
          <button onClick={onClose} className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg text-white/85 hover:text-white/85 hover:bg-white/[0.06] transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className="block text-[10px] font-bold text-white/90 uppercase tracking-wider mb-1.5">Nome *</label>
            <input
              value={form.name}
              onChange={set("name")}
              placeholder="ex: Consulta particular"
              autoFocus
              className="w-full h-10 rounded-xl border border-white/[0.09] bg-white/[0.03] px-3.5 text-[13px] text-white/90 placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold text-white/90 uppercase tracking-wider mb-1.5">Descrição</label>
            <textarea
              value={form.description}
              onChange={set("description")}
              placeholder="Descreva o serviço..."
              rows={2}
              className="w-full rounded-xl border border-white/[0.09] bg-white/[0.03] px-3.5 py-2.5 text-[13px] text-white/90 placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-accent/50 resize-none transition-all"
            />
          </div>

          {/* Price + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-white/90 uppercase tracking-wider mb-1.5">Preço (R$) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-white/85 pointer-events-none">R$</span>
                <input
                  value={form.price}
                  onChange={(e) => setForm((p) => ({ ...p, price: e.target.value.replace(/[^\d.,]/g, "") }))}
                  placeholder="250,00"
                  className="w-full h-10 rounded-xl border border-white/[0.09] bg-white/[0.03] pl-8 pr-3 text-[13px] text-white/90 placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white/90 uppercase tracking-wider mb-1.5">Duração (min)</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/85 pointer-events-none" />
                <input
                  type="number"
                  min={1}
                  value={form.durationMin}
                  onChange={set("durationMin")}
                  placeholder="50"
                  className="w-full h-10 rounded-xl border border-white/[0.09] bg-white/[0.03] pl-9 pr-3 text-[13px] text-white/90 placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"
                />
              </div>
            </div>
          </div>

          {/* isConsultation */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isConsultation}
              onChange={(e) => setForm((p) => ({ ...p, isConsultation: e.target.checked }))}
              className="h-4 w-4 rounded border-white/[0.15] bg-white/[0.04] text-accent focus:ring-accent/30"
            />
            <span className="text-[12px] font-medium text-white/85">
              É consulta (agendável no calendário e na IA)
            </span>
          </label>

          {/* Profissionais que oferecem (só ao editar) */}
          {!isNew && (
            <div>
              <label className="block text-[10px] font-bold text-white/90 uppercase tracking-wider mb-2">
                Profissionais que oferecem este serviço
              </label>
              <p className="text-[11px] text-white/88 mb-2">
                Só aparecem na agenda e na IA os profissionais vinculados. Marque quem oferece este serviço.
              </p>
              <div className="max-h-40 overflow-y-auto rounded-xl border border-white/[0.08] bg-white/[0.02] p-2 space-y-1">
                {(professionals ?? []).map((pro) => {
                  const checked = selectedProfessionalIds.includes(pro.id)
                  return (
                    <label
                      key={pro.id}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.04] cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleProfessional(pro.id)}
                        className="h-4 w-4 rounded border-white/[0.15] bg-white/[0.04] text-accent focus:ring-accent/30"
                      />
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: pro.calendarColor || "#22c55e" }}
                      />
                      <span className="text-[12px] font-medium text-white/90">{pro.fullName}</span>
                    </label>
                  )
                })}
                {(professionals ?? []).length === 0 && (
                  <p className="text-[11px] text-white/85 py-2 text-center">Nenhum profissional cadastrado</p>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/[0.08] px-3.5 py-2.5">
                <Warning className="h-4 w-4 text-rose-400 shrink-0" weight="fill" />
                <p className="text-[12px] text-rose-400">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <div className="flex items-center gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="cursor-pointer flex-1 rounded-xl border border-white/[0.09] py-2 text-[13px] text-white/90 hover:text-white/85 hover:bg-white/[0.04] transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isPending}
              className="cursor-pointer flex-1 flex items-center justify-center gap-2 rounded-xl bg-accent py-2 text-[13px] font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-60">
              {isPending
                ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }} className="h-3.5 w-3.5 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" />
                : <Check className="h-3.5 w-3.5" weight="bold" />}
              {isPending ? "Salvando..." : isNew ? "Criar serviço" : "Salvar"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// ─── ServicosTab ──────────────────────────────────────────────────────────────

export function ServicosTab() {
  const { data: services, isLoading, error, refetch } = useServices()
  const [editing, setEditing] = useState<Service | null | "new">(null)

  const list = services ?? []

  return (
    <>
      <AnimatePresence>
        {editing !== null && (
          <ServiceEditorModal
            service={editing === "new" ? null : editing}
            onClose={() => setEditing(null)}
          />
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-bold text-white/85">Serviços</p>
            <p className="text-[11px] text-white/88 mt-0.5">
              {isLoading ? "Carregando..." : `${list.length} serviço${list.length !== 1 ? "s" : ""} cadastrado${list.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={() => setEditing("new")}
            className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-accent/25 bg-accent/8 px-3 py-1.5 text-[11px] font-bold text-accent hover:bg-accent/15 transition-all"
          >
            <Plus className="h-3 w-3" weight="bold" /> Novo serviço
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl border border-white/[0.06] bg-white/[0.02] animate-pulse" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center gap-3 py-14 rounded-xl border border-dashed border-white/[0.07]">
            <Warning className="h-7 w-7 text-rose-400/40" weight="duotone" />
            <p className="text-[12px] text-white/90">Erro ao carregar serviços</p>
            <button onClick={() => refetch()}
              className="cursor-pointer flex items-center gap-1.5 text-[11px] text-accent/60 hover:text-accent transition-colors">
              <ArrowsClockwise className="h-3.5 w-3.5" /> Tentar novamente
            </button>
          </div>
        )}

        {/* List */}
        {!isLoading && !error && (
          <>
            {list.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                <AnimatePresence initial={false}>
                  {list.map((s, i) => (
                    <ServiceCard
                      key={s.id}
                      service={s}
                      index={i}
                      onEdit={() => setEditing(s)}
                      onDelete={() => {}}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-white/[0.07] gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.02]">
                  <Storefront className="h-5 w-5 text-white/90" weight="duotone" />
                </div>
                <div className="text-center">
                  <p className="text-[13px] font-bold text-white/90">Nenhum serviço cadastrado</p>
                  <p className="text-[11px] text-white/85 mt-0.5">Adicione os serviços oferecidos pela clínica</p>
                </div>
                <button onClick={() => setEditing("new")}
                  className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-accent/25 bg-accent/8 px-3.5 py-2 text-[11px] font-bold text-accent hover:bg-accent/15 transition-all">
                  <Plus className="h-3 w-3" weight="bold" /> Criar primeiro serviço
                </button>
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </>
  )
}
