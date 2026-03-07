import { create } from "zustand"

interface FunnelBuilderState {
  isBuilderOpen: boolean
  activeFlowId: string | null
  activeFlowName: string | null
  openBuilder: (flowId: string, flowName: string) => void
  closeBuilder: () => void
}

export const useFunnelStore = create<FunnelBuilderState>((set) => ({
  isBuilderOpen: false,
  activeFlowId: null,
  activeFlowName: null,
  openBuilder: (flowId, flowName) =>
    set({ isBuilderOpen: true, activeFlowId: flowId, activeFlowName: flowName }),
  closeBuilder: () =>
    set({ isBuilderOpen: false, activeFlowId: null, activeFlowName: null }),
}))
