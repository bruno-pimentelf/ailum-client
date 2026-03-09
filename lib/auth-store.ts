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
  // UUID interno do Postgres — diferente do activeOrganizationId do better-auth.
  // Retornado por GET /v1/auth/firebase-token e usado como path no Firestore.
  tenantId: string | null
  firebaseReady: boolean

  setUser: (user: User | null) => void
  setOrgs: (orgs: Org[]) => void
  setActiveOrgId: (id: string | null) => void
  setTenantId: (id: string | null) => void
  setFirebaseReady: (ready: boolean) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  orgs: [],
  activeOrgId: null,
  tenantId: null,
  firebaseReady: false,

  setUser: (user) => set({ user }),
  setOrgs: (orgs) => set({ orgs }),
  setActiveOrgId: (id) => set({ activeOrgId: id }),
  setTenantId: (id) => set({ tenantId: id }),
  setFirebaseReady: (ready) => set({ firebaseReady: ready }),
  clear: () => set({ user: null, orgs: [], activeOrgId: null, tenantId: null, firebaseReady: false }),
}))
