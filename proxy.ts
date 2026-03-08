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
  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r))
  const sessionCookie =
    request.cookies.get("ailum_session") ??
    request.cookies.get("better-auth.session_token") // fallback dev

  if (!sessionCookie && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|images).*)"],
}
