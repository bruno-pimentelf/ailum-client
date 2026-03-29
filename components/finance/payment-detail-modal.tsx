"use client"

import { useMemo, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import {
  X,
  User,
  Phone,
  CurrencyDollar,
  CalendarBlank,
  Receipt,
} from "@phosphor-icons/react"
import { useAuthStore } from "@/lib/auth-store"
import { useContactDoc } from "@/hooks/use-contact-doc"
import { ChatView } from "@/components/app/chat-view"
import type { FirestoreContact } from "@/lib/types/firestore"
import type { AsaasPayment } from "@/lib/api/finance"
import { Timestamp } from "firebase/firestore"

const ease = [0.33, 1, 0.68, 1] as const

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Aguardando", color: "text-amber-400", bg: "border-amber-500/20 bg-amber-500/[0.08]" },
  RECEIVED: { label: "Pago", color: "text-emerald-400", bg: "border-emerald-500/20 bg-emerald-500/[0.08]" },
  OVERDUE: { label: "Vencido", color: "text-orange-400", bg: "border-orange-500/20 bg-orange-500/[0.08]" },
  REFUNDED: { label: "Estornado", color: "text-muted-foreground", bg: "border-border/50 bg-muted/20" },
  CONFIRMED: { label: "Confirmado", color: "text-emerald-400", bg: "border-emerald-500/20 bg-emerald-500/[0.08]" },
  DELETED: { label: "Removido", color: "text-muted-foreground", bg: "border-border/50 bg-muted/20" },
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

function formatPhone(phone: string) {
  const clean = phone.replace(/\D/g, "")
  if (clean.startsWith("55") && clean.length >= 12) {
    const local = clean.slice(2)
    const ddd = local.slice(0, 2)
    const rest = local.slice(2)
    if (rest.length === 9) return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`
    if (rest.length === 8) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`
  }
  return phone
}

function InfoBlock({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-foreground/[0.06] bg-foreground/[0.015] p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-[13px] font-medium text-foreground truncate">{value}</p>
    </div>
  )
}

// ─── Main Modal ─────────────────────────────────────────────────────────────

interface PaymentDetailModalProps {
  open: boolean
  onClose: () => void
  payment: AsaasPayment
  contactName?: string
}

export function PaymentDetailModal({ open, onClose, payment, contactName }: PaymentDetailModalProps) {
  const tenantId = useAuthStore((s) => s.tenantId)
  const contactId = payment.externalReference
  const contact = useContactDoc(contactId ?? null)

  const name = contactName ?? contact?.contactName ?? contact?.name ?? "Contato"
  const phone = contact?.contactPhone ?? contact?.phone ?? ""

  const firestoreContact = useMemo<FirestoreContact>(
    () => ({
      id: contactId ?? undefined,
      contactName: name,
      contactPhone: phone,
      status: contact?.status ?? "ACTIVE",
      updatedAt: Timestamp.now(),
    }),
    [contactId, name, phone, contact?.status],
  )

  const handleEsc = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (!open) return
    document.addEventListener("keydown", handleEsc)
    return () => document.removeEventListener("keydown", handleEsc)
  }, [open, handleEsc])

  if (!open) return null

  const statusCfg = STATUS_CONFIG[payment.status] ?? STATUS_CONFIG.PENDING

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 10 }}
        transition={{ duration: 0.3, ease }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[1100px] h-[calc(100vh-1rem)] sm:h-[calc(100vh-1.5rem)] rounded-2xl border border-border/60 bg-background shadow-2xl overflow-hidden flex flex-row"
      >
        {/* ═══ Left panel — Payment Info ═══ */}
        <div className="w-[380px] shrink-0 flex flex-col border-r border-foreground/[0.06] overflow-hidden">
          {/* Header */}
          <div className="px-5 pt-5 pb-4 border-b border-foreground/[0.06] shrink-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-accent/[0.08] border border-accent/10 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-accent/60" weight="bold" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold text-foreground truncate">
                    {name}
                  </h3>
                  {phone && (
                    <p className="text-[12px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                      <Phone className="h-3 w-3 shrink-0" />
                      {formatPhone(phone)}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 -m-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" weight="bold" />
              </button>
            </div>

            {/* Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${statusCfg.bg} ${statusCfg.color}`}>
                {statusCfg.label}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-foreground/[0.06] bg-foreground/[0.02] px-2 py-0.5 text-[10px] text-muted-foreground">
                <CurrencyDollar className="h-2.5 w-2.5" />
                {formatCurrency(payment.value)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-foreground/[0.06] bg-foreground/[0.02] px-2 py-0.5 text-[10px] text-muted-foreground">
                <Receipt className="h-2.5 w-2.5" />
                {BILLING_LABELS[payment.billingType] ?? payment.billingType}
              </span>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {payment.description && (
              <InfoBlock icon={CurrencyDollar} label="Descrição" value={payment.description} />
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <InfoBlock icon={CurrencyDollar} label="Valor" value={formatCurrency(payment.value)} />
              <InfoBlock icon={CalendarBlank} label="Vencimento" value={formatDate(payment.dueDate)} />
            </div>

            {payment.paymentDate && (
              <InfoBlock icon={CalendarBlank} label="Data do pagamento" value={formatDate(payment.paymentDate)} />
            )}

            <InfoBlock icon={CalendarBlank} label="Criado em" value={formatDate(payment.dateCreated)} />

            {payment.invoiceUrl && (
              <a
                href={payment.invoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 h-10 rounded-xl border border-accent/20 bg-accent/[0.04] text-[12px] font-medium text-accent hover:bg-accent/[0.08] transition-colors cursor-pointer"
              >
                Ver fatura
              </a>
            )}

            {!contactId && (
              <div className="rounded-xl border border-foreground/[0.04] bg-foreground/[0.01] p-3">
                <p className="text-[11px] text-muted-foreground/50 leading-relaxed">
                  Esta cobrança não está vinculada a um contato no sistema.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ═══ Right panel — Chat ═══ */}
        <div className="flex-1 min-w-0 flex flex-col">
          {tenantId && contactId ? (
            <ChatView contact={firestoreContact} tenantId={tenantId} />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Receipt className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" weight="duotone" />
                <p className="text-[13px] text-muted-foreground">
                  {!contactId ? "Sem contato vinculado" : "Carregando…"}
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
