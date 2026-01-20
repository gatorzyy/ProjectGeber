"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Bug, Clock, CheckCircle, AlertCircle, XCircle, Trash2, MessageSquare, Home } from "lucide-react"
import { Modal } from "@/components"

interface BugReport {
  id: string
  title: string
  description: string
  page: string
  userType: string
  userId: string | null
  status: string
  priority: string
  adminNote: string | null
  createdAt: string
  updatedAt: string
}

export default function AdminBugReportsPage() {
  const router = useRouter()
  const [reports, setReports] = useState<BugReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<BugReport | null>(null)
  const [adminNote, setAdminNote] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [selectedPriority, setSelectedPriority] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [filter, setFilter] = useState<"all" | "open" | "in_progress" | "resolved" | "closed">("all")

  useEffect(() => {
    checkAuthAndFetch()
  }, [])

  const checkAuthAndFetch = async () => {
    const authRes = await fetch("/api/admin/auth")
    const authData = await authRes.json()
    if (!authData.authenticated) {
      router.push("/admin")
      return
    }
    fetchReports()
  }

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/bug-reports")
      if (res.ok) {
        const data = await res.json()
        setReports(data.reports || [])
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const openReport = (report: BugReport) => {
    setSelectedReport(report)
    setAdminNote(report.adminNote || "")
    setSelectedStatus(report.status)
    setSelectedPriority(report.priority)
  }

  const handleUpdate = async () => {
    if (!selectedReport) return
    setIsUpdating(true)

    try {
      const res = await fetch(`/api/bug-reports/${selectedReport.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: selectedStatus,
          priority: selectedPriority,
          adminNote: adminNote || null,
        }),
      })

      if (res.ok) {
        fetchReports()
        setSelectedReport(null)
      }
    } catch (error) {
      console.error("Failed to update report:", error)
    }
    setIsUpdating(false)
  }

  const handleMarkFixedAndClose = async () => {
    if (!selectedReport) return
    setIsUpdating(true)

    try {
      const res = await fetch(`/api/bug-reports/${selectedReport.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "resolved",
          priority: selectedPriority,
          adminNote: adminNote ? adminNote + "\n\nMarked as fixed." : "Marked as fixed.",
        }),
      })

      if (res.ok) {
        fetchReports()
        setSelectedReport(null)
      }
    } catch (error) {
      console.error("Failed to update report:", error)
    }
    setIsUpdating(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bug report?")) return

    try {
      const res = await fetch(`/api/bug-reports/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        fetchReports()
        setSelectedReport(null)
      }
    } catch (error) {
      console.error("Failed to delete report:", error)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case "in_progress":
        return <Clock className="w-4 h-4 text-amber-500" />
      case "resolved":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "closed":
        return <XCircle className="w-4 h-4 text-gray-500" />
      default:
        return <Bug className="w-4 h-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      open: "bg-red-100 text-red-700",
      in_progress: "bg-amber-100 text-amber-700",
      resolved: "bg-green-100 text-green-700",
      closed: "bg-gray-100 text-gray-700",
    }
    return (
      <Badge className={variants[status] || "bg-gray-100"}>
        {status.replace("_", " ")}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, string> = {
      low: "bg-blue-100 text-blue-700",
      medium: "bg-yellow-100 text-yellow-700",
      high: "bg-orange-100 text-orange-700",
      critical: "bg-red-100 text-red-700",
    }
    return (
      <Badge className={variants[priority] || "bg-gray-100"}>
        {priority}
      </Badge>
    )
  }

  const filteredReports = filter === "all"
    ? reports
    : reports.filter((r) => r.status === filter)

  const openCount = reports.filter((r) => r.status === "open").length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex gap-2 mb-4">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Button>
        </Link>
        <Link href="/">
          <Button variant="ghost" size="sm">
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bug className="w-6 h-6 text-red-500" />
            Bug Reports
            {openCount > 0 && (
              <span className="bg-red-500 text-white text-sm px-2 py-0.5 rounded-full">
                {openCount} open
              </span>
            )}
          </h1>
          <p className="text-gray-500">
            Manage user-reported bugs and issues
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(["all", "open", "in_progress", "resolved", "closed"] as const).map((status) => (
          <Button
            key={status}
            variant={filter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status === "all" ? "All" : status.replace("_", " ")}
            {status !== "all" && (
              <span className="ml-1 opacity-70">
                ({reports.filter((r) => r.status === status).length})
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <Card className="p-12 text-center text-gray-500">
          <Bug className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No bug reports found</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <Card
              key={report.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => openReport(report)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getStatusIcon(report.status)}</div>
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{report.title}</h3>
                      {getStatusBadge(report.status)}
                      {getPriorityBadge(report.priority)}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{report.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>Page: {report.page}</span>
                      <span>User: {report.userType}</span>
                      <span>{formatDate(report.createdAt)}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(report.id)
                    }}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Report Detail Modal */}
      <Modal
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        title={
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-red-500" />
            Bug Report Details
          </div>
        }
        maxWidth="lg"
      >
        {selectedReport && (
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-gray-500">Title</Label>
              <p className="font-medium">{selectedReport.title}</p>
            </div>

            <div>
              <Label className="text-sm text-gray-500">Description</Label>
              <p className="bg-gray-50 p-3 rounded-lg text-sm whitespace-pre-wrap">
                {selectedReport.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-500">Page</Label>
                <p className="text-sm break-all bg-gray-50 rounded px-2 py-1 mt-1">{selectedReport.page}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">User Type</Label>
                <p className="text-sm bg-gray-50 rounded px-2 py-1 mt-1 capitalize">{selectedReport.userType}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Reported</Label>
                <p className="text-sm bg-gray-50 rounded px-2 py-1 mt-1">{formatDate(selectedReport.createdAt)}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Last Updated</Label>
                <p className="text-sm bg-gray-50 rounded px-2 py-1 mt-1">{formatDate(selectedReport.updatedAt)}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Update Status</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full border rounded-lg p-2 mt-1"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="w-full border rounded-lg p-2 mt-1"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                Admin Note
              </Label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Add notes about this bug or resolution..."
                className="w-full min-h-[80px] p-3 border rounded-lg text-sm resize-none mt-1"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setSelectedReport(null)}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                className="text-green-600 border-green-300 hover:bg-green-50"
                onClick={handleMarkFixedAndClose}
                disabled={isUpdating}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Fix & Close
              </Button>
              <Button
                className="flex-1"
                onClick={handleUpdate}
                disabled={isUpdating}
              >
                {isUpdating ? "Updating..." : "Update Report"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
