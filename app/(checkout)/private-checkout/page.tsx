"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  CreditCard,
  LockSimple,
  Sparkle,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  useCreatePublicAilumCheckoutLink,
  usePublicAilumPlans,
} from "@/hooks/use-infinitepay-checkout"
import type { PublicCheckoutLinkResponse } from "@/lib/api/public-checkout"

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

function maskPhoneBR(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function toE164Br(localPhone: string) {
  const digits = localPhone.replace(/\D/g, "")
  return digits ? `+55${digits}` : ""
}

export default function PrivateCheckoutPage() {
  const [clinicName, setClinicName] = useState("")
  const [email, setEmail] = useState("")
  const [phoneLocal, setPhoneLocal] = useState("")
  const [redirectUrl, setRedirectUrl] = useState("")
  const [statusText, setStatusText] = useState("")

  const plansQuery = usePublicAilumPlans()
  const createCheckout = useCreatePublicAilumCheckoutLink()

  const plans = useMemo(() => {
    if (!plansQuery.data) return []
    return Array.isArray(plansQuery.data)
      ? plansQuery.data
      : "plans" in plansQuery.data
      ? plansQuery.data.plans
      : [plansQuery.data]
  }, [plansQuery.data])
  const publicPlan = plans[0]

  useEffect(() => {
    if (!redirectUrl && typeof window !== "undefined") {
      setRedirectUrl(`${window.location.origin}/pagamento/sucesso`)
    }
  }, [redirectUrl])

  async function handleCreateCheckout() {
    const phoneNumber = toE164Br(phoneLocal)
    if (!clinicName.trim() || !email.trim() || !phoneNumber) return

    const result = await createCheckout.mutateAsync({
      clinicName: clinicName.trim(),
      email: email.trim(),
      phoneNumber,
      redirectUrl: redirectUrl || undefined,
    })

    const checkoutUrl = getCheckoutUrl(result)
    if (!checkoutUrl) return
    setStatusText("Redirecionando para o checkout seguro...")
    window.location.href = checkoutUrl
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background pt-20 pb-10 md:pt-28 md:pb-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[6%] top-[6%] h-72 w-72 rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute right-[4%] top-[24%] h-[28rem] w-[28rem] rounded-full bg-cyan-500/8 blur-[140px]" />
        <div className="absolute left-[36%] bottom-[0%] h-80 w-80 rounded-full bg-accent/7 blur-[120px]" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-6">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10">
          <motion.div
            initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7 }}
            className="lg:sticky lg:top-24"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/[0.08] px-4 py-2 shadow-[0_0_30px_rgba(0,181,212,0.14)]">
              <Sparkle className="h-3.5 w-3.5 text-accent" weight="fill" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                Checkout Privado
              </span>
            </div>

            <h1 className="mt-6 font-display text-[clamp(2rem,4vw,3.4rem)] font-bold leading-[1.03] tracking-[-0.03em] text-foreground">
              Assine o Ailum.
              <br />
              <span className="text-accent">Comece no nível premium.</span>
            </h1>

            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/40">
              Preencha em menos de 1 minuto. Você já segue direto para o checkout seguro.
            </p>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 text-xs text-white/45">
                <LockSimple className="h-3.5 w-3.5 text-accent/80" />
                Checkout protegido e processado pela InfinitePay.
              </div>
            </div>
          </motion.div>

          <motion.section
            initial={{ opacity: 0, y: 22, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="rounded-[1.75rem] bg-white/[0.015] p-1.5 ring-1 ring-white/[0.08] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.75)]"
          >
            <div className="rounded-[calc(1.75rem-0.375rem)] bg-zinc-950/75 p-5 backdrop-blur-2xl md:p-7">
              <div className="mb-6 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-accent" weight="duotone" />
                <h2 className="text-sm font-semibold tracking-wide text-white/85">
                  Dados da clínica
                </h2>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-accent/20 bg-accent/[0.08] p-4 shadow-[0_0_24px_rgba(0,181,212,0.08)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent/80">
                    Plano público
                  </p>
                  <p className="mt-2 text-base font-semibold text-white/85">
                    {publicPlan?.name ?? "Plano Anual Ailum"}
                  </p>
                  <p className="mt-1 font-display text-3xl font-bold leading-none tracking-tight text-white">
                    {publicPlan?.amountFormatted ?? "R$ 18.000,00"}
                  </p>
                  <p className="mt-2 text-xs text-white/40">
                    {publicPlan?.description ?? "Plano padrão da Ailum para novas clínicas"}
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Input
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                      placeholder="Nome da clínica *"
                      className="h-11 rounded-xl border-white/15 bg-white/[0.03] px-3 text-sm text-white placeholder:text-white/30"
                    />
                  </div>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="E-mail financeiro *"
                    type="email"
                    className="h-11 rounded-xl border-white/15 bg-white/[0.03] px-3 text-sm text-white placeholder:text-white/30"
                  />
                  <div className="flex h-11 items-center rounded-xl border border-white/15 bg-white/[0.03]">
                    <span className="px-3 text-sm font-medium text-white/55">+55</span>
                    <Input
                      value={phoneLocal}
                      onChange={(e) => setPhoneLocal(maskPhoneBR(e.target.value))}
                      placeholder="(11) 99999-8888 *"
                      inputMode="numeric"
                      className="h-full border-0 bg-transparent text-sm text-white placeholder:text-white/30 focus-visible:ring-0"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleCreateCheckout}
                  disabled={
                    createCheckout.isPending ||
                    !clinicName.trim() ||
                    !email.trim() ||
                    phoneLocal.replace(/\D/g, "").length < 10
                  }
                  className="cta-shimmer relative overflow-hidden h-12 w-full rounded-xl border border-accent/25 bg-accent/20 text-sm font-semibold text-white shadow-[0_0_30px_rgba(0,181,212,0.2)] transition-all duration-500 hover:bg-accent/30"
                >
                  {createCheckout.isPending
                    ? "Preparando seu checkout..."
                    : "Desbloquear Pagamento Premium"}
                </Button>

                <p className="text-center text-xs text-white/35">
                  Redirecionamento automático para o checkout seguro.
                </p>

                {statusText && (
                  <p className="rounded-xl border border-accent/20 bg-accent/[0.08] px-3 py-2 text-center text-sm text-accent/90">
                    {statusText}
                  </p>
                )}

                {createCheckout.error && (
                  <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                    {(createCheckout.error as Error).message}
                  </p>
                )}
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </main>
  )
}
