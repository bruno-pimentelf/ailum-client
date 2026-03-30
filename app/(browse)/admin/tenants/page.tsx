"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  MagnifyingGlass,
  Buildings,
  ArrowLeft,
  ArrowRight,
  ArrowsClockwise,
  Warning,
  X,
  CheckCircle,
  XCircle,
  CaretLeft,
} from "@phosphor-icons/react"
import { useSuperAdminTenants } from "@/hooks/use-super-admin"
import type { TenantListItem } from "@/lib/api/super-admin"

const ease = [0.33, 1, 0.68, 1] as const

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    })
  } catch {
    return "—"
  }
}

function TenantRow({ tenant }: { tenant: TenantListItem }) {
  return (
    <motion.tr
      layout
      className="border-b border-border/40 hover:bg-muted/30 transition-colors duration-150"
    >
      {/* Name */}
      <td className="py-2.5 pl-4 pr-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-foreground truncate leading-tight">
            {tenant.name}
          </p>
          {tenant.slug && (
            <p className="text-[11px] text-muted-foreground/70 truncate">
              {tenant.slug}
            </p>
          )}
        </div>
      </td>

      {/* Members */}
      <td className="py-2.5 px-3 text-center">
        <span className="text-[13px] text-foreground/90 tabular-nums">
          {tenant._count.tenantMembers}
        </span>
      </td>

      {/* Contacts */}
      <td className="py-2.5 px-3 text-center">
        <span className="text-[13px] text-foreground/90 tabular-nums">
          {tenant._count.contacts}
        </span>
      </td>

      {/* Funnels */}
      <td className="py-2.5 px-3 text-center">
        <span className="text-[13px] text-foreground/90 tabular-nums">
          {tenant._count.funnels}
        </span>
      </td>

      {/* Active */}
      <td className="py-2.5 px-3">
        <div className="flex items-center justify-center">
          {tenant.isActive ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
              <CheckCircle className="h-3 w-3" weight="fill" />
              Ativo
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 text-[10px] font-medium text-rose-400">
              <XCircle className="h-3 w-3" weight="fill" />
              Inativo
            </span>
          )}
        </div>
      </td>

      {/* Created */}
      <td className="py-2.5 px-3 hidden lg:table-cell">
        <span className="text-[11px] text-muted-foreground/85 tabular-nums">
          {formatDate(tenant.createdAt)}
        </span>
      </td>
    </motion.tr>
  )
}

export default function TenantsPage() {
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)

  const handleSearch = (v: string) => {
    setSearch(v)
    clearTimeout(
      (handleSearch as { _t?: ReturnType<typeof setTimeout> })._t
    )
    ;(handleSearch as { _t?: ReturnType<typeof setTimeout> })._t =
      setTimeout(() => {
        setDebouncedSearch(v)
        setPage(1)
      }, 350)
  }

  const { data, isLoading, error, refetch } = useSuperAdminTenants({
    search: debouncedSearch || undefined,
    page,
  })

  const tenants = data?.tenants ?? []
  const pages = data?.totalPages ?? 1
  const total = data?.total ?? 0

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-6 pt-6 pb-4">
        <Link
          href="/admin"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
        >
          <CaretLeft className="h-3.5 w-3.5" weight="bold" />
        </Link>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
          <Buildings className="h-4 w-4 text-accent" weight="duotone" />
        </div>
        <div>
          <h1 className="text-[16px] font-bold text-foreground">Tenants</h1>
          <p className="text-[11px] text-muted-foreground/85">
            Gerenciamento de todos os tenants
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="shrink-0 flex items-center gap-2 px-4 pb-3 border-b border-border/50">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/85 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Pesquisar por nome ou slug..."
            className="h-9 w-full rounded-lg bg-muted/30 pl-9 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all duration-200"
          />
          {search && (
            <button
              onClick={() => handleSearch("")}
              className="cursor-pointer absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/90 hover:text-muted-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {total > 0 && (
          <span className="text-[11px] text-muted-foreground/90 shrink-0">
            {total} tenants
          </span>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {isLoading && (
          <div className="flex flex-col">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 border-b border-border/30"
              >
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="h-3 w-40 rounded bg-muted/30 animate-pulse" />
                  <div className="h-2.5 w-24 rounded bg-muted/20 animate-pulse" />
                </div>
                <div className="h-2.5 w-12 rounded bg-muted/20 animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Warning
              className="h-8 w-8 text-rose-400/40"
              weight="duotone"
            />
            <p className="text-[13px] text-muted-foreground/85">
              Erro ao carregar tenants
            </p>
            <button
              onClick={() => refetch()}
              className="cursor-pointer flex items-center gap-1.5 text-[12px] text-accent/60 hover:text-accent transition-colors"
            >
              <ArrowsClockwise className="h-3.5 w-3.5" /> Tentar novamente
            </button>
          </div>
        )}

        {!isLoading && !error && (
          <>
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
                <tr>
                  <th className="text-left py-2.5 pl-4 pr-3 text-[11px] font-semibold text-muted-foreground/90 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="text-center py-2.5 px-3 text-[11px] font-semibold text-muted-foreground/90 uppercase tracking-wider">
                    Membros
                  </th>
                  <th className="text-center py-2.5 px-3 text-[11px] font-semibold text-muted-foreground/90 uppercase tracking-wider">
                    Contatos
                  </th>
                  <th className="text-center py-2.5 px-3 text-[11px] font-semibold text-muted-foreground/90 uppercase tracking-wider">
                    Funis
                  </th>
                  <th className="text-center py-2.5 px-3 text-[11px] font-semibold text-muted-foreground/90 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-muted-foreground/90 uppercase tracking-wider hidden lg:table-cell">
                    Criado em
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {tenants.map((t) => (
                    <TenantRow key={t.id} tenant={t} />
                  ))}
                </AnimatePresence>
              </tbody>
            </table>

            {tenants.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center gap-3 py-20 text-center"
              >
                <Buildings
                  className="h-10 w-10 text-muted-foreground/20"
                  weight="duotone"
                />
                <p className="text-[13px] text-muted-foreground/85">
                  Nenhum tenant encontrado
                </p>
                {search && (
                  <p className="text-[11px] text-muted-foreground/85">
                    Tente alterar os termos da busca
                  </p>
                )}
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="shrink-0 flex items-center justify-between border-t border-border/50 px-4 py-2.5">
          <span className="text-[11px] text-muted-foreground/90">
            Pagina {page} de {pages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg border border-border/50 text-muted-foreground/85 hover:text-foreground hover:bg-muted/40 disabled:opacity-30 disabled:cursor-default transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= pages}
              className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg border border-border/50 text-muted-foreground/85 hover:text-foreground hover:bg-muted/40 disabled:opacity-30 disabled:cursor-default transition-colors"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
