"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check, FileText } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import {
  useScheduleInvoice,
  useMunicipalOptions,
} from "@/hooks/use-finance"
import type { AsaasPayment } from "@/lib/api/finance"
import { useIntegration } from "@/hooks/use-integrations"

const DEFAULT_TAXES = {
  retainIss: true,
  iss: 2,
  pis: 0.65,
  cofins: 3,
  csll: 0,
  inss: 0,
  ir: 0,
}

interface InvoiceModalProps {
  open: boolean
  onClose: () => void
  payment: AsaasPayment | null
}

export function InvoiceModal({ open, onClose, payment }: InvoiceModalProps) {
  const [serviceDescription, setServiceDescription] = useState("")
  const [observations, setObservations] = useState("")
  const [municipalServiceId, setMunicipalServiceId] = useState("")
  const [effectiveDate, setEffectiveDate] = useState(() =>
    new Date().toISOString().split("T")[0]
  )

  const schedule = useScheduleInvoice()
  const { data: municipalData } = useMunicipalOptions()
  const asaasConfigured = !!useIntegration("asaas").data?.hasApiKey

  useEffect(() => {
    if (payment) {
      setServiceDescription(payment.description || "")
      setObservations(`Cobrança recebida em ${payment.paymentDate || payment.dateCreated}`)
    }
  }, [payment])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payment || !serviceDescription.trim() || !observations.trim()) return
    const opt = municipalData?.data?.find((o) => o.id === municipalServiceId)
    const municipalServiceName = opt?.name ?? "Serviço"
    const municipalServiceCode = opt?.code

    await schedule.mutateAsync({
      payment: payment.id,
      serviceDescription: serviceDescription.trim(),
      observations: observations.trim(),
      value: payment.value,
      deductions: 0,
      effectiveDate,
      municipalServiceName,
      municipalServiceId: municipalServiceId || undefined,
      municipalServiceCode: municipalServiceCode || undefined,
      taxes: DEFAULT_TAXES,
    })
    onClose()
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border/60 bg-card p-6 shadow-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent" weight="duotone" />
            <h2 className="text-base font-semibold">Emitir nota fiscal</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {payment && (
          <div className="mb-4 rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-sm">
            <p className="font-medium">Cobrança {payment.id}</p>
            <p className="text-muted-foreground">
              R$ {payment.value.toLocaleString("pt-BR")} · {payment.description || "—"}
            </p>
          </div>
        )}

        {!asaasConfigured ? (
          <p className="text-sm text-muted-foreground">
            Configure a integração Asaas em Configurações → Conexões.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Descrição do serviço
              </label>
              <input
                value={serviceDescription}
                onChange={(e) => setServiceDescription(e.target.value)}
                required
                className="w-full rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-sm"
                placeholder="Ex: Consulta médica - Dermatologia"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Observações
              </label>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                required
                rows={2}
                className="w-full rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-sm resize-none"
                placeholder="Ex: Consulta realizada em 16/03/2026"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Serviço municipal
              </label>
              <select
                value={municipalServiceId}
                onChange={(e) => setMunicipalServiceId(e.target.value)}
                className="w-full rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-sm"
              >
                <option value="">Selecione</option>
                {municipalData?.data?.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.code} — {o.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Data de emissão
              </label>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                required
                className="w-full rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={schedule.isPending || !serviceDescription.trim() || !observations.trim()}
              >
                {schedule.isPending ? "Agendando…" : (
                  <>
                    <Check className="h-4 w-4 mr-1.5" weight="bold" />
                    Agendar NF
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
