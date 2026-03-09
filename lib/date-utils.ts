/**
 * Utilitários de data/hora em conformidade com timezone local.
 * Sempre usar componentes locais (getFullYear, getMonth, getDate) para YYYY-MM-DD.
 * NUNCA usar toISOString().slice(0,10) — em timezones a oeste de UTC pode retornar o dia errado.
 */

/** Formata data em YYYY-MM-DD no timezone local (para APIs que esperam data local). */
export function toYMD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/** Data de hoje em YYYY-MM-DD (local). */
export function todayYMD(): string {
  return toYMD(new Date())
}

/** Retorna data de amanhã (local). */
export function tomorrowDate(): Date {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d
}

/** Data de amanhã em YYYY-MM-DD (local). */
export function tomorrowYMD(): string {
  return toYMD(tomorrowDate())
}

/** Formata hora HH:mm no timezone local a partir de ISO string. */
export function formatTimeLocal(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

/** Início do dia em Date (local, 00:00:00). */
export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** Fim do dia em Date (local, 23:59:59.999). */
export function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}
