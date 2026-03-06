"use client"

import { useEffect, useRef } from "react"
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion"
import { ArrowRight } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { MedicalViz } from "@/components/landing/medical-viz"

const ease = [0.33, 1, 0.68, 1] as any

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Spring-smoothed parallax offsets
  const springConfig = { stiffness: 50, damping: 30, mass: 1 }
  const parallaxX = useSpring(useTransform(mouseX, [-0.5, 0.5], [12, -12]), springConfig)
  const parallaxY = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), springConfig)
  const imageParallaxX = useSpring(useTransform(mouseX, [-0.5, 0.5], [6, -6]), springConfig)
  const imageParallaxY = useSpring(useTransform(mouseY, [-0.5, 0.5], [4, -4]), springConfig)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      mouseX.set(x)
      mouseY.set(y)
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [mouseX, mouseY])

  return (
    <section ref={containerRef} className="relative overflow-hidden pt-32 pb-24 md:pt-40 md:pb-32">
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          {/* Pill */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 backdrop-blur-sm px-4 py-1.5 shadow-sm"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            <span className="text-xs text-muted-foreground">Agendamento com pagamento integrado via Pix</span>
          </motion.div>

          {/* Headline with parallax */}
          <motion.div
            style={{ x: parallaxX, y: parallaxY }}
          >
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.2, ease }}
              className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-[4.25rem] lg:leading-[1.08]"
            >
              Agende consultas{" "}
              <span className="font-display italic text-accent">
                enquanto dorme
              </span>
            </motion.h1>
          </motion.div>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease }}
            className="mx-auto mt-6 max-w-xl text-pretty text-[15px] leading-relaxed text-muted-foreground"
          >
            IA integrada ao WhatsApp que atende, agenda e cobra via Pix enquanto voce foca no que importa. Cada clinica com seu gerente de conta dedicado.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button size="lg" asChild className="group relative h-11 rounded-lg bg-accent px-8 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-all duration-300 overflow-hidden">
              <a href="https://form.typeform.com/to/d4xLz0DX" target="_blank" rel="noopener noreferrer">
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
                />
                <span className="relative z-10 flex items-center">
                  Aplicar-se
                  <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
              </a>
            </Button>
          </motion.div>
        </div>

        {/* Ambient background glow orb */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, delay: 0.1, ease }}
          className="absolute left-1/2 top-0 -z-10 -translate-x-1/2 -translate-y-20 md:-translate-y-32 pointer-events-none"
        >
          <motion.div
            animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="h-[40rem] w-[40rem] sm:h-[50rem] sm:w-[50rem] md:h-[65rem] md:w-[65rem]"
          >
            <div className="absolute inset-0 rounded-full bg-accent/8 blur-[120px]" />
            <div className="absolute inset-[15%] rounded-full bg-cyan-400/5 blur-[80px]" />
          </motion.div>
        </motion.div>

        {/* Hero Banner — Medical Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.2, delay: 0.2, ease }}
          className="relative mx-auto mt-20 max-w-5xl"
          style={{
            maskImage: "linear-gradient(to bottom, black 55%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 55%, transparent 100%)",
          }}
        >
          <motion.div
            style={{ x: imageParallaxX, y: imageParallaxY }}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Outer glow ring */}
            <div className="absolute -inset-4 rounded-3xl bg-accent/20 blur-3xl opacity-50 animate-pulse" style={{ animationDuration: '4s' }} />
            <MedicalViz />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
