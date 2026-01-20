import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import KidAccessClient from "./KidAccessClient"

interface Props {
  params: Promise<{ token: string }>
}

export default async function KidAccessPage({ params }: Props) {
  const { token } = await params

  // Find kid by access token
  const kid = await prisma.kid.findFirst({
    where: {
      accessToken: token,
      accessTokenEnabled: true,
    },
    include: {
      tasks: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      streak: true,
    },
  })

  if (!kid) {
    notFound()
  }

  // Check if token is expired
  if (kid.accessTokenExpiry && new Date(kid.accessTokenExpiry) < new Date()) {
    notFound()
  }

  // Fetch rewards separately (they are global, not per-kid)
  const rewards = await prisma.reward.findMany({
    where: { isActive: true },
    orderBy: { pointCost: "asc" },
  })

  return (
    <KidAccessClient
      kid={{
        id: kid.id,
        name: kid.name,
        avatarColor: kid.avatarColor,
        totalPoints: kid.totalPoints,
        totalGems: kid.totalGems,
      }}
      tasks={kid.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        pointValue: t.pointValue,
        isCompleted: t.isCompleted,
        dueDate: t.dueDate?.toISOString() || null,
        isRecurring: t.isRecurring,
        recurringType: t.recurringType,
        completedAt: t.completedAt?.toISOString() || null,
      }))}
      rewards={rewards.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        pointCost: r.pointCost,
        imageUrl: r.imageUrl,
      }))}
      streak={kid.streak ? {
        currentStreak: kid.streak.currentStreak,
        longestStreak: kid.streak.longestStreak,
      } : null}
      accessToken={token}
    />
  )
}

export async function generateMetadata({ params }: Props) {
  const { token } = await params
  const kid = await prisma.kid.findFirst({
    where: {
      accessToken: token,
      accessTokenEnabled: true,
    },
    select: { name: true },
  })

  return {
    title: kid ? `${kid.name}'s Dashboard - Little Alchimist` : "Access Link",
  }
}
