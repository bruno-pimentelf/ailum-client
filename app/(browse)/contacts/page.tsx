"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  MagnifyingGlass,
  User,
  Phone,
  WhatsappLogo,
  Envelope,
  Copy,
  Check,
  CaretRight,
  Funnel,
  CalendarBlank,
  AddressBook,
} from "@phosphor-icons/react"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"

const ease = [0.33, 1, 0.68, 1] as const

// ─── Types ────────────────────────────────────────────────────────────────────

type Contact = {
  id: string
  name: string
  email: string
  phone: string
  funnel: string
  tags: string[]
  lastContact: string
  hasWhatsapp: boolean
}

// ─── Mock data ──────────────────────────────────────────────────────────────────

const contacts: Contact[] = [
  { id: "1", name: "Ana Costa", email: "ana.costa@email.com", phone: "+55 11 99164-0164", funnel: "Recepção - Agendamento", tags: ["Instagram", "Lead quente"], lastContact: "01:24", hasWhatsapp: true },
  { id: "2", name: "João Magalhães", email: "joao.m@email.com", phone: "+55 11 98765-4207", funnel: "Análise - Agendamento", tags: ["Retorno"], lastContact: "23:59", hasWhatsapp: true },
  { id: "3", name: "Thyago Medici", email: "thyago.medici@email.com", phone: "+55 21 97654-0888", funnel: "Sem funil", tags: ["Instagram"], lastContact: "22:16", hasWhatsapp: true },
  { id: "4", name: "Leonardo Ferreira", email: "leo.ferreira@email.com", phone: "+55 31 96543-3129", funnel: "Agendador", tags: ["Convênio"], lastContact: "20:14", hasWhatsapp: true },
  { id: "5", name: "Gabriel Souza Bonanni", email: "gabriel.bonanni@email.com", phone: "+55 11 95432-5974", funnel: "Recepção - Fechamento", tags: ["Avaliação"], lastContact: "18:25", hasWhatsapp: true },
  { id: "6", name: "Bruno Ita", email: "bruno.ita@email.com", phone: "+55 11 94321-9661", funnel: "Recepção - Agendamento", tags: [], lastContact: "18:22", hasWhatsapp: true },
  { id: "7", name: "Fernanda Reis", email: "fernanda.reis@email.com", phone: "+55 11 93210-7712", funnel: "Agendado", tags: ["Confirmado"], lastContact: "ontem", hasWhatsapp: true },
  { id: "8", name: "Mariana Lopes", email: "mariana.l@email.com", phone: "+55 11 92109-2241", funnel: "Novo contato", tags: [], lastContact: "1h", hasWhatsapp: true },
]

// ─── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
  const colors = [
    "bg-accent/20 text-accent",
    "bg-violet-500/20 text-violet-400",
    "bg-emerald-500/20 text-emerald-400",
    "bg-rose-500/20 text-rose-400",
    "bg-amber-500/20 text-amber-400",
  ]
  const color = colors[name.charCodeAt(0) % colors.length]
  const sz =
    size === "sm"
      ? "h-7 w-7 text-[10px]"
      : size === "lg"
        ? "h-12 w-12 text-[14px]"
        : "h-8 w-8 text-[11px]"
  return (
    <div
      className={`${sz} ${color} shrink-0 rounded-full flex items-center justify-center font-semibold border border-white/5`}
    >
      {initials}
    </div>
  )
}

// ─── Copy button ───────────────────────────────────────────────────────────────

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={`Copiar ${label ?? value}`}
      className="group flex items-center gap-2 rounded-md px-2 py-1 -ml-2 text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-all duration-150"
    >
      <span className="text-[12px] font-mono">{value}</span>
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.span
            key="ok"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Check className="h-3.5 w-3.5 text-accent" />
          </motion.span>
        ) : (
          <motion.span
            key="cp"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          >
            <Copy className="h-3.5 w-3.5" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}

// ─── Table row ─────────────────────────────────────────────────────────────────

function ContactRow({
  contact,
  active,
  onClick,
}: {
  contact: Contact
  active: boolean
  onClick: () => void
}) {
  return (
    <motion.tr
      layout
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={`border-b border-border/40 cursor-pointer transition-colors duration-150 ${
        active ? "bg-accent/8" : "hover:bg-muted/30"
      }`}
    >
      <td className="py-2.5 pl-4 pr-3">
        <div className="flex items-center gap-3">
          <Avatar name={contact.name} size="sm" />
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-foreground truncate">{contact.name}</p>
            <p className="text-[11px] text-muted-foreground/60 truncate">{contact.email}</p>
          </div>
        </div>
      </td>
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-1.5">
          {contact.hasWhatsapp && (
            <WhatsappLogo className="h-3.5 w-3.5 text-emerald-400/70 shrink-0" weight="fill" />
          )}
          <span className="text-[12px] font-mono text-muted-foreground/80">{contact.phone}</span>
        </div>
      </td>
      <td className="py-2.5 px-3">
        <span className="text-[12px] text-muted-foreground/70 truncate max-w-[140px] block">
          {contact.funnel}
        </span>
      </td>
      <td className="py-2.5 px-3">
        <span className="text-[11px] text-muted-foreground/50">{contact.lastContact}</span>
      </td>
      <td className="py-2.5 pr-4 pl-3 w-10">
        <motion.div
          animate={{ opacity: active ? 1 : 0.3 }}
          className="flex justify-end"
        >
          <CaretRight className="h-4 w-4 text-accent" weight="bold" />
        </motion.div>
      </td>
    </motion.tr>
  )
}

// ─── Contact detail panel ──────────────────────────────────────────────────────

function ContactDetailPanel({ contact }: { contact: Contact }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28, ease }}
      className="flex flex-col h-full overflow-hidden"
    >
      {/* Header */}
      <div className="shrink-0 p-5 border-b border-border/50">
        <div className="flex items-start gap-4">
          <Avatar name={contact.name} size="lg" />
          <div className="flex-1 min-w-0">
            <h2 className="text-[17px] font-semibold text-foreground">{contact.name}</h2>
            <p className="text-[13px] text-muted-foreground/80 mt-0.5">{contact.email}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {contact.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-md border border-accent/20 bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent"
                >
                  {tag}
                </span>
              ))}
              {contact.tags.length === 0 && (
                <span className="text-[11px] text-muted-foreground/40">Sem tags</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.25, ease }}
          className="rounded-xl border border-border/50 bg-card/30 p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Phone className="h-4 w-4 text-muted-foreground" weight="duotone" />
            <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">
              Telefone
            </span>
          </div>
          <CopyButton value={contact.phone} label="telefone" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.25, ease }}
          className="rounded-xl border border-border/50 bg-card/30 p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Envelope className="h-4 w-4 text-muted-foreground" weight="duotone" />
            <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">
              E-mail
            </span>
          </div>
          <CopyButton value={contact.email} label="e-mail" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.25, ease }}
          className="rounded-xl border border-border/50 bg-card/30 p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Funnel className="h-4 w-4 text-muted-foreground" weight="duotone" />
            <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">
              Funil
            </span>
          </div>
          <p className="text-[13px] text-foreground">{contact.funnel}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.25, ease }}
          className="rounded-xl border border-border/50 bg-card/30 p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <CalendarBlank className="h-4 w-4 text-muted-foreground" weight="duotone" />
            <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">
              Último contato
            </span>
          </div>
          <p className="text-[13px] text-foreground">{contact.lastContact}</p>
        </motion.div>

        {contact.hasWhatsapp && (
          <motion.a
            href={`https://wa.me/55${contact.phone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.25, ease }}
            className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-3 text-[13px] font-semibold text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all duration-200"
          >
            <WhatsappLogo className="h-5 w-5" weight="fill" />
            Abrir WhatsApp
          </motion.a>
        )}
      </div>
    </motion.div>
  )
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyDetailState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-1 flex-col items-center justify-center gap-5 text-center px-8"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/10 border border-accent/20">
        <User className="h-10 w-10 text-accent/60" weight="duotone" />
      </div>
      <div>
        <h3 className="text-[15px] font-semibold text-foreground">Selecione um contato</h3>
        <p className="mt-1.5 text-[13px] text-muted-foreground/60 max-w-[260px] leading-relaxed">
          Clique em um contato na tabela para ver os detalhes e histórico
        </p>
      </div>
      <p className="text-[11px] text-muted-foreground/30">
        Arraste o divisor para ajustar o tamanho dos painéis
      </p>
    </motion.div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function ContactsPage() {
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Contact | null>(null)

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.funnel.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex h-full overflow-hidden">
      <ResizablePanelGroup className="h-full">
        {/* Table panel */}
        <ResizablePanel defaultSize={55} minSize={35} className="flex flex-col min-w-0">
          <div className="flex flex-col h-full overflow-hidden">
            {/* Search header */}
            <div className="shrink-0 p-4 border-b border-border/50">
              <div className="relative">
                <MagnifyingGlass
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pesquisar por nome, e-mail, telefone ou funil..."
                  className="h-9 w-full rounded-lg bg-muted/30 pl-9 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all duration-200"
                />
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full">
                <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
                  <tr>
                    <th className="text-left py-2.5 pl-4 pr-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Contato
                    </th>
                    <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Telefone
                    </th>
                    <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Funil
                    </th>
                    <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Último
                    </th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {filtered.map((contact) => (
                      <ContactRow
                        key={contact.id}
                        contact={contact}
                        active={selected?.id === contact.id}
                        onClick={() => setSelected(contact)}
                      />
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
              {filtered.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center gap-3 py-20 text-center"
                >
                  <AddressBook className="h-10 w-10 text-muted-foreground/20" weight="duotone" />
                  <p className="text-[13px] text-muted-foreground/50">Nenhum contato encontrado</p>
                  <p className="text-[11px] text-muted-foreground/30">
                    Tente alterar os termos da busca
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-border/60 hover:bg-border transition-colors data-[resize-handle-state=drag]:bg-accent/30" />

        {/* Detail panel */}
        <ResizablePanel defaultSize={45} minSize={30} className="flex flex-col min-w-0 bg-background/30 border-l border-border/30">
          <AnimatePresence mode="wait">
            {selected ? (
              <ContactDetailPanel key={selected.id} contact={selected} />
            ) : (
              <EmptyDetailState key="empty" />
            )}
          </AnimatePresence>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
