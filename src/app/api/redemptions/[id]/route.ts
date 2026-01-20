import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const redemption = await prisma.redemption.findUnique({
    where: { id },
    include: { kid: true },
  })

  if (!redemption) {
    return NextResponse.json({ error: "Redemption not found" }, { status: 404 })
  }

  // If approving, deduct points from kid
  if (body.status === "approved" && redemption.status === "pending") {
    await prisma.kid.update({
      where: { id: redemption.kidId },
      data: { totalPoints: { decrement: redemption.pointsSpent } },
    })
  }

  // If rejecting a previously approved redemption, refund points
  if (body.status === "rejected" && redemption.status === "approved") {
    await prisma.kid.update({
      where: { id: redemption.kidId },
      data: { totalPoints: { increment: redemption.pointsSpent } },
    })
  }

  const updated = await prisma.redemption.update({
    where: { id },
    data: { status: body.status },
    include: { kid: true, reward: true },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.redemption.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
