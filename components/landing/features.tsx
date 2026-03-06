"use client"

import { FadeIn } from "./motion"
import { DemoChat } from "./demo-chat"
import { DemoKanban } from "./demo-kanban"
import { DemoCalendar } from "./demo-calendar"

const featureSections = [
  {
    tag: "WhatsApp + IA",
    title: "Atendimento que parece humano, disponível 24h",
    description:
      "A IA conversa de verdade com seus pacientes pelo WhatsApp — responde dúvidas, sugere horários, manda o Pix e confirma tudo. Com o jeito de falar da sua clínica, não um robô genérico.",
    component: "chat",
    reversed: false,
  },
  {
    tag: "Funil inteligente",
    title: "Veja exatamente onde cada paciente está",
    description:
      "Do primeiro contato até a consulta confirmada, tudo em um funil visual. A IA avança os status sozinha conforme o paciente responde e paga — você só acompanha.",
    component: "kanban",
    reversed: true,
  },
  {
    tag: "Calendario integrado",
    title: "Agenda que só mostra o que está garantido",
    description:
      "Filtre por profissional, sala ou tipo de atendimento. Nenhuma consulta aparece na agenda sem pagamento confirmado — chega de no-show, chega de surpresa.",
    component: "calendar",
    reversed: false,
  },
]

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
  return (
    <section id="recursos" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="mx-auto max-w-lg text-center mb-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            Plataforma
          </p>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Veja como funciona{" "}
            <span className="font-display italic text-accent">por dentro</span>
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
