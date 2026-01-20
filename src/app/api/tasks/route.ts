import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const kidId = searchParams.get("kidId")
  const status = searchParams.get("status") // Filter by request status
  const pending = searchParams.get("pending") // Get pending task requests

  const tasks = await prisma.task.findMany({
    where: {
      ...(kidId && { kidId }),
      ...(status && { requestStatus: status }),
      ...(pending === "true" && { requestStatus: "pending", isKidRequest: true }),
    },
    include: { kid: true },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(tasks)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  // Determine if this is a kid request or admin-created task
  const isKidRequest = body.isKidRequest || false

  const task = await prisma.task.create({
    data: {
      kidId: body.kidId,
      title: body.title,
      description: body.description,
      pointValue: body.pointValue || 1,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      isRecurring: body.isRecurring || false,
      recurringType: body.recurringType,
      isKidRequest,
      requestStatus: isKidRequest ? "pending" : "approved", // Kid requests need approval
    },
  })
  return NextResponse.json(task, { status: 201 })
}
