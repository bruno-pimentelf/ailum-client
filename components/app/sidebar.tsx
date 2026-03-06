"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  SquaresFour,
  WhatsappLogo,
  PlugsConnected,
  ChatCircleText,
  AddressBook,
  Kanban,
  GitBranch,
  Users,
  Microphone,
  Gear,
  CaretDown,
  ArrowLineLeft,
  ArrowLineRight,
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
  { label: "Dashboard", href: "/dashboard", icon: SquaresFour },
  {
    type: "group",
    label: "Conexões",
    icon: PlugsConnected,
    children: [
      { label: "WhatsApp", href: "/whatsapp", icon: WhatsappLogo },
      { label: "Integrações", href: "/integrations", icon: PlugsConnected },
    ],
  },
  {
    type: "group",
    label: "Atendimento",
    icon: ChatCircleText,
    children: [
      { label: "Conversas", href: "/chats", icon: ChatCircleText },
      { label: "Contatos", href: "/contacts", icon: AddressBook },
      { label: "Painéis", href: "/boards", icon: Kanban },
    ],
  },
  { label: "Fluxos", href: "/flows", icon: GitBranch },
  { label: "Membros", href: "/members", icon: Users },
  { label: "Voz", href: "/voice", icon: Microphone },
  { label: "Configurações", href: "/settings", icon: Gear },
]

function isGroup(entry: NavEntry): entry is NavGroup & { type: "group" } {
  return "type" in entry && entry.type === "group"
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function AppSidebar({ collapsed, onToggle }: SidebarProps) {
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
                    className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors duration-200 ${
                      anyActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors duration-200 ${anyActive ? "text-accent" : ""}`}
                      weight={anyActive ? "fill" : "regular"}
                    />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex-1 text-[13px] font-medium whitespace-nowrap"
                        >
                          {entry.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <CaretDown
                            className={`h-3 w-3 shrink-0 transition-transform duration-300 ${open ? "rotate-0" : "-rotate-90"}`}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                  className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors duration-200 ${
                    active
                      ? "bg-accent/10 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors duration-200 ${active ? "text-accent" : ""}`}
                    weight={active ? "fill" : "regular"}
                  />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-[13px] font-medium whitespace-nowrap"
                      >
                        {entry.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div className="shrink-0 border-t border-border p-2">
        <button
          onClick={onToggle}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors duration-200"
        >
          {collapsed ? (
            <ArrowLineRight className="h-4 w-4 shrink-0" />
          ) : (
            <ArrowLineLeft className="h-4 w-4 shrink-0" />
          )}
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-[13px] font-medium whitespace-nowrap"
              >
                Colapsar
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  )
}
