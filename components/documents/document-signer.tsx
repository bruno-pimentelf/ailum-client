"use client"

import { useRef, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Eraser, Check, PencilSimple } from "@phosphor-icons/react"

const ease = [0.33, 1, 0.68, 1] as const
const inputCls = "w-full h-11 rounded-xl border border-border/70 bg-foreground/[0.03] px-4 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
    className={`rounded-full border-2 border-border border-t-white/70 ${className}`} />
}

export function DocumentSigner({ renderedBody, initialSignerName, onSign, isPending }: {
  renderedBody: string
  initialSignerName?: string
  onSign: (signatureDataUrl: string, signerName: string) => void
  isPending?: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [signerName, setSignerName] = useState(initialSignerName ?? "")

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    if ("touches" in e) {
      return { x: e.touches[0]!.clientX - rect.left, y: e.touches[0]!.clientY - rect.top }
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top }
  }, [])

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return
    setIsDrawing(true)
    setHasDrawn(true)
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }, [getPos])

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    e.preventDefault()
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.strokeStyle = "#e2e8f0"
    ctx.lineTo(x, y)
    ctx.stroke()
  }, [isDrawing, getPos])

  const stopDraw = useCallback(() => setIsDrawing(false), [])

  function clearCanvas() {
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx || !canvasRef.current) return
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    setHasDrawn(false)
  }

  function handleSign() {
    if (!canvasRef.current || !signerName.trim() || !hasDrawn) return
    const dataUrl = canvasRef.current.toDataURL("image/png")
    onSign(dataUrl, signerName.trim())
  }

  return (
    <div className="space-y-6">
      {/* Document preview */}
      <div className="rounded-xl border border-border/60 bg-white/[0.03] max-h-[50vh] overflow-y-auto">
        <div className="px-6 py-4 prose prose-sm prose-invert max-w-none text-[12px] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: renderedBody }} />
      </div>

      <p className="text-[11px] text-muted-foreground/50 text-center">Leia o documento acima antes de assinar</p>

      {/* Signer name */}
      <div>
        <label className="block text-[11px] font-semibold text-muted-foreground/70 mb-1.5">Nome completo</label>
        <input value={signerName} onChange={(e) => setSignerName(e.target.value)} placeholder="Digite seu nome completo" className={inputCls} />
      </div>

      {/* Signature canvas */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-semibold text-muted-foreground/70">Assinatura</label>
          {hasDrawn && (
            <button onClick={clearCanvas} className="cursor-pointer flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-foreground/70 transition-colors">
              <Eraser className="h-3 w-3" /> Limpar
            </button>
          )}
        </div>
        <div className="relative rounded-xl border border-border/60 bg-foreground/[0.02] overflow-hidden">
          {!hasDrawn && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="flex items-center gap-2 text-[12px] text-muted-foreground/30">
                <PencilSimple className="h-4 w-4" /> Assine aqui
              </p>
            </div>
          )}
          <canvas
            ref={canvasRef}
            width={600}
            height={150}
            className="w-full cursor-crosshair"
            style={{ touchAction: "none" }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />
        </div>
      </div>

      {/* Submit */}
      <button onClick={handleSign} disabled={isPending || !hasDrawn || !signerName.trim()}
        className="cursor-pointer w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white hover:bg-emerald-500/90 transition-all disabled:opacity-50">
        {isPending ? <Spinner /> : <Check className="h-4 w-4" weight="bold" />}
        Assinar documento
      </button>

      <p className="text-[10px] text-muted-foreground/40 text-center leading-relaxed">
        Ao assinar, você concorda com os termos acima.<br />
        Assinatura eletrônica conforme MP 2.200-2/2001.
      </p>
    </div>
  )
}
