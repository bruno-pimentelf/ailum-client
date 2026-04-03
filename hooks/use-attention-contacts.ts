"use client"

import { useEffect, useState } from "react"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuthStore } from "@/lib/auth-store"
import type { FirestoreContact } from "@/lib/types/firestore"

/**
 * Real-time list of contacts that need attention (AI was disabled / escalated).
 * Lightweight Firestore query — only returns contacts with needsAttention=true.
 */
export function useAttentionContacts() {
  const tenantId = useAuthStore((s) => s.tenantId)
  const firebaseReady = useAuthStore((s) => s.firebaseReady)
  const [contacts, setContacts] = useState<FirestoreContact[]>([])

  useEffect(() => {
    if (!tenantId || !firebaseReady) { setContacts([]); return }

    const q = query(
      collection(db, "tenants", tenantId, "contacts"),
      where("needsAttention", "==", true),
    )

    const unsub = onSnapshot(q, (snap) => {
      setContacts(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreContact)),
      )
    })

    return () => unsub()
  }, [tenantId, firebaseReady])

  return contacts
}
