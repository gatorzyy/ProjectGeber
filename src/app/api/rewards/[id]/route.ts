import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const reward = await prisma.reward.findUnique({ where: { id } })
  if (!reward) {
    return NextResponse.json({ error: "Reward not found" }, { status: 404 })
  }
  return NextResponse.json(reward)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const reward = await prisma.reward.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      pointCost: body.pointCost,
      imageUrl: body.imageUrl,
      isActive: body.isActive,
    },
  })
  return NextResponse.json(reward)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.reward.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
