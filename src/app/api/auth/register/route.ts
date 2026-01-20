import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { hashPassword, createSession, getAuthCookieOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      )
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
      },
    })

    // Get user agent from request
    const userAgent = request.headers.get("user-agent") || undefined

    // Create session
    const { refreshToken, accessToken } = await createSession(
      user.id,
      userAgent
    )

    // Check if there's a default family to claim
    const defaultFamily = await prisma.family.findFirst({
      where: { isDefault: true },
      include: {
        members: true,
        kids: { select: { id: true, name: true } },
      },
    })

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
      },
      accessToken,
      // Include info about default family if exists and has no primary parent
      canClaimDefaultFamily:
        defaultFamily &&
        defaultFamily.kids.length > 0 &&
        !defaultFamily.members.some((m) => m.role === "primary"),
      defaultFamilyKids: defaultFamily?.kids || [],
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
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    )
  }
}
