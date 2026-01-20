import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// GET - Fetch all tasks for a specific kid
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // Verify kid exists
    const kid = await prisma.kid.findUnique({
      where: { id },
      select: { id: true, name: true },
    })

    if (!kid) {
      return NextResponse.json({ error: "Kid not found" }, { status: 404 })
    }

    // Fetch all tasks for this kid
    const tasks = await prisma.task.findMany({
      where: { kidId: id },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      tasks,
      kid: { id: kid.id, name: kid.name },
    })
  } catch (error) {
    console.error("Get kid tasks error:", error)
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    )
  }
}
