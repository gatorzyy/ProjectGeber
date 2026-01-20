import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// PATCH - Update reward request status (approve/reject)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, parentNote, pointCost } = body

    const rewardRequest = await prisma.rewardRequest.update({
      where: { id },
      data: {
        status,
        parentNote: parentNote || null,
      },
      include: { kid: true },
    })

    // If approved, create the actual reward
    if (status === "approved") {
      await prisma.reward.create({
        data: {
          name: rewardRequest.name,
          description: rewardRequest.description,
          pointCost: pointCost || rewardRequest.suggestedCost,
          isActive: true,
        },
      })
    }

    return NextResponse.json(rewardRequest)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update reward request" }, { status: 500 })
  }
}

// DELETE - Delete a reward request
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.rewardRequest.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete reward request" }, { status: 500 })
  }
}
