import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSessionFromRequest } from "@/lib/auth"
import { ROLE_DEFAULTS } from "@/lib/permissions"

// Join a family using invite code
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
    const body = await request.json()
    const { inviteCode, role } = body

    // Find family
    const family = await prisma.family.findUnique({
      where: { id: familyId },
    })

    if (!family) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 })
    }

    // Verify invite code
    if (family.inviteCode !== inviteCode) {
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 400 }
      )
    }

    // Check if already a member
    const existingMember = await prisma.familyMember.findUnique({
      where: { userId_familyId: { userId: session.userId, familyId } },
    })

    if (existingMember) {
      return NextResponse.json(
        { error: "You are already a member of this family" },
        { status: 409 }
      )
    }

    // Validate role (default to parent if not specified)
    const validRoles = ["parent", "guardian", "grandparent"]
    const memberRole = validRoles.includes(role) ? role : "parent"

    // Create membership
    const member = await prisma.familyMember.create({
      data: {
        userId: session.userId,
        familyId,
        role: memberRole,
        permissions: ROLE_DEFAULTS[memberRole] || "view",
      },
      include: {
        family: {
          include: {
            kids: {
              select: { id: true, name: true, avatarColor: true },
            },
            _count: { select: { members: true, kids: true } },
          },
        },
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      member,
      family: member.family,
    })
  } catch (error) {
    console.error("Join family error:", error)
    return NextResponse.json(
      { error: "Failed to join family" },
      { status: 500 }
    )
  }
}
