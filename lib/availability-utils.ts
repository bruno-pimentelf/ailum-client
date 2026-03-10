/**
 * Cálculo de disponibilidade por dia conforme doc: calendar-availability-doctor-ux-integration.md
 *
 * Prioridade:
 * 1. Exceção com isUnavailable=true → dia bloqueado
 * 2. Block range (dateFrom ≤ date ≤ dateTo) → dia bloqueado
 * 3. Override (date) → usar horários do override
 * 4. Caso contrário → usar availability onde dayOfWeek = dia da semana (0–6)
 * 5. Exceção com isUnavailable=false + slotMask → subtrair intervalos dos slots
 *
 * dayOfWeek: 0=Domingo, 1=Segunda, … 6=Sábado
 */

import type {
  AvailabilitySlot,
  AvailabilityException,
  AvailabilityOverride,
  AvailabilityBlockRange,
} from "@/lib/api/professionals"
import { toYMD } from "./date-utils"

export interface DayAvailabilitySlot {
  startTime: string
  endTime: string
  slotDurationMin?: number
  isOverride?: boolean
  /** Para override: id do override (DELETE). Para weekly: undefined. */
  overrideId?: string
  /** Para weekly: dayOfWeek (0–6). */
  dayOfWeek?: number
}

export interface DayAvailability {
  /** true = dia completamente bloqueado */
  blocked: boolean
  /** Blocos de horário (startTime–endTime em HH:mm). Vazio se bloqueado. */
  slots: DayAvailabilitySlot[]
}

function parseDate(d: string | Date): string {
  if (typeof d === "string") return d.slice(0, 10)
  return toYMD(d)
}

/** Subtrai intervalos de máscara de um slot. Retorna segmentos restantes. */
function subtractMaskFromSlot(
  slotStart: number,
  slotEnd: number,
  masks: Array<{ startTime: string; endTime: string }>
): Array<[number, number]> {
  let segments: Array<[number, number]> = [[slotStart, slotEnd]]
  for (const m of masks) {
    const [a, b] = [timeToMinutes(m.startTime), timeToMinutes(m.endTime)]
    const next: Array<[number, number]> = []
    for (const [s, e] of segments) {
      if (b <= s || a >= e) {
        next.push([s, e])
      } else {
        if (s < a) next.push([s, Math.min(e, a)])
        if (b < e) next.push([Math.max(s, b), e])
      }
    }
    segments = next.filter(([x, y]) => y > x)
  }
  return segments
}

export function computeDayAvailability(
  date: Date,
  opts: {
    availability: AvailabilitySlot[]
    exceptions: AvailabilityException[]
    overrides?: AvailabilityOverride[]
    blockRanges?: AvailabilityBlockRange[]
  }
): DayAvailability {
  const dateStr = parseDate(date)
  const dayOfWeek = date.getDay()

  const exFullBlock = opts.exceptions.find(
    (e) => parseDate(e.date) === dateStr && e.isUnavailable === true
  )
  if (exFullBlock) return { blocked: true, slots: [] }

  const inBlock = (opts.blockRanges ?? []).some((br) => {
    const from = parseDate(br.dateFrom)
    const to = parseDate(br.dateTo)
    return dateStr >= from && dateStr <= to
  })
  if (inBlock) return { blocked: true, slots: [] }

  const dayOverrides = (opts.overrides ?? []).filter(
    (o) => parseDate(o.date) === dateStr
  )
  const exSlotMask = opts.exceptions.find(
    (e) => parseDate(e.date) === dateStr && e.isUnavailable === false && (e.slotMask?.length ?? 0) > 0
  )
  const mask = exSlotMask?.slotMask ?? []

  if (dayOverrides.length > 0) {
    let slots: DayAvailabilitySlot[] = dayOverrides.map((o) => ({
      startTime: o.startTime,
      endTime: o.endTime,
      slotDurationMin: o.slotDurationMin,
      isOverride: true,
      overrideId: o.id,
    }))
    if (mask.length > 0) {
      const result: DayAvailabilitySlot[] = []
      for (const s of slots) {
        const segs = subtractMaskFromSlot(
          timeToMinutes(s.startTime),
          timeToMinutes(s.endTime),
          mask
        )
        for (const [startM, endM] of segs) {
          result.push({
            startTime: minutesToHHMM(startM),
            endTime: minutesToHHMM(endM),
            slotDurationMin: s.slotDurationMin,
            isOverride: true,
            overrideId: s.overrideId,
          })
        }
      }
      slots = result
    }
    return { blocked: false, slots }
  }

  const weeklySlots = opts.availability.filter((a) => a.dayOfWeek === dayOfWeek)
  let slots: DayAvailabilitySlot[] = weeklySlots.map((s) => ({
    startTime: s.startTime ?? "09:00",
    endTime: s.endTime ?? "18:00",
    slotDurationMin: s.slotDurationMin,
    isOverride: false,
    dayOfWeek,
  }))

  if (mask.length > 0) {
    const result: DayAvailabilitySlot[] = []
    for (const s of slots) {
      const segs = subtractMaskFromSlot(
        timeToMinutes(s.startTime),
        timeToMinutes(s.endTime),
        mask
      )
      for (const [startM, endM] of segs) {
        result.push({
          startTime: minutesToHHMM(startM),
          endTime: minutesToHHMM(endM),
          slotDurationMin: s.slotDurationMin,
          isOverride: false,
          dayOfWeek,
        })
      }
    }
    slots = result
  }

  return { blocked: false, slots }
}

/** Retorna a causa do bloqueio do dia (exceção ou block range). null se não bloqueado. */
export function getBlockSource(
  date: Date,
  opts: {
    exceptions: AvailabilityException[]
    blockRanges?: AvailabilityBlockRange[]
  }
): { type: "exception"; exception: AvailabilityException } | { type: "blockRange"; blockRange: AvailabilityBlockRange } | null {
  const dateStr = parseDate(date)
  const ex = opts.exceptions.find((e) => parseDate(e.date) === dateStr && e.isUnavailable)
  if (ex) return { type: "exception", exception: ex }
  const br = (opts.blockRanges ?? []).find((r) => {
    const from = parseDate(r.dateFrom)
    const to = parseDate(r.dateTo)
    return dateStr >= from && dateStr <= to
  })
  if (br) return { type: "blockRange", blockRange: br }
  return null
}

/** Converte HH:mm em minutos desde meia-noite */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

/** Grade pixel-based: 1h = 64px, 15min = 16px. Hora base = 7h (início da grade). */
export const HOUR_HEIGHT = 64
const MIN_HEIGHT = HOUR_HEIGHT / 60
const BASE_HOUR = 7

/** Minutos desde meia-noite para px top (0 = 7:00) */
export function minutesToPx(min: number): number {
  const minFromBase = min - BASE_HOUR * 60
  return Math.max(0, minFromBase * MIN_HEIGHT)
}

/** HH:mm para px top na grade (base 7h) */
export function timeToTop(hhmm: string): number {
  return minutesToPx(timeToMinutes(hhmm))
}

/** Duração em minutos para px height */
export function durationToPx(min: number): number {
  return min * MIN_HEIGHT
}

/** Arredonda minutos para múltiplo de 15 */
export function snapTo15(min: number): number {
  return Math.round(min / 15) * 15
}

/** Converte px (y na coluna) para minutos desde meia-noite */
export function pxToMinutes(px: number): number {
  return BASE_HOUR * 60 + Math.round(px / MIN_HEIGHT)
}

/** Minutos desde meia-noite para HH:mm */
export function minutesToHHMM(min: number): string {
  const h = Math.floor(min / 60) % 24
  const m = min % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}
