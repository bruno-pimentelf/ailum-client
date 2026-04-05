import { apiFetch } from "@/lib/api"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FinanceBalance {
  balance: number
  blockedBalance?: number
  totalBalance?: number
  provider?: "asaas" | "rinne"
}

export interface RinneStatementItem {
  movement_id: string | null
  occurred_at: string
  amount: number
  type: "CREDIT" | "DEBIT"
  movement_type: string
  status_description: string | null
  balanceBefore: number | null
  balanceAfter: number | null
  name_credit: string | null
  name_debit: string | null
}

export interface RinneStatement {
  items: RinneStatementItem[]
  page: number
  pageSize: number
  total: number
  totalPages: number
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

// ─── Payment Links ─────────────────────────────────────────────────────────────

export interface AsaasPaymentLink {
  id: string
  name: string
  url: string
  value?: number
  chargeType: string
  billingType: string
  viewCount?: number
  active: boolean
  description?: string
  externalReference?: string
}

export interface AsaasPaymentLinkList {
  object: "list"
  hasMore: boolean
  totalCount: number
  limit: number
  offset: number
  data: AsaasPaymentLink[]
}

export interface AsaasPaymentLinkListParams {
  offset?: number
  limit?: number
  active?: boolean
  name?: string
  externalReference?: string
}

export interface CreatePaymentLinkInput {
  name: string
  description?: string
  value?: number
  billingType: "UNDEFINED" | "PIX" | "BOLETO" | "CREDIT_CARD"
  chargeType: "DETACHED" | "INSTALLMENT" | "RECURRENT"
  dueDateLimitDays?: number
  externalReference?: string
  subscriptionCycle?: string
  maxInstallmentCount?: number
  callback?: { successUrl?: string; autoRedirect?: boolean }
}

// ─── Subscriptions ─────────────────────────────────────────────────────────────

export interface AsaasSubscription {
  id: string
  customer: string
  value: number
  cycle: string
  nextDueDate: string
  status: string
  description?: string
  billingType: string
}

export interface AsaasSubscriptionList {
  object: "list"
  hasMore: boolean
  totalCount: number
  limit: number
  offset: number
  data: AsaasSubscription[]
}

export interface AsaasSubscriptionListParams {
  offset?: number
  limit?: number
  customer?: string
  billingType?: string
  status?: string
  externalReference?: string
}

export interface CreateSubscriptionInput {
  customer: string
  billingType: "BOLETO" | "CREDIT_CARD" | "PIX" | "UNDEFINED"
  value: number
  nextDueDate: string
  cycle: "WEEKLY" | "MONTHLY" | "BIMONTHLY" | "QUARTERLY" | "SEMIANNUALLY" | "YEARLY"
  description?: string
  externalReference?: string
}

// ─── Query params builder ──────────────────────────────────────────────────────

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
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

  rinneBalance: () =>
    apiFetch<FinanceBalance>("/integrations/rinne/balance"),

  rinneStatement: (params: { dateFrom: string; dateTo: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams({ dateFrom: params.dateFrom, dateTo: params.dateTo })
    if (params.page) qs.set("page", String(params.page))
    if (params.limit) qs.set("limit", String(params.limit))
    return apiFetch<RinneStatement>(`/integrations/rinne/statement?${qs.toString()}`)
  },

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

  paymentLinks: (params?: AsaasPaymentLinkListParams) =>
    apiFetch<AsaasPaymentLinkList>(`/integrations/asaas/payment-links${buildQuery((params ?? {}) as Record<string, string | number | boolean | undefined>)}`),

  paymentLink: (id: string) =>
    apiFetch<AsaasPaymentLink>(`/integrations/asaas/payment-links/${id}`),

  createPaymentLink: (body: CreatePaymentLinkInput) =>
    apiFetch<AsaasPaymentLink>("/integrations/asaas/payment-links", {
      method: "POST",
      body,
    }),

  subscriptions: (params?: AsaasSubscriptionListParams) =>
    apiFetch<AsaasSubscriptionList>(`/integrations/asaas/subscriptions${buildQuery((params ?? {}) as Record<string, string | number | undefined>)}`),

  createSubscription: (body: CreateSubscriptionInput) =>
    apiFetch<AsaasSubscription>("/integrations/asaas/subscriptions", {
      method: "POST",
      body,
    }),
}
