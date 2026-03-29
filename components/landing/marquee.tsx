"use client"

import { useLanguage } from "@/components/providers/language-provider"

export function Marquee() {
  const { t } = useLanguage()
  const phrases = t.marquee.phrases
  const content = [...phrases, ...phrases]

  return (
    <section className="relative py-10 md:py-14 overflow-hidden border-y border-foreground/[0.04]">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-background via-transparent to-background z-10" />

      <div className="marquee-track flex items-center gap-10 md:gap-16 whitespace-nowrap">
        {content.map((phrase, i) => (
          <span key={i} className="flex items-center gap-10 md:gap-16 shrink-0">
            <span className="shimmer-phrase font-display text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight">
              {phrase}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-accent/25 shrink-0" />
          </span>
        ))}
      </div>

      <style jsx>{`
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .marquee-track {
          animation: marquee-scroll 40s linear infinite;
          width: max-content;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        @keyframes shimmer-sweep {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .shimmer-phrase {
          background: linear-gradient(
            105deg,
            rgba(255,255,255,0.18) 0%,
            rgba(255,255,255,0.18) 35%,
            rgba(255,255,255,0.80) 50%,
            rgba(255,255,255,0.18) 65%,
            rgba(255,255,255,0.18) 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer-sweep 3.6s linear infinite;
        }
      `}</style>
    </section>
  )
}
