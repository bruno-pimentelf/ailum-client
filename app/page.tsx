import { ParticlesBackground } from "@/components/landing/particles-background"
import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { Marquee } from "@/components/landing/marquee"
import { HowItWorks } from "@/components/landing/how-it-works"
import { Features } from "@/components/landing/features"
import { ImpactStats } from "@/components/landing/impact-stats"
import { Testimonials } from "@/components/landing/testimonials"
import { Bento } from "@/components/landing/bento"
import { CTA } from "@/components/landing/cta"
import { Footer } from "@/components/landing/footer"
import { LandingShell } from "@/components/landing/landing-shell"

export default function Home() {
  return (
    <LandingShell>
      <main className="min-h-screen bg-transparent relative" style={{ overflowX: "clip" }}>
        <ParticlesBackground />
        <Navbar />
        <Hero />
        <Marquee />
        <ImpactStats />
        <HowItWorks />
        <Features />
        <Testimonials />
        <Bento />
        <CTA />
        <Footer />
      </main>
    </LandingShell>
  )
}
