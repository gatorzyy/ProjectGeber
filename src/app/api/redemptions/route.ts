import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const kidId = searchParams.get("kidId")
  const status = searchParams.get("status")

  const redemptions = await prisma.redemption.findMany({
    where: {
      ...(kidId && { kidId }),
      ...(status && { status }),
    },
    include: { kid: true, reward: true },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(redemptions)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  // Check if kid has enough points
  const kid = await prisma.kid.findUnique({ where: { id: body.kidId } })
  const reward = await prisma.reward.findUnique({ where: { id: body.rewardId } })

  if (!kid || !reward) {
    return NextResponse.json({ error: "Kid or reward not found" }, { status: 404 })
  }

  if (kid.totalPoints < reward.pointCost) {
    return NextResponse.json({ error: "Not enough points" }, { status: 400 })
  }

  const redemption = await prisma.redemption.create({
    data: {
      kidId: body.kidId,
      rewardId: body.rewardId,
      pointsSpent: reward.pointCost,
      status: "pending",
    },
    include: { reward: true },
  })

  return NextResponse.json(redemption, { status: 201 })
}
