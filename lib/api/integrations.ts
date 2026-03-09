import { apiFetch } from "@/lib/api"

// ─── Types ────────────────────────────────────────────────────────────────────

export type Provider = "zapi" | "asaas" | "elevenlabs"

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

// ─── API functions ────────────────────────────────────────────────────────────

export const integrationsApi = {
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
