"use client"

import { useState, useId } from "react"
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
  User,
  Clock,
  Tag,
  WhatsappLogo,
  CurrencyDollar,
  CalendarBlank,
  ArrowRight,
  X,
  FlowArrow,
} from "@phosphor-icons/react"
import { useFunnelStore } from "@/lib/funnel-store"

const ease = [0.33, 1, 0.68, 1] as const

// ─── Types ────────────────────────────────────────────────────────────────────

type CardTag = { label: string; color: string }

type Card = {
  id: string
  name: string
  phone: string
  preview: string
  time: string
  tags: CardTag[]
  value?: string
  paid?: boolean
  hasWhatsapp?: boolean
}

type Column = {
  id: string
  title: string
  color: string        // text color class
  accent: string       // raw CSS color for glow/border
  headerBg: string     // header background class
  dotColor: string     // dot indicator class
  cards: Card[]
}

// ─── Flow type ────────────────────────────────────────────────────────────────

type Flow = {
  id: string
  name: string
  description: string
  columns: Column[]
}

// ─── Flow data ────────────────────────────────────────────────────────────────

const FLOWS: Flow[] = [
  {
    id: "flow-consulta",
    name: "Consulta Particular",
    description: "Do primeiro contato à consulta paga",
    columns: [
      {
        id: "fc1-1",
        title: "Novo contato",
        color: "text-slate-300",
        accent: "oklch(0.65 0.02 263)",
        headerBg: "bg-slate-500/10 border-slate-500/20",
        dotColor: "bg-slate-400",
        cards: [
          { id: "fc1-c1", name: "Ana Costa",     phone: "•••• 0164", preview: "Vim pelo Instagram, quero saber mais", time: "agora",  tags: [{ label: "Instagram", color: "bg-pink-500/15 text-pink-400 border-pink-500/20" }], hasWhatsapp: true },
          { id: "fc1-c2", name: "Thyago Medici", phone: "•••• 0888", preview: "Atende plano de saúde?",               time: "22min", tags: [{ label: "Indicação", color: "bg-violet-500/15 text-violet-400 border-violet-500/20" }], hasWhatsapp: true },
          { id: "fc1-c3", name: "Mariana Lopes", phone: "•••• 2241", preview: "Boa tarde, gostaria de informações",   time: "1h",    tags: [], hasWhatsapp: true },
        ],
      },
      {
        id: "fc1-2",
        title: "Qualificando",
        color: "text-amber-300",
        accent: "oklch(0.75 0.15 85)",
        headerBg: "bg-amber-500/10 border-amber-500/20",
        dotColor: "bg-amber-400",
        cards: [
          { id: "fc1-c4", name: "João Magalhães",  phone: "•••• 4207", preview: "Preciso remarcar para semana que vem", time: "23min", tags: [{ label: "Retorno",   color: "bg-amber-500/15 text-amber-400 border-amber-500/20" }], hasWhatsapp: true },
          { id: "fc1-c5", name: "Gabriel Bonanni", phone: "•••• 5974", preview: "Quero agendar avaliação inicial",     time: "1h",    tags: [{ label: "Avaliação", color: "bg-blue-500/15 text-blue-400 border-blue-500/20" }], value: "R$ 250", hasWhatsapp: true },
        ],
      },
      {
        id: "fc1-3",
        title: "Aguardando Pix",
        color: "text-cyan-300",
        accent: "oklch(0.712 0.126 215.9)",
        headerBg: "bg-cyan-500/10 border-cyan-500/20",
        dotColor: "bg-cyan-400",
        cards: [
          { id: "fc1-c6", name: "Leonardo Ferreira", phone: "•••• 3129", preview: "Pix enviado, aguardando confirmação", time: "3h", tags: [{ label: "Pix pendente", color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20" }], value: "R$ 180", paid: false, hasWhatsapp: true },
        ],
      },
      {
        id: "fc1-4",
        title: "Agendado",
        color: "text-emerald-300",
        accent: "oklch(0.70 0.17 162)",
        headerBg: "bg-emerald-500/10 border-emerald-500/20",
        dotColor: "bg-emerald-400",
        cards: [
          { id: "fc1-c7", name: "Bruno Ita",      phone: "•••• 9661", preview: "Consulta confirmada para segunda",     time: "5h",    tags: [{ label: "Confirmado", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" }], value: "R$ 300", paid: true,  hasWhatsapp: true },
          { id: "fc1-c8", name: "Fernanda Reis",  phone: "•••• 7712", preview: "Tudo certo para quinta-feira às 14h", time: "ontem", tags: [{ label: "Confirmado", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" }], value: "R$ 220", paid: false, hasWhatsapp: true },
        ],
      },
      {
        id: "fc1-5",
        title: "Concluído",
        color: "text-violet-300",
        accent: "oklch(0.65 0.18 290)",
        headerBg: "bg-violet-500/10 border-violet-500/20",
        dotColor: "bg-violet-400",
        cards: [
          { id: "fc1-c9", name: "Rafael Trindade", phone: "•••• 3301", preview: "Consulta realizada com sucesso", time: "ontem", tags: [{ label: "Pago", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" }], value: "R$ 350", paid: true, hasWhatsapp: false },
        ],
      },
    ],
  },
  {
    id: "flow-retorno",
    name: "Retorno",
    description: "Acompanhamento pós-consulta",
    columns: [
      {
        id: "fr-1",
        title: "Pós-consulta",
        color: "text-slate-300",
        accent: "oklch(0.65 0.02 263)",
        headerBg: "bg-slate-500/10 border-slate-500/20",
        dotColor: "bg-slate-400",
        cards: [
          { id: "fr-c1", name: "Paula Mendes",   phone: "•••• 1122", preview: "Consulta realizada ontem, aguardando orientações", time: "1h",    tags: [{ label: "Novo retorno", color: "bg-slate-500/15 text-slate-400 border-slate-500/20" }], hasWhatsapp: true },
          { id: "fr-c2", name: "Carlos Brito",   phone: "•••• 3344", preview: "Ficou com dúvidas sobre a medicação",              time: "3h",    tags: [{ label: "Dúvida",       color: "bg-amber-500/15 text-amber-400 border-amber-500/20"  }], hasWhatsapp: true },
        ],
      },
      {
        id: "fr-2",
        title: "Em acompanhamento",
        color: "text-blue-300",
        accent: "oklch(0.68 0.15 245)",
        headerBg: "bg-blue-500/10 border-blue-500/20",
        dotColor: "bg-blue-400",
        cards: [
          { id: "fr-c3", name: "Lívia Santos",  phone: "•••• 5566", preview: "Seguindo o tratamento, retorno em 15 dias", time: "ontem", tags: [{ label: "Em tratamento", color: "bg-blue-500/15 text-blue-400 border-blue-500/20" }], hasWhatsapp: true },
        ],
      },
      {
        id: "fr-3",
        title: "Reagendando",
        color: "text-amber-300",
        accent: "oklch(0.75 0.15 85)",
        headerBg: "bg-amber-500/10 border-amber-500/20",
        dotColor: "bg-amber-400",
        cards: [
          { id: "fr-c4", name: "Diego Fonseca", phone: "•••• 7788", preview: "Solicitou remarcar para próxima semana", time: "2h", tags: [{ label: "Remarcando", color: "bg-amber-500/15 text-amber-400 border-amber-500/20" }], value: "R$ 180", hasWhatsapp: true },
        ],
      },
      {
        id: "fr-4",
        title: "Alta",
        color: "text-emerald-300",
        accent: "oklch(0.70 0.17 162)",
        headerBg: "bg-emerald-500/10 border-emerald-500/20",
        dotColor: "bg-emerald-400",
        cards: [
          { id: "fr-c5", name: "Tânia Rocha",  phone: "•••• 9900", preview: "Tratamento concluído com sucesso",         time: "ontem", tags: [{ label: "Alta",          color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" }], value: "R$ 200", paid: true, hasWhatsapp: false },
          { id: "fr-c6", name: "Marcus Alves", phone: "•••• 1234", preview: "Paciente liberado, exames dentro do normal", time: "2d",   tags: [{ label: "Alta",          color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" }], value: "R$ 180", paid: true, hasWhatsapp: false },
        ],
      },
    ],
  },
  {
    id: "flow-plano",
    name: "Convênio",
    description: "Atendimentos via plano de saúde",
    columns: [
      {
        id: "fp-1",
        title: "Solicitação",
        color: "text-slate-300",
        accent: "oklch(0.65 0.02 263)",
        headerBg: "bg-slate-500/10 border-slate-500/20",
        dotColor: "bg-slate-400",
        cards: [
          { id: "fp-c1", name: "Beatriz Lima",  phone: "•••• 2233", preview: "Tem Unimed, precisa de encaminhamento", time: "10min", tags: [{ label: "Unimed",   color: "bg-blue-500/15 text-blue-400 border-blue-500/20"   }], hasWhatsapp: true },
          { id: "fp-c2", name: "Renato Costa",  phone: "•••• 4455", preview: "Plano SulAmérica, consulta de rotina",  time: "1h",   tags: [{ label: "SulAmérica", color: "bg-rose-500/15 text-rose-400 border-rose-500/20" }], hasWhatsapp: true },
        ],
      },
      {
        id: "fp-2",
        title: "Validando plano",
        color: "text-amber-300",
        accent: "oklch(0.75 0.15 85)",
        headerBg: "bg-amber-500/10 border-amber-500/20",
        dotColor: "bg-amber-400",
        cards: [
          { id: "fp-c3", name: "Sônia Barros",  phone: "•••• 6677", preview: "Aguardando confirmação de cobertura", time: "4h", tags: [{ label: "Verificando", color: "bg-amber-500/15 text-amber-400 border-amber-500/20" }], hasWhatsapp: true },
        ],
      },
      {
        id: "fp-3",
        title: "Agendado",
        color: "text-emerald-300",
        accent: "oklch(0.70 0.17 162)",
        headerBg: "bg-emerald-500/10 border-emerald-500/20",
        dotColor: "bg-emerald-400",
        cards: [
          { id: "fp-c4", name: "Jorge Pinheiro", phone: "•••• 8899", preview: "Consulta marcada para amanhã 10h", time: "ontem", tags: [{ label: "Confirmado", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" }], hasWhatsapp: true },
        ],
      },
      {
        id: "fp-4",
        title: "Concluído",
        color: "text-violet-300",
        accent: "oklch(0.65 0.18 290)",
        headerBg: "bg-violet-500/10 border-violet-500/20",
        dotColor: "bg-violet-400",
        cards: [
          { id: "fp-c5", name: "Helena Cruz",  phone: "•••• 0011", preview: "Atendimento realizado, TISS enviado", time: "ontem", tags: [{ label: "TISS enviado", color: "bg-violet-500/15 text-violet-400 border-violet-500/20" }], hasWhatsapp: false },
        ],
      },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseValue(v: string | undefined): number {
  if (!v) return 0
  return parseFloat(v.replace(/[^\d,]/g, "").replace(",", ".")) || 0
}

function formatBRL(n: number): string {
  return "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// ─── Card component ───────────────────────────────────────────────────────────

function KanbanCard({
  card,
  isDragging = false,
  overlay = false,
}: {
  card: Card
  isDragging?: boolean
  overlay?: boolean
}) {
  const initials = card.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
  const avatarColors = [
    "bg-accent/20 text-accent",
    "bg-violet-500/20 text-violet-400",
    "bg-emerald-500/20 text-emerald-400",
    "bg-rose-500/20 text-rose-400",
    "bg-amber-500/20 text-amber-400",
  ]
  const avatarColor = avatarColors[card.name.charCodeAt(0) % avatarColors.length]

  return (
    <div
      className={`group rounded-xl border bg-card px-3.5 py-3 flex flex-col gap-2.5 cursor-grab active:cursor-grabbing select-none transition-all duration-200 ${
        overlay
          ? "border-accent/40 shadow-[0_8px_40px_0_oklch(0.712_0.126_215.9_/_0.25),0_2px_12px_0_rgba(0,0,0,0.5)] rotate-[1.5deg] scale-[1.04] opacity-98 ring-1 ring-accent/20"
          : isDragging
          ? "border-border/10 opacity-20 scale-[0.98]"
          : "border-border/60 hover:border-border hover:shadow-lg hover:shadow-black/20"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-[11px] font-semibold border border-white/5 ${avatarColor}`}>
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-foreground truncate leading-tight">{card.name}</p>
            <p className="text-[10px] text-muted-foreground/40 font-mono">{card.phone}</p>
          </div>
        </div>
        <button
          className="opacity-0 group-hover:opacity-100 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 transition-all duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <DotsThree className="h-3.5 w-3.5" weight="bold" />
        </button>
      </div>

      {/* Preview */}
      <p className="text-[12px] text-muted-foreground/70 leading-snug line-clamp-2">{card.preview}</p>

      {/* Tags */}
      {card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {card.tags.map((tag) => (
            <span
              key={tag.label}
              className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${tag.color}`}
            >
              {tag.label}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-0.5 border-t border-border/40">
        <div className="flex items-center gap-2">
          {card.hasWhatsapp && (
            <WhatsappLogo className="h-3.5 w-3.5 text-emerald-400/60" weight="fill" />
          )}
          <div className="flex items-center gap-1 text-muted-foreground/40">
            <Clock className="h-3 w-3" />
            <span className="text-[10px]">{card.time}</span>
          </div>
        </div>
        {card.value && (
          <div className="flex items-center gap-1.5">
            {card.paid !== undefined && (
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${
                card.paid
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400/70"
                  : "bg-white/[0.03] border-white/[0.08] text-white/20"
              }`}>
                {card.paid ? "Pago" : "Pendente"}
              </span>
            )}
            <div className="flex items-center gap-1 text-emerald-400/80">
              <CurrencyDollar className="h-3 w-3" />
              <span className="text-[10px] font-medium tabular-nums">{card.value.replace("R$ ", "")}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Draggable card wrapper ───────────────────────────────────────────────────

function DraggableCard({ card }: { card: Card }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: card.id })

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} suppressHydrationWarning>
      <KanbanCard card={card} isDragging={isDragging} />
    </div>
  )
}

// ─── Droppable column ─────────────────────────────────────────────────────────

function KanbanColumn({
  column,
  isOver,
}: {
  column: Column
  isOver: boolean
}) {
  const { setNodeRef } = useDroppable({ id: column.id })

  const total = column.cards.reduce((s, c) => s + parseValue(c.value), 0)

  return (
    <div className="flex flex-col h-full">
      {/* Column header — colored pill style */}
      <div className={`flex items-center justify-between rounded-xl border px-3 py-2 mb-2.5 shrink-0 ${column.headerBg}`}>
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${column.dotColor}`} />
          <span className={`text-[12px] font-semibold ${column.color}`}>{column.title}</span>
          <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-black/20 px-1.5 text-[10px] font-medium text-white/50">
            {column.cards.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {total > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-400/70 tabular-nums">
              <CurrencyDollar className="h-2.5 w-2.5" />
              {formatBRL(total).replace("R$ ", "")}
            </span>
          )}
          <button className="flex h-5 w-5 items-center justify-center rounded-md text-white/20 hover:text-white/60 hover:bg-white/10 transition-colors duration-150">
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Drop zone wrapper — overflow visible so scale+glow can bleed out */}
      <div className="flex-1 overflow-y-auto overflow-x-visible min-h-0">
        <motion.div
          ref={setNodeRef}
          animate={isOver ? { scale: 1.02 } : { scale: 1 }}
          transition={{ duration: 0.2, ease }}
          style={isOver ? {
            boxShadow: `0 0 0 2px ${column.accent}55, 0 0 32px 0 ${column.accent}30`,
          } : {}}
          className={`flex flex-col gap-2.5 rounded-xl p-2 pb-3 min-h-[80px] relative transition-colors duration-200 ${
            isOver ? "bg-white/[0.03]" : "bg-muted/[0.06]"
          }`}
        >
          {/* Pulsing tinted overlay */}
          <AnimatePresence>
            {isOver && (
              <motion.div
                key="glow-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                className="pointer-events-none absolute inset-0 rounded-xl"
                style={{ background: `${column.accent}0d` }}
              />
            )}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {column.cards.map((card) => (
              <motion.div
                key={card.id}
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2, ease }}
              >
                <DraggableCard card={card} />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Empty drop hint */}
          {column.cards.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-10 transition-colors duration-200"
              style={isOver ? {
                borderColor: `${column.accent}80`,
                background: `${column.accent}08`,
              } : { borderColor: "oklch(1 0 0 / 8%)" }}
            >
              <motion.div
                animate={isOver ? { scale: [1, 1.18, 1] } : { scale: 1 }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowRight
                  className="h-4 w-4 transition-colors duration-200"
                  style={{ color: isOver ? column.accent : "oklch(1 0 0 / 20%)" }}
                />
              </motion.div>
              <p className="text-[11px] transition-colors duration-200"
                style={{ color: isOver ? `${column.accent}99` : "oklch(1 0 0 / 20%)" }}>
                Solte aqui
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

// ─── Mobile column (accordion, no drag) ──────────────────────────────────────

function MobileColumn({ column, isOver }: { column: Column; isOver: boolean }) {
  const [open, setOpen] = useState(true)
  const total = column.cards.reduce((s, c) => s + parseValue(c.value), 0)

  return (
    <div className="rounded-xl border border-border/40 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between px-3 py-2.5 border-b border-border/30 ${column.headerBg}`}
      >
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${column.dotColor}`} />
          <span className={`text-[12px] font-semibold ${column.color}`}>{column.title}</span>
          <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-black/20 px-1.5 text-[10px] font-medium text-white/50">
            {column.cards.length}
          </span>
          {total > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-400/70 tabular-nums">
              <CurrencyDollar className="h-2.5 w-2.5" />
              {formatBRL(total).replace("R$ ", "")}
            </span>
          )}
        </div>
        <motion.div
          animate={{ rotate: open ? 0 : -90 }}
          transition={{ duration: 0.2 }}
        >
          <Plus className="h-3.5 w-3.5 text-white/30 rotate-45" />
        </motion.div>
      </button>

      {/* Cards */}
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
              {column.cards.length === 0 ? (
                <p className="text-center text-[11px] text-muted-foreground/30 py-4">
                  Nenhum contato nesta etapa
                </p>
              ) : (
                column.cards.map((card) => (
                  <KanbanCard key={card.id} card={card} />
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
  const [activeFlowId, setActiveFlowId] = useState(FLOWS[0].id)
  const [flowData, setFlowData] = useState<Record<string, Column[]>>(
    () => Object.fromEntries(FLOWS.map((f) => [f.id, f.columns]))
  )
  const [activeCard, setActiveCard] = useState<Card | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const dndId = useId()
  const openBuilder = useFunnelStore((s) => s.openBuilder)

  const columns = flowData[activeFlowId] ?? []
  const activeFlow = FLOWS.find((f) => f.id === activeFlowId)!

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  function findColumnOfCard(cardId: string): Column | undefined {
    return columns.find((col) => col.cards.some((c) => c.id === cardId))
  }

  function handleDragStart({ active }: DragStartEvent) {
    const col = findColumnOfCard(String(active.id))
    const card = col?.cards.find((c) => c.id === active.id)
    setActiveCard(card ?? null)
  }

  function handleDragOver({ over }: DragOverEvent) {
    setOverId(over ? String(over.id) : null)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveCard(null)
    setOverId(null)
    if (!over) return

    const sourceCol = findColumnOfCard(String(active.id))
    if (!sourceCol) return

    const targetColId = columns.find((c) => c.id === over.id)
      ? String(over.id)
      : findColumnOfCard(String(over.id))?.id

    if (!targetColId || sourceCol.id === targetColId) return

    setFlowData((prev) => ({
      ...prev,
      [activeFlowId]: prev[activeFlowId].map((col) => {
        if (col.id === sourceCol.id) return { ...col, cards: col.cards.filter((c) => c.id !== active.id) }
        if (col.id === targetColId) {
          const card = sourceCol.cards.find((c) => c.id === active.id)!
          return { ...col, cards: [...col.cards, card] }
        }
        return col
      }),
    }))
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Page header — single row */}
      <div className="flex items-stretch justify-between border-b border-border/50 shrink-0 h-11">

        {/* Flow tabs — left side */}
        <div className="flex items-stretch gap-0 pl-4 overflow-x-auto scrollbar-none">
          {FLOWS.map((flow) => (
            <button
              key={flow.id}
              onClick={() => setActiveFlowId(flow.id)}
              className={`relative shrink-0 flex items-center px-4 h-full text-[12px] font-bold transition-colors duration-150 ${
                activeFlowId === flow.id
                  ? "text-white/90"
                  : "text-white/25 hover:text-white/60"
              }`}
            >
              {activeFlowId === flow.id && (
                <motion.div
                  layoutId="flow-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-accent"
                  transition={{ duration: 0.22, ease }}
                />
              )}
              <span className="relative">{flow.name}</span>
            </button>
          ))}
          <button className="shrink-0 flex items-center px-3 h-full text-[11px] text-white/15 hover:text-white/40 transition-colors duration-150 gap-1">
            <Plus className="h-3 w-3" />
          </button>
        </div>

        {/* Actions — right side */}
        <div className="flex items-center gap-2 pr-4 shrink-0">
          <button
            onClick={() => openBuilder(activeFlowId, activeFlow.name)}
            className="flex h-7 items-center gap-1.5 rounded-lg border border-accent/25 bg-accent/[0.06] px-2.5 text-[12px] font-semibold text-accent/80 hover:text-accent hover:bg-accent/10 hover:border-accent/40 transition-colors duration-150"
          >
            <FlowArrow className="h-3.5 w-3.5" />
            Construtor
          </button>
          <button className="flex h-7 items-center gap-1.5 rounded-lg border border-border bg-card/50 px-2.5 text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors duration-200">
            <Tag className="h-3 w-3" />
            Filtrar
          </button>
          <button className="flex h-7 items-center gap-1.5 rounded-lg bg-accent px-2.5 text-[12px] font-medium text-accent-foreground hover:bg-accent/90 transition-colors duration-200">
            <Plus className="h-3 w-3" />
            Novo fluxo
          </button>
        </div>
      </div>

      {/* Board — Mobile: vertical stack | Desktop: horizontal kanban */}
      <div className="flex-1 overflow-y-auto md:overflow-x-auto md:overflow-y-hidden">
        <DndContext
          id={dndId}
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFlowId}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.22, ease }}
              className="h-full"
            >
              {/* Mobile layout */}
              <div className="flex flex-col gap-5 px-4 py-4 md:hidden">
                {columns.map((col) => (
                  <MobileColumn
                    key={col.id}
                    column={col}
                    isOver={overId === col.id || col.cards.some((c) => c.id === overId && overId !== activeCard?.id)}
                  />
                ))}
              </div>

              {/* Desktop layout */}
              <div className="hidden md:flex gap-0 px-5 pt-4 pb-4 h-full min-w-max">
                {columns.map((col, i) => (
                  <div key={col.id} className="flex shrink-0 h-full overflow-visible">
                    {i > 0 && (
                      <div className="w-px shrink-0 mx-3 self-stretch bg-gradient-to-b from-transparent via-border to-transparent" />
                    )}
                    <div className="w-[268px] flex flex-col h-full overflow-visible">
                      <KanbanColumn
                        column={col}
                        isOver={overId === col.id || col.cards.some((c) => c.id === overId && overId !== activeCard?.id)}
                      />
                    </div>
                  </div>
                ))}
                <button className="flex w-[268px] shrink-0 items-center gap-2 rounded-xl border-2 border-dashed border-border/20 px-4 py-3 text-[12px] text-muted-foreground/30 hover:text-muted-foreground/60 hover:border-border/40 transition-all duration-200 self-start mt-8">
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar etapa
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.33, 1, 0.68, 1)" }}>
            {activeCard ? <KanbanCard card={activeCard} overlay /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}
