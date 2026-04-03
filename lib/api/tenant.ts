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
  reminder48hEnabled?: boolean
  reminder24hEnabled?: boolean
  reminder2hEnabled?: boolean
  reminder1hEnabled?: boolean
  customMemoryKeys?: Array<{ key: string; description: string }> | null
  notificationsEnabled?: boolean
  notificationTypes?: string[]
  notificationDigestMinutes?: number
  notificationRoles?: string[]
  notificationPhone?: string | null
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
    | "reminder48hEnabled"
    | "reminder24hEnabled"
    | "reminder2hEnabled"
    | "reminder1hEnabled"
    | "customMemoryKeys"
    | "notificationsEnabled"
    | "notificationTypes"
    | "notificationDigestMinutes"
    | "notificationRoles"
    | "notificationPhone"
  >
>

export const tenantApi = {
  get: () => apiFetch<Tenant>("/tenant"),
  update: (body: TenantUpdateInput) =>
    apiFetch<Tenant>("/tenant", { method: "PATCH", body }),
}
