import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSessionFromRequest } from "@/lib/auth"
import { checkFamilyPermission, PERMISSIONS } from "@/lib/permissions"

// Convert calendar event to task
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id: eventId } = await params
    const body = await request.json()
    const { kidId, title, description, pointValue, isRecurring, recurringType, startDate } = body

    if (!kidId || !title) {
      return NextResponse.json(
        { error: "Kid ID and title are required" },
        { status: 400 }
      )
    }

    // Get the event
    const event = await prisma.calendarEvent.findUnique({
      where: { id: eventId },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check permission
    const hasAccess = await checkFamilyPermission(
      session.userId,
      event.familyId,
      PERMISSIONS.MANAGE
    )
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Verify kid belongs to the family
    const kid = await prisma.kid.findUnique({
      where: { id: kidId },
    })

    if (!kid || kid.familyId !== event.familyId) {
      return NextResponse.json(
        { error: "Kid not found or not in this family" },
        { status: 400 }
      )
    }

    // Create the task
    const task = await prisma.task.create({
      data: {
        kidId,
        title,
        description: description || null,
        pointValue: pointValue || 10,
        isRecurring: isRecurring || false,
        recurringType: isRecurring ? recurringType : null,
        dueDate: startDate ? new Date(startDate) : new Date(event.startTime),
        requestStatus: "approved",
      },
    })

    // Update event to link to task
    await prisma.calendarEvent.update({
      where: { id: eventId },
      data: { convertedToTaskId: task.id },
    })

    return NextResponse.json({
      success: true,
      task,
      message: "Event converted to task successfully",
    })
  } catch (error) {
    console.error("Convert event to task error:", error)
    return NextResponse.json(
      { error: "Failed to convert event to task" },
      { status: 500 }
    )
  }
}
