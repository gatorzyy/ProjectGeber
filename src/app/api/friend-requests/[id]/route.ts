import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// PATCH - Accept or reject a friend request
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { status } = body // "accepted" or "rejected"

  if (!["accepted", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  const updated = await prisma.friendRequest.update({
    where: { id },
    data: { status },
  })

  return NextResponse.json(updated)
}

// DELETE - Cancel/remove a friend request or unfriend
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  await prisma.friendRequest.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
