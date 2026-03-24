"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Check,
  X,
  CreditCard,
  LockSimple,
  Sparkle,
  CaretRight,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCreatePublicAilumCheckoutLink } from "@/hooks/use-infinitepay-checkout"
import type { PublicCheckoutLinkResponse } from "@/lib/api/public-checkout"

// ─── Plans ────────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: "ailum-starter",
    name: "Starter",
    price: "R$ 1.200",
    description: "Para clínicas que estão começando a automatizar.",
    features: [
      "250 conversas de IA por mês",
      "40 min de áudio gerados por IA",
      "6 membros",
      "Gerente de Onboarding",
      "Suporte Automatizado",
      "10 arquivos na nuvem por conversa",
      "1 WhatsApp conectado",
    ],
    highlight: false,
  },
  {
    id: "ailum-pro",
    name: "Pro",
    price: "R$ 1.800",
    description: "Para clínicas em crescimento que precisam de mais controle.",
    features: [
      "450 conversas de IA por mês",
      "90 min de áudio gerados por IA",
      "12 membros",
      "Gerente de Conta próprio",
      "Suporte feito pelo Gerente de Conta",
      "Acesso a Consultorias e Mentoria",
      "Desconto expressivo em eventos do Ailum",
      "Até 2 WhatsApps conectados",
    ],
    highlight: true,
  },
  {
    id: "ailum-max",
    name: "Max",
    price: "R$ 2.700",
    description: "Para clínicas que querem o máximo de performance.",
    features: [
      "800 conversas de IA por mês",
      "180 min de áudio gerados por IA",
      "Membros ilimitados",
      "Gerente de Conta + acesso aos fundadores",
      "Consultoria e Mentoria — Vitalício",
      "Acesso gratuito a todos eventos do Ailum",
      "Até 4 WhatsApps conectados",
    ],
    highlight: false,
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function maskPhoneBR(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function getCheckoutUrl(result: PublicCheckoutLinkResponse | null): string | null {
  if (!result) return null
  const direct = [
    result.checkoutUrl,
    result.url,
    result.link,
    (result.checkout as { url?: string } | undefined)?.url,
    (result.checkout as { checkoutUrl?: string } | undefined)?.checkoutUrl,
    (result.checkout as { paymentLink?: string } | undefined)?.paymentLink,
  ]
  return direct.find((v): v is string => typeof v === "string" && v.length > 0) ?? null
}

// ─── Checkout modal ───────────────────────────────────────────────────────────

function CheckoutModal({
  plan,
  onClose,
}: {
  plan: (typeof PLANS)[number]
  onClose: () => void
}) {
  const [clinicName, setClinicName] = useState("")
  const [email, setEmail] = useState("")
  const [phoneLocal, setPhoneLocal] = useState("")
  const [statusText, setStatusText] = useState("")
  const createCheckout = useCreatePublicAilumCheckoutLink()

  const phoneDigits = phoneLocal.replace(/\D/g, "")
  const canSubmit = clinicName.trim().length >= 2 && email.includes("@") && phoneDigits.length >= 10

  async function handleSubmit() {
    if (!canSubmit) return
    const phoneNumber = `+55${phoneDigits}`
    const redirectUrl = typeof window !== "undefined" ? `${window.location.origin}/pagamento/sucesso` : undefined

    const result = await createCheckout.mutateAsync({
      clinicName: clinicName.trim(),
      email: email.trim(),
      phoneNumber,
      planId: plan.id,
      redirectUrl,
    })

    const checkoutUrl = getCheckoutUrl(result)
    if (!checkoutUrl) return
    setStatusText("Redirecionando para o checkout seguro...")
    window.location.href = checkoutUrl
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
        className="fixed inset-x-4 top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950/95 shadow-2xl shadow-black/60 backdrop-blur-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 border border-accent/20">
              <CreditCard className="h-4 w-4 text-accent" weight="duotone" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Assinar {plan.name}</h3>
              <p className="text-[11px] text-white/45">{plan.price}/mês · plano anual</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider">Nome da clínica</label>
            <Input
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              placeholder="Ex: Clínica Harmonia"
              className="mt-1.5 h-11 rounded-xl border-white/10 bg-white/[0.03] px-3 text-sm text-white placeholder:text-white/30"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider">E-mail financeiro</label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="financeiro@clinica.com"
              type="email"
              className="mt-1.5 h-11 rounded-xl border-white/10 bg-white/[0.03] px-3 text-sm text-white placeholder:text-white/30"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-white/50 uppercase tracking-wider">WhatsApp</label>
            <div className="mt-1.5 flex h-11 items-center rounded-xl border border-white/10 bg-white/[0.03]">
              <span className="px-3 text-sm font-medium text-white/50">+55</span>
              <Input
                value={phoneLocal}
                onChange={(e) => setPhoneLocal(maskPhoneBR(e.target.value))}
                placeholder="(11) 99999-8888"
                inputMode="numeric"
                className="h-full border-0 bg-transparent text-sm text-white placeholder:text-white/30 focus-visible:ring-0"
              />
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || createCheckout.isPending}
            className="h-12 w-full rounded-xl border border-accent/25 bg-accent/20 text-sm font-semibold text-white shadow-[0_0_30px_rgba(0,181,212,0.15)] transition-all duration-500 hover:bg-accent/30 disabled:opacity-40"
          >
            {createCheckout.isPending ? (
              "Preparando checkout..."
            ) : (
              <span className="flex items-center gap-2">
                Ir para o pagamento
                <CaretRight className="h-4 w-4" />
              </span>
            )}
          </Button>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/35">
            <LockSimple className="h-3 w-3" />
            Checkout seguro processado pela InfinitePay
          </div>

          {statusText && (
            <p className="rounded-xl border border-accent/20 bg-accent/[0.06] px-3 py-2 text-center text-xs text-accent/80">
              {statusText}
            </p>
          )}

          {createCheckout.error && (
            <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              {(createCheckout.error as Error).message}
            </p>
          )}
        </div>
      </motion.div>
    </>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PrivateCheckoutPage() {
  const [selectedPlan, setSelectedPlan] = useState<(typeof PLANS)[number] | null>(null)

  return (
    <main className="relative min-h-screen overflow-hidden bg-background pt-20 pb-10 md:pt-28 md:pb-16">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[6%] top-[6%] h-72 w-72 rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute right-[4%] top-[24%] h-[28rem] w-[28rem] rounded-full bg-cyan-500/8 blur-[140px]" />
        <div className="absolute left-[36%] bottom-[0%] h-80 w-80 rounded-full bg-accent/7 blur-[120px]" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7 }}
          className="mx-auto max-w-2xl text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/[0.08] px-4 py-2 shadow-[0_0_30px_rgba(0,181,212,0.14)]">
            <Sparkle className="h-3.5 w-3.5 text-accent" weight="fill" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
              Checkout Privado
            </span>
          </div>

          <h1 className="mt-6 font-display text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold leading-[1.08] tracking-[-0.03em] text-foreground">
            Escolha seu plano.
            <br />
            <span className="text-accent">Comece no nível alto padrão.</span>
          </h1>

          <p className="mt-4 text-sm text-white/50">
            Planos anuais. Em até 12x no cartão de crédito.
          </p>
        </motion.div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 400, damping: 25, delay: i * 0.1 }}
              className={`group relative overflow-hidden rounded-2xl border p-7 transition-all duration-500 ${
                plan.highlight
                  ? "border-accent/30 bg-white/[0.025] shadow-lg shadow-accent/[0.08]"
                  : "border-white/10 bg-white/[0.015] hover:border-white/20 hover:shadow-md hover:shadow-accent/[0.03]"
              }`}
            >
              {plan.highlight && (
                <>
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
                  <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-accent/[0.06] rounded-full blur-3xl pointer-events-none" />
                </>
              )}
              {plan.highlight && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="absolute top-3 right-3"
                >
                  <span className="rounded-full bg-accent/10 border border-accent/20 px-2.5 py-0.5 text-[10px] font-medium text-accent">
                    Mais popular
                  </span>
                </motion.div>
              )}

              <h3 className="text-sm font-semibold text-white">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight text-white">
                  {plan.price}
                </span>
                <span className="text-sm text-white/40">/mês</span>
              </div>
              <p className="mt-2 text-xs text-white/50">{plan.description}</p>

              <Button
                onClick={() => setSelectedPlan(plan)}
                className={`cta-shimmer relative overflow-hidden mt-6 w-full h-11 rounded-xl text-[13px] font-semibold transition-all duration-500 cursor-pointer ${
                  plan.highlight
                    ? "bg-accent text-accent-foreground shadow-[0_0_32px_rgba(0,181,212,0.25)] hover:bg-accent/90 hover:shadow-[0_0_40px_rgba(0,181,212,0.35)]"
                    : "border border-accent/20 bg-accent/10 text-accent hover:bg-accent/20 hover:border-accent/35 hover:shadow-[0_0_24px_rgba(0,181,212,0.1)]"
                }`}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Começar agora
                  <CaretRight className="h-3.5 w-3.5" />
                </span>
              </Button>

              <ul className="mt-7 flex flex-col gap-3 border-t border-white/[0.06] pt-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-[13px] text-white/55">
                    <Check className="h-3.5 w-3.5 shrink-0 text-accent" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Security note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 flex items-center justify-center gap-2 text-xs text-white/30"
        >
          <LockSimple className="h-3.5 w-3.5" />
          Pagamento seguro processado pela InfinitePay
        </motion.div>
      </div>

      {/* Checkout modal */}
      <AnimatePresence>
        {selectedPlan && (
          <CheckoutModal
            plan={selectedPlan}
            onClose={() => setSelectedPlan(null)}
          />
        )}
      </AnimatePresence>
    </main>
  )
}
