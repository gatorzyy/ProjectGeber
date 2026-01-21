"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { RewardCard } from "@/components/TaskCard"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Clock, Lightbulb, Star } from "lucide-react"
import { Modal } from "@/components"

interface Reward {
  id: string
  name: string
  description: string | null
  pointCost: number
}

interface Redemption {
  id: string
  status: string
  createdAt: Date
  reward: Reward
}

interface RewardRequest {
  id: string
  name: string
  description: string | null
  suggestedCost: number
  status: string
  parentNote: string | null
}

export function RewardsList({
  rewards,
  kidId,
  kidPoints,
  recentRedemptions,
  rewardRequests = [],
}: {
  rewards: Reward[]
  kidId: string
  kidPoints: number
  recentRedemptions: Redemption[]
  rewardRequests?: RewardRequest[]
}) {
  const router = useRouter()
  const [points] = useState(kidPoints)
  const [showSuggestForm, setShowSuggestForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [suggestForm, setSuggestForm] = useState({
    name: "",
    description: "",
    suggestedCost: 50,
  })

  const handleRedeem = async (rewardId: string) => {
    const res = await fetch("/api/redemptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kidId, rewardId }),
    })

    if (res.ok) {
      router.refresh()
    } else {
      const error = await res.json()
      alert(error.error || "Failed to request reward")
    }
  }

  const handleSuggestReward = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!suggestForm.name.trim()) return

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/reward-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kidId,
          name: suggestForm.name,
          description: suggestForm.description || null,
          suggestedCost: suggestForm.suggestedCost,
        }),
      })

      if (res.ok) {
        setSuggestForm({ name: "", description: "", suggestedCost: 50 })
        setShowSuggestForm(false)
        router.refresh()
      }
    } catch (error) {
      console.error("Failed to suggest reward:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const pendingRedemptions = recentRedemptions.filter((r) => r.status === "pending")
  const pendingRequests = rewardRequests.filter((r) => r.status === "pending")

  return (
    <div>
      {/* Suggest a Reward Button */}
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowSuggestForm(true)} variant="outline">
          <Lightbulb className="w-4 h-4 mr-2" />
          Suggest a Reward
        </Button>
      </div>

      {/* Pending Redemptions */}
      {pendingRedemptions.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pending Redemptions
          </h2>
          <div className="space-y-2">
            {pendingRedemptions.map((redemption) => (
              <Card key={redemption.id} className="bg-amber-50 border-amber-200">
                <CardContent className="flex items-center justify-between p-4">
                  <span className="font-medium">{redemption.reward.name}</span>
                  <Badge variant="secondary">Waiting for approval</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Pending Reward Suggestions */}
      {pendingRequests.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-purple-600">
            <Lightbulb className="w-5 h-5" />
            Your Reward Ideas
          </h2>
          <div className="space-y-2">
            {pendingRequests.map((request) => (
              <Card key={request.id} className="bg-purple-50 border-purple-200">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <span className="font-medium">{request.name}</span>
                    <div className="flex items-center gap-1 text-sm text-purple-600">
                      <Star className="w-3 h-3 fill-purple-400" />
                      <span>Suggested: {request.suggestedCost} points</span>
                    </div>
                  </div>
                  <Badge className="bg-purple-500">Pending Review</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-xl font-semibold mb-4">Available Rewards</h2>
      {rewards.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No rewards available yet. Suggest one!
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rewards.map((reward) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              canAfford={points >= reward.pointCost}
              onRedeem={handleRedeem}
            />
          ))}
        </div>
      )}

      {/* Suggest Reward Modal */}
      <Modal
        isOpen={showSuggestForm}
        onClose={() => setShowSuggestForm(false)}
        title={
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-purple-500" />
            Suggest a New Reward
          </div>
        }
      >
        <form onSubmit={handleSuggestReward} className="space-y-4">
          <div>
            <Label>What reward would you like?</Label>
            <Input
              value={suggestForm.name}
              onChange={(e) => setSuggestForm({ ...suggestForm, name: e.target.value })}
              placeholder="e.g., Extra screen time, Ice cream"
              required
            />
          </div>
          <div>
            <Label>Tell your parents more (optional)</Label>
            <Input
              value={suggestForm.description}
              onChange={(e) => setSuggestForm({ ...suggestForm, description: e.target.value })}
              placeholder="Why do you want this reward?"
            />
          </div>
          <div>
            <Label>How many points should it cost?</Label>
            <Input
              type="number"
              min="1"
              value={suggestForm.suggestedCost}
              onChange={(e) =>
                setSuggestForm({ ...suggestForm, suggestedCost: parseInt(e.target.value) || 50 })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Your parents will decide the final cost
            </p>
          </div>
          <Button type="submit" className="w-full bg-purple-500 hover:bg-purple-600" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send Suggestion"}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
