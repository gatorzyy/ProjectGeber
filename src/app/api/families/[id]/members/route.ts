import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSessionFromRequest } from "@/lib/auth"
import {
  checkFamilyPermission,
  PERMISSIONS,
  ROLE_DEFAULTS,
  isPrimaryParent,
} from "@/lib/permissions"

// Get all members of a family
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

    const members = await prisma.familyMember.findMany({
      where: { familyId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [
        { role: "asc" }, // Primary first
        { joinedAt: "asc" },
      ],
    })

    return NextResponse.json({ members })
  } catch (error) {
    console.error("Get members error:", error)
    return NextResponse.json(
      { error: "Failed to get members" },
      { status: 500 }
    )
  }
}

// Invite a new member to the family
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id: familyId } = await params

    // Only primary parent or admin can invite members
    const isPrimary = await isPrimaryParent(session.userId, familyId)
    if (!isPrimary && !session.isAdmin) {
      return NextResponse.json(
        { error: "Only primary parent can invite members" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, role, permissions } = body

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found. They need to register first." },
        { status: 404 }
      )
    }

    // Check if already a member
    const existingMember = await prisma.familyMember.findUnique({
      where: { userId_familyId: { userId: user.id, familyId } },
    })

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this family" },
        { status: 409 }
      )
    }

    // Validate role
    const validRoles = ["parent", "guardian", "grandparent"]
    const memberRole = validRoles.includes(role) ? role : "parent"

    // Use provided permissions or default for role
    const memberPermissions = permissions || ROLE_DEFAULTS[memberRole] || "view"

    // Create membership
    const member = await prisma.familyMember.create({
      data: {
        userId: user.id,
        familyId,
        role: memberRole,
        permissions: memberPermissions,
        invitedBy: session.userId,
      },
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
    console.error("Invite member error:", error)
    return NextResponse.json(
      { error: "Failed to invite member" },
      { status: 500 }
    )
  }
}
