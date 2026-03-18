"use client"

import { FadeIn } from "./motion"
import { DemoChat } from "./demo-chat"
import { DemoKanban } from "./demo-kanban"
import { DemoCalendar } from "./demo-calendar"
import { useLanguage } from "@/components/providers/language-provider"
import { Sparkle } from "@phosphor-icons/react"

function FeatureDemo({ type }: { type: string }) {
  switch (type) {
    case "chat":
      return <DemoChat />
    case "kanban":
      return <DemoKanban />
    case "calendar":
      return <DemoCalendar />
    default:
      return null
  }
}

export function Features() {
  const { t } = useLanguage()
  const featureSections = [
    {
      tag: t.features.whatsapp,
      title: t.features.whatsappTitle,
      description: t.features.whatsappDesc,
      callout: t.features.whatsappCallout,
      component: "chat" as const,
      reversed: false,
    },
    {
      tag: t.features.funil,
      title: t.features.funilTitle,
      description: t.features.funilDesc,
      callout: t.features.funilCallout,
      component: "kanban" as const,
      reversed: true,
    },
    {
      tag: t.features.calendario,
      title: t.features.calendarioTitle,
      description: t.features.calendarioDesc,
      callout: t.features.calendarioCallout,
      component: "calendar" as const,
      reversed: false,
    },
  ]

  return (
    <section id="recursos" className="py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <FadeIn className="max-w-lg mb-16 md:mb-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            {t.features.platforma}
          </p>
          <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl leading-[1.1]">
            {t.features.vejaComo}{" "}
            <span className="text-accent">{t.features.porDentro}</span>
          </h2>
        </FadeIn>

        <div className="flex flex-col gap-20 md:gap-28 lg:gap-36">
          {featureSections.map((section) => (
            <div
              key={section.tag}
              className={`flex flex-col items-center gap-12 lg:gap-20 ${
                section.reversed ? "lg:flex-row-reverse" : "lg:flex-row"
              }`}
            >
              {/* Text */}
              <FadeIn direction={section.reversed ? "right" : "left"} className="flex-1 max-w-md">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3.5 py-1.5 mb-5">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-accent">
                    {section.tag}
                  </span>
                </div>
                <h3 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl leading-[1.15]">
                  {section.title}
                </h3>
                <p className="mt-5 text-[15px] leading-relaxed text-white/88">
                  {section.description}
                </p>
                {/* Callout insight line */}
                <div className="mt-7 flex items-start gap-3 rounded-xl border border-accent/[0.08] bg-accent/[0.03] px-4 py-3.5">
                  <Sparkle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent/50" weight="fill" />
                  <p className="text-[13px] leading-relaxed text-white/85 italic">
                    {section.callout}
                  </p>
                </div>
              </FadeIn>

              {/* Demo */}
              <FadeIn direction={section.reversed ? "left" : "right"} className="flex-1 w-full max-w-lg">
                <FeatureDemo type={section.component} />
              </FadeIn>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
