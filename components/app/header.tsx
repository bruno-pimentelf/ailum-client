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
  X,
  WarningCircle,
  WarningOctagon,
  Info,
} from "@phosphor-icons/react"
import { authClient } from "@/lib/auth-client"
import { useAuthStore } from "@/lib/auth-store"
import { useNotifications, type TenantNotification } from "@/hooks/use-notifications"
import { useTenant } from "@/hooks/use-tenant"

const ease = [0.33, 1, 0.68, 1] as const

export function AppHeader() {
  const router = useRouter()
  const { user, orgs, activeOrgId, setOrgs, setActiveOrgId } = useAuthStore()

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [clinicOpen, setClinicOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [clinicSearch, setClinicSearch] = useState("")
  const [notifFilter, setNotifFilter] = useState<"all" | "critical" | "payments" | "agenda" | "automations">("all")
  const [toasts, setToasts] = useState<Array<{ id: string; title: string; body: string; severity: "critical" | "warning" | "info" }>>([])
  const dropdownRef = useRef<HTMLDivElement>(null)
  const profileDropdownRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const seenToastRef = useRef(new Set<string>())
  const toastTimerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const { data: tenant } = useTenant()
  const {
    items: notificationItems,
    unreadCount,
    recentAdded,
    markAsRead,
    markAllAsRead,
    markAllPending,
    readPendingIds,
  } = useNotifications()

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
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  useEffect(() => {
    return () => {
      Object.values(toastTimerRef.current).forEach((t) => clearTimeout(t))
    }
  }, [])

  const notificationsEnabled = tenant?.notificationsEnabled ?? true
  const enabledTypes = tenant?.notificationTypes?.length
    ? new Set(tenant.notificationTypes)
    : null

  const effectiveItems = notificationItems.filter((n) => {
    if (!notificationsEnabled) return false
    if (enabledTypes && !enabledTypes.has(n.type)) return false
    return true
  })

  const effectiveUnread = effectiveItems.filter((n) => !n.read).length

  const filteredNotifications = effectiveItems.filter((n) => {
    if (notifFilter === "all") return true
    if (notifFilter === "critical") return n.severity === "critical"
    if (notifFilter === "payments") return n.type.startsWith("payment.")
    if (notifFilter === "agenda") return n.type.startsWith("appointment.")
    if (notifFilter === "automations") {
      return n.type.startsWith("trigger.") || n.type.startsWith("guardrail.") || n.type.startsWith("slot_recall.")
    }
    return true
  })

  function getNotificationHref(n: TenantNotification) {
    if (!n.entityType) return null
    if (n.entityType === "appointment") return "/calendar"
    if (n.entityType === "charge") return "/financeiro"
    if (n.entityType === "trigger") return "/boards"
    if (n.entityType === "contact") return "/chats"
    return null
  }

  function formatRelative(iso: string) {
    const date = new Date(iso)
    const diff = Date.now() - date.getTime()
    const min = Math.floor(diff / 60_000)
    const hour = Math.floor(diff / 3_600_000)
    const day = Math.floor(diff / 86_400_000)
    if (min < 1) return "agora"
    if (min < 60) return `há ${min}m`
    if (hour < 24) return `há ${hour}h`
    return `há ${day}d`
  }

  function toastIcon(severity: "critical" | "warning" | "info") {
    if (severity === "critical") return <WarningOctagon className="h-4 w-4 text-rose-400 shrink-0" weight="fill" />
    if (severity === "warning") return <WarningCircle className="h-4 w-4 text-amber-400 shrink-0" weight="fill" />
    return <Info className="h-4 w-4 text-sky-400 shrink-0" weight="fill" />
  }

  useEffect(() => {
    if (!notificationsEnabled) return
    for (const n of recentAdded) {
      const key = n.dedupeKey ?? n.id
      if (seenToastRef.current.has(key)) continue
      seenToastRef.current.add(key)
      const isContextOpen = notificationsOpen
      const shouldToast =
        n.severity === "critical" ||
        (n.severity === "warning" && !isContextOpen)
      if (!shouldToast) continue
      setToasts((prev) => [...prev, { id: key, title: n.title, body: n.body, severity: n.severity }].slice(-4))
      const timer = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== key))
        delete toastTimerRef.current[key]
      }, 4500)
      toastTimerRef.current[key] = timer
    }
  }, [recentAdded, notificationsEnabled, notificationsOpen])

  const handleNotificationClick = useCallback(async (n: TenantNotification) => {
    try {
      if (!n.read && !readPendingIds.has(n.id)) await markAsRead(n.id)
    } catch {
      // ignore read failures on click
    }
    const href = getNotificationHref(n)
    if (href) {
      router.push(href)
      setNotificationsOpen(false)
    }
  }, [markAsRead, readPendingIds, router])

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
                    <p className="px-2 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/85">
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
                    <p className="px-2.5 py-3 text-[12px] text-muted-foreground/85 text-center">
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
              <kbd className="absolute right-2.5 flex items-center rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground/90 font-mono">
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
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setNotificationsOpen((v) => !v)}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors duration-200 cursor-pointer"
          >
            <Bell className="h-4 w-4" />
            {effectiveUnread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-accent px-1 text-[10px] font-bold leading-4 text-accent-foreground text-center">
                {effectiveUnread > 9 ? "9+" : effectiveUnread}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.2, ease }}
                className="absolute right-0 top-full mt-2 w-[380px] max-w-[calc(100vw-24px)] rounded-xl border border-border bg-popover shadow-xl shadow-black/30 overflow-hidden z-50"
              >
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
                  <div>
                    <p className="text-[12px] font-semibold text-foreground">Notificações</p>
                    <p className="text-[10px] text-muted-foreground">
                      {effectiveUnread > 0 ? `${effectiveUnread} não lidas` : "Tudo em dia"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => void markAllAsRead()}
                      disabled={markAllPending || effectiveUnread === 0}
                      className="text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default"
                    >
                      {markAllPending ? "Marcando..." : "Marcar todas"}
                    </button>
                    <button
                      onClick={() => setNotificationsOpen(false)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1 px-2 py-2 border-b border-border overflow-x-auto">
                  {[
                    { id: "all", label: "Todas" },
                    { id: "critical", label: "Críticas" },
                    { id: "payments", label: "Pagamentos" },
                    { id: "agenda", label: "Agenda" },
                    { id: "automations", label: "Automações" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setNotifFilter(f.id as typeof notifFilter)}
                      className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                        notifFilter === f.id
                          ? "bg-accent/15 text-accent"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="max-h-[380px] overflow-y-auto p-1.5">
                  {!notificationsEnabled && (
                    <p className="px-2.5 py-3 text-[12px] text-muted-foreground/90 text-center">
                      Notificações desativadas nas configurações do tenant.
                    </p>
                  )}

                  {notificationsEnabled && filteredNotifications.length === 0 && (
                    <p className="px-2.5 py-3 text-[12px] text-muted-foreground/90 text-center">
                      Nenhuma notificação nesse filtro.
                    </p>
                  )}

                  {notificationsEnabled &&
                    filteredNotifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => void handleNotificationClick(n)}
                        disabled={readPendingIds.has(n.id)}
                        className={`w-full rounded-lg px-2.5 py-2 text-left transition-colors cursor-pointer ${
                          n.read
                            ? "hover:bg-muted/30"
                            : "bg-accent/5 hover:bg-accent/10"
                        } disabled:opacity-70`}
                      >
                        <div className="flex items-start gap-2.5">
                          {toastIcon(n.severity)}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-[12px] font-semibold text-foreground truncate">{n.title}</p>
                              {readPendingIds.has(n.id) && (
                                <span className="text-[10px] text-muted-foreground/88">...</span>
                              )}
                              {!n.read && (
                                <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground/90 line-clamp-2 mt-0.5">{n.body}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px] font-mono text-muted-foreground/90">{n.type}</span>
                              <span className="text-[10px] text-muted-foreground/85">·</span>
                              <span className="text-[10px] text-muted-foreground/90">{formatRelative(n.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
