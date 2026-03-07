"use client"

import { useCallback, useRef, useState } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type NodeTypes,
  BackgroundVariant,
  MarkerType,
  Panel,
  ReactFlowProvider,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  Lightning,
  FlowArrow,
  Check,
  GitFork,
} from "@phosphor-icons/react"
import { useFunnelStore } from "@/lib/funnel-store"
import {
  FunnelNode,
  FunnelEdge,
  StatusNodeData,
  TriggerNodeData,
  TriggerType,
  STATUS_COLORS,
  TRIGGER_META,
} from "@/lib/funnel-types"
import { StatusNode } from "@/components/funnel/StatusNode"
import { TriggerNode } from "@/components/funnel/TriggerNode"

const nodeTypes: NodeTypes = {
  status: StatusNode,
  trigger: TriggerNode,
}

const COLOR_CYCLE = ["slate", "amber", "cyan", "emerald", "violet", "rose", "blue"]

function buildInitialNodes(flowName: string): FunnelNode[] {
  const statuses = [
    { id: "s1", label: "Novo contato",   color: "slate",   isStart: true,  x: 80,   y: 180, desc: "Primeiro contato do lead" },
    { id: "s2", label: "Qualificando",   color: "amber",   isStart: false, x: 440,  y: 180, desc: "Entendendo a necessidade" },
    { id: "s3", label: "Aguardando Pix", color: "cyan",    isStart: false, x: 800,  y: 180, desc: "Pix enviado, aguardando pagamento" },
    { id: "s4", label: "Agendado",       color: "emerald", isStart: false, x: 1160, y: 180, desc: "Pagamento confirmado" },
    { id: "s5", label: "Concluído",      color: "violet",  isStart: false, x: 1520, y: 180, desc: "Atendimento realizado", isEnd: true },
  ]

  const triggers: { id: string; x: number; trigger: TriggerType }[] = [
    { id: "t1", x: 80,   trigger: "message_received"  },
    { id: "t2", x: 440,  trigger: "keyword_match"     },
    { id: "t3", x: 800,  trigger: "payment_pending"   },
    { id: "t4", x: 1160, trigger: "payment_confirmed" },
  ]

  return [
    ...statuses.map((s) => ({
      id: s.id,
      type: "status" as const,
      position: { x: s.x, y: s.y },
      data: { label: s.label, color: s.color, description: s.desc, isStart: s.isStart, isEnd: s.isEnd ?? false } as StatusNodeData,
    })),
    ...triggers.map((t) => ({
      id: t.id,
      type: "trigger" as const,
      position: { x: t.x, y: 360 },
      data: { triggerType: t.trigger, label: TRIGGER_META[t.trigger].label, config: {} } as TriggerNodeData,
    })),
  ] as FunnelNode[]
}

function buildInitialEdges(): FunnelEdge[] {
  const base: FunnelEdge[] = [
    { id: "e-s1-s2", source: "s1", target: "s2" },
    { id: "e-s2-s3", source: "s2", target: "s3" },
    { id: "e-s3-s4", source: "s3", target: "s4" },
    { id: "e-s4-s5", source: "s4", target: "s5" },
    { id: "e-s1-t1", source: "s1", target: "t1" },
    { id: "e-s2-t2", source: "s2", target: "t2" },
    { id: "e-s3-t3", source: "s3", target: "t3" },
    { id: "e-s4-t4", source: "s4", target: "t4" },
  ]
  return base.map((e) => ({
    ...e,
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed, color: "rgba(255,255,255,0.15)" },
    style: { stroke: "rgba(255,255,255,0.10)", strokeWidth: 1.5 },
  }))
}

function AddPanel({ onAddStatus, onAddTrigger }: { onAddStatus: () => void; onAddTrigger: () => void }) {
  return (
    <Panel position="bottom-center">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-card/90 backdrop-blur-md px-4 py-2.5 shadow-xl shadow-black/50 mb-4"
      >
        <span className="text-[10px] font-bold text-white/20 uppercase tracking-wider pr-1">Adicionar</span>
        <button
          onClick={onAddStatus}
          className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[12px] font-semibold text-white/60 hover:text-white/90 hover:bg-white/[0.08] hover:border-white/[0.15] transition-all duration-150"
        >
          <GitFork className="h-3.5 w-3.5 text-white/30" />
          Status
        </button>
        <button
          onClick={onAddTrigger}
          className="flex items-center gap-2 rounded-xl border border-accent/20 bg-accent/[0.06] px-3 py-1.5 text-[12px] font-semibold text-accent/70 hover:text-accent hover:bg-accent/10 hover:border-accent/40 transition-all duration-150"
        >
          <Lightning className="h-3.5 w-3.5" weight="fill" />
          Trigger
        </button>
      </motion.div>
    </Panel>
  )
}

function BuilderInner({ flowName }: { flowName: string }) {
  const closeBuilder = useFunnelStore((s) => s.closeBuilder)
  const [saved, setSaved] = useState(false)
  const colorIdx = useRef(2)

  const [nodes, setNodes, onNodesChange] = useNodesState<FunnelNode>(buildInitialNodes(flowName))
  const [edges, setEdges, onEdgesChange] = useEdgesState<FunnelEdge>(buildInitialEdges())

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed, color: "rgba(255,255,255,0.15)" },
            style: { stroke: "rgba(255,255,255,0.10)", strokeWidth: 1.5 },
          },
          eds
        )
      ),
    [setEdges]
  )

  const addStatus = useCallback(() => {
    const color = COLOR_CYCLE[colorIdx.current % COLOR_CYCLE.length]
    colorIdx.current++
    setNodes((nds) => [
      ...nds,
      {
        id: `status-${Date.now()}`,
        type: "status",
        position: { x: 120 + Math.random() * 600, y: 80 + Math.random() * 200 },
        data: { label: "Novo status", color, description: "", isStart: false, isEnd: false } as StatusNodeData,
      } as FunnelNode,
    ])
  }, [setNodes])

  const addTrigger = useCallback(() => {
    setNodes((nds) => [
      ...nds,
      {
        id: `trigger-${Date.now()}`,
        type: "trigger",
        position: { x: 120 + Math.random() * 600, y: 360 + Math.random() * 100 },
        data: { triggerType: "message_received" as TriggerType, label: TRIGGER_META.message_received.label, config: {} } as TriggerNodeData,
      } as FunnelNode,
    ])
  }, [setNodes])

  const handleSave = useCallback(() => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2200)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 h-12 border-b border-border/50 shrink-0 bg-background/98 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={closeBuilder}
            className="flex items-center gap-2 text-[12px] font-medium text-white/35 hover:text-white/75 transition-colors duration-150 group"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-150 group-hover:-translate-x-0.5" />
            Voltar
          </button>
          <div className="h-4 w-px bg-border/50" />
          <div className="flex items-center gap-2">
            <FlowArrow className="h-4 w-4 text-accent" weight="fill" />
            <span className="text-[13px] font-bold text-white/90">Construtor de funis</span>
            <span className="text-[11px] text-white/20">·</span>
            <span className="text-[12px] font-semibold text-white/45">{flowName}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-white/20 tabular-nums hidden sm:block">
            {nodes.length} nós · {edges.length} conexões
          </span>
          <button
            onClick={handleSave}
            className="flex h-7 min-w-[72px] items-center justify-center gap-1.5 rounded-lg bg-accent px-3 text-[12px] font-semibold text-accent-foreground hover:bg-accent/90 transition-colors duration-150"
          >
            <AnimatePresence mode="wait">
              {saved ? (
                <motion.span key="saved" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1">
                  <Check className="h-3 w-3" weight="bold" /> Salvo
                </motion.span>
              ) : (
                <motion.span key="save" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                  Salvar
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.25}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={22}
            size={1.2}
            color="rgba(255,255,255,0.045)"
          />
          <Controls
            showInteractive={false}
            className="[&>button]:!bg-card [&>button]:!border-border/60 [&>button]:!text-white/40 [&>button:hover]:!bg-muted [&>button:hover]:!text-white/80 [&>button]:!fill-white/40 [&>button:hover]:!fill-white/80"
          />
          <MiniMap
            nodeColor={(n) => {
              if (n.type === "trigger") return "oklch(0.712 0.126 215.9)"
              const d = n.data as StatusNodeData
              return STATUS_COLORS[d.color]?.accent ?? "#64748b"
            }}
            maskColor="rgba(0,0,0,0.72)"
            className="!bg-card !border !border-border/60 !rounded-xl !overflow-hidden"
          />
          <AddPanel onAddStatus={addStatus} onAddTrigger={addTrigger} />
        </ReactFlow>
      </div>
    </motion.div>
  )
}

export default function FunnelBuilderOverlay() {
  const { activeFlowName } = useFunnelStore()

  return (
    <ReactFlowProvider>
      <BuilderInner flowName={activeFlowName ?? "Novo Fluxo"} />
    </ReactFlowProvider>
  )
}
