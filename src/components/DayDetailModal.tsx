"use client"

import { useState } from "react"
import { X, Star, ListTodo, Check, Clock, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Task {
  id: string
  title: string
  description: string | null
  pointValue: number
  isCompleted: boolean
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

interface DayDetailModalProps {
  isOpen: boolean
  onClose: () => void
  date: Date
  mode: "rewards" | "todo" | "all"
  completedTasks?: Task[]
  pendingTasks?: Task[]
  events?: CalendarEvent[]
  totalPoints?: number
  onTaskClick?: (task: Task) => void
  onEventClick?: (event: CalendarEvent) => void
  onConvertEvent?: (event: CalendarEvent) => void
}

export function DayDetailModal({
  isOpen,
  onClose,
  date,
  mode,
  completedTasks = [],
  pendingTasks = [],
  events = [],
  totalPoints = 0,
  onTaskClick,
  onEventClick,
  onConvertEvent,
}: DayDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"rewards" | "todo" | "events">(
    mode === "rewards" ? "rewards" : mode === "todo" ? "todo" : "rewards"
  )

  if (!isOpen) return null

  const formatDate = (d: Date) => {
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            {formatDate(date)}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("rewards")}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
              activeTab === "rewards"
                ? "text-amber-600 border-b-2 border-amber-600 bg-amber-50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Star className="w-4 h-4" />
            Rewards ({totalPoints})
          </button>
          <button
            onClick={() => setActiveTab("todo")}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
              activeTab === "todo"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <ListTodo className="w-4 h-4" />
            To-Do ({pendingTasks.length})
          </button>
          {events.length > 0 && (
            <button
              onClick={() => setActiveTab("events")}
              className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                activeTab === "events"
                  ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Calendar className="w-4 h-4" />
              Events ({events.length})
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Rewards Tab */}
          {activeTab === "rewards" && (
            <div>
              {completedTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Star className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No rewards earned on this day</p>
                </div>
              ) : (
                <>
                  <div className="bg-amber-50 rounded-lg p-4 mb-4 text-center">
                    <Star className="w-8 h-8 mx-auto mb-1 fill-amber-400 text-amber-500" />
                    <p className="text-2xl font-bold text-amber-600">
                      {totalPoints} points
                    </p>
                    <p className="text-sm text-amber-500">
                      from {completedTasks.length} completed task
                      {completedTasks.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {completedTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => onTaskClick?.(task)}
                        className="flex items-center justify-between p-3 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-600" />
                          <div>
                            <p className="font-medium text-gray-800">
                              {task.title}
                            </p>
                            {task.isRecurring && (
                              <span className="text-xs text-blue-500">
                                🔄 {task.recurringType}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-amber-600 font-medium">
                          +{task.pointValue} ⭐
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* To-Do Tab */}
          {activeTab === "todo" && (
            <div>
              {pendingTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Check className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>All tasks completed for this day!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onTaskClick?.(task)}
                      className="flex items-center justify-between p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="font-medium text-gray-800">
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {task.description}
                            </p>
                          )}
                          {task.isRecurring && (
                            <span className="text-xs text-blue-500">
                              🔄 {task.recurringType}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-amber-600 font-medium">
                        {task.pointValue} ⭐
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Events Tab */}
          {activeTab === "events" && (
            <div>
              {events.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No calendar events on this day</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="p-3 bg-purple-50 rounded-lg"
                    >
                      <div
                        onClick={() => onEventClick?.(event)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-800">
                              {event.title}
                            </p>
                            {event.description && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {event.description}
                              </p>
                            )}
                            <p className="text-xs text-purple-600 mt-1">
                              {event.isAllDay
                                ? "All day"
                                : `${formatTime(event.startTime)} - ${formatTime(
                                    event.endTime
                                  )}`}
                            </p>
                            {event.location && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                📍 {event.location}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      {!event.convertedToTaskId && onConvertEvent && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 w-full text-xs"
                          onClick={() => onConvertEvent(event)}
                        >
                          Convert to Task
                        </Button>
                      )}
                      {event.convertedToTaskId && (
                        <p className="text-xs text-green-600 mt-2 text-center">
                          ✓ Converted to task
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4">
          <Button onClick={onClose} className="w-full" variant="outline">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
