"use client"

import { useLanguage } from "@/components/providers/language-provider"

export function Marquee() {
  const { t } = useLanguage()
  const phrases = t.marquee.phrases

  const content = [...phrases, ...phrases]

  return (
    <section className="relative py-10 md:py-14 overflow-hidden border-y border-white/[0.04]">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-background via-transparent to-background z-10" />

      <div className="marquee-track flex items-center gap-8 md:gap-14 whitespace-nowrap">
        {content.map((phrase, i) => (
          <span key={i} className="flex items-center gap-8 md:gap-14 shrink-0">
            <span className="font-display text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight text-white/[0.06]">
              {phrase}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-accent/20 shrink-0" />
          </span>
        ))}
      </div>

      <style jsx>{`
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .marquee-track {
          animation: marquee-scroll 40s linear infinite;
          width: max-content;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  )
}
