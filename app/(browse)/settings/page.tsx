"use client"

import { useState, useEffect, Suspense } from "react"
import type React from "react"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Gear,
  Buildings,
  Users,
  Microphone,
  User,
  PlugsConnected,
  Storefront,
} from "@phosphor-icons/react"

import { GeralTab }    from "@/components/settings/geral-tab"
import { PerfilTab }   from "@/components/settings/perfil-tab"
import { ConexoesTab } from "@/components/settings/conexoes-tab"
import { ServicosTab } from "@/components/settings/servicos-tab"
import { MembersTab }  from "@/components/settings/members-tab"
import { VozTab }      from "@/components/settings/voz-tab"

const ease = [0.33, 1, 0.68, 1] as const

type TabId = "geral" | "perfil" | "conexoes" | "servicos" | "membros" | "voz"

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "geral",    label: "Geral",      icon: Gear          },
  { id: "perfil",   label: "Meu Perfil", icon: User          },
  { id: "conexoes", label: "Conexões",   icon: PlugsConnected },
  { id: "servicos", label: "Serviços",   icon: Storefront    },
  { id: "membros",  label: "Membros",    icon: Users         },
  { id: "voz",      label: "Voz",        icon: Microphone    },
]

const VALID_TABS = TABS.map((t) => t.id)

function SettingsContent() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab") as TabId | null
  const [activeTab, setActiveTab] = useState<TabId>(() =>
    tabParam && VALID_TABS.includes(tabParam as TabId) ? (tabParam as TabId) : "geral"
  )

  useEffect(() => {
    if (tabParam && VALID_TABS.includes(tabParam as TabId)) {
      setActiveTab(tabParam as TabId)
    }
  }, [tabParam])

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Tab bar */}
      <div className="flex items-stretch justify-center border-b border-border/50 shrink-0 h-11">
        <div className="flex items-stretch gap-0 px-6 overflow-x-auto scrollbar-none w-full max-w-6xl">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative shrink-0 flex items-center gap-2 px-4 h-full text-[12px] font-bold transition-colors duration-150 cursor-pointer ${
                  active ? "text-white/90" : "text-white/25 hover:text-white/60"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="settings-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-accent"
                    transition={{ duration: 0.22, ease }}
                  />
                )}
                <Icon className="h-3.5 w-3.5 shrink-0" weight={active ? "fill" : "regular"} />
                <span className="relative">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="w-full max-w-4xl mx-auto lg:max-w-5xl xl:max-w-6xl">
          <AnimatePresence mode="wait">
            {activeTab === "geral"    && <GeralTab    key="geral"    />}
            {activeTab === "perfil"   && <PerfilTab   key="perfil"   />}
            {activeTab === "conexoes" && <ConexoesTab key="conexoes" />}
            {activeTab === "servicos" && <ServicosTab key="servicos" />}
            {activeTab === "membros"  && <MembersTab  key="membros"  />}
            {activeTab === "voz"      && <VozTab      key="voz"      />}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col h-full min-h-0">
        <div className="h-11 border-b border-border/50" />
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  )
}
