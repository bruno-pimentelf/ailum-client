import { useEffect, useState, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuthStore } from "@/lib/auth-store"
import { ApiError } from "@/lib/api"
import { funnelsApi, type BoardContact, type FunnelListItem, type BoardStage, type FunnelInput, type StageInput, type StageAgentConfig, type StageAgentConfigInput, type Trigger, type TriggerInput } from "@/lib/api/funnels"
import type { FirestoreContact } from "@/lib/types/firestore"

// ─── List funnels ─────────────────────────────────────────────────────────────

export function useFunnels() {
  return useQuery<FunnelListItem[]>({
    queryKey: ["funnels"],
    queryFn: () => funnelsApi.list(),
    staleTime: 5 * 60_000,
  })
}

// ─── Board state ──────────────────────────────────────────────────────────────
// Holds a map of stageId → contacts for the active funnel.
// Initial data comes from the REST fetch; Firestore onSnapshot patches it live.

export type StageMap = Record<string, BoardContact[]>

function boardToStageMap(stages: BoardStage[]): StageMap {
  return Object.fromEntries(stages.map((s) => [s.id, s.contacts]))
}

// Convert a Firestore contact patch into the minimum fields needed for UI update
function firestoreToPartialCard(doc: FirestoreContact & { id: string }): Partial<BoardContact> & { id: string } {
  return {
    id: doc.id,
    name: doc.name ?? doc.contactName ?? null,
    phone: doc.phone ?? doc.contactPhone ?? "",
    photoUrl: doc.photoUrl ?? null,
    status: doc.status,
    currentStageId: doc.stageId ?? null,
    lastMessageAt: doc.lastMessageAt ? doc.lastMessageAt.toDate().toISOString() : null,
    assignedProfessional: null, // Firestore doesn't include full object; keep existing
  }
}

export function useBoard(funnelId: string | null, params?: { search?: string }) {
  const queryClient = useQueryClient()
  const tenantId = useAuthStore((s) => s.tenantId)
  const firebaseReady = useAuthStore((s) => s.firebaseReady)

  // REST fetch for initial board data
  const boardQuery = useQuery({
    queryKey: ["board", funnelId, params?.search],
    queryFn: () => funnelsApi.board(funnelId!, params),
    enabled: !!funnelId,
    staleTime: 30_000,
  })

  // Local stage map — starts from REST data, updated by Firestore
  const [stageMap, setStageMap] = useState<StageMap>({})
  const [stages, setStages] = useState<BoardStage[]>([])

  // Populate from REST response
  useEffect(() => {
    if (boardQuery.data) {
      setStages(boardQuery.data.stages)
      setStageMap(boardToStageMap(boardQuery.data.stages))
    }
  }, [boardQuery.data])

  // Firestore real-time sync for contacts in this funnel
  useEffect(() => {
    if (!tenantId || !funnelId || !firebaseReady) return

    const ref = collection(db, "tenants", tenantId, "contacts")
    const q = query(ref, where("funnelId", "==", funnelId))

    const unsub = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const raw = { id: change.doc.id, ...change.doc.data() } as FirestoreContact & { id: string }

        if (change.type === "removed") {
          setStageMap((prev) => {
            const next = { ...prev }
            for (const stageId of Object.keys(next)) {
              next[stageId] = next[stageId].filter((c) => c.id !== raw.id)
            }
            return next
          })
          return
        }

        // added | modified
        const patch = firestoreToPartialCard(raw)
        const newStageId = raw.stageId ?? null

        setStageMap((prev) => {
          const next: StageMap = {}

          // Find which stage currently holds this contact
          let currentStageForContact: string | null = null
          for (const [sid, cards] of Object.entries(prev)) {
            if (cards.some((c) => c.id === raw.id)) {
              currentStageForContact = sid
              break
            }
          }

          const stayedInSameStage = currentStageForContact === newStageId

          if (stayedInSameStage && newStageId) {
            // Contact stayed in same stage — update in-place without changing position
            for (const [sid, cards] of Object.entries(prev)) {
              if (sid === newStageId) {
                next[sid] = cards.map((c) => c.id === raw.id ? { ...c, ...patch } : c)
              } else {
                next[sid] = cards
              }
            }
          } else {
            // Contact moved stages — remove from old, add to new
            for (const [sid, cards] of Object.entries(prev)) {
              next[sid] = cards.filter((c) => c.id !== raw.id)
            }

            if (newStageId && newStageId in next) {
              const existing = prev[currentStageForContact ?? ""]?.find((c) => c.id === raw.id)
              const merged: BoardContact = existing
                ? { ...existing, ...patch, currentStageId: newStageId }
                : {
                    id: patch.id,
                    phone: patch.phone ?? "",
                    name: patch.name ?? null,
                    photoUrl: patch.photoUrl ?? null,
                    status: patch.status ?? "NEW_LEAD",
                    stageEnteredAt: null,
                    lastMessageAt: patch.lastMessageAt ?? null,
                    lastPaymentStatus: null,
                    lastDetectedIntent: null,
                    currentStageId: newStageId,
                    zapiInstanceId: patch.zapiInstanceId ?? null,
                    summary: null,
                    assignedProfessional: null,
                    assignedMember: null,
                    messages: [],
                  }
              next[newStageId] = [...next[newStageId], merged]
            }
          }

          return next
        })
      })
    })

    return () => unsub()
  }, [tenantId, funnelId, firebaseReady])

  // Move contact mutation — optimistic update, no UI wait
  const moveContact = useCallback(
    (contactId: string, fromStageId: string, toStageId: string) => {
      if (fromStageId === toStageId) return

      // Optimistic: move locally immediately
      setStageMap((prev) => {
        const card = prev[fromStageId]?.find((c) => c.id === contactId)
        if (!card) return prev
        return {
          ...prev,
          [fromStageId]: prev[fromStageId].filter((c) => c.id !== contactId),
          [toStageId]: [...(prev[toStageId] ?? []), { ...card, currentStageId: toStageId }],
        }
      })

      // Fire API — Firestore onSnapshot will confirm/correct
      funnelsApi.moveContact(contactId, toStageId).catch(() => {
        // Revert on failure by invalidating the board query
        queryClient.invalidateQueries({ queryKey: ["board", funnelId] })
      })
    },
    [funnelId, queryClient],
  )

  return {
    funnel: boardQuery.data?.funnel ?? null,
    stages,
    stageMap,
    loading: boardQuery.isLoading,
    error: boardQuery.error,
    moveContact,
    refetch: boardQuery.refetch,
  }
}

// ─── Stage Agent Config ───────────────────────────────────────────────────────

export function useStageAgentConfig(stageId: string | null) {
  return useQuery<StageAgentConfig | null>({
    queryKey: ["stage-agent-config", stageId],
    queryFn: async () => {
      if (!stageId) return null
      try {
        return await funnelsApi.getAgentConfig(stageId)
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return null
        throw e
      }
    },
    enabled: !!stageId,
  })
}

// ─── Funnel mutations ─────────────────────────────────────────────────────────

export function useFunnelMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["funnels"] })
  const invalidateBoard = (funnelId: string) =>
    queryClient.invalidateQueries({ queryKey: ["board", funnelId] })

  const createFunnel = useMutation({
    mutationFn: (body: FunnelInput) => funnelsApi.create(body),
    onSuccess: invalidate,
  })

  const createDefaultFunnel = useMutation({
    mutationFn: () => funnelsApi.createDefault(),
    onSuccess: invalidate,
  })

  const updateFunnel = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<FunnelInput> }) =>
      funnelsApi.update(id, body),
    onSuccess: invalidate,
  })

  const deleteFunnel = useMutation({
    mutationFn: (id: string) => funnelsApi.delete(id),
    onSuccess: invalidate,
  })

  const createStage = useMutation({
    mutationFn: ({ funnelId, body }: { funnelId: string; body: StageInput }) =>
      funnelsApi.createStage(funnelId, body),
    onSuccess: (_, { funnelId }) => {
      invalidate()
      invalidateBoard(funnelId)
    },
  })

  const updateStage = useMutation({
    mutationFn: ({ stageId, funnelId, body }: { stageId: string; funnelId: string; body: Partial<StageInput> }) =>
      funnelsApi.updateStage(stageId, body),
    onSuccess: (_, { funnelId }) => {
      invalidate()
      invalidateBoard(funnelId)
    },
  })

  const deleteStage = useMutation({
    mutationFn: ({ stageId, funnelId }: { stageId: string; funnelId: string }) =>
      funnelsApi.deleteStage(stageId),
    onSuccess: (_, { funnelId }) => {
      invalidate()
      invalidateBoard(funnelId)
    },
  })

  const upsertAgentConfig = useMutation({
    mutationFn: ({ stageId, body }: { stageId: string; body: StageAgentConfigInput }) =>
      funnelsApi.upsertAgentConfig(stageId, body),
    onSuccess: (_, { stageId }) => {
      queryClient.invalidateQueries({ queryKey: ["stage-agent-config", stageId] })
      invalidate()
    },
  })

  const createTrigger = useMutation({
    mutationFn: ({ stageId, body }: { stageId: string; body: TriggerInput }) =>
      funnelsApi.createTrigger(stageId, body),
    onSuccess: (_, { stageId }) => {
      queryClient.invalidateQueries({ queryKey: ["triggers", stageId] })
      invalidate()
    },
  })

  const updateTrigger = useMutation({
    mutationFn: ({ triggerId, body }: { triggerId: string; body: Partial<TriggerInput> }) =>
      funnelsApi.updateTrigger(triggerId, body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["triggers", data.stageId] })
      invalidate()
    },
  })

  const deleteTrigger = useMutation({
    mutationFn: (triggerId: string) => funnelsApi.deleteTrigger(triggerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["triggers"] })
      invalidate()
    },
  })

  const toggleTrigger = useMutation({
    mutationFn: (triggerId: string) => funnelsApi.toggleTrigger(triggerId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["triggers", data.stageId] })
      invalidate()
    },
  })

  return {
    createFunnel,
    createDefaultFunnel,
    updateFunnel,
    deleteFunnel,
    createStage,
    updateStage,
    deleteStage,
    upsertAgentConfig,
    createTrigger,
    updateTrigger,
    deleteTrigger,
    toggleTrigger,
  }
}

// ─── Triggers ─────────────────────────────────────────────────────────────────

export function useTriggers(stageId: string | null) {
  return useQuery<Trigger[]>({
    queryKey: ["triggers", stageId],
    queryFn: () => funnelsApi.listTriggers(stageId!),
    enabled: !!stageId,
  })
}
