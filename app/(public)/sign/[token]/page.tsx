"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { documentsApi } from "@/lib/api/documents"

const ease = [0.33, 1, 0.68, 1] as const

const inputCls =
  "w-full h-12 rounded-xl border border-border/70 bg-foreground/[0.03] px-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"
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

// ─── Signature Canvas ────────────────────────────────────────────────────────

function SignatureCanvas({
  onSignatureChange,
}: {
  onSignatureChange: (hasSignature: boolean) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)
  const [isEmpty, setIsEmpty] = useState(true)

  const getPos = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current!
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      if ("touches" in e) {
        return {
          x: (e.touches[0].clientX - rect.left) * scaleX,
          y: (e.touches[0].clientY - rect.top) * scaleY,
        }
      }
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      }
    },
    []
  )

  const startDraw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const ctx = canvasRef.current?.getContext("2d")
      if (!ctx) return
      isDrawingRef.current = true
      const { x, y } = getPos(e)
      ctx.beginPath()
      ctx.moveTo(x, y)
    },
    [getPos]
  )

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current) return
      const ctx = canvasRef.current?.getContext("2d")
      if (!ctx) return
      const { x, y } = getPos(e)
      ctx.lineWidth = 2
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.strokeStyle = "#e2e2e2"
      ctx.lineTo(x, y)
      ctx.stroke()
      if (isEmpty) {
        setIsEmpty(false)
        onSignatureChange(true)
      }
    },
    [getPos, isEmpty, onSignatureChange]
  )

  const stopDraw = useCallback(() => {
    isDrawingRef.current = false
  }, [])

  const clear = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!ctx || !canvas) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
    onSignatureChange(false)
  }, [onSignatureChange])

  const getDataUrl = useCallback(() => {
    return canvasRef.current?.toDataURL("image/png") ?? ""
  }, [])

  // Expose getDataUrl via ref trick
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      ;(canvas as HTMLCanvasElement & { getSignatureDataUrl?: () => string }).getSignatureDataUrl =
        getDataUrl
    }
  }, [getDataUrl])

  return (
    <div className="space-y-2">
      <div className="relative rounded-xl border border-border/70 bg-foreground/[0.03] overflow-hidden">
        <canvas
          ref={canvasRef}
          width={600}
          height={300}
          className="w-full h-[150px] cursor-crosshair"
          style={{ touchAction: "none" }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-muted-foreground/30">Assine aqui</p>
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={clear}
          className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors px-2 py-1"
        >
          Limpar assinatura
        </button>
      </div>
    </div>
  )
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
        <h2 className="text-xl font-bold text-foreground mb-2">Documento assinado com sucesso!</h2>
        <p className="text-sm text-muted-foreground/70">
          Voce recebera uma copia por WhatsApp.
        </p>
      </div>
    </motion.div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PublicSignPage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [renderedBody, setRenderedBody] = useState("")
  const [signerName, setSignerName] = useState("")
  const [hasSignature, setHasSignature] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)

  // Unwrap params
  useEffect(() => {
    params.then((p) => setToken(p.token))
  }, [params])

  // Fetch document
  useEffect(() => {
    if (!token) return
    setLoading(true)
    setError(null)
    documentsApi
      .getPublicDocument(token)
      .then((data) => {
        setTitle(data.title)
        setRenderedBody(data.renderedBody)
      })
      .catch((err) => {
        setError(err?.message ?? "Link invalido ou expirado.")
      })
      .finally(() => setLoading(false))
  }, [token])

  const onSignatureChange = useCallback((has: boolean) => {
    setHasSignature(has)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return

    // Get signature data from canvas
    const canvas = canvasContainerRef.current?.querySelector("canvas") as
      | (HTMLCanvasElement & { getSignatureDataUrl?: () => string })
      | null
    const signatureDataUrl = canvas?.getSignatureDataUrl?.() ?? ""

    if (!signatureDataUrl || !signerName.trim()) return

    setSubmitting(true)
    setSubmitError(null)
    try {
      await documentsApi.signPublicDocument(token, {
        signatureDataUrl,
        signerName: signerName.trim(),
      })
      setSubmitted(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao assinar documento."
      setSubmitError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = hasSignature && signerName.trim().length > 0 && !submitting

  // ─── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-8 w-8" />
          <p className="text-sm text-muted-foreground/60">Carregando documento...</p>
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

  // ─── Document signing ────────────────────────────────────────────────────────

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
              <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent" />
            </svg>
          </div>
          <span className="text-xs font-semibold text-muted-foreground/50 tracking-wide uppercase">Ailum</span>
        </div>
        <h1 className="text-xl font-bold text-foreground">Documento para assinatura</h1>
        <p className="text-sm text-muted-foreground/70 mt-1">{title}</p>
      </motion.div>

      {/* Form */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease, delay: 0.1 }}
        onSubmit={handleSubmit}
        className="w-full max-w-lg space-y-6"
      >
        {/* Document preview */}
        <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border/30">
            <p className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-wide">
              Documento
            </p>
          </div>
          <div
            className="px-6 py-5 max-h-[400px] overflow-y-auto prose prose-sm prose-invert max-w-none
              prose-headings:text-foreground prose-p:text-foreground/80 prose-strong:text-foreground
              prose-li:text-foreground/80 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderedBody }}
          />
          <div className="px-4 py-3 border-t border-border/30 bg-foreground/[0.02]">
            <p className="text-[11px] text-muted-foreground/40 text-center">
              Leia o documento acima antes de assinar
            </p>
          </div>
        </div>

        {/* Signer name */}
        <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm space-y-5">
          <div>
            <label htmlFor="signer-name" className="block text-xs font-semibold text-muted-foreground/70 mb-1.5">
              Nome completo do assinante <span className="text-red-400">*</span>
            </label>
            <input
              id="signer-name"
              type="text"
              className={inputCls}
              placeholder="Seu nome completo"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
            />
          </div>

          {/* Signature canvas */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground/70 mb-1.5">
              Assinatura <span className="text-red-400">*</span>
            </label>
            <div ref={canvasContainerRef}>
              <SignatureCanvas onSignatureChange={onSignatureChange} />
            </div>
          </div>

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

          {/* Submit */}
          <button type="submit" disabled={!canSubmit} className={btnCls}>
            {submitting ? (
              <>
                <Spinner className="h-4 w-4" />
                Assinando...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Assinar documento
              </>
            )}
          </button>

          {/* Legal notice */}
          <p className="text-[10px] text-muted-foreground/35 text-center leading-relaxed">
            Ao assinar, voce concorda com os termos acima. Assinatura eletronica conforme MP 2.200-2/2001.
          </p>
        </div>
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
