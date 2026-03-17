import { apiFetch } from "@/lib/api"

// ─── Types ────────────────────────────────────────────────────────────────────

export type Provider = "zapi" | "asaas" | "infinitepay" | "elevenlabs"

export type Integration = {
  provider: Provider
  instanceId: string | null
  webhookToken: string | null
  isActive: boolean
  hasApiKey: boolean
}

export type ZapiSaveInput = {
  instanceId: string
  instanceToken: string
}

export type ZapiSaveResult = Integration & {
  webhooksConfigured: boolean
  webhooksError: string | null
}

export type ZapiStatus = {
  connected: boolean
  smartphoneConnected: boolean
  error: string | null
}

export type ZapiQrCode = {
  value: string // data:image/png;base64,...
}

export type AsaasSaveInput = {
  apiKey: string
}

export type InfinitePayPlan = {
  id: string
  name: string
  amountCents: number
  amountFormatted: string
  interval: string
  quantity: number
  description: string
}

export type InfinitePayPlansResponse = {
  currency: string
  plans: InfinitePayPlan[]
}

export type InfinitePayCustomer = {
  id: string
  name: string
  email?: string | null
  phoneNumber?: string | null
}

export type InfinitePayCustomerListResponse =
  | InfinitePayCustomer[]
  | { data: InfinitePayCustomer[] }

export type InfinitePayCustomerInput = {
  name: string
  email?: string
  phoneNumber?: string
}

export type InfinitePayCheckoutLinkInput = {
  planId?: string
  contactId?: string
  orderNsu?: string
  redirectUrl?: string
  webhookUrl?: string
  amountCents?: number
  description?: string
  quantity?: number
  customer?: InfinitePayCustomerInput
}

export type InfinitePayCheckoutLinkResult = {
  url?: string
  checkoutUrl?: string
  link?: string
  slug?: string
  orderNsu?: string
  transactionNsu?: string
  [key: string]: unknown
}

export type InfinitePayPaymentCheckInput = {
  orderNsu?: string
  transactionNsu?: string
  slug?: string
}

export type InfinitePayPaymentCheckResult = {
  status?: string
  paid?: boolean
  [key: string]: unknown
}

// ─── API functions ────────────────────────────────────────────────────────────

export const integrationsApi = {
  infinitePayCustomers: (params?: { search?: string; limit?: number }) => {
    const qs = new URLSearchParams()
    if (params?.search) qs.set("search", params.search)
    if (params?.limit) qs.set("limit", String(params.limit))
    const suffix = qs.toString()
    return apiFetch<InfinitePayCustomerListResponse>(
      `/integrations/infinitepay/customers${suffix ? `?${suffix}` : ""}`
    )
  },

  infinitePayPlans: () =>
    apiFetch<InfinitePayPlansResponse>("/integrations/infinitepay/plans"),

  createInfinitePayCheckoutLink: (body: InfinitePayCheckoutLinkInput) =>
    apiFetch<InfinitePayCheckoutLinkResult>("/integrations/infinitepay/checkout-links", {
      method: "POST",
      body,
    }),

  checkInfinitePayPayment: (body: InfinitePayPaymentCheckInput) =>
    apiFetch<InfinitePayPaymentCheckResult>("/integrations/infinitepay/payment-check", {
      method: "POST",
      body,
    }),

  list: () =>
    apiFetch<Integration[]>("/integrations"),

  saveZapi: (body: ZapiSaveInput) =>
    apiFetch<ZapiSaveResult>("/integrations/zapi", { method: "PUT", body }),

  zapiStatus: () =>
    apiFetch<ZapiStatus>("/integrations/zapi/status"),

  zapiQrCode: () =>
    apiFetch<ZapiQrCode>("/integrations/zapi/qrcode"),

  zapiDisconnect: () =>
    apiFetch<{ disconnected: boolean }>("/integrations/zapi/disconnect", { method: "POST" }),

  zapiRestart: () =>
    apiFetch<{ restarted: boolean }>("/integrations/zapi/restart", { method: "POST" }),

  saveAsaas: (body: AsaasSaveInput) =>
    apiFetch<Integration>("/integrations/asaas", { method: "PUT", body }),

  remove: (provider: Provider) =>
    apiFetch<void>(`/integrations/${provider}`, { method: "DELETE" }),
}
