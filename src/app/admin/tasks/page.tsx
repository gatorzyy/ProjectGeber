"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Edit2, Save, Copy, Check } from "lucide-react"
import { Kid, Task, TaskFormData } from "@/lib/types"
import { kidsApi, tasksApi } from "@/lib/api"
import { Modal, KidAvatar, StarPoints, PageHeader } from "@/components"

export default function ManageTasksPage() {
  const [kids, setKids] = useState<Kid[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [, setIsLoading] = useState(true)
  const [selectedKid, setSelectedKid] = useState<string>("")
  const [newTask, setNewTask] = useState<TaskFormData>({
    title: "",
    description: "",
    pointValue: 1,
    isRecurring: false,
    recurringType: "daily",
  })

  // Edit modal state
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editForm, setEditForm] = useState<TaskFormData & { isCompleted: boolean }>({
    title: "",
    description: "",
    pointValue: 1,
    isRecurring: false,
    recurringType: "daily",
    isCompleted: false,
  })

  // Copy modal state
  const [copyingTask, setCopyingTask] = useState<Task | null>(null)
  const [selectedKidsToCopy, setSelectedKidsToCopy] = useState<string[]>([])
  const [isCopying, setIsCopying] = useState(false)

  useEffect(() => {
    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchData = async () => {
    try {
      const [kidsData, tasksData] = await Promise.all([
        kidsApi.getAll(),
        tasksApi.getAll(),
      ])
      setKids(kidsData)
      setTasks(tasksData)
      if (kidsData.length > 0 && !selectedKid) {
        setSelectedKid(kidsData[0].id)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTask.title.trim() || !selectedKid) return

    try {
      await tasksApi.create({
        kidId: selectedKid,
        title: newTask.title,
        description: newTask.description || null,
        pointValue: newTask.pointValue,
        isRecurring: newTask.isRecurring,
        recurringType: newTask.isRecurring ? newTask.recurringType : null,
      })

      setNewTask({
        title: "",
        description: "",
        pointValue: 1,
        isRecurring: false,
        recurringType: "daily",
      })
      fetchData()
    } catch (error) {
      console.error("Failed to add task:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this task?")) return
    try {
      await tasksApi.delete(id)
      fetchData()
    } catch (error) {
      console.error("Failed to delete task:", error)
    }
  }

  const openEditModal = (task: Task) => {
    setEditingTask(task)
    setEditForm({
      title: task.title,
      description: task.description || "",
      pointValue: task.pointValue,
      isRecurring: task.isRecurring,
      recurringType: task.recurringType || "daily",
      isCompleted: task.isCompleted,
    })
  }

  const handleSaveEdit = async () => {
    if (!editingTask || !editForm.title.trim()) return

    try {
      await tasksApi.update(editingTask.id, {
        title: editForm.title,
        description: editForm.description || null,
        pointValue: editForm.pointValue,
        isRecurring: editForm.isRecurring,
        recurringType: editForm.isRecurring ? editForm.recurringType : null,
        isCompleted: editForm.isCompleted,
      })

      setEditingTask(null)
      fetchData()
    } catch (error) {
      console.error("Failed to update task:", error)
    }
  }

  const openCopyModal = (task: Task) => {
    setCopyingTask(task)
    setSelectedKidsToCopy([])
  }

  const toggleKidSelection = (kidId: string) => {
    setSelectedKidsToCopy((prev) =>
      prev.includes(kidId)
        ? prev.filter((id) => id !== kidId)
        : [...prev, kidId]
    )
  }

  const handleCopyTask = async () => {
    if (!copyingTask || selectedKidsToCopy.length === 0) return
    setIsCopying(true)

    try {
      await tasksApi.copy(copyingTask.id, selectedKidsToCopy)
      setCopyingTask(null)
      setSelectedKidsToCopy([])
      fetchData()
    } catch (error) {
      console.error("Failed to copy task:", error)
    } finally {
      setIsCopying(false)
    }
  }

  const filteredTasks = selectedKid
    ? tasks.filter((t) => t.kidId === selectedKid)
    : tasks

  const selectedKidData = kids.find((k) => k.id === selectedKid)

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <PageHeader title="Manage Tasks" backHref="/admin" backLabel="Back to Admin" />

      {kids.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">Add a kid first before creating tasks.</p>
            <Link href="/admin/kids">
              <Button>Go to Manage Kids</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Kid Selector */}
          <div className="mb-6">
            <Label>Select Kid</Label>
            <div className="flex gap-2 mt-2 flex-wrap">
              {kids.map((kid) => (
                <Button
                  key={kid.id}
                  variant={selectedKid === kid.id ? "default" : "outline"}
                  onClick={() => setSelectedKid(kid.id)}
                  className="flex items-center gap-2"
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: kid.avatarColor }}
                  />
                  {kid.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Add Task Form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Add Task for {selectedKidData?.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddTask} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Task Title</Label>
                    <Input
                      id="title"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      placeholder="e.g., Brush teeth"
                    />
                  </div>
                  <div>
                    <Label htmlFor="points">Points</Label>
                    <Input
                      id="points"
                      type="number"
                      min="1"
                      value={newTask.pointValue}
                      onChange={(e) => setNewTask({ ...newTask, pointValue: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Additional details..."
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newTask.isRecurring}
                      onChange={(e) => setNewTask({ ...newTask, isRecurring: e.target.checked })}
                      className="rounded"
                    />
                    <span>Recurring task</span>
                  </label>
                  {newTask.isRecurring && (
                    <select
                      value={newTask.recurringType}
                      onChange={(e) => setNewTask({ ...newTask, recurringType: e.target.value })}
                      className="border rounded px-2 py-1"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  )}
                </div>
                <Button type="submit">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Task List */}
          <h2 className="text-xl font-semibold mb-4">
            Tasks for {selectedKidData?.name} ({filteredTasks.length})
          </h2>

          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No tasks yet.</p>
            ) : (
              filteredTasks.map((task) => (
                <Card key={task.id} className={task.isCompleted ? "opacity-60" : ""}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex-grow">
                      <h3 className="font-medium">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      )}
                      <div className="flex gap-2 mt-1">
                        {task.isRecurring && (
                          <Badge variant="secondary" className="text-xs">
                            {task.recurringType}
                          </Badge>
                        )}
                        {task.isCompleted && (
                          <Badge variant="outline" className="text-xs text-green-600">
                            Completed
                          </Badge>
                        )}
                      </div>
                    </div>
                    <StarPoints points={task.pointValue} />
                    <Button size="sm" variant="ghost" onClick={() => openCopyModal(task)} title="Copy to other kids">
                      <Copy className="w-4 h-4 text-blue-500" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEditModal(task)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(task.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}

      {/* Task Edit Modal */}
      <Modal isOpen={!!editingTask} onClose={() => setEditingTask(null)} title="Edit Task">
        <div className="space-y-4">
          <div>
            <Label>Task Title</Label>
            <Input
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              placeholder="Task title"
            />
          </div>

          <div>
            <Label>Description (optional)</Label>
            <Input
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              placeholder="Description"
            />
          </div>

          <div>
            <Label>Points</Label>
            <Input
              type="number"
              min="1"
              value={editForm.pointValue}
              onChange={(e) => setEditForm({ ...editForm, pointValue: parseInt(e.target.value) || 1 })}
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editForm.isRecurring}
                onChange={(e) => setEditForm({ ...editForm, isRecurring: e.target.checked })}
                className="rounded"
              />
              <span>Recurring task</span>
            </label>
            {editForm.isRecurring && (
              <select
                value={editForm.recurringType}
                onChange={(e) => setEditForm({ ...editForm, recurringType: e.target.value })}
                className="border rounded px-2 py-1"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            )}
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={editForm.isCompleted}
              onChange={(e) => setEditForm({ ...editForm, isCompleted: e.target.checked })}
              className="rounded"
            />
            <span>Mark as completed</span>
          </label>

          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleSaveEdit} disabled={!editForm.title.trim()}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
            <Button variant="outline" onClick={() => setEditingTask(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Task Copy Modal */}
      <Modal
        isOpen={!!copyingTask}
        onClose={() => setCopyingTask(null)}
        title={
          <>
            <Copy className="w-5 h-5 text-blue-500" />
            Copy Task
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="font-medium">{copyingTask?.title}</p>
            {copyingTask?.description && (
              <p className="text-sm text-muted-foreground">{copyingTask.description}</p>
            )}
            <StarPoints points={copyingTask?.pointValue || 0} size="sm" className="mt-1" />
          </div>

          <div>
            <Label className="mb-2 block">Copy to:</Label>
            <div className="space-y-2">
              {kids.map((kid) => (
                  <div
                    key={kid.id}
                    onClick={() => toggleKidSelection(kid.id)}
                    className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                      selectedKidsToCopy.includes(kid.id)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <KidAvatar name={kid.name} color={kid.avatarColor} />
                    <span className="flex-grow font-medium">
                      {kid.name}
                      {kid.id === copyingTask?.kidId && (
                        <span className="text-xs text-gray-500 ml-2">(duplicate for same kid)</span>
                      )}
                    </span>
                    {selectedKidsToCopy.includes(kid.id) && (
                      <Check className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                ))}
            </div>
            {kids.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No kids available.
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={handleCopyTask}
              disabled={selectedKidsToCopy.length === 0 || isCopying}
            >
              <Copy className="w-4 h-4 mr-2" />
              {isCopying ? "Copying..." : `Copy to ${selectedKidsToCopy.length} kid(s)`}
            </Button>
            <Button variant="outline" onClick={() => setCopyingTask(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
