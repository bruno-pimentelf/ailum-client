import { apiFetch } from "@/lib/api"

// ─── Types ────────────────────────────────────────────────────────────────────

export type Provider = "zapi" | "asaas" | "infinitepay" | "elevenlabs"

export type Integration = {
  id?: string
  provider: Provider
  instanceId: string | null
  label?: string | null
  isDefault?: boolean
  webhookToken: string | null
  isActive: boolean
  hasApiKey: boolean
}

export type ZapiSaveInput = {
  instanceId: string
  instanceToken: string
  label?: string
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

export type ZapiSetDefaultInput = {
  instanceId: string
}

export type ZapiSetDefaultResult = {
  instanceId: string
  isDefault: true
}

export type ZapiSyncRoutingInput = {
  instanceId?: string
  page?: number
  pageSize?: number
  maxPages?: number
  onlyUnknown?: boolean
  upsertMissingContacts?: boolean
}

export type ZapiSyncRoutingResult = {
  scannedChats: number
  matchedContacts: number
  updatedContacts: number
  updatedContactIds: string[]
  createdContacts: number
  createdContactIds: string[]
  skippedAlreadyRouted: number
  unmatchedPhones: string[]
  syncedContacts: number
}

export type ZapiContactRoutingInput = {
  instanceId: string | null
}

export type ZapiContactRoutingResult = {
  id: string
  phone: string
  zapiInstanceId: string | null
  updatedAt: string
}

export type ZapiChatModifyInput = {
  instanceId?: string
  phone: string
  action: "read" | "unread"
}

export type ZapiProfilePictureBatchInput = {
  instanceId?: string
  phones: string[]
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

  setZapiDefault: (body: ZapiSetDefaultInput) =>
    apiFetch<ZapiSetDefaultResult>("/integrations/zapi/default", { method: "PATCH", body }),

  zapiStatus: (params?: { instanceId?: string }) => {
    const qs = new URLSearchParams()
    if (params?.instanceId) qs.set("instanceId", params.instanceId)
    const suffix = qs.toString()
    return apiFetch<ZapiStatus>(`/integrations/zapi/status${suffix ? `?${suffix}` : ""}`)
  },

  zapiMe: (params?: { instanceId?: string }) => {
    const qs = new URLSearchParams()
    if (params?.instanceId) qs.set("instanceId", params.instanceId)
    const suffix = qs.toString()
    return apiFetch<Record<string, unknown>>(`/integrations/zapi/me${suffix ? `?${suffix}` : ""}`)
  },

  zapiChats: (params?: { page?: number; pageSize?: number; instanceId?: string }) => {
    const qs = new URLSearchParams()
    if (params?.page) qs.set("page", String(params.page))
    if (params?.pageSize) qs.set("pageSize", String(params.pageSize))
    if (params?.instanceId) qs.set("instanceId", params.instanceId)
    const suffix = qs.toString()
    return apiFetch<Record<string, unknown>>(`/integrations/zapi/chats${suffix ? `?${suffix}` : ""}`)
  },

  zapiModifyChat: (body: ZapiChatModifyInput) =>
    apiFetch<Record<string, unknown>>("/integrations/zapi/chats/modify", { method: "POST", body }),

  zapiProfilePicture: (params: { phone: string; instanceId?: string }) => {
    const qs = new URLSearchParams()
    qs.set("phone", params.phone)
    if (params.instanceId) qs.set("instanceId", params.instanceId)
    return apiFetch<Record<string, unknown>>(`/integrations/zapi/profile-picture?${qs.toString()}`)
  },

  zapiProfilePicturesBatch: (body: ZapiProfilePictureBatchInput) =>
    apiFetch<{ results: Array<{ phone: string; link?: string | null; error?: string | null }> }>(
      "/integrations/zapi/profile-pictures/batch",
      { method: "POST", body }
    ),

  zapiSyncContactRouting: (body: ZapiSyncRoutingInput) =>
    apiFetch<ZapiSyncRoutingResult>("/integrations/zapi/chats/sync-contact-routing", { method: "POST", body }),

  zapiOverrideContactRouting: (contactId: string, body: ZapiContactRoutingInput) =>
    apiFetch<ZapiContactRoutingResult>(`/integrations/zapi/contacts/${contactId}/routing`, { method: "PATCH", body }),

  zapiQrCode: (instanceId?: string) => {
    const qs = new URLSearchParams()
    if (instanceId) qs.set("instanceId", instanceId)
    const suffix = qs.toString()
    return apiFetch<ZapiQrCode>(`/integrations/zapi/qrcode${suffix ? `?${suffix}` : ""}`)
  },

  zapiDisconnect: () =>
    apiFetch<{ disconnected: boolean }>("/integrations/zapi/disconnect", { method: "POST" }),

  zapiRestart: () =>
    apiFetch<{ restarted: boolean }>("/integrations/zapi/restart", { method: "POST" }),

  saveAsaas: (body: AsaasSaveInput) =>
    apiFetch<Integration>("/integrations/asaas", { method: "PUT", body }),

  remove: (provider: Provider) =>
    apiFetch<void>(`/integrations/${provider}`, { method: "DELETE" }),
}
