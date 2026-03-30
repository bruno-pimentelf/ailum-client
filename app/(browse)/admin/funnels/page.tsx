"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  Funnel,
  Buildings,
  MagnifyingGlass,
  CaretLeft,
  ArrowRight,
  Copy,
  ArrowsLeftRight,
  Warning,
  CheckCircle,
  X,
  SpinnerGap,
} from "@phosphor-icons/react"
import {
  useSuperAdminTenants,
  useSuperAdminTenantFunnels,
  useSuperAdminDuplicateFunnel,
  useSuperAdminTransferFunnel,
} from "@/hooks/use-super-admin"
import type { TenantListItem, TenantFunnel } from "@/lib/api/super-admin"

const ease = [0.33, 1, 0.68, 1] as const

// ─── Tenant picker ───────────────────────────────────────────────────────────

function TenantPicker({
  label,
  tenants,
  loading,
  search,
  onSearch,
  selected,
  onSelect,
}: {
  label: string
  tenants: TenantListItem[]
  loading: boolean
  search: string
  onSearch: (v: string) => void
  selected: TenantListItem | null
  onSelect: (t: TenantListItem | null) => void
}) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-3 pt-3 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/85 mb-2">
          {label}
        </p>
        <div className="relative">
          <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/85 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Buscar tenant..."
            className="h-8 w-full rounded-lg bg-muted/30 pl-8 pr-3 text-[12px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all duration-200"
          />
          {search && (
            <button
              onClick={() => onSearch("")}
              className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/90 hover:text-muted-foreground transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto px-2 pb-2">
        {loading && (
          <div className="flex flex-col gap-1 px-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-8 rounded-lg bg-muted/20 animate-pulse"
              />
            ))}
          </div>
        )}
        {!loading &&
          tenants.map((t) => {
            const active = selected?.id === t.id
            return (
              <button
                key={t.id}
                onClick={() => onSelect(active ? null : t)}
                className={`cursor-pointer flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12px] transition-colors duration-150 ${
                  active
                    ? "bg-accent/10 text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <Buildings
                  className={`h-3.5 w-3.5 shrink-0 ${active ? "text-accent" : ""}`}
                  weight={active ? "fill" : "regular"}
                />
                <span className="flex-1 truncate">{t.name}</span>
                {active && (
                  <CheckCircle
                    className="h-3.5 w-3.5 text-accent shrink-0"
                    weight="fill"
                  />
                )}
              </button>
            )
          })}
        {!loading && tenants.length === 0 && (
          <p className="px-2 py-4 text-center text-[11px] text-muted-foreground/70">
            Nenhum tenant encontrado
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Funnel list ─────────────────────────────────────────────────────────────

function FunnelList({
  funnels,
  loading,
  selected,
  onSelect,
}: {
  funnels: TenantFunnel[]
  loading: boolean
  selected: TenantFunnel | null
  onSelect: (f: TenantFunnel | null) => void
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-1 p-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-10 rounded-lg bg-muted/20 animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (funnels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Funnel
          className="h-8 w-8 text-muted-foreground/20 mb-2"
          weight="duotone"
        />
        <p className="text-[11px] text-muted-foreground/70">
          Nenhum funil encontrado
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1 p-2 overflow-auto">
      {funnels.map((f) => {
        const active = selected?.id === f.id
        return (
          <button
            key={f.id}
            onClick={() => onSelect(active ? null : f)}
            className={`cursor-pointer flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors duration-150 ${
              active
                ? "bg-accent/10 text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <Funnel
              className={`h-3.5 w-3.5 shrink-0 ${active ? "text-accent" : ""}`}
              weight={active ? "fill" : "regular"}
            />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium truncate">{f.name}</p>
              <p className="text-[10px] text-muted-foreground/70">
                {f.stages.length} etapa{f.stages.length !== 1 ? "s" : ""}
              </p>
            </div>
            {active && (
              <CheckCircle
                className="h-3.5 w-3.5 text-accent shrink-0"
                weight="fill"
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── Confirm dialog ──────────────────────────────────────────────────────────

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl"
          >
            <h3 className="text-[14px] font-bold text-foreground mb-1.5">
              {title}
            </h3>
            <p className="text-[12px] text-muted-foreground/85 mb-5">
              {description}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={onCancel}
                disabled={loading}
                className="cursor-pointer h-8 rounded-lg border border-border/50 px-3 text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="cursor-pointer inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-[12px] font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {loading && (
                  <SpinnerGap className="h-3.5 w-3.5 animate-spin" />
                )}
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function FunnelsPage() {
  // Source tenant
  const [sourceSearch, setSourceSearch] = useState("")
  const [debouncedSourceSearch, setDebouncedSourceSearch] = useState("")
  const [sourceTenant, setSourceTenant] = useState<TenantListItem | null>(null)
  const [selectedFunnel, setSelectedFunnel] = useState<TenantFunnel | null>(
    null
  )

  // Target tenant
  const [targetSearch, setTargetSearch] = useState("")
  const [debouncedTargetSearch, setDebouncedTargetSearch] = useState("")
  const [targetTenant, setTargetTenant] = useState<TenantListItem | null>(null)

  // Confirm dialogs
  const [confirmDuplicate, setConfirmDuplicate] = useState(false)
  const [confirmTransfer, setConfirmTransfer] = useState(false)

  // Success message
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleSourceSearch = (v: string) => {
    setSourceSearch(v)
    clearTimeout(
      (handleSourceSearch as { _t?: ReturnType<typeof setTimeout> })._t
    )
    ;(handleSourceSearch as { _t?: ReturnType<typeof setTimeout> })._t =
      setTimeout(() => setDebouncedSourceSearch(v), 350)
  }

  const handleTargetSearch = (v: string) => {
    setTargetSearch(v)
    clearTimeout(
      (handleTargetSearch as { _t?: ReturnType<typeof setTimeout> })._t
    )
    ;(handleTargetSearch as { _t?: ReturnType<typeof setTimeout> })._t =
      setTimeout(() => setDebouncedTargetSearch(v), 350)
  }

  const { data: sourceData, isLoading: sourceLoading } = useSuperAdminTenants({
    search: debouncedSourceSearch || undefined,
  })
  const { data: targetData, isLoading: targetLoading } = useSuperAdminTenants({
    search: debouncedTargetSearch || undefined,
  })

  const { data: funnels, isLoading: funnelsLoading } =
    useSuperAdminTenantFunnels(sourceTenant?.id ?? null)

  const duplicateMutation = useSuperAdminDuplicateFunnel()
  const transferMutation = useSuperAdminTransferFunnel()

  const canAct =
    sourceTenant && selectedFunnel && targetTenant && sourceTenant.id !== targetTenant.id

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  const handleDuplicate = () => {
    if (!sourceTenant || !selectedFunnel || !targetTenant) return
    duplicateMutation.mutate(
      {
        sourceTenantId: sourceTenant.id,
        sourceFunnelId: selectedFunnel.id,
        targetTenantId: targetTenant.id,
      },
      {
        onSuccess: () => {
          setConfirmDuplicate(false)
          showSuccess("Funil duplicado com sucesso")
        },
      }
    )
  }

  const handleTransfer = () => {
    if (!sourceTenant || !selectedFunnel || !targetTenant) return
    transferMutation.mutate(
      {
        sourceTenantId: sourceTenant.id,
        funnelId: selectedFunnel.id,
        targetTenantId: targetTenant.id,
      },
      {
        onSuccess: () => {
          setConfirmTransfer(false)
          setSelectedFunnel(null)
          showSuccess("Funil transferido com sucesso")
        },
      }
    )
  }

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
          <Funnel className="h-4 w-4 text-accent" weight="duotone" />
        </div>
        <div>
          <h1 className="text-[16px] font-bold text-foreground">Funis</h1>
          <p className="text-[11px] text-muted-foreground/85">
            Duplicar e transferir funis entre tenants
          </p>
        </div>
      </div>

      {/* Success toast */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mx-6 mb-3 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5"
          >
            <CheckCircle
              className="h-4 w-4 text-emerald-400 shrink-0"
              weight="fill"
            />
            <p className="text-[12px] text-emerald-300">{successMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Two-panel layout */}
      <div className="flex-1 grid grid-cols-3 gap-0 overflow-hidden border-t border-border/50">
        {/* Source tenant + funnel selection */}
        <div className="flex flex-col border-r border-border/50 overflow-hidden">
          <div className="h-1/2 border-b border-border/50 overflow-hidden">
            <TenantPicker
              label="Tenant de origem"
              tenants={sourceData?.tenants ?? []}
              loading={sourceLoading}
              search={sourceSearch}
              onSearch={handleSourceSearch}
              selected={sourceTenant}
              onSelect={(t) => {
                setSourceTenant(t)
                setSelectedFunnel(null)
              }}
            />
          </div>
          <div className="h-1/2 overflow-hidden">
            <div className="px-3 pt-3 pb-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/85">
                Funis
              </p>
            </div>
            {sourceTenant ? (
              <FunnelList
                funnels={funnels ?? []}
                loading={funnelsLoading}
                selected={selectedFunnel}
                onSelect={setSelectedFunnel}
              />
            ) : (
              <div className="flex items-center justify-center py-10">
                <p className="text-[11px] text-muted-foreground/50">
                  Selecione um tenant de origem
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Center: arrow + actions */}
        <div className="flex flex-col items-center justify-center gap-4 px-4">
          <ArrowRight className="h-6 w-6 text-muted-foreground/30" />

          {selectedFunnel && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-2 w-full"
            >
              <div className="rounded-lg border border-border/60 bg-card/50 p-3 w-full text-center">
                <p className="text-[10px] text-muted-foreground/70 mb-0.5">
                  Funil selecionado
                </p>
                <p className="text-[13px] font-medium text-foreground truncate">
                  {selectedFunnel.name}
                </p>
                <p className="text-[10px] text-muted-foreground/70">
                  {selectedFunnel.stages.length} etapa
                  {selectedFunnel.stages.length !== 1 ? "s" : ""}
                </p>
              </div>

              <button
                onClick={() => setConfirmDuplicate(true)}
                disabled={!canAct}
                className="cursor-pointer inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-3 text-[12px] font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-30 disabled:cursor-default"
              >
                <Copy className="h-3.5 w-3.5" />
                Duplicar
              </button>
              <button
                onClick={() => setConfirmTransfer(true)}
                disabled={!canAct}
                className="cursor-pointer inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-border/50 px-3 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors disabled:opacity-30 disabled:cursor-default"
              >
                <ArrowsLeftRight className="h-3.5 w-3.5" />
                Transferir
              </button>

              {sourceTenant?.id === targetTenant?.id && targetTenant && (
                <p className="text-[10px] text-rose-400/80 text-center">
                  Origem e destino devem ser diferentes
                </p>
              )}
            </motion.div>
          )}

          {!selectedFunnel && (
            <p className="text-[11px] text-muted-foreground/40 text-center">
              Selecione um tenant, um funil, e o tenant de destino
            </p>
          )}
        </div>

        {/* Target tenant */}
        <div className="border-l border-border/50 overflow-hidden">
          <TenantPicker
            label="Tenant de destino"
            tenants={targetData?.tenants ?? []}
            loading={targetLoading}
            search={targetSearch}
            onSearch={handleTargetSearch}
            selected={targetTenant}
            onSelect={setTargetTenant}
          />
        </div>
      </div>

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={confirmDuplicate}
        title="Duplicar funil"
        description={`Duplicar "${selectedFunnel?.name}" de "${sourceTenant?.name}" para "${targetTenant?.name}"? Uma copia completa sera criada no tenant de destino.`}
        confirmLabel="Duplicar"
        loading={duplicateMutation.isPending}
        onConfirm={handleDuplicate}
        onCancel={() => setConfirmDuplicate(false)}
      />
      <ConfirmDialog
        open={confirmTransfer}
        title="Transferir funil"
        description={`Transferir "${selectedFunnel?.name}" de "${sourceTenant?.name}" para "${targetTenant?.name}"? O funil sera removido do tenant de origem.`}
        confirmLabel="Transferir"
        loading={transferMutation.isPending}
        onConfirm={handleTransfer}
        onCancel={() => setConfirmTransfer(false)}
      />
    </div>
  )
}
