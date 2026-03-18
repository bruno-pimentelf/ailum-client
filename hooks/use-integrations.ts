import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  integrationsApi,
  type ZapiSaveInput,
  type AsaasSaveInput,
  type Provider,
  type ZapiSetDefaultInput,
  type ZapiSyncRoutingInput,
  type ZapiContactRoutingInput,
} from "@/lib/api/integrations"

export const INTEGRATIONS_KEY = ["integrations"] as const
export const ZAPI_STATUS_KEY = ["integrations", "zapi", "status"] as const

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

export function useSetZapiDefault() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ZapiSetDefaultInput) => integrationsApi.setZapiDefault(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INTEGRATIONS_KEY })
      qc.invalidateQueries({ queryKey: ZAPI_STATUS_KEY })
    },
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
