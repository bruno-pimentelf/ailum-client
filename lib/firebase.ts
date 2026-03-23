import { initializeApp, getApps } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "ailum-473302.firebasestorage.app",
}

// Prevent duplicate initialization in Next.js (hot reload / SSR)
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const firebaseAuth = getAuth(app)
export const storage = getStorage(app)

function withTimeout<T>(promise: Promise<T>, ms: number, msg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${msg} (timeout ${ms / 1000}s)`)), ms)
    ),
  ])
}

/** Upload tenant logo to Firebase Storage and return public URL */
export async function uploadTenantLogo(tenantId: string, file: File): Promise<string> {
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase()
  const allowed = ["jpg", "jpeg", "png", "webp"]
  const finalExt = allowed.includes(ext) ? ext : "jpg"
  const path = `tenant-photo-url/${tenantId}/logo.${finalExt}`
  const fileRef = ref(storage, path)
  await withTimeout(
    uploadBytes(fileRef, file, { contentType: file.type || `image/${finalExt}` }),
    20_000,
    "Upload falhou"
  )
  return withTimeout(getDownloadURL(fileRef), 10_000, "Obter URL falhou")
}

/** Upload template media file to Firebase Storage and return public URL */
export async function uploadTemplateMedia(tenantId: string, file: File): Promise<string> {
  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase()
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const path = `tenants/${tenantId}/templates/${uniqueId}.${ext}`
  const fileRef = ref(storage, path)
  await withTimeout(
    uploadBytes(fileRef, file, { contentType: file.type || "application/octet-stream" }),
    60_000,
    "Upload falhou"
  )
  return withTimeout(getDownloadURL(fileRef), 10_000, "Obter URL falhou")
}
