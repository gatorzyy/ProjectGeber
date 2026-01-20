import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSessionFromRequest } from "@/lib/auth"

// Disconnect Google Calendar
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Delete stored tokens
    await prisma.googleToken.delete({
      where: { userId: session.userId },
    }).catch(() => {
      // Ignore if not found
    })

    return NextResponse.json({
      success: true,
      message: "Google Calendar disconnected",
    })
  } catch (error) {
    console.error("Google disconnect error:", error)
    return NextResponse.json(
      { error: "Failed to disconnect Google Calendar" },
      { status: 500 }
    )
  }
}

// Check connection status
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const googleToken = await prisma.googleToken.findUnique({
      where: { userId: session.userId },
      select: {
        id: true,
        scope: true,
        expiresAt: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      connected: !!googleToken,
      expiresAt: googleToken?.expiresAt,
      connectedAt: googleToken?.createdAt,
    })
  } catch (error) {
    console.error("Google status error:", error)
    return NextResponse.json(
      { error: "Failed to check connection status" },
      { status: 500 }
    )
  }
}
