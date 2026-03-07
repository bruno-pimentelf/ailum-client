"use client"

import { memo, useState, useCallback } from "react"
import { Handle, Position, NodeProps, Node, useReactFlow } from "@xyflow/react"
import { motion, AnimatePresence } from "framer-motion"
import {
  DotsSix,
  Pencil,
  Check,
  X,
  ArrowRight,
  Flag,
  FlagCheckered,
} from "@phosphor-icons/react"
import { StatusNodeData, STATUS_COLORS } from "@/lib/funnel-types"

type StatusNodeProps = NodeProps<Node<StatusNodeData, "status">>

export const StatusNode = memo(function StatusNode({
  id,
  data,
  selected,
}: StatusNodeProps) {
  const { setNodes } = useReactFlow()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(data.label)

  const c = STATUS_COLORS[data.color] ?? STATUS_COLORS.slate

  const commitEdit = useCallback(() => {
    if (draft.trim()) {
      setNodes((nodes) =>
        nodes.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, label: draft.trim() } } : n
        )
      )
    }
    setEditing(false)
  }, [id, draft, setNodes])

  const cancelEdit = useCallback(() => {
    setDraft(data.label)
    setEditing(false)
  }, [data.label])

  return (
    <div
      className={`relative rounded-2xl border-2 transition-all duration-200 min-w-[200px] ${c.bg} ${
        selected ? `${c.border} shadow-[0_0_24px_0_${c.accent}30]` : "border-white/[0.08]"
      }`}
      style={selected ? { boxShadow: `0 0 0 2px ${c.accent}55, 0 8px 32px 0 ${c.accent}20` } : {}}
    >
      {/* Incoming handle */}
      {!data.isStart && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !rounded-full !border-2 !border-background"
          style={{ background: c.accent }}
        />
      )}

      {/* Card */}
      <div className="px-4 py-3">
        {/* Header row */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 min-w-0">
            {data.isStart ? (
              <Flag className="h-3.5 w-3.5 shrink-0" style={{ color: c.accent }} weight="fill" />
            ) : data.isEnd ? (
              <FlagCheckered className="h-3.5 w-3.5 shrink-0" style={{ color: c.accent }} weight="fill" />
            ) : (
              <span className={`h-2 w-2 rounded-full shrink-0 ${c.dot}`} />
            )}

            <AnimatePresence mode="wait">
              {editing ? (
                <motion.input
                  key="input"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEdit()
                    if (e.key === "Escape") cancelEdit()
                  }}
                  className="bg-transparent border-b border-white/30 text-[13px] font-bold text-white/90 outline-none w-full min-w-0"
                />
              ) : (
                <motion.span
                  key="label"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`text-[13px] font-bold truncate ${c.text}`}
                >
                  {data.label}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Edit controls */}
          <div className="flex items-center gap-1 shrink-0">
            {editing ? (
              <>
                <button
                  onClick={commitEdit}
                  className="flex h-5 w-5 items-center justify-center rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Check className="h-2.5 w-2.5 text-white/70" />
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex h-5 w-5 items-center justify-center rounded-md hover:bg-white/10 transition-colors"
                >
                  <X className="h-2.5 w-2.5 text-white/30" />
                </button>
              </>
            ) : (
              <button
                onClick={() => { setDraft(data.label); setEditing(true) }}
                className="flex h-5 w-5 items-center justify-center rounded-md text-white/20 hover:text-white/60 hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Pencil className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        {data.description && (
          <p className="text-[11px] text-white/30 leading-snug mt-0.5 pr-1">
            {data.description}
          </p>
        )}

        {/* Labels */}
        <div className="flex items-center gap-1.5 mt-2">
          {data.isStart && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white/10 text-white/30 bg-white/[0.04]">
              início
            </span>
          )}
          {data.isEnd && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white/10 text-white/30 bg-white/[0.04]">
              fim
            </span>
          )}
        </div>
      </div>

      {/* Outgoing handle */}
      {!data.isEnd && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !rounded-full !border-2 !border-background"
          style={{ background: c.accent }}
        />
      )}
    </div>
  )
})
