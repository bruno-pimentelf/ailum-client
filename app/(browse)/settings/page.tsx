"use client"

import { useState, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
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

type Role = "admin" | "profissional" | "secretaria"
type Member = { id: string; name: string; email: string; role: Role }

const ROLE_CONFIG: Record<Role, { label: string; icon: React.ElementType; bg: string; border: string; text: string }> = {
  admin: { label: "Admin", icon: Crown, bg: "bg-violet-500/10", border: "border-violet-500/25", text: "text-violet-300" },
  profissional: { label: "Profissional", icon: Stethoscope, bg: "bg-cyan-500/10", border: "border-cyan-500/25", text: "text-cyan-300" },
  secretaria: { label: "Secretária", icon: IdentificationCard, bg: "bg-amber-500/10", border: "border-amber-500/25", text: "text-amber-300" },
}

const MEMBERS: Member[] = [
  { id: "1", name: "Marina Silva", email: "marina@clinica.com", role: "admin" },
  { id: "2", name: "Carlos Mendes", email: "carlos@clinica.com", role: "profissional" },
  { id: "3", name: "Fernanda Costa", email: "fernanda@clinica.com", role: "secretaria" },
  { id: "4", name: "Roberto Almeida", email: "roberto@clinica.com", role: "profissional" },
  { id: "5", name: "Juliana Oliveira", email: "juliana@clinica.com", role: "secretaria" },
]

const BADGE_WIDTH = "w-[100px]"

function MemberCard({ member, index, onEdit }: { member: Member; index: number; onEdit: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const config = ROLE_CONFIG[member.role]
  const Icon = config.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03, ease }}
      className="group relative flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 transition-all duration-150 hover:border-white/[0.10] hover:bg-white/[0.04]"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04]">
        <User className="h-3.5 w-3.5 text-white/35" weight="fill" />
      </div>
      <div className="flex-1 min-w-0 py-0.5">
        <p className="text-[12px] font-bold text-white/90 truncate">{member.name}</p>
        <p className="text-[11px] text-white/40 truncate">{member.email}</p>
      </div>
      <div className={`flex items-center justify-center gap-1 rounded-md border px-2 py-0.5 shrink-0 ${BADGE_WIDTH} ${config.bg} ${config.border} ${config.text}`}>
        <Icon className="h-3 w-3" weight="fill" />
        <span className="text-[10px] font-bold truncate">{config.label}</span>
      </div>
      <div className="relative shrink-0 w-6 flex justify-end">
        <button onClick={() => setMenuOpen((v) => !v)} className="cursor-pointer flex h-6 w-6 items-center justify-center rounded text-white/20 opacity-0 group-hover:opacity-100 hover:bg-white/[0.06] hover:text-white/45 transition-all duration-150">
          <DotsThree className="h-3.5 w-3.5" weight="bold" />
        </button>
        <AnimatePresence>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: -2 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -2 }} transition={{ duration: 0.12, ease }} className="absolute right-0 top-full mt-1 z-20 w-32 rounded-lg border border-white/[0.08] bg-[oklch(0.16_0.02_263)] py-0.5 shadow-lg shadow-black/30">
                <button onClick={() => { onEdit(); setMenuOpen(false) }} className="cursor-pointer w-full flex items-center gap-1.5 px-2.5 py-1.5 text-left text-[11px] font-medium text-white/70 hover:bg-white/[0.06] hover:text-white/90 transition-colors">
                  <Pencil className="h-3 w-3" /> Editar
                </button>
                <button onClick={() => setMenuOpen(false)} className="cursor-pointer w-full flex items-center gap-1.5 px-2.5 py-1.5 text-left text-[11px] font-medium text-white/40 hover:bg-rose-500/[0.08] hover:text-rose-400 transition-colors">
                  <Trash className="h-3 w-3" /> Remover
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

function MembersTab() {
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all")
  const filtered = MEMBERS.filter((m) => {
    const matchSearch = !search.trim() || m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === "all" || m.role === roleFilter
    return matchSearch && matchRole
  })
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="cursor-text w-full h-8 pl-8 pr-3 rounded-lg border border-white/[0.06] bg-white/[0.03] text-[12px] text-white/90 placeholder:text-white/22 focus:outline-none focus:ring-1 focus:ring-accent/40 transition-all" />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {(["all", "admin", "profissional", "secretaria"] as const).map((r) => {
            const config = r === "all" ? null : ROLE_CONFIG[r]
            const Icon = config?.icon
            const label = r === "all" ? "Todos" : config!.label
            const active = roleFilter === r
            return (
              <button key={r} onClick={() => setRoleFilter(r)} className={`cursor-pointer flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-bold transition-all duration-150 ${active ? (config ? `${config.bg} ${config.border} ${config.text}` : "bg-white/[0.08] border-white/[0.12] text-white/85") : "border-white/[0.05] bg-white/[0.02] text-white/35 hover:border-white/[0.08] hover:text-white/50"}`}>
                {Icon && <Icon className="h-3 w-3" weight={active ? "fill" : "regular"} />}
                {label}
              </button>
            )
          })}
          <button className="cursor-pointer flex items-center gap-1.5 rounded-lg border border-accent/25 bg-accent/8 px-2.5 py-1.5 text-[11px] font-bold text-accent hover:bg-accent/15 transition-all duration-150">
            <Plus className="h-3 w-3" weight="bold" /> Convidar
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-1 w-full">
        {filtered.length > 0 ? filtered.map((m, i) => <MemberCard key={m.id} member={m} index={i} onEdit={() => {}} />) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.05] bg-white/[0.02] mb-3">
              <Users className="h-4 w-4 text-white/18" weight="duotone" />
            </div>
            <p className="text-[12px] font-bold text-white/40">Nenhum membro encontrado</p>
          </div>
        )}
      </div>
    </motion.div>
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

type PerfilInfo = {
  nome: string
  email: string
  telefone: string
  fotoUrl: string
}

const PERFIL_INITIAL: PerfilInfo = {
  nome: "Bruno Pimentel",
  email: "bruno@clinica.com",
  telefone: "(11) 98765-4321",
  fotoUrl: "",
}

function PerfilTab() {
  const [form, setForm] = useState<PerfilInfo>(PERFIL_INITIAL)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 w-full"
    >
      {/* Foto + Dados — grid em telas grandes */}
      <div className="grid grid-cols-1 xl:grid-cols-[200px_1fr] gap-6 items-start">
        {/* Foto */}
        <div className="rounded-xl border border-border/50 bg-card/30 p-5">
          <div className="flex items-center gap-2 mb-3">
            <User className="h-4 w-4 text-muted-foreground" weight="duotone" />
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Foto</span>
          </div>
          <label className="cursor-pointer flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border bg-muted/20 hover:border-accent/40 hover:bg-accent/5 transition-all overflow-hidden mx-auto">
            {form.fotoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={form.fotoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="h-10 w-10 text-muted-foreground/50" weight="duotone" />
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
          <p className="text-[10px] text-muted-foreground/60 mt-2 text-center">200×200px</p>
        </div>

        {/* Dados pessoais */}
        <div className="rounded-xl border border-border/50 bg-card/30 p-5 space-y-4 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <IdentificationCard className="h-4 w-4 text-muted-foreground" weight="duotone" />
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Dados pessoais</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Nome</label>
              <input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Seu nome"
                className="w-full h-10 rounded-lg border border-border bg-muted/20 px-3 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/40"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="seu@email.com"
                className="w-full h-10 rounded-lg border border-border bg-muted/20 px-3 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/40"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Telefone</label>
              <input
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                placeholder="(11) 98765-4321"
                className="w-full h-10 rounded-lg border border-border bg-muted/20 px-3 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/40"
              />
            </div>
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

// ─── Conexões tab ────────────────────────────────────────────────────────────

function ConexoesTab() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 w-full">
      <motion.a href="#" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="flex items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 transition-all hover:border-emerald-500/30 hover:bg-emerald-500/5 cursor-pointer">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 overflow-hidden">
          <WhatsappLogo className="h-5 w-5 text-emerald-400" weight="fill" />
        </div>
        <div>
          <p className="text-[13px] font-bold text-white/90">WhatsApp</p>
          <p className="text-[11px] text-white/40">Conecte sua conta para atendimentos</p>
        </div>
      </motion.a>
      <motion.a href="#" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="flex items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 transition-all hover:border-accent/30 hover:bg-accent/5 cursor-pointer">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.10] bg-white/[0.04] overflow-hidden p-1.5">
          <Image src="/images/calendar-logo.png" alt="Google Calendar" width={28} height={28} className="object-contain" />
        </div>
        <div>
          <p className="text-[13px] font-bold text-white/90">Google Calendar</p>
          <p className="text-[11px] text-white/40">Sincronize sua agenda</p>
        </div>
      </motion.a>
      <motion.a href="#" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="flex items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 transition-all hover:border-blue-500/30 hover:bg-blue-500/5 cursor-pointer">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.12] bg-white overflow-hidden p-1.5">
          <Image src="/images/asaas-logo.png" alt="ASAAS" width={28} height={28} className="object-contain" />
        </div>
        <div>
          <p className="text-[13px] font-bold text-white/90">ASAAS</p>
          <p className="text-[11px] text-white/40">Cobrança e pagamentos</p>
        </div>
      </motion.a>
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

export default function SettingsPage() {
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
