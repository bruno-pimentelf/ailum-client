"use client"

import { useState } from "react"
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
  VideoCamera,
  User,
  Phone,
  Robot,
} from "@phosphor-icons/react"

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

const navigation: NavEntry[] = [
  {
    type: "group",
    label: "Atendimento",
    icon: ChatCircleText,
    children: [
      { label: "Conversas", href: "/chats", icon: ChatCircleText },
      { label: "Fluxos", href: "/boards", icon: Kanban },
      { label: "Contatos", href: "/contacts", icon: AddressBook },
      { label: "Playground", href: "/playground", icon: Robot },
    ],
  },
  { label: "Calendário", href: "/calendar", icon: CalendarBlank },
  { label: "Configurações", href: "/settings", icon: Gear },
]

function isGroup(entry: NavEntry): entry is NavGroup & { type: "group" } {
  return "type" in entry && entry.type === "group"
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

// ─── Live promo card ─────────────────────────────────────────────────────────

function LivePromoCard({ collapsed }: { collapsed: boolean }) {
  return (
    <AnimatePresence>
      {!collapsed && (
        <motion.a
          href="#"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="block shrink-0 mx-2 mb-2 p-3 rounded-xl border border-accent/20 bg-gradient-to-br from-accent/10 to-accent/5 cursor-pointer group overflow-hidden"
        >
          <div className="flex items-center gap-2 mb-1">
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/20"
            >
              <VideoCamera className="h-3 w-3 text-accent" weight="fill" />
            </motion.div>
            <span className="text-[10px] font-bold text-accent uppercase tracking-wider">Live toda semana</span>
          </div>
          <p className="text-[11px] font-bold text-white/95 leading-tight">Próxima live no Zoom</p>
        </motion.a>
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

export function AppSidebar({
  collapsed,
  onToggle,
  accountManagerName,
  accountManagerPhone,
}: SidebarProps) {
  const pathname = usePathname()
  const [openGroups, setOpenGroups] = useState<string[]>(["Atendimento"])

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

      {/* Gerente de Conta */}
      <AccountManagerCard
        collapsed={collapsed}
        name={accountManagerName}
        phone={accountManagerPhone}
      />

      {/* Live promo card */}
      <LivePromoCard collapsed={collapsed} />

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
