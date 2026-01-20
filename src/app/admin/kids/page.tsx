"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Edit2, Save, X, Star, History } from "lucide-react"
import { Kid, PointLog, AVATAR_COLORS } from "@/lib/types"
import { kidsApi } from "@/lib/api"
import { Modal, KidAvatar, ColorPicker, PageHeader } from "@/components"

export default function ManageKidsPage() {
  const [kids, setKids] = useState<Kid[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newKidName, setNewKidName] = useState("")
  const [newKidColor, setNewKidColor] = useState(AVATAR_COLORS[0])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState("")

  // Point editing modal state
  const [pointEditKid, setPointEditKid] = useState<Kid | null>(null)
  const [newPoints, setNewPoints] = useState(0)
  const [pointReason, setPointReason] = useState("")
  const [pointLogs, setPointLogs] = useState<PointLog[]>([])
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)

  useEffect(() => {
    fetchKids()
  }, [])

  const fetchKids = async () => {
    try {
      const data = await kidsApi.getAll()
      setKids(data)
    } catch (error) {
      console.error("Failed to fetch kids:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddKid = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKidName.trim()) return

    try {
      await kidsApi.create({ name: newKidName, avatarColor: newKidColor })
      setNewKidName("")
      setNewKidColor(AVATAR_COLORS[0])
      fetchKids()
    } catch (error) {
      console.error("Failed to add kid:", error)
    }
  }

  const handleStartEdit = (kid: Kid) => {
    setEditingId(kid.id)
    setEditName(kid.name)
    setEditColor(kid.avatarColor)
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return

    try {
      await kidsApi.update(editingId, { name: editName, avatarColor: editColor })
      setEditingId(null)
      fetchKids()
    } catch (error) {
      console.error("Failed to update kid:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will delete all tasks and redemptions for this child.")) {
      return
    }

    try {
      await kidsApi.delete(id)
      fetchKids()
    } catch (error) {
      console.error("Failed to delete kid:", error)
    }
  }

  const openPointsModal = async (kid: Kid) => {
    setPointEditKid(kid)
    setNewPoints(kid.totalPoints)
    setPointReason("")
    setIsLoadingLogs(true)

    try {
      const logs = await kidsApi.getPointLogs(kid.id)
      setPointLogs(logs)
    } catch (error) {
      console.error("Failed to fetch point logs:", error)
    } finally {
      setIsLoadingLogs(false)
    }
  }

  const handleSavePoints = async () => {
    if (!pointEditKid || !pointReason.trim()) {
      alert("Please enter a reason for the point change")
      return
    }

    try {
      await kidsApi.update(pointEditKid.id, {
        totalPoints: newPoints,
        pointEditReason: pointReason,
      })
      setPointEditKid(null)
      fetchKids()
    } catch (error) {
      console.error("Failed to update points:", error)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <PageHeader title="Manage Kids" backHref="/admin" backLabel="Back to Admin" />

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Add New Kid</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddKid} className="flex flex-wrap gap-4 items-end">
            <div className="flex-grow min-w-[200px]">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newKidName}
                onChange={(e) => setNewKidName(e.target.value)}
                placeholder="Enter kid's name"
              />
            </div>
            <div>
              <Label>Color</Label>
              <div className="mt-1">
                <ColorPicker value={newKidColor} onChange={setNewKidColor} />
              </div>
            </div>
            <Button type="submit">
              <Plus className="w-4 h-4 mr-2" />
              Add Kid
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {isLoading ? (
          <p>Loading...</p>
        ) : kids.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No kids added yet.</p>
        ) : (
          kids.map((kid) => (
            <Card key={kid.id}>
              <CardContent className="flex items-center gap-4 p-4">
                {editingId === kid.id ? (
                  <>
                    <KidAvatar name={kid.name} color={editColor} size="xl" />
                    <div className="flex-grow flex flex-wrap gap-3 items-center">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="max-w-[200px]"
                      />
                      <ColorPicker value={editColor} onChange={setEditColor} size="sm" />
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
                    <KidAvatar name={kid.name} color={kid.avatarColor} size="xl" />
                    <div className="flex-grow">
                      <h3 className="font-medium">{kid.name}</h3>
                      <button
                        onClick={() => openPointsModal(kid)}
                        className="text-sm text-amber-600 hover:underline flex items-center gap-1"
                      >
                        <Star className="w-3 h-3 fill-amber-400" />
                        {kid.totalPoints} points
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => handleStartEdit(kid)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(kid.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Points Edit Modal */}
      <Modal
        isOpen={!!pointEditKid}
        onClose={() => setPointEditKid(null)}
        title={
          <>
            <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
            Edit Points - {pointEditKid?.name}
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label>Current Points: {pointEditKid?.totalPoints}</Label>
            <Input
              type="number"
              value={newPoints}
              onChange={(e) => setNewPoints(parseInt(e.target.value) || 0)}
              min={0}
            />
          </div>

          <div>
            <Label>Reason for change *</Label>
            <Input
              value={pointReason}
              onChange={(e) => setPointReason(e.target.value)}
              placeholder="e.g., Starting points, Bonus for good behavior"
            />
          </div>

          <Button
            className="w-full"
            onClick={handleSavePoints}
            disabled={newPoints === pointEditKid?.totalPoints || !pointReason.trim()}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Points
          </Button>

          {/* Point History */}
          <div className="border-t pt-4">
            <Label className="flex items-center gap-1 mb-2">
              <History className="w-4 h-4" />
              Point Edit History
            </Label>
            {isLoadingLogs ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : pointLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No point edits yet.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {pointLogs.map((log) => (
                  <div key={log.id} className="text-sm bg-gray-50 p-2 rounded border">
                    <div className="flex items-center justify-between">
                      <span
                        className={
                          log.newPoints > log.oldPoints
                            ? "text-green-600 font-medium"
                            : "text-red-600 font-medium"
                        }
                      >
                        {log.oldPoints} → {log.newPoints}
                        {log.newPoints > log.oldPoints
                          ? ` (+${log.newPoints - log.oldPoints})`
                          : ` (${log.newPoints - log.oldPoints})`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{log.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
