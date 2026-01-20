import { NextRequest, NextResponse } from "next/server"
import { refreshAccessToken, getAuthCookieOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refresh_token")?.value

    if (!refreshToken) {
      return NextResponse.json(
        { error: "No refresh token provided" },
        { status: 401 }
      )
    }

    const result = await refreshAccessToken(refreshToken)

    if (!result) {
      // Clear invalid tokens
      const response = NextResponse.json(
        { error: "Invalid or expired refresh token" },
        { status: 401 }
      )
      response.cookies.set("access_token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
      })
      response.cookies.set("refresh_token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
      })
      return response
    }

    const response = NextResponse.json({
      success: true,
      accessToken: result.accessToken,
    })

    // Set new access token cookie
    response.cookies.set(
      "access_token",
      result.accessToken,
      getAuthCookieOptions()
    )

    return response
  } catch (error) {
    console.error("Token refresh error:", error)
    return NextResponse.json(
      { error: "Failed to refresh token" },
      { status: 500 }
    )
  }
}
