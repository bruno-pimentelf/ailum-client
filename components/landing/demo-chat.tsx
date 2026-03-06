"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence, useInView } from "framer-motion"
import { Checks, Robot } from "@phosphor-icons/react"

const ease = [0.33, 1, 0.68, 1] as any

const messages = [
  { id: 1, from: "patient", text: "Oi! Queria marcar uma consulta com a Dra. Marina, tem horário disponível?", time: "09:41" },
  { id: 2, from: "ai", text: "Oi! Que bom que entrou em contato 😊 Deixa eu dar uma olhada na agenda dela agora...", time: "09:41" },
  { id: 3, from: "ai", text: "Achei dois horários ótimos essa semana: quarta (12/03) às 14h ou quinta (13/03) às 10h. Qual fica melhor pra você?", time: "09:42" },
  { id: 4, from: "patient", text: "Quinta às 10h perfeito!", time: "09:43" },
  { id: 5, from: "ai", text: "Perfeito! Já reservei o horário pra você 🙌 Pra garantir a consulta na agenda, é só confirmar com o Pix de R$150,00 abaixo — é rapidinho!", time: "09:43" },
  { id: 6, from: "ai", type: "pix", text: "Pix Copia e Cola\n\nR$ 150,00\nClinica Harmonia LTDA", time: "09:43" },
]

export function DemoChat() {
  const ref = useRef(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [visibleMessages, setVisibleMessages] = useState<number[]>([])
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    if (!isInView) return
    let cancelled = false

    async function sequence() {
      for (let i = 0; i < messages.length; i++) {
        if (cancelled) return
        const msg = messages[i]

        if (msg.from === "ai") {
          setIsTyping(true)
          await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800))
          if (cancelled) return
          setIsTyping(false)
          // Small delay so typing indicator fades out before message appears
          await new Promise((r) => setTimeout(r, 150))
          if (cancelled) return
        }

        if (msg.from === "patient" && i > 0) {
          await new Promise((r) => setTimeout(r, 1400 + Math.random() * 600))
          if (cancelled) return
        }

        setVisibleMessages((prev) => [...prev, msg.id])
        await new Promise((r) => setTimeout(r, 400))
      }
    }

    const timer = setTimeout(() => sequence(), 600)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [isInView])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [visibleMessages, isTyping])

  return (
    <div ref={ref} className="w-full max-w-sm mx-auto">
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg shadow-foreground/[0.03]">
        {/* WhatsApp header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-accent/[0.06] border-b border-border">
          <div className="h-9 w-9 rounded-full bg-accent/15 flex items-center justify-center">
            <span className="text-xs font-semibold text-accent">CH</span>
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-foreground">Clinica Harmonia</p>
            <div className="flex items-center gap-1.5">
              <Robot className="h-3 w-3 text-accent" />
              <p className="text-[10px] text-accent font-medium">Ailum IA ativa</p>
            </div>
          </div>
        </div>

        {/* Messages — fixed height to prevent layout shift */}
        <div ref={scrollRef} className="flex flex-col gap-2.5 p-4 h-[340px] overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {messages.map((msg) =>
              visibleMessages.includes(msg.id) ? (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease }}
                  layout="position"
                  className={`flex ${msg.from === "patient" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${msg.from === "patient"
                      ? "bg-accent/10 text-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                      } ${(msg as { type?: string }).type === "pix" ? "border border-accent/25" : ""}`}
                  >
                    {(msg as { type?: string }).type === "pix" && (
                      <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-border">
                        <div className="h-4 w-4 rounded bg-accent/15 flex items-center justify-center">
                          <span className="text-[9px] font-bold text-accent">$</span>
                        </div>
                        <span className="text-[10px] font-semibold text-accent">Pagamento via Pix</span>
                      </div>
                    )}
                    <p className="text-[12px] leading-relaxed whitespace-pre-line">{msg.text}</p>
                    <div className="flex items-center justify-end gap-1 mt-1.5">
                      <span className="text-[9px] text-muted-foreground">{msg.time}</span>
                      {msg.from === "patient" && <Checks className="h-3 w-3 text-accent/70" />}
                    </div>
                  </div>
                </motion.div>
              ) : null
            )}
          </AnimatePresence>

          {/* Typing indicator — positioned at end of flow, no layout shift */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                key="typing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex justify-start"
              >
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40"
                          animate={{ y: [0, -4, 0] }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: i * 0.15,
                            ease: "easeInOut",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
