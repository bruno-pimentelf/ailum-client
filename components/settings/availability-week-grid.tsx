"use client"

import { useMemo, useCallback } from "react"
import { motion } from "framer-motion"

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const HOURS = Array.from({ length: 13 }, (_, i) => i + 7) // 7–19

export type Slot = { dayOfWeek: number; startTime: string; endTime: string; slotDurationMin?: number }

/** Converte slots em Set de chaves "day-hour" */
function slotsToGrid(slots: Slot[]): Set<string> {
  const grid = new Set<string>()
  for (const s of slots) {
    const [sh] = s.startTime.split(":").map(Number)
    const [eh] = s.endTime.split(":").map(Number)
    for (let h = sh; h < eh; h++) {
      grid.add(`${s.dayOfWeek}-${h}`)
    }
  }
  return grid
}

/** Converte Set de chaves em slots (merge de horas contíguas por dia) */
function gridToSlots(grid: Set<string>, slotDurationMin: number = 30): Slot[] {
  const slots: Slot[] = []
  for (let d = 0; d < 7; d++) {
    const hours: number[] = []
    for (const h of HOURS) {
      if (grid.has(`${d}-${h}`)) hours.push(h)
    }
    let i = 0
    while (i < hours.length) {
      const start = hours[i]
      let end = start
      while (i + 1 < hours.length && hours[i + 1] === end + 1) {
        end = hours[++i]
      }
      i++
      slots.push({
        dayOfWeek: d,
        startTime: `${String(start).padStart(2, "0")}:00`,
        endTime: `${String(end + 1).padStart(2, "0")}:00`,
        slotDurationMin,
      })
    }
  }
  return slots
}

/** Preset: preenche dias startDay..endDay (0-6), horas startH..endH-1 */
function quickFill(
  startDay: number,
  endDay: number,
  startH: number,
  endH: number,
  slotDurationMin: number
): Slot[] {
  const grid = new Set<string>()
  for (let d = startDay; d <= endDay; d++) {
    for (let h = startH; h < endH; h++) {
      if (h >= 7 && h < 20) grid.add(`${d}-${h}`)
    }
  }
  return gridToSlots(grid, slotDurationMin)
}

const SLOT_DURATION_OPTIONS = [15, 30, 45, 50, 60] as const

interface AvailabilityWeekGridProps {
  slots: Slot[]
  onChange: (slots: Slot[]) => void
  disabled?: boolean
  accentColor?: string
}

export function AvailabilityWeekGrid({
  slots,
  onChange,
  disabled,
  accentColor = "#22c55e",
}: AvailabilityWeekGridProps) {
  const grid = useMemo(() => slotsToGrid(slots), [slots])
  const slotDurationMin = slots[0]?.slotDurationMin ?? 30

  const toggle = useCallback(
    (day: number, hour: number) => {
      if (disabled) return
      const key = `${day}-${hour}`
      const next = new Set(grid)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      onChange(gridToSlots(next, slotDurationMin))
    },
    [grid, onChange, disabled, slotDurationMin]
  )

  const handleQuickFill = useCallback(
    (preset: "seg-sex" | "sab" | "seg-sab") => {
      if (disabled) return
      const fill =
        preset === "seg-sex"
          ? quickFill(1, 5, 9, 18, slotDurationMin)
          : preset === "sab"
            ? quickFill(6, 6, 9, 13, slotDurationMin)
            : quickFill(1, 6, 9, 18, slotDurationMin)
      onChange(fill)
    },
    [onChange, disabled, slotDurationMin]
  )

  const handleSlotDurationChange = useCallback(
    (dur: number) => {
      if (disabled) return
      onChange(
        slots.map((s) => ({ ...s, slotDurationMin: dur }))
      )
    },
    [slots, onChange, disabled]
  )

  return (
    <div className="rounded-xl border border-border/50 bg-background/30 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-8 border-b border-border/40">
        <div className="w-12" />
        {WEEKDAYS.map((d, i) => (
          <div
            key={i}
            className="py-2 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        {HOURS.map((hour) => (
          <motion.div
            key={hour}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-8 border-b border-border/30 last:border-b-0"
          >
            <div className="w-12 shrink-0 flex items-center justify-end pr-2 py-1">
              <span className="text-[10px] font-semibold text-muted-foreground/85 tabular-nums">
                {String(hour).padStart(2, "0")}:00
              </span>
            </div>
            {WEEKDAYS.map((_, day) => {
              const key = `${day}-${hour}`
              const active = grid.has(key)
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggle(day, hour)}
                  disabled={disabled}
                  className={`
                    relative min-h-[28px] mx-0.5 my-0.5 rounded-md transition-all duration-200
                    ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
                    ${active ? "ring-1 ring-inset" : "hover:bg-foreground/[0.04]"}
                  `}
                  style={
                    active
                      ? {
                          backgroundColor: `${accentColor}25`,
                          borderColor: `${accentColor}50`,
                        }
                      : undefined
                  }
                />
              )
            })}
          </motion.div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-border/30">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground/90">Preencher rápido:</span>
          {!disabled && (
            <>
              <button
                type="button"
                onClick={() => handleQuickFill("seg-sex")}
                className="text-[11px] font-medium text-accent hover:text-accent/80 px-2 py-1 rounded-md hover:bg-accent/10 transition-colors"
              >
                Seg–Sex 9–18h
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("sab")}
                className="text-[11px] font-medium text-accent hover:text-accent/80 px-2 py-1 rounded-md hover:bg-accent/10 transition-colors"
              >
                Sáb 9–13h
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("seg-sab")}
                className="text-[11px] font-medium text-accent hover:text-accent/80 px-2 py-1 rounded-md hover:bg-accent/10 transition-colors"
              >
                Seg–Sáb 9–18h
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground/90">Duração do slot:</span>
          {!disabled ? (
            <select
              value={slotDurationMin}
              onChange={(e) => handleSlotDurationChange(Number(e.target.value))}
              className="text-[11px] font-medium bg-background/40 border border-border/50 rounded-md px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-accent/40"
            >
              {SLOT_DURATION_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d} min
                </option>
              ))}
            </select>
          ) : (
            <span className="text-[11px] text-muted-foreground">{slotDurationMin} min</span>
          )}
        </div>
      </div>
    </div>
  )
}
