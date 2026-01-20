import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// Environment variables for Google OAuth
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/calendar/google/callback"

// Handle OAuth callback from Google
export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code")
    const state = request.nextUrl.searchParams.get("state")
    const error = request.nextUrl.searchParams.get("error")

    if (error) {
      return NextResponse.redirect(
        new URL(`/parent/calendar?error=${error}`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/parent/calendar?error=missing_params", request.url)
      )
    }

    let stateData: { userId: string; familyId: string }
    try {
      stateData = JSON.parse(state)
    } catch {
      return NextResponse.redirect(
        new URL("/parent/calendar?error=invalid_state", request.url)
      )
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return NextResponse.redirect(
        new URL("/parent/calendar?error=not_configured", request.url)
      )
    }

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    })

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", await tokenResponse.text())
      return NextResponse.redirect(
        new URL("/parent/calendar?error=token_exchange_failed", request.url)
      )
    }

    const tokens = await tokenResponse.json()

    // Store tokens in database
    await prisma.googleToken.upsert({
      where: { userId: stateData.userId },
      create: {
        userId: stateData.userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || "",
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        scope: tokens.scope,
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || undefined,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        scope: tokens.scope,
      },
    })

    // Redirect to calendar page with success
    return NextResponse.redirect(
      new URL(
        `/parent/calendar?success=connected&familyId=${stateData.familyId}`,
        request.url
      )
    )
  } catch (error) {
    console.error("Google callback error:", error)
    return NextResponse.redirect(
      new URL("/parent/calendar?error=callback_failed", request.url)
    )
  }
}
