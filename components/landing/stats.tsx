"use client"

import { AnimatedCounter, FadeIn } from "./motion"

const metrics = [
  { value: 3200, suffix: "+", label: "agendamentos/mes" },
  { value: 94, suffix: "%", label: "taxa de confirmacao" },
  { value: 12, suffix: "s", label: "tempo medio de resposta" },
  { value: 0, prefix: "R$", suffix: "", label: "no-show com Pix antecipado" },
]

export function Stats() {
  return (
    <section className="border-y border-border">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, i) => (
            <FadeIn key={metric.label} delay={i * 0.12}>
              <div
                className={`flex flex-col items-center px-6 py-10 text-center md:px-8 md:py-14 ${
                  i < metrics.length - 1 ? "border-b lg:border-b-0 lg:border-r border-border" : ""
                } ${i === 1 ? "border-r border-border lg:border-r" : ""}`}
              >
                <span className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                  <AnimatedCounter
                    target={metric.value}
                    suffix={metric.suffix}
                    prefix={metric.prefix || ""}
                  />
                </span>
                <span className="mt-2 text-xs text-muted-foreground tracking-wide">
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
