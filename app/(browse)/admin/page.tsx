"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  ShieldCheck,
  Buildings,
  Funnel,
  Users,
  AddressBook,
  ChatCircleText,
  Robot,
  CreditCard,
  ArrowRight,
  Warning,
  ArrowsClockwise,
  TestTube,
} from "@phosphor-icons/react"
import { useSuperAdminOverviewStats } from "@/hooks/use-super-admin"

const ease = [0.33, 1, 0.68, 1] as const

function StatCard({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string
  value: number | undefined
  icon: React.ElementType
  loading: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease }}
      className="flex items-center gap-4 rounded-xl border border-border/60 bg-card/50 p-5"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
        <Icon className="h-5 w-5 text-accent" weight="duotone" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/90">
          {label}
        </p>
        {loading ? (
          <div className="mt-1 h-5 w-16 animate-pulse rounded bg-muted/30" />
        ) : (
          <p className="text-[20px] font-bold text-foreground tabular-nums">
            {value?.toLocaleString("pt-BR") ?? "—"}
          </p>
        )}
      </div>
    </motion.div>
  )
}

function QuickLink({
  href,
  label,
  description,
  icon: Icon,
}: {
  href: string
  label: string
  description: string
  icon: React.ElementType
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border border-border/60 bg-card/50 p-5 transition-colors duration-200 hover:bg-muted/30"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/40 group-hover:bg-accent/10 transition-colors duration-200">
        <Icon
          className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors duration-200"
          weight="duotone"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground/85">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/40 group-hover:text-accent/60 transition-colors duration-200" />
    </Link>
  )
}

export default function AdminPage() {
  const { data, isLoading, error, refetch } = useSuperAdminOverviewStats()

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
          <ShieldCheck className="h-5 w-5 text-accent" weight="duotone" />
        </div>
        <div>
          <h1 className="text-[18px] font-bold text-foreground">
            Super Admin
          </h1>
          <p className="text-[12px] text-muted-foreground/85">
            Painel administrativo global
          </p>
        </div>
      </div>

      {/* Error state */}
      {error && !isLoading && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
          <Warning className="h-5 w-5 text-rose-400 shrink-0" weight="duotone" />
          <p className="flex-1 text-[13px] text-rose-300/90">
            Erro ao carregar estatisticas
          </p>
          <button
            onClick={() => refetch()}
            className="cursor-pointer flex items-center gap-1.5 text-[12px] text-accent/60 hover:text-accent transition-colors"
          >
            <ArrowsClockwise className="h-3.5 w-3.5" /> Tentar novamente
          </button>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
        <StatCard
          label="Tenants"
          value={data?.totalTenants}
          icon={Buildings}
          loading={isLoading}
        />
        <StatCard
          label="Contatos"
          value={data?.totalContacts}
          icon={AddressBook}
          loading={isLoading}
        />
        <StatCard
          label="Mensagens"
          value={data?.totalMessages}
          icon={ChatCircleText}
          loading={isLoading}
        />
        <StatCard
          label="Jobs IA"
          value={data?.totalAgentJobs}
          icon={Robot}
          loading={isLoading}
        />
      </div>

      {/* Quick links */}
      <h2 className="text-[13px] font-semibold text-muted-foreground/90 uppercase tracking-wider mb-3">
        Acesso rapido
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <QuickLink
          href="/admin/tenants"
          label="Tenants"
          description="Listar e gerenciar todos os tenants"
          icon={Buildings}
        />
        <QuickLink
          href="/admin/funnels"
          label="Funis"
          description="Duplicar e transferir funis entre tenants"
          icon={Funnel}
        />
        <QuickLink
          href="/admin/plans"
          label="Planos"
          description="Gerenciar planos e assinaturas"
          icon={CreditCard}
        />
        <QuickLink
          href="/admin/playground"
          label="Playground"
          description="Testar agente IA em modo dry-run"
          icon={TestTube}
        />
      </div>
    </div>
  )
}
