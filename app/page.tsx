import { ParticlesBackground } from "@/components/landing/particles-background"
import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { Stats } from "@/components/landing/stats"
import { HowItWorks } from "@/components/landing/how-it-works"
import { Features } from "@/components/landing/features"
import { Bento } from "@/components/landing/bento"
import { Waitlist } from "@/components/landing/waitlist"
import { CTA } from "@/components/landing/cta"
import { Footer } from "@/components/landing/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-transparent overflow-x-hidden relative">
      <ParticlesBackground />
      <Navbar />
      <Hero />
      <Stats />
      <HowItWorks />
      <Features />
      <Bento />
      <Waitlist />
      <CTA />
      <Footer />
    </main>
  )
}
