import { signInWithCustomToken } from "firebase/auth"
import { firebaseAuth } from "@/lib/firebase"
import { apiFetch } from "@/lib/api"

interface FirebaseTokenResponse {
  token: string
  tenantId: string // UUID do Postgres — diferente do activeOrganizationId do better-auth
}

/**
 * Fetches a Firebase custom token from the backend, authenticates the Firebase
 * client, and returns the real tenantId (Postgres UUID) to use as the Firestore
 * path prefix (tenants/{tenantId}/...).
 *
 * ⚠️ Never use activeOrganizationId from better-auth as the Firestore tenantId —
 * they are different identifiers.
 */
export async function signInToFirebase(): Promise<string | null> {
  try {
    const { token, tenantId } = await apiFetch<FirebaseTokenResponse>(
      "/auth/firebase-token"
    )
    await signInWithCustomToken(firebaseAuth, token)
    return tenantId
  } catch (err) {
    // 503 = Firebase not configured on the server (e.g. local dev without Firebase env vars)
    console.warn("[firebase-auth] Could not sign in to Firebase:", err)
    return null
  }
}
