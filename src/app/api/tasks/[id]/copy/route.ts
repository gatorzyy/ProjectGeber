import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// POST - Copy a task to one or more kids
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { kidIds } = body // Array of kid IDs to copy the task to

  if (!kidIds || !Array.isArray(kidIds) || kidIds.length === 0) {
    return NextResponse.json({ error: "kidIds array required" }, { status: 400 })
  }

  // Get the original task
  const originalTask = await prisma.task.findUnique({ where: { id } })
  if (!originalTask) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 })
  }

  // Copy task to each kid
  const copies = []
  for (const kidId of kidIds) {
    const copy = await prisma.task.create({
      data: {
        kidId,
        title: originalTask.title,
        description: originalTask.description,
        pointValue: originalTask.pointValue,
        dueDate: originalTask.dueDate,
        isRecurring: originalTask.isRecurring,
        recurringType: originalTask.recurringType,
        isCompleted: false,
        requestStatus: "approved",
        isKidRequest: false,
      },
    })
    copies.push(copy)
  }

  return NextResponse.json({ copies, count: copies.length })
}
