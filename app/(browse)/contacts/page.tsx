"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  MagnifyingGlass,
  CaretRight,
  AddressBook,
  WhatsappLogo,
} from "@phosphor-icons/react"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"
import { ChatView } from "@/components/app/chat-view"
import type { ChatContact, Message } from "@/components/app/chat-view"

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
  online?: boolean
  messages: Message[]
}

// ─── Mock data ──────────────────────────────────────────────────────────────────

const contacts: Contact[] = [
  { id: "1", name: "Ana Costa", email: "ana.costa@email.com", phone: "+55 11 99164-0164", funnel: "Recepção - Agendamento", tags: ["Instagram", "Lead quente"], lastContact: "01:24", hasWhatsapp: true, online: true, messages: [
    { id: "m1", text: "Olá! Gostaria de agendar uma consulta.", time: "01:20 06/03", from: "contact" },
    { id: "m2", text: "Claro, Ana! Tenho horários disponíveis na segunda-feira. Qual prefere?", time: "01:21 06/03", from: "ai" },
    { id: "m3", text: "A consulta será presencial ou online?", time: "01:22 06/03", from: "contact" },
    { id: "m4", text: "Será online. Entraremos em contato pelo WhatsApp no horário marcado.", time: "01:23 06/03", from: "ai" },
  ]},
  { id: "2", name: "João Magalhães", email: "joao.m@email.com", phone: "+55 11 98765-4207", funnel: "Análise - Agendamento", tags: ["Retorno"], lastContact: "23:59", hasWhatsapp: true, messages: [
    { id: "m1", text: "Boa noite! Preciso remarcar minha consulta.", time: "23:50 05/03", from: "contact" },
    { id: "m2", text: "Boa noite, João! Claro, sem problema. Qual data você prefere?", time: "23:52 05/03", from: "ai", read: true },
  ]},
  { id: "3", name: "Thyago Medici", email: "thyago.medici@email.com", phone: "+55 21 97654-0888", funnel: "Sem funil", tags: ["Instagram"], lastContact: "22:16", hasWhatsapp: true, messages: [
    { id: "m1", text: "Olá, vim pelo Instagram. Vocês atendem plano de saúde?", time: "22:10 05/03", from: "contact" },
    { id: "m2", text: "Olá! Atendemos alguns planos, sim. Pode me informar qual é o seu?", time: "22:12 05/03", from: "ai" },
  ]},
  { id: "4", name: "Leonardo Ferreira", email: "leo.ferreira@email.com", phone: "+55 31 96543-3129", funnel: "Agendador", tags: ["Convênio"], lastContact: "20:14", hasWhatsapp: true, messages: [
    { id: "m1", text: "Preciso dos dados do médico para o meu convênio.", time: "20:10 05/03", from: "contact" },
    { id: "m2", text: "Você pode me informar esses dados e o número do seu convênio?", time: "20:14 05/03", from: "ai" },
  ]},
  { id: "5", name: "Gabriel Souza Bonanni", email: "gabriel.bonanni@email.com", phone: "+55 11 95432-5974", funnel: "Recepção - Fechamento", tags: ["Avaliação"], lastContact: "18:25", hasWhatsapp: true, messages: [
    { id: "m1", text: "Oi! Quero marcar uma avaliação.", time: "18:20 05/03", from: "contact" },
    { id: "m2", text: "Oi! Fico feliz em ajudar. Como posso te chamar? Me conta um pouco sobre o que está buscando.", time: "18:25 05/03", from: "ai" },
  ]},
  { id: "6", name: "Bruno Ita", email: "bruno.ita@email.com", phone: "+55 11 94321-9661", funnel: "Recepção - Agendamento", tags: [], lastContact: "18:22", hasWhatsapp: true, messages: [
    { id: "m1", text: "Boa tarde!", time: "18:20 05/03", from: "contact" },
    { id: "m2", text: "Boa tarde! Para começarmos: como posso te chamar?", time: "18:22 05/03", from: "ai" },
  ]},
  { id: "7", name: "Fernanda Reis", email: "fernanda.reis@email.com", phone: "+55 11 93210-7712", funnel: "Agendado", tags: ["Confirmado"], lastContact: "ontem", hasWhatsapp: true, messages: [
    { id: "m1", text: "Consulta confirmada para quinta-feira às 14h.", time: "ontem 10:00", from: "ai" },
  ]},
  { id: "8", name: "Mariana Lopes", email: "mariana.l@email.com", phone: "+55 11 92109-2241", funnel: "Novo contato", tags: [], lastContact: "1h", hasWhatsapp: true, messages: [
    { id: "m1", text: "Boa tarde, gostaria de informações.", time: "1h", from: "contact" },
    { id: "m2", text: "Olá! Como posso ajudar?", time: "1h", from: "ai" },
  ]},
]

function toChatContact(contact: Contact): ChatContact {
  return {
    id: contact.id,
    name: contact.name,
    online: contact.online,
    time: contact.lastContact,
    messages: contact.messages,
  }
}

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

// ─── Table (reusable block) ────────────────────────────────────────────────────

function ContactsTable({
  search,
  setSearch,
  filtered,
  selected,
  setSelected,
}: {
  search: string
  setSearch: (v: string) => void
  filtered: Contact[]
  selected: Contact | null
  setSelected: (c: Contact | null) => void
}) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
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
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
            <tr>
              <th className="text-left py-2.5 pl-4 pr-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Contato</th>
              <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Telefone</th>
              <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Funil</th>
              <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Último</th>
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
                  onClick={() => setSelected(selected?.id === contact.id ? null : contact)}
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
            <p className="text-[11px] text-muted-foreground/30">Tente alterar os termos da busca</p>
          </motion.div>
        )}
      </div>
    </div>
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
      {selected ? (
        <ResizablePanelGroup className="h-full w-full">
          <ResizablePanel defaultSize={55} minSize={35} className="flex flex-col min-w-0">
            <ContactsTable
              search={search}
              setSearch={setSearch}
              filtered={filtered}
              selected={selected}
              setSelected={setSelected}
            />
          </ResizablePanel>
          <ResizableHandle withHandle className="bg-border/60 hover:bg-border transition-colors data-[resize-handle-state=drag]:bg-accent/30" />
          <ResizablePanel defaultSize={45} minSize={30} className="flex flex-col min-w-0 bg-background/50 border-l border-border/30">
            <ChatView contact={toChatContact(selected)} />
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <div className="flex flex-col h-full w-full">
          <ContactsTable
            search={search}
            setSearch={setSearch}
            filtered={filtered}
            selected={null}
            setSelected={setSelected}
          />
        </div>
      )}
    </div>
  )
}
