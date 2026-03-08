"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { useAuthStore } from "@/lib/auth-store"

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { setUser, setOrgs, setActiveOrgId } = useAuthStore()

  useEffect(() => {
    async function hydrate() {
      const { data: session } = await authClient.getSession()

      if (!session?.user) {
        router.push("/login")
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

      const activeOrgId = (session.session as { activeOrganizationId?: string | null })
        ?.activeOrganizationId ?? null

      if (activeOrgId) {
        setActiveOrgId(activeOrgId)
      } else if (orgs && orgs.length === 1) {
        await authClient.organization.setActive({ organizationId: orgs[0].id })
        setActiveOrgId(orgs[0].id)
      } else if (orgs && orgs.length > 1) {
        router.push("/select-org")
      } else {
        router.push("/select-org?new=1")
      }
    }

    hydrate()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{children}</>
}
