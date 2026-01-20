import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSessionFromRequest } from "@/lib/auth"
import { ROLE_DEFAULTS } from "@/lib/permissions"

// Claim the default family and become primary parent
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Find the default family
    const defaultFamily = await prisma.family.findFirst({
      where: { isDefault: true },
      include: {
        members: true,
        kids: {
          select: { id: true, name: true, avatarColor: true, totalPoints: true },
        },
      },
    })

    if (!defaultFamily) {
      return NextResponse.json(
        { error: "No default family exists" },
        { status: 404 }
      )
    }

    // Check if it already has a primary parent
    const hasPrimaryParent = defaultFamily.members.some(
      (m) => m.role === "primary"
    )

    if (hasPrimaryParent) {
      return NextResponse.json(
        { error: "Default family already has a primary parent" },
        { status: 409 }
      )
    }

    // Check if default family has kids to claim
    if (defaultFamily.kids.length === 0) {
      return NextResponse.json(
        { error: "Default family has no kids to claim" },
        { status: 400 }
      )
    }

    // Check if user is already a member
    const existingMember = await prisma.familyMember.findUnique({
      where: {
        userId_familyId: { userId: session.userId, familyId: defaultFamily.id },
      },
    })

    if (existingMember) {
      // Update to primary parent
      await prisma.familyMember.update({
        where: { id: existingMember.id },
        data: {
          role: "primary",
          permissions: ROLE_DEFAULTS.primary,
        },
      })
    } else {
      // Add as primary parent
      await prisma.familyMember.create({
        data: {
          userId: session.userId,
          familyId: defaultFamily.id,
          role: "primary",
          permissions: ROLE_DEFAULTS.primary,
        },
      })
    }

    // Get updated family with members
    const family = await prisma.family.findUnique({
      where: { id: defaultFamily.id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
        kids: {
          select: { id: true, name: true, avatarColor: true, totalPoints: true },
        },
        _count: { select: { members: true, kids: true } },
      },
    })

    return NextResponse.json({
      success: true,
      message: "Successfully claimed default family",
      family,
    })
  } catch (error) {
    console.error("Claim default family error:", error)
    return NextResponse.json(
      { error: "Failed to claim default family" },
      { status: 500 }
    )
  }
}
