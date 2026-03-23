"use client"

import { useEffect, useState, useRef } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuthStore } from "@/lib/auth-store"
import type { FirestoreContact } from "@/lib/types/firestore"

/**
 * Resolves contact names from Firestore given a list of contactIds.
 * Caches results across renders to avoid redundant fetches.
 */
export function useContactNames(contactIds: (string | null | undefined)[]) {
  const [names, setNames] = useState<Record<string, string>>({})
  const tenantId = useAuthStore((s) => s.tenantId)
  const firebaseReady = useAuthStore((s) => s.firebaseReady)
  const cacheRef = useRef<Record<string, string>>({})

  useEffect(() => {
    if (!tenantId || !firebaseReady) return

    const unique = [...new Set(contactIds.filter((id): id is string => !!id))]
    const toFetch = unique.filter((id) => !(id in cacheRef.current))

    if (toFetch.length === 0) {
      // All already cached — just sync state
      const mapped: Record<string, string> = {}
      for (const id of unique) {
        if (cacheRef.current[id]) mapped[id] = cacheRef.current[id]
      }
      setNames((prev) => {
        const same = unique.every((id) => prev[id] === mapped[id])
        return same ? prev : { ...prev, ...mapped }
      })
      return
    }

    let cancelled = false

    Promise.all(
      toFetch.map(async (id) => {
        try {
          const ref = doc(db, "tenants", tenantId, "contacts", id)
          const snap = await getDoc(ref)
          if (snap.exists()) {
            const data = snap.data() as FirestoreContact
            const name = data.contactName ?? data.name ?? null
            if (name) cacheRef.current[id] = name
          }
        } catch {
          // ignore individual failures
        }
      }),
    ).then(() => {
      if (cancelled) return
      const mapped: Record<string, string> = {}
      for (const id of unique) {
        if (cacheRef.current[id]) mapped[id] = cacheRef.current[id]
      }
      setNames((prev) => ({ ...prev, ...mapped }))
    })

    return () => {
      cancelled = true
    }
  }, [tenantId, firebaseReady, contactIds.filter(Boolean).join(",")])

  return names
}
