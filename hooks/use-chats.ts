"use client"

import { useEffect, useState } from "react"
import {
  collection,
  doc,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuthStore } from "@/lib/auth-store"
import type { FirestoreContact, FirestoreMessage } from "@/lib/types/firestore"

/**
 * Real-time list of conversations for a tenant, ordered by most recent.
 * Only opens the listener after Firebase Auth is ready (firebaseReady flag).
 */
export function useContacts(tenantId: string | null) {
  const [contacts, setContacts] = useState<FirestoreContact[]>([])
  const [loading, setLoading] = useState(true)
  const firebaseReady = useAuthStore((s) => s.firebaseReady)

  useEffect(() => {
    if (!tenantId || !firebaseReady) return
    setLoading(true)

    const ref = collection(db, "tenants", tenantId, "contacts")
    const q = query(ref, orderBy("lastMessageAt", "desc"), limit(50))

    const unsub = onSnapshot(q, (snap) => {
      setContacts(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreContact))
      )
      setLoading(false)
    })

    return () => unsub()
  }, [tenantId, firebaseReady])

  return { contacts, loading }
}

/**
 * Real-time messages for a specific contact.
 * Only opens the listener after Firebase Auth is ready.
 */
export function useMessages(tenantId: string | null, contactId: string | null) {
  const [messages, setMessages] = useState<FirestoreMessage[]>([])
  const [loading, setLoading] = useState(false)
  const firebaseReady = useAuthStore((s) => s.firebaseReady)

  useEffect(() => {
    if (!tenantId || !contactId || !firebaseReady) return
    setLoading(true)

    const ref = collection(
      db,
      "tenants",
      tenantId,
      "contacts",
      contactId,
      "messages"
    )
    const q = query(ref, orderBy("createdAt", "asc"), limit(100))

    const unsub = onSnapshot(q, (snap) => {
      setMessages(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreMessage))
      )
      setLoading(false)
    })

    return () => unsub()
  }, [tenantId, contactId, firebaseReady])

  return { messages, loading }
}

/**
 * Real-time typing indicators for a contact.
 */
export function useTypingStatus(tenantId: string | null, contactId: string | null) {
  const [contactTyping, setContactTyping] = useState(false)
  const [agentTyping, setAgentTyping] = useState(false)
  const firebaseReady = useAuthStore((s) => s.firebaseReady)

  useEffect(() => {
    if (!tenantId || !contactId || !firebaseReady) return

    const ref = doc(db, "tenants", tenantId, "contacts", contactId)
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data()
      setContactTyping(data?.contactTyping ?? false)
      setAgentTyping(data?.agentTyping ?? false)
    })

    return () => unsub()
  }, [tenantId, contactId, firebaseReady])

  return { contactTyping, agentTyping }
}

/**
 * Real-time WhatsApp connection status from the tenant root document.
 * Returns both connected state and optional error message.
 */
export function useWhatsappStatus(tenantId: string | null) {
  const [whatsappConnected, setWhatsappConnected] = useState<boolean | null>(null)
  const [whatsappError, setWhatsappError] = useState<string | null>(null)
  const firebaseReady = useAuthStore((s) => s.firebaseReady)

  useEffect(() => {
    if (!tenantId || !firebaseReady) return

    const ref = doc(db, "tenants", tenantId)
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data()
      setWhatsappConnected(data?.whatsappConnected ?? false)
      setWhatsappError(data?.whatsappError ?? null)
    })

    return () => unsub()
  }, [tenantId, firebaseReady])

  return { whatsappConnected, whatsappError }
}
