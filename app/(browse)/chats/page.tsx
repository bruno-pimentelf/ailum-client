"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  MagnifyingGlass,
  User,
  ChatCircleText,
  PaperclipHorizontal,
  Microphone,
  PaperPlaneTilt,
  Smiley,
  Star,
  ArrowCounterClockwise,
  BookmarkSimple,
  Archive,
  DotsThree,
  Phone,
  Check,
  Checks,
  Robot,
} from "@phosphor-icons/react"

const ease = [0.33, 1, 0.68, 1] as const

// ─── Mock data ────────────────────────────────────────────────────────────────

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

const conversations: Conversation[] = [
  {
    id: "1",
    name: "Ana Costa",
    preview: "Qual desses horários fica melhor para vo...",
    time: "01:24",
    funnel: "Sem funil",
    phone: "0164",
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
    phone: "4207",
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
    phone: "0888",
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
    phone: "3129",
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
    phone: "5974",
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
    phone: "9661",
    messages: [
      { id: "m1", text: "Boa tarde!", time: "18:20 05/03", from: "contact" },
      { id: "m2", text: "Boa tarde! Para começarmos: como posso te chamar?", time: "18:22 05/03", from: "ai" },
    ],
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

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
    <motion.button
      layout
      onClick={onClick}
      className={`w-full text-left px-3 py-3 flex items-start gap-3 border-b border-border/50 transition-colors duration-150 relative ${
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
            <span className="text-[10px] text-muted-foreground/40 font-mono">•••• {conv.phone}</span>
            {conv.unread ? (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-accent-foreground px-1">
                {conv.unread}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </motion.button>
  )
}

function MessageBubble({ msg, index }: { msg: Message; index: number }) {
  const isAI = msg.from === "ai"
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease }}
      className={`flex ${isAI ? "justify-start" : "justify-end"}`}
    >
      {isAI && (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 border border-accent/20 mr-2 mt-1 self-end">
          <Robot className="h-3.5 w-3.5 text-accent" weight="fill" />
        </div>
      )}
      <div
        className={`max-w-[72%] rounded-2xl px-4 py-2.5 ${
          isAI
            ? "bg-card border border-border/60 rounded-bl-sm text-foreground"
            : "bg-accent/15 border border-accent/20 rounded-br-sm text-foreground"
        }`}
      >
        <p className="text-[13px] leading-relaxed">{msg.text}</p>
        <div className={`mt-1 flex items-center gap-1 ${isAI ? "justify-start" : "justify-end"}`}>
          <span className="text-[10px] text-muted-foreground/40">{msg.time}</span>
          {!isAI && (
            msg.read
              ? <Checks className="h-3 w-3 text-accent" />
              : <Check className="h-3 w-3 text-muted-foreground/40" />
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ChatsPage() {
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Conversation | null>(conversations[0])
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const filtered = conversations.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.preview.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [selected])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    setInputValue("")
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Conversation list ── */}
      <div className="flex w-[260px] shrink-0 flex-col border-r border-border bg-background/50">
        {/* Search */}
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

        {/* List */}
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
            <motion.div
              key={selected.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-1 flex-col min-h-0 overflow-hidden"
            >
              {/* Chat header */}
              <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-5">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar name={selected.name} size="sm" />
                    {selected.online && (
                      <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 border-2 border-background" />
                    )}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-foreground leading-tight">{selected.name}</p>
                    <p className="text-[11px] text-muted-foreground/50 leading-tight">
                      {selected.online ? "Online agora" : `Visto às ${selected.time}`}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-0.5">
                  {[Phone, ArrowCounterClockwise, ChatCircleText, Smiley, Star, BookmarkSimple, Archive, DotsThree].map((Icon, i) => (
                    <button
                      key={i}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 transition-colors duration-150"
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3">
                {selected.messages.map((msg, i) => (
                  <MessageBubble key={msg.id} msg={msg} index={i} />
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="shrink-0 border-t border-border px-4 py-3">
                <form onSubmit={handleSend} className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 transition-colors duration-150"
                  >
                    <PaperclipHorizontal className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 transition-colors duration-150"
                  >
                    <Microphone className="h-4 w-4" />
                  </button>
                  <input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Digite uma mensagem..."
                    className="flex-1 h-9 rounded-xl border border-border bg-card/50 px-4 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all duration-300"
                  />
                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.92 }}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
                      inputValue.trim()
                        ? "bg-accent text-accent-foreground shadow-md shadow-accent/20"
                        : "bg-muted/40 text-muted-foreground/40"
                    }`}
                  >
                    <PaperPlaneTilt className="h-4 w-4" weight="fill" />
                  </motion.button>
                </form>
              </div>
            </motion.div>
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
