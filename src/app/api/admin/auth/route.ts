import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  const body = await request.json()

  const settings = await prisma.adminSettings.findFirst()
  if (!settings) {
    return NextResponse.json({ error: "Admin not configured" }, { status: 500 })
  }

  const isValid = await bcrypt.compare(body.password, settings.passwordHash)
  if (!isValid) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 })
  }

  // Set session cookie
  const cookieStore = await cookies()
  cookieStore.set("admin_session", "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
  })

  return NextResponse.json({ success: true })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete("admin_session")
  return NextResponse.json({ success: true })
}

export async function GET() {
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")
  return NextResponse.json({ authenticated: session?.value === "authenticated" })
}
