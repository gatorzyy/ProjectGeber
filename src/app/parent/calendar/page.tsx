"use client"

import { useState, useEffect } from "react"
import { CalendarView } from "@/components/CalendarView"
import { DayDetailModal } from "@/components/DayDetailModal"
import { EventToTaskForm } from "@/components/EventToTaskForm"
import { RefreshCw, Link2, Unlink, AlertCircle } from "lucide-react"

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

interface Kid {
  id: string
  name: string
  avatarColor: string
}

interface Family {
  id: string
  name: string
  kids: Kid[]
}

export default function ParentCalendarPage() {
  const [families, setFamilies] = useState<Family[]>([])
  const [currentFamily, setCurrentFamily] = useState<Family | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [googleConnected, setGoogleConnected] = useState(false)
  const [googleError, setGoogleError] = useState<string | null>(null)

  // Modals
  const [showDayModal, setShowDayModal] = useState(false)
  const [dayModalData, setDayModalData] = useState<{
    date: Date
    mode: "rewards" | "todo" | "all"
    completedTasks: Task[]
    pendingTasks: Task[]
    events: CalendarEvent[]
    totalPoints: number
  } | null>(null)
  const [showEventToTaskModal, setShowEventToTaskModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  useEffect(() => {
    fetchData()
    checkGoogleConnection()
  }, [])

  useEffect(() => {
    if (currentFamily) {
      fetchTasks()
      fetchEvents()
    }
  }, [currentFamily])

  const fetchData = async () => {
    try {
      const res = await fetch("/api/users/me")
      if (res.ok) {
        const data = await res.json()
        setFamilies(data.families)
        if (data.families.length > 0) {
          setCurrentFamily(data.families[0])
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTasks = async () => {
    if (!currentFamily) return
    try {
      // Fetch tasks for all kids in the family
      const allTasks: Task[] = []
      for (const kid of currentFamily.kids) {
        const res = await fetch(`/api/kids/${kid.id}/tasks`)
        if (res.ok) {
          const data = await res.json()
          allTasks.push(...data.tasks)
        }
      }
      setTasks(allTasks)
    } catch (error) {
      console.error("Failed to fetch tasks:", error)
    }
  }

  const fetchEvents = async () => {
    if (!currentFamily) return
    try {
      const res = await fetch(`/api/calendar/events?familyId=${currentFamily.id}`)
      if (res.ok) {
        const data = await res.json()
        setEvents(data.events)
      }
    } catch (error) {
      console.error("Failed to fetch events:", error)
    }
  }

  const checkGoogleConnection = async () => {
    try {
      const res = await fetch("/api/calendar/google/disconnect")
      if (res.ok) {
        const data = await res.json()
        setGoogleConnected(data.connected)
      }
    } catch (error) {
      console.error("Failed to check Google connection:", error)
    }
  }

  const connectGoogle = async () => {
    if (!currentFamily) return
    setGoogleError(null)
    try {
      const res = await fetch(
        `/api/calendar/google/connect?familyId=${currentFamily.id}`
      )
      const data = await res.json()
      if (res.ok && data.authUrl) {
        window.location.href = data.authUrl
      } else {
        // Show error message
        if (data.error === "Google OAuth not configured") {
          setGoogleError("Google Calendar integration is not configured. Please set up GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment variables.")
        } else {
          setGoogleError(data.error || "Failed to connect to Google Calendar")
        }
      }
    } catch (error) {
      console.error("Failed to connect Google:", error)
      setGoogleError("Failed to connect to Google Calendar")
    }
  }

  const disconnectGoogle = async () => {
    try {
      await fetch("/api/calendar/google/disconnect", { method: "POST" })
      setGoogleConnected(false)
    } catch (error) {
      console.error("Failed to disconnect Google:", error)
    }
  }

  const syncGoogleCalendar = async () => {
    if (!currentFamily) return
    setIsSyncing(true)
    try {
      const res = await fetch("/api/calendar/google/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyId: currentFamily.id }),
      })
      if (res.ok) {
        await fetchEvents()
      }
    } catch (error) {
      console.error("Failed to sync:", error)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleRewardsClick = (date: Date, points: number, completedTasks: Task[]) => {
    setDayModalData({
      date,
      mode: "rewards",
      completedTasks,
      pendingTasks: [],
      events: [],
      totalPoints: points,
    })
    setShowDayModal(true)
  }

  const handleTodoClick = (date: Date, pendingTasks: Task[]) => {
    setDayModalData({
      date,
      mode: "todo",
      completedTasks: [],
      pendingTasks,
      events: [],
      totalPoints: 0,
    })
    setShowDayModal(true)
  }

  const handleConvertEvent = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setShowEventToTaskModal(true)
  }

  const handleEventToTaskSubmit = async (data: {
    eventId: string
    kidId: string
    title: string
    description: string
    pointValue: number
    isRecurring: boolean
    recurringType: string | null
    startDate: string
  }) => {
    try {
      const res = await fetch(`/api/calendar/events/${data.eventId}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        await fetchEvents()
        await fetchTasks()
      }
    } catch (error) {
      console.error("Failed to convert event:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Family Calendar</h1>
          <p className="text-gray-500">View tasks and events for your family</p>
        </div>

        <div className="flex items-center gap-3">
          {families.length > 1 && (
            <select
              value={currentFamily?.id || ""}
              onChange={(e) => {
                const family = families.find((f) => f.id === e.target.value)
                setCurrentFamily(family || null)
              }}
              className="border rounded-lg p-2"
            >
              {families.map((family) => (
                <option key={family.id} value={family.id}>
                  {family.name}
                </option>
              ))}
            </select>
          )}

          {googleConnected ? (
            <>
              <button
                onClick={syncGoogleCalendar}
                disabled={isSyncing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Syncing..." : "Sync Google"}
              </button>
              <button
                onClick={disconnectGoogle}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Unlink className="w-4 h-4" />
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={connectGoogle}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Link2 className="w-4 h-4" />
              Connect Google Calendar
            </button>
          )}
        </div>
      </div>

      {/* Google Calendar Error Message */}
      {googleError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-800 font-medium">Google Calendar Error</p>
            <p className="text-red-600 text-sm">{googleError}</p>
          </div>
          <button
            onClick={() => setGoogleError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            &times;
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <CalendarView
          tasks={tasks}
          events={events}
          kidId=""
          onRewardsClick={handleRewardsClick}
          onTodoClick={handleTodoClick}
          onEventClick={(event) => handleConvertEvent(event)}
        />
      </div>

      {/* Day Detail Modal */}
      {dayModalData && (
        <DayDetailModal
          isOpen={showDayModal}
          onClose={() => setShowDayModal(false)}
          date={dayModalData.date}
          mode={dayModalData.mode}
          completedTasks={dayModalData.completedTasks}
          pendingTasks={dayModalData.pendingTasks}
          events={dayModalData.events}
          totalPoints={dayModalData.totalPoints}
          onConvertEvent={handleConvertEvent}
        />
      )}

      {/* Event to Task Modal */}
      {selectedEvent && currentFamily && (
        <EventToTaskForm
          isOpen={showEventToTaskModal}
          onClose={() => {
            setShowEventToTaskModal(false)
            setSelectedEvent(null)
          }}
          event={selectedEvent}
          kids={currentFamily.kids}
          onSubmit={handleEventToTaskSubmit}
        />
      )}
    </div>
  )
}
