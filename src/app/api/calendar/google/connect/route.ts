import { NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest } from "@/lib/auth"

// Environment variables for Google OAuth
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/calendar/google/callback"

// Generate OAuth URL and redirect to Google
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (!GOOGLE_CLIENT_ID) {
      return NextResponse.json(
        { error: "Google OAuth not configured" },
        { status: 500 }
      )
    }

    // Get family ID from query params
    const familyId = request.nextUrl.searchParams.get("familyId")
    if (!familyId) {
      return NextResponse.json(
        { error: "Family ID required" },
        { status: 400 }
      )
    }

    // Google OAuth scopes for calendar access
    const scopes = [
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/calendar.events.readonly",
    ]

    // Build OAuth URL
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: "code",
      scope: scopes.join(" "),
      access_type: "offline",
      prompt: "consent",
      state: JSON.stringify({ userId: session.userId, familyId }),
    })

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error("Google connect error:", error)
    return NextResponse.json(
      { error: "Failed to initialize Google OAuth" },
      { status: 500 }
    )
  }
}
