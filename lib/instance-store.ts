import { create } from "zustand"
import { persist } from "zustand/middleware"

type InstanceState = {
  /** Z-API instanceId selecionado. null = todas as instâncias */
  selectedInstanceId: string | null
  setSelectedInstanceId: (id: string | null) => void
}

export const useInstanceStore = create<InstanceState>()(
  persist(
    (set) => ({
      selectedInstanceId: null,
      setSelectedInstanceId: (id) => set({ selectedInstanceId: id }),
    }),
    { name: "ailum-instance" },
  ),
)
