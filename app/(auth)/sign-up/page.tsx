"use client"

import { Suspense, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Eye, EyeSlash, Sparkle } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

const ease = [0.33, 1, 0.68, 1] as const

function safeCallbackUrl(url: string | null): string | null {
  if (!url) return null
  if (!url.startsWith("/")) return null
  if (url.startsWith("//")) return null
  return url
}

function SignUpContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"))
  const emailFromUrl = searchParams.get("email") ?? ""

  const [name, setName] = useState("")
  const [email, setEmail] = useState(emailFromUrl)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) return
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.")
      return
    }
    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.")
      return
    }

    setIsLoading(true)
    setError(null)

    const { error: authError } = await authClient.signUp.email({ email, password, name })

    if (authError) {
      const msg =
        authError.message?.toLowerCase().includes("email")
          ? "Este e-mail já está em uso."
          : "Não foi possível criar a conta. Tente novamente."
      setError(msg)
      setIsLoading(false)
      return
    }

    // New user: if came from invite, go back to accept; else create org
    if (callbackUrl) {
      window.location.href = callbackUrl
    } else {
      router.push("/select-org?new=1")
    }
  }

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          animate={{ y: [0, -20, 0], scale: [1, 1.04, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[60rem] w-[60rem]"
        >
          <div className="absolute inset-0 rounded-full bg-accent/6 blur-[140px]" />
          <div className="absolute inset-[20%] rounded-full bg-cyan-400/4 blur-[80px]" />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.15, ease }}
        className="relative z-10 w-full max-w-[420px] px-6"
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.25, ease }}
            className="mb-6 flex justify-center"
          >
            <span className="text-[18px] font-bold tracking-[0.4em] text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
              A I L U M
            </span>
          </motion.div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Criar conta</h1>
          <p className="mt-2 text-sm text-muted-foreground">Comece sua jornada com o Ailum</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignUp} className="flex flex-col gap-3">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-[12px] text-destructive"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Nome completo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null) }}
              placeholder="Seu nome"
              required
              autoComplete="name"
              className="h-11 w-full rounded-xl border border-border bg-card/60 backdrop-blur-sm px-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all duration-300"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null) }}
              placeholder="seu@email.com"
              required
              autoComplete="email"
              className="h-11 w-full rounded-xl border border-border bg-card/60 backdrop-blur-sm px-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all duration-300"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null) }}
                placeholder="Mínimo 8 caracteres"
                required
                autoComplete="new-password"
                className="h-11 w-full rounded-xl border border-border bg-card/60 backdrop-blur-sm px-4 pr-11 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all duration-300"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors duration-200" tabIndex={-1}>
                {showPassword ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Confirmar senha</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(null) }}
                placeholder="Repita a senha"
                required
                autoComplete="new-password"
                className="h-11 w-full rounded-xl border border-border bg-card/60 backdrop-blur-sm px-4 pr-11 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all duration-300"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors duration-200" tabIndex={-1}>
                {showConfirm ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isLoading}
            size="lg"
            className="group relative mt-2 h-11 w-full rounded-xl bg-accent text-sm font-medium text-accent-foreground hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/20 transition-all duration-300 overflow-hidden disabled:opacity-70"
          >
            <motion.span
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
            />
            <span className="relative z-10 flex items-center justify-center">
              {isLoading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                  <Sparkle className="h-4 w-4" />
                </motion.div>
              ) : (
                <>Criar conta <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" /></>
              )}
            </span>
          </Button>

          <p className="mt-2 text-center text-[12px] text-muted-foreground">
            Já tem uma conta?{" "}
            <Link
              href={callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login"}
              className="text-accent hover:text-accent/80 font-medium transition-colors duration-200"
            >
              Entrar
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
      </div>
    }>
      <SignUpContent />
    </Suspense>
  )
}
