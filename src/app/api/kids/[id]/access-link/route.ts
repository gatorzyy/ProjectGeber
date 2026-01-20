import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSessionFromRequest } from "@/lib/auth"
import { checkKidAccess, PERMISSIONS } from "@/lib/permissions"
import { nanoid } from "nanoid"

// Generate or regenerate access token
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id: kidId } = await params

    // Check if user has manage permission for this kid
    const hasAccess = await checkKidAccess(
      session.userId,
      kidId,
      PERMISSIONS.MANAGE
    )
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { expiresInDays } = body

    // Generate new access token
    const accessToken = nanoid(32)
    const accessTokenExpiry = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null

    const kid = await prisma.kid.update({
      where: { id: kidId },
      data: {
        accessToken,
        accessTokenExpiry,
        accessTokenEnabled: true,
      },
      select: {
        id: true,
        name: true,
        accessToken: true,
        accessTokenExpiry: true,
        accessTokenEnabled: true,
      },
    })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const shareableLink = `${baseUrl}/kid/access/${kid.accessToken}`

    return NextResponse.json({
      success: true,
      accessToken: kid.accessToken,
      accessTokenExpiry: kid.accessTokenExpiry,
      accessTokenEnabled: kid.accessTokenEnabled,
      shareableLink,
    })
  } catch (error) {
    console.error("Generate access link error:", error)
    return NextResponse.json(
      { error: "Failed to generate access link" },
      { status: 500 }
    )
  }
}

// Update access token settings (enable/disable, set expiry)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id: kidId } = await params

    // Check if user has manage permission for this kid
    const hasAccess = await checkKidAccess(
      session.userId,
      kidId,
      PERMISSIONS.MANAGE
    )
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { enabled, expiresInDays } = body

    const updateData: {
      accessTokenEnabled?: boolean
      accessTokenExpiry?: Date | null
    } = {}

    if (typeof enabled === "boolean") {
      updateData.accessTokenEnabled = enabled
    }

    if (expiresInDays !== undefined) {
      updateData.accessTokenExpiry = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null
    }

    const kid = await prisma.kid.update({
      where: { id: kidId },
      data: updateData,
      select: {
        id: true,
        name: true,
        accessToken: true,
        accessTokenExpiry: true,
        accessTokenEnabled: true,
      },
    })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const shareableLink = kid.accessToken
      ? `${baseUrl}/kid/access/${kid.accessToken}`
      : null

    return NextResponse.json({
      success: true,
      accessToken: kid.accessToken,
      accessTokenExpiry: kid.accessTokenExpiry,
      accessTokenEnabled: kid.accessTokenEnabled,
      shareableLink,
    })
  } catch (error) {
    console.error("Update access link error:", error)
    return NextResponse.json(
      { error: "Failed to update access link" },
      { status: 500 }
    )
  }
}

// Remove access token
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id: kidId } = await params

    // Check if user has manage permission for this kid
    const hasAccess = await checkKidAccess(
      session.userId,
      kidId,
      PERMISSIONS.MANAGE
    )
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    await prisma.kid.update({
      where: { id: kidId },
      data: {
        accessToken: null,
        accessTokenExpiry: null,
        accessTokenEnabled: false,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Access link removed",
    })
  } catch (error) {
    console.error("Remove access link error:", error)
    return NextResponse.json(
      { error: "Failed to remove access link" },
      { status: 500 }
    )
  }
}

// Get current access link status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id: kidId } = await params

    // Check if user has view permission for this kid
    const hasAccess = await checkKidAccess(
      session.userId,
      kidId,
      PERMISSIONS.VIEW
    )
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    const kid = await prisma.kid.findUnique({
      where: { id: kidId },
      select: {
        id: true,
        name: true,
        accessToken: true,
        accessTokenExpiry: true,
        accessTokenEnabled: true,
      },
    })

    if (!kid) {
      return NextResponse.json({ error: "Kid not found" }, { status: 404 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const shareableLink = kid.accessToken
      ? `${baseUrl}/kid/access/${kid.accessToken}`
      : null

    return NextResponse.json({
      hasAccessLink: !!kid.accessToken,
      accessTokenEnabled: kid.accessTokenEnabled,
      accessTokenExpiry: kid.accessTokenExpiry,
      shareableLink: kid.accessTokenEnabled ? shareableLink : null,
    })
  } catch (error) {
    console.error("Get access link error:", error)
    return NextResponse.json(
      { error: "Failed to get access link status" },
      { status: 500 }
    )
  }
}
