import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { cookies } from "next/headers"

// Helper to check admin auth
async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  return cookieStore.get("admin_session")?.value === "authenticated"
}

// Update a family (admin only)
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
    const { name } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Family name is required" },
        { status: 400 }
      )
    }

    const family = await prisma.family.update({
      where: { id },
      data: { name: name.trim() },
    })

    return NextResponse.json({ success: true, family })
  } catch (error) {
    console.error("Update family error:", error)
    return NextResponse.json(
      { error: "Failed to update family" },
      { status: 500 }
    )
  }
}

// Delete a family (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // First, unassign all kids from this family
    await prisma.kid.updateMany({
      where: { familyId: id },
      data: { familyId: null },
    })

    // Then delete the family
    await prisma.family.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete family error:", error)
    return NextResponse.json(
      { error: "Failed to delete family" },
      { status: 500 }
    )
  }
}
