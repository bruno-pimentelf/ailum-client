"use client"

import { useRouter } from "next/navigation"
import { useMe } from "@/hooks/use-me"
import { useEffect } from "react"

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { data: me, isLoading } = useMe()

  useEffect(() => {
    if (!isLoading && !me?.isSuperAdmin) {
      router.replace("/dashboard")
    }
  }, [isLoading, me, router])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  if (!me?.isSuperAdmin) return null

  return <>{children}</>
}
