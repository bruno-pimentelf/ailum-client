"use client"

import { motion } from "framer-motion"

interface AilumLoaderProps {
  /** "page" = full-screen with glow background, "section" = inline centered */
  variant?: "page" | "section"
  className?: string
}

export function AilumLoader({ variant = "section", className }: AilumLoaderProps) {
  const content = (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      className="relative z-10 text-[15px] font-bold tracking-[0.4em] text-foreground select-none"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      A I L U M
    </motion.span>
  )

  if (variant === "page") {
    return (
      <div className={`relative min-h-screen bg-background flex items-center justify-center overflow-hidden ${className ?? ""}`}>
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[40rem] w-[40rem] pointer-events-none"
          animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute inset-0 rounded-full bg-accent/6 blur-[120px]" />
          <div className="absolute inset-[25%] rounded-full bg-cyan-400/4 blur-[60px]" />
        </motion.div>
        {content}
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-center py-20 ${className ?? ""}`}>
      {content}
    </div>
  )
}
