"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Warning, User, CurrencyDollar, Clock } from "@phosphor-icons/react"
import { useOverdueCharges, type OverdueChargeWithContact } from "@/hooks/use-overdue-charges"
import { ChargeDetailModal } from "./charge-detail-modal"

const ease = [0.33, 1, 0.68, 1] as const

function formatCurrency(v: string | number) {
  const num = typeof v === "string" ? parseFloat(v) : v
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDate(ts: { toDate: () => Date } | null) {
  if (!ts) return "—"
  return ts.toDate().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function getContactName(charge: OverdueChargeWithContact) {
  return charge.contact?.contactName ?? charge.contact?.name ?? "Contato"
}

function daysSinceOverdue(dueAt: { toDate: () => Date } | null) {
  if (!dueAt) return null
  const diff = Date.now() - dueAt.toDate().getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function OverdueChargesTable() {
  const { charges, loading } = useOverdueCharges()
  const [selected, setSelected] = useState<OverdueChargeWithContact | null>(null)

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="rounded-xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden"
      >
        <div className="border-b border-border/50 px-4 py-3 md:px-5 md:py-4">
          <h3 className="text-[14px] font-semibold tracking-tight text-foreground">Inadimplentes</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Cobranças vencidas com link direto para a conversa do paciente
          </p>
        </div>

        <div className="p-4 md:p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-8 w-8 rounded-full border-2 border-accent/30 border-t-accent"
              />
              <p className="text-[13px] text-muted-foreground">Carregando cobranças vencidas…</p>
            </div>
          ) : charges.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20">
                <Warning className="h-7 w-7 text-muted-foreground/85" weight="duotone" />
              </div>
              <div className="text-center">
                <p className="text-[14px] font-medium text-foreground">Nenhuma cobrança vencida</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Todos os pagamentos estão em dia</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-left">
                    <th className="py-3 pr-3">Paciente</th>
                    <th className="py-3 pr-3">Valor</th>
                    <th className="py-3 pr-3">Descrição</th>
                    <th className="py-3 pr-3">Vencimento</th>
                    <th className="py-3">Atraso</th>
                  </tr>
                </thead>
                <tbody>
                  {charges.map((charge) => {
                    const days = daysSinceOverdue(charge.dueAt)
                    return (
                      <tr
                        key={charge.id}
                        onClick={() => setSelected(charge)}
                        className="border-b border-border/30 transition-colors hover:bg-muted/20 cursor-pointer"
                      >
                        <td className="py-2.5 pr-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-full bg-orange-500/[0.08] border border-orange-500/10 flex items-center justify-center shrink-0">
                              <User className="h-3.5 w-3.5 text-orange-400/60" weight="bold" />
                            </div>
                            <span className="font-medium truncate max-w-[160px]">
                              {getContactName(charge)}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 pr-3 font-semibold tabular-nums">
                          {formatCurrency(charge.amount)}
                        </td>
                        <td className="py-2.5 pr-3 text-muted-foreground max-w-[180px]">
                          <span className="block truncate">{charge.description}</span>
                        </td>
                        <td className="py-2.5 pr-3 text-muted-foreground">
                          {formatDate(charge.dueAt)}
                        </td>
                        <td className="py-2.5">
                          {days != null && (
                            <span
                              className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold ${
                                days >= 7
                                  ? "border border-rose-500/20 bg-rose-500/10 text-rose-400"
                                  : days >= 3
                                  ? "border border-orange-500/20 bg-orange-500/10 text-orange-400"
                                  : "border border-amber-500/20 bg-amber-500/10 text-amber-400"
                              }`}
                            >
                              <Clock className="h-3 w-3" />
                              {days === 0 ? "Hoje" : days === 1 ? "1 dia" : `${days} dias`}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {selected && (
          <ChargeDetailModal
            open={!!selected}
            onClose={() => setSelected(null)}
            charge={selected}
          />
        )}
      </AnimatePresence>
    </>
  )
}
