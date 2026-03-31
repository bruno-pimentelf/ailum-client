"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChatCircleText,
  AddressBook,
  Kanban,
  Gear,
  CaretDown,
  ArrowLineLeft,
  ArrowLineRight,
  CalendarBlank,
  User,
  Phone,
  TestTube,
  ChartLineUp,
  CurrencyCircleDollar,
  WhatsappLogo,
  Globe,
  CaretUpDown,
  Check,
  ShieldCheck,
} from "@phosphor-icons/react"
import { useIntegrations } from "@/hooks/use-integrations"
import { useInstanceStore } from "@/lib/instance-store"
import { useMe } from "@/hooks/use-me"

const ease = [0.33, 1, 0.68, 1] as const

type NavItem = {
  label: string
  href: string
  icon: React.ElementType
}

type NavGroup = {
  label: string
  icon: React.ElementType
  children: NavItem[]
}

type NavEntry = NavItem | (NavGroup & { type: "group" })

const baseNavigation: NavEntry[] = [
  { label: "Dashboard", href: "/dashboard", icon: ChartLineUp },
  {
    type: "group",
    label: "Atendimento",
    icon: ChatCircleText,
    children: [
      { label: "Conversas", href: "/chats", icon: ChatCircleText },
      { label: "Fluxos", href: "/boards", icon: Kanban },
      { label: "Contatos", href: "/contacts", icon: AddressBook },
    ],
  },
  { label: "Calendário", href: "/calendar", icon: CalendarBlank },
  { label: "Financeiro", href: "/financeiro", icon: CurrencyCircleDollar },
  { label: "Configurações", href: "/settings", icon: Gear },
]

function isGroup(entry: NavEntry): entry is NavGroup & { type: "group" } {
  return "type" in entry && entry.type === "group"
}

// ─── Instance selector ───────────────────────────────────────────────────────

function InstanceSelector({ collapsed }: { collapsed: boolean }) {
  const { data: integrations } = useIntegrations()
  const { selectedInstanceId, setSelectedInstanceId } = useInstanceStore()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const zapiInstances = (integrations ?? []).filter(
    (i) => i.provider === "zapi" && i.instanceId && i.isActive,
  )

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  if (zapiInstances.length <= 1) return null

  const selected = zapiInstances.find((i) => i.instanceId === selectedInstanceId)
  const label = selected?.label || selected?.instanceId?.slice(0, 8) || "Todas"

  return (
    <AnimatePresence>
      {!collapsed && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 mx-2 mb-1.5 relative"
          ref={dropdownRef}
        >
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex h-8 w-full items-center gap-2 rounded-lg border border-border bg-card/50 px-2.5 text-[12px] text-foreground hover:bg-muted/40 transition-colors duration-200 cursor-pointer"
          >
            {selectedInstanceId ? (
              <WhatsappLogo className="h-3.5 w-3.5 shrink-0 text-accent" weight="fill" />
            ) : (
              <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" weight="regular" />
            )}
            <span className="flex-1 text-left truncate font-medium">{label}</span>
            <CaretUpDown className="h-3 w-3 text-muted-foreground shrink-0" />
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.97 }}
                transition={{ duration: 0.2, ease }}
                className="absolute left-0 bottom-full mb-2 w-full rounded-xl border border-border bg-popover shadow-xl shadow-foreground/8 overflow-hidden z-50"
              >
                <div className="p-1.5">
                  <p className="px-2 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/85">
                    Instância
                  </p>
                  <button
                    onClick={() => { setSelectedInstanceId(null); setOpen(false) }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] transition-colors duration-150 ${
                      !selectedInstanceId
                        ? "bg-accent/10 text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    <Globe className={`h-3.5 w-3.5 shrink-0 ${!selectedInstanceId ? "text-accent" : ""}`} weight="regular" />
                    <span className="flex-1 text-left truncate">Todas</span>
                    {!selectedInstanceId && <Check className="h-3.5 w-3.5 text-accent shrink-0" weight="bold" />}
                  </button>
                  {zapiInstances.map((inst) => {
                    const active = inst.instanceId === selectedInstanceId
                    return (
                      <button
                        key={inst.instanceId}
                        onClick={() => { setSelectedInstanceId(inst.instanceId!); setOpen(false) }}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] transition-colors duration-150 ${
                          active
                            ? "bg-accent/10 text-foreground font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        }`}
                      >
                        <WhatsappLogo className={`h-3.5 w-3.5 shrink-0 ${active ? "text-accent" : ""}`} weight={active ? "fill" : "regular"} />
                        <span className="flex-1 text-left truncate">{inst.label || inst.instanceId?.slice(0, 12)}</span>
                        {active && <Check className="h-3.5 w-3.5 text-accent shrink-0" weight="bold" />}
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
      {collapsed && zapiInstances.length > 1 && (
        <div className="shrink-0 flex justify-center mb-1.5">
          <div
            onClick={() => setOpen((v) => !v)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
            title={`Instância: ${label}`}
          >
            {selectedInstanceId ? (
              <WhatsappLogo className="h-3.5 w-3.5 text-accent" weight="fill" />
            ) : (
              <Globe className="h-3.5 w-3.5" weight="regular" />
            )}
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ─── Gerente de Conta ────────────────────────────────────────────────────────

function AccountManagerCard({
  collapsed,
  name,
  phone,
}: {
  collapsed: boolean
  name?: string
  phone?: string
}) {
  const displayName = name ?? "—"
  const displayPhone = phone ?? "—"

  return (
    <AnimatePresence>
      {!collapsed && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 mx-2 mb-2 p-3 rounded-xl border border-border/60 bg-muted/30"
        >
          <div className="flex items-center gap-2 mb-2">
            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" weight="fill" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Gerente de Conta
            </span>
          </div>
          <p className="text-[12px] font-medium text-foreground truncate" title={displayName}>
            {displayName}
          </p>
          <a
            href={phone ? `tel:${phone.replace(/\D/g, "")}` : undefined}
            className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground hover:text-accent transition-colors"
          >
            <Phone className="h-3 w-3 shrink-0" weight="regular" />
            {displayPhone}
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  )
}


interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  accountManagerName?: string
  accountManagerPhone?: string
}

function getNavigation(isSuperAdmin?: boolean): NavEntry[] {
  const nav = structuredClone(baseNavigation) as NavEntry[]
  if (isSuperAdmin) {
    // Add Playground to Atendimento group
    const atendimento = nav.find((e) => isGroup(e) && e.label === "Atendimento") as (NavGroup & { type: "group" }) | undefined
    if (atendimento) {
      atendimento.children.push({ label: "Playground", href: "/playground", icon: TestTube })
    }
    // Insert "Admin" before "Configurações" (last item)
    const settingsIdx = nav.findIndex(
      (e) => !isGroup(e) && (e as NavItem).href === "/settings"
    )
    const adminItem: NavItem = {
      label: "Admin",
      href: "/admin",
      icon: ShieldCheck,
    }
    if (settingsIdx >= 0) {
      nav.splice(settingsIdx, 0, adminItem)
    } else {
      nav.push(adminItem)
    }
  }
  return nav
}

export function AppSidebar({
  collapsed,
  onToggle,
  accountManagerName,
  accountManagerPhone,
}: SidebarProps) {
  const pathname = usePathname()
  const [openGroups, setOpenGroups] = useState<string[]>(["Atendimento"])
  const { data: me } = useMe()

  const navigation = getNavigation(me?.isSuperAdmin)

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    )
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

  return (
    <motion.aside
      animate={{ width: collapsed ? 52 : 204 }}
      transition={{ duration: 0.35, ease }}
      className="relative flex h-full flex-col border-r border-border bg-background/95 backdrop-blur-xl overflow-hidden shrink-0"
    >
      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 scrollbar-none">
        <ul className="flex flex-col gap-0.5">
          {navigation.map((entry) => {
            if (isGroup(entry)) {
              const open = openGroups.includes(entry.label)
              const Icon = entry.icon
              const anyActive = entry.children.some((c) => isActive(c.href))

              return (
                <li key={entry.label}>
                  <button
                    onClick={() => !collapsed && toggleGroup(entry.label)}
                    className={`group flex w-full min-w-0 items-center rounded-lg pl-0 pr-2 py-2 text-left transition-colors duration-200 cursor-pointer ${
                      anyActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex h-4 w-9 shrink-0 items-center justify-center">
                      <Icon
                        className={`h-4 w-4 transition-colors duration-200 ${anyActive ? "text-accent" : ""}`}
                        weight={anyActive ? "fill" : "regular"}
                      />
                    </div>
                    <motion.div
                      animate={{ width: collapsed ? 0 : "auto", opacity: collapsed ? 0 : 1 }}
                      transition={{ duration: 0.35, ease }}
                      className="flex min-w-0 flex-1 items-center justify-between gap-2 overflow-hidden"
                    >
                      <span className="truncate text-[13px] font-medium">{entry.label}</span>
                      <CaretDown
                        className={`h-3 w-3 shrink-0 transition-transform duration-300 ${open ? "rotate-0" : "-rotate-90"}`}
                      />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {open && !collapsed && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease }}
                        className="overflow-hidden"
                      >
                        {entry.children.map((child) => {
                          const ChildIcon = child.icon
                          const active = isActive(child.href)
                          return (
                            <li key={child.href}>
                            <Link
                              href={child.href}
                              className={`flex items-center gap-2.5 rounded-lg py-1.5 pl-9 pr-2.5 text-[13px] transition-colors duration-200 ${
                                active
                                  ? "bg-accent/10 text-foreground font-medium"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                              }`}
                            >
                              <ChildIcon
                                className={`h-3.5 w-3.5 shrink-0 ${active ? "text-accent" : ""}`}
                                weight={active ? "fill" : "regular"}
                              />
                              {child.label}
                            </Link>
                            </li>
                          )
                        })}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </li>
              )
            }

            // Flat item
            const Icon = entry.icon
            const active = isActive(entry.href)
            return (
              <li key={entry.href}>
                <Link
                  href={entry.href}
                  className={`group flex min-w-0 items-center rounded-lg pl-0 pr-2 py-2 transition-colors duration-200 ${
                    active
                      ? "bg-accent/10 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  <div className="flex h-4 w-9 shrink-0 items-center justify-center">
                    <Icon
                      className={`h-4 w-4 transition-colors duration-200 ${active ? "text-accent" : ""}`}
                      weight={active ? "fill" : "regular"}
                    />
                  </div>
                  <motion.span
                    animate={{ width: collapsed ? 0 : "auto", opacity: collapsed ? 0 : 1 }}
                    transition={{ duration: 0.35, ease }}
                    className="block min-w-0 flex-1 truncate overflow-hidden text-[13px] font-medium"
                  >
                    {entry.label}
                  </motion.span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Instance selector */}
      <InstanceSelector collapsed={collapsed} />

      {/* Gerente de Conta */}
      <AccountManagerCard
        collapsed={collapsed}
        name={accountManagerName}
        phone={accountManagerPhone}
      />

      {/* Collapse toggle */}
      <div className="shrink-0 border-t border-border p-2">
        <button
          onClick={onToggle}
          className="flex w-full min-w-0 items-center rounded-lg pl-0 pr-2 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors duration-200"
        >
          <div className="flex h-4 w-9 shrink-0 items-center justify-center">
            {collapsed ? (
              <ArrowLineRight className="h-4 w-4" />
            ) : (
              <ArrowLineLeft className="h-4 w-4" />
            )}
          </div>
          <motion.span
            animate={{ width: collapsed ? 0 : "auto", opacity: collapsed ? 0 : 1 }}
            transition={{ duration: 0.35, ease }}
            className="block min-w-0 flex-1 truncate overflow-hidden text-[13px] font-medium"
          >
            Colapsar
          </motion.span>
        </button>
      </div>
    </motion.aside>
  )
}
