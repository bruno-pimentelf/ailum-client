"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Repeat, Plus } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { useSubscriptions } from "@/hooks/use-finance"

const CYCLE_LABELS: Record<string, string> = {
  WEEKLY: "Semanal",
  MONTHLY: "Mensal",
  BIMONTHLY: "Bimestral",
  QUARTERLY: "Trimestral",
  SEMIANNUALLY: "Semestral",
  YEARLY: "Anual",
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Ativa",
  INACTIVE: "Inativa",
  EXPIRED: "Expirada",
}

const BILLING_LABELS: Record<string, string> = {
  PIX: "PIX",
  BOLETO: "Boleto",
  CREDIT_CARD: "Cartão",
  UNDEFINED: "—",
}

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

interface SubscriptionsTableProps {
  onCreateClick: () => void
}

export function SubscriptionsTable({ onCreateClick }: SubscriptionsTableProps) {
  const [offset, setOffset] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>("")
  const limit = 20

  const { data, isLoading } = useSubscriptions({
    offset,
    limit,
    status: statusFilter || undefined,
  })

  const subscriptions = data?.data ?? []

  const ease = [0.33, 1, 0.68, 1] as const

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
      className="rounded-xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden"
    >
      <div className="border-b border-border/50 px-4 py-3 md:px-5 md:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-[14px] font-semibold tracking-tight text-foreground">
              Assinaturas
            </h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Cobranças recorrentes por cliente
            </p>
          </div>
          <Button
            size="sm"
            onClick={onCreateClick}
            className="rounded-xl gap-2 shrink-0"
          >
            <Plus className="h-4 w-4" weight="bold" />
            Nova assinatura
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="cursor-pointer rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40"
          >
            <option value="">Todos os status</option>
            <option value="ACTIVE">Ativa</option>
            <option value="INACTIVE">Inativa</option>
            <option value="EXPIRED">Expirada</option>
          </select>
        </div>
      </div>
      <div className="p-4 md:p-5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-8 w-8 rounded-full border-2 border-accent/30 border-t-accent"
            />
            <p className="text-[13px] text-muted-foreground">Carregando assinaturas…</p>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20">
              <Repeat className="h-7 w-7 text-muted-foreground/50" weight="duotone" />
            </div>
            <p className="text-[14px] font-medium text-foreground">
              Nenhuma assinatura
            </p>
            <p className="text-xs text-muted-foreground">
              Crie assinaturas recorrentes para seus clientes
            </p>
            <Button size="sm" onClick={onCreateClick} className="mt-2 rounded-xl gap-2">
              <Plus className="h-4 w-4" weight="bold" />
              Nova assinatura
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-left">
                  <th className="py-3 pr-3">Cliente</th>
                  <th className="py-3 pr-3">Valor</th>
                  <th className="py-3 pr-3">Ciclo</th>
                  <th className="py-3 pr-3">Próximo vencimento</th>
                  <th className="py-3 pr-3">Forma</th>
                  <th className="py-3 pr-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="border-b border-border/30 transition-colors hover:bg-muted/20"
                  >
                    <td className="py-2.5 pr-3 font-medium">{sub.customer}</td>
                    <td className="py-2.5 pr-3 font-semibold tabular-nums">
                      {formatCurrency(sub.value)}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="rounded-lg border border-border/50 bg-muted/20 px-2 py-0.5 text-xs font-medium">
                        {CYCLE_LABELS[sub.cycle] ?? sub.cycle}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-muted-foreground">
                      {formatDate(sub.nextDueDate)}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="rounded-lg border border-border/50 bg-muted/20 px-2 py-0.5 text-xs font-medium">
                        {BILLING_LABELS[sub.billingType] ?? sub.billingType}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span
                        className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${
                          sub.status === "ACTIVE"
                            ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                            : sub.status === "EXPIRED"
                            ? "border border-rose-500/20 bg-rose-500/10 text-rose-400"
                            : "border border-border/50 bg-muted/30 text-muted-foreground"
                        }`}
                      >
                        {STATUS_LABELS[sub.status] ?? sub.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && data.hasMore && (
          <div className="flex justify-center mt-4 pt-3 border-t border-border/30">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset((o) => o + limit)}
              className="rounded-xl"
            >
              Carregar mais
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
