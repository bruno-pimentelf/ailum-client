"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { formsApi, type FormFieldDefinition } from "@/lib/api/forms"

const ease = [0.33, 1, 0.68, 1] as const

const inputCls =
  "w-full h-12 rounded-xl border border-border/70 bg-foreground/[0.03] px-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"
const textareaCls =
  "w-full min-h-[100px] rounded-xl border border-border/70 bg-foreground/[0.03] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all resize-y"
const selectCls =
  "w-full h-12 rounded-xl border border-border/70 bg-foreground/[0.03] px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all appearance-none"
const labelCls = "block text-xs font-semibold text-muted-foreground/70 mb-1.5"
const btnCls =
  "w-full h-12 rounded-xl bg-accent text-accent-foreground font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"

function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      className={`rounded-full border-2 border-border border-t-accent ${className}`}
    />
  )
}

// ─── Field renderer ──────────────────────────────────────────────────────────

function FormField({
  field,
  value,
  onChange,
}: {
  field: FormFieldDefinition
  value: unknown
  onChange: (val: unknown) => void
}) {
  const id = `field-${field.id}`

  switch (field.type) {
    case "TEXT":
    case "PHONE":
    case "EMAIL":
    case "CPF":
      return (
        <div>
          <label htmlFor={id} className={labelCls}>
            {field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
          <input
            id={id}
            type={field.type === "EMAIL" ? "email" : field.type === "PHONE" ? "tel" : "text"}
            className={inputCls}
            placeholder={field.placeholder || ""}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
          />
          {field.helpText && <p className="text-[11px] text-muted-foreground/50 mt-1">{field.helpText}</p>}
        </div>
      )

    case "NUMBER":
      return (
        <div>
          <label htmlFor={id} className={labelCls}>
            {field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
          <input
            id={id}
            type="number"
            className={inputCls}
            placeholder={field.placeholder || ""}
            value={(value as string) ?? ""}
            min={field.validation?.min}
            max={field.validation?.max}
            onChange={(e) => onChange(e.target.value)}
          />
          {field.helpText && <p className="text-[11px] text-muted-foreground/50 mt-1">{field.helpText}</p>}
        </div>
      )

    case "DATE":
      return (
        <div>
          <label htmlFor={id} className={labelCls}>
            {field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
          <input
            id={id}
            type="date"
            className={inputCls}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
          />
          {field.helpText && <p className="text-[11px] text-muted-foreground/50 mt-1">{field.helpText}</p>}
        </div>
      )

    case "TEXTAREA":
      return (
        <div>
          <label htmlFor={id} className={labelCls}>
            {field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
          <textarea
            id={id}
            className={textareaCls}
            placeholder={field.placeholder || ""}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
          />
          {field.helpText && <p className="text-[11px] text-muted-foreground/50 mt-1">{field.helpText}</p>}
        </div>
      )

    case "SELECT":
      return (
        <div>
          <label htmlFor={id} className={labelCls}>
            {field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
          <select
            id={id}
            className={selectCls}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">{field.placeholder || "Selecione..."}</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {field.helpText && <p className="text-[11px] text-muted-foreground/50 mt-1">{field.helpText}</p>}
        </div>
      )

    case "MULTI_SELECT":
      return (
        <div>
          <label className={labelCls}>
            {field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
          <div className="flex flex-wrap gap-2">
            {field.options?.map((opt) => {
              const selected = Array.isArray(value) && (value as string[]).includes(opt)
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    const arr = Array.isArray(value) ? [...(value as string[])] : []
                    if (selected) onChange(arr.filter((v) => v !== opt))
                    else onChange([...arr, opt])
                  }}
                  className={`px-3 py-2 rounded-lg text-sm border transition-all ${
                    selected
                      ? "bg-accent/20 border-accent/40 text-accent"
                      : "bg-foreground/[0.03] border-border/70 text-muted-foreground hover:border-accent/30"
                  }`}
                >
                  {opt}
                </button>
              )
            })}
          </div>
          {field.helpText && <p className="text-[11px] text-muted-foreground/50 mt-1">{field.helpText}</p>}
        </div>
      )

    case "CHECKBOX":
      return (
        <div>
          <label className={labelCls}>
            {field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
          <div className="space-y-2">
            {field.options?.map((opt) => {
              const checked = Array.isArray(value) && (value as string[]).includes(opt)
              return (
                <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                    checked ? "bg-accent border-accent" : "border-border/70 bg-foreground/[0.03] group-hover:border-accent/30"
                  }`}>
                    {checked && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-foreground" />
                      </svg>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() => {
                      const arr = Array.isArray(value) ? [...(value as string[])] : []
                      if (checked) onChange(arr.filter((v) => v !== opt))
                      else onChange([...arr, opt])
                    }}
                  />
                  <span className="text-sm text-foreground">{opt}</span>
                </label>
              )
            })}
          </div>
          {field.helpText && <p className="text-[11px] text-muted-foreground/50 mt-1">{field.helpText}</p>}
        </div>
      )

    case "RADIO":
      return (
        <div>
          <label className={labelCls}>
            {field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
          <div className="space-y-2">
            {field.options?.map((opt) => {
              const selected = value === opt
              return (
                <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    selected ? "border-accent" : "border-border/70 bg-foreground/[0.03] group-hover:border-accent/30"
                  }`}>
                    {selected && <div className="w-2.5 h-2.5 rounded-full bg-accent" />}
                  </div>
                  <input
                    type="radio"
                    className="sr-only"
                    checked={selected}
                    onChange={() => onChange(opt)}
                  />
                  <span className="text-sm text-foreground">{opt}</span>
                </label>
              )
            })}
          </div>
          {field.helpText && <p className="text-[11px] text-muted-foreground/50 mt-1">{field.helpText}</p>}
        </div>
      )

    case "SCALE":
      return (
        <div>
          <label className={labelCls}>
            {field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
          <div className="flex gap-2 flex-wrap">
            {Array.from(
              { length: (field.validation?.max ?? 10) - (field.validation?.min ?? 0) + 1 },
              (_, i) => (field.validation?.min ?? 0) + i
            ).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                className={`w-10 h-10 rounded-lg border text-sm font-medium transition-all ${
                  value === n
                    ? "bg-accent/20 border-accent/40 text-accent"
                    : "bg-foreground/[0.03] border-border/70 text-muted-foreground hover:border-accent/30"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          {field.helpText && <p className="text-[11px] text-muted-foreground/50 mt-1">{field.helpText}</p>}
        </div>
      )

    case "SIGNATURE":
      return (
        <div>
          <label className={labelCls}>
            {field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
          <p className="text-xs text-muted-foreground/50">Campo de assinatura disponivel na pagina de assinatura.</p>
        </div>
      )

    case "FILE":
      return (
        <div>
          <label htmlFor={id} className={labelCls}>
            {field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
          <input
            id={id}
            type="file"
            className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20 transition-all"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onChange(file.name)
            }}
          />
          {field.helpText && <p className="text-[11px] text-muted-foreground/50 mt-1">{field.helpText}</p>}
        </div>
      )

    default:
      return null
  }
}

// ─── Success screen ──────────────────────────────────────────────────────────

function SuccessScreen() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease }}
      className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
        className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20"
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <motion.path
            d="M5 13l4 4L19 7"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          />
        </svg>
      </motion.div>
      <div>
        <h2 className="text-xl font-bold text-foreground mb-2">Ficha enviada com sucesso!</h2>
        <p className="text-sm text-muted-foreground/70">Obrigado por preencher. Voce pode fechar esta pagina.</p>
      </div>
    </motion.div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PublicFormPage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formName, setFormName] = useState("")
  const [contactName, setContactName] = useState("")
  const [fields, setFields] = useState<FormFieldDefinition[]>([])
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Unwrap params
  useEffect(() => {
    params.then((p) => setToken(p.token))
  }, [params])

  // Fetch form
  useEffect(() => {
    if (!token) return
    setLoading(true)
    setError(null)
    formsApi
      .getPublicForm(token)
      .then((data) => {
        setFormName(data.template.name)
        setContactName(data.contactName ?? "")
        setFields(
          [...data.template.fields].sort((a, b) => a.order - b.order)
        )
        setAnswers(data.answers ?? {})
      })
      .catch((err) => {
        setError(err?.message ?? "Link invalido ou expirado.")
      })
      .finally(() => setLoading(false))
  }, [token])

  const setAnswer = useCallback((fieldId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await formsApi.submitPublicForm(token, answers)
      setSubmitted(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao enviar ficha."
      setSubmitError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  // Group fields by section
  const sections = fields.reduce<{ section: string; fields: FormFieldDefinition[] }[]>(
    (acc, field) => {
      const sectionName = field.section ?? ""
      const existing = acc.find((s) => s.section === sectionName)
      if (existing) existing.fields.push(field)
      else acc.push({ section: sectionName, fields: [field] })
      return acc
    },
    []
  )

  // Validate required fields
  const missingRequired = fields.some((f) => {
    if (!f.required) return false
    const val = answers[f.id]
    if (val == null || val === "") return true
    if (Array.isArray(val) && val.length === 0) return true
    return false
  })

  // ─── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-8 w-8" />
          <p className="text-sm text-muted-foreground/60">Carregando ficha...</p>
        </div>
      </div>
    )
  }

  // ─── Error ───────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 text-center max-w-sm"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-foreground">Link indisponivel</h1>
          <p className="text-sm text-muted-foreground/70">{error}</p>
        </motion.div>
      </div>
    )
  }

  // ─── Success ─────────────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SuccessScreen />
      </div>
    )
  }

  // ─── Form ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="w-full max-w-lg mb-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent" />
            </svg>
          </div>
          <span className="text-xs font-semibold text-muted-foreground/50 tracking-wide uppercase">Ailum</span>
        </div>
        <h1 className="text-xl font-bold text-foreground">{formName}</h1>
        {contactName && (
          <p className="text-sm text-muted-foreground/70 mt-1">
            Paciente: <span className="text-foreground/80 font-medium">{contactName}</span>
          </p>
        )}
      </motion.div>

      {/* Form card */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease, delay: 0.1 }}
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-2xl border border-border/50 bg-card p-6 shadow-sm space-y-6"
      >
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-4">
            {section.section && (
              <div className="pt-2 pb-1 border-b border-border/30 mb-2">
                <h2 className="text-sm font-semibold text-foreground/80">{section.section}</h2>
              </div>
            )}
            {section.fields.map((field) => (
              <FormField
                key={field.id}
                field={field}
                value={answers[field.id]}
                onChange={(val) => setAnswer(field.id, val)}
              />
            ))}
          </div>
        ))}

        {/* Submit error */}
        <AnimatePresence>
          {submitError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400"
            >
              {submitError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit button */}
        <button
          type="submit"
          disabled={submitting || missingRequired}
          className={btnCls}
        >
          {submitting ? (
            <>
              <Spinner className="h-4 w-4" />
              Enviando...
            </>
          ) : (
            "Enviar ficha"
          )}
        </button>

        {missingRequired && (
          <p className="text-[11px] text-muted-foreground/40 text-center">
            Preencha todos os campos obrigatorios (*) para enviar.
          </p>
        )}
      </motion.form>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-[11px] text-muted-foreground/30">
          Protegido por <span className="font-medium">Ailum</span>
        </p>
      </div>
    </div>
  )
}
