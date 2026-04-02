"use client"

import { useEffect, useState, useMemo, useCallback, useRef } from "react"
import {
  collection,
  doc,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  onSnapshot,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuthStore } from "@/lib/auth-store"
import type { FirestoreContact, FirestoreMessage } from "@/lib/types/firestore"

const REALTIME_PAGE = 30
const LOAD_MORE_SIZE = 30

/**
 * Real-time contact list with infinite scroll.
 *
 * - First page (most recent 30) is a live onSnapshot subscription.
 * - Older pages are fetched on demand via getDocs (static).
 * - Contacts from both are merged by ID (real-time wins on conflict).
 */
export function useContacts(tenantId: string | null) {
  const [realtimeContacts, setRealtimeContacts] = useState<FirestoreContact[]>([])
  const [olderContacts, setOlderContacts] = useState<FirestoreContact[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const firebaseReady = useAuthStore((s) => s.firebaseReady)

  // Keep a ref to the last doc of the realtime snapshot for cursor
  const realtimeLastDoc = useRef<QueryDocumentSnapshot | null>(null)
  // Keep a ref to the last doc of the oldest page fetched
  const olderCursor = useRef<QueryDocumentSnapshot | null>(null)

  // Real-time subscription for the most recent contacts
  useEffect(() => {
    if (!tenantId || !firebaseReady) return
    setLoading(true)
    setOlderContacts([])
    setHasMore(true)
    olderCursor.current = null

    const ref = collection(db, "tenants", tenantId, "contacts")
    const q = query(ref, orderBy("lastMessageAt", "desc"), limit(REALTIME_PAGE))

    const unsub = onSnapshot(q, (snap) => {
      setRealtimeContacts(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreContact)),
      )
      realtimeLastDoc.current = snap.docs[snap.docs.length - 1] ?? null
      setLoading(false)
    })

    return () => unsub()
  }, [tenantId, firebaseReady])

  // Load more (older contacts, static fetch)
  const loadMore = useCallback(async () => {
    if (!tenantId || !firebaseReady || loadingMore || !hasMore) return

    const cursor = olderCursor.current ?? realtimeLastDoc.current
    if (!cursor) { setHasMore(false); return }

    setLoadingMore(true)
    try {
      const ref = collection(db, "tenants", tenantId, "contacts")
      const q = query(
        ref,
        orderBy("lastMessageAt", "desc"),
        startAfter(cursor),
        limit(LOAD_MORE_SIZE),
      )
      const snap = await getDocs(q)
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreContact))

      if (docs.length > 0) {
        olderCursor.current = snap.docs[snap.docs.length - 1]
        setOlderContacts((prev) => {
          // Dedupe by id
          const existingIds = new Set(prev.map((c) => c.id))
          const newOnly = docs.filter((d) => !existingIds.has(d.id))
          return [...prev, ...newOnly]
        })
      }

      if (docs.length < LOAD_MORE_SIZE) setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }, [tenantId, firebaseReady, loadingMore, hasMore])

  // Merge: realtime contacts win on conflict (they're more up to date)
  const contacts = useMemo(() => {
    const realtimeIds = new Set(realtimeContacts.map((c) => c.id))
    const olderFiltered = olderContacts.filter((c) => !realtimeIds.has(c.id))
    return [...realtimeContacts, ...olderFiltered]
  }, [realtimeContacts, olderContacts])

  return { contacts, loading, loadingMore, hasMore, loadMore }
}

const INITIAL_PAGE_SIZE = 50
const MSG_LOAD_MORE_SIZE = 50

/**
 * Real-time messages for a specific contact.
 * Fetches the most recent messages first (chat starts at bottom).
 * Supports loading older messages when scrolling up.
 */
export function useMessages(tenantId: string | null, contactId: string | null) {
  const [messages, setMessages] = useState<FirestoreMessage[]>([])
  const [olderMessages, setOlderMessages] = useState<FirestoreMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [oldestSnapshot, setOldestSnapshot] = useState<DocumentSnapshot | null>(null)
  const [hasMoreOlder, setHasMoreOlder] = useState(true)
  const firebaseReady = useAuthStore((s) => s.firebaseReady)

  // Real-time subscription: most recent INITIAL_PAGE_SIZE messages
  useEffect(() => {
    if (!tenantId || !contactId || !firebaseReady) return
    const messagesRef = collection(
      db,
      "tenants",
      tenantId,
      "contacts",
      contactId,
      "messages"
    )
    setLoading(true)
    setOlderMessages([])
    setOldestSnapshot(null)

    const q = query(
      messagesRef,
      orderBy("createdAt", "desc"),
      limit(INITIAL_PAGE_SIZE)
    )

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreMessage))
      setMessages(docs)
      setOldestSnapshot(snap.docs[snap.docs.length - 1] ?? null)
      setHasMoreOlder(snap.docs.length >= INITIAL_PAGE_SIZE)
      setLoading(false)
    })

    return () => unsub()
  }, [tenantId, contactId, firebaseReady])

  const loadMoreOlder = async () => {
    if (!tenantId || !contactId || !firebaseReady || loadingMore) return
    const cursor = oldestSnapshot
    if (!cursor) return
    setLoadingMore(true)
    try {
      const messagesRef = collection(
        db,
        "tenants",
        tenantId,
        "contacts",
        contactId,
        "messages"
      )
      const q = query(
        messagesRef,
        orderBy("createdAt", "desc"),
        startAfter(cursor),
        limit(MSG_LOAD_MORE_SIZE)
      )
      const snap = await getDocs(q)
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreMessage))
      if (snap.docs.length > 0) {
        setOldestSnapshot(snap.docs[snap.docs.length - 1])
        setOlderMessages((prev) => [...prev, ...docs])
        setHasMoreOlder(snap.docs.length >= MSG_LOAD_MORE_SIZE)
      } else {
        setHasMoreOlder(false)
      }
    } finally {
      setLoadingMore(false)
    }
  }

  const allMessages = useMemo(() => {
    const ts = (m: FirestoreMessage) => m.createdAt?.toDate?.()?.getTime() ?? 0
    return [...olderMessages, ...messages].sort((a, b) => ts(a) - ts(b))
  }, [olderMessages, messages])

  return {
    messages: allMessages,
    loading,
    loadingMore,
    hasMoreOlder,
    loadMoreOlder,
  }
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
