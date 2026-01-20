"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarView } from "@/components/CalendarView"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, X, Star, MessageSquare, Image as ImageIcon, CheckCircle2, Circle, Calendar, Upload, ListTodo } from "lucide-react"
import { Modal } from "@/components"

interface Task {
  id: string
  title: string
  description: string | null
  pointValue: number
  dueDate: string | null
  isCompleted: boolean
  completedAt: string | null
  requestStatus: string
  isKidRequest: boolean
  proofImageUrl: string | null
  completionNote: string | null
  parentComment: string | null
  feedbackRequested?: boolean
  createdAt: string
}

interface DayData {
  date: Date
  tasks: Task[]
  completedCount: number
  pendingCount: number
  totalPoints: number
}

export function CalendarClient({ tasks: initialTasks, kidId }: { tasks: Task[]; kidId: string }) {
  const [tasks, setTasks] = useState(initialTasks)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [requestForm, setRequestForm] = useState({
    title: "",
    description: "",
    pointValue: 1,
    dueDate: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  // New states for rewards and todo modals
  const [showRewardsModal, setShowRewardsModal] = useState(false)
  const [showTodoModal, setShowTodoModal] = useState(false)
  const [rewardsData, setRewardsData] = useState<{ date: Date; points: number; tasks: Task[] } | null>(null)
  const [todoData, setTodoData] = useState<{ date: Date; tasks: Task[] } | null>(null)

  // Task completion states
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [taskToComplete, setTaskToComplete] = useState<Task | null>(null)
  const [proofImage, setProofImage] = useState<File | null>(null)
  const [completionNote, setCompletionNote] = useState("")
  const [feedbackRequested, setFeedbackRequested] = useState(false)

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
  }

  const handleDayClick = (date: Date, dayTasks: Task[]) => {
    const completedTasks = dayTasks.filter((t) => t.isCompleted)
    const pendingTasks = dayTasks.filter((t) => !t.isCompleted && t.requestStatus === "approved")
    const totalPoints = completedTasks.reduce((sum, t) => sum + t.pointValue, 0)

    setSelectedDay({
      date,
      tasks: dayTasks,
      completedCount: completedTasks.length,
      pendingCount: pendingTasks.length,
      totalPoints,
    })
  }

  const handleRewardsClick = (date: Date, points: number, completedTasks: Task[]) => {
    setRewardsData({ date, points, tasks: completedTasks })
    setShowRewardsModal(true)
  }

  const handleTodoClick = (date: Date, pendingTasks: Task[]) => {
    setTodoData({ date, tasks: pendingTasks })
    setShowTodoModal(true)
  }

  const openCompleteModal = (task: Task) => {
    setShowTodoModal(false) // Close the todo modal first
    setTaskToComplete(task)
    setProofImage(null)
    setCompletionNote("")
    setFeedbackRequested(false)
    setShowCompleteModal(true)
  }

  const handleCompleteTask = async () => {
    if (!taskToComplete) return
    setCompletingTaskId(taskToComplete.id)

    try {
      const formData = new FormData()
      if (proofImage) {
        formData.append("proofImage", proofImage)
      }
      formData.append("completionNote", completionNote)
      formData.append("feedbackRequested", String(feedbackRequested))

      const res = await fetch(`/api/tasks/${taskToComplete.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isCompleted: true,
          completionNote: completionNote || null,
          feedbackRequested,
        }),
      })

      if (res.ok) {
        // Update local state
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskToComplete.id
              ? { ...t, isCompleted: true, completedAt: new Date().toISOString() }
              : t
          )
        )
        // Update todoData if open
        if (todoData) {
          setTodoData({
            ...todoData,
            tasks: todoData.tasks.filter((t) => t.id !== taskToComplete.id),
          })
        }
        setShowCompleteModal(false)
        setTaskToComplete(null)
        router.refresh()
      }
    } catch (error) {
      console.error("Failed to complete task:", error)
    } finally {
      setCompletingTaskId(null)
    }
  }

  const handleRequestTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!requestForm.title.trim()) return

    setIsSubmitting(true)
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kidId,
        title: requestForm.title,
        description: requestForm.description || null,
        pointValue: requestForm.pointValue,
        dueDate: requestForm.dueDate || null,
        isKidRequest: true,
      }),
    })

    setRequestForm({ title: "", description: "", pointValue: 1, dueDate: "" })
    setShowRequestForm(false)
    setIsSubmitting(false)
    router.refresh()
  }

  const pendingRequests = tasks.filter(
    (t) => t.isKidRequest && t.requestStatus === "pending"
  )

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div>
      {/* Request Task Button */}
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowRequestForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Request New Task
        </Button>
      </div>

      {/* Pending Requests Notice */}
      {pendingRequests.length > 0 && (
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <CardContent className="py-3">
            <p className="text-sm text-amber-700">
              You have <strong>{pendingRequests.length}</strong> task request(s) waiting for parent approval.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Calendar */}
      <Card>
        <CardContent className="p-4">
          <CalendarView
            tasks={tasks}
            kidId={kidId}
            onTaskClick={handleTaskClick}
            onDayClick={handleDayClick}
            onRewardsClick={handleRewardsClick}
            onTodoClick={handleTodoClick}
          />
        </CardContent>
      </Card>

      {/* Rewards Modal - Show points earned for the day */}
      <Modal
        isOpen={showRewardsModal}
        onClose={() => setShowRewardsModal(false)}
        title={
          rewardsData && (
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
              Rewards - {formatDate(rewardsData.date)}
            </div>
          )
        }
        maxWidth="md"
      >
        {rewardsData && (
          <div className="space-y-4">
            {/* Total Points Banner */}
            <div className="bg-gradient-to-r from-amber-100 to-yellow-100 rounded-lg p-6 text-center">
              <Star className="w-12 h-12 mx-auto mb-2 fill-amber-400 text-amber-500" />
              <p className="text-4xl font-bold text-amber-600">{rewardsData.points}</p>
              <p className="text-amber-700">points earned</p>
            </div>

            {/* Completed Tasks */}
            {rewardsData.tasks.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                No tasks completed on this day yet.
              </p>
            ) : (
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-700">Completed Tasks</h3>
                {rewardsData.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="font-medium text-gray-800">{task.title}</p>
                        {task.completedAt && (
                          <p className="text-xs text-gray-500">
                            {new Date(task.completedAt).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-amber-600 font-bold">
                      +{task.pointValue} <Star className="w-4 h-4 fill-amber-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowRewardsModal(false)}
            >
              Close
            </Button>
          </div>
        )}
      </Modal>

      {/* Today's Tasks Modal - Show pending tasks with complete option */}
      <Modal
        isOpen={showTodoModal}
        onClose={() => setShowTodoModal(false)}
        title={
          todoData && (
            <div className="flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-blue-500" />
              Today&apos;s Tasks - {formatDate(todoData.date)}
            </div>
          )
        }
        maxWidth="md"
      >
        {todoData && (
          <div className="space-y-4">
            {todoData.tasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-400" />
                <p className="text-gray-500">All tasks completed for this day!</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  {todoData.tasks.length} task{todoData.tasks.length !== 1 ? "s" : ""} remaining
                </p>
                {todoData.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 bg-blue-50 rounded-lg border border-blue-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Circle className="w-5 h-5 text-blue-400" />
                        <div>
                          <p className="font-medium text-gray-800">{task.title}</p>
                          {task.description && (
                            <p className="text-xs text-gray-500">{task.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-amber-600">
                        <Star className="w-4 h-4 fill-amber-400" />
                        <span className="font-bold">{task.pointValue}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="w-full mt-3 bg-green-500 hover:bg-green-600"
                      onClick={() => openCompleteModal(task)}
                      disabled={completingTaskId === task.id}
                    >
                      {completingTaskId === task.id ? "Completing..." : "Complete Task"}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowTodoModal(false)}
            >
              Close
            </Button>
          </div>
        )}
      </Modal>

      {/* Complete Task Modal */}
      <Modal
        isOpen={showCompleteModal}
        onClose={() => {
          setShowCompleteModal(false)
          setTaskToComplete(null)
        }}
        title="Complete Task"
        maxWidth="sm"
      >
        {taskToComplete && (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="font-medium text-blue-800">{taskToComplete.title}</p>
              <div className="flex items-center gap-1 text-amber-600 mt-1">
                <Star className="w-4 h-4 fill-amber-400" />
                <span className="font-bold">{taskToComplete.pointValue} points</span>
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-1 mb-2">
                <Upload className="w-4 h-4" />
                Upload Proof (Photo)
              </Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setProofImage(e.target.files?.[0] || null)}
              />
            </div>

            <div>
              <Label className="flex items-center gap-1 mb-2">
                <MessageSquare className="w-4 h-4" />
                Note (optional)
              </Label>
              <Input
                value={completionNote}
                onChange={(e) => setCompletionNote(e.target.value)}
                placeholder="Add a note about how you completed this task..."
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={feedbackRequested}
                onChange={(e) => setFeedbackRequested(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-600">Request feedback from parent</span>
            </label>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowCompleteModal(false)
                  setTaskToComplete(null)
                }}
                disabled={completingTaskId !== null}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-green-500 hover:bg-green-600"
                onClick={handleCompleteTask}
                disabled={completingTaskId !== null}
              >
                {completingTaskId ? "Completing..." : "Complete"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Day Detail Modal */}
      <Modal
        isOpen={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        title={
          selectedDay && (
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              {formatDate(selectedDay.date)}
            </div>
          )
        }
        maxWidth="lg"
      >
        {selectedDay && (
          <div className="space-y-4">
            {/* Daily Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">{selectedDay.completedCount}</p>
                <p className="text-xs text-green-700">Completed</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-600">{selectedDay.pendingCount}</p>
                <p className="text-xs text-blue-700">To Do</p>
              </div>
              <div className="bg-amber-50 p-3 rounded-lg text-center">
                <div className="flex items-center justify-center gap-1">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                  <p className="text-2xl font-bold text-amber-600">{selectedDay.totalPoints}</p>
                </div>
                <p className="text-xs text-amber-700">Points Earned</p>
              </div>
            </div>

            {/* Task List */}
            <div>
              <h3 className="font-semibold mb-2">Tasks</h3>
              {selectedDay.tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tasks for this day
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedDay.tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => {
                        setSelectedDay(null)
                        setSelectedTask(task)
                      }}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        task.isCompleted
                          ? "bg-green-50 border-green-200 hover:bg-green-100"
                          : task.requestStatus === "pending"
                          ? "bg-amber-50 border-amber-200 hover:bg-amber-100"
                          : "bg-blue-50 border-blue-200 hover:bg-blue-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {task.isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400" />
                        )}
                        <div className="flex-grow">
                          <p className="font-medium">{task.title}</p>
                          {task.description && (
                            <p className="text-xs text-muted-foreground">{task.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                          <span className="font-bold text-amber-600">{task.pointValue}</span>
                        </div>
                      </div>
                      {task.isCompleted && task.completedAt && (
                        <p className="text-xs text-green-600 mt-1 ml-8">
                          Completed at {new Date(task.completedAt).toLocaleTimeString()}
                        </p>
                      )}
                      {(task.proofImageUrl || task.completionNote) && (
                        <div className="flex gap-2 mt-1 ml-8">
                          {task.proofImageUrl && (
                            <Badge variant="secondary" className="text-xs">
                              <ImageIcon className="w-3 h-3 mr-1" />
                              Proof
                            </Badge>
                          )}
                          {task.completionNote && (
                            <Badge variant="secondary" className="text-xs">
                              <MessageSquare className="w-3 h-3 mr-1" />
                              Note
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Request Task Modal */}
      <Modal
        isOpen={showRequestForm}
        onClose={() => setShowRequestForm(false)}
        title="Request a New Task"
      >
        <form onSubmit={handleRequestTask} className="space-y-4">
          <div>
            <Label>What task do you want to do?</Label>
            <Input
              value={requestForm.title}
              onChange={(e) =>
                setRequestForm({ ...requestForm, title: e.target.value })
              }
              placeholder="e.g., Help with laundry"
              required
            />
          </div>
          <div>
            <Label>Description (optional)</Label>
            <Input
              value={requestForm.description}
              onChange={(e) =>
                setRequestForm({ ...requestForm, description: e.target.value })
              }
              placeholder="Tell your parents more about it..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Suggested Stars</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={requestForm.pointValue}
                onChange={(e) =>
                  setRequestForm({
                    ...requestForm,
                    pointValue: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
            <div>
              <Label>When?</Label>
              <Input
                type="date"
                value={requestForm.dueDate}
                onChange={(e) =>
                  setRequestForm({ ...requestForm, dueDate: e.target.value })
                }
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Your parent will review and approve this task request.
          </p>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Sending Request..." : "Send Request"}
          </Button>
        </form>
      </Modal>

      {/* Task Detail Modal */}
      <Modal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title={
          selectedTask && (
            <div className="flex items-center gap-2">
              {selectedTask.title}
              {selectedTask.isCompleted && (
                <Badge className="bg-green-500">Completed</Badge>
              )}
              {selectedTask.requestStatus === "pending" && (
                <Badge variant="secondary">Pending</Badge>
              )}
            </div>
          )
        }
      >
        {selectedTask && (
          <div className="space-y-4">
            {selectedTask.description && (
              <p className="text-muted-foreground">{selectedTask.description}</p>
            )}

            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
              <span className="font-bold">{selectedTask.pointValue} stars</span>
            </div>

            {selectedTask.dueDate && (
              <p className="text-sm text-muted-foreground">
                Due: {new Date(selectedTask.dueDate).toLocaleDateString()}
              </p>
            )}

            {selectedTask.completedAt && (
              <p className="text-sm text-green-600">
                Completed: {new Date(selectedTask.completedAt).toLocaleDateString()}
              </p>
            )}

            {/* Proof Image */}
            {selectedTask.proofImageUrl && (
              <div>
                <Label className="flex items-center gap-1 mb-2">
                  <ImageIcon className="w-4 h-4" />
                  Proof
                </Label>
                <img
                  src={selectedTask.proofImageUrl}
                  alt="Task proof"
                  className="w-full rounded-lg border"
                />
              </div>
            )}

            {/* Completion Note */}
            {selectedTask.completionNote && (
              <div>
                <Label className="flex items-center gap-1 mb-1">
                  <MessageSquare className="w-4 h-4" />
                  Your Note
                </Label>
                <p className="text-sm bg-gray-50 p-2 rounded">
                  {selectedTask.completionNote}
                </p>
              </div>
            )}

            {/* Parent Comment */}
            {selectedTask.parentComment && (
              <div>
                <Label className="flex items-center gap-1 mb-1 text-purple-600">
                  <MessageSquare className="w-4 h-4" />
                  Parent&apos;s Comment
                </Label>
                <p className="text-sm bg-purple-50 p-2 rounded border border-purple-200">
                  {selectedTask.parentComment}
                </p>
              </div>
            )}

            {/* Complete button if not completed */}
            {!selectedTask.isCompleted && selectedTask.requestStatus === "approved" && (
              <Button
                className="w-full bg-green-500 hover:bg-green-600"
                onClick={() => {
                  setSelectedTask(null)
                  openCompleteModal(selectedTask)
                }}
              >
                Complete Task
              </Button>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setSelectedTask(null)}
            >
              Close
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
