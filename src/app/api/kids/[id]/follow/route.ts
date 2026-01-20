import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// GET - Get follow status and followers/following lists
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const viewerId = searchParams.get("viewerId")

  const kid = await prisma.kid.findUnique({
    where: { id },
    include: {
      following: {
        include: { following: { select: { id: true, name: true, avatarColor: true, totalPoints: true } } }
      },
      followers: {
        include: { follower: { select: { id: true, name: true, avatarColor: true, totalPoints: true } } }
      },
    },
  })

  if (!kid) {
    return NextResponse.json({ error: "Kid not found" }, { status: 404 })
  }

  // Check if viewer is following this kid
  let isFollowing = false
  if (viewerId) {
    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: viewerId, followingId: id } }
    })
    isFollowing = !!follow
  }

  return NextResponse.json({
    following: kid.following.map(f => f.following),
    followers: kid.followers.map(f => f.follower),
    followingCount: kid.following.length,
    followersCount: kid.followers.length,
    isFollowing,
  })
}

// POST - Follow a kid
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: followingId } = await params
  const body = await request.json()
  const { followerId } = body

  if (!followerId || followerId === followingId) {
    return NextResponse.json({ error: "Invalid follow request" }, { status: 400 })
  }

  // Check if already following
  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } }
  })

  if (existing) {
    return NextResponse.json({ error: "Already following" }, { status: 400 })
  }

  const follow = await prisma.follow.create({
    data: { followerId, followingId },
  })

  return NextResponse.json(follow)
}

// DELETE - Unfollow a kid
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: followingId } = await params
  const { searchParams } = new URL(request.url)
  const followerId = searchParams.get("followerId")

  if (!followerId) {
    return NextResponse.json({ error: "followerId required" }, { status: 400 })
  }

  await prisma.follow.deleteMany({
    where: { followerId, followingId }
  })

  return NextResponse.json({ success: true })
}
