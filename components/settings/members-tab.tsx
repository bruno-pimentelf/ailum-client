"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users,
  MagnifyingGlass,
  Plus,
  DotsThree,
  Crown,
  Stethoscope,
  IdentificationCard,
  Pencil,
  Trash,
  Check,
  Warning,
  ArrowsClockwise,
  X,
  Key,
} from "@phosphor-icons/react"
import {
  useMembers,
  useCreateMemberAccount,
  useUpdateMemberRole,
  useRemoveMember,
} from "@/hooks/use-members"
import { useProfessionals } from "@/hooks/use-professionals"
import type { Member as ApiMember, MemberRole } from "@/lib/api/members"

const ease = [0.33, 1, 0.68, 1] as const

type ApiRoleFilter = MemberRole | "all"

export const ROLE_CFG: Record<MemberRole, { label: string; icon: React.ElementType; bg: string; border: string; text: string }> = {
  ADMIN:        { label: "Admin",         icon: Crown,              bg: "bg-violet-500/10", border: "border-violet-500/25", text: "text-violet-300" },
  PROFESSIONAL: { label: "Profissional",  icon: Stethoscope,        bg: "bg-cyan-500/10",   border: "border-cyan-500/25",   text: "text-cyan-300"   },
  SECRETARY:    { label: "Secretária",    icon: IdentificationCard, bg: "bg-amber-500/10",  border: "border-amber-500/25",  text: "text-amber-300"  },
}

function roleLabel(r: string): string {
  return ROLE_CFG[r as MemberRole]?.label ?? r
}

function hasProfessionalBadge(member: ApiMember): boolean {
  return !!member.professionalId
}

// ── Create Account Modal ───────────────────────────────────────────────────────

function CreateAccountModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<MemberRole>("SECRETARY")
  const [professionalId, setProfessionalId] = useState("")
  const [error, setError] = useState<string | null>(null)
  const createAccount = useCreateMemberAccount()
  const { data: professionals } = useProfessionals()

  useEffect(() => {
    if (open) {
      setName("")
      setEmail("")
      setPassword("")
      setRole("SECRETARY")
      setProfessionalId("")
      setError(null)
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Preencha nome, e-mail e senha.")
      return
    }
    setError(null)
    try {
      await createAccount.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        role,
        professionalId: role === "PROFESSIONAL" && professionalId ? professionalId : undefined,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta")
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }} onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
          <motion.div key="panel" initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }} transition={{ duration: 0.24, ease }}
            className="fixed inset-x-4 top-[20vh] z-50 mx-auto max-w-md rounded-2xl border border-border/60 bg-[oklch(0.14_0.02_263)] shadow-2xl shadow-black/60 overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 border border-accent/20">
                  <Key className="h-4 w-4 text-accent" weight="duotone" />
                </div>
                <h2 className="text-[14px] font-semibold text-foreground">Criar conta de membro</h2>
              </div>
              <button onClick={onClose} className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/85 hover:text-foreground hover:bg-muted/40 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground/90 uppercase tracking-wider mb-1.5">Nome *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Maria Souza"
                  autoFocus
                  className="w-full h-10 rounded-xl border border-border/60 bg-muted/20 px-3.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground/90 uppercase tracking-wider mb-1.5">E-mail *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colaborador@clinica.com"
                  className="w-full h-10 rounded-xl border border-border/60 bg-muted/20 px-3.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground/90 uppercase tracking-wider mb-1.5">Senha *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="SenhaForte123"
                  className="w-full h-10 rounded-xl border border-border/60 bg-muted/20 px-3.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground/90 uppercase tracking-wider mb-1.5">Perfil *</label>
                <div className="flex gap-2">
                  {(Object.keys(ROLE_CFG) as MemberRole[]).map((r) => {
                    const cfg = ROLE_CFG[r]
                    const Icon = cfg.icon
                    const active = role === r
                    return (
                      <button key={r} type="button" onClick={() => setRole(r)}
                        className={`cursor-pointer flex-1 flex flex-col items-center gap-1 rounded-xl border py-2.5 transition-all duration-150 ${
                          active ? `${cfg.bg} ${cfg.border} ${cfg.text}` : "border-border/40 bg-muted/10 text-muted-foreground/85 hover:border-border hover:text-muted-foreground"
                        }`}>
                        <Icon className="h-4 w-4" weight={active ? "fill" : "regular"} />
                        <span className="text-[10px] font-bold">{cfg.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {role === "PROFESSIONAL" && (
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground/90 uppercase tracking-wider mb-1.5">Profissional (opcional)</label>
                  <select
                    value={professionalId}
                    onChange={(e) => setProfessionalId(e.target.value)}
                    className="w-full h-10 rounded-xl border border-border/60 bg-muted/20 px-3.5 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"
                  >
                    <option value="">Sem vínculo</option>
                    {(professionals ?? []).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} {p.specialty ? `· ${p.specialty}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/[0.08] px-3.5 py-2.5">
                    <Warning className="h-4 w-4 text-rose-400 shrink-0" weight="fill" />
                    <p className="text-[12px] text-rose-400">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2 pt-1">
                <button type="button" onClick={onClose} className="cursor-pointer flex-1 rounded-xl border border-border/60 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={createAccount.isPending}
                  className="cursor-pointer flex-1 flex items-center justify-center gap-2 rounded-xl bg-accent py-2 text-[13px] font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-60">
                  {createAccount.isPending
                    ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }} className="h-3.5 w-3.5 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" />
                    : <Check className="h-3.5 w-3.5" weight="bold" />}
                  {createAccount.isPending ? "Criando..." : "Criar conta"}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── Edit Role Modal ────────────────────────────────────────────────────────────

function EditRoleModal({ member, open, onClose }: { member: ApiMember | null; open: boolean; onClose: () => void }) {
  const [role, setRole] = useState<MemberRole>("SECRETARY")
  const [professionalId, setProfessionalId] = useState("")
  const [error, setError] = useState<string | null>(null)
  const updateRole = useUpdateMemberRole()
  const { data: professionals } = useProfessionals()

  useEffect(() => {
    if (member) {
      setRole(member.role)
      setProfessionalId(member.professional?.id ?? "")
      setError(null)
    }
  }, [member])

  async function handleSave() {
    if (!member) return
    setError(null)
    try {
      await updateRole.mutateAsync({
        memberId: member.id,
        body: {
          role,
          professionalId: role === "PROFESSIONAL" ? (professionalId || null) : null,
        },
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao alterar perfil")
    }
  }

  return (
    <AnimatePresence>
      {open && member && (
        <>
          <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }} onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
          <motion.div key="panel" initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }} transition={{ duration: 0.24, ease }}
            className="fixed inset-x-4 top-[22vh] z-50 mx-auto max-w-sm rounded-2xl border border-border/60 bg-[oklch(0.14_0.02_263)] shadow-2xl shadow-black/60 overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
              <h2 className="text-[14px] font-semibold text-foreground">Alterar perfil</h2>
              <button onClick={onClose} className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/85 hover:text-foreground hover:bg-muted/40 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-4 flex flex-col gap-4">
              <p className="text-[12px] text-muted-foreground/90">
                Membro ID: <span className="font-mono text-muted-foreground/90">{member.id}</span>
              </p>

              <div className="flex gap-2">
                {(Object.keys(ROLE_CFG) as MemberRole[]).map((r) => {
                  const cfg = ROLE_CFG[r]
                  const Icon = cfg.icon
                  const active = role === r
                  return (
                    <button key={r} type="button" onClick={() => setRole(r)}
                      className={`cursor-pointer flex-1 flex flex-col items-center gap-1 rounded-xl border py-2.5 transition-all duration-150 ${
                        active ? `${cfg.bg} ${cfg.border} ${cfg.text}` : "border-border/40 bg-muted/10 text-muted-foreground/85 hover:border-border hover:text-muted-foreground"
                      }`}>
                      <Icon className="h-4 w-4" weight={active ? "fill" : "regular"} />
                      <span className="text-[10px] font-bold">{cfg.label}</span>
                    </button>
                  )
                })}
              </div>

              {role === "PROFESSIONAL" && (
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground/90 uppercase tracking-wider mb-1.5">Profissional</label>
                  <select
                    value={professionalId}
                    onChange={(e) => setProfessionalId(e.target.value)}
                    className="w-full h-10 rounded-xl border border-border/60 bg-muted/20 px-3.5 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"
                  >
                    <option value="">Sem vínculo</option>
                    {(professionals ?? []).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} {p.specialty ? `· ${p.specialty}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/[0.08] px-3.5 py-2.5">
                    <Warning className="h-4 w-4 text-rose-400 shrink-0" weight="fill" />
                    <p className="text-[12px] text-rose-400">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-2 pt-1">
                <button onClick={onClose} className="cursor-pointer flex-1 rounded-xl border border-border/60 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={
                    updateRole.isPending ||
                    (role === member.role && professionalId === (member.professional?.id ?? ""))
                  }
                  className="cursor-pointer flex-1 flex items-center justify-center gap-2 rounded-xl bg-accent py-2 text-[13px] font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50">
                  {updateRole.isPending
                    ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }} className="h-3.5 w-3.5 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" />
                    : <Check className="h-3.5 w-3.5" weight="bold" />}
                  Salvar
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── Member Card ────────────────────────────────────────────────────────────────

function MemberCard({ member, index, onEdit }: { member: ApiMember; index: number; onEdit: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [removeConfirm, setRemoveConfirm] = useState(false)
  const removeMember = useRemoveMember()

  const cfg = ROLE_CFG[member.role]
  const showProfessionalBadge = hasProfessionalBadge(member)
  const Icon = cfg.icon

  const displayName = member.user?.name ?? member.professional?.fullName ?? member.user?.email ?? member.userId
  const displaySub  = member.user?.email ?? (member.professional?.specialty ?? null)
  const initials = displayName.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()

  async function handleRemove() {
    try {
      await removeMember.mutateAsync(member.id)
    } catch { /* list refetches automatically */ }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03, ease }}
      className="group relative flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 transition-all duration-150 hover:border-white/[0.10] hover:bg-white/[0.04]"
    >
      {member.user?.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={member.user.image} alt={displayName}
          className="h-8 w-8 shrink-0 rounded-full object-cover border border-white/[0.08]" />
      ) : (
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${cfg.bg} ${cfg.border} ${cfg.text}`}>
          {initials}
        </div>
      )}

      <div className="flex-1 min-w-0 py-0.5">
        <p className="text-[12px] font-bold text-white/90 truncate">{displayName}</p>
        {displaySub && <p className="text-[11px] text-white/90 truncate">{displaySub}</p>}
        {!member.isActive && (
          <span className="text-[9px] font-bold text-amber-400/70 uppercase tracking-wider">convite pendente</span>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <div className={`flex items-center gap-1 rounded-md border px-2 py-0.5 ${cfg.bg} ${cfg.border} ${cfg.text}`}>
          <Icon className="h-3 w-3" weight="fill" />
          <span className="text-[10px] font-bold">{cfg.label}</span>
        </div>
        {showProfessionalBadge && (
          <div className="flex items-center gap-1 rounded-md border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 text-cyan-300">
            <Stethoscope className="h-3 w-3" weight="fill" />
            <span className="text-[10px] font-bold">Profissional</span>
          </div>
        )}
      </div>

      <div className="relative shrink-0 w-6 flex justify-end">
        <button onClick={() => setMenuOpen((v) => !v)} className="cursor-pointer flex h-6 w-6 items-center justify-center rounded text-white/90 opacity-0 group-hover:opacity-100 hover:bg-white/[0.06] hover:text-white/85 transition-all duration-150">
          <DotsThree className="h-3.5 w-3.5" weight="bold" />
        </button>
        <AnimatePresence>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => { setMenuOpen(false); setRemoveConfirm(false) }} aria-hidden />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: -2 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -2 }}
                transition={{ duration: 0.12, ease }}
                className="absolute right-0 top-full mt-1 z-20 w-36 rounded-lg border border-white/[0.08] bg-[oklch(0.16_0.02_263)] py-0.5 shadow-lg shadow-black/30">
                <button onClick={() => { onEdit(); setMenuOpen(false) }}
                  className="cursor-pointer w-full flex items-center gap-1.5 px-2.5 py-1.5 text-left text-[11px] font-medium text-white/85 hover:bg-white/[0.06] hover:text-white/90 transition-colors">
                  <Pencil className="h-3 w-3" /> Alterar perfil
                </button>
                {!removeConfirm ? (
                  <button onClick={() => setRemoveConfirm(true)}
                    className="cursor-pointer w-full flex items-center gap-1.5 px-2.5 py-1.5 text-left text-[11px] font-medium text-white/90 hover:bg-rose-500/[0.08] hover:text-rose-400 transition-colors">
                    <Trash className="h-3 w-3" /> Remover
                  </button>
                ) : (
                  <button onClick={handleRemove} disabled={removeMember.isPending}
                    className="cursor-pointer w-full flex items-center gap-1.5 px-2.5 py-1.5 text-left text-[11px] font-bold text-rose-400 bg-rose-500/[0.08] hover:bg-rose-500/[0.14] transition-colors disabled:opacity-50">
                    <Check className="h-3 w-3" /> Confirmar
                  </button>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ── MembersTab ─────────────────────────────────────────────────────────────────

export function MembersTab() {
  const { data: members, isLoading, error, refetch } = useMembers()
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<ApiRoleFilter>("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [editMember, setEditMember] = useState<ApiMember | null>(null)

  const filtered = (members ?? []).filter((m) => {
    const name = m.user?.name ?? m.professional?.fullName ?? ""
    const matchSearch = !search.trim()
      || name.toLowerCase().includes(search.toLowerCase())
      || (m.user?.email ?? "").toLowerCase().includes(search.toLowerCase())
      || m.userId.toLowerCase().includes(search.toLowerCase())
    const matchRole =
      roleFilter === "all" ||
      m.role === roleFilter ||
      (roleFilter === "PROFESSIONAL" && hasProfessionalBadge(m))
    return matchSearch && matchRole
  })

  return (
    <>
      <CreateAccountModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditRoleModal member={editMember} open={!!editMember} onClose={() => setEditMember(null)} />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/85" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..."
              className="cursor-text w-full h-8 pl-8 pr-3 rounded-lg border border-white/[0.06] bg-white/[0.03] text-[12px] text-white/90 placeholder:text-white/22 focus:outline-none focus:ring-1 focus:ring-accent/40 transition-all" />
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {(["all", ...Object.keys(ROLE_CFG)] as ApiRoleFilter[]).map((r) => {
              const cfg = r === "all" ? null : ROLE_CFG[r as MemberRole]
              const Icon = cfg?.icon
              const label = r === "all" ? "Todos" : cfg!.label
              const active = roleFilter === r
              return (
                <button key={r} onClick={() => setRoleFilter(r)}
                  className={`cursor-pointer flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-bold transition-all duration-150 ${
                    active
                      ? cfg ? `${cfg.bg} ${cfg.border} ${cfg.text}` : "bg-white/[0.08] border-white/[0.12] text-white/85"
                      : "border-white/[0.05] bg-white/[0.02] text-white/88 hover:border-white/[0.08] hover:text-white/85"
                  }`}>
                  {Icon && <Icon className="h-3 w-3" weight={active ? "fill" : "regular"} />}
                  {label}
                </button>
              )
            })}
            <button onClick={() => setCreateOpen(true)}
              className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-accent/25 bg-accent/8 px-2.5 py-1.5 text-[11px] font-bold text-accent hover:bg-accent/15 transition-all duration-150">
              <Plus className="h-3 w-3" weight="bold" /> Criar conta
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 rounded-lg border border-white/[0.04] bg-white/[0.02] animate-pulse" />
            ))}
          </div>
        )}

        {error && !isLoading && (
          <div className="flex flex-col items-center gap-2 py-10">
            <Warning className="h-7 w-7 text-rose-400/50" weight="duotone" />
            <p className="text-[12px] text-muted-foreground/90">Erro ao carregar membros</p>
            <button onClick={() => refetch()} className="cursor-pointer flex items-center gap-1.5 text-[11px] text-accent/60 hover:text-accent transition-colors">
              <ArrowsClockwise className="h-3.5 w-3.5" /> Tentar novamente
            </button>
          </div>
        )}

        {!isLoading && !error && (
          <div className="flex flex-col gap-6 w-full">
            <div>
              <h3 className="text-[11px] font-bold text-white/88 uppercase tracking-wider mb-2">Membros</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-1 w-full">
                {filtered.length > 0 ? (
                  filtered.map((m, i) => (
                    <MemberCard key={m.id} member={m} index={i} onEdit={() => setEditMember(m)} />
                  ))
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.05] bg-white/[0.02] mb-3">
                      <Users className="h-4 w-4 text-white/82" weight="duotone" />
                    </div>
                    <p className="text-[12px] font-bold text-white/90">
                      {search ? "Nenhum membro encontrado" : "Nenhum membro ainda"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </>
  )
}
