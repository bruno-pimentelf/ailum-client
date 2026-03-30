/** Portuguese labels for ContactStatus enum values. */
export const STATUS_LABELS: Record<string, string> = {
  NEW_LEAD: "Novo lead",
  QUALIFIED: "Qualificado",
  APPOINTMENT_SCHEDULED: "Consulta agendada",
  AWAITING_PAYMENT: "Aguardando pagamento",
  PAYMENT_CONFIRMED: "Pagamento confirmado",
  ATTENDED: "Atendido",
  NO_INTEREST: "Sem interesse",
  RECURRING: "Recorrente",
  IN_HUMAN_SERVICE: "Em atendimento humano",
}

export function statusLabel(raw: string | undefined | null): string {
  if (!raw) return ""
  return STATUS_LABELS[raw] ?? raw.replace(/_/g, " ")
}
