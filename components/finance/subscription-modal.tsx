"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check, Repeat } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import {
  useCreateSubscription,
  useAsaasCustomers,
} from "@/hooks/use-finance"
import type { CreateSubscriptionInput } from "@/lib/api/finance"

const CYCLES: { id: CreateSubscriptionInput["cycle"]; label: string }[] = [
  { id: "WEEKLY", label: "Semanal" },
  { id: "MONTHLY", label: "Mensal" },
  { id: "BIMONTHLY", label: "Bimestral" },
  { id: "QUARTERLY", label: "Trimestral" },
  { id: "SEMIANNUALLY", label: "Semestral" },
  { id: "YEARLY", label: "Anual" },
]

const BILLING_TYPES: { id: CreateSubscriptionInput["billingType"]; label: string }[] = [
  { id: "PIX", label: "PIX" },
  { id: "BOLETO", label: "Boleto" },
  { id: "CREDIT_CARD", label: "Cartão de crédito" },
  { id: "UNDEFINED", label: "Todos" },
]

function getNextDueDate(cycle: CreateSubscriptionInput["cycle"]): string {
  const d = new Date()
  switch (cycle) {
    case "WEEKLY":
      d.setDate(d.getDate() + 7)
      break
    case "MONTHLY":
      d.setMonth(d.getMonth() + 1)
      break
    case "BIMONTHLY":
      d.setMonth(d.getMonth() + 2)
      break
    case "QUARTERLY":
      d.setMonth(d.getMonth() + 3)
      break
    case "SEMIANNUALLY":
      d.setMonth(d.getMonth() + 6)
      break
    case "YEARLY":
      d.setFullYear(d.getFullYear() + 1)
      break
    default:
      d.setMonth(d.getMonth() + 1)
  }
  return d.toISOString().split("T")[0]
}

interface SubscriptionModalProps {
  open: boolean
  onClose: () => void
}

export function SubscriptionModal({ open, onClose }: SubscriptionModalProps) {
  const [customer, setCustomer] = useState("")
  const [value, setValue] = useState("")
  const [cycle, setCycle] = useState<CreateSubscriptionInput["cycle"]>("MONTHLY")
  const [nextDueDate, setNextDueDate] = useState(() => getNextDueDate("MONTHLY"))
  const [billingType, setBillingType] = useState<CreateSubscriptionInput["billingType"]>("PIX")
  const [description, setDescription] = useState("")

  const create = useCreateSubscription()
  const { data: customersData } = useAsaasCustomers({ limit: 100 })
  const customers = customersData?.data ?? []

  const handleCycleChange = (c: CreateSubscriptionInput["cycle"]) => {
    setCycle(c)
    setNextDueDate(getNextDueDate(c))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customer.trim() || !value || parseFloat(value) <= 0 || !nextDueDate) return

    try {
      await create.mutateAsync({
        customer: customer.trim(),
        value: parseFloat(value.replace(",", ".")),
        nextDueDate,
        cycle,
        billingType,
        description: description.trim() || undefined,
      })
      onClose()
      setCustomer("")
      setValue("")
      setCycle("MONTHLY")
      setNextDueDate(getNextDueDate("MONTHLY"))
      setBillingType("PIX")
      setDescription("")
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
            <Repeat className="h-5 w-5 text-accent" weight="duotone" />
            <h2 className="text-base font-semibold">Nova assinatura</h2>
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
              Cliente *
            </label>
            <select
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              required
              className="w-full cursor-pointer rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40"
            >
              <option value="">Selecione o cliente</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.cpfCnpj ? `· ${c.cpfCnpj}` : ""}
                </option>
              ))}
            </select>
            {customers.length === 0 && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Cadastre clientes na aba Clientes primeiro.
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Valor *
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/[^\d,.-]/g, ""))}
              required
              placeholder="Ex: 99,90"
              className="w-full rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Ciclo *
            </label>
            <select
              value={cycle}
              onChange={(e) =>
                handleCycleChange(e.target.value as CreateSubscriptionInput["cycle"])
              }
              className="w-full cursor-pointer rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40"
            >
              {CYCLES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Próximo vencimento *
            </label>
            <input
              type="date"
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
              required
              className="w-full rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Forma de pagamento
            </label>
            <select
              value={billingType}
              onChange={(e) =>
                setBillingType(e.target.value as CreateSubscriptionInput["billingType"])
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
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Descrição
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Plano mensal de acompanhamento"
              className="w-full rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                create.isPending ||
                !customer ||
                !value ||
                parseFloat(value.replace(",", ".")) <= 0 ||
                !nextDueDate
              }
            >
              {create.isPending ? "Criando…" : (
                <>
                  <Check className="h-4 w-4 mr-1.5" weight="bold" />
                  Criar assinatura
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </AnimatePresence>
  )
}
