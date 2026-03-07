import { Node, Edge } from "@xyflow/react"

// ─── Status Node ──────────────────────────────────────────────────────────────

export interface StatusNodeData extends Record<string, unknown> {
  label: string
  color: string       // tailwind color key e.g. "slate" | "amber" | "cyan" | "emerald" | "violet"
  description?: string
  isStart?: boolean
  isEnd?: boolean
}

export type StatusNode = Node<StatusNodeData, "status">

// ─── Trigger Node ─────────────────────────────────────────────────────────────

export type TriggerType =
  | "message_received"
  | "keyword_match"
  | "payment_confirmed"
  | "payment_pending"
  | "time_elapsed"
  | "manual"
  | "webhook"
  | "tag_added"

export interface TriggerNodeData extends Record<string, unknown> {
  triggerType: TriggerType
  label: string
  config: Record<string, string>
}

export type TriggerNode = Node<TriggerNodeData, "trigger">

// ─── Union types ──────────────────────────────────────────────────────────────

export type FunnelNode = StatusNode | TriggerNode
export type FunnelEdge = Edge

// ─── Color map ────────────────────────────────────────────────────────────────

export const STATUS_COLORS: Record<string, { bg: string; border: string; dot: string; text: string; accent: string }> = {
  slate:   { bg: "bg-slate-500/10",   border: "border-slate-500/30",   dot: "bg-slate-400",   text: "text-slate-300",   accent: "#94a3b8" },
  amber:   { bg: "bg-amber-500/10",   border: "border-amber-500/30",   dot: "bg-amber-400",   text: "text-amber-300",   accent: "#fbbf24" },
  cyan:    { bg: "bg-cyan-500/10",    border: "border-cyan-500/30",    dot: "bg-cyan-400",    text: "text-cyan-300",    accent: "#22d3ee" },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", dot: "bg-emerald-400", text: "text-emerald-300", accent: "#34d399" },
  violet:  { bg: "bg-violet-500/10",  border: "border-violet-500/30",  dot: "bg-violet-400",  text: "text-violet-300",  accent: "#a78bfa" },
  rose:    { bg: "bg-rose-500/10",    border: "border-rose-500/30",    dot: "bg-rose-400",    text: "text-rose-300",    accent: "#fb7185" },
  blue:    { bg: "bg-blue-500/10",    border: "border-blue-500/30",    dot: "bg-blue-400",    text: "text-blue-300",    accent: "#60a5fa" },
}

// ─── Trigger label/icon map ───────────────────────────────────────────────────

export const TRIGGER_META: Record<TriggerType, { label: string; description: string }> = {
  message_received:  { label: "Mensagem recebida",   description: "Dispara quando uma mensagem é recebida" },
  keyword_match:     { label: "Palavra-chave",        description: "Mensagem contém palavra-chave específica" },
  payment_confirmed: { label: "Pagamento confirmado", description: "Pix ou pagamento foi confirmado" },
  payment_pending:   { label: "Aguardando pagamento", description: "Pagamento enviado mas não confirmado" },
  time_elapsed:      { label: "Tempo decorrido",      description: "X tempo sem interação" },
  manual:            { label: "Ação manual",          description: "Disparado manualmente pela equipe" },
  webhook:           { label: "Webhook",              description: "Chamada HTTP externa" },
  tag_added:         { label: "Tag adicionada",       description: "Uma tag específica foi atribuída" },
}
