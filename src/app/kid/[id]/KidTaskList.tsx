"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { X, Upload, Camera, MessageSquare, Star, Clock, HelpCircle } from "lucide-react"

interface Task {
  id: string
  title: string
  description: string | null
  pointValue: number
  isCompleted: boolean
  isRecurring: boolean
  recurringType: string | null
  requestStatus: string
  isKidRequest: boolean
  proofImageUrl: string | null
  completionNote: string | null
  parentComment: string | null
  feedbackRequested?: boolean
}

export function KidTaskList({ tasks }: { tasks: Task[]; kidId: string }) {
  const router = useRouter()
  const [completingTask, setCompletingTask] = useState<Task | null>(null)
  const [proofImage, setProofImage] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [completionNote, setCompletionNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRequestingFeedback, setIsRequestingFeedback] = useState(false)

  // State for viewing/updating completed tasks
  const [viewingCompletedTask, setViewingCompletedTask] = useState<Task | null>(null)
  const [feedbackNote, setFeedbackNote] = useState("")
  const [isRequestingCompletedFeedback, setIsRequestingCompletedFeedback] = useState(false)

  const handleStartComplete = (task: Task) => {
    setCompletingTask(task)
    setProofImage(null)
    setProofPreview(null)
    setCompletionNote("")
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProofImage(file)
      const reader = new FileReader()
      reader.onload = (e) => setProofPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleComplete = async () => {
    if (!completingTask || !proofImage) return
    setIsSubmitting(true)

    let proofImageUrl = null

    // Upload proof image
    const formData = new FormData()
    formData.append("file", proofImage)
    const uploadRes = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })
    if (uploadRes.ok) {
      const uploadData = await uploadRes.json()
      proofImageUrl = uploadData.url
    }

    // Complete the task
    await fetch(`/api/tasks/${completingTask.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isCompleted: true,
        proofImageUrl,
        completionNote: completionNote || null,
      }),
    })

    setCompletingTask(null)
    setIsSubmitting(false)
    router.refresh()
  }

  const handleRequestFeedback = async () => {
    if (!completingTask) return
    setIsRequestingFeedback(true)

    let proofImageUrl = null

    // Upload proof image if provided
    if (proofImage) {
      const formData = new FormData()
      formData.append("file", proofImage)
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json()
        proofImageUrl = uploadData.url
      }
    }

    // Request feedback (not complete yet)
    await fetch(`/api/tasks/${completingTask.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        feedbackRequested: true,
        proofImageUrl,
        completionNote: completionNote || null,
      }),
    })

    setCompletingTask(null)
    setIsRequestingFeedback(false)
    router.refresh()
  }

  const handleOpenCompletedTask = (task: Task) => {
    setViewingCompletedTask(task)
    setFeedbackNote("")
  }

  const handleRequestFeedbackOnCompleted = async () => {
    if (!viewingCompletedTask) return
    setIsRequestingCompletedFeedback(true)

    await fetch(`/api/tasks/${viewingCompletedTask.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        feedbackRequested: true,
        completionNote: feedbackNote || viewingCompletedTask.completionNote || null,
      }),
    })

    setViewingCompletedTask(null)
    setIsRequestingCompletedFeedback(false)
    router.refresh()
  }

  // Filter tasks: only show approved tasks
  const approvedTasks = tasks.filter((t) => t.requestStatus === "approved")
  const pendingTasks = approvedTasks.filter((t) => !t.isCompleted && !t.feedbackRequested)
  const feedbackRequestedTasks = approvedTasks.filter((t) => !t.isCompleted && t.feedbackRequested)
  const completedTasks = approvedTasks.filter((t) => t.isCompleted)
  const pendingRequests = tasks.filter((t) => t.requestStatus === "pending")

  return (
    <div className="space-y-4">
      {/* Feedback Requested Tasks */}
      {feedbackRequestedTasks.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
              <HelpCircle className="w-4 h-4" />
              Waiting for Parent Feedback ({feedbackRequestedTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {feedbackRequestedTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between bg-white p-2 rounded border border-blue-200"
              >
                <div>
                  <span className="font-medium">{task.title}</span>
                  <div className="flex items-center gap-1 text-xs text-blue-600">
                    <Star className="w-3 h-3 fill-blue-400" />
                    {task.pointValue} stars
                  </div>
                  {task.completionNote && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Your note: {task.completionNote}
                    </p>
                  )}
                </div>
                <Badge className="bg-blue-500">Awaiting Feedback</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Pending Task Requests */}
      {pendingRequests.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
              <Clock className="w-4 h-4" />
              Waiting for Parent Approval ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingRequests.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between bg-white p-2 rounded border border-amber-200"
              >
                <div>
                  <span className="font-medium">{task.title}</span>
                  <div className="flex items-center gap-1 text-xs text-amber-600">
                    <Star className="w-3 h-3 fill-amber-400" />
                    {task.pointValue} stars suggested
                  </div>
                </div>
                <Badge variant="secondary">Pending</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {pendingTasks.length === 0 && completedTasks.length === 0 && pendingRequests.length === 0 && feedbackRequestedTasks.length === 0 && (
        <p className="text-muted-foreground text-center py-8">
          No tasks yet! Ask a parent to add some tasks or request your own.
        </p>
      )}

      {pendingTasks.map((task) => (
        <Card
          key={task.id}
          className="hover:shadow-md transition-all cursor-pointer"
          onClick={() => handleStartComplete(task)}
        >
          <CardContent className="flex items-center gap-4 p-4">
            <div className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-purple-500 transition-colors flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-gray-200" />
            </div>
            <div className="flex-grow">
              <h3 className="font-medium">{task.title}</h3>
              {task.description && (
                <p className="text-sm text-muted-foreground">{task.description}</p>
              )}
              {task.isRecurring && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  {task.recurringType}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              <span className="font-bold text-amber-600">+{task.pointValue}</span>
            </div>
          </CardContent>
        </Card>
      ))}

      {completedTasks.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-muted-foreground mb-3">
            Completed
          </h3>
          <div className="space-y-3">
            {completedTasks.map((task) => (
              <Card
                key={task.id}
                className="bg-green-50 hover:shadow-md transition-all cursor-pointer border-green-200"
                onClick={() => handleOpenCompletedTask(task)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-medium text-gray-700">{task.title}</h3>
                    {task.parentComment && (
                      <p className="text-xs text-purple-600 flex items-center gap-1 mt-1">
                        <MessageSquare className="w-3 h-3" />
                        Parent: {task.parentComment}
                      </p>
                    )}
                    {task.feedbackRequested && !task.parentComment && (
                      <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                        <HelpCircle className="w-3 h-3" />
                        Feedback requested
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-green-600">
                    <Star className="w-4 h-4 fill-green-500" />
                    <span className="font-bold">+{task.pointValue}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Task Completion Modal */}
      {completingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Complete: {completingTask.title}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCompletingTask(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-lg">
                <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
                <span className="font-bold text-amber-600">+{completingTask.pointValue} stars!</span>
              </div>

              {/* Proof Upload - Required */}
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Camera className="w-4 h-4" />
                  Add Proof <span className="text-red-500">*</span>
                </Label>
                {proofPreview ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={proofPreview}
                      alt="Proof preview"
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setProofImage(null)
                        setProofPreview(null)
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer hover:bg-purple-50 bg-purple-25">
                    <Upload className="w-8 h-8 text-purple-400 mb-2" />
                    <span className="text-sm text-purple-600 font-medium">Click to upload photo</span>
                    <span className="text-xs text-muted-foreground mt-1">Required to complete task</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>

              {/* Completion Note */}
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4" />
                  Add a Note (optional)
                </Label>
                <Input
                  value={completionNote}
                  onChange={(e) => setCompletionNote(e.target.value)}
                  placeholder="Tell your parents about it..."
                />
              </div>

              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={handleComplete}
                  disabled={isSubmitting || !proofImage}
                >
                  {isSubmitting ? "Completing..." : "Complete Task"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleRequestFeedback}
                  disabled={isRequestingFeedback}
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  {isRequestingFeedback ? "Requesting..." : "Request Feedback from Parent"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Request feedback if you need help or want parent input before completing
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Completed Task View Modal */}
      {viewingCompletedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {viewingCompletedTask.title}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewingCompletedTask(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-lg bg-green-50 py-2 rounded-lg">
                <Star className="w-6 h-6 fill-green-500 text-green-500" />
                <span className="font-bold text-green-600">+{viewingCompletedTask.pointValue} stars earned!</span>
              </div>

              {/* Description */}
              {viewingCompletedTask.description && (
                <div>
                  <Label className="text-sm text-muted-foreground">Description</Label>
                  <p className="text-sm">{viewingCompletedTask.description}</p>
                </div>
              )}

              {/* Proof Image */}
              {viewingCompletedTask.proofImageUrl && (
                <div>
                  <Label className="text-sm text-muted-foreground">Your Proof</Label>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={viewingCompletedTask.proofImageUrl}
                    alt="Proof"
                    className="w-full h-40 object-cover rounded-lg mt-1"
                  />
                </div>
              )}

              {/* Your Note */}
              {viewingCompletedTask.completionNote && (
                <div>
                  <Label className="text-sm text-muted-foreground">Your Note</Label>
                  <p className="text-sm bg-gray-50 p-2 rounded">{viewingCompletedTask.completionNote}</p>
                </div>
              )}

              {/* Parent Comment */}
              {viewingCompletedTask.parentComment && (
                <div className="bg-purple-50 p-3 rounded-lg">
                  <Label className="text-sm text-purple-600 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    Parent Feedback
                  </Label>
                  <p className="text-sm text-purple-700 mt-1">{viewingCompletedTask.parentComment}</p>
                </div>
              )}

              {/* Request Feedback Section - only show if not already requested and no parent comment */}
              {!viewingCompletedTask.feedbackRequested && !viewingCompletedTask.parentComment && (
                <div className="border-t pt-4 space-y-3">
                  <Label className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    Want parent feedback on this task?
                  </Label>
                  <Input
                    value={feedbackNote}
                    onChange={(e) => setFeedbackNote(e.target.value)}
                    placeholder="Add a note to your parent (optional)"
                  />
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={handleRequestFeedbackOnCompleted}
                    disabled={isRequestingCompletedFeedback}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {isRequestingCompletedFeedback ? "Requesting..." : "Request Parent Feedback"}
                  </Button>
                </div>
              )}

              {/* Feedback already requested */}
              {viewingCompletedTask.feedbackRequested && !viewingCompletedTask.parentComment && (
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-blue-600 flex items-center justify-center gap-1">
                    <HelpCircle className="w-4 h-4" />
                    Feedback requested - waiting for parent response
                  </p>
                </div>
              )}

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setViewingCompletedTask(null)}
              >
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
