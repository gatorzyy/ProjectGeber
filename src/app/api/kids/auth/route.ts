import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { cookies } from "next/headers"

// Login kid with PIN
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { kidId, pin } = body

  const kid = await prisma.kid.findUnique({ where: { id: kidId } })
  if (!kid) {
    return NextResponse.json({ error: "Kid not found" }, { status: 404 })
  }

  // If kid has no PIN set, allow login (first time setup)
  if (!kid.pin) {
    const cookieStore = await cookies()
    cookieStore.set("kid_session", kidId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
    })
    return NextResponse.json({ success: true, needsPin: true })
  }

  // Verify PIN
  if (kid.pin !== pin) {
    return NextResponse.json({ error: "Wrong PIN" }, { status: 401 })
  }

  const cookieStore = await cookies()
  cookieStore.set("kid_session", kidId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
  })

  return NextResponse.json({ success: true })
}

// Set or update PIN
export async function PATCH(request: NextRequest) {
  const cookieStore = await cookies()
  const session = cookieStore.get("kid_session")

  if (!session?.value) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 })
  }

  const body = await request.json()
  const { pin } = body

  if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: "PIN must be 4 digits" }, { status: 400 })
  }

  await prisma.kid.update({
    where: { id: session.value },
    data: { pin },
  })

  return NextResponse.json({ success: true })
}

// Check current session
export async function GET() {
  const cookieStore = await cookies()
  const session = cookieStore.get("kid_session")

  if (!session?.value) {
    return NextResponse.json({ authenticated: false, kidId: null })
  }

  const kid = await prisma.kid.findUnique({
    where: { id: session.value },
    select: { id: true, name: true, pin: true }
  })

  if (!kid) {
    return NextResponse.json({ authenticated: false, kidId: null })
  }

  return NextResponse.json({
    authenticated: true,
    kidId: kid.id,
    kidName: kid.name,
    hasPin: !!kid.pin
  })
}

// Logout
export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete("kid_session")
  return NextResponse.json({ success: true })
}
