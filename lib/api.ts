/**
 * Base API client for all /v1/* requests.
 *
 * - All requests are sent with credentials: 'include' (session cookie).
 * - Non-2xx responses are thrown as ApiError so TanStack Query can catch them.
 * - Add domain-specific modules under lib/api/ (e.g. lib/api/integrations.ts).
 */

export const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL ?? "https://api.ailum.io") + "/v1"

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown
  ) {
    super(message)
    this.name = "ApiError"
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, headers, ...rest } = options

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...rest,
  })

  if (res.status === 204) return undefined as T

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const message =
      (data as { message?: string } | null)?.message ??
      `API error ${res.status}`
    throw new ApiError(res.status, message, data)
  }

  return data as T
}
