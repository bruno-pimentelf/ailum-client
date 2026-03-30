"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  MagnifyingGlass,
  CaretRight,
  AddressBook,
  WhatsappLogo,
  ArrowLeft,
  ArrowRight,
  ArrowsClockwise,
  Warning,
  X,
  UploadSimple,
  Copy,
  Check,
  ChatCircleText,
  UserCircle,
  Plus,
} from "@phosphor-icons/react"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"
import { ChatView } from "@/components/app/chat-view"
import { ContactInfoPanel } from "@/components/app/contact-info-panel"
import { ContactImportModal } from "@/components/app/contact-import-modal"
import { NewContactModal } from "@/components/app/new-contact-modal"
import { useContactsList } from "@/hooks/use-contacts-list"
import { useAuthStore } from "@/lib/auth-store"
import { useIntegrations } from "@/hooks/use-integrations"
import { statusLabel } from "@/lib/contact-utils"
import { useInstanceStore } from "@/lib/instance-store"
import type { ApiContact } from "@/lib/api/contacts"
import type { FirestoreContact } from "@/lib/types/firestore"

const ease = [0.33, 1, 0.68, 1] as const
const PAGE_SIZE = 25

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(iso: string | null): string {
  if (!iso) return "—"
  try {
    const date = new Date(iso)
    const diffMs = Date.now() - date.getTime()
    const diffMin = Math.floor(diffMs / 60_000)
    const diffH = Math.floor(diffMs / 3_600_000)
    const diffD = Math.floor(diffMs / 86_400_000)
    if (diffMin < 1) return "agora"
    if (diffMin < 60) return `${diffMin}min`
    if (diffH < 24) return `${diffH}h`
    if (diffD === 1) return "ontem"
    if (diffD < 7) return `${diffD}d`
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
  } catch {
    return "—"
  }
}

// Convert ApiContact → minimal FirestoreContact so ChatView can start
// immediately; Firestore onSnapshot inside ChatView fills in live data.
function toFirestoreContact(c: ApiContact): FirestoreContact {
  return {
    id: c.id,
    phone: c.phone,
    contactPhone: c.phone,
    name: c.name,
    contactName: c.name,
    email: c.email,
    photoUrl: c.photoUrl,
    status: c.status,
    stageId: c.currentStage?.id ?? null,
    funnelId: c.currentFunnel?.id ?? null,
    assignedProfessionalId: c.assignedProfessional?.id ?? null,
    lastMessage: undefined,
    lastMessageAt: undefined,
    unreadCount: 0,
    contactTyping: false,
    agentTyping: false,
    zapiInstanceId: c.zapiInstanceId ?? null,
    updatedAt: { toDate: () => new Date() } as never,
  }
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, photoUrl }: { name: string; photoUrl?: string | null }) {
  const initials = (name || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
  const colors = [
    "bg-accent/20 text-accent",
    "bg-violet-500/20 text-violet-400",
    "bg-emerald-500/20 text-emerald-400",
    "bg-rose-500/20 text-rose-400",
    "bg-amber-500/20 text-amber-400",
  ]
  const color = colors[(name || "").charCodeAt(0) % colors.length]

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={photoUrl} alt={name}
        className="h-7 w-7 shrink-0 rounded-full object-cover border border-white/5"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
    )
  }
  return (
    <div className={`h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-[10px] font-semibold border border-white/5 ${color}`}>
      {initials}
    </div>
  )
}

// ─── Phone display (formatted + copy) ──────────────────────────────────────────

function formatPhoneParts(phone: string): { country: string; ddd: string; number: string } | null {
  const digits = phone.replace(/\D/g, "")
  if (!digits) return null
  let rest = digits
  if (rest.startsWith("55") && rest.length >= 12) rest = rest.slice(2)
  if (rest.length >= 11 && rest[2] === "9") {
    return { country: "+55", ddd: rest.slice(0, 2), number: `${rest.slice(2, 7)}-${rest.slice(7)}` }
  }
  if (rest.length >= 10) {
    return { country: "+55", ddd: rest.slice(0, 2), number: `${rest.slice(2, 6)}-${rest.slice(6, 10)}` }
  }
  return null
}

function PhoneDisplay({ phone }: { phone: string }) {
  const [copied, setCopied] = useState(false)
  const raw = phone.replace(/\D/g, "").replace(/^0+/, "") || phone
  const toCopy = raw.startsWith("55") ? raw : `55${raw}`
  const parts = formatPhoneParts(phone)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(toCopy).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    })
  }

  if (!parts) {
    return (
      <span className="text-[12px] font-mono text-muted-foreground/80 tabular-nums truncate">
        {phone}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="cursor-pointer inline-flex items-center gap-2 group text-left"
      title="Copiar telefone"
    >
      <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-400/80 group-hover:bg-emerald-500/15 group-hover:text-emerald-400 transition-colors">
        <WhatsappLogo className="h-3.5 w-3.5" weight="fill" />
      </span>
      <span className="inline-flex items-baseline gap-0.5 tabular-nums text-[12px] font-mono">
        <span className="text-muted-foreground/55">{parts.country}</span>
        <span className="text-muted-foreground/70">({parts.ddd})</span>
        <span className="text-foreground/95 font-medium">{parts.number}</span>
      </span>
      <span className={`shrink-0 flex h-5 w-5 items-center justify-center rounded transition-all ${copied ? "text-accent" : "text-muted-foreground/40 opacity-0 group-hover:opacity-100"}`}>
        {copied ? <Check className="h-3 w-3" weight="bold" /> : <Copy className="h-3 w-3" />}
      </span>
    </button>
  )
}

// ─── Stage pill ───────────────────────────────────────────────────────────────

function StagePill({ stage }: { stage: { name: string; color: string } }) {
  return (
    <span
      className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium truncate max-w-[120px]"
      style={{ background: `${stage.color}18`, borderColor: `${stage.color}30`, color: stage.color }}
    >
      {stage.name}
    </span>
  )
}

// ─── Table row ────────────────────────────────────────────────────────────────

function ContactRow({ contact, active, onClick, instanceLabel }: { contact: ApiContact; active: boolean; onClick: () => void; instanceLabel?: string | null }) {
  const name = contact.name ?? contact.phone
  return (
    <motion.tr
      layout
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={`border-b border-border/40 cursor-pointer transition-colors duration-150 ${active ? "bg-accent/[0.08]" : "hover:bg-muted/30"}`}
    >
      {/* Contact */}
      <td className="py-2.5 pl-4 pr-3">
        <div className="flex items-center gap-2.5">
          <Avatar name={name} photoUrl={contact.photoUrl} />
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-foreground truncate leading-tight">{name}</p>
            {contact.email && (
              <p className="text-[11px] text-muted-foreground/85 truncate">{contact.email}</p>
            )}
          </div>
        </div>
      </td>

      {/* Phone */}
      <td className="py-2.5 px-3 w-[1%] whitespace-nowrap align-middle">
        <PhoneDisplay phone={contact.phone} />
      </td>

      {/* Funnel / Stage */}
      <td className="py-2.5 px-3">
        <div className="flex flex-col gap-0.5">
          {contact.currentFunnel && (
            <span className="text-[11px] text-muted-foreground/90 truncate max-w-[130px]">
              {contact.currentFunnel.name}
            </span>
          )}
          {contact.currentStage && <StagePill stage={contact.currentStage} />}
          {!contact.currentFunnel && !contact.currentStage && (
            <span className="text-[11px] text-muted-foreground/85">—</span>
          )}
        </div>
      </td>

      {/* Status */}
      <td className="py-2.5 px-3 hidden lg:table-cell">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-muted-foreground/85">
            {statusLabel(contact.status)}
          </span>
          {instanceLabel && (
            <span className="text-[10px] text-muted-foreground/60 truncate max-w-[100px]" title={instanceLabel}>
              via {instanceLabel}
            </span>
          )}
        </div>
      </td>

      {/* Last */}
      <td className="py-2.5 px-3">
        <span className="text-[11px] text-muted-foreground/85 tabular-nums">
          {formatRelativeTime(contact.lastMessageAt)}
        </span>
      </td>

      {/* Arrow */}
      <td className="py-2.5 pr-4 pl-3 w-8">
        <CaretRight className="h-3.5 w-3.5 text-accent/50" weight="bold" />
      </td>
    </motion.tr>
  )
}

// ─── Contacts table panel ─────────────────────────────────────────────────────

function ContactsTablePanel({
  search,
  setSearch,
  contacts,
  loading,
  error,
  selected,
  onSelect,
  page,
  pages,
  total,
  onPage,
  onRetry,
  onOpenImport,
  onOpenNewContact,
  instanceMap,
}: {
  search: string
  setSearch: (v: string) => void
  contacts: ApiContact[]
  loading: boolean
  error: Error | null
  selected: ApiContact | null
  onSelect: (c: ApiContact | null) => void
  page: number
  pages: number
  total: number
  onPage: (p: number) => void
  onRetry: () => void
  onOpenImport: () => void
  onOpenNewContact: () => void
  instanceMap: Map<string, string>
}) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search bar */}
      <div className="shrink-0 flex items-center gap-2 p-3 border-b border-border/50">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/85 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por nome, e-mail ou telefone..."
            className="h-9 w-full rounded-lg bg-muted/30 pl-9 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all duration-200"
          />
          {search && (
            <button onClick={() => setSearch("")} className="cursor-pointer absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/90 hover:text-muted-foreground transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={onOpenImport}
          className="cursor-pointer inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border/50 px-3 text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
        >
          <UploadSimple className="h-3.5 w-3.5" />
          Importar
        </button>
        <button
          onClick={onOpenNewContact}
          className="cursor-pointer inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 text-[12px] font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" weight="bold" />
          Novo contato
        </button>
        {total > 0 && (
          <span className="text-[11px] text-muted-foreground/90 shrink-0">{total} contatos</span>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading && (
          <div className="flex flex-col gap-0">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
                <div className="h-7 w-7 rounded-full bg-muted/30 animate-pulse shrink-0" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="h-3 w-32 rounded bg-muted/30 animate-pulse" />
                  <div className="h-2.5 w-24 rounded bg-muted/20 animate-pulse" />
                </div>
                <div className="h-2.5 w-20 rounded bg-muted/20 animate-pulse hidden sm:block" />
              </div>
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Warning className="h-8 w-8 text-rose-400/40" weight="duotone" />
            <p className="text-[13px] text-muted-foreground/85">Erro ao carregar contatos</p>
            <button onClick={onRetry}
              className="cursor-pointer flex items-center gap-1.5 text-[12px] text-accent/60 hover:text-accent transition-colors">
              <ArrowsClockwise className="h-3.5 w-3.5" /> Tentar novamente
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
                <tr>
                  <th className="text-left py-2.5 pl-4 pr-3 text-[11px] font-semibold text-muted-foreground/90 uppercase tracking-wider">Contato</th>
                  <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-muted-foreground/90 uppercase tracking-wider">Telefone</th>
                  <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-muted-foreground/90 uppercase tracking-wider">Funil / Etapa</th>
                  <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-muted-foreground/90 uppercase tracking-wider hidden lg:table-cell">Status</th>
                  <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-muted-foreground/90 uppercase tracking-wider">Último</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="[&_tr]:cursor-pointer">
                <AnimatePresence initial={false}>
                  {contacts.map((c) => (
                    <ContactRow
                      key={c.id}
                      contact={c}
                      active={selected?.id === c.id}
                      onClick={() => onSelect(selected?.id === c.id ? null : c)}
                      instanceLabel={instanceMap.size > 1 && c.zapiInstanceId ? instanceMap.get(c.zapiInstanceId) : null}
                    />
                  ))}
                </AnimatePresence>
              </tbody>
            </table>

            {contacts.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                <AddressBook className="h-10 w-10 text-muted-foreground/20" weight="duotone" />
                <p className="text-[13px] text-muted-foreground/85">Nenhum contato encontrado</p>
                {search && <p className="text-[11px] text-muted-foreground/85">Tente alterar os termos da busca</p>}
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="shrink-0 flex items-center justify-between border-t border-border/50 px-4 py-2.5">
          <span className="text-[11px] text-muted-foreground/90">
            Página {page} de {pages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPage(page - 1)}
              disabled={page <= 1}
              className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg border border-border/50 text-muted-foreground/85 hover:text-foreground hover:bg-muted/40 disabled:opacity-30 disabled:cursor-default transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onPage(page + 1)}
              disabled={page >= pages}
              className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg border border-border/50 text-muted-foreground/85 hover:text-foreground hover:bg-muted/40 disabled:opacity-30 disabled:cursor-default transition-colors"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type RightTab = "chat" | "info"

export default function ContactsPage() {
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<ApiContact | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [newContactOpen, setNewContactOpen] = useState(false)
  const [rightTab, setRightTab] = useState<RightTab>("chat")

  const tenantId = useAuthStore((s) => s.tenantId)

  // Debounce search and reset to page 1
  const handleSearch = (v: string) => {
    setSearch(v)
    clearTimeout((handleSearch as { _t?: ReturnType<typeof setTimeout> })._t)
    ;(handleSearch as { _t?: ReturnType<typeof setTimeout> })._t = setTimeout(() => {
      setDebouncedSearch(v)
      setPage(1)
    }, 350)
  }

  const { data, isLoading, error, refetch } = useContactsList({
    search: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
  })

  const selectedInstanceId = useInstanceStore((s) => s.selectedInstanceId)
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

  const contacts = (data?.data ?? []).filter(
    (c) => !selectedInstanceId || !c.zapiInstanceId || c.zapiInstanceId === selectedInstanceId,
  )
  const pages    = data?.pages ?? 1
  const total    = data?.total ?? 0

  // Build a minimal FirestoreContact from the selected API contact
  // ChatView will enrich it live via Firestore onSnapshot
  const firestoreContact = useMemo(
    () => selected ? toFirestoreContact(selected) : null,
    [selected]
  )

  // Reset to chat tab when a different contact is selected
  const handleSelect = (c: ApiContact | null) => {
    if (c?.id !== selected?.id) setRightTab("chat")
    setSelected(c)
  }

  return (
    <div className="flex h-full overflow-hidden">
      <NewContactModal
        open={newContactOpen}
        onClose={() => { setNewContactOpen(false); refetch() }}
      />
      <ContactImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => {
          refetch()
          setPage(1)
        }}
      />

      {selected && firestoreContact && tenantId ? (
        <ResizablePanelGroup className="h-full w-full">
          <ResizablePanel defaultSize={55} minSize={32} className="flex flex-col min-w-0">
            <ContactsTablePanel
              search={search}
              setSearch={handleSearch}
              contacts={contacts}
              loading={isLoading}
              error={error as Error | null}
              selected={selected}
              onSelect={handleSelect}
              page={page}
              pages={pages}
              total={total}
              onPage={setPage}
              onRetry={refetch}
              onOpenImport={() => setImportOpen(true)}
              onOpenNewContact={() => setNewContactOpen(true)}
              instanceMap={instanceMap}
            />
          </ResizablePanel>
          <ResizableHandle withHandle className="bg-border/60 hover:bg-border transition-colors data-[resize-handle-state=drag]:bg-accent/30" />
          <ResizablePanel defaultSize={45} minSize={30} className="flex flex-col min-w-0 bg-background/50">
            {/* Tab strip */}
            <div className="shrink-0 flex items-stretch border-b border-border/50 h-9 px-4 gap-1">
              {(["chat", "info"] as RightTab[]).map((tab) => {
                const active = rightTab === tab
                const Icon = tab === "chat" ? ChatCircleText : UserCircle
                const label = tab === "chat" ? "Conversa" : "Perfil"
                return (
                  <button
                    key={tab}
                    onClick={() => setRightTab(tab)}
                    className={`relative flex items-center gap-1.5 px-3 text-[11px] font-bold transition-colors duration-150 cursor-pointer ${
                      active ? "text-foreground" : "text-muted-foreground/70 hover:text-foreground/75"
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="contact-right-tab-indicator"
                        className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-accent"
                        transition={{ duration: 0.18, ease: [0.33, 1, 0.68, 1] }}
                      />
                    )}
                    <Icon className="h-3.5 w-3.5 shrink-0" weight={active ? "fill" : "regular"} />
                    <span>{label}</span>
                  </button>
                )
              })}
            </div>

            <AnimatePresence mode="wait">
              {rightTab === "chat" ? (
                <ChatView
                  key={`chat-${selected.id}`}
                  contact={firestoreContact}
                  tenantId={tenantId}
                />
              ) : (
                <ContactInfoPanel
                  key={`info-${selected.id}`}
                  contactId={selected.id}
                  initialContact={firestoreContact}
                  onDeleted={() => setSelected(null)}
                />
              )}
            </AnimatePresence>
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <div className="flex flex-col h-full w-full">
          <ContactsTablePanel
            search={search}
            setSearch={handleSearch}
            contacts={contacts}
            loading={isLoading}
            error={error as Error | null}
            selected={null}
            onSelect={handleSelect}
            page={page}
            pages={pages}
            total={total}
            onPage={setPage}
            onRetry={refetch}
            onOpenImport={() => setImportOpen(true)}
            onOpenNewContact={() => setNewContactOpen(true)}
            instanceMap={instanceMap}
          />
        </div>
      )}
    </div>
  )
}
