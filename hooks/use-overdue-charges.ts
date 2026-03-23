"use client"

import { useEffect, useState } from "react"
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuthStore } from "@/lib/auth-store"
import type { FirestoreCharge, FirestoreContact } from "@/lib/types/firestore"

export interface OverdueChargeWithContact extends FirestoreCharge {
  contact?: FirestoreContact
}

export function useOverdueCharges() {
  const [charges, setCharges] = useState<OverdueChargeWithContact[]>([])
  const [loading, setLoading] = useState(true)
  const tenantId = useAuthStore((s) => s.tenantId)
  const firebaseReady = useAuthStore((s) => s.firebaseReady)

  useEffect(() => {
    if (!tenantId || !firebaseReady) return
    setLoading(true)

    const ref = collection(db, "tenants", tenantId, "charges")
    const q = query(ref, where("status", "==", "OVERDUE"))

    const unsub = onSnapshot(q, async (snap) => {
      const contactCache = new Map<string, FirestoreContact | undefined>()

      const items = await Promise.all(
        snap.docs.map(async (d) => {
          const charge = { id: d.id, ...d.data() } as FirestoreCharge

          if (!contactCache.has(charge.contactId)) {
            try {
              const contactRef = doc(db, "tenants", tenantId, "contacts", charge.contactId)
              const contactSnap = await getDoc(contactRef)
              contactCache.set(
                charge.contactId,
                contactSnap.exists()
                  ? ({ id: contactSnap.id, ...contactSnap.data() } as FirestoreContact)
                  : undefined,
              )
            } catch {
              contactCache.set(charge.contactId, undefined)
            }
          }

          return { ...charge, contact: contactCache.get(charge.contactId) }
        }),
      )

      setCharges(items)
      setLoading(false)
    })

    return () => unsub()
  }, [tenantId, firebaseReady])

  return { charges, loading }
}
