"use client"

import { useState } from "react"
import { Copy, Check, CurrencyCircleDollar } from "@phosphor-icons/react"

export interface PixChargeMetadata {
  qrCodeUrl?: string
  pixCopyPaste?: string
  amount?: string
  description?: string
}

interface PixChargeBlockProps {
  content?: string
  metadata?: PixChargeMetadata
}

export function PixChargeBlock({ content, metadata }: PixChargeBlockProps) {
  const [copied, setCopied] = useState(false)
  const { qrCodeUrl, pixCopyPaste, amount, description } = metadata ?? {}

  const handleCopy = () => {
    if (!pixCopyPaste) return
    navigator.clipboard.writeText(pixCopyPaste).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="rounded-xl border border-accent/20 bg-accent/5 overflow-hidden">
      <div className="p-3 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15">
            <CurrencyCircleDollar className="h-4 w-4 text-accent" weight="duotone" />
          </div>
          <div className="min-w-0">
            {amount && (
              <p className="text-[14px] font-semibold text-foreground">
                PIX R$ {amount}
              </p>
            )}
            {(description || content) && (
              <p className="text-[12px] text-muted-foreground truncate">
                {description ?? content}
              </p>
            )}
          </div>
        </div>

        {qrCodeUrl && (
          <div className="flex justify-center py-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrCodeUrl}
              alt="QR Code PIX"
              className="h-[160px] w-[160px] object-contain rounded-lg border border-border/40 bg-white"
            />
          </div>
        )}

        {pixCopyPaste && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground">
              Código PIX (copiar e colar)
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 min-w-0 text-[10px] font-mono text-foreground/70 truncate bg-muted/30 rounded px-2 py-1.5 border border-border/40">
                {pixCopyPaste.slice(0, 40)}...
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-1.5 text-[11px] font-semibold text-accent hover:bg-accent/20 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" weight="bold" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copiar
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
