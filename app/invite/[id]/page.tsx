"use client"

import { Suspense, use, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Users, ArrowRight, CheckCircle, Warning, SignIn, UserPlus } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

function InviteContent({ invitationId }: { invitationId: string }) {
  const searchParams = useSearchParams()
  const inviteEmail = searchParams.get("email") ?? ""

  const [status, setStatus] = useState<"loading" | "prompt" | "accepting" | "success" | "error" | "wrong-email">("loading")
  const [error, setError] = useState<string | null>(null)

  const callbackUrl = `/invite/${invitationId}${inviteEmail ? `?email=${encodeURIComponent(inviteEmail)}` : ""}`

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!invitationId) {
        setStatus("error")
        setError("Convite inválido.")
        return
      }

      const { data: session } = await authClient.getSession()

      if (cancelled) return

      if (!session?.user) {
        setStatus("prompt")
        return
      }

      // Logado com outro email
      if (inviteEmail && session.user.email) {
        const sessionEmail = session.user.email.trim().toLowerCase()
        const invite = inviteEmail.trim().toLowerCase()
        if (sessionEmail !== invite) {
          setStatus("wrong-email")
          return
        }
      }

      setStatus("accepting")

      const { data, error: acceptError } = await authClient.organization.acceptInvitation({
        invitationId,
      })

      if (cancelled) return

      if (acceptError || !data) {
        setStatus("error")
        setError(acceptError?.message ?? "Não foi possível aceitar o convite.")
        return
      }

      setStatus("success")
      window.location.href = "/chats"
    }

    run()
    return () => {
      cancelled = true
    }
  }, [invitationId, inviteEmail])

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
            <Users className="h-8 w-8 text-accent" weight="duotone" />
          </motion.div>
          <p className="text-sm text-muted-foreground">Verificando sessão...</p>
        </div>
      </div>
    )
  }

  // Não logado → mostrar "Fazer login" e "Criar conta"
  if (status === "prompt") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[360px] rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-8 text-center"
        >
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 border border-accent/20">
            <Users className="h-7 w-7 text-accent" weight="duotone" />
          </div>
          <h1 className="text-lg font-semibold text-foreground mb-2">Você foi convidado</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {inviteEmail ? `Faça login ou crie uma conta com ${inviteEmail} para aceitar o convite.` : "Faça login ou crie uma conta para aceitar o convite."}
          </p>
          <div className="flex flex-col gap-2">
            <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
              <Button className="w-full gap-2">
                <SignIn className="h-4 w-4" weight="bold" /> Fazer login
              </Button>
            </Link>
            <Link
              href={`/sign-up?${inviteEmail ? `email=${encodeURIComponent(inviteEmail)}&` : ""}callbackUrl=${encodeURIComponent(callbackUrl)}`}
            >
              <Button variant="outline" className="w-full gap-2">
                <UserPlus className="h-4 w-4" weight="bold" /> Criar conta
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  // Logado com outro email
  if (status === "wrong-email") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[360px] rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 text-center"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
            <Warning className="h-6 w-6 text-amber-500" weight="fill" />
          </div>
          <h1 className="text-lg font-semibold text-foreground mb-2">Email diferente do convite</h1>
          <p className="text-sm text-muted-foreground mb-4">Faça login com o email do convite para aceitá-lo.</p>
          <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
            <Button variant="outline">Trocar de conta</Button>
          </Link>
        </motion.div>
      </div>
    )
  }

  if (status === "accepting") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
            <Users className="h-8 w-8 text-accent" weight="duotone" />
          </motion.div>
          <p className="text-sm text-muted-foreground">Aceitando convite...</p>
        </div>
      </div>
    )
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
            <CheckCircle className="h-6 w-6 text-emerald-500" weight="fill" />
          </div>
          <p className="text-sm font-medium text-foreground">Convite aceito! Redirecionando...</p>
          <Link href="/chats">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              Ir para o app <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[360px] rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center"
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <Warning className="h-6 w-6 text-destructive" weight="fill" />
        </div>
        <h1 className="text-lg font-semibold text-foreground mb-2">Erro ao aceitar convite</h1>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
          <Button>Fazer login</Button>
        </Link>
      </motion.div>
    </div>
  )
}

export default function InviteAcceptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
      </div>
    }>
      <InviteContent invitationId={id} />
    </Suspense>
  )
}
