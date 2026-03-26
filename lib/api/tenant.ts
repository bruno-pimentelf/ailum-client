import { apiFetch } from "@/lib/api"

export interface Tenant {
  id: string
  name: string
  slug: string
  plan: string
  logoUrl: string | null
  description: string | null
  phone: string | null
  email: string | null
  website: string | null
  addressStreet: string | null
  addressNumber: string | null
  addressComplement: string | null
  addressNeighborhood: string | null
  addressCity: string | null
  addressState: string | null
  addressZip: string | null
  agentBasePrompt: string | null
  guardrailRules: string | null
  pixTerms: string | null
  isAgentEnabledForWhatsApp?: boolean
  isAgentTestMode?: boolean
  agentTestPhones?: string[]
  isSlotRecallEnabled?: boolean
  customMemoryKeys?: Array<{ key: string; description: string }> | null
  notificationsEnabled?: boolean
  notificationTypes?: string[]
  notificationDigestMinutes?: number
  notificationRoles?: string[]
  createdAt: string
}

export type TenantUpdateInput = Partial<
  Pick<
    Tenant,
    | "name"
    | "description"
    | "phone"
    | "email"
    | "website"
    | "logoUrl"
    | "addressStreet"
    | "addressNumber"
    | "addressComplement"
    | "addressNeighborhood"
    | "addressCity"
    | "addressState"
    | "addressZip"
    | "agentBasePrompt"
    | "guardrailRules"
    | "pixTerms"
    | "isAgentEnabledForWhatsApp"
    | "isAgentTestMode"
    | "agentTestPhones"
    | "isSlotRecallEnabled"
    | "customMemoryKeys"
    | "notificationsEnabled"
    | "notificationTypes"
    | "notificationDigestMinutes"
    | "notificationRoles"
  >
>

export const tenantApi = {
  get: () => apiFetch<Tenant>("/tenant"),
  update: (body: TenantUpdateInput) =>
    apiFetch<Tenant>("/tenant", { method: "PATCH", body }),
}
