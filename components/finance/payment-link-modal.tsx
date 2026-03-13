"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check, Link as LinkIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { useCreatePaymentLink, usePaymentLinks } from "@/hooks/use-finance"
import type { CreatePaymentLinkInput } from "@/lib/api/finance"

const CHARGE_TYPES = [
  { id: "DETACHED" as const, label: "Avulso" },
  { id: "INSTALLMENT" as const, label: "Parcelado" },
  { id: "RECURRENT" as const, label: "Assinatura" },
] as const

const BILLING_TYPES = [
  { id: "UNDEFINED" as const, label: "Todos" },
  { id: "PIX" as const, label: "PIX" },
  { id: "BOLETO" as const, label: "Boleto" },
  { id: "CREDIT_CARD" as const, label: "Cartão de crédito" },
] as const

const CYCLES = [
  { id: "WEEKLY", label: "Semanal" },
  { id: "MONTHLY", label: "Mensal" },
  { id: "BIMONTHLY", label: "Bimestral" },
  { id: "QUARTERLY", label: "Trimestral" },
  { id: "SEMIANNUALLY", label: "Semestral" },
  { id: "YEARLY", label: "Anual" },
]

interface PaymentLinkModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: (url: string) => void
}

export function PaymentLinkModal({ open, onClose, onSuccess }: PaymentLinkModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [value, setValue] = useState<string>("")
  const [chargeType, setChargeType] = useState<CreatePaymentLinkInput["chargeType"]>("DETACHED")
  const [billingType, setBillingType] = useState<CreatePaymentLinkInput["billingType"]>("UNDEFINED")
  const [subscriptionCycle, setSubscriptionCycle] = useState("")
  const [maxInstallmentCount, setMaxInstallmentCount] = useState<string>("")
  const [dueDateLimitDays, setDueDateLimitDays] = useState<string>("5")

  const create = useCreatePaymentLink()
  const { refetch } = usePaymentLinks()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const body: CreatePaymentLinkInput = {
      name: name.trim(),
      description: description.trim() || undefined,
      value: value ? parseFloat(value.replace(",", ".")) : undefined,
      billingType,
      chargeType,
      dueDateLimitDays: dueDateLimitDays ? parseInt(dueDateLimitDays, 10) : undefined,
      subscriptionCycle: chargeType === "RECURRENT" ? subscriptionCycle || undefined : undefined,
      maxInstallmentCount:
        chargeType === "INSTALLMENT" && maxInstallmentCount
          ? parseInt(maxInstallmentCount, 10)
          : undefined,
    }

    try {
      const result = await create.mutateAsync(body)
      refetch()
      onSuccess?.(result.url)
      onClose()
      setName("")
      setDescription("")
      setValue("")
      setChargeType("DETACHED")
      setBillingType("UNDEFINED")
      setSubscriptionCycle("")
      setMaxInstallmentCount("")
    } catch {
      // Error handled by mutation
    }
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        key="content"
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border/60 bg-card p-6 shadow-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-accent" weight="duotone" />
            <h2 className="text-base font-semibold">Criar link de pagamento</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Nome *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40"
              placeholder="Ex: Consulta avulsa"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40"
              placeholder="Pagamento de consulta"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Valor (opcional)
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/[^\d,.-]/g, ""))}
              className="w-full rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40"
              placeholder="Ex: 200,00 — deixe vazio para cliente definir"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Tipo de cobrança
            </label>
            <select
              value={chargeType}
              onChange={(e) =>
                setChargeType(e.target.value as CreatePaymentLinkInput["chargeType"])
              }
              className="w-full cursor-pointer rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40"
            >
              {CHARGE_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          {chargeType === "INSTALLMENT" && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Máximo de parcelas
              </label>
              <input
                type="number"
                min={1}
                max={12}
                value={maxInstallmentCount}
                onChange={(e) => setMaxInstallmentCount(e.target.value)}
                className="w-full rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40"
                placeholder="Ex: 3"
              />
            </div>
          )}
          {chargeType === "RECURRENT" && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Ciclo da assinatura
              </label>
              <select
                value={subscriptionCycle}
                onChange={(e) => setSubscriptionCycle(e.target.value)}
                required={chargeType === "RECURRENT"}
                className="w-full cursor-pointer rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40"
              >
                <option value="">Selecione</option>
                {CYCLES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Forma de pagamento
            </label>
            <select
              value={billingType}
              onChange={(e) =>
                setBillingType(e.target.value as CreatePaymentLinkInput["billingType"])
              }
              className="w-full cursor-pointer rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40"
            >
              {BILLING_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          {billingType === "BOLETO" && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Dias para vencimento (boleto)
              </label>
              <input
                type="number"
                min={1}
                value={dueDateLimitDays}
                onChange={(e) => setDueDateLimitDays(e.target.value)}
                className="w-full rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40"
              />
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={create.isPending || !name.trim() || (chargeType === "RECURRENT" && !subscriptionCycle)}
            >
              {create.isPending ? "Criando…" : (
                <>
                  <Check className="h-4 w-4 mr-1.5" weight="bold" />
                  Criar link
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </AnimatePresence>
  )
}
