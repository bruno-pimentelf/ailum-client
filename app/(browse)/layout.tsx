"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AppSidebar } from "@/components/app/sidebar"
import { AppHeader } from "@/components/app/header"
import { useFunnelStore } from "@/lib/funnel-store"
import dynamic from "next/dynamic"

const FunnelBuilderOverlay = dynamic(
  () => import("@/components/funnel/FunnelBuilderOverlay"),
  { ssr: false }
)

const ease = [0.33, 1, 0.68, 1] as const

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const isBuilderOpen = useFunnelStore((s) => s.isBuilderOpen)

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      {/* Full-width header */}
      <AppHeader />

      {/* Below header: sidebar + content */}
      <div className="flex flex-1 overflow-hidden pt-14">
        <div className="hidden md:flex">
          <AppSidebar
            collapsed={collapsed}
            onToggle={() => setCollapsed((v) => !v)}
            accountManagerName="Maria Silva"
            accountManagerPhone="(11) 98765-4321"
          />
        </div>

        <motion.main
          className="flex-1 overflow-y-auto"
          animate={{ marginLeft: 0 }}
          transition={{ duration: 0.35, ease }}
        >
          {children}
        </motion.main>
      </div>

      {/* Funnel builder — full-screen overlay */}
      <AnimatePresence>
        {isBuilderOpen && <FunnelBuilderOverlay />}
      </AnimatePresence>
    </div>
  )
}
