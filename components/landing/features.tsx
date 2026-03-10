"use client"

import { FadeIn } from "./motion"
import { DemoChat } from "./demo-chat"
import { DemoKanban } from "./demo-kanban"
import { DemoCalendar } from "./demo-calendar"
import { useLanguage } from "@/components/providers/language-provider"

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
      component: "chat" as const,
      reversed: false,
    },
    {
      tag: t.features.funil,
      title: t.features.funilTitle,
      description: t.features.funilDesc,
      component: "kanban" as const,
      reversed: true,
    },
    {
      tag: t.features.calendario,
      title: t.features.calendarioTitle,
      description: t.features.calendarioDesc,
      component: "calendar" as const,
      reversed: false,
    },
  ]

  return (
    <section id="recursos" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="mx-auto max-w-lg text-center mb-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            {t.features.platforma}
          </p>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {t.features.vejaComo}{" "}
            <span className="font-display italic text-accent">{t.features.porDentro}</span>
          </h2>
        </FadeIn>

        <div className="flex flex-col gap-32">
          {featureSections.map((section) => (
            <div
              key={section.tag}
              className={`flex flex-col items-center gap-12 lg:gap-16 ${
                section.reversed ? "lg:flex-row-reverse" : "lg:flex-row"
              }`}
            >
              {/* Text */}
              <FadeIn direction={section.reversed ? "right" : "left"} className="flex-1 max-w-md">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                  {section.tag}
                </p>
                <h3 className="mt-4 text-2xl font-semibold tracking-tight text-foreground md:text-3xl text-balance">
                  {section.title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {section.description}
                </p>
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
