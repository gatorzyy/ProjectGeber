"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Edit2, Save, X, Star, Gift } from "lucide-react"
import { Reward } from "@/lib/types"
import { rewardsApi } from "@/lib/api"
import { PageHeader, StarPoints } from "@/components"

export default function ManageRewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState({ name: "", description: "", pointCost: 0 })
  const [newReward, setNewReward] = useState({
    name: "",
    description: "",
    pointCost: 50,
  })

  useEffect(() => {
    fetchRewards()
  }, [])

  const fetchRewards = async () => {
    try {
      const data = await rewardsApi.getAll()
      setRewards(data)
    } catch (error) {
      console.error("Failed to fetch rewards:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddReward = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newReward.name.trim()) return

    try {
      await rewardsApi.create({
        name: newReward.name,
        description: newReward.description || null,
        pointCost: newReward.pointCost,
        imageUrl: null,
        isActive: true,
      })
      setNewReward({ name: "", description: "", pointCost: 50 })
      fetchRewards()
    } catch (error) {
      console.error("Failed to add reward:", error)
    }
  }

  const handleStartEdit = (reward: Reward) => {
    setEditingId(reward.id)
    setEditData({
      name: reward.name,
      description: reward.description || "",
      pointCost: reward.pointCost,
    })
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editData.name.trim()) return

    try {
      await rewardsApi.update(editingId, editData)
      setEditingId(null)
      fetchRewards()
    } catch (error) {
      console.error("Failed to update reward:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this reward?")) return
    try {
      await rewardsApi.delete(id)
      fetchRewards()
    } catch (error) {
      console.error("Failed to delete reward:", error)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <PageHeader title="Manage Rewards" backHref="/admin" backLabel="Back to Admin" />

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Add New Reward</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddReward} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Reward Name</Label>
                <Input
                  id="name"
                  value={newReward.name}
                  onChange={(e) => setNewReward({ ...newReward, name: e.target.value })}
                  placeholder="e.g., Ice Cream"
                />
              </div>
              <div>
                <Label htmlFor="cost">Point Cost</Label>
                <Input
                  id="cost"
                  type="number"
                  min="1"
                  value={newReward.pointCost}
                  onChange={(e) => setNewReward({ ...newReward, pointCost: parseInt(e.target.value) || 50 })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={newReward.description}
                onChange={(e) => setNewReward({ ...newReward, description: e.target.value })}
                placeholder="Describe the reward..."
              />
            </div>
            <Button type="submit">
              <Plus className="w-4 h-4 mr-2" />
              Add Reward
            </Button>
          </form>
        </CardContent>
      </Card>

      <h2 className="text-xl font-semibold mb-4">Available Rewards ({rewards.length})</h2>

      <div className="space-y-3">
        {isLoading ? (
          <p>Loading...</p>
        ) : rewards.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No rewards yet.</p>
        ) : (
          rewards.map((reward) => (
            <Card key={reward.id}>
              <CardContent className="flex items-center gap-4 p-4">
                {editingId === reward.id ? (
                  <>
                    <Gift className="w-8 h-8 text-purple-500 flex-shrink-0" />
                    <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-2">
                      <Input
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        placeholder="Name"
                      />
                      <Input
                        value={editData.description}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        placeholder="Description"
                      />
                      <Input
                        type="number"
                        value={editData.pointCost}
                        onChange={(e) => setEditData({ ...editData, pointCost: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <Button size="sm" onClick={handleSaveEdit}>
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Gift className="w-8 h-8 text-purple-500 flex-shrink-0" />
                    <div className="flex-grow">
                      <h3 className="font-medium">{reward.name}</h3>
                      {reward.description && (
                        <p className="text-sm text-muted-foreground">{reward.description}</p>
                      )}
                    </div>
                    <StarPoints points={reward.pointCost} />
                    <Button size="sm" variant="ghost" onClick={() => handleStartEdit(reward)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(reward.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
