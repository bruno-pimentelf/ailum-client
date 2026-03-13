"use client"

import { motion } from "framer-motion"
import {
  UserCircle,
  CalendarCheck,
  Calendar,
  CurrencyDollar,
  Warning,
  FlowArrow,
  UserMinus,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { StaggerContainer, staggerItem } from "@/components/landing/motion"
import type { StatsOverview } from "@/lib/api/stats"

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

interface OverviewCardsProps {
  data?: StatsOverview
  isLoading?: boolean
  className?: string
}

const cards: {
  key: string
  label: string
  icon: typeof UserCircle
  get: (d?: StatsOverview) => number | string
  sub?: (d?: StatsOverview) => string | null
  suffix?: string
  accent?: boolean
}[] = [
  { key: "leads", label: "Leads", icon: UserCircle, get: (d) => d?.leadsTotal ?? 0 },
  { key: "agendamentos", label: "Agendamentos", icon: CalendarCheck, get: (d) => d?.appointmentScheduledTotal ?? 0 },
  { key: "hoje", label: "Consultas hoje", icon: Calendar, get: (d) => d?.appointmentsToday ?? 0, accent: true },
  { key: "receita", label: "Receita paga", icon: CurrencyDollar, get: (d) => formatCurrency(d?.revenuePaid ?? 0) },
  {
    key: "inadimplente",
    label: "Inadimplentes",
    icon: Warning,
    get: (d) => d?.chargesOverdueCount ?? 0,
    sub: (d) => (d?.chargesOverdueCount ?? 0) > 0 ? formatCurrency(d?.chargesOverdueAmount ?? 0) : null,
  },
  { key: "escalacoes", label: "Escalações", icon: FlowArrow, get: (d) => d?.escalationsCount ?? 0 },
  { key: "noShow", label: "Taxa no-show", icon: UserMinus, get: (d) => d?.noShowRate ?? 0, suffix: "%" },
]

export function OverviewCards({ data, isLoading, className }: OverviewCardsProps) {
  return (
    <StaggerContainer
      className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7", className)}
      staggerDelay={0.04}
    >
      {cards.map((card) => {
        const value = card.get(data)
        const sub = card.sub?.(data)
        const suffix = card.suffix ?? ""
        const displayValue =
          typeof value === "number"
            ? value.toLocaleString("pt-BR") + suffix
            : String(value)
        const Icon = card.icon
        return (
          <motion.div
            key={card.key}
            variants={staggerItem}
            className="group relative overflow-hidden rounded-xl border border-border bg-card/80 backdrop-blur-sm transition-all duration-300 hover:border-accent/20 hover:shadow-md hover:shadow-accent/[0.03]"
          >
            <div className="relative p-3.5">
              <div
                className={cn(
                  "mb-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                  card.accent
                    ? "border-accent/20 bg-accent/10"
                    : "border-border/60 bg-muted/20"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4",
                    card.accent ? "text-accent" : "text-muted-foreground"
                  )}
                  weight="duotone"
                />
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {card.label}
              </p>
              {isLoading ? (
                <div className="mt-1.5 h-7 w-20 animate-pulse rounded bg-muted/40" />
              ) : (
                <>
                  <p className="mt-1 text-lg font-bold tabular-nums tracking-tight text-foreground">
                    {displayValue}
                  </p>
                  {sub && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )
      })}
    </StaggerContainer>
  )
}
