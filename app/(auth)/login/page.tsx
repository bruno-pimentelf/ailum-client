"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Eye, EyeSlash, Sparkle, CheckCircle } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

const ease = [0.33, 1, 0.68, 1] as const

function safeCallbackUrl(url: string | null): string | null {
  if (!url) return null
  if (!url.startsWith("/")) return null
  if (url.startsWith("//")) return null
  return url
}

function LoginContent() {
  const searchParams = useSearchParams()
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"))

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotError, setForgotError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setIsLoading(true)
    setError(null)

    const { data, error: authError } = await authClient.signIn.email({ email, password })

    if (authError || !data) {
      setError("E-mail ou senha incorretos. Verifique e tente novamente.")
      setIsLoading(false)
      return
    }

    // Fetch orgs to set active
    const { data: orgs } = await authClient.organization.list()

    if (!orgs || orgs.length === 0) {
      window.location.href = callbackUrl ?? "/select-org?new=1"
      return
    }

    if (orgs.length === 1) {
      await authClient.organization.setActive({ organizationId: orgs[0].id })
      // Hard navigate — gives the browser time to commit the Set-Cookie
      // before the next request, avoiding race conditions in production
      window.location.href = callbackUrl ?? "/chats"
      return
    }

    // Multiple orgs → let user choose (preserve callbackUrl for after select)
    window.location.href = callbackUrl ? `/select-org?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/select-org"
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail) return
    setForgotLoading(true)
    setForgotError(null)

    const { error: authError } = await authClient.requestPasswordReset({
      email: forgotEmail,
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setForgotLoading(false)

    if (authError) {
      setForgotError("Não foi possível enviar o e-mail. Verifique o endereço.")
      return
    }

    setForgotSent(true)
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

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.15, ease }}
        className="relative z-10 w-full max-w-[400px] px-6"
      >
        <AnimatePresence mode="wait">
          {!showForgot ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease }}
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
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">Bem-vindo de volta</h1>
                <p className="mt-2 text-sm text-muted-foreground">Entre na sua conta para continuar</p>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="flex flex-col gap-3">
                {/* Error */}
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
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      className="h-11 w-full rounded-xl border border-border bg-card/60 backdrop-blur-sm px-4 pr-11 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors duration-200"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Forgot link */}
                <div className="flex justify-end -mt-1">
                  <button type="button" onClick={() => { setShowForgot(true); setForgotEmail(email) }} className="text-[12px] text-muted-foreground hover:text-accent transition-colors duration-200">
                    Esqueci minha senha
                  </button>
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
                      <>Entrar <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" /></>
                    )}
                  </span>
                </Button>

                {/* Sign up link */}
                <p className="mt-2 text-center text-[12px] text-muted-foreground">
                  Não tem uma conta?{" "}
                  <Link
                    href={callbackUrl ? `/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/sign-up"}
                    className="text-accent hover:text-accent/80 font-medium transition-colors duration-200"
                  >
                    Criar conta
                  </Link>
                </p>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="forgot"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease }}
            >
              <div className="mb-8 text-center">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">Recuperar acesso</h1>
                <p className="mt-2 text-sm text-muted-foreground">Enviaremos um link para redefinir sua senha</p>
              </div>

              <AnimatePresence mode="wait">
                {!forgotSent ? (
                  <motion.form
                    key="forgot-form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleForgot}
                    className="flex flex-col gap-3"
                  >
                    <AnimatePresence>
                      {forgotError && (
                        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-[12px] text-destructive">
                          {forgotError}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Email</label>
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => { setForgotEmail(e.target.value); setForgotError(null) }}
                        placeholder="seu@email.com"
                        required
                        autoComplete="email"
                        className="h-11 w-full rounded-xl border border-border bg-card/60 backdrop-blur-sm px-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all duration-300"
                      />
                    </div>
                    <Button type="submit" disabled={forgotLoading} size="lg" className="group relative mt-2 h-11 w-full rounded-xl bg-accent text-sm font-medium text-accent-foreground hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/20 transition-all duration-300 overflow-hidden disabled:opacity-70">
                      <motion.span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" animate={{ x: ["-100%", "200%"] }} transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }} />
                      <span className="relative z-10 flex items-center justify-center">
                        {forgotLoading ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><Sparkle className="h-4 w-4" /></motion.div>
                        ) : (
                          <>Enviar link <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" /></>
                        )}
                      </span>
                    </Button>
                    <button type="button" onClick={() => setShowForgot(false)} className="mt-1 text-center text-[12px] text-muted-foreground hover:text-foreground transition-colors duration-200">
                      Voltar ao login
                    </button>
                  </motion.form>
                ) : (
                  <motion.div key="forgot-success" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} className="text-center rounded-2xl border border-accent/20 bg-accent/[0.04] backdrop-blur-sm p-8">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/15">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}>
                        <CheckCircle className="h-6 w-6 text-accent" weight="fill" />
                      </motion.div>
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Link enviado</h3>
                    <p className="mt-2 text-sm text-muted-foreground">Verifique sua caixa de entrada em <span className="text-foreground">{forgotEmail}</span></p>
                    <button type="button" onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail("") }} className="mt-6 text-[12px] text-muted-foreground hover:text-foreground transition-colors duration-200">
                      Voltar ao login
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
