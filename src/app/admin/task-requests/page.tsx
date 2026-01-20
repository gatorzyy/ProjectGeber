"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Check, X, Star, MessageSquare, Image as ImageIcon, Clock, HelpCircle } from "lucide-react"
import { Task } from "@/lib/types"
import { tasksApi } from "@/lib/api"
import { Modal, PageHeader, KidAvatar, StarPoints } from "@/components"

export default function TaskRequestsPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<"pending" | "feedback" | "completed" | "all">("pending")
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [editPoints, setEditPoints] = useState(0)
  const [parentComment, setParentComment] = useState("")

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const data = await tasksApi.getAll()
      setTasks(data)
    } catch (error) {
      console.error("Failed to fetch tasks:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (task: Task) => {
    try {
      await tasksApi.update(task.id, {
        requestStatus: "approved",
        pointValue: editPoints || task.pointValue,
        parentComment: parentComment || null,
      })
      setSelectedTask(null)
      setParentComment("")
      fetchTasks()
    } catch (error) {
      console.error("Failed to approve task:", error)
    }
  }

  const handleReject = async (taskId: string) => {
    if (!confirm("Reject this task request?")) return
    try {
      await tasksApi.update(taskId, {
        requestStatus: "rejected",
        parentComment: parentComment || "Sorry, this task was not approved.",
      })
      setSelectedTask(null)
      setParentComment("")
      fetchTasks()
    } catch (error) {
      console.error("Failed to reject task:", error)
    }
  }

  const handleAddComment = async (taskId: string) => {
    if (!parentComment.trim()) return
    try {
      await tasksApi.update(taskId, { parentComment, feedbackRequested: false })
      setSelectedTask(null)
      setParentComment("")
      fetchTasks()
    } catch (error) {
      console.error("Failed to add comment:", error)
    }
  }

  const filteredTasks = tasks.filter((t) => {
    if (filter === "pending") return t.isKidRequest && t.requestStatus === "pending"
    if (filter === "feedback") return t.feedbackRequested && !t.isCompleted
    if (filter === "completed") return t.isCompleted && (t.proofImageUrl || t.completionNote)
    return true
  })

  const pendingCount = tasks.filter(
    (t) => t.isKidRequest && t.requestStatus === "pending"
  ).length

  const feedbackCount = tasks.filter(
    (t) => t.feedbackRequested && !t.isCompleted
  ).length

  const needsReviewCount = tasks.filter(
    (t) => t.isCompleted && (t.proofImageUrl || t.completionNote) && !t.parentComment
  ).length

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <PageHeader title="Task Requests & Reviews" backHref="/admin" backLabel="Back to Admin" />

      <div className="flex items-center justify-end mb-6 gap-2">
        {pendingCount > 0 && (
          <Badge variant="destructive">{pendingCount} pending</Badge>
        )}
        {feedbackCount > 0 && (
          <Badge className="bg-blue-500">{feedbackCount} needs feedback</Badge>
        )}
        {needsReviewCount > 0 && (
          <Badge variant="secondary">{needsReviewCount} needs review</Badge>
        )}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("pending")}
        >
          <Clock className="w-4 h-4 mr-1" />
          Pending Requests
        </Button>
        <Button
          variant={filter === "feedback" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("feedback")}
          className={filter === "feedback" ? "bg-blue-600 hover:bg-blue-700" : ""}
        >
          <HelpCircle className="w-4 h-4 mr-1" />
          Feedback Requests
        </Button>
        <Button
          variant={filter === "completed" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("completed")}
        >
          <ImageIcon className="w-4 h-4 mr-1" />
          Completed with Proof
        </Button>
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All Tasks
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <p>Loading...</p>
        ) : filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {filter === "pending"
                ? "No pending task requests."
                : filter === "feedback"
                ? "No tasks waiting for feedback."
                : filter === "completed"
                ? "No completed tasks with proof to review."
                : "No tasks."}
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card
              key={task.id}
              className={`cursor-pointer hover:shadow-md transition-all ${
                task.requestStatus === "pending"
                  ? "border-amber-200 bg-amber-50"
                  : task.feedbackRequested && !task.isCompleted
                  ? "border-blue-200 bg-blue-50"
                  : task.isCompleted
                  ? "border-green-200 bg-green-50"
                  : ""
              }`}
              onClick={() => {
                setSelectedTask(task)
                setEditPoints(task.pointValue)
                setParentComment(task.parentComment || "")
              }}
            >
              <CardContent className="flex items-center gap-4 p-4">
                {task.kid && (
                  <KidAvatar name={task.kid.name} color={task.kid.avatarColor} size="lg" />
                )}
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{task.title}</h3>
                    {task.isKidRequest && (
                      <Badge variant="outline" className="text-xs">
                        Kid Request
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {task.kid?.name}
                    {task.description && ` • ${task.description}`}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <StarPoints points={task.pointValue} size="sm" />
                    {task.proofImageUrl && (
                      <Badge variant="secondary" className="text-xs">
                        <ImageIcon className="w-3 h-3 mr-1" />
                        Has Proof
                      </Badge>
                    )}
                    {task.completionNote && (
                      <Badge variant="secondary" className="text-xs">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Has Note
                      </Badge>
                    )}
                  </div>
                </div>
                {task.requestStatus === "pending" ? (
                  <Badge className="bg-amber-500">Pending</Badge>
                ) : task.feedbackRequested && !task.isCompleted ? (
                  <Badge className="bg-blue-500">Needs Feedback</Badge>
                ) : task.isCompleted ? (
                  <Badge className="bg-green-500">Completed</Badge>
                ) : (
                  <Badge variant="outline">Active</Badge>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Task Detail Modal */}
      <Modal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title={
          selectedTask && (
            <div className="flex items-center gap-2">
              {selectedTask.kid && (
                <KidAvatar name={selectedTask.kid.name} color={selectedTask.kid.avatarColor} size="md" />
              )}
              <span>{selectedTask.title}</span>
            </div>
          )
        }
      >
        {selectedTask && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Requested by: <strong>{selectedTask.kid?.name}</strong>
              </p>
              {selectedTask.description && (
                <p className="mt-2">{selectedTask.description}</p>
              )}
            </div>

            {/* Proof Image */}
            {selectedTask.proofImageUrl && (
              <div>
                <Label className="flex items-center gap-1 mb-2">
                  <ImageIcon className="w-4 h-4" />
                  Proof Submitted
                </Label>
                <img
                  src={selectedTask.proofImageUrl}
                  alt="Task proof"
                  className="w-full rounded-lg border"
                />
              </div>
            )}

            {/* Kid's Note */}
            {selectedTask.completionNote && (
              <div>
                <Label className="flex items-center gap-1 mb-1">
                  <MessageSquare className="w-4 h-4" />
                  {selectedTask.kid?.name}&apos;s Note
                </Label>
                <p className="text-sm bg-gray-50 p-2 rounded">
                  {selectedTask.completionNote}
                </p>
              </div>
            )}

            {/* Points (editable for pending requests) */}
            {selectedTask.requestStatus === "pending" && (
              <div>
                <Label>Stars to Award</Label>
                <Input
                  type="number"
                  min="1"
                  value={editPoints}
                  onChange={(e) => setEditPoints(parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Kid suggested: {selectedTask.pointValue} stars
                </p>
              </div>
            )}

            {/* Parent Comment */}
            <div>
              <Label className="flex items-center gap-1 mb-1">
                <MessageSquare className="w-4 h-4" />
                Your Comment
              </Label>
              <Input
                value={parentComment}
                onChange={(e) => setParentComment(e.target.value)}
                placeholder="Add a comment for your child..."
              />
            </div>

            {/* Actions */}
            {selectedTask.requestStatus === "pending" ? (
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(selectedTask)}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleReject(selectedTask.id)}
                >
                  <X className="w-4 h-4 mr-1" />
                  Reject
                </Button>
              </div>
            ) : (
              <Button
                className="w-full"
                onClick={() => handleAddComment(selectedTask.id)}
                disabled={!parentComment.trim()}
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                {selectedTask.parentComment ? "Update Comment" : "Add Comment"}
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
