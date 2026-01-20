import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSessionFromRequest } from "@/lib/auth"
import { checkFamilyPermission, PERMISSIONS } from "@/lib/permissions"

// Get calendar events for a family
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const familyId = request.nextUrl.searchParams.get("familyId")
    if (!familyId) {
      return NextResponse.json({ error: "Family ID required" }, { status: 400 })
    }

    // Check permission
    const hasAccess = await checkFamilyPermission(
      session.userId,
      familyId,
      PERMISSIONS.VIEW
    )
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get date range from query params
    const startDate = request.nextUrl.searchParams.get("startDate")
    const endDate = request.nextUrl.searchParams.get("endDate")

    const whereClause: {
      familyId: string
      startTime?: { gte?: Date; lte?: Date }
    } = { familyId }

    if (startDate || endDate) {
      whereClause.startTime = {}
      if (startDate) {
        whereClause.startTime.gte = new Date(startDate)
      }
      if (endDate) {
        whereClause.startTime.lte = new Date(endDate)
      }
    }

    const events = await prisma.calendarEvent.findMany({
      where: whereClause,
      orderBy: { startTime: "asc" },
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error("Get calendar events error:", error)
    return NextResponse.json(
      { error: "Failed to get calendar events" },
      { status: 500 }
    )
  }
}

// Create a manual calendar event (not from Google)
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { familyId, title, description, startTime, endTime, isAllDay, location } = body

    if (!familyId || !title || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
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

    const event = await prisma.calendarEvent.create({
      data: {
        familyId,
        title,
        description: description || null,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        isAllDay: isAllDay || false,
        location: location || null,
      },
    })

    return NextResponse.json({ success: true, event })
  } catch (error) {
    console.error("Create calendar event error:", error)
    return NextResponse.json(
      { error: "Failed to create calendar event" },
      { status: 500 }
    )
  }
}
