import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  financeApi,
  type AsaasCustomerListParams,
  type AsaasPaymentListParams,
  type AsaasPaymentLinkListParams,
  type AsaasSubscriptionListParams,
  type CreatePaymentLinkInput,
  type CreateSubscriptionInput,
  type ScheduleInvoiceInput,
} from "@/lib/api/finance"

const FINANCE_KEY = ["finance"] as const

/**
 * Tries Rinne (Ailum Pay) first, falls back to Asaas.
 * Returns whichever succeeds with a `provider` field.
 */
async function fetchBalance() {
  try {
    const rinne = await financeApi.rinneBalance()
    return { ...rinne, provider: "rinne" as const }
  } catch {
    // Rinne not configured — try Asaas
  }
  const asaas = await financeApi.balance()
  return { ...asaas, provider: "asaas" as const }
}

export function useFinanceBalance(options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: [...FINANCE_KEY, "balance"],
    queryFn: fetchBalance,
    refetchInterval: options?.refetchInterval ?? 60_000,
  })
}

export function useAsaasCustomers(params?: AsaasCustomerListParams) {
  return useQuery({
    queryKey: [...FINANCE_KEY, "customers", params],
    queryFn: () => financeApi.customers(params),
  })
}

export function useAsaasPayments(params?: AsaasPaymentListParams) {
  return useQuery({
    queryKey: [...FINANCE_KEY, "payments", params],
    queryFn: () => financeApi.payments(params),
  })
}

export function useMunicipalOptions() {
  return useQuery({
    queryKey: [...FINANCE_KEY, "municipal-options"],
    queryFn: () => financeApi.municipalOptions(),
  })
}

export function useScheduleInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ScheduleInvoiceInput) => financeApi.scheduleInvoice(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FINANCE_KEY })
    },
  })
}

export function usePaymentLinks(params?: AsaasPaymentLinkListParams) {
  return useQuery({
    queryKey: [...FINANCE_KEY, "payment-links", params],
    queryFn: () => financeApi.paymentLinks(params),
  })
}

export function usePaymentLink(id: string | null) {
  return useQuery({
    queryKey: [...FINANCE_KEY, "payment-link", id],
    queryFn: () => (id ? financeApi.paymentLink(id) : Promise.reject()),
    enabled: !!id,
  })
}

export function useCreatePaymentLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreatePaymentLinkInput) => financeApi.createPaymentLink(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FINANCE_KEY })
    },
  })
}

export function useSubscriptions(params?: AsaasSubscriptionListParams) {
  return useQuery({
    queryKey: [...FINANCE_KEY, "subscriptions", params],
    queryFn: () => financeApi.subscriptions(params),
  })
}

export function useCreateSubscription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateSubscriptionInput) => financeApi.createSubscription(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FINANCE_KEY })
    },
  })
}
