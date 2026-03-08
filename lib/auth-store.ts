import { create } from "zustand"

type Org = {
  id: string
  name: string
  slug: string
  role?: string
}

type User = {
  id: string
  name: string
  email: string
  image?: string | null
}

type AuthState = {
  user: User | null
  orgs: Org[]
  activeOrgId: string | null

  setUser: (user: User | null) => void
  setOrgs: (orgs: Org[]) => void
  setActiveOrgId: (id: string | null) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  orgs: [],
  activeOrgId: null,

  setUser: (user) => set({ user }),
  setOrgs: (orgs) => set({ orgs }),
  setActiveOrgId: (id) => set({ activeOrgId: id }),
  clear: () => set({ user: null, orgs: [], activeOrgId: null }),
}))
