"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { FadeIn } from "./motion"
import { useLanguage } from "@/components/providers/language-provider"

const ease = [0.32, 0.72, 0, 1] as const

const AMBASSADORS = [
  {
    image: "/images/embaixadores/georgia.jpg",
    name: "Dra. Geórgia Traichel",
    specialty: "Endocrinologista Integrativa",
    rqe: "RQE 4401",
  },
  {
    image: "/images/embaixadores/sheila.jpg",
    name: "Dra. Sheila Espicalsky",
    specialty: "Dermatologista",
    rqe: "RQE 3995",
  },
  {
    image: "/images/embaixadores/rafael-costa.jpeg",
    name: "Dr. Rafael Costa",
    specialty: "Geriatra",
    rqe: "RQE 13603",
  },
]

export function Testimonials() {
  const { t } = useLanguage()

  return (
    <section className="relative py-28 md:py-36 overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[40rem] w-[60rem] rounded-full bg-accent/[0.03] blur-[120px]" />
      </div>

      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <FadeIn direction="up" className="mb-16 md:mb-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3.5 py-1.5 mb-6">
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-accent">
              Nossos embaixadores
            </span>
          </div>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Referências que{" "}
            <span className="font-display italic text-accent">representam</span>
          </h2>
          <p className="mt-3 text-sm text-white/45 max-w-md mx-auto">
            Profissionais que elevam o padrão da saúde ao lado da Ailum.
          </p>
        </FadeIn>

        {/* Cards grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {AMBASSADORS.map((person, i) => (
            <motion.div
              key={person.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: i * 0.12, ease }}
              className="group relative"
            >
              <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.015] transition-all duration-500 hover:border-white/[0.12] hover:shadow-lg hover:shadow-accent/[0.04]">
                {/* Highlight glow on center card */}
                {i === 1 && (
                  <>
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
                    <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-accent/[0.04] rounded-full blur-3xl pointer-events-none" />
                  </>
                )}

                {/* Image */}
                <div className="relative aspect-[3/4] w-full overflow-hidden">
                  <Image
                    src={person.image}
                    alt={person.name}
                    fill
                    quality={85}
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
                </div>

                {/* Info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                  <p className="text-[15px] font-semibold text-white leading-tight">
                    {person.name}
                  </p>
                  <p className="mt-1 text-[12px] text-white/60">
                    {person.specialty}
                  </p>
                  <div className="mt-2 inline-flex items-center rounded-full border border-accent/20 bg-accent/[0.08] px-2.5 py-0.5">
                    <span className="text-[10px] font-medium text-accent/80 tracking-wide">
                      {person.rqe}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
