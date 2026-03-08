import { createAuthClient } from "better-auth/client"
import { organizationClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "https://api.ailum.io",
  basePath: "/auth",
  plugins: [organizationClient()],
  fetchOptions: {
    credentials: "include",
  },
})

export type Session = typeof authClient.$Infer.Session
export type User = typeof authClient.$Infer.Session["user"]
