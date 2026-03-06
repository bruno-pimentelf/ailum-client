"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  MagnifyingGlass,
  User,
  ChatCircleText,
  Copy,
  Check,
} from "@phosphor-icons/react"
import { ChatView } from "@/components/app/chat-view"

const ease = [0.33, 1, 0.68, 1] as const

// ─── Types ────────────────────────────────────────────────────────────────────

type Message = {
  id: string
  text: string
  time: string
  from: "ai" | "contact"
  read?: boolean
}

type Conversation = {
  id: string
  name: string
  preview: string
  time: string
  funnel: string
  phone: string
  unread?: number
  online?: boolean
  messages: Message[]
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const conversations: Conversation[] = [
  {
    id: "1",
    name: "Ana Costa",
    preview: "Qual desses horários fica melhor para vo...",
    time: "01:24",
    funnel: "Sem funil",
    phone: "+55 11 99164-0164",
    unread: 2,
    online: true,
    messages: [
      { id: "m1", text: "Olá! Gostaria de agendar uma consulta.", time: "01:20 06/03", from: "contact" },
      { id: "m2", text: "Claro, Ana! Tenho horários disponíveis na segunda-feira, dia 9 de março, às 15h ou às 16h. Qual prefere?", time: "01:21 06/03", from: "ai" },
      { id: "m3", text: "A consulta será presencial ou online?", time: "01:22 06/03", from: "contact" },
      { id: "m4", text: "Será online. Entraremos em contato pelo WhatsApp no horário marcado com o link de acesso.", time: "01:23 06/03", from: "ai" },
      { id: "m5", text: "Se nenhum desses horários servir, posso verificar outras opções dentro do período das 14h às 17h30 em dia útil.", time: "01:24 06/03", from: "ai" },
      { id: "m6", text: "Qual desses horários fica melhor para você?", time: "01:24 06/03", from: "contact" },
    ],
  },
  {
    id: "2",
    name: "João Magalhães",
    preview: "(apague)",
    time: "23:59",
    funnel: "Análise - Agend...",
    phone: "+55 11 98765-4207",
    messages: [
      { id: "m1", text: "Boa noite! Preciso remarcar minha consulta.", time: "23:50 05/03", from: "contact" },
      { id: "m2", text: "Boa noite, João! Claro, sem problema. Qual data você prefere?", time: "23:52 05/03", from: "ai", read: true },
    ],
  },
  {
    id: "3",
    name: "Thyago Medici",
    preview: "Novo Lead em Humano - IR Lead...",
    time: "22:16",
    funnel: "Sem funil",
    phone: "+55 21 97654-0888",
    messages: [
      { id: "m1", text: "Olá, vim pelo Instagram. Vocês atendem plano de saúde?", time: "22:10 05/03", from: "contact" },
      { id: "m2", text: "Olá, Thyago! Atendemos alguns planos, sim. Pode me informar qual é o seu?", time: "22:12 05/03", from: "ai" },
    ],
  },
  {
    id: "4",
    name: "Leonardo Ferreira",
    preview: "Você pode me informar esses dados e, s...",
    time: "20:14",
    funnel: "Agendador",
    phone: "+55 31 96543-3129",
    messages: [
      { id: "m1", text: "Preciso dos dados do médico para o meu convênio.", time: "20:10 05/03", from: "contact" },
      { id: "m2", text: "Você pode me informar esses dados e, se possível, o número do seu convênio?", time: "20:14 05/03", from: "ai" },
    ],
  },
  {
    id: "5",
    name: "Gabriel Souza Bonanni",
    preview: "Como posso te chamar? Me conta um po...",
    time: "18:25",
    funnel: "Recepção - Fec...",
    phone: "+55 11 95432-5974",
    messages: [
      { id: "m1", text: "Oi! Quero marcar uma avaliação.", time: "18:20 05/03", from: "contact" },
      { id: "m2", text: "Oi! Fico feliz em ajudar. Como posso te chamar? Me conta um pouco sobre o que você está buscando.", time: "18:25 05/03", from: "ai" },
    ],
  },
  {
    id: "6",
    name: "Bruno Ita",
    preview: "Para começarmos: como posso te chama...",
    time: "18:22",
    funnel: "Recepção - Age...",
    phone: "+55 11 94321-9661",
    messages: [
      { id: "m1", text: "Boa tarde!", time: "18:20 05/03", from: "contact" },
      { id: "m2", text: "Boa tarde! Para começarmos: como posso te chamar?", time: "18:22 05/03", from: "ai" },
    ],
  },
]

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
  const colors = [
    "bg-accent/20 text-accent",
    "bg-violet-500/20 text-violet-400",
    "bg-emerald-500/20 text-emerald-400",
    "bg-rose-500/20 text-rose-400",
    "bg-amber-500/20 text-amber-400",
  ]
  const color = colors[name.charCodeAt(0) % colors.length]
  const sz = size === "sm" ? "h-8 w-8 text-[11px]" : size === "lg" ? "h-10 w-10 text-[14px]" : "h-9 w-9 text-[12px]"
  return (
    <div className={`${sz} ${color} shrink-0 rounded-full flex items-center justify-center font-semibold border border-white/5`}>
      {initials}
    </div>
  )
}

// ─── Phone copy button ────────────────────────────────────────────────────────

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
      onKeyDown={(e) => e.key === "Enter" && handleCopy(e as any)}
      title={`Copiar ${phone}`}
      className="group flex items-center gap-1 cursor-pointer"
    >
      <span className="text-[10px] text-muted-foreground/40 font-mono group-hover:text-muted-foreground/70 transition-colors duration-150">
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
            <Copy className="h-2.5 w-2.5 text-muted-foreground/40" />
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Conversation item ────────────────────────────────────────────────────────

function ConversationItem({
  conv,
  active,
  onClick,
}: {
  conv: Conversation
  active: boolean
  onClick: () => void
}) {
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
        <Avatar name={conv.name} />
        {conv.online && (
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-background" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-[13px] font-medium truncate ${active ? "text-foreground" : "text-foreground/90"}`}>
            {conv.name}
          </span>
          <span className="text-[11px] text-muted-foreground/60 shrink-0">{conv.time}</span>
        </div>
        <p className="mt-0.5 text-[12px] text-muted-foreground/70 truncate leading-snug">
          {conv.preview}
        </p>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 min-w-0">
            <User className="h-3 w-3 text-muted-foreground/40 shrink-0" />
            <span className="text-[11px] text-muted-foreground/50 truncate">{conv.funnel}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <PhoneCopy phone={conv.phone} />
            {conv.unread ? (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-accent-foreground px-1">
                {conv.unread}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ChatsPage() {
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Conversation | null>(conversations[0])

  const filtered = conversations.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.preview.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Conversation list ── */}
      <div className="flex w-[280px] shrink-0 flex-col border-r border-border bg-background/50">
        <div className="p-3 border-b border-border/50">
          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar conversas..."
              className="h-8 w-full rounded-lg bg-muted/30 pl-8 pr-3 text-[12px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all duration-200"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence initial={false}>
            {filtered.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                active={selected?.id === conv.id}
                onClick={() => setSelected(conv)}
              />
            ))}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center px-4">
              <ChatCircleText className="h-8 w-8 text-muted-foreground/20" />
              <p className="text-[12px] text-muted-foreground/40">Nenhuma conversa encontrada</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Chat area ── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {selected ? (
            <ChatView key={selected.id} contact={selected} />
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-1 flex-col items-center justify-center gap-4 text-center px-8"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 border border-accent/20">
                <ChatCircleText className="h-8 w-8 text-accent/60" weight="duotone" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-foreground">Selecione uma conversa</h3>
                <p className="mt-1.5 text-[13px] text-muted-foreground/60 max-w-[260px] leading-relaxed">
                  Escolha uma conversa da lista ao lado para começar a visualizar e enviar mensagens
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground/30 mt-2">
                Dica: use a busca para encontrar conversas rapidamente
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
