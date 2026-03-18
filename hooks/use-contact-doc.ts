"use client"

import { useEffect, useState } from "react"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuthStore } from "@/lib/auth-store"
import type { FirestoreContact } from "@/lib/types/firestore"

/**
 * Real-time subscription to a single contact document.
 * Returns the full contact including AI-collected memories.
 */
export function useContactDoc(contactId: string | null) {
  const [contact, setContact] = useState<FirestoreContact | null>(null)
  const tenantId = useAuthStore((s) => s.tenantId)
  const firebaseReady = useAuthStore((s) => s.firebaseReady)

  useEffect(() => {
    if (!tenantId || !contactId || !firebaseReady) return
    const ref = doc(db, "tenants", tenantId, "contacts", contactId)
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setContact({ id: snap.id, ...snap.data() } as FirestoreContact)
      } else {
        setContact(null)
      }
    })
    return () => unsub()
  }, [tenantId, contactId, firebaseReady])

  return contact
}
