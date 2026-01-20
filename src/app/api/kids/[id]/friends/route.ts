import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// GET - Get friends and friend requests
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Get accepted friend requests (both sent and received)
  const sentAccepted = await prisma.friendRequest.findMany({
    where: { requesterId: id, status: "accepted" },
    include: { recipient: { select: { id: true, name: true, avatarColor: true, totalPoints: true } } }
  })

  const receivedAccepted = await prisma.friendRequest.findMany({
    where: { recipientId: id, status: "accepted" },
    include: { requester: { select: { id: true, name: true, avatarColor: true, totalPoints: true } } }
  })

  // Get pending requests received
  const pendingReceived = await prisma.friendRequest.findMany({
    where: { recipientId: id, status: "pending" },
    include: { requester: { select: { id: true, name: true, avatarColor: true, totalPoints: true } } }
  })

  // Get pending requests sent
  const pendingSent = await prisma.friendRequest.findMany({
    where: { requesterId: id, status: "pending" },
    include: { recipient: { select: { id: true, name: true, avatarColor: true, totalPoints: true } } }
  })

  const friends = [
    ...sentAccepted.map(r => r.recipient),
    ...receivedAccepted.map(r => r.requester),
  ]

  return NextResponse.json({
    friends,
    pendingReceived: pendingReceived.map(r => ({ ...r.requester, requestId: r.id })),
    pendingSent: pendingSent.map(r => ({ ...r.recipient, requestId: r.id })),
  })
}

// POST - Send a friend request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: recipientId } = await params
  const body = await request.json()
  const { requesterId } = body

  if (!requesterId || requesterId === recipientId) {
    return NextResponse.json({ error: "Invalid friend request" }, { status: 400 })
  }

  // Check if request already exists (in either direction)
  const existing = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { requesterId, recipientId },
        { requesterId: recipientId, recipientId: requesterId },
      ]
    }
  })

  if (existing) {
    // If there's a pending request from the other person, accept it
    if (existing.requesterId === recipientId && existing.status === "pending") {
      const updated = await prisma.friendRequest.update({
        where: { id: existing.id },
        data: { status: "accepted" },
      })
      return NextResponse.json({ ...updated, autoAccepted: true })
    }
    return NextResponse.json({ error: "Request already exists", status: existing.status }, { status: 400 })
  }

  const friendRequest = await prisma.friendRequest.create({
    data: { requesterId, recipientId },
  })

  return NextResponse.json(friendRequest)
}
