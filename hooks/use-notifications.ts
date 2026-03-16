"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuthStore } from "@/lib/auth-store"

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

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items])

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!tenantId) return
      await updateDoc(doc(db, "tenants", tenantId, "notifications", notificationId), {
        read: true,
      })
    },
    [tenantId],
  )

  const markAllAsRead = useCallback(async () => {
    if (!tenantId) return
    const unreadIds = items.filter((n) => !n.read).map((n) => n.id)
    if (unreadIds.length === 0) return
    const batch = writeBatch(db)
    unreadIds.forEach((id) => {
      batch.update(doc(db, "tenants", tenantId, "notifications", id), { read: true })
    })
    await batch.commit()
  }, [items, tenantId])

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
    getUnreadQuery,
  }
}

