import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Star, Gem } from "lucide-react"
import { RewardsList } from "./RewardsList"
import { BugReportButton } from "@/components"

export default async function KidRewardsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const kid = await prisma.kid.findUnique({
    where: { id },
    include: {
      redemptions: {
        include: { reward: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      rewardRequests: {
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!kid) {
    notFound()
  }

  const rewards = await prisma.reward.findMany({
    where: { isActive: true },
    orderBy: { pointCost: "asc" },
  })

  const settings = await prisma.adminSettings.findFirst()
  const gemRatio = settings?.gemPointsRatio || 10
  const gems = Math.floor(kid.totalPoints / gemRatio)
  const stars = kid.totalPoints % gemRatio

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="mb-8">
        <Link href={`/kid/${id}`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tasks
          </Button>
        </Link>

        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md"
            style={{ backgroundColor: kid.avatarColor }}
          >
            {kid.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold">Rewards Shop</h1>
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center gap-1">
                <Gem className="w-6 h-6 fill-purple-500 text-purple-600" />
                <span className="font-bold text-purple-600 text-xl">{gems}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
                <span className="font-bold text-amber-600 text-xl">{stars}</span>
              </div>
              <span className="text-muted-foreground">({kid.totalPoints} pts)</span>
            </div>
          </div>
        </div>
      </header>

      <RewardsList
        rewards={rewards}
        kidId={kid.id}
        kidPoints={kid.totalPoints}
        recentRedemptions={kid.redemptions}
        rewardRequests={kid.rewardRequests}
      />

      <BugReportButton page={`/kid/${id}/rewards`} userType="kid" userId={id} />
    </div>
  )
}
