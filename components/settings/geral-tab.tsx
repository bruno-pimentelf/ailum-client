"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Buildings,
  IdentificationCard,
  Storefront,
  Image as ImageIcon,
  Check,
  ArrowsClockwise,
  Warning,
  Bell,
} from "@phosphor-icons/react"
import { useTenant, useUpdateTenant } from "@/hooks/use-tenant"
import { uploadTenantLogo } from "@/lib/firebase"

const inputCls = "w-full h-10 rounded-lg border border-border bg-muted/20 px-3 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-accent/40 transition-colors disabled:opacity-50"
const labelCls = "block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5"
const NOTIFICATION_TYPE_OPTIONS = [
  "integration.whatsapp.disconnected",
  "trigger.failed",
  "guardrail.violation",
  "payment.paid",
  "payment.overdue",
  "appointment.created",
  "appointment.cancelled",
  "appointment.rescheduled",
  "slot_recall.sent",
]
const ROLE_OPTIONS = ["ADMIN", "SECRETARY", "PROFESSIONAL"]

export function GeralTab() {
  const { data: tenant, isLoading, error } = useTenant()
  const update = useUpdateTenant()

  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)

  const [form, setForm] = useState({
    name: "", description: "", logoUrl: "",
    phone: "", email: "", website: "",
    addressStreet: "", addressNumber: "", addressComplement: "",
    addressNeighborhood: "", addressCity: "", addressState: "", addressZip: "",
    notificationsEnabled: true,
    notificationTypes: [] as string[],
    notificationDigestMinutes: 15,
    notificationRoles: [] as string[],
  })

  useEffect(() => {
    if (!tenant) return
    setForm({
      name:                tenant.name ?? "",
      description:         tenant.description ?? "",
      logoUrl:             tenant.logoUrl ?? "",
      phone:               tenant.phone ?? "",
      email:               tenant.email ?? "",
      website:             tenant.website ?? "",
      addressStreet:       tenant.addressStreet ?? "",
      addressNumber:       tenant.addressNumber ?? "",
      addressComplement:   tenant.addressComplement ?? "",
      addressNeighborhood: tenant.addressNeighborhood ?? "",
      addressCity:         tenant.addressCity ?? "",
      addressState:        tenant.addressState ?? "",
      addressZip:          tenant.addressZip ?? "",
      notificationsEnabled: tenant.notificationsEnabled ?? true,
      notificationTypes: tenant.notificationTypes ?? [],
      notificationDigestMinutes: tenant.notificationDigestMinutes ?? 15,
      notificationRoles: tenant.notificationRoles ?? [],
    })
  }, [tenant])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }))

  const toggleArray = (key: "notificationTypes" | "notificationRoles", value: string) => {
    setForm((prev) => {
      const has = prev[key].includes(value)
      return {
        ...prev,
        [key]: has ? prev[key].filter((v) => v !== value) : [...prev[key], value],
      }
    })
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file || !tenant) return
    const ok = ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)
    if (!ok) {
      setSaveError("Use JPG, PNG ou WebP.")
      return
    }
    setSaveError(null)
    setLogoUploading(true)
    try {
      const url = await uploadTenantLogo(tenant.id, file)
      await update.mutateAsync({ logoUrl: url })
      setForm((prev) => ({ ...prev, logoUrl: url }))
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Erro ao enviar logo")
    } finally {
      setLogoUploading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaveError(null)
    try {
      await update.mutateAsync({
        name:                form.name || undefined,
        description:         form.description || undefined,
        logoUrl:             form.logoUrl || undefined,
        phone:               form.phone || undefined,
        email:               form.email || undefined,
        website:             form.website || undefined,
        addressStreet:       form.addressStreet || undefined,
        addressNumber:       form.addressNumber || undefined,
        addressComplement:   form.addressComplement || undefined,
        addressNeighborhood: form.addressNeighborhood || undefined,
        addressCity:         form.addressCity || undefined,
        addressState:        form.addressState || undefined,
        addressZip:          form.addressZip || undefined,
        notificationsEnabled: form.notificationsEnabled,
        notificationTypes: form.notificationTypes,
        notificationDigestMinutes: Math.max(1, Number(form.notificationDigestMinutes) || 15),
        notificationRoles: form.notificationRoles,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Erro ao salvar")
    }
  }

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card/30 p-5">
            <div className="h-3 w-28 rounded bg-muted/30 animate-pulse mb-4" />
            <div className="space-y-3">
              {[0, 1, 2].map((j) => (
                <div key={j} className="h-10 rounded-lg bg-muted/20 animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <Warning className="h-8 w-8 text-rose-400/40" weight="duotone" />
        <p className="text-[13px] text-muted-foreground/85">Erro ao carregar dados da clínica</p>
        <p className="text-[11px] text-muted-foreground/85">{(error as Error).message}</p>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-6 w-full">
      <form onSubmit={handleSave} className="space-y-6">
        {/* Logo + Identificação */}
        <div className="grid grid-cols-1 xl:grid-cols-[180px_1fr] gap-6 items-start">
          <div className="rounded-xl border border-border/50 bg-card/30 p-5">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="h-4 w-4 text-muted-foreground" weight="duotone" />
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Logo</span>
            </div>
            <label className={`cursor-pointer flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 hover:border-accent/40 hover:bg-accent/5 transition-all overflow-hidden mx-auto group ${logoUploading ? "opacity-60 pointer-events-none" : ""}`}>
              {logoUploading ? (
                <ArrowsClockwise className="h-9 w-9 text-accent animate-spin" />
              ) : form.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="h-9 w-9 text-muted-foreground/85 group-hover:text-accent/50 transition-colors" />
              )}
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handleLogoChange}
                disabled={logoUploading}
              />
            </label>
            <p className="text-[10px] text-muted-foreground/90 mt-2 text-center">
              JPG, PNG ou WebP. 256×256px recomendado
            </p>
          </div>

          <div className="rounded-xl border border-border/50 bg-card/30 p-5 space-y-4 min-w-0">
            <div className="flex items-center gap-2">
              <Buildings className="h-4 w-4 text-muted-foreground" weight="duotone" />
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Identificação</span>
            </div>
            <div>
              <label className={labelCls}>Nome</label>
              <input value={form.name} onChange={set("name")} placeholder="Nome da clínica" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Descrição</label>
              <textarea value={form.description} onChange={set("description")} placeholder="Breve descrição da clínica..." rows={3}
                className="w-full rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-accent/40 resize-none transition-colors" />
            </div>
          </div>
        </div>

        {/* Endereço + Contato */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border/50 bg-card/30 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <IdentificationCard className="h-4 w-4 text-muted-foreground" weight="duotone" />
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Endereço</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>Logradouro</label>
                <input value={form.addressStreet} onChange={set("addressStreet")} placeholder="Rua, avenida..." className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Número</label>
                <input value={form.addressNumber} onChange={set("addressNumber")} placeholder="123" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Complemento</label>
              <input value={form.addressComplement} onChange={set("addressComplement")} placeholder="Sala, andar..." className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Bairro</label>
                <input value={form.addressNeighborhood} onChange={set("addressNeighborhood")} placeholder="Bairro" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Cidade</label>
                <input value={form.addressCity} onChange={set("addressCity")} placeholder="Cidade" className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Estado</label>
                <input value={form.addressState}
                  onChange={(e) => setForm((p) => ({ ...p, addressState: e.target.value.toUpperCase().slice(0, 2) }))}
                  placeholder="SP" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>CEP</label>
                <input value={form.addressZip}
                  onChange={(e) => setForm((p) => ({ ...p, addressZip: e.target.value.replace(/\D/g, "").replace(/(\d{5})(\d)/, "$1-$2").slice(0, 9) }))}
                  placeholder="00000-000" className={inputCls} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-card/30 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Storefront className="h-4 w-4 text-muted-foreground" weight="duotone" />
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Contato</span>
            </div>
            <div>
              <label className={labelCls}>Telefone</label>
              <input value={form.phone} onChange={set("phone")} placeholder="(11) 3456-7890" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>E-mail</label>
              <input type="email" value={form.email} onChange={set("email")} placeholder="contato@clinica.com.br" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Website</label>
              <input type="url" value={form.website} onChange={set("website")} placeholder="https://..." className={inputCls} />
            </div>
          </div>
        </div>

        {/* Notificações */}
        <div className="rounded-xl border border-border/50 bg-card/30 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" weight="duotone" />
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Notificações</span>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/15 px-3 py-2.5">
            <div>
              <p className="text-[12px] font-medium text-foreground">Ativar notificações do tenant</p>
              <p className="text-[11px] text-muted-foreground/90">Controla bell, feed e toasts em tempo real</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.notificationsEnabled}
              onClick={() => setForm((p) => ({ ...p, notificationsEnabled: !p.notificationsEnabled }))}
              className={`relative h-7 w-12 shrink-0 rounded-full border-2 transition-colors cursor-pointer ${
                form.notificationsEnabled ? "border-accent bg-accent/20" : "border-border bg-muted/30"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full transition-all ${
                  form.notificationsEnabled ? "left-6 bg-accent" : "left-0.5 bg-muted-foreground/50"
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Tipos habilitados</label>
              <div className="space-y-1.5 rounded-lg border border-border/40 bg-muted/10 p-2.5 max-h-52 overflow-y-auto">
                {NOTIFICATION_TYPE_OPTIONS.map((type) => {
                  const checked = form.notificationTypes.includes(type)
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleArray("notificationTypes", type)}
                      className={`w-full rounded-md px-2 py-1.5 text-left text-[11px] transition-colors cursor-pointer ${
                        checked
                          ? "bg-accent/15 text-accent"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                      }`}
                    >
                      {type}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelCls}>Digest (minutos)</label>
                <input
                  type="number"
                  min={1}
                  value={form.notificationDigestMinutes}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, notificationDigestMinutes: Number(e.target.value || 15) }))
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Roles (preparação)</label>
                <div className="space-y-1.5 rounded-lg border border-border/40 bg-muted/10 p-2.5">
                  {ROLE_OPTIONS.map((role) => {
                    const checked = form.notificationRoles.includes(role)
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => toggleArray("notificationRoles", role)}
                        className={`w-full rounded-md px-2 py-1.5 text-left text-[11px] transition-colors cursor-pointer ${
                          checked
                            ? "bg-accent/15 text-accent"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                        }`}
                      >
                        {role}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <AnimatePresence>
            {saveError && (
              <motion.p key="err" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className="text-[12px] text-rose-400 flex items-center gap-1.5">
                <Warning className="h-3.5 w-3.5" /> {saveError}
              </motion.p>
            )}
            {saved && !saveError && (
              <motion.p key="ok" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className="text-[12px] text-emerald-400 flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" weight="bold" /> Alterações salvas
              </motion.p>
            )}
            {!saveError && !saved && <span />}
          </AnimatePresence>

          <button type="submit" disabled={update.isPending}
            className="cursor-pointer flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-[13px] font-bold text-accent-foreground hover:bg-accent/90 disabled:opacity-60 transition-colors">
            {update.isPending
              ? <><ArrowsClockwise className="h-4 w-4 animate-spin" /> Salvando...</>
              : <><Check className="h-4 w-4" weight="bold" /> Salvar alterações</>}
          </button>
        </div>
      </form>
    </motion.div>
  )
}
