import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// GET - Get streak for a kid
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    let streak = await prisma.streak.findUnique({
      where: { kidId: id },
    })

    // Create streak record if doesn't exist
    if (!streak) {
      streak = await prisma.streak.create({
        data: { kidId: id },
      })
    }

    return NextResponse.json(streak)
  } catch {
    return NextResponse.json({ error: "Failed to fetch streak" }, { status: 500 })
  }
}

// POST - Update streak (called when a task is completed)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let streak = await prisma.streak.findUnique({
      where: { kidId: id },
    })

    if (!streak) {
      streak = await prisma.streak.create({
        data: {
          kidId: id,
          currentStreak: 1,
          longestStreak: 1,
          lastActiveDate: today,
        },
      })
      return NextResponse.json(streak)
    }

    const lastActive = streak.lastActiveDate ? new Date(streak.lastActiveDate) : null
    if (lastActive) {
      lastActive.setHours(0, 0, 0, 0)
    }

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    let newStreak = streak.currentStreak

    if (lastActive) {
      const lastActiveTime = lastActive.getTime()
      const todayTime = today.getTime()
      const yesterdayTime = yesterday.getTime()

      if (lastActiveTime === todayTime) {
        // Already active today, no change
        return NextResponse.json(streak)
      } else if (lastActiveTime === yesterdayTime) {
        // Consecutive day, increment streak
        newStreak = streak.currentStreak + 1
      } else {
        // Streak broken, start over
        newStreak = 1
      }
    } else {
      newStreak = 1
    }

    const updatedStreak = await prisma.streak.update({
      where: { kidId: id },
      data: {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, streak.longestStreak),
        lastActiveDate: today,
      },
    })

    return NextResponse.json(updatedStreak)
  } catch {
    return NextResponse.json({ error: "Failed to update streak" }, { status: 500 })
  }
}

// PATCH - Claim streak bonus
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { bonusType } = body // "week", "month", or "quarter"

    const streak = await prisma.streak.findUnique({
      where: { kidId: id },
    })

    if (!streak) {
      return NextResponse.json({ error: "Streak not found" }, { status: 404 })
    }

    // Bonus configuration
    const bonusConfig = {
      week: { days: 7, points: 50, field: "weekBonus" },
      month: { days: 30, points: 150, field: "monthBonus" },
      quarter: { days: 90, points: 500, field: "quarterBonus" },
    }

    const config = bonusConfig[bonusType as keyof typeof bonusConfig]
    if (!config) {
      return NextResponse.json({ error: "Invalid bonus type" }, { status: 400 })
    }

    // Check if eligible
    if (streak.currentStreak < config.days) {
      return NextResponse.json({ error: `Need ${config.days} day streak` }, { status: 400 })
    }

    // Check if already claimed
    if (streak[config.field as keyof typeof streak]) {
      return NextResponse.json({ error: "Bonus already claimed" }, { status: 400 })
    }

    // Award bonus and mark as claimed
    await prisma.$transaction([
      prisma.streak.update({
        where: { kidId: id },
        data: { [config.field]: true },
      }),
      prisma.kid.update({
        where: { id },
        data: { totalPoints: { increment: config.points } },
      }),
      prisma.pointLog.create({
        data: {
          kidId: id,
          oldPoints: 0, // Will be updated by trigger if needed
          newPoints: config.points,
          reason: `${config.days}-day streak bonus!`,
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      bonusPoints: config.points,
      message: `Congratulations! You earned ${config.points} bonus points!`
    })
  } catch {
    return NextResponse.json({ error: "Failed to claim bonus" }, { status: 500 })
  }
}
