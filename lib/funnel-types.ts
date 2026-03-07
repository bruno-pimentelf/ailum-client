import { Node, Edge } from "@xyflow/react"
import type { Agent } from "./funnel-store"

// ─── Status Node ──────────────────────────────────────────────────────────────

export interface StatusNodeData extends Record<string, unknown> {
  label: string
  color: string
  description?: string
  isStart?: boolean
  isEnd?: boolean
  agents?: Agent[]    // agents assigned to handle leads at this status
}

export type StatusNode = Node<StatusNodeData, "status">

// ─── Agent Node ───────────────────────────────────────────────────────────────

export interface AgentNodeData extends Record<string, unknown> {
  agent: Agent
}

export type AgentNode = Node<AgentNodeData, "agent">

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

export type FunnelNode = StatusNode | TriggerNode | AgentNode
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

export const AGENT_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  violet:  { bg: "bg-violet-500/10",  border: "border-violet-500/25",  text: "text-violet-300",  dot: "bg-violet-400"  },
  amber:   { bg: "bg-amber-500/10",   border: "border-amber-500/25",   text: "text-amber-300",   dot: "bg-amber-400"   },
  cyan:    { bg: "bg-cyan-500/10",    border: "border-cyan-500/25",    text: "text-cyan-300",    dot: "bg-cyan-400"    },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/25", text: "text-emerald-300", dot: "bg-emerald-400" },
  rose:    { bg: "bg-rose-500/10",    border: "border-rose-500/25",    text: "text-rose-300",    dot: "bg-rose-400"    },
  blue:    { bg: "bg-blue-500/10",    border: "border-blue-500/25",    text: "text-blue-300",    dot: "bg-blue-400"    },
  slate:   { bg: "bg-white/[0.04]",   border: "border-white/[0.10]",   text: "text-white/50",    dot: "bg-white/30"    },
}

// ─── Default agents ───────────────────────────────────────────────────────────

export const DEFAULT_AGENTS: Agent[] = [
  {
    id: "agent-recep",
    name: "Ailum",
    role: "Recepcionista",
    prompt: "Você é a Ailum, recepcionista da clínica. Recepcione o paciente com simpatia, entenda sua necessidade e colete os dados básicos (nome, telefone, motivo da consulta).",
    color: "slate",
    emoji: "👋",
  },
  {
    id: "agent-qual",
    name: "Ailum",
    role: "Qualificador",
    prompt: "Você é a Ailum. Após a recepção, qualifique o lead entendendo se tem plano de saúde, se é particular, qual especialidade busca e urgência. Guie para o próximo passo.",
    color: "amber",
    emoji: "🔍",
  },
  {
    id: "agent-cobranca",
    name: "Ailum",
    role: "Cobrança",
    prompt: "Você é a Ailum. Envie o Pix, explique o valor e as formas de pagamento, tire dúvidas sobre o pagamento e confirme o recebimento antes de prosseguir.",
    color: "cyan",
    emoji: "💳",
  },
  {
    id: "agent-agenda",
    name: "Ailum",
    role: "Agendamento",
    prompt: "Você é a Ailum. Com o pagamento confirmado, agende a consulta oferecendo as datas disponíveis, confirme o horário e envie as instruções de como chegar ou acessar a consulta.",
    color: "emerald",
    emoji: "📅",
  },
  {
    id: "agent-followup",
    name: "Ailum",
    role: "Follow-up",
    prompt: "Você é a Ailum. Após a consulta, envie uma mensagem de acompanhamento, pergunte sobre a experiência, ofereça retorno e incentive novos agendamentos ou indicações.",
    color: "violet",
    emoji: "✨",
  },
]

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
