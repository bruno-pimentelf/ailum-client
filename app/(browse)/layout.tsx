"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { AppSidebar } from "@/components/app/sidebar"
import { AppHeader } from "@/components/app/header"

const ease = [0.33, 1, 0.68, 1] as const

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      {/* Full-width header */}
      <AppHeader />

      {/* Below header: sidebar + content */}
      <div className="flex flex-1 overflow-hidden pt-14">
        <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />

        <motion.main
          className="flex-1 overflow-y-auto"
          animate={{ marginLeft: 0 }}
          transition={{ duration: 0.35, ease }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  )
}
