"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { UserPlus, X, Check, Warning } from "@phosphor-icons/react"
import { useCreateContact } from "@/hooks/use-contacts-list"

const inputCls =
  "w-full h-10 rounded-xl border border-border/60 bg-muted/20 px-3.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"

export function NewContactModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [phone, setPhone] = useState("")
  const [name, setName] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const create = useCreateContact()

  useEffect(() => {
    if (open) {
      setPhone("")
      setName("")
      setNotes("")
      setError(null)
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = phone.trim().replace(/\D/g, "")
    if (trimmed.length < 8) {
      setError("Informe um telefone válido (mínimo 8 dígitos, ex: 5511999999999).")
      return
    }
    setError(null)
    try {
      await create.mutateAsync({
        phone: trimmed,
        name: name.trim() || undefined,
        notes: notes.trim() || undefined,
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
            className="fixed inset-x-4 top-[8vh] z-50 mx-auto max-w-lg rounded-2xl border border-border/60 bg-overlay shadow-2xl shadow-foreground/10 overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 border border-accent/20">
                  <UserPlus className="h-4 w-4 text-accent" weight="duotone" />
                </div>
                <h2 className="text-[14px] font-semibold text-foreground">Novo contato</h2>
              </div>
              <button
                onClick={onClose}
                className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/85 hover:text-foreground hover:bg-muted/40 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-3">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground/90 uppercase tracking-wider mb-1.5">
                  Telefone com DDI *
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
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground/90 uppercase tracking-wider mb-1.5">
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
                <label className="block text-[10px] font-bold text-muted-foreground/90 uppercase tracking-wider mb-1.5">
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
                  className="cursor-pointer flex-1 rounded-xl border border-border/60 py-2.5 text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={create.isPending}
                  className="cursor-pointer flex-1 flex items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-[13px] font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-60"
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
                  {create.isPending ? "Criando..." : "Criar contato"}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
