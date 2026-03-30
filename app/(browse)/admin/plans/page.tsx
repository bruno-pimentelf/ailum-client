"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  CreditCard,
  CaretLeft,
  Plus,
  PencilSimple,
  Trash,
  Warning,
  ArrowsClockwise,
  CheckCircle,
  XCircle,
  X,
} from "@phosphor-icons/react"
import {
  useSuperAdminPlans,
  useSuperAdminCreatePlan,
  useSuperAdminUpdatePlan,
  useSuperAdminDeletePlan,
} from "@/hooks/use-super-admin"
import type { PlanItem, PlanCreateInput } from "@/lib/api/super-admin"

const ease = [0.33, 1, 0.68, 1] as const

function formatLimit(value: number): string {
  return value === -1 ? "Ilimitado" : value.toLocaleString("pt-BR")
}

function formatPrice(price: string): string {
  return Number(price).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

/* ─── Plan Form Dialog ──────────────────────────────────────────────── */

function PlanFormDialog({
  plan,
  onClose,
}: {
  plan: PlanItem | null // null = create mode
  onClose: () => void
}) {
  const createMut = useSuperAdminCreatePlan()
  const updateMut = useSuperAdminUpdatePlan()

  const [name, setName] = useState(plan?.name ?? "")
  const [slug, setSlug] = useState(plan?.slug ?? "")
  const [description, setDescription] = useState(plan?.description ?? "")
  const [maxConversations, setMaxConversations] = useState(
    plan?.maxConversationsPerMonth?.toString() ?? "-1"
  )
  const [maxAudio, setMaxAudio] = useState(
    plan?.maxAudioMinutesPerMonth?.toString() ?? "-1"
  )
  const [price, setPrice] = useState(plan ? String(Number(plan.price)) : "0")
  const [displayOrder, setDisplayOrder] = useState(
    plan?.displayOrder?.toString() ?? "0"
  )

  const saving = createMut.isPending || updateMut.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const body: PlanCreateInput = {
      name,
      slug,
      description: description || undefined,
      maxConversationsPerMonth: parseInt(maxConversations, 10),
      maxAudioMinutesPerMonth: parseInt(maxAudio, 10),
      price: parseFloat(price),
      displayOrder: parseInt(displayOrder, 10),
    }

    if (plan) {
      await updateMut.mutateAsync({ planId: plan.id, ...body })
    } else {
      await createMut.mutateAsync(body)
    }
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease }}
        className="relative w-full max-w-md rounded-xl border border-border/60 bg-background p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="cursor-pointer absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-[15px] font-bold text-foreground mb-5">
          {plan ? "Editar plano" : "Novo plano"}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-muted-foreground/90 uppercase tracking-wider">
              Nome
            </span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 rounded-lg bg-muted/30 px-3 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-muted-foreground/90 uppercase tracking-wider">
              Slug
            </span>
            <input
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="h-9 rounded-lg bg-muted/30 px-3 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-muted-foreground/90 uppercase tracking-wider">
              Descricao
            </span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-9 rounded-lg bg-muted/30 px-3 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted-foreground/90 uppercase tracking-wider">
                Conversas/mes
              </span>
              <input
                required
                type="number"
                value={maxConversations}
                onChange={(e) => setMaxConversations(e.target.value)}
                className="h-9 rounded-lg bg-muted/30 px-3 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all"
              />
              <span className="text-[10px] text-muted-foreground/70">
                -1 = ilimitado
              </span>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted-foreground/90 uppercase tracking-wider">
                Audio min/mes
              </span>
              <input
                required
                type="number"
                value={maxAudio}
                onChange={(e) => setMaxAudio(e.target.value)}
                className="h-9 rounded-lg bg-muted/30 px-3 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all"
              />
              <span className="text-[10px] text-muted-foreground/70">
                -1 = ilimitado
              </span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted-foreground/90 uppercase tracking-wider">
                Preco (R$)
              </span>
              <input
                required
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="h-9 rounded-lg bg-muted/30 px-3 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted-foreground/90 uppercase tracking-wider">
                Ordem
              </span>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                className="h-9 rounded-lg bg-muted/30 px-3 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="cursor-pointer mt-2 h-9 rounded-lg bg-accent text-[13px] font-medium text-white hover:bg-accent/90 disabled:opacity-50 transition-colors"
          >
            {saving ? "Salvando..." : plan ? "Salvar" : "Criar plano"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}

/* ─── Delete Confirmation Dialog ────────────────────────────────────── */

function DeleteDialog({
  plan,
  onClose,
}: {
  plan: PlanItem
  onClose: () => void
}) {
  const deleteMut = useSuperAdminDeletePlan()

  const handleDelete = async () => {
    await deleteMut.mutateAsync(plan.id)
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease }}
        className="relative w-full max-w-sm rounded-xl border border-border/60 bg-background p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-[15px] font-bold text-foreground mb-2">
          Excluir plano
        </h2>
        <p className="text-[13px] text-muted-foreground/85 mb-5">
          Tem certeza que deseja excluir o plano{" "}
          <strong className="text-foreground">{plan.name}</strong>? Esta acao
          nao pode ser desfeita.
        </p>
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={onClose}
            className="cursor-pointer h-8 rounded-lg border border-border/50 px-3 text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMut.isPending}
            className="cursor-pointer h-8 rounded-lg bg-rose-500 px-3 text-[12px] font-medium text-white hover:bg-rose-600 disabled:opacity-50 transition-colors"
          >
            {deleteMut.isPending ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── Plan Row ──────────────────────────────────────────────────────── */

function PlanRow({
  plan,
  onEdit,
  onDelete,
}: {
  plan: PlanItem
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <motion.tr
      layout
      className="border-b border-border/40 hover:bg-muted/30 transition-colors duration-150"
    >
      <td className="py-2.5 pl-4 pr-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-foreground truncate leading-tight">
            {plan.name}
          </p>
          <p className="text-[11px] text-muted-foreground/70 truncate">
            {plan.slug}
          </p>
        </div>
      </td>

      <td className="py-2.5 px-3 text-center">
        <span className="text-[13px] text-foreground/90 tabular-nums">
          {formatLimit(plan.maxConversationsPerMonth)}
        </span>
      </td>

      <td className="py-2.5 px-3 text-center">
        <span className="text-[13px] text-foreground/90 tabular-nums">
          {formatLimit(plan.maxAudioMinutesPerMonth)}
        </span>
      </td>

      <td className="py-2.5 px-3 text-center">
        <span className="text-[13px] text-foreground/90 tabular-nums">
          {formatPrice(plan.price)}
        </span>
      </td>

      <td className="py-2.5 px-3">
        <div className="flex items-center justify-center">
          {plan.isActive ? (
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

      <td className="py-2.5 px-3">
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={onEdit}
            className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            <PencilSimple className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg border border-border/50 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <Trash className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </motion.tr>
  )
}

/* ─── Page ──────────────────────────────────────────────────────────── */

export default function PlansPage() {
  const { data: plans, isLoading, error, refetch } = useSuperAdminPlans()
  const [editingPlan, setEditingPlan] = useState<PlanItem | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [deletingPlan, setDeletingPlan] = useState<PlanItem | null>(null)

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
          <CreditCard className="h-4 w-4 text-accent" weight="duotone" />
        </div>
        <div className="flex-1">
          <h1 className="text-[16px] font-bold text-foreground">Planos</h1>
          <p className="text-[11px] text-muted-foreground/85">
            Gerenciamento de planos e assinaturas
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="cursor-pointer flex items-center gap-1.5 h-8 rounded-lg bg-accent px-3 text-[12px] font-medium text-white hover:bg-accent/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" weight="bold" />
          Novo plano
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {isLoading && (
          <div className="flex flex-col">
            {Array.from({ length: 5 }).map((_, i) => (
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
              Erro ao carregar planos
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
                    Plano
                  </th>
                  <th className="text-center py-2.5 px-3 text-[11px] font-semibold text-muted-foreground/90 uppercase tracking-wider">
                    Conversas
                  </th>
                  <th className="text-center py-2.5 px-3 text-[11px] font-semibold text-muted-foreground/90 uppercase tracking-wider">
                    Audio (min)
                  </th>
                  <th className="text-center py-2.5 px-3 text-[11px] font-semibold text-muted-foreground/90 uppercase tracking-wider">
                    Preco
                  </th>
                  <th className="text-center py-2.5 px-3 text-[11px] font-semibold text-muted-foreground/90 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-center py-2.5 px-3 text-[11px] font-semibold text-muted-foreground/90 uppercase tracking-wider">
                    Acoes
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {plans?.map((p) => (
                    <PlanRow
                      key={p.id}
                      plan={p}
                      onEdit={() => setEditingPlan(p)}
                      onDelete={() => setDeletingPlan(p)}
                    />
                  ))}
                </AnimatePresence>
              </tbody>
            </table>

            {plans?.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center gap-3 py-20 text-center"
              >
                <CreditCard
                  className="h-10 w-10 text-muted-foreground/20"
                  weight="duotone"
                />
                <p className="text-[13px] text-muted-foreground/85">
                  Nenhum plano cadastrado
                </p>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Dialogs */}
      <AnimatePresence>
        {(showCreate || editingPlan) && (
          <PlanFormDialog
            plan={editingPlan}
            onClose={() => {
              setShowCreate(false)
              setEditingPlan(null)
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletingPlan && (
          <DeleteDialog
            plan={deletingPlan}
            onClose={() => setDeletingPlan(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
