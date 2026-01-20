"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Gem, ListTodo, Trophy, Gift, Calendar, Flame, CheckCircle } from "lucide-react"
import { BugReportButton } from "@/components"

interface Task {
  id: string
  title: string
  description: string | null
  pointValue: number
  isCompleted: boolean
  dueDate: string | null
  isRecurring: boolean
  recurringType: string | null
  completedAt?: string | null
}

interface Reward {
  id: string
  name: string
  description: string | null
  pointCost: number
  imageUrl: string | null
}

interface Kid {
  id: string
  name: string
  avatarColor: string
  totalPoints: number
  totalGems: number
}

interface Streak {
  currentStreak: number
  longestStreak: number
}

interface Props {
  kid: Kid
  tasks: Task[]
  rewards: Reward[]
  streak: Streak | null
  accessToken: string
}

export default function KidAccessClient({
  kid,
  tasks: initialTasks,
  rewards,
  streak,
  accessToken,
}: Props) {
  const [tasks, setTasks] = useState(initialTasks)
  const [completingTask, setCompletingTask] = useState<string | null>(null)
  const [proofImage, setProofImage] = useState<File | null>(null)
  const [completionNote, setCompletionNote] = useState("")
  const [feedbackRequested, setFeedbackRequested] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const pendingTasks = tasks.filter((t) => !t.isCompleted)
  const completedTasks = tasks.filter((t) => t.isCompleted)

  // Calculate gems and stars (assuming 10 points per gem)
  const gemRatio = 10
  const gems = Math.floor(kid.totalPoints / gemRatio)
  const stars = kid.totalPoints % gemRatio

  const completedToday = tasks.filter(
    (t) =>
      t.isCompleted &&
      t.completedAt &&
      new Date(t.completedAt).toDateString() === new Date().toDateString()
  ).length

  const handleCompleteTask = async () => {
    if (!selectedTask) return
    setCompletingTask(selectedTask.id)

    try {
      const formData = new FormData()
      if (proofImage) {
        formData.append("proofImage", proofImage)
      }
      formData.append("completionNote", completionNote)
      formData.append("feedbackRequested", String(feedbackRequested))
      formData.append("accessToken", accessToken)

      const res = await fetch(
        `/api/kids/${kid.id}/tasks/${selectedTask.id}/complete-public`,
        {
          method: "POST",
          body: formData,
        }
      )

      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === selectedTask.id ? { ...t, isCompleted: true, completedAt: new Date().toISOString() } : t
          )
        )
        setShowCompleteModal(false)
        setSelectedTask(null)
        setProofImage(null)
        setCompletionNote("")
        setFeedbackRequested(false)
      }
    } catch (error) {
      console.error("Failed to complete task:", error)
    } finally {
      setCompletingTask(null)
    }
  }

  const openCompleteModal = (task: Task) => {
    setSelectedTask(task)
    setShowCompleteModal(true)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <header className="mb-8">
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
        </div>
      </header>

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
      {streak && streak.currentStreak > 0 && (
        <Card className="mb-6 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-3">
              <Flame className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-lg font-bold text-orange-600">
                  {streak.currentStreak} Day Streak!
                </p>
                <p className="text-sm text-orange-500">
                  Best: {streak.longestStreak} days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Rewards Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">{rewards.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Star className="w-4 h-4" />
              Can Redeem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {rewards.filter((r) => kid.totalPoints >= r.pointCost).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* My Tasks Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">My Tasks</h2>

        {pendingTasks.length === 0 && completedTasks.length === 0 ? (
          <Card className="p-12 text-center">
            <ListTodo className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No tasks assigned yet!</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {/* Pending Tasks */}
            {pendingTasks.map((task) => (
              <Card
                key={task.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{task.title}</h3>
                        {task.isRecurring && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded capitalize">
                            {task.recurringType}
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      )}
                      <div className="flex items-center gap-1 mt-2">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                        <span className="text-sm font-medium text-amber-600">
                          {task.pointValue} {task.pointValue === 1 ? "point" : "points"}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => openCompleteModal(task)}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      Complete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <>
                <h3 className="text-lg font-medium text-muted-foreground mt-6 mb-3">
                  Completed
                </h3>
                {completedTasks.map((task) => (
                  <Card
                    key={task.id}
                    className="bg-green-50/50 border-green-100"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <div>
                            <h3 className="font-medium text-gray-700">{task.title}</h3>
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                              <span className="text-xs text-amber-600">
                                +{task.pointValue}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="text-sm text-green-600 font-medium">Done!</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Rewards Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Rewards Shop</h2>

        {rewards.length === 0 ? (
          <Card className="p-12 text-center">
            <Gift className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No rewards available yet!</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map((reward) => {
              const canRedeem = kid.totalPoints >= reward.pointCost
              return (
                <Card
                  key={reward.id}
                  className={`${canRedeem ? "ring-2 ring-green-400 bg-green-50/30" : ""}`}
                >
                  <CardContent className="p-4">
                    {reward.imageUrl && (
                      <img
                        src={reward.imageUrl}
                        alt={reward.name}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                    )}
                    <h3 className="font-medium">{reward.name}</h3>
                    {reward.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {reward.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                        <span className="font-medium text-amber-600">{reward.pointCost}</span>
                      </div>
                      {canRedeem && (
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded font-medium">
                          Can redeem!
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Complete Task Modal */}
      {showCompleteModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Complete Task</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Completing: <strong className="text-foreground">{selectedTask.title}</strong>
              </p>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Upload Proof (Photo)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProofImage(e.target.files?.[0] || null)}
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Note (optional)
                </label>
                <textarea
                  value={completionNote}
                  onChange={(e) => setCompletionNote(e.target.value)}
                  className="w-full border rounded-lg p-2 h-20 resize-none"
                  placeholder="Add a note about how you completed this task..."
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={feedbackRequested}
                  onChange={(e) => setFeedbackRequested(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-muted-foreground">
                  Request feedback from parent
                </span>
              </label>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowCompleteModal(false)
                    setSelectedTask(null)
                    setProofImage(null)
                    setCompletionNote("")
                    setFeedbackRequested(false)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-green-500 hover:bg-green-600"
                  onClick={handleCompleteTask}
                  disabled={completingTask !== null}
                >
                  {completingTask ? "Completing..." : "Complete Task"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <BugReportButton page={`/kid/access/${accessToken}`} userType="kid" userId={kid.id} />
    </div>
  )
}
