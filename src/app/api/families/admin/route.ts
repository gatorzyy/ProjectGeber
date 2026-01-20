import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { cookies } from "next/headers"

// Helper to check admin auth
async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  return cookieStore.get("admin_session")?.value === "authenticated"
}

// Get all families (admin only)
export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const families = await prisma.family.findMany({
      include: {
        kids: {
          select: {
            id: true,
            name: true,
            avatarColor: true,
            totalPoints: true,
            accessToken: true,
            accessTokenEnabled: true,
          },
          orderBy: { name: "asc" },
        },
        _count: { select: { members: true, kids: true } },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ families })
  } catch (error) {
    console.error("Get families error:", error)
    return NextResponse.json(
      { error: "Failed to get families" },
      { status: 500 }
    )
  }
}

// Create a new family (admin only)
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Family name is required" },
        { status: 400 }
      )
    }

    const family = await prisma.family.create({
      data: {
        name: name.trim(),
      },
    })

    return NextResponse.json({ success: true, family })
  } catch (error) {
    console.error("Create family error:", error)
    return NextResponse.json(
      { error: "Failed to create family" },
      { status: 500 }
    )
  }
}
