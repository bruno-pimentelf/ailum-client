"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Eye, EyeSlash, Sparkle, CheckCircle } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

const ease = [0.33, 1, 0.68, 1] as const

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      setError("Link inválido ou expirado. Solicite um novo link.")
      return
    }
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

    const { error: authError } = await authClient.resetPassword({ token, newPassword: password })

    setIsLoading(false)

    if (authError) {
      setError("Link inválido ou expirado. Solicite um novo link de redefinição.")
      return
    }

    setSuccess(true)
    setTimeout(() => router.push("/login"), 3000)
  }

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center overflow-hidden">
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
        className="relative z-10 w-full max-w-[400px] px-6"
      >
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
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Nova senha</h1>
          <p className="mt-2 text-sm text-muted-foreground">Defina uma nova senha para sua conta</p>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease }}
              className="text-center rounded-2xl border border-accent/20 bg-accent/[0.04] backdrop-blur-sm p-8"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/15">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}>
                  <CheckCircle className="h-6 w-6 text-accent" weight="fill" />
                </motion.div>
              </div>
              <h3 className="text-base font-semibold text-foreground">Senha atualizada</h3>
              <p className="mt-2 text-sm text-muted-foreground">Redirecionando para o login...</p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease }}
              onSubmit={handleReset}
              className="flex flex-col gap-3"
            >
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-[12px] text-destructive">
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {!token && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[12px] text-amber-400">
                  Link inválido. Solicite um novo link de redefinição de senha.
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Nova senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null) }}
                    placeholder="Mínimo 8 caracteres"
                    required
                    disabled={!token}
                    autoComplete="new-password"
                    className="h-11 w-full rounded-xl border border-border bg-card/60 backdrop-blur-sm px-4 pr-11 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all duration-300 disabled:opacity-40"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/85 hover:text-muted-foreground transition-colors duration-200" tabIndex={-1}>
                    {showPassword ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Confirmar senha</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(null) }}
                    placeholder="Repita a senha"
                    required
                    disabled={!token}
                    autoComplete="new-password"
                    className="h-11 w-full rounded-xl border border-border bg-card/60 backdrop-blur-sm px-4 pr-11 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all duration-300 disabled:opacity-40"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/85 hover:text-muted-foreground transition-colors duration-200" tabIndex={-1}>
                    {showConfirm ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !token}
                size="lg"
                className="group relative mt-2 h-11 w-full rounded-xl bg-accent text-sm font-medium text-accent-foreground hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/20 transition-all duration-300 overflow-hidden disabled:opacity-70"
              >
                <motion.span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" animate={{ x: ["-100%", "200%"] }} transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }} />
                <span className="relative z-10 flex items-center justify-center">
                  {isLoading ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><Sparkle className="h-4 w-4" /></motion.div>
                  ) : (
                    <>Salvar senha <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" /></>
                  )}
                </span>
              </Button>

              <Link href="/login" className="mt-1 text-center text-[12px] text-muted-foreground hover:text-foreground transition-colors duration-200 block">
                Voltar ao login
              </Link>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  )
}
