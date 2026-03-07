import { create } from "zustand"

// ─── Agent ────────────────────────────────────────────────────────────────────

export interface Agent {
  id: string
  name: string          // display name (same for all — e.g. "Ailum")
  role: string          // internal role label, e.g. "Qualificador", "Cobrador"
  prompt: string        // system prompt
  color: string         // accent color key
  emoji: string         // visual hint
}

// ─── Funnel store ─────────────────────────────────────────────────────────────

interface FunnelBuilderState {
  isBuilderOpen: boolean
  activeFlowId: string | null
  activeFlowName: string | null

  /** The flow currently set as "active" — handles all incoming leads */
  globalActiveFlowId: string | null

  openBuilder: (flowId: string, flowName: string) => void
  closeBuilder: () => void
  setGlobalActiveFlow: (flowId: string) => void
}

export const useFunnelStore = create<FunnelBuilderState>((set) => ({
  isBuilderOpen: false,
  activeFlowId: null,
  activeFlowName: null,
  globalActiveFlowId: "flow-consulta", // default active flow

  openBuilder: (flowId, flowName) =>
    set({ isBuilderOpen: true, activeFlowId: flowId, activeFlowName: flowName }),
  closeBuilder: () =>
    set({ isBuilderOpen: false, activeFlowId: null, activeFlowName: null }),
  setGlobalActiveFlow: (flowId) =>
    set({ globalActiveFlowId: flowId }),
}))
