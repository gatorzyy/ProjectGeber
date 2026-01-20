"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, Star, Clock } from "lucide-react"
import { Redemption } from "@/lib/types"
import { redemptionsApi } from "@/lib/api"
import { PageHeader, KidAvatar, StarPoints } from "@/components"

export default function ManageRedemptionsPage() {
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending")

  useEffect(() => {
    fetchRedemptions()
  }, [])

  const fetchRedemptions = async () => {
    try {
      const data = await redemptionsApi.getAll()
      setRedemptions(data)
    } catch (error) {
      console.error("Failed to fetch redemptions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      await redemptionsApi.update(id, { status })
      fetchRedemptions()
    } catch (error) {
      console.error("Failed to update redemption:", error)
    }
  }

  const filteredRedemptions =
    filter === "all"
      ? redemptions
      : redemptions.filter((r) => r.status === filter)

  const pendingCount = redemptions.filter((r) => r.status === "pending").length

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <PageHeader title="Redemptions" backHref="/admin" backLabel="Back to Admin" />

      <div className="flex items-center justify-between mb-6">
        <div />
        {pendingCount > 0 && (
          <Badge variant="destructive" className="text-sm">
            {pendingCount} pending
          </Badge>
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
        ) : filteredRedemptions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No {filter === "all" ? "" : filter} redemptions.
          </p>
        ) : (
          filteredRedemptions.map((redemption) => (
            <Card
              key={redemption.id}
              className={
                redemption.status === "pending"
                  ? "border-amber-200 bg-amber-50"
                  : redemption.status === "approved"
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }
            >
              <CardContent className="flex items-center gap-4 p-4">
                {redemption.kid && (
                  <KidAvatar
                    name={redemption.kid.name}
                    color={redemption.kid.avatarColor}
                    size="lg"
                  />
                )}
                <div className="flex-grow">
                  <h3 className="font-medium">
                    {redemption.kid?.name} wants: {redemption.reward?.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{redemption.pointsSpent} points</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{redemption.createdAt ? new Date(redemption.createdAt).toLocaleDateString() : ""}</span>
                    </div>
                  </div>
                </div>
                {redemption.status === "pending" ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(redemption.id, "approved")}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleUpdateStatus(redemption.id, "rejected")}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                ) : (
                  <Badge
                    variant={redemption.status === "approved" ? "default" : "destructive"}
                    className={redemption.status === "approved" ? "bg-green-600" : ""}
                  >
                    {redemption.status}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
