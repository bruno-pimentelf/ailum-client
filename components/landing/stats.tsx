"use client"

import { AnimatedCounter, FadeIn } from "./motion"
import { useLanguage } from "@/components/providers/language-provider"

export function Stats() {
  const { t } = useLanguage()
  const metrics = [
    { value: 3200, suffix: "+", label: t.stats.agendamentos },
    { value: 94, suffix: "%", label: t.stats.taxaConfirmacao },
    { value: 12, suffix: "s", label: t.stats.tempoResposta },
    { value: 0, prefix: "R$", suffix: "", label: t.stats.noShow },
  ]

  return (
    <section className="relative py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-0">
          {metrics.map((metric, i) => (
            <FadeIn key={metric.label} delay={i * 0.1}>
              <div
                className={`flex flex-col items-center text-center px-4 py-6 lg:py-0 ${
                  i < metrics.length - 1
                    ? "md:border-r md:border-white/[0.06]"
                    : ""
                }`}
              >
                <span className="font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                  <AnimatedCounter
                    target={metric.value}
                    suffix={metric.suffix}
                    prefix={metric.prefix || ""}
                  />
                </span>
                <span className="mt-3 text-[11px] font-medium uppercase tracking-[0.15em] text-white/25">
                  {metric.label}
                </span>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
