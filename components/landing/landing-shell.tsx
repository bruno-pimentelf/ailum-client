"use client"

import { useEffect, useState, type ReactNode } from "react"
import { MotionConfig } from "framer-motion"

export function LandingShell({ children }: { children: ReactNode }) {
  const [isMobile, setIsMobile] = useState(false)

  // Force dark theme on landing page — runs before ThemeProvider can override
  useEffect(() => {
    const root = document.documentElement
    const prev = root.classList.contains("dark")
    root.classList.add("dark")
    // Re-apply on any mutation (ThemeProvider may remove it)
    const observer = new MutationObserver(() => {
      if (!root.classList.contains("dark")) root.classList.add("dark")
    })
    observer.observe(root, { attributes: true, attributeFilter: ["class"] })
    return () => {
      observer.disconnect()
      if (!prev) root.classList.remove("dark")
    }
  }, [])

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const onChange = () => setIsMobile(mq.matches)
    onChange()
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  return (
    <MotionConfig reducedMotion={isMobile ? "always" : "never"}>
      <div className={isMobile ? "landing-lite" : ""}>{children}</div>
    </MotionConfig>
  )
}

