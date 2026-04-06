"use client"

import { useState, useEffect, Suspense } from "react"
import type React from "react"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Gear,
  Users,
  Microphone,
  User,
  PlugsConnected,
  Storefront,
  Robot,
  TextAa,
  Brain,
  Books,
  CaretDown,
  ClipboardText,
  FileText,
} from "@phosphor-icons/react"
import { AilumLoader } from "@/components/ui/ailum-loader"

import { GeralTab }            from "@/components/settings/geral-tab"
import { PerfilTab }           from "@/components/settings/perfil-tab"
import { ConexoesTab } from "@/components/settings/conexoes-tab"
import { ServicosTab } from "@/components/settings/servicos-tab"
import { MembersTab }        from "@/components/settings/members-tab"
import { VozTab }            from "@/components/settings/voz-tab"
import { DisponibilidadeTab } from "@/components/settings/disponibilidade-tab"
import { IATab } from "@/components/settings/ia-tab"
import { TemplatesTab } from "@/components/settings/templates-tab"
import { CaptacaoTab } from "@/components/settings/captacao-tab"
import { KnowledgeTab } from "@/components/settings/knowledge-tab"
import { FichasTab } from "@/components/settings/fichas-tab"
import { DocumentosTab } from "@/components/settings/documentos-tab"

const ease = [0.33, 1, 0.68, 1] as const

type TabId = "geral" | "perfil" | "conexoes" | "servicos" | "membros" | "meus-servicos" | "templates" | "fichas" | "documentos" | "ia" | "knowledge" | "captacao" | "voz"

type TabDef = { id: TabId; label: string; icon: React.ElementType }
type TabGroup = { label: string; tabs: TabDef[] }

const TAB_GROUPS: TabGroup[] = [
  {
    label: "Conta",
    tabs: [
      { id: "geral",   label: "Geral",      icon: Gear },
      { id: "perfil",  label: "Meu Perfil", icon: User },
      { id: "membros", label: "Membros",    icon: Users },
    ],
  },
  {
    label: "Clínica",
    tabs: [
      { id: "servicos",      label: "Serviços",      icon: Storefront },
      { id: "meus-servicos", label: "Meus Serviços", icon: Storefront },
      { id: "fichas",        label: "Fichas",         icon: ClipboardText },
      { id: "documentos",    label: "Documentos",     icon: FileText },
    ],
  },
  {
    label: "Comunicação",
    tabs: [
      { id: "conexoes",  label: "Conexões", icon: PlugsConnected },
      { id: "templates", label: "Templates", icon: TextAa },
    ],
  },
  {
    label: "Inteligência Artificial",
    tabs: [
      { id: "ia",        label: "IA",            icon: Robot },
      { id: "knowledge", label: "Conhecimento",  icon: Books },
      { id: "captacao",  label: "Captação",       icon: Brain },
      { id: "voz",       label: "Voz",            icon: Microphone },
    ],
  },
]

const ALL_TABS = TAB_GROUPS.flatMap((g) => g.tabs)
const VALID_TABS = ALL_TABS.map((t) => t.id)

// ─── Mobile tab dropdown ─────────────────────────────────────────────────────

function MobileTabSelector({ activeTab, onSelect }: { activeTab: TabId; onSelect: (id: TabId) => void }) {
  const [open, setOpen] = useState(false)
  const active = ALL_TABS.find((t) => t.id === activeTab)!
  const ActiveIcon = active.icon

  return (
    <div className="relative md:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="cursor-pointer flex items-center gap-2.5 w-full px-4 py-3 border-b border-border/50 text-left"
      >
        <ActiveIcon className="h-4 w-4 text-accent shrink-0" weight="fill" />
        <span className="text-[13px] font-semibold text-foreground flex-1">{active.label}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <CaretDown className="h-3.5 w-3.5 text-muted-foreground" weight="bold" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute left-2 right-2 top-full z-50 rounded-xl border border-border/60 bg-popover shadow-xl shadow-foreground/8 overflow-hidden py-1"
            >
              {TAB_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="px-3.5 pt-2.5 pb-1 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">
                    {group.label}
                  </p>
                  {group.tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = tab.id === activeTab
                    return (
                      <button
                        key={tab.id}
                        onClick={() => { onSelect(tab.id); setOpen(false) }}
                        className={`cursor-pointer w-full flex items-center gap-2.5 px-3.5 py-2 text-left transition-colors ${
                          isActive ? "bg-accent/10 text-accent" : "text-foreground/80 hover:bg-muted/30"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" weight={isActive ? "fill" : "regular"} />
                        <span className="text-[12px] font-medium">{tab.label}</span>
                      </button>
                    )
                  })}
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Sidebar collapsible group ───────────────────────────────────────────────

function SidebarGroup({
  group,
  activeTab,
  onSelect,
}: {
  group: TabGroup
  activeTab: TabId
  onSelect: (id: TabId) => void
}) {
  const hasActive = group.tabs.some((t) => t.id === activeTab)
  const [open, setOpen] = useState(hasActive)

  // auto-open when the active tab moves into this group
  useEffect(() => {
    if (hasActive) setOpen(true)
  }, [hasActive])

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="cursor-pointer flex items-center gap-1.5 w-full px-3 py-2 text-left group"
      >
        <motion.div animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.15 }}>
          <CaretDown className="h-3 w-3 text-muted-foreground/50 group-hover:text-muted-foreground/80 transition-colors" weight="bold" />
        </motion.div>
        <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
          hasActive ? "text-accent/70" : "text-muted-foreground/50 group-hover:text-muted-foreground/70"
        }`}>
          {group.label}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease }}
            className="overflow-hidden"
          >
            {group.tabs.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelect(tab.id)}
                  className={`cursor-pointer relative flex items-center gap-2.5 rounded-lg px-3 py-2 ml-2 text-[12px] font-medium transition-all duration-150 w-[calc(100%-0.5rem)] text-left ${
                    active
                      ? "bg-accent/10 text-accent"
                      : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/30"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="settings-sidebar-indicator"
                      className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-accent"
                      transition={{ duration: 0.2, ease }}
                    />
                  )}
                  <Icon className="h-4 w-4 shrink-0" weight={active ? "fill" : "regular"} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Settings Content ────────────────────────────────────────────────────────

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
    <div className="flex h-full min-h-0">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col shrink-0 w-52 border-r border-border/50 overflow-y-auto py-3 px-2">
        {TAB_GROUPS.map((group) => (
          <SidebarGroup
            key={group.label}
            group={group}
            activeTab={activeTab}
            onSelect={setActiveTab}
          />
        ))}
      </aside>

      {/* ── Mobile dropdown ── */}
      <div className="md:hidden flex flex-col flex-1 min-h-0">
        <MobileTabSelector activeTab={activeTab} onSelect={setActiveTab} />
        <div className="flex-1 overflow-y-auto px-4 py-5">
          <AnimatePresence mode="wait">
            {activeTab === "geral"           && <GeralTab           key="geral"           />}
            {activeTab === "perfil"          && <PerfilTab          key="perfil"          />}
            {activeTab === "conexoes"        && <ConexoesTab        key="conexoes"        />}
            {activeTab === "servicos"        && <ServicosTab        key="servicos"        />}
            {activeTab === "membros"         && <MembersTab         key="membros"         />}
            {activeTab === "meus-servicos"   && <DisponibilidadeTab key="meus-servicos"   />}
            {activeTab === "templates"       && <TemplatesTab       key="templates"       />}
            {activeTab === "fichas"          && <FichasTab          key="fichas"          />}
            {activeTab === "documentos"      && <DocumentosTab      key="documentos"      />}
            {activeTab === "ia"              && <IATab              key="ia"              />}
            {activeTab === "knowledge"       && <KnowledgeTab       key="knowledge"       />}
            {activeTab === "captacao"        && <CaptacaoTab        key="captacao"        />}
            {activeTab === "voz"             && <VozTab             key="voz"             />}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Desktop content ── */}
      <div className="hidden md:flex flex-1 flex-col min-h-0">
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="w-full max-w-4xl mx-auto lg:max-w-5xl xl:max-w-6xl">
            <AnimatePresence mode="wait">
              {activeTab === "geral"           && <GeralTab           key="geral"           />}
              {activeTab === "perfil"          && <PerfilTab          key="perfil"          />}
              {activeTab === "conexoes"        && <ConexoesTab        key="conexoes"        />}
              {activeTab === "servicos"        && <ServicosTab        key="servicos"        />}
              {activeTab === "membros"         && <MembersTab         key="membros"         />}
              {activeTab === "meus-servicos"   && <DisponibilidadeTab key="meus-servicos"   />}
              {activeTab === "templates"       && <TemplatesTab       key="templates"       />}
              {activeTab === "fichas"          && <FichasTab          key="fichas"          />}
              {activeTab === "documentos"      && <DocumentosTab      key="documentos"      />}
              {activeTab === "ia"              && <IATab              key="ia"              />}
              {activeTab === "knowledge"       && <KnowledgeTab       key="knowledge"       />}
              {activeTab === "captacao"        && <CaptacaoTab        key="captacao"        />}
              {activeTab === "voz"             && <VozTab             key="voz"             />}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<AilumLoader variant="section" />}>
      <SettingsContent />
    </Suspense>
  )
}
