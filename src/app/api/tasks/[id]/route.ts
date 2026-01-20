import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const task = await prisma.task.findUnique({
    where: { id },
    include: { kid: true },
  })
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 })
  }
  return NextResponse.json(task)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const task = await prisma.task.findUnique({ where: { id } })
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 })
  }

  // If completing task and it wasn't completed before, update kid's points
  // Only award points if task is approved
  if (body.isCompleted === true && !task.isCompleted && task.requestStatus === "approved") {
    await prisma.kid.update({
      where: { id: task.kidId },
      data: { totalPoints: { increment: task.pointValue } },
    })
  }

  // If approving a task request
  if (body.requestStatus === "approved" && task.requestStatus === "pending") {
    // Task is now approved, ready to be completed
  }

  // If rejecting a task request
  if (body.requestStatus === "rejected" && task.requestStatus === "pending") {
    // Task is rejected, won't be shown to kid
  }

  const updatedTask = await prisma.task.update({
    where: { id },
    data: {
      title: body.title !== undefined ? body.title : undefined,
      description: body.description !== undefined ? body.description : undefined,
      pointValue: body.pointValue !== undefined ? body.pointValue : undefined,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      isRecurring: body.isRecurring !== undefined ? body.isRecurring : undefined,
      recurringType: body.recurringType !== undefined ? body.recurringType : undefined,
      isCompleted: body.isCompleted !== undefined ? body.isCompleted : undefined,
      completedAt: body.isCompleted === true ? new Date() : body.isCompleted === false ? null : undefined,
      requestStatus: body.requestStatus !== undefined ? body.requestStatus : undefined,
      proofImageUrl: body.proofImageUrl !== undefined ? body.proofImageUrl : undefined,
      completionNote: body.completionNote !== undefined ? body.completionNote : undefined,
      parentComment: body.parentComment !== undefined ? body.parentComment : undefined,
      feedbackRequested: body.feedbackRequested !== undefined ? body.feedbackRequested : undefined,
    },
  })
  return NextResponse.json(updatedTask)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.task.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
