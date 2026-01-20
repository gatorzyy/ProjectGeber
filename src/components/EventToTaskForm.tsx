"use client"

import { useState } from "react"
import { X, Calendar, Repeat } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CalendarEvent {
  id: string
  title: string
  description: string | null
  startTime: string
  endTime: string
  isAllDay: boolean
  location: string | null
}

interface Kid {
  id: string
  name: string
  avatarColor: string
}

interface EventToTaskFormProps {
  isOpen: boolean
  onClose: () => void
  event: CalendarEvent
  kids: Kid[]
  onSubmit: (data: {
    eventId: string
    kidId: string
    title: string
    description: string
    pointValue: number
    isRecurring: boolean
    recurringType: string | null
    startDate: string
  }) => Promise<void>
}

export function EventToTaskForm({
  isOpen,
  onClose,
  event,
  kids,
  onSubmit,
}: EventToTaskFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    kidId: kids[0]?.id || "",
    title: event.title,
    description: event.description || "",
    pointValue: 10,
    isRecurring: false,
    recurringType: "daily" as string,
    startDate: new Date(event.startTime).toISOString().split("T")[0],
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await onSubmit({
        eventId: event.id,
        kidId: formData.kidId,
        title: formData.title,
        description: formData.description,
        pointValue: formData.pointValue,
        isRecurring: formData.isRecurring,
        recurringType: formData.isRecurring ? formData.recurringType : null,
        startDate: formData.startDate,
      })
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-800">
              Convert to Task
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Event Info */}
          <div className="bg-purple-50 rounded-lg p-3 text-sm">
            <p className="font-medium text-purple-800">From calendar event:</p>
            <p className="text-purple-600">{event.title}</p>
            <p className="text-purple-400 text-xs mt-1">
              {new Date(event.startTime).toLocaleString()}
            </p>
          </div>

          {/* Kid Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign to
            </label>
            <select
              value={formData.kidId}
              onChange={(e) =>
                setFormData({ ...formData, kidId: e.target.value })
              }
              className="w-full border rounded-lg p-2"
              required
            >
              {kids.map((kid) => (
                <option key={kid.id} value={kid.id}>
                  {kid.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full border rounded-lg p-2"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full border rounded-lg p-2 h-20"
              placeholder="Add task description..."
            />
          </div>

          {/* Point Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Points
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.pointValue}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  pointValue: parseInt(e.target.value) || 1,
                })
              }
              className="w-full border rounded-lg p-2"
              required
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              className="w-full border rounded-lg p-2"
              required
            />
          </div>

          {/* Recurring */}
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) =>
                  setFormData({ ...formData, isRecurring: e.target.checked })
                }
                className="rounded"
              />
              <Repeat className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">Make recurring</span>
            </label>

            {formData.isRecurring && (
              <select
                value={formData.recurringType}
                onChange={(e) =>
                  setFormData({ ...formData, recurringType: e.target.value })
                }
                className="w-full border rounded-lg p-2"
              >
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays only</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || !formData.kidId}
            >
              {isSubmitting ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
