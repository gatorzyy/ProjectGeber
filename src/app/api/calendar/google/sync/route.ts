import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSessionFromRequest } from "@/lib/auth"
import { checkFamilyPermission, PERMISSIONS } from "@/lib/permissions"

// Environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET

// Sync events from Google Calendar
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { familyId, timeMin, timeMax } = body

    if (!familyId) {
      return NextResponse.json({ error: "Family ID required" }, { status: 400 })
    }

    // Check permission
    const hasAccess = await checkFamilyPermission(
      session.userId,
      familyId,
      PERMISSIONS.MANAGE
    )
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get stored tokens
    const googleToken = await prisma.googleToken.findUnique({
      where: { userId: session.userId },
    })

    if (!googleToken) {
      return NextResponse.json(
        { error: "Google Calendar not connected" },
        { status: 400 }
      )
    }

    // Check if token needs refresh
    let accessToken = googleToken.accessToken
    if (new Date(googleToken.expiresAt) <= new Date()) {
      // Refresh the token
      if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        return NextResponse.json(
          { error: "Google OAuth not configured" },
          { status: 500 }
        )
      }

      const refreshResponse = await fetch(
        "https://oauth2.googleapis.com/token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            refresh_token: googleToken.refreshToken,
            grant_type: "refresh_token",
          }),
        }
      )

      if (!refreshResponse.ok) {
        // Token refresh failed, user needs to reconnect
        return NextResponse.json(
          { error: "Token expired. Please reconnect Google Calendar." },
          { status: 401 }
        )
      }

      const newTokens = await refreshResponse.json()
      accessToken = newTokens.access_token

      // Update stored token
      await prisma.googleToken.update({
        where: { userId: session.userId },
        data: {
          accessToken: newTokens.access_token,
          expiresAt: new Date(Date.now() + newTokens.expires_in * 1000),
        },
      })
    }

    // Fetch events from Google Calendar
    const now = new Date()
    const defaultTimeMin = new Date(now.getFullYear(), now.getMonth(), 1)
    const defaultTimeMax = new Date(now.getFullYear(), now.getMonth() + 2, 0)

    const calendarParams = new URLSearchParams({
      timeMin: (timeMin || defaultTimeMin.toISOString()),
      timeMax: (timeMax || defaultTimeMax.toISOString()),
      maxResults: "100",
      singleEvents: "true",
      orderBy: "startTime",
    })

    const eventsResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${calendarParams.toString()}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )

    if (!eventsResponse.ok) {
      console.error("Failed to fetch events:", await eventsResponse.text())
      return NextResponse.json(
        { error: "Failed to fetch calendar events" },
        { status: 500 }
      )
    }

    const eventsData = await eventsResponse.json()
    const googleEvents = eventsData.items || []

    // Upsert events into database
    let syncedCount = 0
    for (const gEvent of googleEvents) {
      if (!gEvent.id) continue

      const startTime = gEvent.start?.dateTime || gEvent.start?.date
      const endTime = gEvent.end?.dateTime || gEvent.end?.date

      if (!startTime || !endTime) continue

      await prisma.calendarEvent.upsert({
        where: {
          googleEventId_familyId: {
            googleEventId: gEvent.id,
            familyId,
          },
        },
        create: {
          familyId,
          googleEventId: gEvent.id,
          googleCalendarId: "primary",
          title: gEvent.summary || "Untitled Event",
          description: gEvent.description || null,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          isAllDay: !gEvent.start?.dateTime,
          location: gEvent.location || null,
          recurrenceRule: gEvent.recurrence?.[0] || null,
        },
        update: {
          title: gEvent.summary || "Untitled Event",
          description: gEvent.description || null,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          isAllDay: !gEvent.start?.dateTime,
          location: gEvent.location || null,
          recurrenceRule: gEvent.recurrence?.[0] || null,
        },
      })
      syncedCount++
    }

    return NextResponse.json({
      success: true,
      syncedCount,
      message: `Synced ${syncedCount} events from Google Calendar`,
    })
  } catch (error) {
    console.error("Google sync error:", error)
    return NextResponse.json(
      { error: "Failed to sync calendar" },
      { status: 500 }
    )
  }
}
