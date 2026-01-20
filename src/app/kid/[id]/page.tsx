import { prisma } from "@/lib/db"
import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StarDisplay } from "@/components/StarDisplay"
import { ArrowLeft, Gift, ListTodo, Trophy, Settings, Star, Gem, LogOut, Calendar, Users, Flame } from "lucide-react"
import { KidTaskList } from "./KidTaskList"
import { PinSetup } from "./PinSetup"
import { StreakDisplay } from "./StreakDisplay"
import { BugReportButton } from "@/components"

export default async function KidDashboard({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Check if kid is logged in
  const cookieStore = await cookies()
  const session = cookieStore.get("kid_session")

  // Allow access if logged in as this kid OR no session (for backwards compatibility)
  if (session?.value && session.value !== id) {
    redirect("/")
  }

  const kid = await prisma.kid.findUnique({
    where: { id },
    include: {
      tasks: { orderBy: { createdAt: "desc" } },
      redemptions: {
        where: { status: "pending" },
        include: { reward: true },
      },
      following: true,
      followers: true,
      streak: true,
    },
  })

  if (!kid) {
    notFound()
  }

  // Count friends (accepted friend requests)
  const friendsCount = await prisma.friendRequest.count({
    where: {
      OR: [
        { requesterId: id, status: "accepted" },
        { recipientId: id, status: "accepted" },
      ],
    },
  })

  // Count pending friend requests
  const pendingFriendRequests = await prisma.friendRequest.count({
    where: { recipientId: id, status: "pending" },
  })

  const settings = await prisma.adminSettings.findFirst()
  const gemRatio = settings?.gemPointsRatio || 10

  const completedToday = kid.tasks.filter(
    (t) =>
      t.isCompleted &&
      t.completedAt &&
      new Date(t.completedAt).toDateString() === new Date().toDateString()
  ).length

  const pendingTasks = kid.tasks.filter((t) => !t.isCompleted && t.requestStatus === "approved")
  const pendingRequests = kid.tasks.filter((t) => t.isKidRequest && t.requestStatus === "pending")
  const gems = Math.floor(kid.totalPoints / gemRatio)
  const stars = kid.totalPoints % gemRatio

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <form action="/api/kids/auth" method="POST">
            <input type="hidden" name="_method" value="DELETE" />
            <Link href="/">
              <Button variant="ghost" size="sm" onClick={async () => {
                "use server"
                const cookieStore = await cookies()
                cookieStore.delete("kid_session")
              }}>
                <LogOut className="w-4 h-4 mr-2" />
                Switch Player
              </Button>
            </Link>
          </form>
        </div>

        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md"
            style={{ backgroundColor: kid.avatarColor }}
          >
            {kid.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-grow">
            <h1 className="text-3xl font-bold">{kid.name}&apos;s Dashboard</h1>
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
          <Link href={`/kid/${id}/settings`}>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* PIN Setup prompt if not set */}
      {!kid.pin && <PinSetup kidId={kid.id} />}

      {/* How it works reminder */}
      <Card className="mb-6 bg-gradient-to-r from-purple-50 to-amber-50">
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Complete tasks</span>
              <span>=</span>
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              <span>x10</span>
              <span>=</span>
              <Gem className="w-4 h-4 fill-purple-500 text-purple-600" />
            </div>
            <div className="flex items-center gap-1">
              <Gem className="w-4 h-4 fill-purple-500 text-purple-600" />
              <span>=</span>
              <span className="text-green-600 font-medium">Rewards!</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Streak Display */}
      <StreakDisplay
        kidId={kid.id}
        streak={kid.streak ? {
          ...kid.streak,
          lastActiveDate: kid.streak.lastActiveDate?.toISOString() || null,
        } : null}
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Link href={`/kid/${id}/calendar`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">View</p>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/kid/${id}/social`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full relative">
            {pendingFriendRequests > 0 && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {pendingFriendRequests}
              </div>
            )}
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Friends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-pink-600">{friendsCount}</p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ListTodo className="w-4 h-4" />
              Tasks Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingTasks.length} pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Completed Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{completedToday}</p>
          </CardContent>
        </Card>

        <Link href={`/kid/${id}/rewards`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Gift className="w-4 h-4" />
                Rewards Shop
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-600">
                {kid.redemptions.length} pending
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">My Tasks</h2>
        <KidTaskList tasks={kid.tasks} kidId={kid.id} />
      </div>

      <BugReportButton page={`/kid/${id}`} userType="kid" userId={id} />
    </div>
  )
}
