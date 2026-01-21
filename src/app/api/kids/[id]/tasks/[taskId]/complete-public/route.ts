import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// Complete task via public access link (no auth required)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id: kidId, taskId } = await params

    // Parse form data
    const formData = await request.formData()
    const accessToken = formData.get("accessToken") as string
    const completionNote = formData.get("completionNote") as string
    const feedbackRequested = formData.get("feedbackRequested") === "true"
    const proofImage = formData.get("proofImage") as File | null

    if (!accessToken) {
      return NextResponse.json(
        { error: "Access token required" },
        { status: 401 }
      )
    }

    // Verify kid and access token
    const kid = await prisma.kid.findFirst({
      where: {
        id: kidId,
        accessToken: accessToken,
        accessTokenEnabled: true,
      },
    })

    if (!kid) {
      return NextResponse.json({ error: "Invalid access token" }, { status: 403 })
    }

    // Check if token is expired
    if (kid.accessTokenExpiry && new Date(kid.accessTokenExpiry) < new Date()) {
      return NextResponse.json(
        { error: "Access link has expired" },
        { status: 403 }
      )
    }

    // Get the task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    })

    if (!task || task.kidId !== kidId) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    if (task.isCompleted) {
      return NextResponse.json(
        { error: "Task is already completed" },
        { status: 400 }
      )
    }

    // Handle proof image upload (simplified - in production, upload to cloud storage)
    let proofImageUrl: string | null = null
    if (proofImage) {
      // For now, we'll skip the actual upload and just note that proof was provided
      // In production, you'd upload to S3/Cloudinary/etc.
      proofImageUrl = `proof_${taskId}_${Date.now()}`
    }

    // Update task as completed
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        isCompleted: true,
        completedAt: new Date(),
        completionNote: completionNote || null,
        feedbackRequested,
        proofImageUrl,
      },
    })

    // Add points to kid
    await prisma.kid.update({
      where: { id: kidId },
      data: {
        totalPoints: { increment: task.pointValue },
      },
    })

    // Log the point change
    await prisma.pointLog.create({
      data: {
        kidId,
        oldPoints: kid.totalPoints,
        newPoints: kid.totalPoints + task.pointValue,
        reason: `Completed task: ${task.title}`,
      },
    })

    // Update streak
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const streak = await prisma.streak.findUnique({
      where: { kidId },
    })

    if (streak) {
      const lastActive = streak.lastActiveDate
        ? new Date(streak.lastActiveDate)
        : null

      if (lastActive) {
        lastActive.setHours(0, 0, 0, 0)
        const diffDays = Math.floor(
          (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
        )

        if (diffDays === 1) {
          // Continue streak
          await prisma.streak.update({
            where: { kidId },
            data: {
              currentStreak: { increment: 1 },
              longestStreak: Math.max(
                streak.longestStreak,
                streak.currentStreak + 1
              ),
              lastActiveDate: today,
            },
          })
        } else if (diffDays > 1) {
          // Reset streak
          await prisma.streak.update({
            where: { kidId },
            data: {
              currentStreak: 1,
              lastActiveDate: today,
            },
          })
        }
        // If diffDays === 0, already active today, no update needed
      }
    } else {
      // Create new streak
      await prisma.streak.create({
        data: {
          kidId,
          currentStreak: 1,
          longestStreak: 1,
          lastActiveDate: today,
        },
      })
    }

    return NextResponse.json({
      success: true,
      task: updatedTask,
      pointsEarned: task.pointValue,
    })
  } catch (error) {
    console.error("Complete task error:", error)
    return NextResponse.json(
      { error: "Failed to complete task" },
      { status: 500 }
    )
  }
}
