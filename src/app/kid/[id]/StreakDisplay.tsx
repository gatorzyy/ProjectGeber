"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Flame, Trophy, Star, Gem, Gift } from "lucide-react"
import { streakApi } from "@/lib/api"

interface StreakProps {
  kidId: string
  streak: {
    id: string
    kidId: string
    currentStreak: number
    longestStreak: number
    lastActiveDate: string | null
    weekBonus: boolean
    monthBonus: boolean
    quarterBonus: boolean
  } | null
}

const MILESTONES = [
  { days: 7, bonus: 50, label: "Week", claimed: "weekBonus" as const, icon: Star },
  { days: 30, bonus: 150, label: "Month", claimed: "monthBonus" as const, icon: Gem },
  { days: 90, bonus: 500, label: "Quarter", claimed: "quarterBonus" as const, icon: Trophy },
]

export function StreakDisplay({ kidId, streak }: StreakProps) {
  const [isClaimingBonus, setIsClaimingBonus] = useState<string | null>(null)
  const [claimMessage, setClaimMessage] = useState<string | null>(null)
  const router = useRouter()

  const currentStreak = streak?.currentStreak || 0
  const longestStreak = streak?.longestStreak || 0

  const handleClaimBonus = async (bonusType: "week" | "month" | "quarter") => {
    setIsClaimingBonus(bonusType)
    setClaimMessage(null)

    try {
      const result = await streakApi.claimBonus(kidId, bonusType)
      setClaimMessage(result.message)
      router.refresh()
    } catch (error) {
      console.error("Failed to claim bonus:", error)
      setClaimMessage("Failed to claim bonus. Please try again.")
    } finally {
      setIsClaimingBonus(null)
    }
  }

  // Find next milestone
  const nextMilestone = MILESTONES.find((m) => currentStreak < m.days)
  const progress = nextMilestone
    ? Math.min((currentStreak / nextMilestone.days) * 100, 100)
    : 100

  // Check for claimable bonuses
  const claimableBonuses = MILESTONES.filter(
    (m) => currentStreak >= m.days && streak && !streak[m.claimed]
  )

  return (
    <Card className="mb-6 overflow-hidden">
      <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Flame className={`w-10 h-10 ${currentStreak > 0 ? "animate-pulse" : "opacity-50"}`} />
              {currentStreak > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-orange-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {currentStreak}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg">
                {currentStreak > 0 ? `${currentStreak} Day Streak!` : "Start Your Streak!"}
              </h3>
              <p className="text-orange-100 text-sm">
                {currentStreak > 0
                  ? "Keep completing tasks daily!"
                  : "Complete tasks every day to build a streak"}
              </p>
            </div>
          </div>
          {longestStreak > 0 && (
            <div className="text-right">
              <p className="text-xs text-orange-100">Best Streak</p>
              <p className="font-bold flex items-center gap-1">
                <Trophy className="w-4 h-4" />
                {longestStreak} days
              </p>
            </div>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        {/* Progress to next milestone */}
        {nextMilestone && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">
                Progress to {nextMilestone.label} Bonus
              </span>
              <span className="font-medium">
                {currentStreak}/{nextMilestone.days} days
              </span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <Gift className="w-3 h-3 inline mr-1" />
              Earn <strong>{nextMilestone.bonus}</strong> bonus points at {nextMilestone.days} days!
            </p>
          </div>
        )}

        {/* Claimable Bonuses */}
        {claimableBonuses.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-sm font-medium text-green-600">
              You have bonuses to claim!
            </p>
            {claimableBonuses.map((milestone) => (
              <div
                key={milestone.label}
                className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200"
              >
                <div className="flex items-center gap-2">
                  <milestone.icon className="w-5 h-5 text-green-600" />
                  <span className="font-medium">{milestone.label} Streak Bonus</span>
                  <Badge className="bg-green-500">+{milestone.bonus} pts</Badge>
                </div>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isClaimingBonus !== null}
                  onClick={() =>
                    handleClaimBonus(
                      milestone.claimed.replace("Bonus", "") as "week" | "month" | "quarter"
                    )
                  }
                >
                  {isClaimingBonus === milestone.claimed.replace("Bonus", "")
                    ? "Claiming..."
                    : "Claim!"}
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Claim Message */}
        {claimMessage && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-center mb-4">
            <p className="text-amber-800">{claimMessage}</p>
          </div>
        )}

        {/* Milestone Overview */}
        <div className="grid grid-cols-3 gap-2">
          {MILESTONES.map((milestone) => {
            const Icon = milestone.icon
            const isAchieved = currentStreak >= milestone.days
            const isClaimed = streak ? streak[milestone.claimed] : false

            return (
              <div
                key={milestone.label}
                className={`p-3 rounded-lg text-center border ${
                  isAchieved
                    ? isClaimed
                      ? "bg-purple-50 border-purple-200"
                      : "bg-green-50 border-green-200 animate-pulse"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <Icon
                  className={`w-6 h-6 mx-auto mb-1 ${
                    isAchieved
                      ? isClaimed
                        ? "text-purple-500"
                        : "text-green-500"
                      : "text-gray-400"
                  }`}
                />
                <p className="text-xs font-medium">{milestone.label}</p>
                <p className="text-xs text-muted-foreground">{milestone.days} days</p>
                <Badge
                  variant="secondary"
                  className={`mt-1 text-xs ${
                    isAchieved
                      ? isClaimed
                        ? "bg-purple-100 text-purple-700"
                        : "bg-green-100 text-green-700"
                      : ""
                  }`}
                >
                  {isClaimed ? "Claimed" : `+${milestone.bonus}`}
                </Badge>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
