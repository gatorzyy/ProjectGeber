import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSessionFromRequest } from "@/lib/auth"
import { ROLE_DEFAULTS } from "@/lib/permissions"

// Get all families for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // If admin, can see all families
    if (session.isAdmin) {
      const families = await prisma.family.findMany({
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
        orderBy: { createdAt: "desc" },
      })
      return NextResponse.json({ families })
    }

    // For regular users, get their families
    const memberships = await prisma.familyMember.findMany({
      where: { userId: session.userId },
      include: {
        family: {
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
        },
      },
    })

    const families = memberships.map((m) => ({
      ...m.family,
      myRole: m.role,
      myPermissions: m.permissions,
    }))

    return NextResponse.json({ families })
  } catch (error) {
    console.error("Get families error:", error)
    return NextResponse.json(
      { error: "Failed to get families" },
      { status: 500 }
    )
  }
}

// Create a new family
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { name } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Family name is required" },
        { status: 400 }
      )
    }

    // Create family and add user as primary parent
    const family = await prisma.family.create({
      data: {
        name: name.trim(),
        members: {
          create: {
            userId: session.userId,
            role: "primary",
            permissions: ROLE_DEFAULTS.primary,
          },
        },
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
    console.error("Create family error:", error)
    return NextResponse.json(
      { error: "Failed to create family" },
      { status: 500 }
    )
  }
}
