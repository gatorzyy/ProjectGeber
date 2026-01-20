import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  const kids = await prisma.kid.findMany({
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json(kids)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const kid = await prisma.kid.create({
    data: {
      name: body.name,
      avatarColor: body.avatarColor || "#8B5CF6",
      familyId: body.familyId || null,
      pin: body.pin || null,
    },
  })
  return NextResponse.json(kid, { status: 201 })
}
