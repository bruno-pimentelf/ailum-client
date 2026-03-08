import { createAuthClient } from "better-auth/client"
import { organizationClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
  basePath: "/auth",
  plugins: [organizationClient()],
})

export type Session = typeof authClient.$Infer.Session
export type User = typeof authClient.$Infer.Session["user"]
