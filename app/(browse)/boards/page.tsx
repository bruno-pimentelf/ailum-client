"use client"

import { useState, useId, useMemo, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core"
import {
  Plus,
  DotsThree,
  Clock,
  WhatsappLogo,
  CurrencyDollar,
  FlowArrow,
  Robot,
  MagnifyingGlass,
  CaretDown,
  ArrowRight,
  ArrowsClockwise,
  Warning,
  PencilSimple,
} from "@phosphor-icons/react"
import { useQueryClient } from "@tanstack/react-query"
import { useFunnelStore } from "@/lib/funnel-store"
import { useFunnels, useBoard, useFunnelMutations } from "@/hooks/use-board"
import { FunnelModal } from "@/components/app/funnel-modal"
import { SelectContactModal } from "@/components/app/select-contact-modal"
import { StageConfigModal } from "@/components/app/stage-config-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import type { BoardContact, BoardStage, FunnelListItem } from "@/lib/api/funnels"

const ease = [0.33, 1, 0.68, 1] as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(iso: string | null): string {
  if (!iso) return ""
  try {
    const date = new Date(iso)
    const diffMs = Date.now() - date.getTime()
    const diffMin = Math.floor(diffMs / 60_000)
    const diffH = Math.floor(diffMs / 3_600_000)
    const diffD = Math.floor(diffMs / 86_400_000)
    if (diffMin < 1) return "agora"
    if (diffMin < 60) return `${diffMin}min`
    if (diffH < 24) return `${diffH}h`
    if (diffD === 1) return "ontem"
    if (diffD < 7) return `${diffD}d`
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
  } catch {
    return ""
  }
}

// Derive a stable accent color from the stage hex color
function stageStyle(hexColor: string) {
  return {
    accent: hexColor,
    headerBg: `${hexColor}18`,
    headerBorder: `${hexColor}30`,
    dot: hexColor,
  }
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, photoUrl }: { name: string; photoUrl?: string | null }) {
  const initials = (name || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
  const colors = [
    "bg-accent/20 text-accent",
    "bg-violet-500/20 text-violet-400",
    "bg-emerald-500/20 text-emerald-400",
    "bg-rose-500/20 text-rose-400",
    "bg-amber-500/20 text-amber-400",
  ]
  const color = colors[(name || "").charCodeAt(0) % colors.length]

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        className="h-7 w-7 shrink-0 rounded-full object-cover border border-white/5"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
      />
    )
  }

  return (
    <div className={`h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-[11px] font-semibold border border-white/5 ${color}`}>
      {initials}
    </div>
  )
}

// ─── Card component ───────────────────────────────────────────────────────────

function KanbanCard({
  contact,
  stageColor,
  isDragging = false,
  overlay = false,
}: {
  contact: BoardContact
  stageColor: string
  isDragging?: boolean
  overlay?: boolean
}) {
  const name = contact.name ?? contact.phone
  const lastMsg = contact.messages[0]
  const time = formatRelativeTime(contact.lastMessageAt ?? contact.messages[0]?.createdAt ?? null)

  return (
    <div
      className={`group rounded-xl border bg-card px-3.5 py-3 flex flex-col gap-2.5 cursor-grab active:cursor-grabbing select-none transition-all duration-200 ${
        overlay
          ? "border-accent/40 shadow-[0_8px_40px_0_oklch(0.712_0.126_215.9_/_0.25),0_2px_12px_0_rgba(0,0,0,0.5)] rotate-[1.5deg] scale-[1.04] ring-1 ring-accent/20"
          : isDragging
          ? "border-border/10 opacity-20 scale-[0.98]"
          : "border-border/60 hover:border-border hover:shadow-lg hover:shadow-black/20"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar name={name} photoUrl={contact.photoUrl} />
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-foreground truncate leading-tight">{name}</p>
            <p className="text-[10px] text-muted-foreground/40 font-mono">{contact.phone}</p>
          </div>
        </div>
        <button
          className="opacity-0 group-hover:opacity-100 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 transition-all duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <DotsThree className="h-3.5 w-3.5" weight="bold" />
        </button>
      </div>

      {/* Last message preview */}
      {lastMsg && (
        <p className="text-[12px] text-muted-foreground/70 leading-snug line-clamp-2">
          {lastMsg.role !== "CONTACT" && (
            <span className="text-muted-foreground/40 mr-1">
              {lastMsg.role === "AGENT" ? "Agente:" : "Você:"}
            </span>
          )}
          {lastMsg.content}
        </p>
      )}

      {/* Status tag */}
      <div className="flex flex-wrap gap-1">
        <span
          className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium"
          style={{
            background: `${stageColor}18`,
            borderColor: `${stageColor}30`,
            color: stageColor,
          }}
        >
          {contact.status.replace(/_/g, " ")}
        </span>
        {contact.assignedProfessional && (
          <span className="inline-flex items-center rounded-md border border-border/40 bg-muted/20 px-1.5 py-0.5 text-[10px] text-muted-foreground/60">
            {contact.assignedProfessional.fullName.split(" ")[0]}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-0.5 border-t border-border/40">
        <div className="flex items-center gap-2">
          <WhatsappLogo className="h-3.5 w-3.5 text-emerald-400/60" weight="fill" />
          {time && (
            <div className="flex items-center gap-1 text-muted-foreground/40">
              <Clock className="h-3 w-3" />
              <span className="text-[10px]">{time}</span>
            </div>
          )}
        </div>
        {contact.lastPaymentStatus && (
          <div className="flex items-center gap-1.5">
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${
              contact.lastPaymentStatus === "PAID"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400/70"
                : "bg-white/[0.03] border-white/[0.08] text-white/20"
            }`}>
              {contact.lastPaymentStatus === "PAID" ? "Pago" : "Pendente"}
            </span>
            <div className="flex items-center gap-1 text-emerald-400/80">
              <CurrencyDollar className="h-3 w-3" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Draggable card wrapper ───────────────────────────────────────────────────

function DraggableCard({ contact, stageColor }: { contact: BoardContact; stageColor: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: contact.id })

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} suppressHydrationWarning>
      <KanbanCard contact={contact} stageColor={stageColor} isDragging={isDragging} />
    </div>
  )
}

// ─── Droppable column ─────────────────────────────────────────────────────────

function KanbanColumn({
  stage,
  contacts,
  isOver,
  funnelId,
  onAddContact,
  onUpdateStageName,
  onOpenConfig,
}: {
  stage: BoardStage
  contacts: BoardContact[]
  isOver: boolean
  funnelId: string
  onAddContact: (stage: BoardStage) => void
  onUpdateStageName: (stage: BoardStage, name: string) => void
  onOpenConfig: (stage: BoardStage) => void
}) {
  const { setNodeRef } = useDroppable({ id: stage.id })
  const style = stageStyle(stage.color)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(stage.name)
  const [optimisticName, setOptimisticName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const displayName = optimisticName ?? stage.name

  useEffect(() => {
    if (editing) {
      setDraft(displayName)
      setOptimisticName(null)
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  useEffect(() => {
    if (optimisticName !== null && stage.name === optimisticName) setOptimisticName(null)
  }, [stage.name, optimisticName])

  function handleBlur() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== displayName) {
      setOptimisticName(trimmed)
      onUpdateStageName(stage, trimmed)
    }
    setEditing(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Column header */}
      <div
        className="flex items-center justify-between rounded-xl border px-3 py-2 mb-2.5 shrink-0"
        style={{ background: style.headerBg, borderColor: style.headerBorder }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: style.dot }} />
          {editing ? (
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur()
                if (e.key === "Escape") { setDraft(displayName); setEditing(false) }
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 min-w-0 rounded-md px-2 py-0.5 text-[12px] font-semibold bg-black/30 border border-white/[0.08] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50 selection:bg-accent/60 selection:text-white"
              style={{ color: stage.color }}
            />
          ) : (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setEditing(true) }}
              className="cursor-pointer text-left flex-1 min-w-0 truncate text-[12px] font-semibold hover:underline decoration-white/30"
              style={{ color: stage.color }}
              title="Clique para editar"
            >
              {displayName}
            </button>
          )}
          <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-black/20 px-1.5 text-[10px] font-medium text-white/50">
            {contacts.length}
          </span>
          {stage.isTerminal && (
            <span className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-wider">final</span>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onOpenConfig(stage) }}
            className="cursor-pointer flex h-5 w-5 items-center justify-center rounded-md text-white/20 hover:text-white/60 hover:bg-white/10 transition-colors duration-150"
            title="Configurar IA"
          >
            <DotsThree className="h-3 w-3" weight="bold" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAddContact(stage) }}
            className="cursor-pointer flex h-5 w-5 items-center justify-center rounded-md text-white/20 hover:text-white/60 hover:bg-white/10 transition-colors duration-150"
            title="Adicionar contato"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Drop zone */}
      <div className="flex-1 overflow-y-auto overflow-x-visible min-h-0">
        <motion.div
          ref={setNodeRef}
          animate={isOver ? { scale: 1.02 } : { scale: 1 }}
          transition={{ duration: 0.2, ease }}
          style={isOver ? {
            boxShadow: `0 0 0 2px ${stage.color}55, 0 0 32px 0 ${stage.color}30`,
          } : {}}
          className={`flex flex-col gap-2.5 rounded-xl p-2 pb-3 min-h-[80px] relative transition-colors duration-200 ${
            isOver ? "bg-white/[0.03]" : "bg-muted/[0.06]"
          }`}
        >
          <AnimatePresence>
            {isOver && (
              <motion.div
                key="glow-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                className="pointer-events-none absolute inset-0 rounded-xl"
                style={{ background: `${stage.color}0d` }}
              />
            )}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {contacts.map((contact) => (
              <motion.div
                key={contact.id}
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2, ease }}
              >
                <DraggableCard contact={contact} stageColor={stage.color} />
              </motion.div>
            ))}
          </AnimatePresence>

          {contacts.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-10 transition-colors duration-200"
              style={isOver ? {
                borderColor: `${stage.color}80`,
                background: `${stage.color}08`,
              } : { borderColor: "oklch(1 0 0 / 8%)" }}
            >
              <motion.div
                animate={isOver ? { scale: [1, 1.18, 1] } : { scale: 1 }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowRight
                  className="h-4 w-4 transition-colors duration-200"
                  style={{ color: isOver ? stage.color : "oklch(1 0 0 / 20%)" }}
                />
              </motion.div>
              <p
                className="text-[11px] transition-colors duration-200"
                style={{ color: isOver ? `${stage.color}99` : "oklch(1 0 0 / 20%)" }}
              >
                Solte aqui
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

// ─── Mobile column ────────────────────────────────────────────────────────────

function MobileColumn({
  stage,
  contacts,
  funnelId,
  onAddContact,
  onUpdateStageName,
  onOpenConfig,
}: {
  stage: BoardStage
  contacts: BoardContact[]
  funnelId: string
  onAddContact: (stage: BoardStage) => void
  onUpdateStageName?: (stage: BoardStage, name: string) => void
  onOpenConfig: (stage: BoardStage) => void
}) {
  const [open, setOpen] = useState(true)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(stage.name)
  const [optimisticName, setOptimisticName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const style = stageStyle(stage.color)
  const displayName = optimisticName ?? stage.name

  useEffect(() => {
    if (editing) {
      setDraft(displayName)
      setOptimisticName(null)
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  useEffect(() => {
    if (optimisticName !== null && stage.name === optimisticName) setOptimisticName(null)
  }, [stage.name, optimisticName])

  function handleBlur() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== displayName && onUpdateStageName) {
      setOptimisticName(trimmed)
      onUpdateStageName(stage, trimmed)
    }
    setEditing(false)
  }

  return (
    <div className="rounded-xl border border-border/40 overflow-hidden">
      <div
        className="w-full flex items-center justify-between px-3 py-2.5 border-b border-border/30"
        style={{ background: style.headerBg }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="cursor-pointer flex-1 flex items-center gap-2 text-left min-w-0"
        >
          <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: style.dot }} />
          {editing && onUpdateStageName ? (
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur()
                if (e.key === "Escape") { setDraft(displayName); setEditing(false) }
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 min-w-0 rounded-md px-2 py-0.5 text-[12px] font-semibold bg-black/30 border border-white/[0.08] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50 selection:bg-accent/60 selection:text-white"
              style={{ color: stage.color }}
            />
          ) : (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onUpdateStageName && setEditing(true) }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onUpdateStageName && setEditing(true) } }}
              className="text-left flex-1 min-w-0 truncate text-[12px] font-semibold hover:underline decoration-white/30 cursor-pointer"
              style={{ color: stage.color }}
            >
              {displayName}
            </span>
          )}
          <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-black/20 px-1.5 text-[10px] font-medium text-white/50">
            {contacts.length}
          </span>
        </button>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onOpenConfig(stage) }}
            className="cursor-pointer flex h-6 w-6 items-center justify-center rounded-md text-white/30 hover:text-white/60 hover:bg-white/10 transition-colors"
            title="Configurar IA"
          >
            <DotsThree className="h-3.5 w-3.5" weight="bold" />
          </button>
          <button
            type="button"
            onClick={() => onAddContact(stage)}
            className="cursor-pointer flex h-6 w-6 items-center justify-center rounded-md text-white/30 hover:text-white/60 hover:bg-white/10 transition-colors"
            title="Adicionar contato"
          >
            <Plus className="h-3.5 w-3.5" weight="bold" />
          </button>
          <motion.div animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.2 }} className="flex h-6 w-6 items-center justify-center">
            <CaretDown className="h-3.5 w-3.5 text-white/30" weight="bold" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2.5 p-3">
              {contacts.length === 0 ? (
                <p className="text-center text-[11px] text-muted-foreground/30 py-4">
                  Nenhum contato nesta etapa
                </p>
              ) : (
                contacts.map((c) => (
                  <KanbanCard key={c.id} contact={c} stageColor={stage.color} />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BoardsPage() {
  const [activeFunnelId, setActiveFunnelId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [activeContact, setActiveContact] = useState<BoardContact | null>(null)
  const [activeStageColor, setActiveStageColor] = useState("#888")
  const [overId, setOverId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingFunnel, setEditingFunnel] = useState<FunnelListItem | undefined>(undefined)
  const [addContactTarget, setAddContactTarget] = useState<{ stage: BoardStage; funnelId: string } | null>(null)
  const [configStage, setConfigStage] = useState<BoardStage | null>(null)
  const dndId = useId()

  const openBuilder = useFunnelStore((s) => s.openBuilder)
  const globalActiveFlowId = useFunnelStore((s) => s.globalActiveFlowId)
  const setGlobalActiveFlow = useFunnelStore((s) => s.setGlobalActiveFlow)

  const { data: funnels, isLoading: funnelsLoading } = useFunnels()

  // Default to first funnel once loaded
  const selectedFunnelId = activeFunnelId ?? funnels?.[0]?.id ?? null

  const { funnel, stages, stageMap, loading: boardLoading, error: boardError, moveContact, refetch } = useBoard(
    selectedFunnelId,
    { search: debouncedSearch || undefined },
  )

  const queryClient = useQueryClient()
  const boardKey = ["board", selectedFunnelId, debouncedSearch || undefined] as const

  const { createStage, updateStage, createDefaultFunnel } = useFunnelMutations()

  async function handleUpdateStageName(s: BoardStage, name: string) {
    if (!selectedFunnelId) return
    await queryClient.cancelQueries({ queryKey: boardKey })
    const prev = queryClient.getQueryData(boardKey) as { stages: BoardStage[]; [k: string]: unknown } | undefined
    queryClient.setQueryData(boardKey, (old: typeof prev) => {
      if (!old) return old
      return {
        ...old,
        stages: old.stages.map((st) => (st.id === s.id ? { ...st, name } : st)),
      }
    })
    try {
      await updateStage.mutateAsync({ stageId: s.id, funnelId: selectedFunnelId, body: { name } })
    } catch {
      queryClient.setQueryData(boardKey, prev)
    }
  }

  async function handleAddStage() {
    if (!selectedFunnelId) return
    const newStage: BoardStage = {
      id: `temp-${Date.now()}`,
      name: "Nova etapa",
      color: "#64748b",
      order: stages.length,
      contacts: [],
      isTerminal: false,
      _count: { contacts: 0 },
    }
    await queryClient.cancelQueries({ queryKey: boardKey })
    const prev = queryClient.getQueryData(boardKey) as { stages: BoardStage[]; [k: string]: unknown } | undefined
    queryClient.setQueryData(boardKey, (old: typeof prev) => {
      if (!old) return old
      return { ...old, stages: [...old.stages, newStage] }
    })
    try {
      await createStage.mutateAsync({
        funnelId: selectedFunnelId,
        body: { name: newStage.name, color: newStage.color, order: newStage.order },
      })
    } catch {
      queryClient.setQueryData(boardKey, prev)
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  function openCreateModal() {
    setEditingFunnel(undefined)
    setModalOpen(true)
  }

  function openEditModal(f: FunnelListItem) {
    setEditingFunnel(f)
    setModalOpen(true)
  }

  // Debounce search → trigger refetch
  const handleSearch = (v: string) => {
    setSearch(v)
    clearTimeout((handleSearch as unknown as { _t: ReturnType<typeof setTimeout> })._t)
    ;(handleSearch as unknown as { _t: ReturnType<typeof setTimeout> })._t = setTimeout(() => {
      setDebouncedSearch(v)
    }, 350)
  }

  function findStageOfContact(contactId: string): string | undefined {
    return stages.find((s) => stageMap[s.id]?.some((c) => c.id === contactId))?.id
  }

  function handleDragStart({ active }: DragStartEvent) {
    const stageId = findStageOfContact(String(active.id))
    const card = stageId ? stageMap[stageId]?.find((c) => c.id === active.id) : undefined
    const color = stages.find((s) => s.id === stageId)?.color ?? "#888"
    setActiveContact(card ?? null)
    setActiveStageColor(color)
  }

  function handleDragOver({ over }: DragOverEvent) {
    setOverId(over ? String(over.id) : null)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveContact(null)
    setOverId(null)
    if (!over) return

    const fromStageId = findStageOfContact(String(active.id))
    if (!fromStageId) return

    // over.id can be a stage id or a card id — resolve to stage
    const toStageId = stages.find((s) => s.id === over.id)
      ? String(over.id)
      : findStageOfContact(String(over.id))

    if (!toStageId || fromStageId === toStageId) return

    moveContact(String(active.id), fromStageId, toStageId)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const isLoading = funnelsLoading || boardLoading

  return (
    <>
    <FunnelModal
      open={modalOpen}
      onClose={() => setModalOpen(false)}
      funnel={editingFunnel}
    />
    <StageConfigModal
      open={!!configStage}
      onClose={() => setConfigStage(null)}
      stage={configStage}
    />
    {addContactTarget && (
      <SelectContactModal
        open={!!addContactTarget}
        onClose={() => setAddContactTarget(null)}
        stage={addContactTarget.stage}
        funnelId={addContactTarget.funnelId}
        contactsInStage={(stageMap[addContactTarget.stage.id] ?? []).map((c) => c.id)}
      />
    )}
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-stretch justify-between border-b border-border/50 shrink-0 h-11">

        {/* Funnel tabs */}
        <div className="flex items-stretch gap-0 pl-4 overflow-x-auto scrollbar-none">
          {funnelsLoading ? (
            <div className="flex items-center px-4 gap-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-3 w-20 rounded bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : (
            funnels?.map((f) => {
              const isGlobalActive = globalActiveFlowId === f.id
              const isActive = selectedFunnelId === f.id
              return (
                <div key={f.id} className="group relative flex items-stretch">
                  <button
                    onClick={() => setActiveFunnelId(f.id)}
                    className={`relative flex items-center gap-2 px-4 h-full text-[12px] font-bold transition-colors duration-150 cursor-pointer ${
                      isActive ? "text-white/90" : "text-white/25 hover:text-white/60"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="flow-tab-indicator"
                        className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-accent"
                        transition={{ duration: 0.22, ease }}
                      />
                    )}
                    {isGlobalActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" title="Fluxo ativo" />
                    )}
                    <span className="relative">{f.name}</span>
                  </button>
                  {/* Edit button — appears on hover */}
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditModal(f) }}
                    className="hidden group-hover:flex h-4 w-4 self-center mr-1 items-center justify-center rounded text-white/20 hover:text-white/60 hover:bg-white/10 transition-colors cursor-pointer"
                    title="Editar funil"
                  >
                    <DotsThree className="h-3.5 w-3.5" weight="bold" />
                  </button>
                </div>
              )
            })
          )}
          {/* Add funnel — template picker */}
          {!funnelsLoading && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-full w-9 shrink-0 items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-colors cursor-pointer"
                  title="Novo funil"
                >
                  <Plus className="h-4 w-4" weight="bold" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={6} className="min-w-[200px]">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Escolha um template
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={async () => {
                    const created = await createDefaultFunnel.mutateAsync()
                    setActiveFunnelId(created.id)
                  }}
                  disabled={createDefaultFunnel.isPending}
                  className="cursor-pointer"
                >
                  {createDefaultFunnel.isPending ? (
                    <ArrowsClockwise className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FlowArrow className="h-3.5 w-3.5" />
                  )}
                  Funil Principal
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={openCreateModal}
                  className="cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Funil em branco
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pr-4 shrink-0">
          {/* Search */}
          <div className="relative hidden sm:block">
            <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/40 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar contato..."
              className="h-7 w-36 rounded-lg bg-muted/30 pl-7 pr-2 text-[11px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/30 focus:w-48 transition-all duration-300"
            />
          </div>

          {/* Refresh */}
          <button
            onClick={() => refetch()}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/50 text-muted-foreground/40 hover:text-foreground hover:bg-muted/40 transition-colors"
            title="Atualizar"
          >
            <ArrowsClockwise className="h-3.5 w-3.5" />
          </button>

          {/* Active flow toggle */}
          {selectedFunnelId && (globalActiveFlowId === selectedFunnelId ? (
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/[0.08] px-2.5 h-7">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400">Fluxo ativo</span>
            </div>
          ) : (
            <button
              onClick={() => selectedFunnelId && setGlobalActiveFlow(selectedFunnelId)}
              className="flex h-7 items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 text-[10px] font-semibold text-white/30 hover:border-emerald-500/30 hover:bg-emerald-500/[0.06] hover:text-emerald-400 transition-all duration-200"
            >
              Definir como ativo
            </button>
          ))}

          {funnel && (
            <button
              onClick={() => openBuilder(funnel.id, funnel.name)}
              className="flex h-7 items-center gap-1.5 rounded-lg border border-accent/25 bg-accent/[0.06] px-2.5 text-[12px] font-semibold text-accent/80 hover:text-accent hover:bg-accent/10 hover:border-accent/40 transition-colors duration-150"
            >
              <FlowArrow className="h-3.5 w-3.5" />
              Construtor
            </button>
          )}
        </div>
      </div>

      {/* ── Board body ── */}
      <div className="flex-1 overflow-y-auto md:overflow-x-auto md:overflow-y-hidden">

        {/* Loading skeleton */}
        {isLoading && (
          <div className="hidden md:flex gap-0 px-5 pt-4 pb-4 h-full">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex shrink-0 h-full overflow-visible">
                {i > 1 && <div className="w-px shrink-0 mx-3 self-stretch bg-gradient-to-b from-transparent via-border to-transparent" />}
                <div className="w-[268px] flex flex-col gap-3">
                  <div className="h-9 rounded-xl bg-muted/20 animate-pulse" />
                  {[1, 2, 3].slice(0, i % 2 === 0 ? 2 : 3).map((j) => (
                    <div key={j} className="h-24 rounded-xl bg-muted/10 animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {boardError && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Warning className="h-8 w-8 text-rose-400/50" weight="duotone" />
            <p className="text-[13px] text-muted-foreground/50">Erro ao carregar o board</p>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            >
              <ArrowsClockwise className="h-3.5 w-3.5" />
              Tentar novamente
            </button>
          </div>
        )}

        {/* Empty (no funnels) */}
        {!isLoading && !boardError && funnels?.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-5 px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 border border-accent/20">
              <FlowArrow className="h-8 w-8 text-accent/50" weight="duotone" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-foreground">Nenhum funil criado ainda</h3>
              <p className="mt-1.5 text-[13px] text-muted-foreground/50 max-w-[300px] leading-relaxed">
                Crie um funil para organizar seus contatos por etapas e acompanhar o progresso de cada atendimento.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => createDefaultFunnel.mutate()}
                disabled={createDefaultFunnel.isPending}
                className="cursor-pointer flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-[13px] font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-60"
              >
                {createDefaultFunnel.isPending ? (
                  <ArrowsClockwise className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Criar Funil Principal
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={openCreateModal}
                className="cursor-pointer flex items-center gap-2 rounded-xl border border-border/60 px-5 py-2.5 text-[13px] font-semibold text-foreground/80 hover:bg-white/[0.04] transition-colors"
              >
                Criar funil personalizado
              </motion.button>
            </div>
          </div>
        )}

        {/* Board */}
        {!isLoading && !boardError && stages.length > 0 && (
          <DndContext
            id={dndId}
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedFunnelId}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.22, ease }}
                className="h-full"
              >
                {/* Mobile */}
                <div className="flex flex-col gap-5 px-4 py-4 md:hidden">
                  {stages.map((stage) => (
                    <MobileColumn
                      key={stage.id}
                      stage={stage}
                      contacts={stageMap[stage.id] ?? []}
                      funnelId={selectedFunnelId!}
                      onAddContact={(s) => setAddContactTarget({ stage: s, funnelId: selectedFunnelId! })}
                      onUpdateStageName={handleUpdateStageName}
                      onOpenConfig={setConfigStage}
                    />
                  ))}
                </div>

                {/* Desktop */}
                <div className="hidden md:flex gap-0 px-5 pt-4 pb-4 h-full min-w-max">
                  {stages.map((stage, i) => (
                    <div key={stage.id} className="flex shrink-0 h-full overflow-visible">
                      {i > 0 && (
                        <div className="w-px shrink-0 mx-3 self-stretch bg-gradient-to-b from-transparent via-border to-transparent" />
                      )}
                      <div className="w-[268px] flex flex-col h-full overflow-visible">
                        <KanbanColumn
                          stage={stage}
                          contacts={stageMap[stage.id] ?? []}
                          funnelId={selectedFunnelId!}
                          onAddContact={(s) => setAddContactTarget({ stage: s, funnelId: selectedFunnelId! })}
                          onUpdateStageName={handleUpdateStageName}
                          onOpenConfig={setConfigStage}
                          isOver={
                            overId === stage.id ||
                            (stageMap[stage.id] ?? []).some(
                              (c) => c.id === overId && overId !== activeContact?.id,
                            )
                          }
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddStage}
                    disabled={createStage.isPending}
                    className="flex w-[268px] shrink-0 items-center gap-2 rounded-xl border-2 border-dashed border-border/20 px-4 py-3 text-[12px] text-muted-foreground/30 hover:text-muted-foreground/60 hover:border-border/40 transition-all duration-200 self-start mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {createStage.isPending ? "Criando..." : "Adicionar etapa"}
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>

            <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.33, 1, 0.68, 1)" }}>
              {activeContact ? (
                <KanbanCard contact={activeContact} stageColor={activeStageColor} overlay />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
    </>
  )
}
