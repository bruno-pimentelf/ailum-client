"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuthStore } from "@/lib/auth-store"
import { tenantNotificationsApi } from "@/lib/api/tenant-notifications"

export type NotificationSeverity = "critical" | "warning" | "info"

export interface TenantNotification {
  id: string
  type: string
  severity: NotificationSeverity
  title: string
  body: string
  entityType?: string
  entityId?: string
  source?: string
  dedupeKey?: string
  metadata?: Record<string, unknown>
  read: boolean
  createdAt: string
  updatedAt?: string
}

function timestampToIso(value: unknown): string {
  if (!value) return new Date().toISOString()
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (typeof value === "object" && value && "toDate" in value && typeof (value as { toDate: unknown }).toDate === "function") {
    return ((value as { toDate: () => Date }).toDate()).toISOString()
  }
  if (typeof value === "string") return value
  return new Date().toISOString()
}

export function useNotifications() {
  const tenantId = useAuthStore((s) => s.tenantId)
  const firebaseReady = useAuthStore((s) => s.firebaseReady)

  const [items, setItems] = useState<TenantNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recentAdded, setRecentAdded] = useState<TenantNotification[]>([])
  const [markAllPending, setMarkAllPending] = useState(false)
  const [readPendingIds, setReadPendingIds] = useState<Set<string>>(new Set())
  const didInitialLoadRef = useRef(false)

  useEffect(() => {
    if (!tenantId || !firebaseReady) {
      setItems([])
      setRecentAdded([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const q = query(
      collection(db, "tenants", tenantId, "notifications"),
      orderBy("createdAt", "desc"),
      limit(100),
    )

    const unsub = onSnapshot(
      q,
      (snap) => {
        const mapped: TenantNotification[] = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>
          return {
            id: d.id,
            type: String(data.type ?? "unknown"),
            severity: (data.severity as NotificationSeverity) ?? "info",
            title: String(data.title ?? "Notificação"),
            body: String(data.body ?? ""),
            entityType: data.entityType ? String(data.entityType) : undefined,
            entityId: data.entityId ? String(data.entityId) : undefined,
            source: data.source ? String(data.source) : undefined,
            dedupeKey: data.dedupeKey ? String(data.dedupeKey) : undefined,
            metadata: (data.metadata as Record<string, unknown>) ?? {},
            read: Boolean(data.read),
            createdAt: timestampToIso(data.createdAt),
            updatedAt: data.updatedAt ? timestampToIso(data.updatedAt) : undefined,
          }
        })

        // Only expose newly added docs after first snapshot.
        if (didInitialLoadRef.current) {
          const added = snap
            .docChanges()
            .filter((c) => c.type === "added")
            .map((c) => {
              const data = c.doc.data() as Record<string, unknown>
              return {
                id: c.doc.id,
                type: String(data.type ?? "unknown"),
                severity: (data.severity as NotificationSeverity) ?? "info",
                title: String(data.title ?? "Notificação"),
                body: String(data.body ?? ""),
                entityType: data.entityType ? String(data.entityType) : undefined,
                entityId: data.entityId ? String(data.entityId) : undefined,
                source: data.source ? String(data.source) : undefined,
                dedupeKey: data.dedupeKey ? String(data.dedupeKey) : undefined,
                metadata: (data.metadata as Record<string, unknown>) ?? {},
                read: Boolean(data.read),
                createdAt: timestampToIso(data.createdAt),
                updatedAt: data.updatedAt ? timestampToIso(data.updatedAt) : undefined,
              } satisfies TenantNotification
            })
          setRecentAdded(added)
        } else {
          didInitialLoadRef.current = true
          setRecentAdded([])
        }

        setItems(mapped)
        setLoading(false)
      },
      (err) => {
        setError(err.message || "Erro ao carregar notificações")
        setLoading(false)
      },
    )

    return () => {
      unsub()
    }
  }, [tenantId, firebaseReady])

  // Browser push notification for escalated contacts
  useEffect(() => {
    if (recentAdded.length === 0) return
    const escalated = recentAdded.filter((n) => n.type === "agent.escalated")
    if (escalated.length === 0) return
    if (typeof window === "undefined" || !("Notification" in window)) return
    if (Notification.permission === "default") Notification.requestPermission()
    if (Notification.permission === "granted") {
      for (const n of escalated) {
        new Notification(n.title, { body: n.body, icon: "/favicon.ico", tag: n.id })
      }
    }
  }, [recentAdded])

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items])

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!tenantId) return null
      setReadPendingIds((prev) => new Set(prev).add(notificationId))
      try {
        const res = await tenantNotificationsApi.markAsRead(notificationId, { read: true })
        // Optimistic local update while snapshot catches up.
        setItems((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
        return res
      } finally {
        setReadPendingIds((prev) => {
          const next = new Set(prev)
          next.delete(notificationId)
          return next
        })
      }
    },
    [tenantId],
  )

  const markAllAsRead = useCallback(async () => {
    if (!tenantId) return null
    if (items.every((n) => n.read)) return null
    setMarkAllPending(true)
    try {
      const res = await tenantNotificationsApi.markAllAsRead({ maxDocs: 1000 })
      // Optimistic local update while snapshot catches up.
      setItems((prev) => prev.map((n) => ({ ...n, read: true })))
      return res
    } finally {
      setMarkAllPending(false)
    }
  }, [items, tenantId])

  const [clearPending, setClearPending] = useState(false)

  const clearAll = useCallback(async () => {
    if (!tenantId) return null
    setClearPending(true)
    try {
      const res = await tenantNotificationsApi.clearAll()
      setItems([])
      return res
    } finally {
      setClearPending(false)
    }
  }, [tenantId])

  // Optional helper if caller wants server-side unread query later.
  const getUnreadQuery = useCallback(() => {
    if (!tenantId) return null
    return query(
      collection(db, "tenants", tenantId, "notifications"),
      where("read", "==", false),
      orderBy("createdAt", "desc"),
      limit(100),
    )
  }, [tenantId])

  return {
    items,
    unreadCount,
    loading,
    error,
    recentAdded,
    markAsRead,
    markAllAsRead,
    markAllPending,
    clearAll,
    clearPending,
    readPendingIds,
    getUnreadQuery,
  }
}

