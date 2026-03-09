"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MagnifyingGlass, X, UserCircle, WhatsappLogo, Warning } from "@phosphor-icons/react"
import { useContactsList } from "@/hooks/use-contacts-list"
import { funnelsApi } from "@/lib/api/funnels"
import type { BoardStage } from "@/lib/api/funnels"
import type { ApiContact } from "@/lib/api/contacts"

const inputCls =
  "w-full h-10 rounded-xl border border-border/60 bg-muted/20 px-3.5 pl-9 text-[13px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"

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

export function SelectContactModal({
  open,
  onClose,
  stage,
  funnelId,
  contactsInStage,
}: {
  open: boolean
  onClose: () => void
  stage: BoardStage
  funnelId: string
  contactsInStage: string[]
}) {
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [movingId, setMovingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setSearch("")
      setDebouncedSearch("")
      setMovingId(null)
      setError(null)
    }
  }, [open])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const { data, isLoading } = useContactsList({ search: debouncedSearch || undefined })
  const contacts = (data?.data ?? []).filter((c) => !contactsInStage.includes(c.id))

  async function handleSelect(c: ApiContact) {
    setError(null)
    setMovingId(c.id)
    try {
      await funnelsApi.moveContact(c.id, stage.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao mover contato")
    } finally {
      setMovingId(null)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="bd"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.24, ease: [0.33, 1, 0.68, 1] }}
            className="fixed inset-x-4 top-[12vh] z-50 mx-auto max-w-md rounded-2xl border border-border/60 bg-[oklch(0.14_0.02_263)] shadow-2xl shadow-black/60 overflow-hidden flex flex-col max-h-[75vh]"
          >
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 border border-accent/20">
                  <MagnifyingGlass className="h-4 w-4 text-accent" weight="duotone" />
                </div>
                <div>
                  <h2 className="text-[14px] font-semibold text-foreground">Adicionar à etapa</h2>
                  <p className="text-[11px] text-muted-foreground/60">{stage.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 pt-3 pb-2 shrink-0">
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar contato (nome, email, telefone)"
                  className={inputCls}
                  autoFocus
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mx-5 mb-2 flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/[0.08] px-3.5 py-2.5"
                >
                  <Warning className="h-4 w-4 text-rose-400 shrink-0" weight="fill" />
                  <p className="text-[12px] text-rose-400">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto px-5 pb-4 min-h-0">
              {isLoading ? (
                <div className="flex flex-col gap-2 py-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-14 rounded-xl bg-muted/20 animate-pulse" />
                  ))}
                </div>
              ) : contacts.length === 0 ? (
                <div className="py-12 text-center">
                  <UserCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" weight="duotone" />
                  <p className="text-[12px] text-muted-foreground/50">
                    {search ? "Nenhum contato encontrado" : "Digite para buscar contatos"}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-1 pb-2">
                  {contacts.map((c) => {
                    const name = c.name ?? c.phone
                    const initials = (name || "?").slice(0, 2).toUpperCase()
                    const isMoving = movingId === c.id
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelect(c)}
                        disabled={!!movingId}
                        className="cursor-pointer flex items-center gap-3 rounded-xl border border-border/40 bg-muted/5 px-3 py-2.5 text-left hover:border-accent/30 hover:bg-accent/5 transition-all disabled:opacity-50"
                      >
                        {c.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={c.photoUrl}
                            alt={name}
                            className="h-9 w-9 shrink-0 rounded-full object-cover border border-white/5"
                          />
                        ) : (
                          <div className="h-9 w-9 shrink-0 rounded-full bg-accent/20 text-accent flex items-center justify-center text-[11px] font-bold">
                            {initials}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-foreground truncate">{name}</p>
                          <p className="text-[11px] text-muted-foreground/60 truncate">{c.phone}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <WhatsappLogo className="h-3.5 w-3.5 text-emerald-400/60" weight="fill" />
                          {c.lastMessageAt && (
                            <span className="text-[10px] text-muted-foreground/40">
                              {formatRelativeTime(c.lastMessageAt)}
                            </span>
                          )}
                        </div>
                        {isMoving && (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                            className="h-4 w-4 rounded-full border-2 border-accent/30 border-t-accent shrink-0"
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
