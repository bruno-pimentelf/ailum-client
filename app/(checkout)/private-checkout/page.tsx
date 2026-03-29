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
    id: "ailum-pro",
    name: "Pro",
    badge: "Mais popular",
    badgeColor: "bg-accent/10 border-accent/20 text-accent",
    price: "R$ 2.200",
    description: "Para clínicas em crescimento que querem automatizar o atendimento e converter mais pacientes.",
    features: [
      "Conversas de IA ilimitadas",
      "1 WhatsApp conectado",
      "Até 12 membros",
      "Gerente de Conta próprio",
      "Suporte feito pelo Gerente de Conta",
      "Acesso a Consultorias e Mentoria",
      "Desconto expressivo em eventos do Ailum",
      "Arquivos ilimitados na nuvem",
    ],
    highlight: true,
  },
  {
    id: "ailum-max",
    name: "Max",
    badge: "Grande Escala",
    badgeColor: "bg-violet-500/10 border-violet-500/20 text-violet-400",
    price: "R$ 3.800",
    description: "Para clínicas que querem o máximo de performance e acesso direto aos fundadores.",
    features: [
      "Conversas de IA ilimitadas",
      "Até 4 WhatsApps conectados",
      "Membros ilimitados",
      "Gerente de Conta + acesso direto aos fundadores",
      "Consultoria e Mentoria vitalícia",
      "Acesso gratuito a todos os eventos do Ailum",
      "Arquivos ilimitados na nuvem",
    ],
    highlight: false,
  },
]

// ─── Comparison data ─────────────────────────────────────────────────────────

const COMPARISON_ROWS = [
  { label: "Disponibilidade",      secretary: "Horário comercial",        ailum: "24/7, sem férias ou atestado" },
  { label: "Custo mensal",         secretary: "R$ 3.500+ (salário + encargos)", ailum: "A partir de R$ 2.200" },
  { label: "Capacidade",           secretary: "Limitada a 1 pessoa",      ailum: "Ilimitada — 10 ou 1.000 leads" },
  { label: "Treinamento",          secretary: "R$ 3.000/ano em cursos",   ailum: "IA aprende sozinha" },
  { label: "Dados estruturados",   secretary: "Manual e incompleto",      ailum: "Dashboard automático" },
  { label: "Automação",            secretary: "Zero",                     ailum: "Follow-ups, PIX, agendamento" },
  { label: "Escalabilidade",       secretary: "Precisa contratar mais",   ailum: "Mesma eficiência em qualquer volume" },
  { label: "Risco",                secretary: "Férias, rotatividade, erro humano", ailum: "Consistente e previsível" },
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
  plan: { id: string; name: string; price: string }
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm" />
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
              <p className="text-[11px] text-muted-foreground/65">{plan.price}/mês</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-foreground/[0.06] transition-colors cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider">Nome da clínica</label>
            <Input value={clinicName} onChange={(e) => setClinicName(e.target.value)} placeholder="Ex: Clínica Harmonia"
              className="mt-1.5 h-11 rounded-xl border-border/70 bg-foreground/[0.03] px-3 text-sm text-foreground placeholder:text-muted-foreground/50" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider">E-mail financeiro</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="financeiro@clinica.com" type="email"
              className="mt-1.5 h-11 rounded-xl border-border/70 bg-foreground/[0.03] px-3 text-sm text-foreground placeholder:text-muted-foreground/50" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider">WhatsApp</label>
            <div className="mt-1.5 flex h-11 items-center rounded-xl border border-border/70 bg-foreground/[0.03]">
              <span className="px-3 text-sm font-medium text-muted-foreground/70">+55</span>
              <Input value={phoneLocal} onChange={(e) => setPhoneLocal(maskPhoneBR(e.target.value))} placeholder="(11) 99999-8888" inputMode="numeric"
                className="h-full border-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0" />
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={!canSubmit || createCheckout.isPending}
            className="h-12 w-full rounded-xl border border-accent/25 bg-accent/20 text-sm font-semibold text-foreground shadow-[0_0_30px_rgba(0,181,212,0.15)] transition-all duration-500 hover:bg-accent/30 disabled:opacity-40">
            {createCheckout.isPending ? "Preparando checkout..." : <span className="flex items-center gap-2">Ir para o pagamento <CaretRight className="h-4 w-4" /></span>}
          </Button>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/50">
            <LockSimple className="h-3 w-3" /> Checkout seguro processado pela InfinitePay
          </div>

          {statusText && <p className="rounded-xl border border-accent/20 bg-accent/[0.06] px-3 py-2 text-center text-xs text-accent/80">{statusText}</p>}
          {createCheckout.error && <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{(createCheckout.error as Error).message}</p>}
        </div>
      </motion.div>
    </>
  )
}

// ─── Comparison section (single card, table-style) ───────────────────────────

function ComparisonSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="mb-20"
    >
      <div className="mx-auto max-w-2xl text-center mb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Comparativo real</p>
        <h2 className="mt-4 font-display text-[clamp(1.5rem,3vw,2.2rem)] font-bold leading-[1.1] tracking-tight text-foreground">
          Secretária treinada <span className="text-muted-foreground/60">vs.</span> <span className="text-accent">Ailum</span>
        </h2>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-foreground/[0.015]">
        {/* Header */}
        <div className="grid grid-cols-[1fr_1fr_1fr] border-b border-foreground/[0.08]">
          <div className="px-6 py-5" />
          <div className="px-6 py-5 border-l border-foreground/[0.06]">
            <div className="flex items-center gap-2.5">
              <UserCircleGear className="h-5 w-5 text-rose-400" weight="duotone" />
              <span className="text-[15px] font-bold text-foreground">Secretária</span>
            </div>
          </div>
          <div className="px-6 py-5 border-l border-foreground/[0.06] bg-accent/[0.04]">
            <div className="flex items-center gap-2.5">
              <Sparkle className="h-5 w-5 text-accent" weight="fill" />
              <span className="text-[15px] font-bold text-accent">Ailum</span>
            </div>
          </div>
        </div>

        {/* Rows */}
        {COMPARISON_ROWS.map((row, i) => (
          <motion.div
            key={row.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.04 }}
            className={`grid grid-cols-[1fr_1fr_1fr] ${i < COMPARISON_ROWS.length - 1 ? "border-b border-foreground/[0.05]" : ""}`}
          >
            <div className="px-6 py-4 flex items-center">
              <span className="text-[14px] font-bold text-foreground">{row.label}</span>
            </div>
            <div className="px-6 py-4 border-l border-foreground/[0.05] flex items-center">
              <span className="text-[14px] text-foreground/60">{row.secretary}</span>
            </div>
            <div className="px-6 py-4 border-l border-foreground/[0.05] bg-accent/[0.03] flex items-center">
              <span className="text-[14px] font-semibold text-foreground">{row.ailum}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PrivateCheckoutPage() {
  const [selectedPlan, setSelectedPlan] = useState<{ id: string; name: string; price: string } | null>(null)

  return (
    <main className="relative min-h-screen overflow-hidden bg-background pt-20 pb-10 md:pt-28 md:pb-16">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[6%] top-[6%] h-72 w-72 rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute right-[4%] top-[24%] h-[28rem] w-[28rem] rounded-full bg-cyan-500/8 blur-[140px]" />
        <div className="absolute left-[36%] bottom-[0%] h-80 w-80 rounded-full bg-accent/7 blur-[120px]" />
      </div>

      <div className="relative mx-auto w-full max-w-5xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7 }}
          className="mx-auto max-w-2xl text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/[0.08] px-4 py-2 shadow-[0_0_30px_rgba(0,181,212,0.14)]">
            <Sparkle className="h-3.5 w-3.5 text-accent" weight="fill" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Checkout Privado</span>
          </div>

          <h1 className="mt-6 font-display text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold leading-[1.08] tracking-[-0.03em] text-foreground">
            Escolha seu plano.<br />
            <span className="text-accent">Comece no nível alto padrão.</span>
          </h1>

          <p className="mt-4 text-sm text-muted-foreground/70">Planos mensais. Sem fidelidade.</p>
        </motion.div>

        {/* Comparison */}
        <ComparisonSection />

        {/* Plans: Pro + Max + Custom side by side */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pro */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -6 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="group relative overflow-hidden rounded-2xl border border-accent/30 bg-foreground/[0.025] p-7 shadow-lg shadow-accent/[0.08]"
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-accent/[0.06] rounded-full blur-3xl pointer-events-none" />
            <span className="absolute top-3 right-3 rounded-full bg-accent/10 border border-accent/20 px-2.5 py-0.5 text-[10px] font-medium text-accent">
              Mais popular
            </span>

            <h3 className="text-sm font-semibold text-foreground">{PLANS[0].name}</h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-semibold tracking-tight text-foreground">{PLANS[0].price}</span>
              <span className="text-sm text-muted-foreground/60">/mês</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground/70">{PLANS[0].description}</p>

            <Button onClick={() => setSelectedPlan(PLANS[0])}
              className="cta-shimmer relative overflow-hidden mt-6 w-full h-11 rounded-xl text-[13px] font-semibold bg-accent text-accent-foreground shadow-[0_0_32px_rgba(0,181,212,0.25)] hover:bg-accent/90 cursor-pointer">
              <span className="relative z-10 flex items-center justify-center gap-2">Começar agora <CaretRight className="h-3.5 w-3.5" /></span>
            </Button>

            <ul className="mt-7 flex flex-col gap-3 border-t border-foreground/[0.06] pt-6">
              {PLANS[0].features.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-[13px] text-muted-foreground/70">
                  <Check className="h-3.5 w-3.5 shrink-0 text-accent" /> {f}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Max */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -6 }}
            transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.1 }}
            className="group relative overflow-hidden rounded-2xl border border-violet-500/20 bg-foreground/[0.015] p-7 hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/[0.06] transition-all duration-500"
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />
            <span className="absolute top-3 right-3 rounded-full bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 text-[10px] font-medium text-violet-400">
              Grande Escala
            </span>

            <h3 className="text-sm font-semibold text-foreground">{PLANS[1].name}</h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-semibold tracking-tight text-foreground">{PLANS[1].price}</span>
              <span className="text-sm text-muted-foreground/60">/mês</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground/70">{PLANS[1].description}</p>

            <Button onClick={() => setSelectedPlan(PLANS[1])}
              className="cta-shimmer relative overflow-hidden mt-6 w-full h-11 rounded-xl text-[13px] font-semibold border border-violet-500/25 bg-violet-500/15 text-violet-200 hover:bg-violet-500/25 cursor-pointer">
              <span className="relative z-10 flex items-center justify-center gap-2">Começar agora <CaretRight className="h-3.5 w-3.5" /></span>
            </Button>

            <ul className="mt-7 flex flex-col gap-3 border-t border-foreground/[0.06] pt-6">
              {PLANS[1].features.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-[13px] text-muted-foreground/70">
                  <Check className="h-3.5 w-3.5 shrink-0 text-violet-400" /> {f}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Custom */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -6 }}
            transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.2 }}
            className="group relative overflow-hidden rounded-2xl border border-border/60 bg-foreground/[0.015] p-7 hover:border-border hover:shadow-md transition-all duration-500 flex flex-col"
          >
            <div className="flex items-center gap-2 mb-1">
              <Crown className="h-4 w-4 text-amber-400" weight="fill" />
              <span className="text-[10px] text-amber-400/70 font-medium uppercase tracking-wider">Sob medida</span>
            </div>

            <h3 className="text-sm font-semibold text-foreground">Custom</h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-2xl font-semibold tracking-tight text-foreground">Personalizado</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground/70">
              Precisa de mais WhatsApps, integrações específicas ou SLA dedicado? Montamos sob medida.
            </p>

            <Button
              onClick={() => setSelectedPlan({ id: "ailum-custom", name: "Custom", price: "Personalizado" })}
              className="cta-shimmer relative overflow-hidden mt-6 w-full h-11 rounded-xl text-[13px] font-semibold border border-amber-500/20 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 cursor-pointer"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">Falar com o time <CaretRight className="h-3.5 w-3.5" /></span>
            </Button>

            <div className="mt-7 flex flex-col gap-3 border-t border-foreground/[0.06] pt-6 flex-1">
              {["Volume ilimitado", "Múltiplos WhatsApps", "Integrações custom", "SLA dedicado", "Acesso direto aos fundadores"].map((tag) => (
                <div key={tag} className="flex items-center gap-2.5 text-[13px] text-muted-foreground/70">
                  <Check className="h-3.5 w-3.5 shrink-0 text-amber-400/70" /> {tag}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Security note */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground/50">
          <LockSimple className="h-3.5 w-3.5" /> Pagamento seguro processado pela InfinitePay
        </motion.div>
      </div>

      {/* Checkout modal */}
      <AnimatePresence>
        {selectedPlan && <CheckoutModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />}
      </AnimatePresence>
    </main>
  )
}
