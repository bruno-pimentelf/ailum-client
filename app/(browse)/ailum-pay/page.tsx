"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  CurrencyDollar,
  ArrowRight,
  ArrowLeft,
  Check,
  MagnifyingGlass,
  Spinner as SpinnerIcon,
  Warning,
  Bank,
  User,
  Buildings,
  MapPin,
  CheckCircle,
  Circle,
} from "@phosphor-icons/react"
import { useRinneOnboard, useRinneStatus } from "@/hooks/use-integrations"
import { useRouter } from "next/navigation"
import type { RinneOnboardInput } from "@/lib/api/integrations"

const ease = [0.33, 1, 0.68, 1] as const

const inputCls =
  "w-full h-11 rounded-xl border border-border/70 bg-foreground/[0.03] px-4 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"
const selectCls =
  "w-full h-11 rounded-xl border border-border/70 bg-foreground/[0.03] px-4 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all appearance-none"
const labelCls = "block text-[11px] font-semibold text-muted-foreground/70 mb-1.5"

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      className={`rounded-full border-2 border-border border-t-accent ${className}`}
    />
  )
}

// ─── CNPJ / CEP helpers ──────────────────────────────────────────────────────

function cleanDigits(v: string) {
  return v.replace(/\D/g, "")
}

function formatCnpj(v: string) {
  const d = cleanDigits(v).slice(0, 14)
  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

function formatCpf(v: string) {
  const d = cleanDigits(v).slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

function formatCep(v: string) {
  const d = cleanDigits(v).slice(0, 8)
  if (d.length <= 5) return d
  return `${d.slice(0, 5)}-${d.slice(5)}`
}

function formatPhone(v: string) {
  const d = cleanDigits(v).slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

type CnpjData = {
  razao_social?: string
  nome_fantasia?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  municipio?: string
  uf?: string
  cep?: string
  ddd_telefone_1?: string
  email?: string
  qsa?: Array<{ nome_socio_administrador?: string; qual_rep_legal?: string; qualificacao_socio?: string }>
  opcao_pelo_mei?: boolean | null
  opcao_pelo_simples?: boolean | null
  porte?: string
  capital_social?: number
}

async function fetchCnpj(cnpj: string): Promise<CnpjData | null> {
  const digits = cleanDigits(cnpj)
  if (digits.length !== 14) return null
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function fetchCep(cep: string): Promise<{ street?: string; neighborhood?: string; city?: string; state?: string } | null> {
  const digits = cleanDigits(cep)
  if (digits.length !== 8) return null
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cep/v1/${digits}`)
    if (!res.ok) return null
    const data = await res.json()
    return { street: data.street, neighborhood: data.neighborhood, city: data.city, state: data.state }
  } catch {
    return null
  }
}

// ─── Steps ───────────────────────────────────────────────────────────────────

const STEPS = [
  { key: "cnpj", label: "CNPJ", icon: MagnifyingGlass },
  { key: "empresa", label: "Empresa", icon: Buildings },
  { key: "responsavel", label: "Responsável", icon: User },
  { key: "banco", label: "Banco", icon: Bank },
  { key: "revisao", label: "Revisão", icon: CheckCircle },
] as const

type StepKey = (typeof STEPS)[number]["key"]

// ─── Form state ──────────────────────────────────────────────────────────────

interface FormState {
  // Step 1: CNPJ
  cnpj: string
  cnpjLoading: boolean
  cnpjData: CnpjData | null
  cnpjError: string | null
  // Step 2: Company
  fullName: string
  documentType: "CNPJ" | "CPF"
  documentTaxType: "PF" | "PJ" | "MEI" | "ME"
  street: string
  streetNumber: string
  complement: string
  neighborhood: string
  zipcode: string
  city: string
  state: string
  phone: string
  email: string
  // Step 3: Responsible
  firstName: string
  lastName: string
  contactPhone: string
  contactEmail: string
  motherName: string
  birthDate: string
  cpf: string
  // Step 4: Bank
  bankBranch: string
  bankAccount: string
  bankType: "CHECKING" | "SAVINGS" | "PAYMENT"
  bankHolderName: string
  bankHolderDoc: string
  bankIspb: string
}

const initialForm: FormState = {
  cnpj: "", cnpjLoading: false, cnpjData: null, cnpjError: null,
  fullName: "", documentType: "CNPJ", documentTaxType: "PJ",
  street: "", streetNumber: "", complement: "", neighborhood: "", zipcode: "", city: "", state: "",
  phone: "", email: "",
  firstName: "", lastName: "", contactPhone: "", contactEmail: "", motherName: "", birthDate: "", cpf: "",
  bankBranch: "", bankAccount: "", bankType: "CHECKING", bankHolderName: "", bankHolderDoc: "", bankIspb: "",
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AilumPayPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(initialForm)
  const onboard = useRinneOnboard()
  const { data: rinneStatus } = useRinneStatus({ enabled: true })

  // If already onboarded, show status
  const isOnboarded = !!rinneStatus?.merchantId

  const set = useCallback(
    <K extends keyof FormState>(key: K) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm((p) => ({ ...p, [key]: e.target.value })),
    [],
  )

  const setVal = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) =>
      setForm((p) => ({ ...p, [key]: value })),
    [],
  )

  // ── Step 1: CNPJ auto-lookup ──────────────────────────────────────────────

  async function lookupCnpj() {
    const digits = cleanDigits(form.cnpj)
    if (digits.length !== 14) {
      setVal("cnpjError", "CNPJ deve ter 14 dígitos")
      return
    }
    setVal("cnpjLoading", true)
    setVal("cnpjError", null)
    const data = await fetchCnpj(digits)
    if (!data) {
      setForm((p) => ({ ...p, cnpjLoading: false, cnpjError: "CNPJ não encontrado na Receita Federal" }))
      return
    }
    // Auto-fill everything we can
    const socio = data.qsa?.[0]
    const nomes = (socio?.nome_socio_administrador ?? "").split(" ")
    const isMei = data.opcao_pelo_mei === true
    const phone = data.ddd_telefone_1 ? cleanDigits(data.ddd_telefone_1) : ""

    setForm((p) => ({
      ...p,
      cnpjLoading: false,
      cnpjData: data,
      cnpjError: null,
      fullName: data.razao_social ?? "",
      documentTaxType: isMei ? "MEI" : "PJ",
      street: data.logradouro ?? "",
      streetNumber: data.numero ?? "",
      complement: data.complemento ?? "",
      neighborhood: data.bairro ?? "",
      zipcode: data.cep ? cleanDigits(data.cep) : "",
      city: data.municipio ?? "",
      state: data.uf ?? "",
      phone,
      email: data.email ?? "",
      firstName: nomes[0] ?? "",
      lastName: nomes.slice(1).join(" ") ?? "",
      contactPhone: phone,
      contactEmail: data.email ?? "",
    }))
  }

  // ── Step 2: CEP auto-fill ─────────────────────────────────────────────────

  useEffect(() => {
    const digits = cleanDigits(form.zipcode)
    if (digits.length !== 8) return
    const timer = setTimeout(async () => {
      const data = await fetchCep(digits)
      if (data) {
        setForm((p) => ({
          ...p,
          street: data.street || p.street,
          neighborhood: data.neighborhood || p.neighborhood,
          city: data.city || p.city,
          state: data.state || p.state,
        }))
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [form.zipcode])

  // ── Submit ────────────────────────────────────────────────────────────────

  function handleSubmit() {
    const input: RinneOnboardInput = {
      fullName: form.fullName,
      documentNumber: cleanDigits(form.cnpj),
      documentType: form.documentType,
      documentTaxType: form.documentTaxType,
      contact: {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: `+55${cleanDigits(form.contactPhone)}`,
        email: form.contactEmail,
        motherName: form.motherName,
        birthDate: form.birthDate,
        documentNumber: cleanDigits(form.cpf),
        address: {
          street: form.street,
          streetNumber: form.streetNumber || undefined,
          neighborhood: form.neighborhood,
          zipcode: cleanDigits(form.zipcode),
          city: form.city,
          state: form.state,
        },
      },
      address: {
        street: form.street,
        streetNumber: form.streetNumber || undefined,
        neighborhood: form.neighborhood,
        zipcode: cleanDigits(form.zipcode),
        city: form.city,
        state: form.state,
      },
      ...(form.bankBranch && form.bankAccount
        ? {
            bankAccount: {
              branchNumber: form.bankBranch,
              accountNumber: form.bankAccount,
              accountType: form.bankType,
              accountHolderName: form.bankHolderName || form.fullName,
              accountHolderDocumentNumber: cleanDigits(form.bankHolderDoc || form.cnpj),
              ispb: form.bankIspb,
            },
          }
        : {}),
    }
    onboard.mutate(input, {
      onSuccess: () => setStep(5), // success screen
    })
  }

  // ── Step validation ───────────────────────────────────────────────────────

  const canAdvance = [
    // Step 0: CNPJ
    cleanDigits(form.cnpj).length === 14 && !!form.cnpjData,
    // Step 1: Company
    !!form.fullName && !!form.street && !!form.neighborhood && !!form.zipcode && !!form.city && !!form.state,
    // Step 2: Responsible
    !!form.firstName && !!form.lastName && !!form.contactEmail && !!form.motherName && !!form.birthDate && cleanDigits(form.cpf).length === 11,
    // Step 3: Bank (optional, always valid)
    true,
    // Step 4: Review (submit)
    true,
  ]

  // ── Already onboarded ─────────────────────────────────────────────────────

  if (isOnboarded && step < 5) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 px-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle className="h-8 w-8 text-emerald-400" weight="fill" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Ailum Pay já configurado</h1>
          <p className="text-sm text-muted-foreground/70 max-w-md">
            Sua conta de pagamentos já está {rinneStatus?.canProcessPayments ? "ativa e pronta para cobrar" : "sendo analisada"}.
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[11px] text-muted-foreground/60">Conta: <span className="font-semibold text-foreground/80">{rinneStatus?.merchantStatus}</span></span>
            <span className="text-[11px] text-muted-foreground/60">PIX: <span className="font-semibold text-foreground/80">{rinneStatus?.affiliationStatus ?? "Pendente"}</span></span>
          </div>
          <button onClick={() => router.push("/settings")}
            className="cursor-pointer mt-4 flex items-center gap-2 rounded-xl bg-accent/15 border border-accent/25 px-5 py-2.5 text-sm font-semibold text-accent hover:bg-accent/25 transition-all">
            Voltar para Configurações
          </button>
        </motion.div>
      </div>
    )
  }

  // ── Success screen ────────────────────────────────────────────────────────

  if (step === 5) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 px-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4, ease }}
          className="flex flex-col items-center gap-5 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 border-2 border-emerald-500/20">
            <Check className="h-10 w-10 text-emerald-400" weight="bold" />
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground">Conta criada com sucesso!</h1>
          <p className="text-sm text-muted-foreground/70 max-w-md">
            Sua conta Ailum Pay foi enviada para análise. Você será notificado assim que os pagamentos PIX estiverem liberados.
          </p>
          <p className="text-xs text-muted-foreground/50">Geralmente leva de alguns minutos a 1 dia útil.</p>
          <button onClick={() => router.push("/settings")}
            className="cursor-pointer mt-4 flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-all">
            Ir para Configurações
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center py-8 px-4 min-h-[80vh]">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-2 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 border border-accent/20">
          <CurrencyDollar className="h-6 w-6 text-accent" weight="fill" />
        </div>
        <h1 className="text-lg font-bold text-foreground">Configurar Ailum Pay</h1>
        <p className="text-xs text-muted-foreground/60">Receba pagamentos PIX diretamente dos pacientes</p>
      </motion.div>

      {/* Stepper */}
      <div className="flex items-center gap-1 mb-8 w-full max-w-lg">
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const isActive = i === step
          const isDone = i < step
          return (
            <div key={s.key} className="flex items-center flex-1">
              <div className={`flex items-center gap-1.5 ${isActive ? "text-accent" : isDone ? "text-emerald-400" : "text-muted-foreground/30"}`}>
                <div className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all ${
                  isActive ? "border-accent/40 bg-accent/10" : isDone ? "border-emerald-500/30 bg-emerald-500/10" : "border-foreground/10 bg-foreground/[0.02]"
                }`}>
                  {isDone ? <Check className="h-3.5 w-3.5" weight="bold" /> : <Icon className="h-3.5 w-3.5" />}
                </div>
                <span className={`text-[10px] font-semibold hidden sm:block ${isActive ? "text-accent" : isDone ? "text-emerald-400/70" : "text-muted-foreground/30"}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-2 ${isDone ? "bg-emerald-500/30" : "bg-foreground/[0.06]"}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Step content */}
      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease }}
            className="rounded-2xl border border-border/60 bg-foreground/[0.015] p-6 space-y-5"
          >

            {/* ── Step 0: CNPJ ──────────────────────────────────────────── */}
            {step === 0 && (
              <>
                <div>
                  <h2 className="text-[15px] font-bold text-foreground">Qual o CNPJ da clínica?</h2>
                  <p className="text-xs text-muted-foreground/60 mt-1">Vamos buscar os dados automaticamente na Receita Federal</p>
                </div>
                <div className="flex gap-2">
                  <input
                    value={formatCnpj(form.cnpj)}
                    onChange={(e) => setVal("cnpj", cleanDigits(e.target.value))}
                    onKeyDown={(e) => { if (e.key === "Enter") lookupCnpj() }}
                    placeholder="00.000.000/0000-00"
                    className={`${inputCls} flex-1 text-base font-mono tracking-wide`}
                    autoFocus
                  />
                  <button onClick={lookupCnpj} disabled={form.cnpjLoading || cleanDigits(form.cnpj).length !== 14}
                    className="cursor-pointer flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 transition-all disabled:opacity-40">
                    {form.cnpjLoading ? <Spinner className="h-4 w-4" /> : <MagnifyingGlass className="h-5 w-5" weight="bold" />}
                  </button>
                </div>
                {form.cnpjError && (
                  <p className="flex items-center gap-1.5 text-xs text-rose-400"><Warning className="h-3.5 w-3.5" weight="fill" /> {form.cnpjError}</p>
                )}
                {form.cnpjData && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4 space-y-1.5">
                    <p className="text-sm font-bold text-emerald-400">{form.cnpjData.razao_social}</p>
                    {form.cnpjData.nome_fantasia && <p className="text-xs text-emerald-400/60">{form.cnpjData.nome_fantasia}</p>}
                    <p className="text-[11px] text-muted-foreground/60">
                      {form.cnpjData.logradouro}, {form.cnpjData.numero} - {form.cnpjData.bairro}, {form.cnpjData.municipio}/{form.cnpjData.uf}
                    </p>
                    {form.cnpjData.email && <p className="text-[11px] text-muted-foreground/50">{form.cnpjData.email}</p>}
                  </motion.div>
                )}
              </>
            )}

            {/* ── Step 1: Company data ───────────────────────────────────── */}
            {step === 1 && (
              <>
                <div>
                  <h2 className="text-[15px] font-bold text-foreground">Dados da empresa</h2>
                  <p className="text-xs text-muted-foreground/60 mt-1">Confirme ou corrija as informações</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>Razão Social</label>
                    <input value={form.fullName} onChange={set("fullName")} className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Tipo</label>
                      <select value={form.documentTaxType} onChange={set("documentTaxType")} className={selectCls}>
                        <option value="PJ">PJ</option><option value="MEI">MEI</option><option value="ME">ME</option><option value="PF">PF</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>CEP</label>
                      <input value={formatCep(form.zipcode)} onChange={(e) => setVal("zipcode", cleanDigits(e.target.value))} placeholder="00000-000" className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className={labelCls}>Rua</label>
                      <input value={form.street} onChange={set("street")} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Número</label>
                      <input value={form.streetNumber} onChange={set("streetNumber")} className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Bairro</label>
                      <input value={form.neighborhood} onChange={set("neighborhood")} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Cidade</label>
                      <input value={form.city} onChange={set("city")} className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={labelCls}>UF</label>
                      <input value={form.state} onChange={set("state")} maxLength={2} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Telefone</label>
                      <input value={formatPhone(form.phone)} onChange={(e) => setVal("phone", cleanDigits(e.target.value))} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Email</label>
                      <input value={form.email} onChange={set("email")} type="email" className={inputCls} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── Step 2: Responsible ────────────────────────────────────── */}
            {step === 2 && (
              <>
                <div>
                  <h2 className="text-[15px] font-bold text-foreground">Responsável pela conta</h2>
                  <p className="text-xs text-muted-foreground/60 mt-1">Dados pessoais do sócio/responsável</p>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Nome</label>
                      <input value={form.firstName} onChange={set("firstName")} className={inputCls} autoFocus />
                    </div>
                    <div>
                      <label className={labelCls}>Sobrenome</label>
                      <input value={form.lastName} onChange={set("lastName")} className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>CPF</label>
                      <input value={formatCpf(form.cpf)} onChange={(e) => setVal("cpf", cleanDigits(e.target.value))} placeholder="000.000.000-00" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Data de nascimento</label>
                      <input value={form.birthDate} onChange={set("birthDate")} placeholder="DD-MM-AAAA" className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Nome da mãe</label>
                    <input value={form.motherName} onChange={set("motherName")} className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Telefone</label>
                      <input value={formatPhone(form.contactPhone)} onChange={(e) => setVal("contactPhone", cleanDigits(e.target.value))} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Email</label>
                      <input value={form.contactEmail} onChange={set("contactEmail")} type="email" className={inputCls} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── Step 3: Bank (optional) ────────────────────────────────── */}
            {step === 3 && (
              <>
                <div>
                  <h2 className="text-[15px] font-bold text-foreground">Conta para repasse</h2>
                  <p className="text-xs text-muted-foreground/60 mt-1">Cadastre uma conta bancária para receber seus repasses automaticamente</p>
                </div>
                <div className="rounded-xl border border-accent/20 bg-accent/[0.04] px-4 py-3 space-y-1">
                  <p className="text-xs font-semibold text-accent">Como funciona o repasse?</p>
                  <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
                    Todo dia de manhã, o saldo acumulado no Ailum Pay é transferido via PIX para esta conta — <span className="font-semibold text-foreground/80">sem nenhuma taxa</span>.
                  </p>
                  <p className="text-[11px] text-muted-foreground/50 leading-relaxed">
                    Se preferir, pule esta etapa. O saldo fica seguro no Ailum Pay e você configura a conta depois.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Agência</label>
                      <input value={form.bankBranch} onChange={set("bankBranch")} placeholder="0001" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Conta</label>
                      <input value={form.bankAccount} onChange={set("bankAccount")} placeholder="123456-7" className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Tipo</label>
                      <select value={form.bankType} onChange={set("bankType")} className={selectCls}>
                        <option value="CHECKING">Corrente</option><option value="SAVINGS">Poupança</option><option value="PAYMENT">Pagamento</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>ISPB do banco</label>
                      <input value={form.bankIspb} onChange={set("bankIspb")} placeholder="ex: 60701190 (Itaú)" className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Titular</label>
                    <input value={form.bankHolderName} onChange={set("bankHolderName")} placeholder={form.fullName || "Nome do titular"} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>CPF/CNPJ do titular</label>
                    <input value={form.bankHolderDoc} onChange={set("bankHolderDoc")} placeholder={form.cnpj || "Documento"} className={inputCls} />
                  </div>
                </div>
              </>
            )}

            {/* ── Step 4: Review ─────────────────────────────────────────── */}
            {step === 4 && (
              <>
                <div>
                  <h2 className="text-[15px] font-bold text-foreground">Revisão</h2>
                  <p className="text-xs text-muted-foreground/60 mt-1">Confira os dados antes de criar a conta</p>
                </div>
                <div className="space-y-4">
                  <div className="rounded-xl border border-foreground/[0.06] bg-foreground/[0.02] p-3.5 space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">Empresa</p>
                    <p className="text-sm font-semibold text-foreground">{form.fullName}</p>
                    <p className="text-xs text-muted-foreground/60">{formatCnpj(form.cnpj)} - {form.documentTaxType}</p>
                    <p className="text-xs text-muted-foreground/50">{form.street}, {form.streetNumber} - {form.neighborhood}, {form.city}/{form.state}</p>
                  </div>
                  <div className="rounded-xl border border-foreground/[0.06] bg-foreground/[0.02] p-3.5 space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">Responsável</p>
                    <p className="text-sm font-semibold text-foreground">{form.firstName} {form.lastName}</p>
                    <p className="text-xs text-muted-foreground/60">CPF: {formatCpf(form.cpf)}</p>
                    <p className="text-xs text-muted-foreground/50">{form.contactEmail} | {formatPhone(form.contactPhone)}</p>
                  </div>
                  {form.bankBranch && form.bankAccount && (
                    <div className="rounded-xl border border-foreground/[0.06] bg-foreground/[0.02] p-3.5 space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">Banco</p>
                      <p className="text-sm text-foreground">Ag {form.bankBranch} | Conta {form.bankAccount} ({form.bankType === "CHECKING" ? "Corrente" : form.bankType === "SAVINGS" ? "Poupança" : "Pagamento"})</p>
                    </div>
                  )}

                  <AnimatePresence>
                    {onboard.isError && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/[0.08] px-3.5 py-2.5 text-xs text-rose-400">
                        <Warning className="h-3.5 w-3.5 shrink-0" weight="fill" /> Erro ao criar conta. Verifique os dados e tente novamente.
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex items-center gap-3 mt-6">
          {step > 0 && (
            <button onClick={() => setStep((s) => s - 1)}
              className="cursor-pointer flex items-center gap-2 rounded-xl border border-border/70 px-5 py-2.5 text-sm text-muted-foreground/70 hover:text-foreground/85 hover:bg-foreground/[0.04] transition-all">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
          )}
          <div className="flex-1" />
          {step < 4 ? (
            <button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance[step]}
              className="cursor-pointer flex items-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-all disabled:opacity-40">
              Continuar <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={onboard.isPending}
              className="cursor-pointer flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500/90 transition-all disabled:opacity-50">
              {onboard.isPending ? <Spinner /> : <Check className="h-4 w-4" weight="bold" />}
              Criar conta Ailum Pay
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
