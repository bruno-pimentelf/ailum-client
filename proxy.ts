import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_ROUTES = [
  "/login",
  "/sign-up",
  "/invite",
  "/reset-password",
  "/forgot-password",
  "/select-org",
]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Landing page is always public
  if (pathname === "/") return NextResponse.next()

  // Auth pages are always public
  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r))
  if (isPublic) return NextResponse.next()

  // In cross-origin deployments (ailum.io → api.ailum.io), the session cookie
  // lives on api.ailum.io and is never sent to ailum.io. Auth protection is
  // handled client-side by SessionProvider, which calls getSession() directly
  // against the API with credentials: 'include'.
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|images).*)"],
}
