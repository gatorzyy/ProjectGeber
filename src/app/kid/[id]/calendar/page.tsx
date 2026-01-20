import { prisma } from "@/lib/db"
import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Star, Gem, Calendar } from "lucide-react"
import { CalendarClient } from "./CalendarClient"
import { BugReportButton } from "@/components"

export default async function KidCalendarPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Check if kid is logged in
  const cookieStore = await cookies()
  const session = cookieStore.get("kid_session")
  if (session?.value && session.value !== id) {
    redirect("/")
  }

  const kid = await prisma.kid.findUnique({
    where: { id },
    include: {
      tasks: {
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!kid) {
    notFound()
  }

  const settings = await prisma.adminSettings.findFirst()
  const gemRatio = settings?.gemPointsRatio || 10
  const gems = Math.floor(kid.totalPoints / gemRatio)
  const stars = kid.totalPoints % gemRatio

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <header className="mb-8">
        <Link href={`/kid/${id}`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md"
            style={{ backgroundColor: kid.avatarColor }}
          >
            {kid.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-grow">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              {kid.name}&apos;s Calendar
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1">
                <Gem className="w-5 h-5 fill-purple-500 text-purple-600" />
                <span className="font-bold text-purple-600">{gems}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                <span className="font-bold text-amber-600">{stars}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <CalendarClient
        tasks={kid.tasks.map(t => ({
          ...t,
          dueDate: t.dueDate?.toISOString() || null,
          completedAt: t.completedAt?.toISOString() || null,
          createdAt: t.createdAt.toISOString(),
        }))}
        kidId={kid.id}
      />

      <BugReportButton page={`/kid/${id}/calendar`} userType="kid" userId={id} />
    </div>
  )
}
