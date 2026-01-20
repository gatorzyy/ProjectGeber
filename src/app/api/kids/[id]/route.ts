import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const kid = await prisma.kid.findUnique({
    where: { id },
    include: {
      tasks: { orderBy: { createdAt: "desc" } },
      redemptions: {
        include: { reward: true },
        orderBy: { createdAt: "desc" },
      },
    },
  })
  if (!kid) {
    return NextResponse.json({ error: "Kid not found" }, { status: 404 })
  }
  return NextResponse.json(kid)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  // If points are being changed with a reason, log it
  if (body.totalPoints !== undefined && body.pointEditReason) {
    const currentKid = await prisma.kid.findUnique({ where: { id } })
    if (currentKid && currentKid.totalPoints !== body.totalPoints) {
      await prisma.pointLog.create({
        data: {
          kidId: id,
          oldPoints: currentKid.totalPoints,
          newPoints: body.totalPoints,
          reason: body.pointEditReason,
        },
      })
    }
  }

  const kid = await prisma.kid.update({
    where: { id },
    data: {
      name: body.name,
      avatarColor: body.avatarColor,
      avatarUrl: body.avatarUrl,
      motto: body.motto,
      totalPoints: body.totalPoints,
      familyId: body.familyId !== undefined ? body.familyId : undefined,
      accessToken: body.accessToken !== undefined ? body.accessToken : undefined,
      accessTokenEnabled: body.accessTokenEnabled !== undefined ? body.accessTokenEnabled : undefined,
      accessTokenExpiry: body.accessTokenExpiry !== undefined ? body.accessTokenExpiry : undefined,
    },
  })
  return NextResponse.json(kid)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.kid.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
