import { ApiError } from "@/lib/api"

const PUBLIC_API_BASE =
  (process.env.NEXT_PUBLIC_API_URL ?? "https://api.ailum.io") + "/v1/public"

async function publicFetch<T = unknown>(
  path: string,
  options: Omit<RequestInit, "body"> & { body?: unknown } = {}
): Promise<T> {
  const { body, headers, ...rest } = options

  const res = await fetch(`${PUBLIC_API_BASE}${path}`, {
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...rest,
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const message =
      (data as { message?: string } | null)?.message ??
      `API error ${res.status}`
    throw new ApiError(res.status, message, data)
  }

  return data as T
}

export type PublicAilumPlan = {
  id: string
  name?: string
  amountCents: number
  amountFormatted?: string
  monthlyDisplay?: string
  description?: string
  features?: string[]
  quantity?: number
  sellerHandle?: string
  interval?: string
}

export type PublicAilumPlansResponse = PublicAilumPlan | { plans: PublicAilumPlan[] }

export type PublicCheckoutLinkInput = {
  clinicName: string
  email: string
  phoneNumber: string
  planId?: string
  amountCents?: number
  description?: string
  quantity?: number
  redirectUrl?: string
}

export type PublicCheckoutLinkResponse = {
  orderNsu?: string
  plan?: {
    id?: string
    name?: string
    amountCents?: number
    description?: string
    quantity?: number
  }
  checkout?: Record<string, unknown>
  [key: string]: unknown
}

export type PublicPaymentCheckInput = {
  orderNsu?: string
  transactionNsu?: string
  slug?: string
}

export type PublicPaymentCheckResponse = {
  paid?: boolean
  status?: string
  amount?: number
  [key: string]: unknown
}

export const publicCheckoutApi = {
  plans: () => publicFetch<PublicAilumPlansResponse>("/ailum/plans"),

  createCheckoutLink: (body: PublicCheckoutLinkInput) =>
    publicFetch<PublicCheckoutLinkResponse>("/ailum/checkout-links", {
      method: "POST",
      body,
    }),

  paymentCheck: (body: PublicPaymentCheckInput) =>
    publicFetch<PublicPaymentCheckResponse>("/ailum/payment-check", {
      method: "POST",
      body,
    }),
}
