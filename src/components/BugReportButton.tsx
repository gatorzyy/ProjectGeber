"use client"

import { useState } from "react"
import { Bug, X, Send, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface BugReportButtonProps {
  page: string
  userType?: "kid" | "parent" | "admin" | "guest"
  userId?: string
}

export function BugReportButton({ page, userType = "guest", userId }: BugReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      setError("Please fill in all fields")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/bug-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          page,
          userType,
          userId,
        }),
      })

      if (res.ok) {
        setSubmitted(true)
        setTitle("")
        setDescription("")
        setTimeout(() => {
          setIsOpen(false)
          setSubmitted(false)
        }, 2000)
      } else {
        const data = await res.json()
        setError(data.error || "Failed to submit report")
      }
    } catch {
      setError("Failed to submit report")
    }
    setIsSubmitting(false)
  }

  const handleClose = () => {
    setIsOpen(false)
    setSubmitted(false)
    setError("")
  }

  return (
    <>
      {/* Floating Bug Report Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-red-500 hover:bg-red-600 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110"
        title="Report a Bug"
      >
        <Bug className="w-5 h-5" />
      </button>

      {/* Bug Report Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Bug className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Report a Bug</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="text-white/80 hover:text-white p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {submitted ? (
                <div className="text-center py-10">
                  <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-green-700 mb-2">Thank You!</h3>
                  <p className="text-gray-500">
                    Your bug report has been submitted.<br />
                    We&apos;ll look into it soon.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Title Field */}
                  <div className="space-y-2">
                    <Label htmlFor="bug-title" className="text-sm font-semibold text-gray-700">
                      What went wrong?
                    </Label>
                    <Input
                      id="bug-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Brief summary of the issue"
                      maxLength={100}
                      className="h-12 text-base px-4"
                    />
                  </div>

                  {/* Description Field */}
                  <div className="space-y-2">
                    <Label htmlFor="bug-description" className="text-sm font-semibold text-gray-700">
                      Tell us more
                    </Label>
                    <textarea
                      id="bug-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What were you trying to do? What happened instead?"
                      className="w-full min-h-[120px] p-4 border border-gray-200 rounded-lg text-base resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      maxLength={1000}
                    />
                    <p className="text-xs text-gray-400 text-right">
                      {description.length}/1000 characters
                    </p>
                  </div>

                  {/* Context Info */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                    <p className="text-xs text-gray-500">
                      <span className="font-medium text-gray-600">Page:</span> {page}
                    </p>
                    <p className="text-xs text-gray-500">
                      <span className="font-medium text-gray-600">User Type:</span> {userType}
                    </p>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-12 text-base"
                      onClick={handleClose}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 h-12 text-base bg-red-500 hover:bg-red-600"
                      disabled={isSubmitting}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {isSubmitting ? "Submitting..." : "Submit"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
