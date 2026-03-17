"use client"

import { useEffect, useState, type ReactNode } from "react"
import { MotionConfig } from "framer-motion"

export function LandingShell({ children }: { children: ReactNode }) {
  const [isMobile, setIsMobile] = useState(false)

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

