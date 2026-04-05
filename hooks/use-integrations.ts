import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  integrationsApi,
  type ZapiSaveInput,
  type UazapiSaveInput,
  type AsaasSaveInput,
  type Provider,
  type WhatsAppProvider,
  type RinneOnboardInput,
  type ZapiSyncRoutingInput,
  type ZapiContactRoutingInput,
} from "@/lib/api/integrations"

export const INTEGRATIONS_KEY = ["integrations"] as const
export const ZAPI_STATUS_KEY = ["integrations", "zapi", "status"] as const
export const UAZAPI_STATUS_KEY = ["integrations", "uazapi", "status"] as const

/**
 * Full list of integrations for the active org.
 */
export function useIntegrations() {
  return useQuery({
    queryKey: INTEGRATIONS_KEY,
    queryFn: integrationsApi.list,
  })
}

/**
 * Single integration by provider, derived from the cached list.
 */
export function useIntegration(provider: Provider) {
  return useQuery({
    queryKey: INTEGRATIONS_KEY,
    queryFn: integrationsApi.list,
    select: (data) => data.find((i) => i.provider === provider) ?? null,
  })
}

/**
 * Z-API connection status.
 * `enabled` controls whether polling is active.
 * `refetchInterval` drives automatic polling (e.g. while scanning QR code).
 */
export function useZapiStatus(options?: { enabled?: boolean; refetchInterval?: number; instanceId?: string }) {
  return useQuery({
    queryKey: [...ZAPI_STATUS_KEY, options?.instanceId ?? "default"],
    queryFn: () => integrationsApi.zapiStatus({ instanceId: options?.instanceId }),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
    refetchOnWindowFocus: true,
  })
}

/**
 * Z-API QR code (base64 image). Fetched on demand — not cached long.
 * The caller should poll manually or use refetch().
 */
export function useZapiQrCode(options?: { enabled?: boolean; instanceId?: string }) {
  return useQuery({
    queryKey: ["integrations", "zapi", "qrcode", options?.instanceId ?? "default"],
    queryFn: () => integrationsApi.zapiQrCode(options?.instanceId),
    enabled: options?.enabled ?? false,
    // QR code expires every 20s — keep stale immediately so refetch always fires
    staleTime: 0,
    gcTime: 0,
    retry: false,
  })
}

export function useSaveZapi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ZapiSaveInput) => integrationsApi.saveZapi(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: INTEGRATIONS_KEY }),
  })
}

export function useSyncZapiContactRouting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ZapiSyncRoutingInput) => integrationsApi.zapiSyncContactRouting(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts-list"] })
      qc.invalidateQueries({ queryKey: ["contacts"] })
    },
  })
}

export function useOverrideContactZapiRouting(contactId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ZapiContactRoutingInput) => {
      if (!contactId) throw new Error("Contato inválido")
      return integrationsApi.zapiOverrideContactRouting(contactId, input)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts-list"] })
      qc.invalidateQueries({ queryKey: ["contacts"] })
    },
  })
}

export function useZapiDisconnect() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: integrationsApi.zapiDisconnect,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ZAPI_STATUS_KEY })
      qc.invalidateQueries({ queryKey: INTEGRATIONS_KEY })
    },
  })
}

export function useZapiRestart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: integrationsApi.zapiRestart,
    onSuccess: () => qc.invalidateQueries({ queryKey: ZAPI_STATUS_KEY }),
  })
}

// ── Provider-aware hooks (work for both zapi and uazapi) ─────────────────────

export function useWhatsAppStatus(provider: WhatsAppProvider, options?: { enabled?: boolean; refetchInterval?: number; instanceId?: string }) {
  const statusKey = provider === "uazapi" ? UAZAPI_STATUS_KEY : ZAPI_STATUS_KEY
  const statusFn = provider === "uazapi" ? integrationsApi.uazapiStatus : integrationsApi.zapiStatus
  return useQuery({
    queryKey: [...statusKey, options?.instanceId ?? "default"],
    queryFn: () => statusFn({ instanceId: options?.instanceId }),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
    refetchOnWindowFocus: true,
  })
}

export function useWhatsAppQrCode(provider: WhatsAppProvider, options?: { enabled?: boolean; instanceId?: string }) {
  const qrFn = provider === "uazapi" ? integrationsApi.uazapiQrCode : integrationsApi.zapiQrCode
  return useQuery({
    queryKey: ["integrations", provider, "qrcode", options?.instanceId ?? "default"],
    queryFn: () => qrFn(options?.instanceId),
    enabled: options?.enabled ?? false,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  })
}

export function useSaveWhatsAppInstance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { provider: WhatsAppProvider } & (ZapiSaveInput | UazapiSaveInput)) => {
      const { provider, ...body } = input
      if (provider === "uazapi") return integrationsApi.saveUazapi(body as UazapiSaveInput)
      return integrationsApi.saveZapi(body as ZapiSaveInput)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: INTEGRATIONS_KEY }),
  })
}

export function useWhatsAppDisconnect(provider: WhatsAppProvider) {
  const qc = useQueryClient()
  const statusKey = provider === "uazapi" ? UAZAPI_STATUS_KEY : ZAPI_STATUS_KEY
  return useMutation({
    mutationFn: (body?: { instanceId?: string }) =>
      provider === "uazapi"
        ? integrationsApi.uazapiDisconnect(body)
        : integrationsApi.zapiDisconnect(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: statusKey })
      qc.invalidateQueries({ queryKey: INTEGRATIONS_KEY })
    },
  })
}

export function useWhatsAppRestart(provider: WhatsAppProvider) {
  const qc = useQueryClient()
  const statusKey = provider === "uazapi" ? UAZAPI_STATUS_KEY : ZAPI_STATUS_KEY
  return useMutation({
    mutationFn: (body?: { instanceId?: string }) =>
      provider === "uazapi"
        ? integrationsApi.uazapiRestart(body)
        : integrationsApi.zapiRestart(),
    onSuccess: () => qc.invalidateQueries({ queryKey: statusKey }),
  })
}

export function useDeleteWhatsAppInstance(provider: WhatsAppProvider) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (instanceId: string) =>
      provider === "uazapi"
        ? integrationsApi.deleteUazapiInstance(instanceId)
        : integrationsApi.deleteZapiInstance(instanceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INTEGRATIONS_KEY })
      qc.invalidateQueries({ queryKey: provider === "uazapi" ? UAZAPI_STATUS_KEY : ZAPI_STATUS_KEY })
    },
  })
}

// ── Asaas ────────────────────────────────────────────────────────────────────

export function useRinneOnboard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: RinneOnboardInput) => integrationsApi.rinneOnboard(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INTEGRATIONS_KEY })
      qc.invalidateQueries({ queryKey: ["integrations", "rinne", "status"] })
    },
  })
}

export function useRinneStatus(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["integrations", "rinne", "status"],
    queryFn: integrationsApi.rinneStatus,
    enabled: options?.enabled ?? true,
    refetchInterval: 30_000,
  })
}

export function useSaveAsaas() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: AsaasSaveInput) => integrationsApi.saveAsaas(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: INTEGRATIONS_KEY }),
  })
}

export function useRemoveIntegration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (provider: Provider) => integrationsApi.remove(provider),
    onSuccess: () => qc.invalidateQueries({ queryKey: INTEGRATIONS_KEY }),
  })
}

export function useDeleteZapiInstance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (instanceId: string) => integrationsApi.deleteZapiInstance(instanceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INTEGRATIONS_KEY })
      qc.invalidateQueries({ queryKey: ZAPI_STATUS_KEY })
    },
  })
}
