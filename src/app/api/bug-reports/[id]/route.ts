import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { cookies } from "next/headers"

// Helper to check admin auth
async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  return cookieStore.get("admin_session")?.value === "authenticated"
}

// GET - Get a single bug report
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const report = await prisma.bugReport.findUnique({
      where: { id },
    })

    if (!report) {
      return NextResponse.json({ error: "Bug report not found" }, { status: 404 })
    }

    return NextResponse.json({ report })
  } catch (error) {
    console.error("Get bug report error:", error)
    return NextResponse.json(
      { error: "Failed to get bug report" },
      { status: 500 }
    )
  }
}

// PATCH - Update a bug report (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { status, priority, adminNote } = body

    const report = await prisma.bugReport.update({
      where: { id },
      data: {
        status: status !== undefined ? status : undefined,
        priority: priority !== undefined ? priority : undefined,
        adminNote: adminNote !== undefined ? adminNote : undefined,
      },
    })

    return NextResponse.json({ success: true, report })
  } catch (error) {
    console.error("Update bug report error:", error)
    return NextResponse.json(
      { error: "Failed to update bug report" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a bug report (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    await prisma.bugReport.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete bug report error:", error)
    return NextResponse.json(
      { error: "Failed to delete bug report" },
      { status: 500 }
    )
  }
}
