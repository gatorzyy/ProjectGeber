"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Check, X, Lightbulb, Star } from "lucide-react"
import { RewardRequest } from "@/lib/types"
import { rewardRequestsApi } from "@/lib/api"
import { Modal, PageHeader, KidAvatar, StarPoints } from "@/components"

export default function RewardRequestsPage() {
  const [requests, setRequests] = useState<RewardRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending")
  const [selectedRequest, setSelectedRequest] = useState<RewardRequest | null>(null)
  const [pointCost, setPointCost] = useState(50)
  const [parentNote, setParentNote] = useState("")

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const data = await rewardRequestsApi.getAll()
      setRequests(data)
    } catch (error) {
      console.error("Failed to fetch reward requests:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!selectedRequest) return

    try {
      await rewardRequestsApi.respond(selectedRequest.id, {
        status: "approved",
        pointCost,
        parentNote: parentNote || undefined,
      })
      setSelectedRequest(null)
      setParentNote("")
      fetchRequests()
    } catch (error) {
      console.error("Failed to approve:", error)
    }
  }

  const handleReject = async () => {
    if (!selectedRequest) return

    try {
      await rewardRequestsApi.respond(selectedRequest.id, {
        status: "rejected",
        parentNote: parentNote || "This reward idea wasn't approved this time.",
      })
      setSelectedRequest(null)
      setParentNote("")
      fetchRequests()
    } catch (error) {
      console.error("Failed to reject:", error)
    }
  }

  const filteredRequests = filter === "all"
    ? requests
    : requests.filter((r) => r.status === filter)

  const pendingCount = requests.filter((r) => r.status === "pending").length

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <PageHeader title="Reward Ideas" backHref="/admin" backLabel="Back to Admin" />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-purple-500" />
          <span className="text-muted-foreground">Kids' suggested rewards</span>
        </div>
        {pendingCount > 0 && (
          <Badge variant="destructive">{pendingCount} pending</Badge>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        {(["pending", "approved", "rejected", "all"] as const).map((status) => (
          <Button
            key={status}
            variant={filter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <p>Loading...</p>
        ) : filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No {filter === "all" ? "" : filter} reward ideas.
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card
              key={request.id}
              onClick={() => {
                setSelectedRequest(request)
                setPointCost(request.suggestedCost)
                setParentNote(request.parentNote || "")
              }}
              className={`cursor-pointer hover:shadow-md transition-all ${
                request.status === "pending"
                  ? "border-purple-200 bg-purple-50"
                  : request.status === "approved"
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <CardContent className="flex items-center gap-4 p-4">
                {request.kid && (
                  <KidAvatar name={request.kid.name} color={request.kid.avatarColor} size="lg" />
                )}
                <div className="flex-grow">
                  <h3 className="font-medium">{request.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {request.kid?.name} • Suggested: {request.suggestedCost} pts
                  </p>
                  {request.description && (
                    <p className="text-sm text-muted-foreground mt-1">{request.description}</p>
                  )}
                </div>
                <Badge
                  className={
                    request.status === "pending"
                      ? "bg-purple-500"
                      : request.status === "approved"
                      ? "bg-green-500"
                      : "bg-red-500"
                  }
                >
                  {request.status}
                </Badge>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Request Detail Modal */}
      <Modal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title={
          selectedRequest && (
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-purple-500" />
              Reward Idea
            </div>
          )
        }
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {selectedRequest.kid && (
                <KidAvatar
                  name={selectedRequest.kid.name}
                  color={selectedRequest.kid.avatarColor}
                  size="lg"
                />
              )}
              <div>
                <p className="font-medium">{selectedRequest.kid?.name}</p>
                <p className="text-sm text-muted-foreground">suggested this reward</p>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-bold text-lg">{selectedRequest.name}</h3>
              {selectedRequest.description && (
                <p className="text-muted-foreground mt-1">{selectedRequest.description}</p>
              )}
              <div className="flex items-center gap-1 mt-2 text-purple-600">
                <Star className="w-4 h-4 fill-purple-400" />
                <span>Suggested cost: {selectedRequest.suggestedCost} points</span>
              </div>
            </div>

            {selectedRequest.status === "pending" && (
              <>
                <div>
                  <Label>Final Point Cost (you can adjust)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={pointCost}
                    onChange={(e) => setPointCost(parseInt(e.target.value) || 50)}
                  />
                </div>

                <div>
                  <Label>Note for {selectedRequest.kid?.name} (optional)</Label>
                  <Input
                    value={parentNote}
                    onChange={(e) => setParentNote(e.target.value)}
                    placeholder="Great idea! or Sorry, not this time..."
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={handleApprove}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Approve & Create Reward
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleReject}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </>
            )}

            {selectedRequest.status !== "pending" && (
              <div>
                <Badge
                  className={selectedRequest.status === "approved" ? "bg-green-500" : "bg-red-500"}
                >
                  {selectedRequest.status}
                </Badge>
                {selectedRequest.parentNote && (
                  <p className="mt-2 text-sm bg-gray-50 p-2 rounded">
                    {selectedRequest.parentNote}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
