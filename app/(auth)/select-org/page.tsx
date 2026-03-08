"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Buildings, Plus, ArrowRight, Sparkle, Check } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

const ease = [0.33, 1, 0.68, 1] as const

type Org = { id: string; name: string; slug: string; role?: string }

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function SelectOrgContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isNew = searchParams.get("new") === "1"

  const [orgs, setOrgs] = useState<Org[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activating, setActivating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create org state
  const [showCreate, setShowCreate] = useState(isNew)
  const [orgName, setOrgName] = useState("")
  const [orgSlug, setOrgSlug] = useState("")
  const [slugManual, setSlugManual] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    if (isNew) return
    authClient.organization.list().then(({ data }) => {
      if (data && data.length > 0) {
        setOrgs(data as Org[])
        if (data.length === 1) setSelectedId(data[0].id)
      } else {
        // No orgs → show creation form
        setShowCreate(true)
      }
      setLoading(false)
    })
  }, [isNew])

  const handleOrgNameChange = (val: string) => {
    setOrgName(val)
    if (!slugManual) setOrgSlug(slugify(val))
  }

  const handleSlugChange = (val: string) => {
    setOrgSlug(slugify(val))
    setSlugManual(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgName.trim()) return
    setCreating(true)
    setCreateError(null)

    const { data, error: createErr } = await authClient.organization.create({
      name: orgName.trim(),
      slug: orgSlug || slugify(orgName),
    })

    if (createErr || !data) {
      setCreateError("Não foi possível criar a clínica. O slug pode já estar em uso.")
      setCreating(false)
      return
    }

    // Activate org
    await authClient.organization.setActive({ organizationId: data.id })
    router.push("/dashboard")
  }

  const handleActivate = async () => {
    if (!selectedId) return
    setActivating(true)
    setError(null)

    const { error: activateErr } = await authClient.organization.setActive({ organizationId: selectedId })

    if (activateErr) {
      setError("Não foi possível acessar essa clínica.")
      setActivating(false)
      return
    }

    router.push("/dashboard")
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
        className="relative z-10 w-full max-w-[440px] px-6"
      >
        {/* Logo */}
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

          <AnimatePresence mode="wait">
            {showCreate ? (
              <motion.div key="create-header" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">Criar sua clínica</h1>
                <p className="mt-2 text-sm text-muted-foreground">Configure o espaço da sua clínica no Ailum</p>
              </motion.div>
            ) : (
              <motion.div key="select-header" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">Selecionar clínica</h1>
                <p className="mt-2 text-sm text-muted-foreground">Escolha com qual clínica deseja trabalhar</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center py-12">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <Sparkle className="h-5 w-5 text-accent" />
              </motion.div>
            </motion.div>
          ) : showCreate ? (
            <motion.form
              key="create-form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease }}
              onSubmit={handleCreate}
              className="flex flex-col gap-3"
            >
              <AnimatePresence>
                {createError && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-[12px] text-destructive">
                    {createError}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Nome da clínica</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => handleOrgNameChange(e.target.value)}
                  placeholder="Ex: Clínica Saúde & Bem-estar"
                  required
                  className="h-11 w-full rounded-xl border border-border bg-card/60 backdrop-blur-sm px-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all duration-300"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
                  Identificador (slug)
                </label>
                <div className="flex h-11 w-full items-center rounded-xl border border-border bg-card/60 backdrop-blur-sm px-4 text-sm focus-within:ring-2 focus-within:ring-accent/30 focus-within:border-accent/40 transition-all duration-300">
                  <span className="text-muted-foreground/50 shrink-0 mr-0.5">ailum.io/</span>
                  <input
                    type="text"
                    value={orgSlug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="minha-clinica"
                    className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground/50">Apenas letras minúsculas, números e hifens.</p>
              </div>

              <Button
                type="submit"
                disabled={creating}
                size="lg"
                className="group relative mt-2 h-11 w-full rounded-xl bg-accent text-sm font-medium text-accent-foreground hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/20 transition-all duration-300 overflow-hidden disabled:opacity-70"
              >
                <motion.span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" animate={{ x: ["-100%", "200%"] }} transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }} />
                <span className="relative z-10 flex items-center justify-center">
                  {creating ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><Sparkle className="h-4 w-4" /></motion.div>
                  ) : (
                    <><Buildings className="mr-2 h-4 w-4" /> Criar clínica <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" /></>
                  )}
                </span>
              </Button>

              {!isNew && (
                <button type="button" onClick={() => setShowCreate(false)} className="mt-1 text-center text-[12px] text-muted-foreground hover:text-foreground transition-colors duration-200">
                  Voltar
                </button>
              )}
            </motion.form>
          ) : (
            <motion.div
              key="select-list"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease }}
              className="flex flex-col gap-3"
            >
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-[12px] text-destructive">
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Org list */}
              <div className="flex flex-col gap-2">
                {orgs.map((org) => (
                  <motion.button
                    key={org.id}
                    type="button"
                    onClick={() => setSelectedId(org.id)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200 ${
                      selectedId === org.id
                        ? "border-accent/60 bg-accent/[0.06]"
                        : "border-border bg-card/40 hover:border-border/80 hover:bg-card/60"
                    }`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${selectedId === org.id ? "bg-accent/20" : "bg-muted/30"}`}>
                      <Buildings className={`h-5 w-5 ${selectedId === org.id ? "text-accent" : "text-muted-foreground"}`} weight="duotone" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{org.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{org.slug}</p>
                    </div>
                    {selectedId === org.id && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                        <Check className="h-4 w-4 text-accent" weight="bold" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>

              <Button
                type="button"
                disabled={!selectedId || activating}
                size="lg"
                onClick={handleActivate}
                className="group relative mt-2 h-11 w-full rounded-xl bg-accent text-sm font-medium text-accent-foreground hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/20 transition-all duration-300 overflow-hidden disabled:opacity-70"
              >
                <motion.span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" animate={{ x: ["-100%", "200%"] }} transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }} />
                <span className="relative z-10 flex items-center justify-center">
                  {activating ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><Sparkle className="h-4 w-4" /></motion.div>
                  ) : (
                    <>Acessar clínica <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" /></>
                  )}
                </span>
              </Button>

              {/* Create new org */}
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="flex items-center justify-center gap-2 mt-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                <Plus className="h-3.5 w-3.5" weight="bold" />
                Criar nova clínica
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default function SelectOrgPage() {
  return (
    <Suspense>
      <SelectOrgContent />
    </Suspense>
  )
}
