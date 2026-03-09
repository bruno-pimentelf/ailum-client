"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { useAuthStore } from "@/lib/auth-store"
import { signInToFirebase } from "@/lib/firebase-auth"

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { setUser, setOrgs, setActiveOrgId, setTenantId, setFirebaseReady } = useAuthStore()

  useEffect(() => {
    async function hydrate() {
      const { data: session } = await authClient.getSession()

      if (!session?.user) {
        window.location.href = "/login"
        return
      }

      setUser({
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      })

      const { data: orgs } = await authClient.organization.list()
      if (orgs && orgs.length > 0) {
        setOrgs(
          orgs.map((o) => ({
            id: o.id,
            name: o.name,
            slug: o.slug,
            role: (o as { role?: string }).role,
          }))
        )
      }

      const activeOrgId =
        (session.session as { activeOrganizationId?: string | null })
          ?.activeOrganizationId ?? null

      if (activeOrgId) {
        setActiveOrgId(activeOrgId)
        const tenantId = await signInToFirebase()
        if (tenantId) setTenantId(tenantId)
        setFirebaseReady(true)
        return
      }

      // No active org in session — try to auto-activate
      if (orgs && orgs.length === 1) {
        const { error } = await authClient.organization.setActive({
          organizationId: orgs[0].id,
        })
        if (!error) {
          setActiveOrgId(orgs[0].id)
          const tenantId = await signInToFirebase()
          if (tenantId) setTenantId(tenantId)
          setFirebaseReady(true)
          // Hard navigate so the browser commits Set-Cookie before next request
          window.location.href = window.location.pathname
        } else {
          window.location.href = "/select-org"
        }
        return
      }

      // Multiple orgs or none — let user pick / create
      window.location.href = orgs && orgs.length > 1 ? "/select-org" : "/select-org?new=1"
    }

    hydrate()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{children}</>
}
