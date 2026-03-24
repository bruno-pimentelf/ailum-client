"use client"

import Image from "next/image"
import { FadeIn } from "./motion"

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
  {
    image: "/images/embaixadores/guilherme-scalzer.jpg",
    name: "Prof. Dr. Guilherme Scalzer",
    specialty: "Cirurgião-Dentista",
    rqe: "CRO ES-CD-5929",
  },
  {
    image: "/images/embaixadores/nandara-espicalsky.jpeg",
    name: "Dra. Nandara Espicalsky",
    specialty: "Cirurgiã-Dentista",
    rqe: "CRO ES-CD-8756",
  },
]

// Duplicate for seamless infinite loop
const MARQUEE_ITEMS = [...AMBASSADORS, ...AMBASSADORS]

function AmbassadorCard({ person }: { person: (typeof AMBASSADORS)[number] }) {
  return (
    <div className="group relative shrink-0 w-[220px] sm:w-[260px] md:w-[320px]">
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/[0.06] bg-white/[0.015] transition-all duration-500 hover:border-white/[0.12] hover:shadow-lg hover:shadow-accent/[0.04]">
        {/* Image */}
        <div className="relative aspect-[3/4] w-full overflow-hidden">
          <Image
            src={person.image}
            alt={person.name}
            fill
            quality={85}
            sizes="(max-width: 640px) 220px, (max-width: 768px) 260px, 320px"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
        </div>

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 md:p-6">
          <p className="text-[13px] sm:text-[15px] font-semibold text-white leading-tight">
            {person.name}
          </p>
          {person.specialty && (
            <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-[12px] text-white/60">
              {person.specialty}
            </p>
          )}
          {person.rqe && (
            <div className="mt-1.5 sm:mt-2 inline-flex items-center rounded-full border border-accent/20 bg-accent/[0.08] px-2 sm:px-2.5 py-0.5">
              <span className="text-[9px] sm:text-[10px] font-medium text-accent/80 tracking-wide">
                {person.rqe}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function Testimonials() {
  return (
    <section className="relative py-16 sm:py-28 md:py-36 overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[40rem] w-[60rem] rounded-full bg-accent/[0.03] blur-[120px]" />
      </div>

      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <FadeIn direction="up" className="mb-10 sm:mb-16 md:mb-20 text-center">
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
      </div>

      {/* Marquee container — full width, no px constraint */}
      <div className="ambassador-marquee-wrapper relative">
        {/* Fade edges with blur + opacity */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-24 md:w-40 z-10 bg-gradient-to-r from-background via-background/80 to-transparent" style={{ backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)", maskImage: "linear-gradient(to right, black 40%, transparent)", WebkitMaskImage: "linear-gradient(to right, black 40%, transparent)" }} />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-24 md:w-40 z-10 bg-gradient-to-l from-background via-background/80 to-transparent" style={{ backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)", maskImage: "linear-gradient(to left, black 40%, transparent)", WebkitMaskImage: "linear-gradient(to left, black 40%, transparent)" }} />

        {/* Marquee track */}
        <div className="ambassador-marquee-track flex items-stretch gap-3 sm:gap-5 md:gap-6">
          {MARQUEE_ITEMS.map((person, i) => (
            <AmbassadorCard key={`${person.name}-${i}`} person={person} />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes ambassador-scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        .ambassador-marquee-track {
          width: max-content;
          animation: ambassador-scroll 35s linear infinite;
          will-change: transform;
        }
        .ambassador-marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  )
}
