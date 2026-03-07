"use client"

import { memo, useState, useCallback } from "react"
import { Handle, Position, NodeProps, Node, useReactFlow } from "@xyflow/react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Lightning,
  ChatCircle,
  MagnifyingGlass,
  CurrencyDollar,
  Clock,
  Hand,
  WebhooksLogo,
  Tag,
  CaretDown,
  X,
  Check,
} from "@phosphor-icons/react"
import { TriggerNodeData, TriggerType, TRIGGER_META } from "@/lib/funnel-types"

type TriggerNodeProps = NodeProps<Node<TriggerNodeData, "trigger">>

const TRIGGER_ICONS: Record<TriggerType, React.ElementType> = {
  message_received:  ChatCircle,
  keyword_match:     MagnifyingGlass,
  payment_confirmed: CurrencyDollar,
  payment_pending:   CurrencyDollar,
  time_elapsed:      Clock,
  manual:            Hand,
  webhook:           WebhooksLogo,
  tag_added:         Tag,
}

const TRIGGER_TYPES = Object.keys(TRIGGER_META) as TriggerType[]

export const TriggerNode = memo(function TriggerNode({
  id,
  data,
  selected,
}: TriggerNodeProps) {
  const { setNodes } = useReactFlow()
  const [open, setOpen] = useState(false)

  const Icon = TRIGGER_ICONS[data.triggerType] ?? Lightning
  const meta = TRIGGER_META[data.triggerType]

  const setTrigger = useCallback(
    (type: TriggerType) => {
      setNodes((nodes) =>
        nodes.map((n) =>
          n.id === id
            ? {
                ...n,
                data: {
                  ...n.data,
                  triggerType: type,
                  label: TRIGGER_META[type].label,
                },
              }
            : n
        )
      )
      setOpen(false)
    },
    [id, setNodes]
  )

  return (
    <div
      className={`relative rounded-xl border transition-all duration-200 min-w-[200px] bg-accent/[0.06] ${
        selected
          ? "border-accent/50 shadow-[0_0_0_2px_oklch(0.712_0.126_215.9_/_0.35)]"
          : "border-accent/20"
      }`}
    >
      {/* Incoming handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !rounded-full !border-2 !border-background !bg-accent"
      />

      <div className="px-3.5 py-3">
        {/* Header */}
        <div className="flex items-center gap-2 mb-0.5">
          <Lightning className="h-3.5 w-3.5 text-accent shrink-0" weight="fill" />
          <span className="text-[10px] font-bold text-accent/70 uppercase tracking-wider">Trigger</span>
        </div>

        {/* Trigger selector */}
        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 hover:border-white/[0.15] hover:bg-white/[0.05] transition-all duration-150 group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Icon className="h-3.5 w-3.5 text-accent/80 shrink-0" />
              <span className="text-[12px] font-semibold text-white/80 truncate">{meta.label}</span>
            </div>
            <motion.div
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0"
            >
              <CaretDown className="h-3 w-3 text-white/25" />
            </motion.div>
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-xl border border-border bg-card shadow-xl shadow-black/40 overflow-hidden"
              >
                {TRIGGER_TYPES.map((type) => {
                  const TIcon = TRIGGER_ICONS[type]
                  const active = type === data.triggerType
                  return (
                    <button
                      key={type}
                      onClick={() => setTrigger(type)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors duration-100 ${
                        active
                          ? "bg-accent/10 text-white/90"
                          : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
                      }`}
                    >
                      <TIcon className={`h-3.5 w-3.5 shrink-0 ${active ? "text-accent" : "text-white/30"}`} />
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold leading-tight truncate">{TRIGGER_META[type].label}</p>
                        <p className="text-[10px] text-white/25 leading-tight truncate">{TRIGGER_META[type].description}</p>
                      </div>
                      {active && <Check className="h-3 w-3 text-accent ml-auto shrink-0" />}
                    </button>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Description */}
        <p className="mt-1.5 text-[10px] text-white/25 leading-snug">{meta.description}</p>
      </div>

      {/* Outgoing handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !rounded-full !border-2 !border-background !bg-accent"
      />
    </div>
  )
})
