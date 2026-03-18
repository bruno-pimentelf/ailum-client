"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FlowArrow, X, CaretRight, Check, Warning } from "@phosphor-icons/react"
import { funnelsApi } from "@/lib/api/funnels"
import type { BoardContact, FunnelListItem } from "@/lib/api/funnels"

const ease = [0.33, 1, 0.68, 1] as const

interface MoveContactModalProps {
  open: boolean
  onClose: () => void
  contact: BoardContact | null
  currentFunnelId: string | null
  currentStageId: string | null
  funnels: FunnelListItem[]
  onSuccess?: () => void
}

export function MoveContactModal({
  open,
  onClose,
  contact,
  currentFunnelId,
  currentStageId,
  funnels,
  onSuccess,
}: MoveContactModalProps) {
  const [moving, setMoving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const name = contact?.name ?? contact?.phone ?? "Contato"

  async function handleSelectStage(stageId: string, funnelId: string) {
    if (!contact) return
    if (stageId === currentStageId && funnelId === currentFunnelId) return

    setError(null)
    setMoving(true)
    try {
      await funnelsApi.moveContact(contact.id, stageId, funnelId)
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao mover contato")
    } finally {
      setMoving(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.25, ease }}
            className="fixed inset-x-4 sm:inset-x-8 top-[10vh] z-50 mx-auto max-w-md rounded-2xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl shadow-black/20 overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
                  <FlowArrow className="h-5 w-5 text-accent" weight="duotone" />
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-foreground">
                    Mover para outro funil
                  </h2>
                  <p className="text-[12px] text-muted-foreground truncate max-w-[240px]" title={name}>
                    {name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/85 hover:text-foreground hover:bg-muted/40 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
              <p className="text-[12px] text-muted-foreground mb-4">
                Escolha o funil e a etapa de destino. O contato sairá do funil atual.
              </p>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/[0.08] px-3.5 py-2.5"
                  >
                    <Warning className="h-4 w-4 text-rose-400 shrink-0" weight="fill" />
                    <p className="text-[12px] text-rose-400">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col gap-4">
                {funnels.map((funnel, fi) => (
                  <motion.div
                    key={funnel.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: fi * 0.03 }}
                    className="rounded-xl border border-border/50 bg-muted/5 overflow-hidden"
                  >
                    <div className="px-4 py-2.5 border-b border-border/30 bg-muted/10">
                      <p className="text-[12px] font-semibold text-foreground">
                        {funnel.name}
                      </p>
                      {funnel.description && (
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {funnel.description}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col">
                      {funnel.stages
                        .sort((a, b) => a.order - b.order)
                        .map((stage) => {
                          const isCurrent =
                            funnel.id === currentFunnelId && stage.id === currentStageId
                          const isDisabled = moving
                          return (
                            <button
                              key={stage.id}
                              type="button"
                              onClick={() => handleSelectStage(stage.id, funnel.id)}
                              disabled={isDisabled}
                              className={`flex items-center gap-3 w-full px-4 py-3 text-left transition-colors ${
                                isCurrent
                                  ? "bg-accent/10 border-l-2 border-accent cursor-default"
                                  : "hover:bg-muted/20 active:bg-muted/30 disabled:opacity-50"
                              }`}
                            >
                              <span
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ background: stage.color }}
                              />
                              <span className="flex-1 text-[13px] font-medium text-foreground truncate">
                                {stage.name}
                              </span>
                              {isCurrent && (
                                <span className="flex items-center gap-1 text-[11px] text-accent font-medium shrink-0">
                                  <Check className="h-3.5 w-3.5" weight="bold" />
                                  aqui
                                </span>
                              )}
                              {!isCurrent && (
                                <CaretRight className="h-4 w-4 text-muted-foreground/90 shrink-0" />
                              )}
                            </button>
                          )
                        })}
                    </div>
                  </motion.div>
                ))}
              </div>

              {funnels.length === 0 && (
                <div className="py-8 text-center">
                  <FlowArrow className="h-10 w-10 text-muted-foreground/85 mx-auto mb-2" weight="duotone" />
                  <p className="text-[13px] text-muted-foreground">
                    Nenhum outro funil disponível
                  </p>
                  <p className="text-[11px] text-muted-foreground/85 mt-1">
                    Crie um funil para mover contatos entre fluxos
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
