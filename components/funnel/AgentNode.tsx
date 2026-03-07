"use client"

import { memo, useState } from "react"
import { Handle, Position, NodeProps, Node, useReactFlow } from "@xyflow/react"
import { motion, AnimatePresence } from "framer-motion"
import { Robot, Pencil, X, Check, CaretDown } from "@phosphor-icons/react"
import { AgentNodeData, AGENT_COLORS } from "@/lib/funnel-types"
import type { Agent } from "@/lib/funnel-store"

type AgentNodeProps = NodeProps<Node<AgentNodeData, "agent">>

function PromptEditor({
  value,
  onChange,
  onClose,
}: {
  value: string
  onChange: (v: string) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState(value)
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: 4 }}
      transition={{ duration: 0.15 }}
      className="absolute left-0 top-[calc(100%+6px)] z-50 w-[320px] rounded-xl border border-border bg-card shadow-2xl shadow-black/50 p-3 flex flex-col gap-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Prompt do agente</span>
        <button onClick={onClose} className="text-white/25 hover:text-white/60 transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <textarea
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={5}
        className="w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-2 text-[11px] text-white/70 placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-accent/40 leading-relaxed"
        placeholder="Descreva o comportamento deste agente..."
      />
      <button
        onClick={() => { onChange(draft); onClose() }}
        className="flex items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[11px] font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
      >
        <Check className="h-3 w-3" weight="bold" />
        Salvar prompt
      </button>
    </motion.div>
  )
}

export const AgentNode = memo(function AgentNode({
  id,
  data,
  selected,
}: AgentNodeProps) {
  const { setNodes } = useReactFlow()
  const [editingPrompt, setEditingPrompt] = useState(false)
  const agent: Agent = data.agent

  const c = AGENT_COLORS[agent.color] ?? AGENT_COLORS.slate

  const updateAgent = (patch: Partial<Agent>) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === id
          ? { ...n, data: { ...n.data, agent: { ...agent, ...patch } } }
          : n
      )
    )
  }

  return (
    <div
      className={`relative rounded-2xl border-2 transition-all duration-200 min-w-[230px] ${c.bg} ${
        selected ? `${c.border} shadow-lg` : "border-white/[0.06]"
      }`}
    >
      {/* Incoming handle (from status or trigger) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !rounded-full !border-2 !border-background"
        style={{ background: "#a78bfa" }}
      />

      <div className="px-4 py-3.5">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl border text-base ${c.bg} ${c.border}`}>
              {agent.emoji}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-[13px] font-black text-white/90">{agent.name}</p>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${c.bg} ${c.border} ${c.text}`}>
                  {agent.role}
                </span>
              </div>
              <p className="text-[10px] text-white/25 mt-0.5">Subagente · IA</p>
            </div>
          </div>
          <div className={`h-2 w-2 rounded-full ${c.dot} shadow-[0_0_6px_0_currentColor]`} />
        </div>

        {/* Prompt preview */}
        <div className="relative">
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-2">
            <p className="text-[10px] text-white/35 leading-relaxed line-clamp-3">{agent.prompt}</p>
          </div>
          <button
            onClick={() => setEditingPrompt(true)}
            className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-md bg-white/[0.04] hover:bg-white/[0.10] text-white/20 hover:text-white/60 transition-all duration-150"
          >
            <Pencil className="h-2.5 w-2.5" />
          </button>

          <AnimatePresence>
            {editingPrompt && (
              <PromptEditor
                value={agent.prompt}
                onChange={(v) => updateAgent({ prompt: v })}
                onClose={() => setEditingPrompt(false)}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Robot badge */}
        <div className="flex items-center gap-1.5 mt-2.5">
          <Robot className="h-3 w-3 text-white/15" />
          <span className="text-[9px] text-white/20 font-medium">Agente de linguagem</span>
        </div>
      </div>

      {/* Outgoing handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !rounded-full !border-2 !border-background"
        style={{ background: "#a78bfa" }}
      />
    </div>
  )
})
