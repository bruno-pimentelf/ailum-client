"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  MagnifyingGlass,
  ChatCircleText,
  Copy,
  Check,
  WifiSlash,
  Robot,
  User,
} from "@phosphor-icons/react"
import { formatMessagePreview } from "@/components/app/message-preview"
import { ChatView } from "@/components/app/chat-view"
import { useContacts, useWhatsappStatus } from "@/hooks/use-chats"
import { useAuthStore } from "@/lib/auth-store"
import { useInstanceStore } from "@/lib/instance-store"
import { useIntegrations } from "@/hooks/use-integrations"
import { statusLabel } from "@/lib/contact-utils"
import type { FirestoreContact } from "@/lib/types/firestore"
import Link from "next/link"

const ease = [0.33, 1, 0.68, 1] as const

// ─── Z-API error translation ─────────────────────────────────────────────────

const ZAPI_ERROR_MAP: Array<[RegExp, string]> = [
  [/not possible to restore a session/i, "Não foi possível restaurar a sessão. Reconecte o WhatsApp."],
  [/please login again/i, "Faça login novamente no WhatsApp."],
  [/qr code not read/i, "QR code não foi lido. Escaneie novamente."],
  [/disconnected/i, "Conexão perdida. Reconecte nas configurações."],
  [/timeout/i, "Tempo de conexão esgotado. Tente novamente."],
  [/unauthorized/i, "Token inválido. Verifique as credenciais da instância."],
]

function translateZapiError(msg: string): string {
  for (const [pattern, translation] of ZAPI_ERROR_MAP) {
    if (pattern.test(msg)) return translation
  }
  return msg
}

// ─── Avatar with photo support ────────────────────────────────────────────────

function Avatar({
  name,
  photoUrl,
  size = "md",
}: {
  name: string
  photoUrl?: string | null
  size?: "sm" | "md" | "lg"
}) {
  const initials = (name || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
  const colors = [
    "bg-accent/20 text-accent",
    "bg-violet-500/20 text-violet-400",
    "bg-emerald-500/20 text-emerald-400",
    "bg-rose-500/20 text-rose-400",
    "bg-amber-500/20 text-amber-400",
  ]
  const color = colors[(name || "").charCodeAt(0) % colors.length]
  const sz = size === "sm" ? "h-8 w-8 text-[11px]" : size === "lg" ? "h-10 w-10 text-[14px]" : "h-9 w-9 text-[12px]"

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        className={`${sz} shrink-0 rounded-full object-cover border border-white/5`}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
      />
    )
  }

  return (
    <div className={`${sz} ${color} shrink-0 rounded-full flex items-center justify-center font-semibold border border-white/5`}>
      {initials}
    </div>
  )
}

// ─── Phone copy ───────────────────────────────────────────────────────────────

function PhoneCopy({ phone }: { phone: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(phone).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  return (
    <div
      onClick={handleCopy}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleCopy(e as unknown as React.MouseEvent)}
      title={`Copiar ${phone}`}
      className="group flex items-center gap-1 cursor-pointer"
    >
      <span className="text-[10px] text-muted-foreground/90 font-mono group-hover:text-muted-foreground/85 transition-colors duration-150">
        {phone}
      </span>
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.span key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
            <Check className="h-2.5 w-2.5 text-accent" />
          </motion.span>
        ) : (
          <motion.span key="cp" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <Copy className="h-2.5 w-2.5 text-muted-foreground/90" />
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Format relative time ─────────────────────────────────────────────────────

function formatRelativeTime(ts: FirestoreContact["lastMessageAt"] | undefined): string {
  if (!ts) return ""
  try {
    const date = ts.toDate()
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / 86_400_000)

    if (diffDays === 0) return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    if (diffDays === 1) return "ontem"
    if (diffDays < 7) return date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
  } catch {
    return ""
  }
}


// ─── Conversation item ────────────────────────────────────────────────────────

function ConversationItem({
  contact,
  active,
  onClick,
  instanceLabel,
}: {
  contact: FirestoreContact
  active: boolean
  onClick: () => void
  instanceLabel?: string | null
}) {
  const displayName = contact.contactName ?? contact.name ?? contact.contactPhone ?? contact.phone ?? "?"
  const displayPhone = contact.contactPhone ?? contact.phone ?? ""
  const isTyping = contact.contactTyping || contact.agentTyping
  const unread = contact.unreadCount ?? 0

  return (
    <motion.div
      layout
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={`w-full cursor-pointer text-left px-3 py-3 flex items-start gap-3 border-b border-border/50 transition-colors duration-150 relative ${
        active ? "bg-accent/8" : "hover:bg-muted/30"
      }`}
    >
      {active && (
        <motion.div
          layoutId="active-indicator"
          className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent rounded-r-full"
          transition={{ duration: 0.25, ease }}
        />
      )}

      <div className="relative shrink-0 mt-0.5">
        <Avatar name={displayName} photoUrl={contact.photoUrl} />
        {isTyping && (
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-background animate-pulse" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-[13px] font-medium truncate ${active ? "text-foreground" : "text-foreground/90"}`}>
            {displayName}
          </span>
          <span className="text-[11px] text-muted-foreground/90 shrink-0">
            {formatRelativeTime(contact.lastMessageAt)}
          </span>
        </div>

        <p className="mt-0.5 text-[12px] text-muted-foreground/85 truncate leading-snug">
          {isTyping
            ? (contact.agentTyping ? "agente escrevendo..." : "digitando...")
            : formatMessagePreview(contact.lastMessage)}
        </p>

        <div className="mt-1.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 min-w-0">
            {contact.agentTyping ? (
              <Robot className="h-3 w-3 text-accent/50 shrink-0" weight="fill" />
            ) : (
              <User className="h-3 w-3 text-muted-foreground/90 shrink-0" />
            )}
            <span className="text-[11px] text-muted-foreground/85 truncate">
              {statusLabel(contact.status)}
            </span>
            {instanceLabel && (
              <span className="text-[9px] text-muted-foreground/60 truncate max-w-[70px]" title={instanceLabel}>
                · {instanceLabel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {displayPhone && <PhoneCopy phone={displayPhone} />}
            {unread > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-accent-foreground px-1">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ChatsPage() {
  const [search, setSearch] = useState("")
  // Store the full contact object — doc.id is the contactId for API calls
  const [selected, setSelected] = useState<FirestoreContact | null>(null)

  const tenantId = useAuthStore((s) => s.tenantId)
  const { contacts, loading } = useContacts(tenantId)
  const { whatsappConnected, whatsappError } = useWhatsappStatus(tenantId)
  const { data: integrations } = useIntegrations()

  const instanceMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const i of integrations ?? []) {
      if (i.provider === "zapi" && i.instanceId && i.isActive) {
        map.set(i.instanceId, i.label || i.instanceId.slice(0, 8))
      }
    }
    return map
  }, [integrations])
  const showInstanceHint = instanceMap.size > 1
  const selectedInstanceId = useInstanceStore((s) => s.selectedInstanceId)

  const filtered = contacts.filter((c) => {
    const ph = c.contactPhone ?? c.phone ?? ""
    if (ph === "__playground__") return false
    // Filter by instance if selected — hide contacts without matching instance
    if (selectedInstanceId && c.zapiInstanceId !== selectedInstanceId) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (c.contactName ?? c.name ?? "").toLowerCase().includes(q) ||
      ph.includes(q) ||
      (c.lastMessage ?? "").toLowerCase().includes(q)
    )
  })

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── WhatsApp disconnected banner ── */}
      <AnimatePresence>
        {whatsappConnected === false && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease }}
            className="overflow-hidden shrink-0"
          >
            <div className="flex items-center justify-between gap-3 border-b border-amber-600/20 dark:border-amber-500/20 bg-amber-500/[0.08] dark:bg-amber-500/[0.06] px-4 py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <WifiSlash className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <p className="text-[12px] text-amber-700 dark:text-amber-400/90 font-medium truncate">
                  {whatsappError
                    ? `WhatsApp desconectado — ${translateZapiError(whatsappError)}`
                    : "WhatsApp desconectado — novas mensagens não serão entregues"}
                </p>
              </div>
              <Link
                href="/settings?tab=conexoes"
                className="cursor-pointer shrink-0 rounded-lg border border-amber-600/25 dark:border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-500/15 transition-colors"
              >
                Reconectar
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Conversation list ── */}
        <div className="flex w-[280px] shrink-0 flex-col border-r border-border bg-background/50">
          <div className="p-3 border-b border-border/50">
            <div className="relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/85 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar conversas..."
                className="h-8 w-full rounded-lg bg-muted/30 pl-8 pr-3 text-[12px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all duration-200"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="flex flex-col items-center justify-center gap-2 py-16">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-5 w-5 rounded-full border-2 border-accent/20 border-t-accent"
                />
                <p className="text-[11px] text-muted-foreground/85">Carregando conversas...</p>
              </div>
            )}

            {!loading && (
              <AnimatePresence initial={false}>
                {filtered.map((contact, i) => (
                  <ConversationItem
                    key={contact.id ?? i}
                    contact={contact}
                    active={selected?.id === contact.id}
                    onClick={() => setSelected(contact)}
                    instanceLabel={showInstanceHint && contact.zapiInstanceId ? instanceMap.get(contact.zapiInstanceId) : null}
                  />
                ))}
              </AnimatePresence>
            )}

            {!loading && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center px-4">
                <ChatCircleText className="h-8 w-8 text-muted-foreground/20" />
                <p className="text-[12px] text-muted-foreground/90">
                  {search ? "Nenhuma conversa encontrada" : "Nenhuma conversa ainda"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Chat area ── */}
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <AnimatePresence mode="wait">
            {selected && tenantId ? (
              <ChatView key={selected.id ?? "chat"} contact={selected} tenantId={tenantId} />
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-1 flex-col items-center justify-center gap-4 text-center px-8"
              >
                <p className="text-[13px] text-muted-foreground/50">Selecione uma conversa</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
