import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { cookies } from "next/headers"

// GET - List all bug reports (admin only)
export async function GET() {
  try {
    const cookieStore = await cookies()
    const isAdmin = cookieStore.get("admin_session")?.value === "authenticated"

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const reports = await prisma.bugReport.findMany({
      orderBy: [
        { status: "asc" }, // Open first
        { priority: "desc" }, // High priority first
        { createdAt: "desc" },
      ],
    })

    return NextResponse.json({ reports })
  } catch (error) {
    console.error("Get bug reports error:", error)
    return NextResponse.json(
      { error: "Failed to get bug reports" },
      { status: 500 }
    )
  }
}

// POST - Create a new bug report (public)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, page, userType, userId } = body

    if (!title || !description || !page) {
      return NextResponse.json(
        { error: "Title, description, and page are required" },
        { status: 400 }
      )
    }

    const report = await prisma.bugReport.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        page,
        userType: userType || "guest",
        userId: userId || null,
      },
    })

    return NextResponse.json({ success: true, report })
  } catch (error) {
    console.error("Create bug report error:", error)
    return NextResponse.json(
      { error: "Failed to create bug report" },
      { status: 500 }
    )
  }
}
