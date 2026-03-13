import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  financeApi,
  type AsaasCustomerListParams,
  type AsaasPaymentListParams,
  type ScheduleInvoiceInput,
} from "@/lib/api/finance"

const FINANCE_KEY = ["finance"] as const

export function useFinanceBalance(options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: [...FINANCE_KEY, "balance"],
    queryFn: () => financeApi.balance(),
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
