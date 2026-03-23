"use client"

import { useMemo, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import {
  X,
  User,
  Phone,
  CurrencyDollar,
  CalendarBlank,
  Clock,
  Warning,
  Copy,
  Check,
} from "@phosphor-icons/react"
import { useState } from "react"
import { useAuthStore } from "@/lib/auth-store"
import { ChatView } from "@/components/app/chat-view"
import type { FirestoreContact } from "@/lib/types/firestore"
import type { OverdueChargeWithContact } from "@/hooks/use-overdue-charges"
import { Timestamp } from "firebase/firestore"

const ease = [0.33, 1, 0.68, 1] as const

function formatCurrency(v: string | number) {
  const num = typeof v === "string" ? parseFloat(v) : v
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDate(ts: { toDate: () => Date } | null) {
  if (!ts) return "—"
  const d = ts.toDate()
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

function getContactName(contact?: FirestoreContact) {
  return contact?.contactName ?? contact?.name ?? "Contato"
}

function getContactPhone(contact?: FirestoreContact) {
  return contact?.contactPhone ?? contact?.phone ?? ""
}

function timeSinceOverdue(dueAt: { toDate: () => Date } | null) {
  if (!dueAt) return null
  const diff = Date.now() - dueAt.toDate().getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return "Venceu hoje"
  if (days === 1) return "Venceu ontem"
  return `Vencido há ${days} dias`
}

// ─── Info Block ─────────────────────────────────────────────────────────────

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
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-[13px] font-medium text-foreground truncate">{value}</p>
    </div>
  )
}

// ─── Main Modal ─────────────────────────────────────────────────────────────

interface ChargeDetailModalProps {
  open: boolean
  onClose: () => void
  charge: OverdueChargeWithContact
}

export function ChargeDetailModal({ open, onClose, charge }: ChargeDetailModalProps) {
  const tenantId = useAuthStore((s) => s.tenantId)
  const [copied, setCopied] = useState(false)

  const contactName = getContactName(charge.contact)
  const contactPhone = getContactPhone(charge.contact)

  const firestoreContact = useMemo<FirestoreContact>(
    () => ({
      id: charge.contactId,
      contactName,
      contactPhone,
      status: charge.contact?.status ?? "ACTIVE",
      updatedAt: Timestamp.now(),
    }),
    [charge.contactId, contactName, contactPhone, charge.contact?.status],
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

  const overdueLabel = timeSinceOverdue(charge.dueAt)

  const handleCopyPix = async () => {
    if (!charge.pixCopyPaste) return
    await navigator.clipboard.writeText(charge.pixCopyPaste)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
        className="w-full max-w-[1100px] h-[calc(100vh-1rem)] sm:h-[calc(100vh-1.5rem)] rounded-2xl border border-white/[0.08] bg-background shadow-2xl overflow-hidden flex flex-row"
      >
        {/* ═══ Left panel — Charge Info ═══ */}
        <div className="w-[380px] shrink-0 flex flex-col border-r border-white/[0.06] overflow-hidden">
          {/* Header */}
          <div className="px-5 pt-5 pb-4 border-b border-white/[0.06] shrink-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-orange-500/[0.08] border border-orange-500/10 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-orange-400/60" weight="bold" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold text-foreground truncate">
                    {contactName}
                  </h3>
                  {contactPhone && (
                    <p className="text-[12px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                      <Phone className="h-3 w-3 shrink-0" />
                      {formatPhone(contactPhone)}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 -m-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" weight="bold" />
              </button>
            </div>

            {/* Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/[0.08] px-2.5 py-0.5 text-[10px] font-medium text-orange-400">
                <Warning className="h-2.5 w-2.5" weight="fill" />
                Vencido
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.02] px-2 py-0.5 text-[10px] text-muted-foreground">
                <CurrencyDollar className="h-2.5 w-2.5" />
                {formatCurrency(charge.amount)}
              </span>
              {charge.dueAt && (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.02] px-2 py-0.5 text-[10px] text-muted-foreground">
                  <CalendarBlank className="h-2.5 w-2.5" />
                  {formatDate(charge.dueAt)}
                </span>
              )}
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Overdue indicator */}
            {overdueLabel && (
              <div className="flex items-center gap-2 rounded-xl bg-orange-500/[0.06] border border-orange-500/15 px-3 py-2.5">
                <Clock className="h-3.5 w-3.5 text-orange-400 shrink-0" weight="bold" />
                <span className="text-[12px] font-medium text-orange-400">{overdueLabel}</span>
              </div>
            )}

            {/* Description */}
            <InfoBlock icon={CurrencyDollar} label="Descrição" value={charge.description} />

            {/* Amount + Due Date */}
            <div className="grid grid-cols-2 gap-2.5">
              <InfoBlock icon={CurrencyDollar} label="Valor" value={formatCurrency(charge.amount)} />
              <InfoBlock icon={CalendarBlank} label="Vencimento" value={charge.dueAt ? formatDate(charge.dueAt) : "—"} />
            </div>

            {/* PIX copy-paste */}
            {charge.pixCopyPaste && (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Copy className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Código PIX</span>
                  </div>
                  <button
                    onClick={handleCopyPix}
                    className="flex items-center gap-1 text-[10px] font-medium text-accent hover:text-accent/80 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copiar
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-white/50 font-mono break-all line-clamp-3">
                  {charge.pixCopyPaste}
                </p>
              </div>
            )}

            {/* Context hint */}
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-3">
              <p className="text-[11px] text-white/30 leading-relaxed">
                Veja a conversa ao lado para entender o contexto da cobrança e entrar em contato com o paciente se necessário.
              </p>
            </div>
          </div>
        </div>

        {/* ═══ Right panel — Chat ═══ */}
        <div className="flex-1 min-w-0 flex flex-col">
          {tenantId ? (
            <ChatView contact={firestoreContact} tenantId={tenantId} />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="h-5 w-5 rounded-full border-[1.5px] border-white/10 border-t-accent/60 animate-spin" />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
