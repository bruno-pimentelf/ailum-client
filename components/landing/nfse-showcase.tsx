"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useInView, AnimatePresence } from "framer-motion"
import { useLanguage } from "@/components/providers/language-provider"
import { FadeIn } from "./motion"
import {
  Receipt,
  CheckCircle,
  ArrowRight,
  CurrencyCircleDollar,
  FileText,
  Lightning,
} from "@phosphor-icons/react"

const ease = [0.32, 0.72, 0, 1] as any

// ─── Animated invoice generation demo ────────────────────────────────────────

function InvoiceDemo({ t }: { t: ReturnType<typeof useLanguage>["t"] }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, margin: "-80px" })
  const [phase, setPhase] = useState<"idle" | "pix" | "generating" | "issued" | "sent">("idle")
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!isInView) { setPhase("idle"); setProgress(0); return }
    let cancelled = false
    async function run() {
      await new Promise(r => setTimeout(r, 600))
      if (cancelled) return
      setPhase("pix")
      await new Promise(r => setTimeout(r, 1200))
      if (cancelled) return
      setPhase("generating")
      for (let p = 0; p <= 100; p += 4) {
        if (cancelled) return
        setProgress(p)
        await new Promise(r => setTimeout(r, 22))
      }
      setProgress(100)
      await new Promise(r => setTimeout(r, 300))
      if (cancelled) return
      setPhase("issued")
      await new Promise(r => setTimeout(r, 800))
      if (cancelled) return
      setPhase("sent")
    }
    run()
    return () => { cancelled = true }
  }, [isInView])

  return (
    <div ref={ref} className="relative">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -inset-20 bg-[radial-gradient(circle_at_50%_50%,rgba(0,181,212,0.06)_0%,transparent_70%)]" />

      {/* Card shell — double bezel */}
      <div className="relative rounded-[2rem] bg-white/[0.02] p-[1px] ring-1 ring-white/[0.06]">
        <div className="relative overflow-hidden rounded-[calc(2rem-1px)] bg-zinc-950/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]">
          {/* Hover gradient */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/[0.04] via-transparent to-transparent" />

          <div className="relative p-8 md:p-10">
            {/* Header row */}
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/8 ring-1 ring-accent/10">
                <Receipt className="h-4.5 w-4.5 text-accent" weight="duotone" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent/60">{t.nfse.cardTag}</p>
                <p className="text-[13px] font-medium text-white/85 mt-0.5">{t.nfse.cardTitle}</p>
              </div>
            </div>

            {/* 3-step flow */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-3">
              {/* Step 1: Payment received */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2, ease }}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 flex flex-col gap-3"
              >
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/15 flex items-center justify-center">
                    <CurrencyCircleDollar className="h-3.5 w-3.5 text-emerald-400" weight="fill" />
                  </div>
                  <span className="text-[10px] font-semibold text-white/85 uppercase tracking-wider">{t.nfse.step1Label}</span>
                </div>

                <AnimatePresence mode="wait">
                  {(phase === "pix" || phase === "generating" || phase === "issued" || phase === "sent") ? (
                    <motion.div
                      key="pix-received"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 380, damping: 26 }}
                      className="flex items-center gap-2 rounded-lg border border-emerald-500/15 bg-emerald-500/[0.06] px-3 py-2"
                    >
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" weight="fill" />
                      <div>
                        <p className="text-[11px] font-semibold text-emerald-400 leading-none">R$ 350,00</p>
                        <p className="text-[9px] text-emerald-400/50 mt-0.5">{t.nfse.pixConfirmed}</p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="pix-waiting"
                      className="flex items-center gap-2 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2"
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-white/20 animate-pulse" />
                      <p className="text-[10px] text-white/40">{t.nfse.pixWaiting}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Arrow connectors (desktop only) */}
              <div className="hidden md:flex items-center justify-center -mx-6 pointer-events-none absolute left-[calc(33.333%-12px)] top-1/2 -translate-y-1/2 z-10">
              </div>

              {/* Step 2: Generating NFSe */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.35, ease }}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 flex flex-col gap-3"
              >
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-accent/10 ring-1 ring-accent/15 flex items-center justify-center">
                    <Lightning className="h-3.5 w-3.5 text-accent" weight="fill" />
                  </div>
                  <span className="text-[10px] font-semibold text-white/85 uppercase tracking-wider">{t.nfse.step2Label}</span>
                </div>

                <AnimatePresence mode="wait">
                  {phase === "generating" ? (
                    <motion.div
                      key="generating"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col gap-1.5"
                    >
                      <div className="flex justify-between">
                        <span className="text-[9px] text-accent/80">{t.nfse.generating}</span>
                        <span className="text-[9px] text-accent/50 tabular-nums font-mono">{progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <motion.div className="h-full rounded-full bg-accent/60" style={{ width: `${progress}%` }} />
                      </div>
                    </motion.div>
                  ) : (phase === "issued" || phase === "sent") ? (
                    <motion.div
                      key="generated"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 380, damping: 26 }}
                      className="flex items-center gap-2 rounded-lg border border-accent/15 bg-accent/[0.06] px-3 py-2"
                    >
                      <CheckCircle className="h-3.5 w-3.5 text-accent shrink-0" weight="fill" />
                      <div>
                        <p className="text-[11px] font-semibold text-accent leading-none">{t.nfse.nfseReady}</p>
                        <p className="text-[9px] text-accent/50 mt-0.5 font-mono">NFS-e #00847</p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      className="flex items-center gap-2 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2"
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
                      <p className="text-[10px] text-white/40">{t.nfse.awaitingPayment}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Step 3: Sent to patient */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.5, ease }}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 flex flex-col gap-3"
              >
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-violet-500/10 ring-1 ring-violet-500/15 flex items-center justify-center">
                    <FileText className="h-3.5 w-3.5 text-violet-400" weight="fill" />
                  </div>
                  <span className="text-[10px] font-semibold text-white/85 uppercase tracking-wider">{t.nfse.step3Label}</span>
                </div>

                <AnimatePresence mode="wait">
                  {phase === "sent" ? (
                    <motion.div
                      key="sent"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 380, damping: 26 }}
                      className="flex items-center gap-2 rounded-lg border border-violet-500/15 bg-violet-500/[0.06] px-3 py-2"
                    >
                      <CheckCircle className="h-3.5 w-3.5 text-violet-400 shrink-0" weight="fill" />
                      <div>
                        <p className="text-[11px] font-semibold text-violet-400 leading-none">{t.nfse.sentToPatient}</p>
                        <p className="text-[9px] text-violet-400/50 mt-0.5">{t.nfse.sentVia}</p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="waiting"
                      className="flex items-center gap-2 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2"
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
                      <p className="text-[10px] text-white/40">{t.nfse.awaitingNfse}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Connector arrows between steps (desktop) */}
            <div className="hidden md:flex absolute top-1/2 left-0 right-0 -translate-y-1/2 pointer-events-none px-10">
              <div className="flex-1" />
              <motion.div
                initial={{ opacity: 0 }}
                animate={isInView && (phase === "generating" || phase === "issued" || phase === "sent") ? { opacity: 1 } : {}}
                transition={{ duration: 0.4, ease }}
                className="flex items-center -mx-1.5"
              >
                <ArrowRight className="h-3.5 w-3.5 text-accent/30" />
              </motion.div>
              <div className="flex-1" />
              <motion.div
                initial={{ opacity: 0 }}
                animate={isInView && phase === "sent" ? { opacity: 1 } : {}}
                transition={{ duration: 0.4, ease }}
                className="flex items-center -mx-1.5"
              >
                <ArrowRight className="h-3.5 w-3.5 text-violet-400/30" />
              </motion.div>
              <div className="flex-1" />
            </div>

            {/* ASAAS badge */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.6, ease }}
              className="mt-6 flex items-center justify-center gap-2"
            >
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
              <div className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-4 py-1.5">
                <div className="h-4 w-4 rounded bg-[#1a73e8]/15 flex items-center justify-center">
                  <span className="text-[6px] font-bold text-[#5b9cf6]">AS</span>
                </div>
                <span className="text-[10px] text-white/50">{t.nfse.poweredBy}</span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Section ────────────────────────────────────────────────────────────────

export function NfseShowcase() {
  const { t } = useLanguage()

  return (
    <section className="py-28 md:py-40">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Left: copy */}
          <FadeIn direction="right">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 border border-accent/15">
                <Receipt className="h-3.5 w-3.5 text-accent/70" weight="duotone" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent/60">
                {t.nfse.tag}
              </span>
            </div>
            <h2 className="font-display text-[clamp(1.6rem,3vw,2.4rem)] font-bold leading-[1.1] tracking-tight text-foreground">
              {t.nfse.title}
              <br />
              <span className="text-accent">{t.nfse.titleAccent}</span>
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-white/50 max-w-md">
              {t.nfse.description}
            </p>

            {/* Feature bullets */}
            <div className="mt-8 flex flex-col gap-3">
              {[t.nfse.bullet1, t.nfse.bullet2, t.nfse.bullet3].map((bullet, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: 0.15 * i, ease }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/10 ring-1 ring-accent/15 shrink-0">
                    <CheckCircle className="h-3 w-3 text-accent" weight="fill" />
                  </div>
                  <span className="text-[13px] text-white/70">{bullet}</span>
                </motion.div>
              ))}
            </div>
          </FadeIn>

          {/* Right: animated demo */}
          <FadeIn direction="left" delay={0.15}>
            <InvoiceDemo t={t} />
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
