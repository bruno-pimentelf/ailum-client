"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  MagnifyingGlass,
  Bell,
  Question,
  User,
  Buildings,
  CaretUpDown,
  CaretDown,
  Check,
  SignOut,
  LinkSimple,
} from "@phosphor-icons/react"
import { authClient } from "@/lib/auth-client"
import { useAuthStore } from "@/lib/auth-store"

const ease = [0.33, 1, 0.68, 1] as const

export function AppHeader() {
  const router = useRouter()
  const { user, orgs, activeOrgId, setOrgs, setActiveOrgId } = useAuthStore()

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [clinicOpen, setClinicOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [clinicSearch, setClinicSearch] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)
  const profileDropdownRef = useRef<HTMLDivElement>(null)

  const selectedClinic = orgs.find((o) => o.id === activeOrgId) ?? orgs[0] ?? null

  const filtered = orgs.filter((c) =>
    c.name.toLowerCase().includes(clinicSearch.toLowerCase())
  )

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setClinicOpen(false)
        setClinicSearch("")
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleSwitchOrg = useCallback(async (orgId: string) => {
    const { error } = await authClient.organization.setActive({ organizationId: orgId })
    if (!error) {
      setActiveOrgId(orgId)
    }
    setClinicOpen(false)
    setClinicSearch("")
  }, [setActiveOrgId])

  const handleLogout = useCallback(async () => {
    await authClient.signOut()
    useAuthStore.getState().clear()
    router.push("/login")
  }, [router])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between border-b border-border bg-background/90 backdrop-blur-xl px-5">
      {/* Left — logo + clinic selector */}
      <div className="flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <span
            className="text-[15px] font-bold tracking-[0.35em] text-foreground"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            A I L U M
          </span>
        </Link>

        {/* Divider */}
        <div className="h-5 w-px bg-border" />

        {/* Ver perfil público */}
        {selectedClinic?.slug && (
          <a
            href={`/${selectedClinic.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12px] text-muted-foreground hover:text-accent hover:bg-muted/40 transition-colors font-mono"
            title="Abrir perfil público em nova aba"
          >
            <LinkSimple className="h-3.5 w-3.5" />
            /{selectedClinic.slug}
          </a>
        )}

        {/* Clinic selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => { setClinicOpen((v) => !v); setClinicSearch("") }}
            className="flex h-8 items-center gap-2 rounded-lg border border-border bg-card/50 px-3 text-[13px] text-foreground hover:bg-muted/40 transition-colors duration-200 cursor-pointer"
          >
            <Buildings className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="max-w-[160px] truncate font-medium">
              {selectedClinic?.name ?? "Selecionar clínica"}
            </span>
            <CaretUpDown className="h-3 w-3 text-muted-foreground shrink-0" />
          </button>

          <AnimatePresence>
            {clinicOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.2, ease }}
                className="absolute left-0 top-full mt-2 w-64 rounded-xl border border-border bg-popover shadow-xl shadow-black/30 overflow-hidden z-50"
              >
                {/* Search inside dropdown */}
                <div className="p-2 border-b border-border">
                  <div className="relative">
                    <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      autoFocus
                      value={clinicSearch}
                      onChange={(e) => setClinicSearch(e.target.value)}
                      placeholder="Buscar clínica..."
                      className="h-8 w-full rounded-lg bg-muted/40 pl-8 pr-3 text-[12px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* List */}
                <div className="p-1.5">
                  {orgs.length > 0 && (
                    <p className="px-2 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">
                      Clínicas
                    </p>
                  )}
                  {filtered.map((clinic) => {
                    const active = clinic.id === activeOrgId
                    return (
                      <button
                        key={clinic.id}
                        onClick={() => handleSwitchOrg(clinic.id)}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors duration-150 ${
                          active
                            ? "bg-accent/10 text-foreground font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        }`}
                      >
                        <Buildings className={`h-3.5 w-3.5 shrink-0 ${active ? "text-accent" : ""}`} weight={active ? "fill" : "regular"} />
                        <span className="flex-1 text-left truncate">{clinic.name}</span>
                        {active && <Check className="h-3.5 w-3.5 text-accent shrink-0" weight="bold" />}
                      </button>
                    )
                  })}
                  {filtered.length === 0 && (
                    <p className="px-2.5 py-3 text-[12px] text-muted-foreground/50 text-center">
                      Nenhuma clínica encontrada
                    </p>
                  )}
                </div>

                {/* Create new */}
                <div className="p-2 border-t border-border">
                  <Link
                    href="/select-org"
                    onClick={() => setClinicOpen(false)}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors duration-150"
                  >
                    <Buildings className="h-3.5 w-3.5 shrink-0" weight="regular" />
                    Gerenciar clínicas
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right — search + actions + avatar */}
      <div className="flex items-center gap-1.5">
        {/* Search */}
        <AnimatePresence initial={false} mode="wait">
          {searchOpen ? (
            <motion.div
              key="search-open"
              initial={{ width: 36, opacity: 0.5 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 36, opacity: 0 }}
              transition={{ duration: 0.3, ease }}
              className="relative flex items-center overflow-hidden"
            >
              <MagnifyingGlass className="absolute left-3 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                autoFocus
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onBlur={() => { if (!searchValue) setSearchOpen(false) }}
                placeholder="Buscar..."
                className="h-8 w-full rounded-lg border border-border bg-card/60 pl-8 pr-10 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all duration-300"
              />
              <kbd className="absolute right-2.5 flex items-center rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground/60 font-mono">
                ⌘K
              </kbd>
            </motion.div>
          ) : (
            <motion.button
              key="search-closed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSearchOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors duration-200"
            >
              <MagnifyingGlass className="h-4 w-4" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Bell */}
        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors duration-200">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
        </button>

        {/* Help */}
        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors duration-200">
          <Question className="h-4 w-4" />
        </button>

        {/* Divider */}
        <div className="mx-1 h-5 w-px bg-border" />

        {/* Profile dropdown */}
        <div className="relative" ref={profileDropdownRef}>
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex h-8 items-center gap-2 rounded-lg px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors duration-200 cursor-pointer"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 border border-accent/20 shrink-0">
              <User className="h-3.5 w-3.5 text-accent" weight="fill" />
            </div>
            <span className="hidden md:block text-[13px] font-medium text-foreground max-w-[140px] truncate">
              {user?.name ?? "Perfil"}
            </span>
            <CaretDown
              className={`h-3 w-3 shrink-0 text-muted-foreground transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.2, ease }}
                className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-popover shadow-xl shadow-black/30 overflow-hidden z-50"
              >
                <div className="p-2 border-b border-border">
                  <p className="text-[12px] font-semibold text-foreground truncate">{user?.name ?? "—"}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user?.email ?? "—"}</p>
                </div>
                <div className="p-1.5">
                  <Link
                    href="/settings?tab=perfil"
                    onClick={() => setProfileOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors duration-150"
                  >
                    <User className="h-4 w-4 shrink-0" weight="regular" />
                    Meu Perfil
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[13px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-150"
                  >
                    <SignOut className="h-4 w-4 shrink-0" weight="regular" />
                    Sair
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
