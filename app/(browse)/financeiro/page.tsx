"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowClockwise,
  Receipt,
  Users,
  FileText,
  MagnifyingGlass,
  Link as LinkIcon,
  PlugsConnected,
  Wallet,
  TrendUp,
  Clock,
  Warning,
  LinkSimple,
  Repeat,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { FadeIn, StaggerContainer, staggerItem } from "@/components/landing/motion"
import { useIntegrations } from "@/hooks/use-integrations"
import { useMe } from "@/hooks/use-me"
import {
  useFinanceBalance,
  useAsaasPayments,
  useAsaasCustomers,
} from "@/hooks/use-finance"
import { InvoiceModal } from "@/components/finance/invoice-modal"
import { PaymentLinkModal } from "@/components/finance/payment-link-modal"
import { PaymentLinksTable } from "@/components/finance/payment-links-table"
import { SubscriptionModal } from "@/components/finance/subscription-modal"
import { SubscriptionsTable } from "@/components/finance/subscriptions-table"
import { OverdueChargesTable } from "@/components/finance/overdue-charges-table"
import { PaymentDetailModal } from "@/components/finance/payment-detail-modal"
import { useContactNames } from "@/hooks/use-contact-names"
import type { AsaasPayment } from "@/lib/api/finance"

const ease = [0.33, 1, 0.68, 1] as const

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Aguardando",
  RECEIVED: "Pago",
  OVERDUE: "Vencido",
  REFUNDED: "Estornado",
  CONFIRMED: "Confirmado",
  DELETED: "Removido",
}

const BILLING_LABELS: Record<string, string> = {
  PIX: "PIX",
  BOLETO: "Boleto",
  CREDIT_CARD: "Cartão",
  DEBIT_CARD: "Débito",
}

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDate(s: string | null) {
  if (!s) return "—"
  return new Date(s).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

// ─── Cards do topo ────────────────────────────────────────────────────────────

function FinanceCards({
  balance,
  receivedMonth,
  pending,
  overdue,
  isLoading,
  onRefresh,
}: {
  balance?: number
  receivedMonth?: number
  pending?: number
  overdue?: number
  isLoading?: boolean
  onRefresh: () => void
}) {
  const items = [
    {
      key: "saldo",
      icon: Wallet,
      label: "Saldo disponível",
      value: balance ?? 0,
      accent: true,
      gradient: "from-accent/10 to-accent/5",
    },
    {
      key: "recebido",
      icon: TrendUp,
      label: "Recebido este mês",
      value: receivedMonth ?? 0,
      color: "text-emerald-400",
      gradient: "from-emerald-500/10 to-emerald-500/5",
    },
    {
      key: "pendentes",
      icon: Clock,
      label: "Cobranças pendentes",
      value: pending ?? 0,
      color: "text-amber-400",
      gradient: "from-amber-500/10 to-amber-500/5",
    },
    {
      key: "vencido",
      icon: Warning,
      label: "Vencido",
      value: overdue ?? 0,
      color: "text-orange-400",
      gradient: "from-orange-500/10 to-orange-500/5",
    },
  ]

  return (
    <StaggerContainer className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={0.06}>
      {items.map((item, i) => {
        const Icon = item.icon
        return (
          <motion.div
            key={item.key}
            variants={staggerItem}
            className="group relative overflow-hidden rounded-xl border border-border bg-card/80 backdrop-blur-sm transition-all duration-300 hover:border-accent/25 hover:shadow-md hover:shadow-accent/[0.04]"
          >
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
            />
            <div className="relative p-3.5">
              <div className="flex items-start justify-between">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                  item.accent ? "border-accent/20 bg-accent/10" : "border-border/60 bg-muted/30"
                }`}>
                  <Icon className={`h-4 w-4 ${item.accent ? "text-accent" : item.color ?? "text-muted-foreground"}`} weight="duotone" />
                </div>
                <button
                  onClick={onRefresh}
                  disabled={isLoading}
                  className="cursor-pointer rounded-lg p-2 text-muted-foreground/90 hover:bg-muted/50 hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Atualizar"
                >
                  <ArrowClockwise className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {item.label}
              </p>
              {isLoading ? (
                <div className="mt-1.5 h-8 w-24 animate-pulse rounded bg-muted/50" />
              ) : (
                <p className={`mt-1 text-xl font-bold tabular-nums tracking-tight ${item.color ?? "text-foreground"}`}>
                  {formatCurrency(item.value)}
                </p>
              )}
            </div>
          </motion.div>
        )
      })}
    </StaggerContainer>
  )
}

// ─── Tabela de cobranças ───────────────────────────────────────────────────────

function PaymentsTable({ onEmitInvoice }: { onEmitInvoice: (p: AsaasPayment) => void }) {
  const [offset, setOffset] = useState(0)
  const [status, setStatus] = useState<string>("")
  const [billingType, setBillingType] = useState<string>("")
  const [selectedPayment, setSelectedPayment] = useState<AsaasPayment | null>(null)
  const limit = 20

  const { data, isLoading } = useAsaasPayments({
    offset,
    limit,
    status: status || undefined,
    billingType: billingType || undefined,
  })

  const payments = data?.data ?? []
  const contactNames = useContactNames(payments.map((p) => p.externalReference))

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
      className="rounded-xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden"
    >
      <div className="border-b border-border/50 px-4 py-3 md:px-5 md:py-4">
        <h3 className="text-[14px] font-semibold tracking-tight text-foreground">Cobranças</h3>
        <p className="mt-0.5 text-[11px] text-muted-foreground">Liste e filtre todas as cobranças</p>
        <div className="flex flex-wrap gap-2 mt-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="cursor-pointer rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"
          >
            <option value="">Todos os status</option>
            <option value="PENDING">Pendente</option>
            <option value="RECEIVED">Pago</option>
            <option value="OVERDUE">Vencido</option>
          </select>
          <select
            value={billingType}
            onChange={(e) => setBillingType(e.target.value)}
            className="cursor-pointer rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"
          >
            <option value="">Todos os tipos</option>
            <option value="PIX">PIX</option>
            <option value="BOLETO">Boleto</option>
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
            <p className="text-[13px] text-muted-foreground">Carregando cobranças…</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20">
              <Receipt className="h-7 w-7 text-muted-foreground/85" weight="duotone" />
            </div>
            <div className="text-center">
              <p className="text-[14px] font-medium text-foreground">Nenhuma cobrança encontrada</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Ajuste os filtros ou aguarde novas cobranças</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-left">
                  <th className="py-3 pr-3">Paciente</th>
                  <th className="py-3 pr-3">Data</th>
                  <th className="py-3 pr-3">Valor</th>
                  <th className="py-3 pr-3">Tipo</th>
                  <th className="py-3 pr-3">Status</th>
                  <th className="py-3 pr-3">Descrição</th>
                  <th className="py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedPayment(p)}
                    className="border-b border-border/30 transition-colors hover:bg-muted/20 cursor-pointer"
                  >
                    <td className="py-2.5 pr-3 font-medium truncate max-w-[140px]">
                          {p.externalReference && contactNames[p.externalReference]
                            ? contactNames[p.externalReference]
                            : <span className="text-muted-foreground">—</span>}
                        </td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{formatDate(p.dateCreated)}</td>
                    <td className="py-2.5 pr-3 font-semibold tabular-nums">{formatCurrency(p.value)}</td>
                    <td className="py-2.5 pr-3">
                      <span className="rounded-lg border border-border/50 bg-muted/20 px-2 py-0.5 text-xs font-medium">
                        {BILLING_LABELS[p.billingType] ?? p.billingType}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span
                        className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${
                          p.status === "RECEIVED"
                            ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                            : p.status === "PENDING"
                            ? "border border-amber-500/20 bg-amber-500/10 text-amber-400"
                            : p.status === "OVERDUE"
                            ? "border border-orange-500/20 bg-orange-500/10 text-orange-400"
                            : "border border-border/50 bg-muted/30 text-muted-foreground"
                        }`}
                      >
                        {STATUS_LABELS[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-muted-foreground max-w-[180px]">
                      {p.description ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="block truncate cursor-default">
                              {p.description}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-sm whitespace-pre-wrap">
                            {p.description}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        {p.invoiceUrl && (
                          <a
                            href={p.invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent/10 hover:text-accent transition-colors"
                            title="Ver fatura"
                          >
                            <LinkIcon className="h-4 w-4" />
                          </a>
                        )}
                        {p.status === "RECEIVED" && (
                          <button
                            onClick={() => onEmitInvoice(p)}
                            className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent/10 hover:text-accent transition-colors"
                            title="Emitir NF"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        )}
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

    <AnimatePresence>
      {selectedPayment && (
        <PaymentDetailModal
          open={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
          payment={selectedPayment}
          contactName={selectedPayment.externalReference ? contactNames[selectedPayment.externalReference] : undefined}
        />
      )}
    </AnimatePresence>
    </>
  )
}

// ─── Tabela de clientes ────────────────────────────────────────────────────────

function CustomersTable() {
  const [offset, setOffset] = useState(0)
  const [search, setSearch] = useState("")
  const limit = 20

  const { data, isLoading } = useAsaasCustomers({
    offset,
    limit,
    name: search || undefined,
    cpfCnpj: search?.replace(/\D/g, "").length >= 11 ? search.replace(/\D/g, "") : undefined,
  })

  const customers = data?.data ?? []

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
      className="rounded-xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden"
    >
      <div className="border-b border-border/50 px-4 py-3 md:px-5 md:py-4">
        <h3 className="text-[14px] font-semibold tracking-tight text-foreground">Clientes</h3>
        <p className="mt-0.5 text-[11px] text-muted-foreground">Busque por nome ou CPF</p>
        <div className="relative mt-3 max-w-xs">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" weight="bold" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nome ou CPF"
            className="w-full rounded-xl border border-border/60 bg-background/50 pl-10 pr-4 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"
          />
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
            <p className="text-[13px] text-muted-foreground">Carregando clientes…</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20">
              <Users className="h-7 w-7 text-muted-foreground/85" weight="duotone" />
            </div>
            <div className="text-center">
              <p className="text-[14px] font-medium text-foreground">Nenhum cliente encontrado</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Tente outro termo de busca</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-left">
                  <th className="py-3 pr-3">Nome</th>
                  <th className="py-3 pr-3">E-mail</th>
                  <th className="py-3 pr-3">CPF/CNPJ</th>
                  <th className="py-3">Ação</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-border/30 transition-colors hover:bg-muted/20">
                    <td className="py-2.5 pr-3 font-medium">{c.name}</td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{c.email || "—"}</td>
                    <td className="py-2.5 pr-3 font-mono text-xs text-muted-foreground">{c.cpfCnpj || "—"}</td>
                    <td className="py-2.5">
                      {c.externalReference ? (
                        <Link
                          href={`/contacts?highlight=${c.externalReference}`}
                          className="cursor-pointer inline-flex items-center gap-1.5 text-[13px] font-medium text-accent hover:text-accent/80 transition-colors"
                        >
                          Ver contato
                          <LinkIcon className="h-3.5 w-3.5" />
                        </Link>
                      ) : (
                        <span className="text-muted-foreground/90 text-xs">—</span>
                      )}
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

function getMonthStart() {
  const d = new Date()
  d.setDate(1)
  return d.toISOString().split("T")[0]
}

function getMonthEnd() {
  const d = new Date()
  d.setMonth(d.getMonth() + 1)
  d.setDate(0)
  return d.toISOString().split("T")[0]
}

// ─── Empty state (Asaas não configurado) ────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6">
      <FadeIn className="flex flex-col items-center text-center max-w-md">
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, ease }}
          className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border/60 bg-muted/20"
        >
          <PlugsConnected className="h-10 w-10 text-muted-foreground/90" weight="duotone" />
        </motion.div>
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
          Integração
        </p>
        <h2 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
          Configure o Asaas para acessar o financeiro
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Conecte sua conta Asaas em Configurações → Conexões para visualizar saldo, cobranças e clientes.
        </p>
        <Link href="/settings?tab=conexoes" className="cursor-pointer mt-6">
          <Button size="lg" className="rounded-xl gap-2">
            <PlugsConnected className="h-4 w-4" weight="duotone" />
            Ir para Conexões
          </Button>
        </Link>
      </FadeIn>
    </div>
  )
}

// ─── Página principal ───────────────────────────────────────────────────────────

export default function FinanceiroPage() {
  const [activeTab, setActiveTab] = useState<
    "cobrancas" | "clientes" | "links" | "assinaturas" | "inadimplentes"
  >("cobrancas")
  const [invoicePayment, setInvoicePayment] = useState<AsaasPayment | null>(null)
  const [paymentLinkModalOpen, setPaymentLinkModalOpen] = useState(false)
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false)

  const { data: me } = useMe()
  const isAdmin = me?.role === "ADMIN" || me?.role === "SECRETARY"

  // Não-admins não têm acesso a GET /integrations (403), mas têm BILLING_READ
  // e podem acessar os dados do Asaas diretamente — tratamos como configurado.
  const { data: integrations } = useIntegrations()
  const asaasIntegration = integrations?.find((i) => i.provider === "asaas")
  const asaasConfigured = isAdmin
    ? !!(asaasIntegration?.isActive && asaasIntegration?.hasApiKey)
    : me !== undefined // não-admin: assume configurado assim que me carregou

  const balanceQuery = useFinanceBalance({ refetchInterval: 60_000 })
  const receivedQuery = useAsaasPayments({
    status: "RECEIVED",
    paymentDateGe: getMonthStart(),
    paymentDateLe: getMonthEnd(),
  })
  const pendingQuery = useAsaasPayments({ status: "PENDING" })
  const overdueQuery = useAsaasPayments({ status: "OVERDUE" })

  const receivedMonth = useMemo(
    () => receivedQuery.data?.data?.reduce((s, p) => s + (p.value ?? 0), 0) ?? 0,
    [receivedQuery.data]
  )
  const pendingTotal = useMemo(
    () => pendingQuery.data?.data?.reduce((s, p) => s + (p.value ?? 0), 0) ?? 0,
    [pendingQuery.data]
  )
  const overdueTotal = useMemo(
    () => overdueQuery.data?.data?.reduce((s, p) => s + (p.value ?? 0), 0) ?? 0,
    [overdueQuery.data]
  )

  const refreshAll = () => {
    balanceQuery.refetch()
    receivedQuery.refetch()
    pendingQuery.refetch()
    overdueQuery.refetch()
  }

  if (!asaasConfigured) {
    return <EmptyState />
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Page header — compacto */}
      <header className="shrink-0 border-b border-border/50 bg-background/50 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-3 md:py-4">
          <FadeIn className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold tracking-tight text-foreground md:text-xl">
                Financeiro
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/5 px-2.5 py-0.5">
                <span className="relative flex h-1 w-1">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex h-1 w-1 rounded-full bg-accent" />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">
                  Asaas
                </span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Saldo, cobranças e clientes em um único lugar
            </p>
          </FadeIn>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <TooltipProvider>
        <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-5 lg:p-6">

        <FinanceCards
          balance={balanceQuery.data?.balance}
          receivedMonth={receivedMonth}
          pending={pendingTotal}
          overdue={overdueTotal}
          isLoading={balanceQuery.isLoading}
          onRefresh={refreshAll}
        />

        {/* Tabs — navegação sugerida pela doc */}
        <div className="flex items-stretch gap-0 overflow-x-auto scrollbar-none border-b border-border/50 -mb-px">
          {[
            { id: "cobrancas" as const, icon: Receipt, label: "Cobranças" },
            { id: "inadimplentes" as const, icon: Warning, label: "Inadimplentes" },
            { id: "clientes" as const, icon: Users, label: "Clientes" },
            { id: "links" as const, icon: LinkSimple, label: "Links" },
            { id: "assinaturas" as const, icon: Repeat, label: "Assinaturas" },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`cursor-pointer relative shrink-0 flex items-center gap-2 px-4 py-2.5 text-[12px] font-semibold transition-colors ${
                activeTab === id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {activeTab === id && (
                <motion.div
                  layoutId="finance-tab"
                  className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-accent"
                  transition={{ duration: 0.22, ease }}
                />
              )}
              <Icon className="h-4 w-4" weight="duotone" />
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "cobrancas" && (
            <motion.div
              key="cobrancas"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3, ease }}
            >
              <PaymentsTable onEmitInvoice={(p) => setInvoicePayment(p)} />
            </motion.div>
          )}
          {activeTab === "inadimplentes" && (
            <motion.div
              key="inadimplentes"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3, ease }}
            >
              <OverdueChargesTable />
            </motion.div>
          )}
          {activeTab === "clientes" && (
            <motion.div
              key="clientes"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3, ease }}
            >
              <CustomersTable />
            </motion.div>
          )}
          {activeTab === "links" && (
            <motion.div
              key="links"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3, ease }}
            >
              <PaymentLinksTable onCreateClick={() => setPaymentLinkModalOpen(true)} />
            </motion.div>
          )}
          {activeTab === "assinaturas" && (
            <motion.div
              key="assinaturas"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3, ease }}
            >
              <SubscriptionsTable onCreateClick={() => setSubscriptionModalOpen(true)} />
            </motion.div>
          )}
        </AnimatePresence>
        </div>
        </TooltipProvider>
      </div>

      <InvoiceModal
        open={!!invoicePayment}
        onClose={() => setInvoicePayment(null)}
        payment={invoicePayment}
      />
      <PaymentLinkModal
        open={paymentLinkModalOpen}
        onClose={() => setPaymentLinkModalOpen(false)}
      />
      <SubscriptionModal
        open={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
      />
    </div>
  )
}
