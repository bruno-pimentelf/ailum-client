"use client"

import { useState, useRef, useEffect } from "react"
import { Robot, UserCircle, CaretDown, Check } from "@phosphor-icons/react"
import { useMutation } from "@tanstack/react-query"
import { useMembers } from "@/hooks/use-members"
import { contactsApi } from "@/lib/api/contacts"
import type { Member } from "@/lib/api/members"

export interface ResponsibleSelectorProps {
  contactId: string
  /** Current assigned member ID from Firestore/API. null = AI is responsible */
  assignedMemberId: string | null
  /** Compact mode for chat header */
  compact?: boolean
}

export function ResponsibleSelector({
  contactId,
  assignedMemberId,
  compact = false,
}: ResponsibleSelectorProps) {
  const [open, setOpen] = useState(false)
  const [optimisticMemberId, setOptimisticMemberId] = useState<string | null | undefined>(undefined)
  const ref = useRef<HTMLDivElement>(null)
  const { data: members } = useMembers()

  // Sync optimistic state with prop when Firestore catches up
  const effectiveMemberId = optimisticMemberId !== undefined ? optimisticMemberId : assignedMemberId

  // Only show secretaries (SECRETARY role) as assignable
  const secretaries = (members ?? []).filter(
    (m) => m.role === "SECRETARY" && m.isActive && m.user,
  )

  const currentMember = effectiveMemberId
    ? secretaries.find((m) => m.id === effectiveMemberId) ?? null
    : null

  const isAI = !effectiveMemberId

  const assignMut = useMutation({
    mutationFn: (memberId: string | null) =>
      contactsApi.update(contactId, { assignedMemberId: memberId }),
    onMutate: (memberId) => setOptimisticMemberId(memberId),
    onSettled: () => setTimeout(() => setOptimisticMemberId(undefined), 3000),
  })

  // Close on click outside
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const handleSelect = (memberId: string | null) => {
    if (memberId === effectiveMemberId) {
      setOpen(false)
      return
    }
    assignMut.mutate(memberId)
    setOpen(false)
  }

  const displayName = isAI
    ? "IA"
    : currentMember?.user?.name?.split(" ")[0] ?? "Membro"

  if (compact) {
    return (
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          disabled={assignMut.isPending}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all cursor-pointer border ${
            isAI
              ? "border-accent/30 bg-accent/10 text-accent hover:bg-accent/15"
              : "border-violet-500/30 bg-violet-500/10 text-violet-400 hover:bg-violet-500/15"
          } disabled:opacity-50`}
        >
          {isAI ? (
            <Robot className="h-3.5 w-3.5" weight="fill" />
          ) : (
            <UserCircle className="h-3.5 w-3.5" weight="fill" />
          )}
          <span>{displayName}</span>
          <CaretDown className="h-2.5 w-2.5 opacity-60" />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-xl border border-border/60 bg-overlay shadow-xl overflow-hidden">
            {/* AI option */}
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-left transition-colors cursor-pointer ${
                isAI ? "bg-accent/10 text-accent" : "text-foreground hover:bg-muted/30"
              }`}
            >
              <Robot className="h-3.5 w-3.5 shrink-0" weight={isAI ? "fill" : "regular"} />
              <span className="flex-1">Inteligencia Artificial</span>
              {isAI && <Check className="h-3 w-3" weight="bold" />}
            </button>

            {secretaries.length > 0 && (
              <div className="border-t border-border/40">
                <p className="px-3 pt-2 pb-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">
                  Secretarias
                </p>
                {secretaries.map((m) => {
                  const selected = m.id === assignedMemberId
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelect(m.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-left transition-colors cursor-pointer ${
                        selected ? "bg-violet-500/10 text-violet-400" : "text-foreground hover:bg-muted/30"
                      }`}
                    >
                      <UserCircle className="h-3.5 w-3.5 shrink-0" weight={selected ? "fill" : "regular"} />
                      <span className="flex-1 truncate">{m.user?.name ?? m.userId}</span>
                      {selected && <Check className="h-3 w-3" weight="bold" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Full mode for contact-info-panel
  return (
    <div ref={ref} className="relative">
      <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1.5">
        Responsavel
      </label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={assignMut.isPending}
        className={`w-full flex items-center gap-2.5 rounded-xl border px-3 py-2 text-[12px] font-medium transition-all cursor-pointer ${
          isAI
            ? "border-accent/30 bg-accent/[0.06] text-accent"
            : "border-violet-500/30 bg-violet-500/[0.06] text-violet-400"
        } hover:bg-muted/20 disabled:opacity-50`}
      >
        {isAI ? (
          <Robot className="h-4 w-4 shrink-0" weight="fill" />
        ) : (
          <UserCircle className="h-4 w-4 shrink-0" weight="fill" />
        )}
        <span className="flex-1 text-left truncate">
          {isAI ? "Inteligencia Artificial" : currentMember?.user?.name ?? "Membro"}
        </span>
        <CaretDown className="h-3 w-3 opacity-60" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-border/60 bg-overlay shadow-xl overflow-hidden">
          {/* AI option */}
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-[12px] text-left transition-colors cursor-pointer ${
              isAI ? "bg-accent/10 text-accent" : "text-foreground hover:bg-muted/30"
            }`}
          >
            <Robot className="h-4 w-4 shrink-0" weight={isAI ? "fill" : "regular"} />
            <span className="flex-1">Inteligencia Artificial</span>
            {isAI && <Check className="h-3.5 w-3.5" weight="bold" />}
          </button>

          {secretaries.length > 0 && (
            <div className="border-t border-border/40">
              <p className="px-3 pt-2 pb-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">
                Secretarias
              </p>
              {secretaries.map((m) => {
                const selected = m.id === assignedMemberId
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelect(m.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-[12px] text-left transition-colors cursor-pointer ${
                      selected ? "bg-violet-500/10 text-violet-400" : "text-foreground hover:bg-muted/30"
                    }`}
                  >
                    <UserCircle className="h-4 w-4 shrink-0" weight={selected ? "fill" : "regular"} />
                    <span className="flex-1 truncate">{m.user?.name ?? m.userId}</span>
                    {selected && <Check className="h-3.5 w-3.5" weight="bold" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
