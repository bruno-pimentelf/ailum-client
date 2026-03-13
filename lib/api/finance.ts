import { apiFetch } from "@/lib/api"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FinanceBalance {
  balance: number
}

export interface AsaasCustomer {
  id: string
  name: string
  email: string | null
  phone: string | null
  cpfCnpj: string | null
  externalReference: string | null
  dateCreated: string
}

export interface AsaasCustomerList {
  object: "list"
  hasMore: boolean
  totalCount: number
  limit: number
  offset: number
  data: AsaasCustomer[]
}

export interface AsaasPayment {
  id: string
  dateCreated: string
  customer: string
  value: number
  netValue?: number
  billingType: string
  status: string
  dueDate: string | null
  paymentDate: string | null
  description: string | null
  externalReference: string | null
  invoiceUrl: string | null
}

export interface AsaasPaymentList {
  object: "list"
  hasMore: boolean
  totalCount: number
  limit: number
  offset: number
  data: AsaasPayment[]
}

export interface MunicipalOption {
  id: string
  code: string
  name: string
}

export interface MunicipalOptionsResponse {
  data: MunicipalOption[]
}

export interface InvoiceTaxes {
  retainIss: boolean
  iss: number
  pis: number
  cofins: number
  csll: number
  inss: number
  ir: number
}

export interface ScheduleInvoiceInput {
  payment: string
  serviceDescription: string
  observations: string
  value: number
  deductions?: number
  effectiveDate: string
  municipalServiceName: string
  municipalServiceId?: string
  municipalServiceCode?: string
  externalReference?: string
  updatePayment?: boolean
  taxes: InvoiceTaxes
}

export interface ScheduleInvoiceResult {
  id: string
  status: string
  payment: string
  value: number
  pdfUrl: string | null
  xmlUrl: string | null
}

export interface AsaasCustomerListParams {
  offset?: number
  limit?: number
  name?: string
  email?: string
  cpfCnpj?: string
  externalReference?: string
}

export interface AsaasPaymentListParams {
  offset?: number
  limit?: number
  customer?: string
  billingType?: string
  status?: string
  externalReference?: string
  dateCreatedGe?: string
  dateCreatedLe?: string
  dueDateGe?: string
  dueDateLe?: string
  paymentDateGe?: string
  paymentDateLe?: string
}

// ─── Query params builder ──────────────────────────────────────────────────────

function buildQuery(params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "") qs.set(k, String(v))
  })
  const s = qs.toString()
  return s ? `?${s}` : ""
}

// ─── API ───────────────────────────────────────────────────────────────────────

export const financeApi = {
  balance: () =>
    apiFetch<FinanceBalance>("/integrations/asaas/finance/balance"),

  customers: (params?: AsaasCustomerListParams) =>
    apiFetch<AsaasCustomerList>(`/integrations/asaas/customers${buildQuery((params ?? {}) as Record<string, string | number | undefined>)}`),

  payments: (params?: AsaasPaymentListParams) =>
    apiFetch<AsaasPaymentList>(`/integrations/asaas/payments${buildQuery((params ?? {}) as Record<string, string | number | undefined>)}`),

  municipalOptions: () =>
    apiFetch<MunicipalOptionsResponse>("/integrations/asaas/municipal-options"),

  scheduleInvoice: (body: ScheduleInvoiceInput) =>
    apiFetch<ScheduleInvoiceResult>("/integrations/asaas/invoices", {
      method: "POST",
      body,
    }),
}
