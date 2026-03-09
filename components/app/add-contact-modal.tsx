"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { UserPlus, X, Check, Warning } from "@phosphor-icons/react"
import { useCreateContact } from "@/hooks/use-contacts-list"
import type { BoardStage } from "@/lib/api/funnels"

const inputCls =
  "w-full h-10 rounded-xl border border-border/60 bg-muted/20 px-3.5 text-[13px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"

export function AddContactModal({
  open,
  onClose,
  stage,
  funnelId,
}: {
  open: boolean
  onClose: () => void
  stage: BoardStage
  funnelId: string
}) {
  const [phone, setPhone] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const create = useCreateContact()

  useEffect(() => {
    if (open) {
      setPhone("")
      setName("")
      setEmail("")
      setNotes("")
      setError(null)
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = phone.trim().replace(/\D/g, "")
    if (trimmed.length < 8) {
      setError("Informe um telefone válido (mínimo 8 dígitos, use DDI ex: 5511999999999).")
      return
    }
    setError(null)
    try {
      await create.mutateAsync({
        phone: trimmed,
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
        funnelId,
        stageId: stage.id,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar contato. O telefone pode já estar em uso.")
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
            className="fixed inset-x-4 top-[15vh] z-50 mx-auto max-w-md rounded-2xl border border-border/60 bg-[oklch(0.14_0.02_263)] shadow-2xl shadow-black/60 overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 border border-accent/20">
                  <UserPlus className="h-4 w-4 text-accent" weight="duotone" />
                </div>
                <div>
                  <h2 className="text-[14px] font-semibold text-foreground">Adicionar contato</h2>
                  <p className="text-[11px] text-muted-foreground/60">em {stage.name}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-3">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-1.5">
                  Telefone *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="5511999999999"
                  autoFocus
                  className={inputCls}
                  autoComplete="tel"
                />
                <p className="text-[10px] text-muted-foreground/40 mt-0.5">Use DDI (ex: 5511999999999)</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-1.5">
                  Nome
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do contato"
                  className={inputCls}
                  autoComplete="name"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-1.5">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className={inputCls}
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-1.5">
                  Observações
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas opcionais"
                  rows={2}
                  className={`${inputCls} min-h-[60px] py-2.5 resize-none`}
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-2 rounded-xl border border-rose-500/25 bg-rose-500/[0.08] px-3.5 py-2.5"
                  >
                    <Warning className="h-4 w-4 text-rose-400 shrink-0 mt-px" weight="fill" />
                    <p className="text-[12px] text-rose-400">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="cursor-pointer flex-1 rounded-xl border border-border/60 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={create.isPending}
                  className="cursor-pointer flex-1 flex items-center justify-center gap-2 rounded-xl bg-accent py-2 text-[13px] font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-60"
                >
                  {create.isPending ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                      className="h-3.5 w-3.5 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground"
                    />
                  ) : (
                    <Check className="h-3.5 w-3.5" weight="bold" />
                  )}
                  {create.isPending ? "Adicionando..." : "Adicionar"}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
