"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight, Star, ListTodo } from "lucide-react"
import { Button } from "@/components/ui/button"

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
  createdAt: string
  isRecurring?: boolean
  recurringType?: string | null
}

interface CalendarEvent {
  id: string
  title: string
  description: string | null
  startTime: string
  endTime: string
  isAllDay: boolean
  location: string | null
  convertedToTaskId: string | null
}

interface CalendarViewProps {
  tasks: Task[]
  events?: CalendarEvent[]
  kidId: string
  onTaskClick?: (task: Task) => void
  onEventClick?: (event: CalendarEvent) => void
  onDayClick?: (date: Date, tasks: Task[], events: CalendarEvent[]) => void
  onRewardsClick?: (date: Date, points: number, tasks: Task[]) => void
  onTodoClick?: (date: Date, tasks: Task[]) => void
}

export function CalendarView({
  tasks,
  events = [],
  onRewardsClick,
  onTodoClick,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Expand recurring tasks for the current month view
  const expandedTasks = useMemo(() => {
    const result: Record<string, Task[]> = {}
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    tasks.forEach((task) => {
      // Handle recurring tasks
      if (task.isRecurring && task.recurringType && !task.isCompleted) {
        const startDate = task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt)
        startDate.setHours(0, 0, 0, 0)

        // Generate instances for the current month
        for (let day = 1; day <= daysInMonth; day++) {
          const checkDate = new Date(year, month, day)
          checkDate.setHours(0, 0, 0, 0)

          // Only show future recurring instances (after start date)
          if (checkDate < startDate) continue

          let shouldShow = false

          switch (task.recurringType) {
            case "daily":
              shouldShow = true
              break
            case "weekly":
              shouldShow = checkDate.getDay() === startDate.getDay()
              break
            case "monthly":
              shouldShow = checkDate.getDate() === startDate.getDate()
              break
            case "weekdays":
              const dayOfWeek = checkDate.getDay()
              shouldShow = dayOfWeek >= 1 && dayOfWeek <= 5
              break
          }

          if (shouldShow) {
            const dateStr = checkDate.toDateString()
            if (!result[dateStr]) result[dateStr] = []
            // Add a virtual recurring instance
            result[dateStr].push({
              ...task,
              id: `${task.id}-${dateStr}`, // Unique ID for the instance
            })
          }
        }
      } else {
        // Non-recurring tasks or completed recurring tasks
        const dateStr = task.completedAt
          ? new Date(task.completedAt).toDateString()
          : task.dueDate
          ? new Date(task.dueDate).toDateString()
          : new Date(task.createdAt).toDateString()

        if (!result[dateStr]) result[dateStr] = []
        result[dateStr].push(task)
      }
    })

    return result
  }, [tasks, year, month, daysInMonth])

  // Group events by date
  const eventsByDate = useMemo(() => {
    const result: Record<string, CalendarEvent[]> = {}
    events.forEach((event) => {
      const dateStr = new Date(event.startTime).toDateString()
      if (!result[dateStr]) result[dateStr] = []
      result[dateStr].push(event)
    })
    return result
  }, [events])

  const getDayTasks = (day: number) => {
    const dateStr = new Date(year, month, day).toDateString()
    return expandedTasks[dateStr] || []
  }

  const getDayEvents = (day: number) => {
    const dateStr = new Date(year, month, day).toDateString()
    return eventsByDate[dateStr] || []
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      year === today.getFullYear() &&
      month === today.getMonth() &&
      day === today.getDate()
    )
  }

  const days = []
  // Empty cells for days before the first day of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-20 bg-gray-50 rounded" />)
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayTasks = getDayTasks(day)
    getDayEvents(day) // Ensure events are fetched for the day
    const completedTasks = dayTasks.filter((t) => t.isCompleted)
    const pendingTasks = dayTasks.filter((t) => !t.isCompleted && t.requestStatus === "approved")
    const totalPoints = completedTasks.reduce((sum, t) => sum + t.pointValue, 0)
    const date = new Date(year, month, day)

    days.push(
      <div
        key={day}
        className={`h-20 p-1 border rounded-lg transition-colors ${
          isToday(day)
            ? "bg-purple-50 border-purple-300"
            : "bg-white border-gray-200"
        }`}
      >
        {/* Day header */}
        <div className="flex justify-between items-start mb-1">
          <span
            className={`text-sm font-medium ${
              isToday(day) ? "text-purple-600" : "text-gray-700"
            }`}
          >
            {day}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-1 mb-1">
          {/* Rewards button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRewardsClick?.(date, totalPoints, completedTasks)
            }}
            className={`flex-1 flex items-center justify-center gap-0.5 py-1 rounded text-xs transition-colors ${
              totalPoints > 0
                ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                : "bg-gray-100 text-gray-400 hover:bg-gray-200"
            }`}
            title="View rewards earned"
          >
            <Star className={`w-3 h-3 ${totalPoints > 0 ? "fill-amber-400" : ""}`} />
            <span className="font-medium">{totalPoints}</span>
          </button>

          {/* Today's Tasks button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onTodoClick?.(date, pendingTasks)
            }}
            className={`flex-1 flex items-center justify-center gap-0.5 py-1 rounded text-xs transition-colors ${
              pendingTasks.length > 0
                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                : "bg-gray-100 text-gray-400 hover:bg-gray-200"
            }`}
            title="Today's Tasks"
          >
            <ListTodo className="w-3 h-3" />
            <span className="font-medium">{pendingTasks.length}</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-semibold min-w-[180px] text-center">
            {monthNames[month]} {year}
          </h2>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={goToToday}>
          Today
        </Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-500 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">{days}</div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-100" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-100" />
          <span>Today&apos;s Tasks</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-100" />
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-purple-100" />
          <span>Calendar Event</span>
        </div>
        <div className="flex items-center gap-1">
          <span>🔄</span>
          <span>Recurring</span>
        </div>
      </div>
    </div>
  )
}
