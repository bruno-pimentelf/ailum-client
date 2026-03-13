"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Link as LinkIcon, Copy, Plus, Eye } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { usePaymentLinks } from "@/hooks/use-finance"

const CHARGE_LABELS: Record<string, string> = {
  DETACHED: "Avulso",
  INSTALLMENT: "Parcelado",
  RECURRENT: "Assinatura",
}

const BILLING_LABELS: Record<string, string> = {
  UNDEFINED: "Todos",
  PIX: "PIX",
  BOLETO: "Boleto",
  CREDIT_CARD: "Cartão",
}

function formatCurrency(v?: number) {
  if (v == null) return "—"
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

interface PaymentLinksTableProps {
  onCreateClick: () => void
}

export function PaymentLinksTable({ onCreateClick }: PaymentLinksTableProps) {
  const [offset, setOffset] = useState(0)
  const [activeFilter, setActiveFilter] = useState<string>("all")
  const limit = 20

  const { data, isLoading } = usePaymentLinks({
    offset,
    limit,
    active: activeFilter === "all" ? undefined : activeFilter === "true",
  })

  const links = data?.data ?? []

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
  }

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
              Links de pagamento
            </h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Crie links para cobrança PIX, boleto ou cartão
            </p>
          </div>
          <Button
            size="sm"
            onClick={onCreateClick}
            className="rounded-xl gap-2 shrink-0"
          >
            <Plus className="h-4 w-4" weight="bold" />
            Criar link
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="cursor-pointer rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40"
          >
            <option value="all">Todos</option>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
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
            <p className="text-[13px] text-muted-foreground">Carregando links…</p>
          </div>
        ) : links.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20">
              <LinkIcon className="h-7 w-7 text-muted-foreground/50" weight="duotone" />
            </div>
            <p className="text-[14px] font-medium text-foreground">
              Nenhum link de pagamento
            </p>
            <p className="text-xs text-muted-foreground">
              Crie um link para enviar por WhatsApp ou e-mail
            </p>
            <Button size="sm" onClick={onCreateClick} className="mt-2 rounded-xl gap-2">
              <Plus className="h-4 w-4" weight="bold" />
              Criar link
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-left">
                  <th className="py-3 pr-3">Nome</th>
                  <th className="py-3 pr-3">Valor</th>
                  <th className="py-3 pr-3">Tipo</th>
                  <th className="py-3 pr-3">Forma</th>
                  <th className="py-3 pr-3">Visualizações</th>
                  <th className="py-3 pr-3">Status</th>
                  <th className="py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => (
                  <tr
                    key={link.id}
                    className="border-b border-border/30 transition-colors hover:bg-muted/20"
                  >
                    <td className="py-2.5 pr-3 font-medium">{link.name}</td>
                    <td className="py-2.5 pr-3 tabular-nums">
                      {formatCurrency(link.value)}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="rounded-lg border border-border/50 bg-muted/20 px-2 py-0.5 text-xs font-medium">
                        {CHARGE_LABELS[link.chargeType] ?? link.chargeType}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="rounded-lg border border-border/50 bg-muted/20 px-2 py-0.5 text-xs font-medium">
                        {BILLING_LABELS[link.billingType] ?? link.billingType}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-muted-foreground">
                      {link.viewCount ?? 0}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span
                        className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${
                          link.active
                            ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                            : "border border-border/50 bg-muted/30 text-muted-foreground"
                        }`}
                      >
                        {link.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => copyUrl(link.url)}
                          className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent/10 hover:text-accent transition-colors"
                          title="Copiar URL"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent/10 hover:text-accent transition-colors"
                          title="Abrir link"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                      </div>
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
