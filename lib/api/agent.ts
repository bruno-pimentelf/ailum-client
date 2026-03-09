import { apiFetch } from "@/lib/api"

// ─── Playground contact ────────────────────────────────────────────────────────

export interface PlaygroundContact {
  id: string
  phone: string
  name: string | null
  currentStageId: string | null
  currentFunnelId: string | null
}

export function getPlaygroundContact() {
  return apiFetch<PlaygroundContact>("/agent/playground-contact")
}

// ─── Send message (test mode — no WhatsApp) ────────────────────────────────────

export function sendPlaygroundMessage(contactId: string, message: string, sessionId?: string) {
  return apiFetch<{ jobId: string; status: string }>("/agent/message", {
    method: "POST",
    body: { contactId, message, testMode: true, ...(sessionId && { sessionId }) },
  })
}

// ─── Confirm (when applicable) ─────────────────────────────────────────────────

export interface ConfirmResponse {
  status: string
  reply: string
  durationMs: number
}

export function confirmPlayground(contactId: string) {
  return apiFetch<ConfirmResponse>("/agent/confirm", {
    method: "POST",
    body: { contactId },
  })
}

// ─── Job status ───────────────────────────────────────────────────────────────

export interface AgentJobResult {
  jobId: string
  state: string
  result?: { status: string; reply?: string; [k: string]: unknown }
  failedReason: string | null
  processedOn?: number
  finishedOn?: number
}

export function getAgentJob(jobId: string) {
  return apiFetch<AgentJobResult>(`/agent/job/${jobId}`)
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export interface AuditDetail {
  label: string
  detail: string
  data?: Record<string, unknown>
}

export interface AgentAuditEntry {
  id: string
  status: string
  routerIntent?: string
  routerConfidence?: number
  stageAgentToolCalls?: number
  totalInputTokens?: number
  totalOutputTokens?: number
  durationMs?: number
  error: string | null
  auditDetails: AuditDetail[]
  createdAt: string
}

export function getAgentAudit(contactId: string, limit = 20) {
  return apiFetch<AgentAuditEntry[]>(`/agent/audit?contactId=${contactId}&limit=${limit}`)
}
