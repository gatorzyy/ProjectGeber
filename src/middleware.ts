import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get tokens from cookies
  const accessToken = request.cookies.get("access_token")?.value
  const refreshToken = request.cookies.get("refresh_token")?.value

  // Protected parent routes - require authentication
  if (pathname.startsWith("/parent") || pathname.startsWith("/family")) {
    if (!accessToken && !refreshToken) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Admin routes - require authentication (admin check is done in API/page)
  if (pathname.startsWith("/admin") && !pathname.startsWith("/api")) {
    // Allow access to admin page for legacy admin login
    // The page will check if user is admin or use legacy password
    const adminSession = request.cookies.get("admin_session")?.value
    if (!accessToken && !refreshToken && adminSession !== "authenticated") {
      // Allow the admin page to handle its own auth for backwards compatibility
      return NextResponse.next()
    }
  }

  // Public kid access via shareable link - no auth required
  if (pathname.startsWith("/kid/access/")) {
    return NextResponse.next()
  }

  // API auth routes - always accessible
  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/parent/:path*",
    "/family/:path*",
    "/admin/:path*",
    "/kid/access/:path*",
  ],
}
