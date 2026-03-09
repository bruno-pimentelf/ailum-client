"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import type React from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useMe } from "@/hooks/use-me"
import { useMembers, useInviteMember, useUpdateMemberRole, useRemoveMember } from "@/hooks/use-members"
import type { Member as ApiMember, MemberRole } from "@/lib/api/members"
import {
  useIntegrations,
  useSaveZapi,
  useZapiStatus,
  useZapiQrCode,
  useZapiDisconnect,
  useZapiRestart,
  useSaveAsaas,
  useRemoveIntegration,
} from "@/hooks/use-integrations"
import type { Integration } from "@/lib/api/integrations"
import {
  Gear,
  Buildings,
  Users,
  Microphone,
  MagnifyingGlass,
  Plus,
  DotsThree,
  User,
  Crown,
  Stethoscope,
  IdentificationCard,
  Pencil,
  Trash,
  Check,
  CaretRight,
  Stop,
  Waveform,
  PlugsConnected,
  WhatsappLogo,
  Storefront,
  Image as ImageIcon,
  X,
  Sparkle,
  ArrowsClockwise,
  QrCode,
  LinkBreak,
  Warning,
} from "@phosphor-icons/react"

const ease = [0.33, 1, 0.68, 1] as const

// ─── Tab config ───────────────────────────────────────────────────────────────

type TabId = "geral" | "perfil" | "conexoes" | "servicos" | "membros" | "voz"

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "geral", label: "Geral", icon: Gear },
  { id: "perfil", label: "Meu Perfil", icon: User },
  { id: "conexoes", label: "Conexões", icon: PlugsConnected },
  { id: "servicos", label: "Serviços", icon: Storefront },
  { id: "membros", label: "Membros", icon: Users },
  { id: "voz", label: "Voz", icon: Microphone },
]

// ─── Members tab ──────────────────────────────────────────────────────────────

type ApiRoleFilter = MemberRole | "all"

const ROLE_CFG: Record<MemberRole, { label: string; icon: React.ElementType; bg: string; border: string; text: string }> = {
  ADMIN:        { label: "Admin",         icon: Crown,              bg: "bg-violet-500/10", border: "border-violet-500/25", text: "text-violet-300" },
  PROFESSIONAL: { label: "Profissional",  icon: Stethoscope,        bg: "bg-cyan-500/10",   border: "border-cyan-500/25",   text: "text-cyan-300"   },
  SECRETARY:    { label: "Secretária",    icon: IdentificationCard, bg: "bg-amber-500/10",  border: "border-amber-500/25",  text: "text-amber-300"  },
}

// ── Invite Modal ──────────────────────────────────────────────────────────────

function InviteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<MemberRole>("SECRETARY")
  const [error, setError] = useState<string | null>(null)
  const invite = useInviteMember()

  useEffect(() => {
    if (open) { setEmail(""); setRole("SECRETARY"); setError(null) }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) { setError("Informe o e-mail."); return }
    setError(null)
    try {
      await invite.mutateAsync({ email: email.trim(), role })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar convite")
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
                  <Users className="h-4 w-4 text-accent" weight="duotone" />
                </div>
                <h2 className="text-[14px] font-semibold text-foreground">Convidar membro</h2>
              </div>
              <button onClick={onClose} className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-1.5">E-mail *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colaborador@clinica.com"
                  autoFocus
                  className="w-full h-10 rounded-xl border border-border/60 bg-muted/20 px-3.5 text-[13px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-1.5">Perfil *</label>
                <div className="flex gap-2">
                  {(Object.keys(ROLE_CFG) as MemberRole[]).map((r) => {
                    const cfg = ROLE_CFG[r]
                    const Icon = cfg.icon
                    const active = role === r
                    return (
                      <button key={r} type="button" onClick={() => setRole(r)}
                        className={`cursor-pointer flex-1 flex flex-col items-center gap-1 rounded-xl border py-2.5 transition-all duration-150 ${
                          active ? `${cfg.bg} ${cfg.border} ${cfg.text}` : "border-border/40 bg-muted/10 text-muted-foreground/50 hover:border-border hover:text-muted-foreground"
                        }`}>
                        <Icon className="h-4 w-4" weight={active ? "fill" : "regular"} />
                        <span className="text-[10px] font-bold">{cfg.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

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
                <button type="submit" disabled={invite.isPending}
                  className="cursor-pointer flex-1 flex items-center justify-center gap-2 rounded-xl bg-accent py-2 text-[13px] font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-60">
                  {invite.isPending
                    ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }} className="h-3.5 w-3.5 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" />
                    : <Check className="h-3.5 w-3.5" weight="bold" />}
                  {invite.isPending ? "Enviando..." : "Enviar convite"}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── Edit Role Modal ───────────────────────────────────────────────────────────

function EditRoleModal({ member, open, onClose }: { member: ApiMember | null; open: boolean; onClose: () => void }) {
  const [role, setRole] = useState<MemberRole>("SECRETARY")
  const [error, setError] = useState<string | null>(null)
  const updateRole = useUpdateMemberRole()

  useEffect(() => {
    if (member) { setRole(member.role); setError(null) }
  }, [member])

  async function handleSave() {
    if (!member) return
    setError(null)
    try {
      await updateRole.mutateAsync({ memberId: member.id, body: { role } })
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
              <button onClick={onClose} className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-4 flex flex-col gap-4">
              <p className="text-[12px] text-muted-foreground/60">
                Membro ID: <span className="font-mono text-muted-foreground/40">{member.id}</span>
              </p>

              <div className="flex gap-2">
                {(Object.keys(ROLE_CFG) as MemberRole[]).map((r) => {
                  const cfg = ROLE_CFG[r]
                  const Icon = cfg.icon
                  const active = role === r
                  return (
                    <button key={r} type="button" onClick={() => setRole(r)}
                      className={`cursor-pointer flex-1 flex flex-col items-center gap-1 rounded-xl border py-2.5 transition-all duration-150 ${
                        active ? `${cfg.bg} ${cfg.border} ${cfg.text}` : "border-border/40 bg-muted/10 text-muted-foreground/50 hover:border-border hover:text-muted-foreground"
                      }`}>
                      <Icon className="h-4 w-4" weight={active ? "fill" : "regular"} />
                      <span className="text-[10px] font-bold">{cfg.label}</span>
                    </button>
                  )
                })}
              </div>

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
                <button onClick={handleSave} disabled={updateRole.isPending || role === member.role}
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

// ── Member card ───────────────────────────────────────────────────────────────

function MemberCard({ member, index, onEdit, onRemove }: { member: ApiMember; index: number; onEdit: () => void; onRemove: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [removeConfirm, setRemoveConfirm] = useState(false)
  const removeMember = useRemoveMember()

  const cfg = ROLE_CFG[member.role]
  const Icon = cfg.icon

  // Display name: prefer user.name → professional.fullName → email → userId
  const displayName = member.user?.name ?? member.professional?.fullName ?? member.user?.email ?? member.userId
  const displaySub  = member.user?.email ?? (member.professional?.specialty ?? null)
  const initials = displayName.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()

  async function handleRemove() {
    try {
      await removeMember.mutateAsync(member.id)
      onRemove()
    } catch { /* handled silently — list refetches */ }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03, ease }}
      className="group relative flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 transition-all duration-150 hover:border-white/[0.10] hover:bg-white/[0.04]"
    >
      {/* Avatar — photo if available, else initials */}
      {member.user?.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={member.user.image} alt={displayName}
          className="h-8 w-8 shrink-0 rounded-full object-cover border border-white/[0.08]" />
      ) : (
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${cfg.bg} ${cfg.border} ${cfg.text}`}>
          {initials}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0 py-0.5">
        <p className="text-[12px] font-bold text-white/90 truncate">{displayName}</p>
        {displaySub && <p className="text-[11px] text-white/40 truncate">{displaySub}</p>}
        {!member.isActive && (
          <span className="text-[9px] font-bold text-amber-400/70 uppercase tracking-wider">convite pendente</span>
        )}
      </div>

      {/* Role badge */}
      <div className={`flex items-center gap-1 rounded-md border px-2 py-0.5 shrink-0 ${cfg.bg} ${cfg.border} ${cfg.text}`}>
        <Icon className="h-3 w-3" weight="fill" />
        <span className="text-[10px] font-bold">{cfg.label}</span>
      </div>

      {/* Context menu */}
      <div className="relative shrink-0 w-6 flex justify-end">
        <button onClick={() => setMenuOpen((v) => !v)} className="cursor-pointer flex h-6 w-6 items-center justify-center rounded text-white/20 opacity-0 group-hover:opacity-100 hover:bg-white/[0.06] hover:text-white/45 transition-all duration-150">
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
                  className="cursor-pointer w-full flex items-center gap-1.5 px-2.5 py-1.5 text-left text-[11px] font-medium text-white/70 hover:bg-white/[0.06] hover:text-white/90 transition-colors">
                  <Pencil className="h-3 w-3" /> Alterar perfil
                </button>
                {!removeConfirm ? (
                  <button onClick={() => setRemoveConfirm(true)}
                    className="cursor-pointer w-full flex items-center gap-1.5 px-2.5 py-1.5 text-left text-[11px] font-medium text-white/40 hover:bg-rose-500/[0.08] hover:text-rose-400 transition-colors">
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

// ── MembersTab ────────────────────────────────────────────────────────────────

function MembersTab() {
  const { data: members, isLoading, error, refetch } = useMembers()
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<ApiRoleFilter>("all")
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editMember, setEditMember] = useState<ApiMember | null>(null)

  const filtered = (members ?? []).filter((m) => {
    const name = m.professional?.fullName ?? ""
    const matchSearch = !search.trim()
      || name.toLowerCase().includes(search.toLowerCase())
      || m.userId.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === "all" || m.role === roleFilter
    return matchSearch && matchRole
  })

  return (
    <>
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <EditRoleModal member={editMember} open={!!editMember} onClose={() => setEditMember(null)} />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="flex flex-col gap-4">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25" />
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
                      : "border-white/[0.05] bg-white/[0.02] text-white/35 hover:border-white/[0.08] hover:text-white/50"
                  }`}>
                  {Icon && <Icon className="h-3 w-3" weight={active ? "fill" : "regular"} />}
                  {label}
                </button>
              )
            })}
            <button onClick={() => setInviteOpen(true)}
              className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-accent/25 bg-accent/8 px-2.5 py-1.5 text-[11px] font-bold text-accent hover:bg-accent/15 transition-all duration-150">
              <Plus className="h-3 w-3" weight="bold" /> Convidar
            </button>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 rounded-lg border border-white/[0.04] bg-white/[0.02] animate-pulse" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="flex flex-col items-center gap-2 py-10">
            <Warning className="h-7 w-7 text-rose-400/50" weight="duotone" />
            <p className="text-[12px] text-muted-foreground/40">Erro ao carregar membros</p>
            <button onClick={() => refetch()} className="cursor-pointer flex items-center gap-1.5 text-[11px] text-accent/60 hover:text-accent transition-colors">
              <ArrowsClockwise className="h-3.5 w-3.5" /> Tentar novamente
            </button>
          </div>
        )}

        {/* List */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-1 w-full">
            {filtered.length > 0 ? (
              filtered.map((m, i) => (
                <MemberCard
                  key={m.id}
                  member={m}
                  index={i}
                  onEdit={() => setEditMember(m)}
                  onRemove={() => {}}
                />
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.05] bg-white/[0.02] mb-3">
                  <Users className="h-4 w-4 text-white/18" weight="duotone" />
                </div>
                <p className="text-[12px] font-bold text-white/40">
                  {search ? "Nenhum membro encontrado" : "Nenhum membro ainda"}
                </p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </>
  )
}

// ─── Voice tab ────────────────────────────────────────────────────────────────

type Voice = { id: string; name: string; status: "active" | "ready" | "training" }
const VOICES: Voice[] = [
  { id: "1", name: "Clínica Harmonia", status: "active" },
  { id: "2", name: "Dra. Marina", status: "ready" },
  { id: "3", name: "Recepção principal", status: "ready" },
]

function RecordingBars({ active, intensity = 1, compact = false }: { active: boolean; intensity?: number; compact?: boolean }) {
  const bars = [0.4, 0.7, 1, 0.6, 0.85, 0.5, 0.9, 0.65, 0.75, 0.45, 0.8, 0.55]
  const h = compact ? 18 : 24
  return (
    <div className="flex items-end gap-[1px]" style={{ height: h }}>
      {bars.map((b, i) => (
        <motion.div
          key={i}
          className="flex-1 rounded-full bg-accent/70 min-w-[3px]"
          animate={active ? { height: [`${b * 20 * intensity}%`, `${b * 100}%`, `${b * 40}%`, `${b * 90}%`, `${b * 30}%`, `${b * 100}%`], opacity: [0.5, 1, 0.7, 1, 0.6, 1] } : { height: "8%", opacity: 0.2 }}
          transition={{ duration: 1.2, repeat: active ? Infinity : 0, delay: i * 0.06, ease: "easeInOut" }}
        />
      ))}
    </div>
  )
}

function VoiceCard({ voice, isActive, onSetActive, index }: { voice: Voice; isActive: boolean; onSetActive: () => void; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease }}
      onClick={isActive ? undefined : onSetActive}
      className={`group flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all duration-150 cursor-pointer ${isActive ? "border-accent/30 bg-accent/8" : "border-border/50 bg-card/30 hover:border-border hover:bg-muted/20"}`}
    >
      <div className="flex items-center justify-center w-9 h-9 rounded-lg border border-border/50 bg-muted/20 shrink-0 overflow-hidden px-1">
        <RecordingBars active={isActive} intensity={0.8} compact />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-bold text-foreground truncate">{voice.name}</p>
        <p className="text-[10px] text-muted-foreground/70">{isActive ? "Voz ativa" : "Clique para ativar"}</p>
      </div>
      <AnimatePresence mode="wait">
        {isActive ? (
          <motion.div key="a" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} className="flex items-center gap-1 rounded-md border border-accent/30 bg-accent/15 px-2 py-0.5">
            <span className="h-1 w-1 rounded-full bg-accent animate-pulse" />
            <span className="text-[9px] font-bold text-accent">Ativo</span>
          </motion.div>
        ) : (
          <motion.div key="b" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} className="flex items-center justify-center w-6 h-6 rounded border border-border/50 text-muted-foreground/50 group-hover:text-foreground/70 group-hover:border-border transition-all">
            <CaretRight className="h-3 w-3" weight="fill" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function RecordSection() {
  const [recording, setRecording] = useState(false)
  const [recorded, setRecorded] = useState(false)
  const [uploading, setUploading] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const handleRecord = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop()
      setRecording(false)
      setRecorded(true)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      mr.start()
      mr.ondataavailable = () => {}
      mr.onstop = () => stream.getTracks().forEach((t) => t.stop())
      setRecording(true)
      setRecorded(false)
    } catch {
      setRecording(true)
      setRecorded(false)
    }
  }
  const handleTrain = () => {
    setUploading(true)
    setTimeout(() => { setUploading(false); setRecorded(false) }, 2000)
  }
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease }} className="rounded-xl border border-border/50 bg-card/30 p-5 xl:p-6 min-w-0">
      <div className="flex items-center gap-2 mb-4">
        <Waveform className="h-3.5 w-3.5 text-accent" weight="fill" />
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Treinar clone de voz</span>
      </div>
      <p className="text-[12px] text-foreground/80 leading-relaxed mb-4">Grave um áudio para treinar a IA com sua voz. Fale de forma natural, como se estivesse atendendo um paciente.</p>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <motion.button onClick={handleRecord} disabled={uploading} className={`cursor-pointer relative flex items-center justify-center w-16 h-16 rounded-2xl border-2 transition-all duration-300 overflow-hidden ${recording ? "border-rose-500/50 bg-rose-500/20" : "border-accent/40 bg-accent/10 hover:bg-accent/20 hover:border-accent/60"} ${uploading ? "opacity-50 pointer-events-none" : ""}`} whileTap={{ scale: 0.95 }} whileHover={!recording && !uploading ? { scale: 1.02 } : {}}>
          {recording && <motion.div className="absolute inset-0 bg-rose-500/20" animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }} />}
          {recording ? <Stop className="h-6 w-6 text-rose-400 relative z-10" weight="fill" /> : <Microphone className="h-6 w-6 text-accent relative z-10" weight="fill" />}
        </motion.button>
        <div className="flex-1 w-full min-w-0 flex flex-col gap-2">
          <div className="h-8 flex items-center"><RecordingBars active={recording || recorded} intensity={recording ? 1 : 0.5} /></div>
          <p className="text-[10px] text-muted-foreground/50">{recording ? "Gravando..." : recorded ? "Áudio gravado." : "Clique no microfone."}</p>
        </div>
        <AnimatePresence mode="wait">
          {recorded && (
            <motion.button key="t" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} onClick={handleTrain} disabled={uploading} className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-[11px] font-bold text-accent hover:bg-accent/20 transition-all disabled:opacity-60">
              {uploading ? <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="h-3 w-3 rounded-full border-2 border-accent/40 border-t-accent" />Treinando...</> : <><Check className="h-3 w-3" weight="bold" />Enviar</>}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

function VozTab() {
  const [activeVoiceId, setActiveVoiceId] = useState("1")
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="grid grid-cols-1 xl:grid-cols-[1fr_320px] 2xl:grid-cols-[1fr_360px] gap-6 xl:gap-8 items-start w-full">
      <RecordSection />
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-3">
          <span className="h-1 w-1 rounded-full bg-accent" />
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Vozes treinadas</span>
        </div>
        <div className="space-y-1.5">
          {VOICES.map((v, i) => (
            <VoiceCard key={v.id} voice={v} isActive={activeVoiceId === v.id} onSetActive={() => setActiveVoiceId(v.id)} index={i} />
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground/40 mt-3">A voz ativa é usada em todos os atendimentos.</p>
      </div>
    </motion.div>
  )
}

// ─── Serviços tab ────────────────────────────────────────────────────────────

type Servico = {
  id: string
  title: string
  price: string
  description: string
  photos: string[]
}

const SERVICOS_INITIAL: Servico[] = [
  { id: "1", title: "Consulta particular", price: "250", description: "Consulta de 50 minutos com especialista.", photos: [] },
  { id: "2", title: "Retorno", price: "120", description: "Retorno para acompanhamento.", photos: [] },
]

function ServiceCard({ servico, index, onEdit, onDelete }: { servico: Servico; index: number; onEdit: () => void; onDelete: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03, ease }}
      className="group flex items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
    >
      <div className="h-14 w-14 shrink-0 rounded-lg border border-white/[0.08] bg-white/[0.04] flex items-center justify-center overflow-hidden">
        {servico.photos[0] ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={servico.photos[0]} alt="" className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="h-6 w-6 text-white/20" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-white/90 truncate">{servico.title}</p>
        <p className="text-[11px] text-white/45 line-clamp-1">{servico.description}</p>
        <p className="text-[12px] font-bold text-emerald-400/90 mt-0.5">R$ {servico.price}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={onEdit} className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-all">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button onClick={onDelete} className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg text-white/25 hover:text-rose-400 hover:bg-rose-500/[0.08] transition-all">
          <Trash className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  )
}

function ServiceEditor({
  servico,
  onSave,
  onClose,
}: {
  servico: Servico | null
  onSave: (s: Servico) => void
  onClose: () => void
}) {
  const isNew = servico === null
  const [form, setForm] = useState<Servico>(
    servico ?? { id: `s-${Date.now()}`, title: "", price: "", description: "", photos: [] }
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, y: 8 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 8 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl border border-white/[0.10] bg-[oklch(0.155_0.022_263)] shadow-2xl p-5 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-black text-white/95">{isNew ? "Novo serviço" : "Editar serviço"}</h3>
          <button onClick={onClose} className="cursor-pointer p-1 rounded text-white/30 hover:text-white/70 hover:bg-white/[0.06]">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Título</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="ex: Consulta particular"
              className="cursor-text w-full h-10 rounded-lg border border-white/[0.10] bg-white/[0.04] px-3 text-[13px] font-medium text-white/90 placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-accent/40"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Preço (R$)</label>
            <input
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value.replace(/\D/g, "") })}
              placeholder="250"
              className="cursor-text w-full h-10 rounded-lg border border-white/[0.10] bg-white/[0.04] px-3 text-[13px] font-medium text-white/90 placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-accent/40"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Descreva o serviço..."
              rows={3}
              className="cursor-text w-full rounded-lg border border-white/[0.10] bg-white/[0.04] px-3 py-2 text-[12px] text-white/80 placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-accent/40 resize-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Fotos</label>
            <div className="flex gap-2 flex-wrap">
              {form.photos.map((url, i) => (
                <div key={i} className="relative h-16 w-16 rounded-lg border border-white/[0.08] bg-white/[0.04] overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <button
                    onClick={() => setForm({ ...form, photos: form.photos.filter((_, j) => j !== i) })}
                    className="absolute top-0.5 right-0.5 h-5 w-5 rounded bg-black/60 flex items-center justify-center text-white/80 hover:bg-rose-500/80"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
              <label className="cursor-pointer flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-white/[0.15] bg-white/[0.02] hover:border-accent/40 hover:bg-accent/5 transition-all">
                <ImageIcon className="h-6 w-6 text-white/30" />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files
                    if (!files?.length) return
                    const urls = [...form.photos, ...Array.from(files).map((f) => URL.createObjectURL(f))]
                    setForm({ ...form, photos: urls })
                    e.target.value = ""
                  }}
                />
              </label>
            </div>
            <p className="text-[10px] text-white/25 mt-1">Clique para adicionar imagens</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-white/[0.06]">
          <button onClick={onClose} className="cursor-pointer px-4 py-2 rounded-lg text-[12px] font-semibold text-white/40 hover:text-white/70">
            Cancelar
          </button>
          <button
            onClick={() => { onSave(form); onClose() }}
            className="cursor-pointer flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-[12px] font-bold text-accent-foreground hover:bg-accent/90"
          >
            <Check className="h-3.5 w-3.5" weight="bold" /> {isNew ? "Criar" : "Salvar"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function ServicosTab() {
  const [servicos, setServicos] = useState<Servico[]>(SERVICOS_INITIAL)
  const [editing, setEditing] = useState<Servico | null | "new">(null)

  const handleSave = (s: Servico) => {
    setServicos((prev) => {
      const i = prev.findIndex((x) => x.id === s.id)
      if (i >= 0) return prev.map((x, j) => (j === i ? s : x))
      return [...prev, s]
    })
  }

  const handleDelete = (id: string) => {
    setServicos((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-white/40">Cadastre os serviços oferecidos pela clínica</p>
        <button
          onClick={() => setEditing("new")}
          className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-accent/25 bg-accent/8 px-3 py-1.5 text-[11px] font-bold text-accent hover:bg-accent/15 transition-all"
        >
          <Plus className="h-3 w-3" weight="bold" /> Novo serviço
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 w-full">
        {servicos.map((s, i) => (
          <ServiceCard key={s.id} servico={s} index={i} onEdit={() => setEditing(s)} onDelete={() => handleDelete(s.id)} />
        ))}
        {servicos.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-white/[0.08]">
            <Storefront className="h-8 w-8 text-white/15 mb-3" />
            <p className="text-[12px] font-bold text-white/40">Nenhum serviço cadastrado</p>
            <button
              onClick={() => setEditing("new")}
              className="mt-3 cursor-pointer flex items-center gap-1.5 rounded-lg border border-accent/25 bg-accent/8 px-3 py-1.5 text-[11px] font-bold text-accent hover:bg-accent/15"
            >
              <Plus className="h-3 w-3" /> Adicionar primeiro serviço
            </button>
          </div>
        )}
      </div>
      <AnimatePresence>
        {editing !== null && (
          <ServiceEditor
            servico={editing === "new" ? null : editing}
            onSave={handleSave}
            onClose={() => setEditing(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Meu Perfil tab ───────────────────────────────────────────────────────────

function PerfilTab() {
  return <PerfilTabContent />
}

function PerfilTabContent() {
  const { data: me, isLoading, error } = useMe()

  const ROLE_LABEL: Record<string, { label: string; icon: React.ElementType; bg: string; border: string; text: string }> = {
    ADMIN: { label: "Admin", icon: Crown, bg: "bg-violet-500/10", border: "border-violet-500/25", text: "text-violet-300" },
    PROFESSIONAL: { label: "Profissional", icon: Stethoscope, bg: "bg-cyan-500/10", border: "border-cyan-500/25", text: "text-cyan-300" },
    SECRETARY: { label: "Secretária", icon: IdentificationCard, bg: "bg-amber-500/10", border: "border-amber-500/25", text: "text-amber-300" },
  }

  // Avatar initials fallback
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-5 w-full"
    >
      {/* Avatar + identidade */}
      <div className="grid grid-cols-1 xl:grid-cols-[200px_1fr] gap-5 items-start">
        {/* Avatar */}
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

        {/* Dados pessoais — read-only, vindos da API */}
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
              <div className="flex h-10 items-center rounded-lg border border-border/50 bg-muted/10 px-3 text-[13px] text-foreground/80 font-mono text-[12px]">
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

// ─── Conexões tab ────────────────────────────────────────────────────────────

// ── Shared field ──────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold text-white/35 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}

const inputCls = "w-full h-10 rounded-lg border border-white/[0.09] bg-white/[0.03] px-3 text-[12px] font-mono text-white/80 placeholder:text-white/18 focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/30 transition-all duration-200"

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      className={`rounded-full border-2 border-white/20 border-t-white/70 ${className}`}
    />
  )
}

// ── StatusBadge ───────────────────────────────────────────────────────────────

function StatusBadge({ connected, label }: { connected: boolean; label?: string }) {
  return (
    <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${connected ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-white/[0.08] bg-white/[0.03] text-white/30"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-white/20"}`} />
      {label ?? (connected ? "Conectado" : "Não configurado")}
    </span>
  )
}

// ── Z-API Card ────────────────────────────────────────────────────────────────

type ZapiView = "status" | "qrcode" | "credentials"

function ZapiCard({ integration, open, onToggle }: { integration: Integration | null; open: boolean; onToggle: () => void }) {
  const isConfigured = !!(integration?.isActive && integration?.hasApiKey)
  const [view, setView] = useState<ZapiView>(isConfigured ? "status" : "credentials")
  const [instanceId, setInstanceId] = useState(integration?.instanceId ?? "")
  const [instanceToken, setInstanceToken] = useState("")

  // Sync default view when integration state changes (e.g. after first save)
  useEffect(() => {
    if (isConfigured && view === "credentials" && !instanceToken) {
      setView("status")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfigured])

  // Status polling — always enabled when card is open and configured
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useZapiStatus({
    enabled: open && isConfigured,
    refetchInterval: open && isConfigured ? 15_000 : undefined,
  })

  const whatsappConnected = status?.connected === true

  // QR code — only enabled when in qrcode view
  const {
    data: qrData,
    isFetching: qrFetching,
    isError: qrError,
    refetch: refetchQr,
  } = useZapiQrCode({ enabled: open && view === "qrcode" })

  // Poll QR code every 12s while in QR view and not yet connected
  useEffect(() => {
    if (!open || view !== "qrcode" || whatsappConnected) return
    const id = setInterval(() => refetchQr(), 12_000)
    return () => clearInterval(id)
  }, [open, view, whatsappConnected, refetchQr])

  // Auto-switch to status view once WhatsApp connects while showing QR
  useEffect(() => {
    if (whatsappConnected && view === "qrcode") {
      setView("status")
    }
  }, [whatsappConnected, view])

  const saveZapi = useSaveZapi()
  const disconnect = useZapiDisconnect()
  const restart = useZapiRestart()
  const removeIntegration = useRemoveIntegration()

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!instanceId.trim() || !instanceToken.trim()) return
    saveZapi.mutate(
      { instanceId: instanceId.trim(), instanceToken: instanceToken.trim() },
      {
        onSuccess: () => {
          setInstanceToken("")
          setView("status")
        },
      }
    )
  }

  const handleDisconnect = () => {
    disconnect.mutate(undefined, {
      onSuccess: () => {
        setView("qrcode")
        refetchQr()
      },
    })
  }

  const handleRestart = () => {
    restart.mutate(undefined, {
      onSuccess: () => refetchStatus(),
    })
  }

  return (
    <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${isConfigured ? "border-emerald-500/25 bg-emerald-500/[0.04]" : "border-white/[0.07] bg-white/[0.015]"}`}>

      {/* Header */}
      <button type="button" onClick={onToggle} className="cursor-pointer w-full flex items-center gap-4 p-5 text-left group">
        <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 ${isConfigured ? "border-emerald-500/30 bg-emerald-500/15" : "border-white/[0.09] bg-white/[0.04]"}`}>
          <WhatsappLogo className={`h-6 w-6 transition-colors duration-300 ${isConfigured ? "text-emerald-400" : "text-white/35"}`} weight="fill" />
          {isConfigured && (
            <span className={`absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-[oklch(0.17_0.025_263)] ${whatsappConnected ? "bg-emerald-400" : "bg-amber-400"}`} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-[14px] font-bold text-white/90">WhatsApp</p>
            <span className="text-[10px] text-white/25 font-medium">via Z-API</span>
          </div>
          <p className="text-[11px] text-white/40 truncate">
            {isConfigured
              ? whatsappConnected
                ? `Conectado — instância ${integration?.instanceId}`
                : statusLoading
                  ? "Verificando status..."
                  : "Instância configurada — WhatsApp desconectado"
              : "Integre o WhatsApp para atendimentos automáticos"}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {isConfigured ? (
            <StatusBadge connected={whatsappConnected} label={statusLoading ? "..." : whatsappConnected ? "Online" : "Offline"} />
          ) : (
            <StatusBadge connected={false} />
          )}
          <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2, ease }}>
            <CaretRight className="h-3.5 w-3.5 text-white/20 group-hover:text-white/40 transition-colors" weight="bold" />
          </motion.div>
        </div>
      </button>

      {/* Expandable */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.28, ease }} className="overflow-hidden">
            <div className="mx-5 mb-5 space-y-3">

              {/* View switcher tabs — only when configured */}
              {isConfigured && (
                <div className="flex gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
                  {([
                    { id: "status" as ZapiView, label: "Status", icon: PlugsConnected },
                    ...(!whatsappConnected ? [{ id: "qrcode" as ZapiView, label: "QR Code", icon: QrCode }] : []),
                    { id: "credentials" as ZapiView, label: "Credenciais", icon: Gear },
                  ] as const).map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setView(id)}
                      className={`cursor-pointer flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold transition-all duration-200 ${view === id ? "bg-white/[0.07] text-white/80" : "text-white/30 hover:text-white/55"}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {/* ─── Status view ─────────────────────────────────── */}
              {view === "status" && (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-4">
                  {/* Connection status banner */}
                  <div className={`flex items-center gap-3 rounded-lg border px-3 py-3 ${whatsappConnected ? "border-emerald-500/25 bg-emerald-500/[0.06]" : "border-amber-500/20 bg-amber-500/[0.04]"}`}>
                    <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${whatsappConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-[12px] font-bold ${whatsappConnected ? "text-emerald-400" : "text-amber-400"}`}>
                        {statusLoading ? "Verificando..." : whatsappConnected ? "WhatsApp conectado" : "WhatsApp desconectado"}
                      </p>
                      {status?.error && !whatsappConnected && (
                        <p className="text-[10px] text-white/30 mt-0.5">{status.error}</p>
                      )}
                      {status?.smartphoneConnected === false && whatsappConnected && (
                        <p className="text-[10px] text-amber-400/60 mt-0.5">Smartphone offline — mantenha o app aberto</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => refetchStatus()}
                      disabled={statusLoading}
                      className="cursor-pointer flex items-center gap-1 rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-1.5 text-[10px] font-bold text-white/30 hover:text-white/55 transition-all disabled:opacity-40"
                    >
                      <ArrowsClockwise className={`h-3 w-3 ${statusLoading ? "animate-spin" : ""}`} />
                      Atualizar
                    </button>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {whatsappConnected ? (
                      <button
                        type="button"
                        onClick={handleDisconnect}
                        disabled={disconnect.isPending}
                        className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/[0.05] px-3.5 py-2 text-[11px] font-bold text-amber-400/70 hover:bg-amber-500/10 hover:text-amber-400 transition-all disabled:opacity-40"
                      >
                        {disconnect.isPending ? <Spinner /> : <LinkBreak className="h-3 w-3" />}
                        Desconectar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setView("qrcode"); refetchQr() }}
                        className="cursor-pointer flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-[11px] font-bold text-accent-foreground hover:bg-accent/90 transition-all"
                      >
                        <QrCode className="h-3 w-3" />
                        Escanear QR Code
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleRestart}
                      disabled={restart.isPending}
                      className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-white/[0.09] bg-white/[0.03] px-3.5 py-2 text-[11px] font-bold text-white/40 hover:text-white/70 hover:border-white/[0.16] transition-all disabled:opacity-40"
                    >
                      {restart.isPending ? <Spinner /> : <ArrowsClockwise className="h-3 w-3" />}
                      Reiniciar instância
                    </button>

                    <button
                      type="button"
                      onClick={() => removeIntegration.mutate("zapi", { onSuccess: onToggle })}
                      disabled={removeIntegration.isPending}
                      className="cursor-pointer ml-auto flex items-center gap-1.5 rounded-lg border border-rose-500/15 bg-rose-500/5 px-3 py-2 text-[11px] font-bold text-rose-400/60 hover:bg-rose-500/10 hover:text-rose-400 transition-all disabled:opacity-40"
                    >
                      {removeIntegration.isPending ? <Spinner className="h-3 w-3" /> : <Trash className="h-3 w-3" />}
                      Remover
                    </button>
                  </div>

                  {(disconnect.isSuccess || restart.isSuccess) && (
                    <p className="text-[10px] text-white/30">
                      {disconnect.isSuccess ? "Desconectado. Escaneie o QR Code para reconectar." : "Instância reiniciada com sucesso."}
                    </p>
                  )}
                </div>
              )}

              {/* ─── QR Code view ──────────────────────────────────── */}
              {view === "qrcode" && (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-4">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative flex h-48 w-48 items-center justify-center rounded-xl border border-white/[0.08] bg-white overflow-hidden">
                      {qrFetching && !qrData && (
                        <div className="flex flex-col items-center gap-2">
                          <Spinner className="h-6 w-6" />
                          <p className="text-[10px] text-white/30">Gerando QR code...</p>
                        </div>
                      )}
                      {qrError && (
                        <div className="flex flex-col items-center gap-1.5 px-3 text-center">
                          <Warning className="h-5 w-5 text-amber-500/70" />
                          <p className="text-[10px] text-slate-500">Instância já conectada ou não configurada</p>
                        </div>
                      )}
                      {qrData?.value && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={qrData.value} alt="QR Code WhatsApp" className="h-full w-full object-contain" />
                      )}
                      {qrFetching && qrData && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-xl">
                          <Spinner className="h-5 w-5" />
                        </div>
                      )}
                    </div>

                    <div className="text-center space-y-1">
                      <p className="text-[12px] font-bold text-white/70">Abra o WhatsApp no celular</p>
                      <p className="text-[11px] text-white/35">Toque em <span className="text-white/55 font-medium">⋮ → Aparelhos conectados → Conectar aparelho</span> e escaneie o código</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => refetchQr()}
                        disabled={qrFetching}
                        className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-white/[0.09] bg-white/[0.03] px-3.5 py-2 text-[11px] font-bold text-white/45 hover:text-white/70 hover:border-white/[0.16] transition-all disabled:opacity-40"
                      >
                        <ArrowsClockwise className={`h-3 w-3 ${qrFetching ? "animate-spin" : ""}`} />
                        Atualizar QR
                      </button>

                      <button
                        type="button"
                        onClick={() => refetchStatus()}
                        disabled={statusLoading}
                        className="cursor-pointer flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 text-[11px] font-bold text-emerald-400/70 hover:bg-emerald-500/15 hover:text-emerald-400 transition-all disabled:opacity-40"
                      >
                        {statusLoading ? <Spinner /> : <Check className="h-3 w-3" weight="bold" />}
                        Verificar conexão
                      </button>
                    </div>

                    <p className="text-[10px] text-white/20">O QR code é atualizado automaticamente a cada 12 segundos</p>
                  </div>
                </div>
              )}

              {/* ─── Credentials view ──────────────────────────────── */}
              {view === "credentials" && (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-4">
                  <AnimatePresence>
                    {saveZapi.isError && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-start gap-2 rounded-lg border border-rose-500/25 bg-rose-500/8 px-3 py-2.5 text-[11px] text-rose-400">
                        <X className="h-3.5 w-3.5 shrink-0 mt-px" weight="bold" />
                        Não foi possível salvar. Verifique as credenciais e tente novamente.
                      </motion.div>
                    )}
                    {saveZapi.isSuccess && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-[11px] ${saveZapi.data.webhooksConfigured ? "border-emerald-500/25 bg-emerald-500/8 text-emerald-400" : "border-amber-500/25 bg-amber-500/8 text-amber-400"}`}>
                        {saveZapi.data.webhooksConfigured
                          ? <><Check className="h-3.5 w-3.5 shrink-0 mt-px" weight="bold" /> Credenciais salvas e webhooks configurados.</>
                          : <><X className="h-3.5 w-3.5 shrink-0 mt-px" weight="bold" /> Salvo, mas webhooks falharam: {saveZapi.data.webhooksError}</>
                        }
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleSave} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Instance ID">
                        <input value={instanceId} onChange={(e) => setInstanceId(e.target.value)} placeholder="3EE8E4989B..." className={inputCls} />
                      </Field>
                      <Field label="Instance Token">
                        <input type="password" value={instanceToken} onChange={(e) => setInstanceToken(e.target.value)} placeholder="••••••••••••••••" className={inputCls} />
                      </Field>
                    </div>

                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <button type="submit" disabled={saveZapi.isPending || !instanceId.trim() || !instanceToken.trim()} className="cursor-pointer flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-[11px] font-bold text-accent-foreground hover:bg-accent/90 transition-all disabled:opacity-40">
                        {saveZapi.isPending ? <Spinner /> : <Check className="h-3 w-3" weight="bold" />}
                        {isConfigured ? "Atualizar credenciais" : "Salvar e ativar"}
                      </button>

                      {isConfigured && (
                        <button type="button" onClick={() => removeIntegration.mutate("zapi", { onSuccess: onToggle })} disabled={removeIntegration.isPending} className="cursor-pointer ml-auto flex items-center gap-1.5 rounded-lg border border-rose-500/15 bg-rose-500/5 px-3 py-2 text-[11px] font-bold text-rose-400/60 hover:bg-rose-500/10 hover:text-rose-400 transition-all disabled:opacity-40">
                          {removeIntegration.isPending ? <Spinner className="h-3 w-3" /> : <Trash className="h-3 w-3" />}
                          Remover
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Asaas Card ───────────────────────────────────────────────────────────────

function AsaasCard({ integration, open, onToggle }: { integration: Integration | null; open: boolean; onToggle: () => void }) {
  const [apiKey, setApiKey] = useState("")

  const saveAsaas = useSaveAsaas()
  const removeIntegration = useRemoveIntegration()

  const isConnected = !!(integration?.isActive && integration?.hasApiKey)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!apiKey.trim()) return
    saveAsaas.mutate({ apiKey: apiKey.trim() }, { onSuccess: () => setApiKey("") })
  }

  return (
    <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${isConnected ? "border-blue-500/25 bg-blue-500/[0.04]" : "border-white/[0.07] bg-white/[0.015]"}`}>

      {/* Header */}
      <button type="button" onClick={onToggle} className="cursor-pointer w-full flex items-center gap-4 p-5 text-left group">
        {/* Logo */}
        <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border overflow-hidden transition-all duration-300 ${isConnected ? "border-blue-500/30 bg-white" : "border-white/[0.09] bg-white"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/asaas-logo.png" alt="Asaas" className="h-7 w-7 object-contain" />
          {isConnected && <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-[oklch(0.17_0.025_263)] bg-blue-400" />}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-[14px] font-bold text-white/90">Asaas</p>
            <span className="text-[10px] text-white/25 font-medium">Cobrança & Pagamentos</span>
          </div>
          <p className="text-[11px] text-white/40">
            {isConnected ? "API key configurada e ativa" : "Automatize cobranças e receba pagamentos"}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <StatusBadge connected={isConnected} />
          <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2, ease }}>
            <CaretRight className="h-3.5 w-3.5 text-white/20 group-hover:text-white/40 transition-colors" weight="bold" />
          </motion.div>
        </div>
      </button>

      {/* Expandable */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.28, ease }} className="overflow-hidden">
            <div className="mx-5 mb-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-4">

              {/* Feedback */}
              <AnimatePresence>
                {saveAsaas.isError && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-start gap-2 rounded-lg border border-rose-500/25 bg-rose-500/8 px-3 py-2.5 text-[11px] text-rose-400">
                    <X className="h-3.5 w-3.5 shrink-0 mt-px" weight="bold" />
                    Não foi possível salvar. Verifique a API key e tente novamente.
                  </motion.div>
                )}
                {saveAsaas.isSuccess && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/8 px-3 py-2.5 text-[11px] text-emerald-400">
                    <Check className="h-3.5 w-3.5 shrink-0" weight="bold" /> API key salva com sucesso.
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSave} className="space-y-3">
                <Field label={isConnected ? "Nova API Key (substituir existente)" : "API Key"}>
                  <div className="relative">
                    <input type="password" value={apiKey} onChange={(e) => { setApiKey(e.target.value); saveAsaas.reset() }} placeholder="$aact_MzkwODA..." className={inputCls} />
                  </div>
                  <p className="text-[10px] text-white/25 mt-0.5">Encontre sua API key em <span className="text-white/40 font-medium">asaas.com → Configurações → Integrações</span></p>
                </Field>

                <div className="flex items-center gap-2 pt-1">
                  <button type="submit" disabled={saveAsaas.isPending || !apiKey.trim()} className="cursor-pointer flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-[11px] font-bold text-accent-foreground hover:bg-accent/90 transition-all disabled:opacity-40">
                    {saveAsaas.isPending ? <Spinner /> : <Check className="h-3 w-3" weight="bold" />}
                    {isConnected ? "Atualizar API key" : "Salvar e ativar"}
                  </button>
                  {isConnected && (
                    <button type="button" onClick={() => removeIntegration.mutate("asaas", { onSuccess: onToggle })} disabled={removeIntegration.isPending} className="cursor-pointer ml-auto flex items-center gap-1.5 rounded-lg border border-rose-500/15 bg-rose-500/5 px-3 py-2 text-[11px] font-bold text-rose-400/60 hover:bg-rose-500/10 hover:text-rose-400 transition-all disabled:opacity-40">
                      {removeIntegration.isPending ? <Spinner className="h-3 w-3" /> : <Trash className="h-3 w-3" />}
                      Remover
                    </button>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── ConexoesTab ───────────────────────────────────────────────────────────────

function ConexoesTab() {
  const { data: integrations, isLoading, isError, refetch } = useIntegrations()
  const [openCard, setOpenCard] = useState<string | null>(null)

  const toggle = (id: string) => setOpenCard((v) => (v === id ? null : id))

  const get = (provider: string) =>
    integrations?.find((i) => i.provider === provider) ?? null

  const activeCount = integrations?.filter((i) => i.isActive && i.hasApiKey).length ?? 0
  const totalCount = 2

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-6 w-full">

      {/* Section header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[14px] font-bold text-white/85 mb-1">Integrações</h2>
          <p className="text-[12px] text-white/35">Conecte ferramentas externas para potencializar o atendimento da sua clínica.</p>
        </div>
        {!isLoading && !isError && (
          <div className="shrink-0 flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${activeCount > 0 ? "bg-emerald-400 animate-pulse" : "bg-white/20"}`} />
            <span className="text-[11px] font-bold text-white/45">{activeCount}/{totalCount} ativas</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              <Sparkle className="h-5 w-5 text-accent" />
            </motion.div>
            <p className="text-[11px] text-white/30">Carregando integrações...</p>
          </div>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-14 rounded-2xl border border-dashed border-white/[0.07] gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03]">
            <PlugsConnected className="h-5 w-5 text-white/20" weight="duotone" />
          </div>
          <div className="text-center">
            <p className="text-[13px] font-bold text-white/50 mb-1">Não foi possível carregar</p>
            <p className="text-[11px] text-white/25">Verifique sua conexão e tente novamente</p>
          </div>
          <button onClick={() => refetch()} className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-accent/25 bg-accent/8 px-3.5 py-2 text-[11px] font-bold text-accent hover:bg-accent/15 transition-all">
            Tentar novamente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <ZapiCard integration={get("zapi")} open={openCard === "zapi"} onToggle={() => toggle("zapi")} />
          <AsaasCard integration={get("asaas")} open={openCard === "asaas"} onToggle={() => toggle("asaas")} />
        </div>
      )}
    </motion.div>
  )
}

// ─── Geral tab ────────────────────────────────────────────────────────────────

type ClinicaInfo = {
  nome: string
  descricao: string
  fotoUrl: string
  endereco: {
    logradouro: string
    numero: string
    complemento: string
    bairro: string
    cidade: string
    estado: string
    cep: string
  }
  telefone: string
  email: string
  website: string
}

const CLINICA_INITIAL: ClinicaInfo = {
  nome: "Clínica Harmonia",
  descricao: "Clínica especializada em saúde integrativa, oferecendo atendimento humanizado e tratamentos personalizados.",
  fotoUrl: "",
  endereco: {
    logradouro: "Rua das Flores",
    numero: "123",
    complemento: "Sala 201",
    bairro: "Centro",
    cidade: "São Paulo",
    estado: "SP",
    cep: "01310-100",
  },
  telefone: "(11) 3456-7890",
  email: "contato@clinicaharmonia.com.br",
  website: "https://clinicaharmonia.com.br",
}

function GeralTab() {
  const [form, setForm] = useState<ClinicaInfo>(CLINICA_INITIAL)

  const updateForm = (updates: Partial<ClinicaInfo>) => setForm((prev) => ({ ...prev, ...updates }))
  const updateEndereco = (updates: Partial<ClinicaInfo["endereco"]>) =>
    setForm((prev) => ({ ...prev, endereco: { ...prev.endereco, ...updates } }))

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 w-full"
    >
      {/* Foto + Nome + Descrição — grid em telas grandes */}
      <div className="grid grid-cols-1 xl:grid-cols-[200px_1fr] gap-6 items-start">
        {/* Foto / Logo */}
        <div className="rounded-xl border border-border/50 bg-card/30 p-5">
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon className="h-4 w-4 text-muted-foreground" weight="duotone" />
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Logo</span>
          </div>
          <label className="cursor-pointer flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 hover:border-accent/40 hover:bg-accent/5 transition-all overflow-hidden mx-auto">
            {form.fotoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={form.fotoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) setForm((prev) => ({ ...prev, fotoUrl: URL.createObjectURL(f) }))
                e.target.value = ""
              }}
            />
          </label>
          <p className="text-[10px] text-muted-foreground/60 mt-2 text-center">256×256px</p>
        </div>

        {/* Nome e Descrição */}
        <div className="rounded-xl border border-border/50 bg-card/30 p-5 space-y-4 min-w-0">
        <div className="flex items-center gap-2 mb-3">
          <Buildings className="h-4 w-4 text-muted-foreground" weight="duotone" />
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Identificação</span>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Nome</label>
          <input
            value={form.nome}
            onChange={(e) => updateForm({ nome: e.target.value })}
            placeholder="Nome da clínica"
            className="w-full h-10 rounded-lg border border-border bg-muted/20 px-3 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Descrição</label>
          <textarea
            value={form.descricao}
            onChange={(e) => updateForm({ descricao: e.target.value })}
            placeholder="Breve descrição da clínica..."
            rows={3}
            className="w-full rounded-lg border border-border bg-muted/20 px-3 py-2 text-[12px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/40 resize-none"
          />
        </div>
        </div>
      </div>

      {/* Endereço + Contato — 2 colunas em telas grandes */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Endereço */}
      <div className="rounded-xl border border-border/50 bg-card/30 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <IdentificationCard className="h-4 w-4 text-muted-foreground" weight="duotone" />
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Endereço</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Logradouro</label>
            <input
              value={form.endereco.logradouro}
              onChange={(e) => updateEndereco({ logradouro: e.target.value })}
              placeholder="Rua, avenida..."
              className="w-full h-10 rounded-lg border border-border bg-muted/20 px-3 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/40"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Número</label>
            <input
              value={form.endereco.numero}
              onChange={(e) => updateEndereco({ numero: e.target.value })}
              placeholder="123"
              className="w-full h-10 rounded-lg border border-border bg-muted/20 px-3 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/40"
            />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Complemento</label>
          <input
            value={form.endereco.complemento}
            onChange={(e) => updateEndereco({ complemento: e.target.value })}
            placeholder="Sala, andar, bloco..."
            className="w-full h-10 rounded-lg border border-border bg-muted/20 px-3 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Bairro</label>
            <input
              value={form.endereco.bairro}
              onChange={(e) => updateEndereco({ bairro: e.target.value })}
              placeholder="Bairro"
              className="w-full h-10 rounded-lg border border-border bg-muted/20 px-3 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/40"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Cidade</label>
            <input
              value={form.endereco.cidade}
              onChange={(e) => updateEndereco({ cidade: e.target.value })}
              placeholder="Cidade"
              className="w-full h-10 rounded-lg border border-border bg-muted/20 px-3 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/40"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Estado</label>
              <input
                value={form.endereco.estado}
                onChange={(e) => updateEndereco({ estado: e.target.value.toUpperCase().slice(0, 2) })}
                placeholder="SP"
                className="w-full h-10 rounded-lg border border-border bg-muted/20 px-3 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/40"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">CEP</label>
              <input
                value={form.endereco.cep}
                onChange={(e) => updateEndereco({ cep: e.target.value.replace(/\D/g, "").replace(/(\d{5})(\d)/, "$1-$2").slice(0, 9) })}
                placeholder="00000-000"
                className="w-full h-10 rounded-lg border border-border bg-muted/20 px-3 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/40"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contato */}
      <div className="rounded-xl border border-border/50 bg-card/30 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <Storefront className="h-4 w-4 text-muted-foreground" weight="duotone" />
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Contato</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Telefone</label>
            <input
              value={form.telefone}
              onChange={(e) => updateForm({ telefone: e.target.value })}
              placeholder="(11) 3456-7890"
              className="w-full h-10 rounded-lg border border-border bg-muted/20 px-3 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/40"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateForm({ email: e.target.value })}
              placeholder="contato@clinica.com.br"
              className="w-full h-10 rounded-lg border border-border bg-muted/20 px-3 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/40"
            />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Website</label>
          <input
            type="url"
            value={form.website}
            onChange={(e) => updateForm({ website: e.target.value })}
            placeholder="https://..."
            className="w-full h-10 rounded-lg border border-border bg-muted/20 px-3 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
        </div>
      </div>
      </div>

      <div className="flex justify-end pt-2">
        <button className="cursor-pointer flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-[13px] font-bold text-accent-foreground hover:bg-accent/90 transition-colors">
          <Check className="h-4 w-4" weight="bold" /> Salvar alterações
        </button>
      </div>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function SettingsContent() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab") as TabId | null
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const valid: TabId[] = ["geral", "perfil", "conexoes", "servicos", "membros", "voz"]
    return tabParam && valid.includes(tabParam) ? tabParam : "geral"
  })

  useEffect(() => {
    if (tabParam && ["geral", "perfil", "conexoes", "servicos", "membros", "voz"].includes(tabParam)) {
      setActiveTab(tabParam as TabId)
    }
  }, [tabParam])

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header with tabs */}
      <div className="flex items-stretch justify-center border-b border-border/50 shrink-0 h-11">
        <div className="flex items-stretch gap-0 px-6 overflow-x-auto scrollbar-none w-full max-w-6xl">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative shrink-0 flex items-center gap-2 px-4 h-full text-[12px] font-bold transition-colors duration-150 cursor-pointer ${
                  activeTab === tab.id ? "text-white/90" : "text-white/25 hover:text-white/60"
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div layoutId="settings-tab-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-accent" transition={{ duration: 0.22, ease }} />
                )}
                <Icon className="h-3.5 w-3.5 shrink-0" weight={activeTab === tab.id ? "fill" : "regular"} />
                <span className="relative">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="w-full max-w-4xl mx-auto lg:max-w-5xl xl:max-w-6xl">
          <AnimatePresence mode="wait">
            {activeTab === "geral" && <GeralTab key="geral" />}
            {activeTab === "perfil" && <PerfilTab key="perfil" />}
            {activeTab === "conexoes" && <ConexoesTab key="conexoes" />}
            {activeTab === "servicos" && <ServicosTab key="servicos" />}
            {activeTab === "membros" && <MembersTab key="membros" />}
            {activeTab === "voz" && <VozTab key="voz" />}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col h-full min-h-0">
        <div className="h-11 border-b border-border/50" />
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  )
}
