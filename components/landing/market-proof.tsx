"use client"

import { useRef } from "react"
import { motion, useInView, useScroll, useTransform } from "framer-motion"

const ease = [0.32, 0.72, 0, 1] as const

// ─── Data ─────────────────────────────────────────────────────────────────────

const PROOFS = [
  {
    number: "300%",
    context: "Clínicas com CRM organizado",
    highlight: "aumentam vendas em até 300%",
    source: "EBAC",
    span: "md:col-span-2",
    numColor: "text-cyan-200",
  },
  {
    number: "80%",
    context: "das vendas acontecem",
    highlight: "após o 5º follow-up",
    source: "Marketing Donut",
    span: "",
    numColor: "text-emerald-200",
  },
  {
    number: "73%",
    context: "dos pacientes dizem que",
    highlight: "experiência é fator decisivo",
    source: "PwC",
    span: "",
    numColor: "text-cyan-200",
  },
  {
    number: "+400%",
    context: "",
    highlight: "Atendimento rápido aumenta conversão em 400%",
    source: "Velocify",
    span: "md:col-span-2",
    numColor: "text-cyan-200",
  },
  {
    number: "7x",
    context: "",
    highlight: "Manter um cliente custa 7x menos que conquistar um novo",
    source: "Bain & Company",
    span: "md:col-span-3",
    numColor: "text-emerald-200",
  },
]

// ─── Single proof card ────────────────────────────────────────────────────────

function ProofCard({
  proof,
  index,
}: {
  proof: (typeof PROOFS)[number]
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-40px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
      animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{ duration: 0.8, delay: index * 0.08, ease }}
      className={`group relative ${proof.span}`}
    >
      <div className="relative h-full overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.015] backdrop-blur-sm transition-all duration-700 hover:border-white/[0.10] hover:bg-white/[0.03]">
        {/* Glow blob */}
        <motion.div
          initial={{ opacity: 0, scale: 0.4 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 1.4, delay: 0.2 + index * 0.08, ease }}
          className="absolute -top-16 -right-16 h-36 w-36 bg-accent/[0.04] rounded-full blur-3xl pointer-events-none"
        />

        <div className="relative px-6 py-7 md:px-8 md:py-8 flex flex-col gap-3">
          {/* Number */}
          <motion.span
            initial={{ opacity: 0, scale: 0.6, filter: "blur(14px)" }}
            animate={isInView ? { opacity: 1, scale: 1, filter: "blur(0px)" } : {}}
            transition={{ duration: 0.7, delay: 0.15 + index * 0.08, ease }}
            className={`font-display text-5xl md:text-6xl font-bold tracking-tighter leading-none ${proof.numColor}`}
          >
            {proof.number}
          </motion.span>

          {/* Text */}
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 + index * 0.08, ease }}
            className="text-[14px] md:text-[15px] leading-relaxed text-white/40"
          >
            {proof.context}{proof.context ? " " : ""}
            <span className="font-medium text-white/70">{proof.highlight}</span>
          </motion.p>

          {/* Source */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.5 + index * 0.08, ease }}
            className="text-[10px] font-medium uppercase tracking-[0.16em] text-accent/40"
          >
            {proof.source}
          </motion.span>
        </div>

        {/* Bottom shimmer on hover */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MarketProof() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })
  const glowY = useTransform(scrollYProgress, [0, 1], [100, -100])

  return (
    <section ref={sectionRef} className="relative py-20 md:py-32 overflow-hidden">
      {/* Ambient */}
      <motion.div
        style={{ y: glowY }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-accent/[0.015] rounded-full blur-[200px] pointer-events-none"
      />

      <div className="relative mx-auto max-w-5xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.85, ease }}
          className="text-center mb-14 md:mb-20"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            O mercado já provou
          </p>
          <h2 className="mt-4 text-balance text-2xl font-semibold tracking-tight text-foreground md:text-3xl lg:text-4xl">
            Dados que sua clínica{" "}
            <span className="font-display italic text-accent">não pode ignorar</span>
          </h2>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {PROOFS.map((proof, i) => (
            <ProofCard key={proof.number + proof.source} proof={proof} index={i} />
          ))}
        </div>

        {/* Bottom statement */}
        <motion.p
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.3, ease }}
          className="mt-14 md:mt-20 text-center font-display text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight leading-snug"
        >
          <span className="text-white/90 tracking-[0.25em] text-[0.85em]">AILUM</span>
          <span className="text-white/40"> automatiza tudo isso —</span>
          <br />
          <span className="text-accent">24h por dia</span>
          <span className="text-white/20">,</span>{" "}
          <span className="text-white/90">sem intervalo.</span>
        </motion.p>
      </div>
    </section>
  )
}
