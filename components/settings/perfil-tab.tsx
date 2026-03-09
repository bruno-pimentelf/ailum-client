"use client"

import type React from "react"
import { motion } from "framer-motion"
import {
  Crown,
  Stethoscope,
  IdentificationCard,
  Buildings,
  Warning,
} from "@phosphor-icons/react"
import { useMe } from "@/hooks/use-me"

const ROLE_LABEL: Record<string, { label: string; icon: React.ElementType; bg: string; border: string; text: string }> = {
  ADMIN:        { label: "Admin",        icon: Crown,              bg: "bg-violet-500/10", border: "border-violet-500/25", text: "text-violet-300" },
  PROFESSIONAL: { label: "Profissional", icon: Stethoscope,        bg: "bg-cyan-500/10",   border: "border-cyan-500/25",   text: "text-cyan-300"   },
  SECRETARY:    { label: "Secretária",   icon: IdentificationCard, bg: "bg-amber-500/10",  border: "border-amber-500/25",  text: "text-amber-300"  },
}

export function PerfilTab() {
  const { data: me, isLoading, error } = useMe()

  const initials = (me?.name ?? me?.email ?? "?")
    .split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()

  const roleConfig = me?.role ? ROLE_LABEL[me.role] : null
  const RoleIcon = roleConfig?.icon

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card/30 p-5 h-32 animate-pulse" />
        ))}
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center gap-3 py-16">
        <Warning className="h-8 w-8 text-rose-400/50" weight="duotone" />
        <p className="text-[13px] text-muted-foreground/50">Não foi possível carregar seu perfil</p>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-5 w-full">
      {/* Avatar + dados */}
      <div className="grid grid-cols-1 xl:grid-cols-[200px_1fr] gap-5 items-start">
        <div className="rounded-xl border border-border/50 bg-card/30 p-5 flex flex-col items-center gap-3">
          <div className="h-20 w-20 rounded-full border-2 border-border/60 overflow-hidden flex items-center justify-center bg-accent/10 shrink-0">
            {me?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={me.image} alt={me.name ?? ""} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[22px] font-bold text-accent/70">{initials}</span>
            )}
          </div>
          {roleConfig && RoleIcon && (
            <div className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-bold ${roleConfig.bg} ${roleConfig.border} ${roleConfig.text}`}>
              <RoleIcon className="h-3 w-3" weight="fill" />
              {roleConfig.label}
            </div>
          )}
          <p className="text-[10px] text-muted-foreground/40 text-center">
            Membro desde {me?.createdAt ? new Date(me.createdAt).toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) : "—"}
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/30 p-5 space-y-4 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <IdentificationCard className="h-4 w-4 text-muted-foreground" weight="duotone" />
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Dados da conta</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-1.5">Nome</label>
              <div className="flex h-10 items-center rounded-lg border border-border/50 bg-muted/10 px-3 text-[13px] text-foreground/80">
                {me?.name ?? <span className="text-muted-foreground/30">—</span>}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-1.5">E-mail</label>
              <div className="flex h-10 items-center rounded-lg border border-border/50 bg-muted/10 px-3 text-[12px] text-foreground/80 font-mono">
                {me?.email ?? <span className="text-muted-foreground/30">—</span>}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-1.5">ID do membro</label>
              <div className="flex h-10 items-center rounded-lg border border-border/50 bg-muted/10 px-3 text-[11px] text-muted-foreground/50 font-mono truncate">
                {me?.memberId ?? "—"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clínica vinculada */}
      <div className="rounded-xl border border-border/50 bg-card/30 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Buildings className="h-4 w-4 text-muted-foreground" weight="duotone" />
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Clínica vinculada</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-1.5">Nome</label>
            <div className="flex h-10 items-center rounded-lg border border-border/50 bg-muted/10 px-3 text-[13px] text-foreground/80">
              {me?.tenant.name ?? "—"}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-1.5">Slug</label>
            <div className="flex h-10 items-center rounded-lg border border-border/50 bg-muted/10 px-3 text-[12px] text-foreground/70 font-mono">
              {me?.tenant.slug ?? "—"}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-1.5">Tenant ID</label>
            <div className="flex h-10 items-center rounded-lg border border-border/50 bg-muted/10 px-3 text-[11px] text-muted-foreground/50 font-mono truncate">
              {me?.tenant.id ?? "—"}
            </div>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground/30 text-right">
        Para alterar nome ou e-mail, entre em contato com o suporte.
      </p>
    </motion.div>
  )
}
