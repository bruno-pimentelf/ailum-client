"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, Check, Sparkle } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { FadeIn } from "./motion"
import { useLanguage } from "@/components/providers/language-provider"

export function Waitlist() {
    const { t } = useLanguage()
    const [email, setEmail] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) return
        setIsLoading(true)
        // Simulate API call
        await new Promise((r) => setTimeout(r, 1200))
        setIsLoading(false)
        setSubmitted(true)
    }

    return (
        <section id="waitlist" className="relative border-t border-border overflow-hidden py-24 md:py-32">
            {/* Ambient background glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-accent/[0.04] rounded-full blur-3xl" />
            </div>

            <div className="relative mx-auto max-w-6xl px-6">
                <FadeIn className="mx-auto max-w-lg text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                        {t.waitlist.acessoAntecipado}
                    </p>
                    <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                        {t.waitlist.entreLista}{" "}
                        <span className="font-display italic text-accent">{t.waitlist.listaEspera}</span>
                    </h2>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                        {t.waitlist.descricao}
                    </p>
                </FadeIn>

                <FadeIn className="mx-auto mt-10 max-w-md">
                    {!submitted ? (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t.waitlist.placeholder}
                                    required
                                    className="w-full h-12 rounded-xl border border-border bg-card/60 backdrop-blur-sm px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all duration-300"
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                size="lg"
                                className="group relative h-12 rounded-xl bg-accent px-8 text-sm font-medium text-accent-foreground hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/20 transition-all duration-300 overflow-hidden disabled:opacity-70"
                            >
                                <motion.span
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none"
                                    animate={{ x: ['-100%', '200%'] }}
                                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
                                />
                                <span className="relative z-10 flex items-center justify-center">
                                    {isLoading ? (
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        >
                                            <Sparkle className="h-4 w-4" />
                                        </motion.div>
                                    ) : (
                                        <>
                                            {t.waitlist.aplicarSe}
                                            <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                                        </>
                                    )}
                                </span>
                            </Button>
                            <p className="text-center text-[11px] text-muted-foreground/90">
                                {t.waitlist.semSpam}
                            </p>
                        </form>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
                            className="text-center rounded-2xl border border-accent/20 bg-accent/[0.04] backdrop-blur-sm p-8"
                        >
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/15">
                                <Check className="h-5 w-5 text-accent" weight="bold" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">{t.waitlist.sucesso}</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {t.waitlist.sucessoDesc}
                            </p>
                        </motion.div>
                    )}
                </FadeIn>

                {/* Trust indicators */}
                <FadeIn className="mx-auto mt-16 max-w-xl">
                    <div className="grid grid-cols-3 gap-6 text-center">
                        {[
                            { value: "50+", label: t.waitlist.clinicasFila },
                            { value: "48h", label: t.waitlist.paraAtivar },
                            { value: "100%", label: t.waitlist.gratuitoBeta },
                        ].map((item) => (
                            <div key={item.label}>
                                <p className="text-2xl font-semibold tracking-tight text-foreground">{item.value}</p>
                                <p className="mt-1 text-[11px] text-muted-foreground">{item.label}</p>
                            </div>
                        ))}
                    </div>
                </FadeIn>
            </div>
        </section>
    )
}
