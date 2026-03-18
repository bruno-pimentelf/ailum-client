"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import {
  Phone,
  Envelope,
  Globe,
  MapPin,
  Calendar,
  Clock,
  User,
  Stethoscope,
} from "@phosphor-icons/react"
import type { PublicClinic } from "@/lib/api/public-clinics"

const ease = [0.33, 1, 0.68, 1] as const

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

function formatDuration(min: number) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h ${m}min` : `${h}h`
}

function formatAddress(addr: NonNullable<PublicClinic["address"]>) {
  const parts = [
    [addr.street, addr.number, addr.complement].filter(Boolean).join(", "),
    addr.neighborhood,
    addr.city && addr.state ? `${addr.city} - ${addr.state}` : addr.city ?? addr.state,
    addr.zip,
  ].filter(Boolean)
  return parts.join(" · ")
}

type Props = { clinic: PublicClinic }

export function ClinicProfile({ clinic }: Props) {
  return (
    <main className="min-h-screen bg-background text-foreground antialiased">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/3 w-[80vw] max-w-4xl h-[60vh] rounded-full bg-accent/[0.04] blur-[120px]" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
        className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 h-14">
          <Link
            href="/"
            className="text-lg font-bold tracking-[0.35em] text-foreground transition-opacity hover:opacity-80"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            A I L U M
          </Link>
          {clinic.website && (
            <a
              href={clinic.website.startsWith("http") ? clinic.website : `https://${clinic.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-accent hover:text-accent/80 transition-colors"
            >
              Visitar site
            </a>
          )}
        </div>
      </motion.header>

      {/* Hero */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease }}
            className="flex flex-col items-center text-center"
          >
            {clinic.logoUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.2, ease }}
                className="relative mb-6 h-24 w-24 md:h-28 md:w-28 rounded-2xl overflow-hidden ring-1 ring-white/10 bg-card/50 shadow-xl"
              >
                <Image
                  src={clinic.logoUrl}
                  alt={clinic.name}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              </motion.div>
            )}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease }}
              className="text-3xl md:text-4xl font-bold tracking-tight text-foreground"
            >
              {clinic.name}
            </motion.h1>
            {clinic.description && (
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.35, ease }}
                className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground"
              >
                {clinic.description}
              </motion.p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Services */}
      {clinic.services.length > 0 && (
        <section className="py-16 md:py-20 border-t border-border/40">
          <div className="mx-auto max-w-4xl px-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, ease }}
              className="mb-12"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                Serviços
              </p>
              <h2 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight">
                O que oferecemos
              </h2>
            </motion.div>

            <div className="grid gap-4 md:grid-cols-2">
              {clinic.services.map((service, i) => (
                <motion.article
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.6, delay: i * 0.08, ease }}
                  className="group rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-sm hover:border-accent/20 hover:bg-card/50 transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-accent transition-colors">
                        {service.name}
                      </h3>
                      {service.description && (
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                          {service.description}
                        </p>
                      )}
                      <div className="mt-4 flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDuration(service.durationMin)}
                        </span>
                        <span className="text-accent font-medium">
                          {formatPrice(service.price)}
                        </span>
                      </div>
                    </div>
                    {service.isConsultation && (
                      <span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-medium text-accent">
                        Consulta
                      </span>
                    )}
                  </div>
                  {service.professionals.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {service.professionals.slice(0, 3).map((p) => (
                        <span
                          key={p.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1 text-[11px] text-muted-foreground"
                        >
                          {p.avatarUrl ? (
                            <span className="relative h-5 w-5 rounded-full overflow-hidden">
                              <Image
                                src={p.avatarUrl}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="20px"
                              />
                            </span>
                          ) : (
                            <User className="h-3 w-3" />
                          )}
                          {p.fullName}
                        </span>
                      ))}
                      {service.professionals.length > 3 && (
                        <span className="text-[11px] text-muted-foreground/85">
                          +{service.professionals.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Professionals */}
      {clinic.professionals.length > 0 && (
        <section className="py-16 md:py-20 border-t border-border/40">
          <div className="mx-auto max-w-4xl px-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, ease }}
              className="mb-12"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                Equipe
              </p>
              <h2 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight">
                Nossos profissionais
              </h2>
            </motion.div>

            <div className="grid gap-6 sm:grid-cols-2">
              {clinic.professionals.map((pro, i) => (
                <motion.article
                  key={pro.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.6, delay: i * 0.06, ease }}
                  className="group flex gap-5 rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-sm hover:border-accent/20 hover:bg-card/50 transition-all duration-300"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/5">
                    {pro.avatarUrl ? (
                      <Image
                        src={pro.avatarUrl}
                        alt={pro.fullName}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground/85">
                        <Stethoscope className="h-7 w-7" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-foreground group-hover:text-accent transition-colors">
                      {pro.fullName}
                    </h3>
                    {pro.specialty && (
                      <p className="mt-0.5 text-sm text-muted-foreground">{pro.specialty}</p>
                    )}
                    {pro.bio && (
                      <p className="mt-3 text-[13px] text-muted-foreground line-clamp-2">
                        {pro.bio}
                      </p>
                    )}
                    {pro.services.length > 0 && (
                      <p className="mt-3 text-[11px] text-accent/90">
                        {pro.services.map((s) => s.name).join(" · ")}
                      </p>
                    )}
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact */}
      <section className="py-16 md:py-20 border-t border-border/40">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease }}
            className="mb-12"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
              Contato
            </p>
            <h2 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight">
              Entre em contato
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="flex flex-wrap gap-6"
          >
            {clinic.phone && (
              <a
                href={`tel:${clinic.phone.replace(/\D/g, "")}`}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/30 px-5 py-4 backdrop-blur-sm hover:border-accent/30 hover:bg-card/50 transition-all duration-300 group"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent group-hover:bg-accent/20 transition-colors">
                  <Phone className="h-5 w-5" weight="regular" />
                </span>
                <span className="text-[14px] font-medium">{clinic.phone}</span>
              </a>
            )}
            {clinic.email && (
              <a
                href={`mailto:${clinic.email}`}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/30 px-5 py-4 backdrop-blur-sm hover:border-accent/30 hover:bg-card/50 transition-all duration-300 group"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent group-hover:bg-accent/20 transition-colors">
                  <Envelope className="h-5 w-5" weight="regular" />
                </span>
                <span className="text-[14px] font-medium">{clinic.email}</span>
              </a>
            )}
            {clinic.website && (
              <a
                href={clinic.website.startsWith("http") ? clinic.website : `https://${clinic.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/30 px-5 py-4 backdrop-blur-sm hover:border-accent/30 hover:bg-card/50 transition-all duration-300 group"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent group-hover:bg-accent/20 transition-colors">
                  <Globe className="h-5 w-5" weight="regular" />
                </span>
                <span className="text-[14px] font-medium truncate max-w-[200px]">{clinic.website.replace(/^https?:\/\//, "")}</span>
              </a>
            )}
            {clinic.address && (
              <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-card/30 px-5 py-4 backdrop-blur-sm w-full max-w-md">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <MapPin className="h-5 w-5" weight="regular" />
                </span>
                <p className="text-[14px] text-muted-foreground leading-relaxed">
                  {formatAddress(clinic.address)}
                </p>
              </div>
            )}
          </motion.div>

          {/* CTA Agendar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease }}
            className="mt-12 flex flex-col items-center gap-4"
          >
            <p className="text-sm text-muted-foreground">
              Agende sua consulta facilmente
            </p>
            <Link
              href="/"
              className="group inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-[14px] font-semibold text-accent-foreground hover:bg-accent/90 transition-all duration-300"
            >
              <Calendar className="h-4 w-4 transition-transform group-hover:scale-105" />
              Acesse o Ailum para agendar
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="mx-auto max-w-4xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
            Ailum — Agendamento inteligente
          </Link>
          <p className="text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} {clinic.name}
          </p>
        </div>
      </footer>
    </main>
  )
}
