"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Eye, EyeSlash, Sparkle } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"

const ease = [0.33, 1, 0.68, 1] as const

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotLoading, setForgotLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 1400))
    setIsLoading(false)
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail) return
    setForgotLoading(true)
    await new Promise((r) => setTimeout(r, 1200))
    setForgotLoading(false)
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

      {/* Back to landing */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease }}
        className="absolute top-6 left-6"
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors duration-300"
        >
          <span
            className="text-base font-bold tracking-[0.35em] text-foreground"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            A I L U M
          </span>
        </Link>
      </motion.div>

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
                  className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 backdrop-blur-sm px-4 py-1.5"
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                  </span>
                  <span className="text-xs text-muted-foreground">Acesso restrito</span>
                </motion.div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  Bem-vindo de volta
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Entre na sua conta para continuar
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="flex flex-col gap-3">
                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    autoComplete="email"
                    className="h-11 w-full rounded-xl border border-border bg-card/60 backdrop-blur-sm px-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all duration-300"
                  />
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                      {showPassword ? (
                        <EyeSlash className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Forgot password link */}
                <div className="flex justify-end -mt-1">
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-[12px] text-muted-foreground hover:text-accent transition-colors duration-200"
                  >
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
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkle className="h-4 w-4" />
                      </motion.div>
                    ) : (
                      <>
                        Entrar
                        <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                      </>
                    )}
                  </span>
                </Button>
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
              {/* Header */}
              <div className="mb-8 text-center">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  Recuperar acesso
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enviaremos um link para redefinir sua senha
                </p>
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
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
                        Email
                      </label>
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="seu@email.com"
                        required
                        autoComplete="email"
                        className="h-11 w-full rounded-xl border border-border bg-card/60 backdrop-blur-sm px-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all duration-300"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={forgotLoading}
                      size="lg"
                      className="group relative mt-2 h-11 w-full rounded-xl bg-accent text-sm font-medium text-accent-foreground hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/20 transition-all duration-300 overflow-hidden disabled:opacity-70"
                    >
                      <motion.span
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none"
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
                      />
                      <span className="relative z-10 flex items-center justify-center">
                        {forgotLoading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Sparkle className="h-4 w-4" />
                          </motion.div>
                        ) : (
                          <>
                            Enviar link
                            <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                          </>
                        )}
                      </span>
                    </Button>

                    <button
                      type="button"
                      onClick={() => setShowForgot(false)}
                      className="mt-1 text-center text-[12px] text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      Voltar ao login
                    </button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="forgot-success"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease }}
                    className="text-center rounded-2xl border border-accent/20 bg-accent/[0.04] backdrop-blur-sm p-8"
                  >
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/15">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                      >
                        <ArrowRight className="h-5 w-5 text-accent rotate-[-45deg]" />
                      </motion.div>
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Link enviado</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Verifique sua caixa de entrada em{" "}
                      <span className="text-foreground">{forgotEmail}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail("") }}
                      className="mt-6 text-[12px] text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
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
