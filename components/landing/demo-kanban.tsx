"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useLanguage } from "@/components/providers/language-provider"
import { motion, AnimatePresence, useInView } from "framer-motion"
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

const ease = [0.33, 1, 0.68, 1] as any


const patients = [
  { id: 1, name: "Ana Costa", procedure: "Limpeza", avatar: "AC" },
  { id: 2, name: "Pedro Lima", procedure: "Ortodontia", avatar: "PL" },
  { id: 3, name: "Julia Santos", procedure: "Clareamento", avatar: "JS" },
  { id: 4, name: "Rafael Dias", procedure: "Consulta", avatar: "RD" },
]

type PatientPositions = Record<number, string>

interface AIAction {
  patient: string
  from: string
  to: string
}

// Draggable patient card (only draggable in manual mode)
function PatientCard({ patient, isDragging, manualMode }: { patient: typeof patients[0]; isDragging?: boolean; manualMode: boolean }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: patient.id,
    disabled: !manualMode,
  })

  const style = transform
    ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      zIndex: 50,
    }
    : undefined

  return (
    <motion.div
      ref={setNodeRef}
      {...(manualMode ? { ...attributes, ...listeners } : {})}
      layout="position"
      initial={{ opacity: 0 }}
      animate={{ opacity: isDragging ? 0.4 : 1 }}
      exit={{ opacity: 0 }}
      transition={{
        layout: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.3 },
      }}
      style={style}
      className={`rounded-lg bg-card border border-border p-2.5 shadow-sm transition-all duration-300 touch-none ${manualMode
        ? "cursor-grab active:cursor-grabbing hover:border-accent/20 hover:shadow-md hover:shadow-accent/[0.04]"
        : "cursor-default"
        }`}
    >
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
          <span className="text-[8px] font-semibold text-accent">{patient.avatar}</span>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-medium text-foreground truncate">{patient.name}</p>
          <p className="text-[8px] text-muted-foreground">{patient.procedure}</p>
        </div>
      </div>
    </motion.div>
  )
}

// Drag overlay card
function DragOverlayCard({ patient }: { patient: typeof patients[0] }) {
  return (
    <div className="rounded-lg bg-card/90 backdrop-blur-xl border border-accent/30 p-2.5 shadow-xl shadow-accent/10 rotate-2 scale-105">
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
          <span className="text-[8px] font-semibold text-accent">{patient.avatar}</span>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-medium text-foreground truncate">{patient.name}</p>
          <p className="text-[8px] text-muted-foreground">{patient.procedure}</p>
        </div>
      </div>
    </div>
  )
}

// Droppable column
function KanbanColumn({
  column,
  columnPatients,
  activeId,
  manualMode,
}: {
  column: { id: string; label: string; dot: string }
  columnPatients: typeof patients
  activeId: number | null
  manualMode: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col bg-background rounded-lg p-2 transition-all duration-300 ${isOver && manualMode ? "ring-1 ring-accent/30 bg-accent/[0.03]" : ""
        }`}
    >
      <div className="flex items-center gap-2 mb-3 px-0.5">
        <div className={`h-2 w-2 rounded-full ${column.dot} ${isOver && manualMode ? "animate-pulse" : ""}`} />
        <span className="text-[10px] font-medium text-muted-foreground">{column.label}</span>
        <span className="text-[9px] text-muted-foreground/40 ml-auto tabular-nums">{columnPatients.length}</span>
      </div>
      <div className="flex flex-col gap-1.5 min-h-[150px]">
        <AnimatePresence mode="popLayout">
          {columnPatients.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              isDragging={activeId === patient.id}
              manualMode={manualMode}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

export function DemoKanban() {
  const { t } = useLanguage()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const columns = [
    { id: "novo", label: t.demo.kanbanCols[0], dot: "bg-muted-foreground/40" },
    { id: "agendado", label: t.demo.kanbanCols[1], dot: "bg-blue-500" },
    { id: "pago", label: t.demo.kanbanCols[2], dot: "bg-accent" },
    { id: "confirmado", label: t.demo.kanbanCols[3], dot: "bg-emerald-500" },
  ]
  const [positions, setPositions] = useState<PatientPositions>({
    1: "novo",
    2: "novo",
    3: "novo",
    4: "novo",
  })
  const [currentAction, setCurrentAction] = useState<AIAction | null>(null)
  const [activeId, setActiveId] = useState<number | null>(null)
  const [manualMode, setManualMode] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  )

  // AI automation sequence — only runs when NOT in manual mode
  useEffect(() => {
    if (!isInView || manualMode) return
    let cancelled = false

    const cols = t.demo.kanbanCols
    const sequence: { patient: number; to: string; name: string; fromLabel: string; toLabel: string }[] = [
      { patient: 1, to: "agendado", name: "Ana Costa", fromLabel: cols[0], toLabel: cols[1] },
      { patient: 2, to: "agendado", name: "Pedro Lima", fromLabel: cols[0], toLabel: cols[1] },
      { patient: 1, to: "pago", name: "Ana Costa", fromLabel: cols[1], toLabel: cols[2] },
      { patient: 3, to: "agendado", name: "Julia Santos", fromLabel: cols[0], toLabel: cols[1] },
      { patient: 2, to: "pago", name: "Pedro Lima", fromLabel: cols[1], toLabel: cols[2] },
      { patient: 1, to: "confirmado", name: "Ana Costa", fromLabel: cols[2], toLabel: cols[3] },
      { patient: 3, to: "pago", name: "Julia Santos", fromLabel: cols[1], toLabel: cols[2] },
      { patient: 4, to: "agendado", name: "Rafael Dias", fromLabel: cols[0], toLabel: cols[1] },
      { patient: 2, to: "confirmado", name: "Pedro Lima", fromLabel: cols[2], toLabel: cols[3] },
    ]

    async function runSequence() {
      for (const step of sequence) {
        if (cancelled) return
        setCurrentAction({ patient: step.name, from: step.fromLabel, to: step.toLabel })
        await new Promise((r) => setTimeout(r, 900))
        if (cancelled) return
        setPositions((prev) => ({ ...prev, [step.patient]: step.to }))
        await new Promise((r) => setTimeout(r, 600))
        if (cancelled) return
        setCurrentAction(null)
        await new Promise((r) => setTimeout(r, 800))
      }
    }

    const timer = setTimeout(() => runSequence(), 800)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [isInView, manualMode, t.demo.kanbanCols])

  const handleToggleMode = () => {
    if (!manualMode) {
      // Switching to manual: stop AI and clear action
      setCurrentAction(null)
      setManualMode(true)
    } else {
      // Switching back to AI: reset positions and restart
      setPositions({ 1: "novo", 2: "novo", 3: "novo", 4: "novo" })
      setManualMode(false)
    }
  }

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as number)
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (over && columns.some((c) => c.id === over.id)) {
      const patientId = active.id as number
      const newColumn = over.id as string
      setPositions((prev) => ({ ...prev, [patientId]: newColumn }))
    }
  }, [])

  const handleDragCancel = useCallback(() => {
    setActiveId(null)
  }, [])

  const activePatient = activeId ? patients.find((p) => p.id === activeId) : null

  return (
    <div ref={ref} className="w-full">
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg shadow-foreground/[0.03]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <p className="text-xs font-medium text-foreground">{t.demo.kanbanTitle}</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {manualMode ? (
                <HandGrabbing className="h-3 w-3 text-accent" />
              ) : (
                <Robot className="h-3 w-3 text-accent" />
              )}
              <span className="text-[10px] text-accent font-medium">
                {manualMode ? t.demo.kanbanManual : t.demo.kanbanAI}
              </span>
            </div>
            <button
              onClick={handleToggleMode}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-medium transition-all duration-300 border ${manualMode
                ? "border-accent/30 bg-accent/10 text-accent hover:bg-accent/20"
                : "border-border bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
            >
              {manualMode ? (
                <>
                  <Play className="h-2.5 w-2.5" />
                  {t.demo.kanbanBackAI}
                </>
              ) : (
                <>
                  <HandGrabbing className="h-2.5 w-2.5" />
                  {t.demo.kanbanMoveManual}
                </>
              )}
            </button>
          </div>
        </div>

        {/* AI action toast */}
        <div className="relative h-8 border-b border-border bg-muted/40">
          <AnimatePresence mode="wait">
            {currentAction && !manualMode && (
              <motion.div
                key={`${currentAction.patient}-${currentAction.to}`}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.35, ease }}
                className="absolute inset-0 flex items-center justify-center gap-2 px-4"
              >
                <Sparkle className="h-3 w-3 text-accent" />
                <span className="text-[10px] text-muted-foreground">
                  <span className="font-medium text-foreground">{currentAction.patient}</span>
                  {" "}{t.demo.kanbanAction} <span className="font-medium text-accent">{currentAction.to}</span> ✓
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          {(!currentAction || manualMode) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] text-muted-foreground/60">
                {manualMode ? t.demo.kanbanDrag : t.demo.kanbanIdle}
              </span>
            </div>
          )}
        </div>

        {/* Kanban columns with DnD */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="grid grid-cols-4 gap-px bg-border p-3">
            {columns.map((col) => {
              const colPatients = patients.filter((p) => positions[p.id] === col.id)
              return (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  columnPatients={colPatients}
                  activeId={activeId}
                  manualMode={manualMode}
                />
              )
            })}
          </div>

          <DragOverlay dropAnimation={{
            duration: 300,
            easing: "cubic-bezier(0.33, 1, 0.68, 1)",
          }}>
            {activePatient ? <DragOverlayCard patient={activePatient} /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}
