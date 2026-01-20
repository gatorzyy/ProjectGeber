import { prisma } from "@/lib/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Trophy, Medal, Star, Gem, Crown } from "lucide-react"
import { BugReportButton } from "@/components"

export default async function LeaderboardPage() {
  const kids = await prisma.kid.findMany({
    orderBy: { totalPoints: "desc" },
  })

  const gemRatio = 10

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="w-8 h-8 text-yellow-500 fill-yellow-400" />
      case 1:
        return <Medal className="w-7 h-7 text-gray-400 fill-gray-300" />
      case 2:
        return <Medal className="w-6 h-6 text-amber-600 fill-amber-500" />
      default:
        return <span className="text-2xl font-bold text-muted-foreground">{index + 1}</span>
    }
  }

  const getRankStyle = (index: number) => {
    switch (index) {
      case 0:
        return "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200"
      case 1:
        return "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200"
      case 2:
        return "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200"
      default:
        return ""
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link href="/">
        <Button variant="ghost" size="sm" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </Link>

      <div className="text-center mb-8">
        <Trophy className="w-16 h-16 mx-auto text-amber-500 mb-2" />
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground">Who has the most gems?</p>
      </div>

      {kids.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground">No players yet!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {kids.map((kid, index) => {
            const gems = Math.floor(kid.totalPoints / gemRatio)
            const stars = kid.totalPoints % gemRatio

            return (
              <Card
                key={kid.id}
                className={`transition-all ${getRankStyle(index)} ${
                  index === 0 ? "scale-105 shadow-lg" : ""
                }`}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="w-12 flex justify-center">{getRankIcon(index)}</div>
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md ${
                      index === 0 ? "ring-4 ring-yellow-300" : ""
                    }`}
                    style={{ backgroundColor: kid.avatarColor }}
                  >
                    {kid.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-grow">
                    <h3 className={`font-bold ${index === 0 ? "text-xl" : "text-lg"}`}>
                      {kid.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {kid.totalPoints} total points
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-3">
                      <div className="flex items-center gap-1">
                        <Gem className={`${index === 0 ? "w-6 h-6" : "w-5 h-5"} fill-purple-500 text-purple-600`} />
                        <span className={`font-bold text-purple-600 ${index === 0 ? "text-xl" : ""}`}>
                          {gems}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className={`${index === 0 ? "w-5 h-5" : "w-4 h-4"} fill-amber-400 text-amber-500`} />
                        <span className="font-bold text-amber-600">{stars}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Legend */}
      <Card className="mt-8">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">How scoring works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
            <span>Each completed task earns stars (points)</span>
          </div>
          <div className="flex items-center gap-2">
            <Gem className="w-4 h-4 fill-purple-500 text-purple-600" />
            <span>Every 10 stars = 1 gem</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Collect gems to climb the leaderboard!</span>
          </div>
        </CardContent>
      </Card>

      <BugReportButton page="/leaderboard" userType="guest" />
    </div>
  )
}
