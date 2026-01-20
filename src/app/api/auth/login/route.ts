import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyPassword, createSession, getAuthCookieOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    // Get user agent from request
    const userAgent = request.headers.get("user-agent") || undefined

    // Create session
    const { refreshToken, accessToken } = await createSession(
      user.id,
      userAgent
    )

    // Get user's families
    const familyMemberships = await prisma.familyMember.findMany({
      where: { userId: user.id },
      include: {
        family: {
          include: {
            kids: { select: { id: true, name: true } },
            _count: { select: { members: true, kids: true } },
          },
        },
      },
    })

    // Check if there's a default family to claim (if user has no families)
    let canClaimDefaultFamily = false
    let defaultFamilyKids: { id: string; name: string }[] = []

    if (familyMemberships.length === 0) {
      const defaultFamily = await prisma.family.findFirst({
        where: { isDefault: true },
        include: {
          members: true,
          kids: { select: { id: true, name: true } },
        },
      })

      if (
        defaultFamily &&
        defaultFamily.kids.length > 0 &&
        !defaultFamily.members.some((m) => m.role === "primary")
      ) {
        canClaimDefaultFamily = true
        defaultFamilyKids = defaultFamily.kids
      }
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
      },
      accessToken,
      families: familyMemberships.map((m) => ({
        id: m.family.id,
        name: m.family.name,
        role: m.role,
        permissions: m.permissions,
        kidsCount: m.family._count.kids,
        membersCount: m.family._count.members,
      })),
      canClaimDefaultFamily,
      defaultFamilyKids,
    })

    // Set cookies
    response.cookies.set("access_token", accessToken, getAuthCookieOptions())
    response.cookies.set(
      "refresh_token",
      refreshToken,
      getAuthCookieOptions(true)
    )

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Failed to login" },
      { status: 500 }
    )
  }
}
