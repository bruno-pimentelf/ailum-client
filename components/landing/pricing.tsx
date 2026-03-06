"use client"

import { motion } from "framer-motion"
import { Check } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { FadeIn, StaggerContainer, staggerItem } from "./motion"

const plans = [
  {
    name: "Essencial",
    price: "R$497",
    period: "mes",
    description: "Para clinicas que estao comecando a automatizar.",
    features: [
      "IA no WhatsApp 24h",
      "Funil com ate 5 status",
      "Calendario integrado",
      "Resumo de conversas",
      "Suporte por chat",
    ],
    cta: "Comecar agora",
    highlight: false,
  },
  {
    name: "Profissional",
    price: "R$997",
    period: "mes",
    description: "Para clinicas em crescimento que precisam de mais controle.",
    features: [
      "Tudo do Essencial",
      "Voz personalizada da IA",
      "Cobranca Pix automatica",
      "Funis ilimitados",
      "Gerente de conta dedicado",
      "Lembretes e follow-up",
    ],
    cta: "Falar com especialista",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Sob consulta",
    period: "",
    description: "Para redes de clinicas com necessidades avancadas.",
    features: [
      "Tudo do Profissional",
      "Multiplas unidades",
      "API e integracoes custom",
      "SLA garantido",
      "Onboarding prioritario",
      "Relatorios avancados",
    ],
    cta: "Falar com vendas",
    highlight: false,
  },
]

export function Pricing() {
  return (
    <section id="precos" className="border-t border-border py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="mx-auto max-w-lg text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            Precos
          </p>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Simples,{" "}
            <span className="font-display italic text-accent">transparente</span>
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Sem taxas escondidas. Cancele quando quiser.
          </p>
        </FadeIn>

        <StaggerContainer className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-3" staggerDelay={0.12}>
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={staggerItem}
              whileHover={{
                y: -6,
                transition: { duration: 0.35, ease: [0.33, 1, 0.68, 1] }
              }}
              className={`group relative overflow-hidden rounded-2xl border p-7 transition-all duration-500 ${plan.highlight
                ? "border-accent/30 bg-card shadow-lg shadow-accent/[0.08]"
                : "border-border bg-card hover:border-accent/15 hover:shadow-md hover:shadow-accent/[0.03]"
                }`}
            >
              {plan.highlight && (
                <>
                  {/* Accent top bar */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
                  {/* Background glow */}
                  <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-accent/[0.06] rounded-full blur-3xl pointer-events-none" />
                </>
              )}
              {plan.highlight && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="absolute top-3 right-3"
                >
                  <span className="rounded-full bg-accent/10 border border-accent/20 px-2.5 py-0.5 text-[10px] font-medium text-accent">
                    Mais popular
                  </span>
                </motion.div>
              )}

              <h3 className="text-sm font-semibold text-foreground">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight text-foreground">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-sm text-muted-foreground">/{plan.period}</span>
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{plan.description}</p>

              <Button
                className={`mt-6 w-full rounded-lg text-[13px] font-medium transition-all duration-300 ${plan.highlight
                  ? "bg-accent text-accent-foreground hover:bg-accent/90 hover:shadow-md hover:shadow-accent/20"
                  : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
              >
                {plan.cta}
              </Button>

              <ul className="mt-7 flex flex-col gap-3 border-t border-border pt-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
                    <Check className="h-3.5 w-3.5 shrink-0 text-accent" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
