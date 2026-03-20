"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useLanguage } from "@/components/providers/language-provider"
import { motion, useInView, LayoutGroup, AnimatePresence } from "framer-motion"
import { Robot, Sparkle, HandGrabbing, Play } from "@phosphor-icons/react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import { useDraggable, useDroppable } from "@dnd-kit/core"

const CARD_SPRING = { type: "spring" as const, stiffness: 280, damping: 26, mass: 0.85 }
const FAST_EASE = [0.33, 1, 0.68, 1] as const

const patients = [
  { id: 1, name: "Ana Costa",    procedure: "Limpeza",      avatar: "AC" },
  { id: 2, name: "Pedro Lima",   procedure: "Ortodontia",   avatar: "PL" },
  { id: 3, name: "Julia Santos", procedure: "Clareamento",  avatar: "JS" },
  { id: 4, name: "Rafael Dias",  procedure: "Consulta",     avatar: "RD" },
]

const INITIAL_POSITIONS: Record<number, string> = { 1: "novo", 2: "novo", 3: "novo", 4: "novo" }

// ─── Patient card ─────────────────────────────────────────────────────────────

function PatientCard({
  patient,
  isAiLifting,
  manualMode,
}: {
  patient: typeof patients[0]
  isAiLifting: boolean
  manualMode: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: patient.id,
    disabled: !manualMode,
  })

  // In manual mode, dnd-kit owns the transform. In AI mode, layoutId owns it.
  const dndStyle = manualMode && transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <motion.div
      ref={setNodeRef}
      {...(manualMode ? { ...attributes, ...listeners } : {})}
      layoutId={manualMode ? undefined : `kanban-card-${patient.id}`}
      layout="position"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{
        opacity: isDragging ? 0.2 : 1,
        scale: isAiLifting ? 1.07 : 1,
        rotate: isAiLifting ? 2.5 : 0,
        y: isAiLifting ? -8 : 0,
      }}
      transition={{
        layout: CARD_SPRING,
        opacity: { duration: 0.15 },
        scale: { duration: 0.28, ease: FAST_EASE },
        rotate: { duration: 0.28, ease: FAST_EASE },
        y: { duration: 0.28, ease: FAST_EASE },
      }}
      style={{
        ...dndStyle,
        boxShadow: isAiLifting
          ? "0 24px 52px -8px rgba(0,181,212,0.35), 0 10px 22px rgba(0,0,0,0.45)"
          : undefined,
        position: "relative",
        zIndex: isAiLifting ? 20 : undefined,
      }}
      className={`rounded-lg bg-card border p-2.5 touch-none select-none transition-colors duration-200 ${
        isAiLifting
          ? "border-accent/50 bg-card/95"
          : "border-border"
      } ${manualMode ? "cursor-grab active:cursor-grabbing hover:border-accent/20" : "cursor-default"}`}
    >
      <div className="flex items-center gap-2">
        <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${
          isAiLifting ? "bg-accent/25 ring-1 ring-accent/30" : "bg-accent/10"
        }`}>
          <span className="text-[8px] font-semibold text-accent">{patient.avatar}</span>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-medium text-foreground truncate">{patient.name}</p>
          <p className="text-[8px] text-muted-foreground truncate">{patient.procedure}</p>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Drag overlay (manual mode) ───────────────────────────────────────────────

function DragOverlayCard({ patient }: { patient: typeof patients[0] }) {
  return (
    <div className="rounded-lg bg-card/90 backdrop-blur-xl border border-accent/30 p-2.5 shadow-2xl shadow-accent/20 rotate-2 scale-[1.07]">
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
          <span className="text-[8px] font-semibold text-accent">{patient.avatar}</span>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-medium text-foreground truncate">{patient.name}</p>
          <p className="text-[8px] text-muted-foreground truncate">{patient.procedure}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Kanban column ────────────────────────────────────────────────────────────

function KanbanColumn({
  column,
  columnPatients,
  dndActiveId,
  manualMode,
  aiLiftingId,
}: {
  column: { id: string; label: string; dot: string }
  columnPatients: typeof patients
  dndActiveId: number | null
  manualMode: boolean
  aiLiftingId: number | null
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-xl border p-2 transition-all duration-300 ${
        isOver && manualMode
          ? "border-accent/40 bg-accent/[0.04] shadow-[0_0_20px_rgba(0,181,212,0.08)]"
          : "border-border/50 bg-background/60"
      }`}
    >
      {/* Column header */}
      <div className="flex items-center gap-1.5 mb-2 px-0.5 shrink-0">
        <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${column.dot} transition-all duration-300 ${
          isOver && manualMode ? "animate-pulse scale-125" : ""
        }`} />
        <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/75 truncate">
          {column.label}
        </span>
        <motion.span
          key={columnPatients.length}
          initial={{ scale: 1.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="ml-auto text-[9px] text-muted-foreground/50 tabular-nums font-mono shrink-0"
        >
          {columnPatients.length}
        </motion.span>
      </div>

      {/* Cards — fixed height prevents layout jumping */}
      <div className="flex flex-col gap-1.5 h-[212px] overflow-visible">
        {columnPatients.map((patient) => (
          <PatientCard
            key={patient.id}
            patient={patient}
            isAiLifting={aiLiftingId === patient.id}
            manualMode={manualMode}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DemoKanban() {
  const { t } = useLanguage()
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: false, margin: "-80px" })

  const columns = [
    { id: "novo",       label: t.demo.kanbanCols[0], dot: "bg-muted-foreground/50" },
    { id: "agendado",   label: t.demo.kanbanCols[1], dot: "bg-blue-500" },
    { id: "pago",       label: t.demo.kanbanCols[2], dot: "bg-accent" },
    { id: "confirmado", label: t.demo.kanbanCols[3], dot: "bg-emerald-500" },
  ]

  const [positions,   setPositions]   = useState<Record<number, string>>({ ...INITIAL_POSITIONS })
  const [currentAction, setCurrentAction] = useState<{ patient: string; to: string } | null>(null)
  const [aiLiftingId, setAiLiftingId] = useState<number | null>(null)
  const [dndActiveId, setDndActiveId] = useState<number | null>(null)
  const [manualMode,  setManualMode]  = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  // ── AI animation loop ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!isInView || manualMode) return
    let cancelled = false

    const cols = t.demo.kanbanCols
    const sequence: { patientId: number; to: string; name: string; toLabel: string }[] = [
      { patientId: 1, to: "agendado",   name: "Ana Costa",    toLabel: cols[1] },
      { patientId: 2, to: "agendado",   name: "Pedro Lima",   toLabel: cols[1] },
      { patientId: 1, to: "pago",       name: "Ana Costa",    toLabel: cols[2] },
      { patientId: 3, to: "agendado",   name: "Julia Santos", toLabel: cols[1] },
      { patientId: 2, to: "pago",       name: "Pedro Lima",   toLabel: cols[2] },
      { patientId: 1, to: "confirmado", name: "Ana Costa",    toLabel: cols[3] },
      { patientId: 4, to: "agendado",   name: "Rafael Dias",  toLabel: cols[1] },
      { patientId: 3, to: "pago",       name: "Julia Santos", toLabel: cols[2] },
      { patientId: 2, to: "confirmado", name: "Pedro Lima",   toLabel: cols[3] },
    ]

    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

    async function run() {
      await sleep(500)

      while (!cancelled) {
        // Reset to initial state
        setPositions({ ...INITIAL_POSITIONS })
        setCurrentAction(null)
        setAiLiftingId(null)
        await sleep(1000)
        if (cancelled || manualMode) return

        for (const step of sequence) {
          if (cancelled || manualMode) return

          // 1. Show AI action banner
          setCurrentAction({ patient: step.name, to: step.toLabel })
          await sleep(380)
          if (cancelled || manualMode) return

          // 2. Lift the card — visual pickup cue
          setAiLiftingId(step.patientId)
          await sleep(520)
          if (cancelled || manualMode) return

          // 3. Move to new column — layoutId FLIP animates the card flying across
          setPositions((prev) => ({ ...prev, [step.patientId]: step.to }))
          await sleep(680)
          if (cancelled || manualMode) return

          // 4. Land — remove lifting state
          setAiLiftingId(null)
          await sleep(260)
          if (cancelled || manualMode) return

          // 5. Clear banner and pause before next
          setCurrentAction(null)
          await sleep(520)
        }

        // Pause at end before looping
        await sleep(2200)
      }
    }

    run()
    return () => { cancelled = true }
  }, [isInView, manualMode, t.demo.kanbanCols])

  // ── Manual DnD handlers ────────────────────────────────────────────────────

  const handleToggleMode = () => {
    if (!manualMode) {
      setCurrentAction(null)
      setAiLiftingId(null)
      setManualMode(true)
    } else {
      setPositions({ ...INITIAL_POSITIONS })
      setManualMode(false)
    }
  }

  const handleDragStart = useCallback((e: DragStartEvent) => {
    setDndActiveId(e.active.id as number)
  }, [])

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    const { active, over } = e
    setDndActiveId(null)
    if (over && columns.some((c) => c.id === over.id)) {
      setPositions((prev) => ({ ...prev, [active.id as number]: over.id as string }))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDragCancel = useCallback(() => setDndActiveId(null), [])

  const dndActivePatient = dndActiveId ? patients.find((p) => p.id === dndActiveId) : null

  return (
    <div ref={ref} className="w-full">
      <div className="rounded-2xl border border-border bg-card shadow-lg shadow-foreground/[0.03]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5 sm:px-4">
          <p className="text-xs font-medium text-foreground">{t.demo.kanbanTitle}</p>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5">
              {manualMode
                ? <HandGrabbing className="h-3 w-3 text-accent" />
                : <Robot className="h-3 w-3 text-accent" />
              }
              <span className="hidden sm:inline text-[9px] text-accent font-medium">
                {manualMode ? t.demo.kanbanManual : t.demo.kanbanAI}
              </span>
            </div>
            <button
              onClick={handleToggleMode}
              className={`rounded-md border px-2 py-1 text-[9px] font-medium transition-all duration-300 flex items-center gap-1 ${
                manualMode
                  ? "border-accent/30 bg-accent/10 text-accent hover:bg-accent/20"
                  : "border-border bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
              }`}
            >
              {manualMode ? (
                <><Play className="h-2.5 w-2.5" />{t.demo.kanbanBackAI}</>
              ) : (
                <><HandGrabbing className="h-2.5 w-2.5" />{t.demo.kanbanMoveManual}</>
              )}
            </button>
          </div>
        </div>

        {/* AI action banner — fixed height, no layout shift */}
        <div className="relative h-8 border-b border-border/50 bg-muted/30 overflow-hidden">
          <AnimatePresence mode="wait">
            {currentAction && !manualMode ? (
              <motion.div
                key={`${currentAction.patient}-${currentAction.to}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.25, ease: FAST_EASE }}
                className="absolute inset-0 flex items-center justify-center gap-1.5 px-3"
              >
                <Sparkle className="h-3 w-3 text-accent shrink-0" />
                <span className="text-[10px] text-muted-foreground truncate">
                  <span className="font-semibold text-foreground">{currentAction.patient}</span>
                  {" → "}
                  <span className="font-semibold text-accent">{currentAction.to}</span>
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <span className="text-[10px] text-muted-foreground/50">
                  {manualMode ? t.demo.kanbanDrag : t.demo.kanbanIdle}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Kanban board */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <LayoutGroup>
            <div className="grid grid-cols-2 gap-1.5 bg-muted/15 p-2 sm:grid-cols-4 sm:gap-2 sm:p-3">
              {columns.map((col) => (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  columnPatients={patients.filter((p) => positions[p.id] === col.id)}
                  dndActiveId={dndActiveId}
                  manualMode={manualMode}
                  aiLiftingId={aiLiftingId}
                />
              ))}
            </div>
          </LayoutGroup>

          <DragOverlay dropAnimation={{ duration: 280, easing: "cubic-bezier(0.33,1,0.68,1)" }}>
            {dndActivePatient ? <DragOverlayCard patient={dndActivePatient} /> : null}
          </DragOverlay>
        </DndContext>

      </div>
    </div>
  )
}
