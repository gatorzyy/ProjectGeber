import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  const rewards = await prisma.reward.findMany({
    where: { isActive: true },
    orderBy: { pointCost: "asc" },
  })
  return NextResponse.json(rewards)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const reward = await prisma.reward.create({
    data: {
      name: body.name,
      description: body.description,
      pointCost: body.pointCost,
      imageUrl: body.imageUrl,
    },
  })
  return NextResponse.json(reward, { status: 201 })
}
