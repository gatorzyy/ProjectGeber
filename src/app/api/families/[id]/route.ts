import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSessionFromRequest } from "@/lib/auth"
import { checkFamilyPermission, PERMISSIONS, isPrimaryParent } from "@/lib/permissions"

// Get a specific family
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id: familyId } = await params

    // Check permission
    const hasAccess = await checkFamilyPermission(
      session.userId,
      familyId,
      PERMISSIONS.VIEW
    )
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const family = await prisma.family.findUnique({
      where: { id: familyId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
        kids: {
          select: {
            id: true,
            name: true,
            avatarColor: true,
            totalPoints: true,
            totalGems: true,
          },
        },
        _count: { select: { members: true, kids: true } },
      },
    })

    if (!family) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 })
    }

    // Get current user's membership
    const myMembership = await prisma.familyMember.findUnique({
      where: { userId_familyId: { userId: session.userId, familyId } },
    })

    return NextResponse.json({
      family,
      myRole: myMembership?.role,
      myPermissions: myMembership?.permissions,
    })
  } catch (error) {
    console.error("Get family error:", error)
    return NextResponse.json(
      { error: "Failed to get family" },
      { status: 500 }
    )
  }
}

// Update family
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id: familyId } = await params

    // Only primary parent or admin can update family
    const isPrimary = await isPrimaryParent(session.userId, familyId)
    if (!isPrimary && !session.isAdmin) {
      return NextResponse.json(
        { error: "Only primary parent can update family" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name } = body

    const family = await prisma.family.update({
      where: { id: familyId },
      data: {
        ...(name && { name: name.trim() }),
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
        _count: { select: { members: true, kids: true } },
      },
    })

    return NextResponse.json({
      success: true,
      family,
    })
  } catch (error) {
    console.error("Update family error:", error)
    return NextResponse.json(
      { error: "Failed to update family" },
      { status: 500 }
    )
  }
}

// Delete family (admin or primary parent only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id: familyId } = await params

    // Only primary parent or admin can delete family
    const isPrimary = await isPrimaryParent(session.userId, familyId)
    if (!isPrimary && !session.isAdmin) {
      return NextResponse.json(
        { error: "Only primary parent or admin can delete family" },
        { status: 403 }
      )
    }

    // Don't allow deleting default family
    const family = await prisma.family.findUnique({
      where: { id: familyId },
    })

    if (family?.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete the default family" },
        { status: 400 }
      )
    }

    // Delete family (cascades to members)
    await prisma.family.delete({
      where: { id: familyId },
    })

    return NextResponse.json({
      success: true,
      message: "Family deleted",
    })
  } catch (error) {
    console.error("Delete family error:", error)
    return NextResponse.json(
      { error: "Failed to delete family" },
      { status: 500 }
    )
  }
}
