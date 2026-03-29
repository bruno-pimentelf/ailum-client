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
  Lightning,
  UserCircleGear,
  ChartLineUp,
  WhatsappLogo,
  Robot,
  Clock,
  Warning,
  Crown,
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

const SECRETARY_CONS = [
  { icon: Warning, text: "Salário: R$ 2.500/mês" },
  { icon: Warning, text: "Encargos (INSS, FGTS, férias, 13º): +R$ 1.000/mês" },
  { icon: Warning, text: "Treinamentos em vendas: R$ 3.000/ano" },
  { icon: Clock, text: "Supervisão constante: seu tempo (inestimável)" },
  { icon: Warning, text: "Depende de uma pessoa (férias, atestado, rotatividade)" },
  { icon: Warning, text: "Capacidade limitada — não escala" },
  { icon: X, text: "Sem dados estruturados" },
  { icon: X, text: "Zero automação" },
]

const AILUM_PROS = [
  { icon: Lightning, text: "Funciona 24/7, sem férias, sem atestado" },
  { icon: ChartLineUp, text: "Capacidade ilimitada — 10 ou 1.000 leads com mesma eficiência" },
  { icon: Robot, text: "Dados estruturados + dashboard de crescimento" },
  { icon: Lightning, text: "Automação inteligente que multiplica resultado" },
  { icon: WhatsappLogo, text: "Integração total (WhatsApp, CRM, Dashboard...)" },
  { icon: Robot, text: "IA que aprende e melhora continuamente" },
  { icon: UserCircleGear, text: "Gerente de conta dedicado" },
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
  plan: (typeof PLANS)[number] | { id: string; name: string; price: string }
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
        className="fixed inset-x-4 top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-full max-w-md rounded-2xl border border-border/70 bg-zinc-950/95 shadow-2xl shadow-foreground/10 backdrop-blur-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-foreground/[0.06] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 border border-accent/20">
              <CreditCard className="h-4 w-4 text-accent" weight="duotone" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Assinar {plan.name}</h3>
              <p className="text-[11px] text-muted-foreground/65">{plan.price}/mês · plano anual</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-foreground/[0.06] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider">Nome da clínica</label>
            <Input
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              placeholder="Ex: Clínica Harmonia"
              className="mt-1.5 h-11 rounded-xl border-border/70 bg-foreground/[0.03] px-3 text-sm text-foreground placeholder:text-muted-foreground/50"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider">E-mail financeiro</label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="financeiro@clinica.com"
              type="email"
              className="mt-1.5 h-11 rounded-xl border-border/70 bg-foreground/[0.03] px-3 text-sm text-foreground placeholder:text-muted-foreground/50"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider">WhatsApp</label>
            <div className="mt-1.5 flex h-11 items-center rounded-xl border border-border/70 bg-foreground/[0.03]">
              <span className="px-3 text-sm font-medium text-muted-foreground/70">+55</span>
              <Input
                value={phoneLocal}
                onChange={(e) => setPhoneLocal(maskPhoneBR(e.target.value))}
                placeholder="(11) 99999-8888"
                inputMode="numeric"
                className="h-full border-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0"
              />
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || createCheckout.isPending}
            className="h-12 w-full rounded-xl border border-accent/25 bg-accent/20 text-sm font-semibold text-foreground shadow-[0_0_30px_rgba(0,181,212,0.15)] transition-all duration-500 hover:bg-accent/30 disabled:opacity-40"
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

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/50">
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

// ─── Comparison section ───────────────────────────────────────────────────────

function ComparisonSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="mb-24"
    >
      <div className="mx-auto max-w-2xl text-center mb-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
          Comparativo real
        </p>
        <h2 className="mt-4 font-display text-[clamp(1.5rem,3vw,2.2rem)] font-bold leading-[1.1] tracking-tight text-foreground">
          Secretária treinada{" "}
          <span className="text-muted-foreground/60">vs.</span>{" "}
          <span className="text-accent">Ailum</span>
        </h2>
        <p className="mt-3 text-sm text-muted-foreground/65">
          Veja por que clínicas estão migrando para IA.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Secretária */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative overflow-hidden rounded-2xl border border-border/60 bg-foreground/[0.015] p-7"
        >
          <div className="absolute -top-20 -left-20 h-40 w-40 bg-rose-500/[0.04] rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-2.5 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/20">
              <UserCircleGear className="h-4 w-4 text-rose-400" weight="duotone" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Secretária Treinada</h3>
              <p className="text-[10px] text-rose-400/70 font-medium uppercase tracking-wider">Alternativa tradicional</p>
            </div>
          </div>

          <div className="space-y-3">
            {SECRETARY_CONS.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.06 }}
                className="flex items-start gap-2.5"
              >
                <item.icon className="h-3.5 w-3.5 shrink-0 text-rose-400/60 mt-0.5" weight="fill" />
                <span className="text-[13px] text-muted-foreground/70 leading-snug">{item.text}</span>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-rose-500/15 bg-rose-500/[0.05] px-4 py-3">
            <p className="text-[11px] font-medium text-rose-300/80">
              Custo total estimado: <span className="font-bold text-rose-300">R$ 3.750+/mês</span>
            </p>
          </div>
        </motion.div>

        {/* Ailum */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="relative overflow-hidden rounded-2xl border border-accent/20 bg-foreground/[0.02] p-7 shadow-lg shadow-accent/[0.06]"
        >
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
          <div className="absolute -top-20 -right-20 h-40 w-40 bg-accent/[0.06] rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-2.5 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 border border-accent/20">
              <Sparkle className="h-4 w-4 text-accent" weight="fill" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Ailum</h3>
              <p className="text-[10px] text-accent/70 font-medium uppercase tracking-wider">Inteligência artificial</p>
            </div>
          </div>

          <div className="space-y-3">
            {AILUM_PROS.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.06 }}
                className="flex items-start gap-2.5"
              >
                <item.icon className="h-3.5 w-3.5 shrink-0 text-accent mt-0.5" weight="fill" />
                <span className="text-[13px] text-muted-foreground/80 leading-snug">{item.text}</span>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-accent/20 bg-accent/[0.06] px-4 py-3">
            <p className="text-[11px] font-medium text-accent/80">
              A partir de <span className="font-bold text-accent">R$ 1.200/mês</span> — escala infinita
            </p>
          </div>
        </motion.div>
      </div>
    </motion.section>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PrivateCheckoutPage() {
  const [selectedPlan, setSelectedPlan] = useState<(typeof PLANS)[number] | null>(null)
  const [customPlanOpen, setCustomPlanOpen] = useState(false)

  return (
    <main className="relative min-h-screen overflow-hidden bg-background pt-20 pb-10 md:pt-28 md:pb-16">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[6%] top-[6%] h-72 w-72 rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute right-[4%] top-[24%] h-[28rem] w-[28rem] rounded-full bg-cyan-500/8 blur-[140px]" />
        <div className="absolute left-[36%] bottom-[0%] h-80 w-80 rounded-full bg-accent/7 blur-[120px]" />
        <div className="absolute right-[20%] bottom-[20%] h-64 w-64 rounded-full bg-violet-500/5 blur-[100px]" />
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

          <p className="mt-4 text-sm text-muted-foreground/70">
            Planos anuais. Em até 12x no cartão de crédito.
          </p>
        </motion.div>

        {/* Comparison */}
        <ComparisonSection />

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
                  ? "border-accent/30 bg-foreground/[0.025] shadow-lg shadow-accent/[0.08]"
                  : "border-border/70 bg-foreground/[0.015] hover:border-border hover:shadow-md hover:shadow-accent/[0.03]"
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

              <h3 className="text-sm font-semibold text-foreground">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight text-foreground">
                  {plan.price}
                </span>
                <span className="text-sm text-muted-foreground/60">/mês</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground/70">{plan.description}</p>

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

              <ul className="mt-7 flex flex-col gap-3 border-t border-foreground/[0.06] pt-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-[13px] text-muted-foreground/70">
                    <Check className="h-3.5 w-3.5 shrink-0 text-accent" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Custom plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="relative mt-4 overflow-hidden rounded-2xl border border-border/60 bg-foreground/[0.015] p-7 md:p-8"
        >
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gradient-to-b from-violet-500/[0.04] via-accent/[0.03] to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/30 to-transparent" />

          <div className="relative flex flex-col items-center text-center md:flex-row md:text-left md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20">
                  <Crown className="h-4 w-4 text-violet-400" weight="fill" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Custom</h3>
                  <p className="text-[10px] text-violet-400/70 font-medium uppercase tracking-wider">Sob medida</p>
                </div>
              </div>

              <p className="text-[14px] text-muted-foreground/70 leading-relaxed max-w-xl">
                Precisa de mais conversas, múltiplos WhatsApps ou integrações específicas?
                Montamos um plano sob medida para a sua operação. Fale direto com o nosso time.
              </p>

              <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                {[
                  "Volume ilimitado",
                  "Múltiplos WhatsApps",
                  "Integrações custom",
                  "SLA dedicado",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/15 bg-violet-500/[0.06] px-3 py-1 text-[11px] text-violet-300/80"
                  >
                    <Check className="h-3 w-3 text-violet-400" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 shrink-0">
              <div className="text-center">
                <span className="text-2xl font-bold tracking-tight text-foreground">Personalizado</span>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">montado para você</p>
              </div>
              <Button
                onClick={() => setCustomPlanOpen(true)}
                className="cta-shimmer relative overflow-hidden h-11 px-8 rounded-xl border border-violet-500/25 bg-violet-500/15 text-[13px] font-semibold text-violet-200 transition-all duration-500 hover:bg-violet-500/25 hover:border-violet-500/40 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] cursor-pointer"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Começar agora
                  <CaretRight className="h-3.5 w-3.5" />
                </span>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Security note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground/50"
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

      {/* Custom plan modal */}
      <AnimatePresence>
        {customPlanOpen && (
          <CheckoutModal
            plan={{ id: "ailum-custom", name: "Custom", price: "Personalizado" }}
            onClose={() => setCustomPlanOpen(false)}
          />
        )}
      </AnimatePresence>
    </main>
  )
}
