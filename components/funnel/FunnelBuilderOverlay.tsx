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
  Robot,
  Circle,
  Plus,
  Pencil,
  Trash,
  X,
} from "@phosphor-icons/react"
import { useFunnelStore, type Agent } from "@/lib/funnel-store"
import {
  FunnelNode,
  FunnelEdge,
  StatusNodeData,
  TriggerNodeData,
  TriggerType,
  STATUS_COLORS,
  AGENT_COLORS,
  TRIGGER_META,
  DEFAULT_AGENTS,
} from "@/lib/funnel-types"
import { StatusNode } from "@/components/funnel/StatusNode"
import { TriggerNode } from "@/components/funnel/TriggerNode"
import { EmojiButton } from "@/components/ui/emoji-picker"
import { PromptEditor } from "@/components/funnel/PromptEditor"

const nodeTypes: NodeTypes = {
  status:  StatusNode,
  trigger: TriggerNode,
}

const COLOR_CYCLE = ["slate", "amber", "cyan", "emerald", "violet", "rose", "blue"]
const ease = [0.33, 1, 0.68, 1] as const

// ─── Canvas: only status + trigger nodes ─────────────────────────────────────

function buildInitialNodes(): FunnelNode[] {
  const statuses = [
    { id: "s1", label: "Novo contato",   color: "slate",   isStart: true,  x: 80,   y: 120, desc: "Primeiro contato do lead" },
    { id: "s2", label: "Qualificando",   color: "amber",   isStart: false, x: 420,  y: 120, desc: "Entendendo a necessidade" },
    { id: "s3", label: "Aguardando Pix", color: "cyan",    isStart: false, x: 760,  y: 120, desc: "Pix enviado, aguardando pagamento" },
    { id: "s4", label: "Agendado",       color: "emerald", isStart: false, x: 1100, y: 120, desc: "Pagamento confirmado" },
    { id: "s5", label: "Concluído",      color: "violet",  isStart: false, x: 1440, y: 120, desc: "Atendimento realizado", isEnd: true },
  ]

  const triggers: { id: string; x: number; trigger: TriggerType }[] = [
    { id: "t1", x: 80,   trigger: "message_received"  },
    { id: "t2", x: 420,  trigger: "keyword_match"     },
    { id: "t3", x: 760,  trigger: "payment_pending"   },
    { id: "t4", x: 1100, trigger: "payment_confirmed" },
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
      position: { x: t.x, y: 340 },
      data: { triggerType: t.trigger, label: TRIGGER_META[t.trigger].label, config: {} } as TriggerNodeData,
    })),
  ] as FunnelNode[]
}

function buildInitialEdges(): FunnelEdge[] {
  return [
    { id: "e-s1-s2", source: "s1", target: "s2" },
    { id: "e-s2-s3", source: "s2", target: "s3" },
    { id: "e-s3-s4", source: "s3", target: "s4" },
    { id: "e-s4-s5", source: "s4", target: "s5" },
  ].map((e) => ({
    ...e,
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed, color: "rgba(255,255,255,0.15)" },
    style: { stroke: "rgba(255,255,255,0.10)", strokeWidth: 2 },
  }))
}

// ─── Add node panel (bottom of canvas) ───────────────────────────────────────

function AddPanel({ onAddStatus, onAddTrigger }: { onAddStatus: () => void; onAddTrigger: () => void }) {
  return (
    <Panel position="bottom-center">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-card/90 backdrop-blur-md px-4 py-2.5 shadow-xl shadow-black/50 mb-3"
      >
        <span className="text-[10px] font-bold text-white/20 uppercase tracking-wider pr-1">Adicionar</span>
        <button
          onClick={onAddStatus}
          className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[12px] font-semibold text-white/60 hover:text-white/90 hover:bg-white/[0.08] hover:border-white/[0.15] transition-all duration-150"
        >
          <GitFork className="h-3.5 w-3.5 text-white/30" />
          Etapa
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

// ─── Agent editor modal ───────────────────────────────────────────────────────

function AgentEditor({
  agent,
  onSave,
  onClose,
}: {
  agent: Agent | null
  onSave: (a: Agent) => void
  onClose: () => void
}) {
  const isNew = agent === null
  const [form, setForm] = useState<Agent>(
    agent ?? {
      id: `agent-${Date.now()}`,
      name: "Ailum",
      role: "",
      prompt: "",
      color: "violet",
      emoji: "🤖",
    }
  )

  const c = AGENT_COLORS[form.color] ?? AGENT_COLORS.slate

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 12 }}
        transition={{ duration: 0.2, ease }}
        onClick={(e) => e.stopPropagation()}
        className="w-[92vw] max-w-[1000px] h-[85vh] max-h-[720px] rounded-2xl border border-white/[0.10] bg-[oklch(0.155_0.022_263)] shadow-2xl shadow-black/70 flex flex-col overflow-hidden"
      >
        {/* ── Header: tudo editável ──────────────────────────────────── */}
        <div className="flex items-center gap-4 px-5 py-3 border-b border-white/[0.07] shrink-0 flex-wrap">
          <EmojiButton value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e })} />
          <input
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            placeholder="Papel / função (ex: Qualificador)"
            className="cursor-text flex-1 min-w-[160px] h-9 rounded-lg border border-white/[0.10] bg-white/[0.04] px-3 text-[13px] font-bold text-white/90 placeholder:text-white/30 placeholder:font-medium focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
          <div className="flex items-center gap-1">
            {Object.entries(AGENT_COLORS).map(([key, cl]) => (
              <button
                key={key}
                onClick={() => setForm({ ...form, color: key })}
                title={key}
                className={`cursor-pointer h-5 w-5 rounded-full border-2 transition-all ${cl.dot} ${
                  form.color === key ? "border-white/60 scale-110" : "border-transparent opacity-50 hover:opacity-80"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-1 ml-auto">
            {DEFAULT_AGENTS.map((tmpl) => {
              const tc = AGENT_COLORS[tmpl.color] ?? AGENT_COLORS.slate
              return (
                <button
                  key={tmpl.id}
                  onClick={() =>
                    setForm({
                      ...form,
                      emoji: tmpl.emoji,
                      role: tmpl.role,
                      prompt: tmpl.prompt,
                      color: tmpl.color,
                    })
                  }
                  className={`cursor-pointer flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-all duration-150 ${tc.bg} ${tc.border} ${tc.text} hover:opacity-90`}
                >
                  <span>{tmpl.emoji}</span>
                  <span>{tmpl.role}</span>
                </button>
              )
            })}
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-all duration-150 shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Body: só o editor ──────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-h-0 px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Prompt do agente</span>
            <span className="text-[10px] text-white/25"><kbd className="rounded px-1 py-0.5 border border-white/[0.12] bg-white/[0.04] font-mono text-[9px]">/</kbd> comandos</span>
          </div>
          <div className="flex-1 min-h-0 flex flex-col">
            <PromptEditor value={form.prompt} onChange={(v) => setForm({ ...form, prompt: v })} />
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.07] shrink-0">
          <div className={`flex items-center gap-2 text-[11px] font-semibold ${c.text}`}>
            <span className="text-lg">{form.emoji}</span>
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${c.bg} ${c.border} ${c.text}`}>
              {form.role || "Sem função"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="cursor-pointer px-4 py-2 rounded-xl text-[12px] font-semibold text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-all duration-150"
            >
              Cancelar
            </button>
            <button
              onClick={() => { onSave(form); onClose() }}
              className="cursor-pointer flex items-center gap-1.5 px-5 py-2 rounded-xl bg-accent text-[13px] font-bold text-accent-foreground hover:bg-accent/90 transition-all duration-150 shadow-lg shadow-accent/20"
            >
              <Check className="h-3.5 w-3.5" weight="bold" />
              {isNew ? "Criar agente" : "Salvar alterações"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Agents side panel (fixed, outside canvas) ────────────────────────────────

function AgentsSidePanel({
  agents,
  onAdd,
  onEdit,
  onDelete,
}: {
  agents: Agent[]
  onAdd: () => void
  onEdit: (a: Agent) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="w-[260px] shrink-0 border-l border-border/50 flex flex-col bg-background/60 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-2">
          <Robot className="h-3.5 w-3.5 text-violet-400" weight="fill" />
          <span className="text-[12px] font-black text-white/80">Agentes do funil</span>
          <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white/[0.06] px-1.5 text-[9px] font-bold text-white/40">
            {agents.length}
          </span>
        </div>
        <button
          onClick={onAdd}
          className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 transition-colors"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {/* Info blurb */}
      <div className="px-4 py-2.5 border-b border-border/30">
        <p className="text-[10px] text-white/25 leading-relaxed">
          Cada agente cuida de uma parte da conversa. No prompt, defina quais status ele pode avançar o lead e quando.
        </p>
      </div>

      {/* Agent list */}
      <div className="flex-1 overflow-y-auto py-2 px-2 flex flex-col gap-1.5">
        <AnimatePresence initial={false}>
          {agents.map((agent, i) => {
            const c = AGENT_COLORS[agent.color] ?? AGENT_COLORS.slate
            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12, height: 0 }}
                transition={{ duration: 0.18, ease }}
                className={`group rounded-xl border p-3 flex flex-col gap-2 ${c.bg} ${c.border}`}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[16px] shrink-0">{agent.emoji}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[13px] font-black text-white/92 truncate">{agent.name}</p>
                      </div>
                      <p className={`text-[11px] font-bold ${c.text} truncate`}>{agent.role || "Sem função definida"}</p>
                    </div>
                  </div>
                  {/* Step indicator */}
                  <span className="text-[9px] font-bold text-white/20 shrink-0 mt-0.5">#{i + 1}</span>
                </div>

                {/* Prompt preview */}
                {agent.prompt ? (
                  <p className="text-[10px] text-white/45 leading-relaxed line-clamp-2">{agent.prompt.replace(/<[^>]*>/g, "")}</p>
                ) : (
                  <p className="text-[10px] text-white/20 italic">Prompt não configurado</p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <button
                    onClick={() => onEdit(agent)}
                    className="cursor-pointer flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold text-white/50 hover:text-white/90 hover:bg-white/[0.08] transition-all"
                  >
                    <Pencil className="h-2.5 w-2.5" />
                    Editar prompt
                  </button>
                  <button
                    onClick={() => onDelete(agent.id)}
                    className="cursor-pointer flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold text-white/25 hover:text-rose-400 hover:bg-rose-500/[0.06] transition-all ml-auto"
                  >
                    <Trash className="h-2.5 w-2.5" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {agents.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.03]">
              <Robot className="h-5 w-5 text-white/15" weight="fill" />
            </div>
            <p className="text-[11px] text-white/25">Nenhum agente neste funil</p>
            <button
              onClick={onAdd}
              className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-violet-500/20 bg-violet-500/[0.06] px-3 py-1.5 text-[11px] font-semibold text-violet-400/70 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
            >
              <Plus className="h-3 w-3" />
              Adicionar agente
            </button>
          </div>
        )}
      </div>

      {/* Templates footer */}
      <div className="px-3 py-2.5 border-t border-border/40 shrink-0">
        <p className="text-[9px] font-bold text-white/15 uppercase tracking-wider mb-2">Templates</p>
        <div className="flex flex-wrap gap-1">
          {DEFAULT_AGENTS.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => onAdd()}
              title={tmpl.role}
              className="cursor-pointer flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] text-white/40 hover:border-white/[0.14] hover:text-white/70 transition-all"
            >
              <span>{tmpl.emoji}</span>
              <span>{tmpl.role}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Builder inner ─────────────────────────────────────────────────────────────

function BuilderInner({ flowId, flowName }: { flowId: string; flowName: string }) {
  const { closeBuilder, globalActiveFlowId, setGlobalActiveFlow } = useFunnelStore()
  const [saved, setSaved] = useState(false)
  const colorIdx = useRef(2)

  // Canvas nodes (status + trigger only)
  const [nodes, setNodes, onNodesChange] = useNodesState<FunnelNode>(buildInitialNodes())
  const [edges, setEdges, onEdgesChange] = useEdgesState<FunnelEdge>(buildInitialEdges())

  // Agents belong to the funnel, not to nodes
  const [agents, setAgents] = useState<Agent[]>(DEFAULT_AGENTS.slice(0, 3))
  const [editingAgent, setEditingAgent] = useState<Agent | null | "new">(null)

  const isActive = globalActiveFlowId === flowId

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed, color: "rgba(255,255,255,0.15)" },
            style: { stroke: "rgba(255,255,255,0.10)", strokeWidth: 2 },
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
        position: { x: 200 + Math.random() * 600, y: 80 + Math.random() * 160 },
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
        position: { x: 200 + Math.random() * 600, y: 330 + Math.random() * 100 },
        data: { triggerType: "message_received" as TriggerType, label: TRIGGER_META.message_received.label, config: {} } as TriggerNodeData,
      } as FunnelNode,
    ])
  }, [setNodes])

  const saveAgent = useCallback((a: Agent) => {
    setAgents((prev) => {
      const exists = prev.find((x) => x.id === a.id)
      return exists ? prev.map((x) => (x.id === a.id ? a : x)) : [...prev, a]
    })
  }, [])

  const deleteAgent = useCallback((id: string) => {
    setAgents((prev) => prev.filter((a) => a.id !== id))
  }, [])

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
            <span className="text-[12px] font-semibold text-white/50">{flowName}</span>
          </div>
          <div className="h-4 w-px bg-border/40 mx-1" />
          {isActive ? (
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/[0.08] px-2.5 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400">Fluxo ativo</span>
            </div>
          ) : (
            <button
              onClick={() => setGlobalActiveFlow(flowId)}
              className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-0.5 hover:border-emerald-500/30 hover:bg-emerald-500/[0.06] transition-all duration-200 group"
            >
              <Circle className="h-2.5 w-2.5 text-white/20 group-hover:text-emerald-400 transition-colors" />
              <span className="text-[10px] font-semibold text-white/30 group-hover:text-emerald-400 transition-colors">
                Definir como ativo
              </span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-white/20 hidden sm:flex">
            <Robot className="h-3.5 w-3.5 text-violet-400/60" weight="fill" />
            <span className="tabular-nums">{agents.length} agentes</span>
            <span className="text-white/10 mx-0.5">·</span>
            <GitFork className="h-3 w-3 text-white/20" />
            <span className="tabular-nums">{nodes.filter((n) => n.type === "status").length} etapas</span>
          </div>
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

      {/* Body: canvas + agents panel */}
      <div className="flex flex-1 min-h-0">
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
            minZoom={0.2}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={22}
              size={1.2}
              color="rgba(255,255,255,0.04)"
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
              maskColor="rgba(0,0,0,0.75)"
              className="!bg-card !border !border-border/60 !rounded-xl !overflow-hidden"
            />
            <AddPanel onAddStatus={addStatus} onAddTrigger={addTrigger} />
          </ReactFlow>
        </div>

        {/* Agents side panel */}
        <AgentsSidePanel
          agents={agents}
          onAdd={() => setEditingAgent("new")}
          onEdit={(a) => setEditingAgent(a)}
          onDelete={deleteAgent}
        />
      </div>

      {/* Agent editor modal */}
      <AnimatePresence>
        {editingAgent !== null && (
          <AgentEditor
            agent={editingAgent === "new" ? null : editingAgent}
            onSave={saveAgent}
            onClose={() => setEditingAgent(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function FunnelBuilderOverlay() {
  const { activeFlowId, activeFlowName } = useFunnelStore()

  return (
    <ReactFlowProvider>
      <BuilderInner
        flowId={activeFlowId ?? ""}
        flowName={activeFlowName ?? "Novo Fluxo"}
      />
    </ReactFlowProvider>
  )
}
