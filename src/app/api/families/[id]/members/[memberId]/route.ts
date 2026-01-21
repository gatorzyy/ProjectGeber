import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSessionFromRequest } from "@/lib/auth"
import { isPrimaryParent } from "@/lib/permissions"
import type { Permission } from "@/lib/permissions"

// Update member permissions or role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id: familyId, memberId } = await params

    // Only primary parent or admin can update member permissions
    const isPrimary = await isPrimaryParent(session.userId, familyId)
    if (!isPrimary && !session.isAdmin) {
      return NextResponse.json(
        { error: "Only primary parent can manage members" },
        { status: 403 }
      )
    }

    // Get target member
    const targetMember = await prisma.familyMember.findUnique({
      where: { id: memberId },
    })

    if (!targetMember || targetMember.familyId !== familyId) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // Cannot modify primary parent
    if (targetMember.role === "primary") {
      return NextResponse.json(
        { error: "Cannot modify primary parent" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { role, permissions } = body

    const updateData: { role?: string; permissions?: string } = {}

    // Validate and set role
    if (role) {
      const validRoles = ["parent", "guardian", "grandparent"]
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 })
      }
      updateData.role = role
    }

    // Validate and set permissions
    if (permissions) {
      const validPermissions: Permission[] = ["view", "comment", "manage", "full"]
      if (!validPermissions.includes(permissions as Permission)) {
        return NextResponse.json(
          { error: "Invalid permissions" },
          { status: 400 }
        )
      }
      updateData.permissions = permissions
    }

    const member = await prisma.familyMember.update({
      where: { id: memberId },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      member,
    })
  } catch (error) {
    console.error("Update member error:", error)
    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 }
    )
  }
}

// Remove member from family
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id: familyId, memberId } = await params

    // Get target member
    const targetMember = await prisma.familyMember.findUnique({
      where: { id: memberId },
    })

    if (!targetMember || targetMember.familyId !== familyId) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // Cannot remove primary parent
    if (targetMember.role === "primary") {
      return NextResponse.json(
        { error: "Cannot remove primary parent" },
        { status: 400 }
      )
    }

    // Only primary parent, admin, or the member themselves can remove
    const isPrimary = await isPrimaryParent(session.userId, familyId)
    const isSelf = targetMember.userId === session.userId

    if (!isPrimary && !session.isAdmin && !isSelf) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    await prisma.familyMember.delete({
      where: { id: memberId },
    })

    return NextResponse.json({
      success: true,
      message: "Member removed from family",
    })
  } catch (error) {
    console.error("Remove member error:", error)
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    )
  }
}
