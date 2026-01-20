import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSessionFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)

    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Get full user profile with family memberships
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        isAdmin: true,
        emailVerified: true,
        createdAt: true,
        familyMembers: {
          include: {
            family: {
              include: {
                kids: {
                  select: {
                    id: true,
                    name: true,
                    avatarColor: true,
                    totalPoints: true,
                  },
                },
                _count: {
                  select: {
                    members: true,
                    kids: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        isAdmin: user.isAdmin,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
      families: user.familyMembers.map((membership) => ({
        id: membership.family.id,
        name: membership.family.name,
        role: membership.role,
        permissions: membership.permissions,
        joinedAt: membership.joinedAt,
        kids: membership.family.kids,
        membersCount: membership.family._count.members,
        kidsCount: membership.family._count.kids,
      })),
      currentFamilyId: session.currentFamilyId,
    })
  } catch (error) {
    console.error("Get user profile error:", error)
    return NextResponse.json(
      { error: "Failed to get user profile" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)

    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, avatarUrl } = body

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: {
        ...(name && { name }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        isAdmin: true,
        emailVerified: true,
      },
    })

    return NextResponse.json({
      success: true,
      user: updatedUser,
    })
  } catch (error) {
    console.error("Update user profile error:", error)
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
}
