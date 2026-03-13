"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CalendarBlank, CaretDown } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export type DateRangePreset = "7d" | "30d" | "90d"

export interface DateRange {
  from: string
  to: string
}

function getPresetRange(preset: DateRangePreset): DateRange {
  const to = new Date()
  const from = new Date()
  switch (preset) {
    case "7d":
      from.setDate(from.getDate() - 7)
      break
    case "30d":
      from.setDate(from.getDate() - 30)
      break
    case "90d":
      from.setDate(from.getDate() - 90)
      break
  }
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  }
}

function formatDisplay(range: DateRange) {
  const from = new Date(range.from).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  })
  const to = new Date(range.to).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  })
  return `${from} – ${to}`
}

const presets: { id: DateRangePreset; label: string }[] = [
  { id: "7d", label: "Últimos 7 dias" },
  { id: "30d", label: "Últimos 30 dias" },
  { id: "90d", label: "Últimos 90 dias" },
]

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
  className?: string
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const [preset, setPreset] = useState<DateRangePreset>("30d")

  const handleSelect = (p: DateRangePreset) => {
    setPreset(p)
    onChange(getPresetRange(p))
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "cursor-pointer gap-2 rounded-xl font-normal text-muted-foreground hover:text-foreground border-border/60",
            className
          )}
        >
          <CalendarBlank className="h-3.5 w-3.5" weight="duotone" />
          <span>{formatDisplay(value)}</span>
          <CaretDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {presets.map((p) => (
          <DropdownMenuItem
            key={p.id}
            onClick={() => handleSelect(p.id)}
            className={cn(preset === p.id && "bg-accent/10 text-accent")}
          >
            {p.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { getPresetRange }
