"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, Search, ArrowLeft, Plus, Edit2, Trash2, UserPlus, X, Link2, Copy, Check, Home } from "lucide-react"
import { Modal, KidAvatar, ColorPicker } from "@/components"
import { AVATAR_COLORS } from "@/lib/types"

interface Kid {
  id: string
  name: string
  avatarColor: string
  totalPoints: number
  accessToken?: string | null
  accessTokenEnabled?: boolean
}

interface Family {
  id: string
  name: string
  inviteCode?: string
  isDefault?: boolean
  createdAt?: string
  kids?: Kid[]
  _count?: {
    members: number
    kids: number
  }
}

export default function AdminFamiliesPage() {
  const router = useRouter()
  const [families, setFamilies] = useState<Family[]>([])
  const [allKids, setAllKids] = useState<Kid[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAssignKidModal, setShowAssignKidModal] = useState(false)
  const [showShareLinkModal, setShowShareLinkModal] = useState(false)
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null)
  const [selectedKid, setSelectedKid] = useState<Kid | null>(null)
  const [familyName, setFamilyName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [shareLink, setShareLink] = useState("")
  const [copied, setCopied] = useState(false)

  // Create kid form state
  const [showCreateKidModal, setShowCreateKidModal] = useState(false)
  const [newKidName, setNewKidName] = useState("")
  const [newKidColor, setNewKidColor] = useState(AVATAR_COLORS[0])
  const [createKidForFamily, setCreateKidForFamily] = useState<Family | null>(null)

  useEffect(() => {
    checkAuthAndFetch()
  }, [])

  const checkAuthAndFetch = async () => {
    // Check admin auth
    const authRes = await fetch("/api/admin/auth")
    const authData = await authRes.json()
    if (!authData.authenticated) {
      router.push("/admin")
      return
    }
    fetchFamilies()
    fetchAllKids()
  }

  const fetchFamilies = async () => {
    try {
      const res = await fetch("/api/families/admin")
      if (res.ok) {
        const data = await res.json()
        setFamilies(data.families || [])
      }
    } catch (error) {
      console.error("Failed to fetch families:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAllKids = async () => {
    try {
      const res = await fetch("/api/kids")
      if (res.ok) {
        const kids = await res.json()
        setAllKids(kids)
      }
    } catch (error) {
      console.error("Failed to fetch kids:", error)
    }
  }

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!familyName.trim()) return
    setIsSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/families/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: familyName.trim() }),
      })

      if (res.ok) {
        setShowCreateModal(false)
        setFamilyName("")
        fetchFamilies()
      } else {
        const data = await res.json()
        setError(data.error || "Failed to create family")
      }
    } catch {
      setError("Failed to create family")
    }
    setIsSubmitting(false)
  }

  const handleUpdateFamily = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!familyName.trim() || !selectedFamily) return
    setIsSubmitting(true)
    setError("")

    try {
      const res = await fetch(`/api/families/admin/${selectedFamily.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: familyName.trim() }),
      })

      if (res.ok) {
        setShowEditModal(false)
        setFamilyName("")
        setSelectedFamily(null)
        fetchFamilies()
      } else {
        const data = await res.json()
        setError(data.error || "Failed to update family")
      }
    } catch {
      setError("Failed to update family")
    }
    setIsSubmitting(false)
  }

  const handleDeleteFamily = async (family: Family) => {
    if (!confirm(`Are you sure you want to delete "${family.name}"? Kids in this family will become unassigned.`)) {
      return
    }

    try {
      const res = await fetch(`/api/families/admin/${family.id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        fetchFamilies()
        fetchAllKids()
      }
    } catch {
      console.error("Failed to delete family")
    }
  }

  const handleAssignKid = async (kidId: string) => {
    if (!selectedFamily) return

    try {
      const res = await fetch(`/api/kids/${kidId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyId: selectedFamily.id }),
      })

      if (res.ok) {
        fetchFamilies()
        fetchAllKids()
      }
    } catch {
      console.error("Failed to assign kid")
    }
  }

  const handleRemoveKidFromFamily = async (kidId: string) => {
    try {
      const res = await fetch(`/api/kids/${kidId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyId: null }),
      })

      if (res.ok) {
        fetchFamilies()
        fetchAllKids()
      }
    } catch {
      console.error("Failed to remove kid from family")
    }
  }

  const generateAccessLink = async (kid: Kid) => {
    try {
      // Generate a simple token if not using parent auth
      const token = crypto.randomUUID().replace(/-/g, "").slice(0, 32)

      const res = await fetch(`/api/kids/${kid.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: token,
          accessTokenEnabled: true,
        }),
      })

      if (res.ok) {
        const baseUrl = window.location.origin
        setShareLink(`${baseUrl}/kid/access/${token}`)
        setSelectedKid(kid)
        setShowShareLinkModal(true)
        fetchFamilies()
      }
    } catch (error) {
      console.error("Failed to generate access link:", error)
    }
  }

  const disableAccessLink = async (kidId: string) => {
    try {
      const res = await fetch(`/api/kids/${kidId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessTokenEnabled: false,
        }),
      })

      if (res.ok) {
        fetchFamilies()
      }
    } catch (error) {
      console.error("Failed to disable access link:", error)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const handleCreateKid = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKidName.trim()) return
    setIsSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/kids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKidName.trim(),
          avatarColor: newKidColor,
          familyId: createKidForFamily?.id || null,
        }),
      })

      if (res.ok) {
        setShowCreateKidModal(false)
        setNewKidName("")
        setNewKidColor(AVATAR_COLORS[0])
        setCreateKidForFamily(null)
        fetchFamilies()
        fetchAllKids()
      } else {
        const data = await res.json()
        setError(data.error || "Failed to create kid")
      }
    } catch {
      setError("Failed to create kid")
    }
    setIsSubmitting(false)
  }

  const openCreateKidModal = (family?: Family) => {
    setCreateKidForFamily(family || null)
    setNewKidName("")
    setNewKidColor(AVATAR_COLORS[0])
    setError("")
    setShowCreateKidModal(true)
  }

  const openEditModal = (family: Family) => {
    setSelectedFamily(family)
    setFamilyName(family.name)
    setShowEditModal(true)
  }

  const openAssignKidModal = (family: Family) => {
    setSelectedFamily(family)
    setShowAssignKidModal(true)
  }

  const filteredFamilies = families.filter((family) =>
    family.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const unassignedKids = allKids.filter((kid) => {
    // @ts-expect-error - familyId might not be on the type but exists in data
    return !kid.familyId
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
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
          <h1 className="text-2xl font-bold text-gray-900">Manage Families</h1>
          <p className="text-gray-500">
            Create and manage family groups
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Family
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search families..."
          className="pl-10"
        />
      </div>

      {/* Families Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {filteredFamilies.map((family) => (
          <Card key={family.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{family.name}</CardTitle>
                  {family.isDefault && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                      Default
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditModal(family)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteFamily(family)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {family.kids?.length || family._count?.kids || 0} kids
                </span>
              </div>

              {/* Kids in family */}
              {family.kids && family.kids.length > 0 && (
                <div className="space-y-2 mb-3">
                  {family.kids.map((kid) => (
                    <div
                      key={kid.id}
                      className="flex items-center justify-between bg-gray-50 rounded-lg px-2 py-1"
                    >
                      <div className="flex items-center gap-2">
                        <KidAvatar name={kid.name} color={kid.avatarColor} size="sm" />
                        <span className="text-sm">{kid.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {kid.accessTokenEnabled ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => disableAccessLink(kid.id)}
                            className="h-7 w-7 text-green-600"
                            title="Access link active - click to disable"
                          >
                            <Link2 className="w-3 h-3" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => generateAccessLink(kid)}
                            className="h-7 w-7 text-gray-400 hover:text-purple-600"
                            title="Generate access link"
                          >
                            <Link2 className="w-3 h-3" />
                          </Button>
                        )}
                        <button
                          onClick={() => handleRemoveKidFromFamily(kid.id)}
                          className="text-gray-400 hover:text-red-500 p-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openAssignKidModal(family)}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Existing
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  onClick={() => openCreateKidModal(family)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Kid
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFamilies.length === 0 && (
        <Card className="p-12 text-center text-gray-500">
          No families found. Create your first family to get started.
        </Card>
      )}

      {/* Unassigned Kids Section */}
      {unassignedKids.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            Unassigned Kids ({unassignedKids.length})
          </h2>
          <div className="flex flex-wrap gap-3">
            {unassignedKids.map((kid) => (
              <div
                key={kid.id}
                className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2"
              >
                <KidAvatar name={kid.name} color={kid.avatarColor} size="sm" />
                <span className="font-medium">{kid.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => generateAccessLink(kid)}
                  className="h-7 w-7 text-gray-400 hover:text-purple-600"
                  title="Generate access link"
                >
                  <Link2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Family Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setFamilyName("")
          setError("")
        }}
        title="Create New Family"
        maxWidth="sm"
      >
        <form onSubmit={handleCreateFamily} className="space-y-4">
          <div>
            <Label>Family Name</Label>
            <Input
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="e.g., The Smiths"
              required
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowCreateModal(false)
                setFamilyName("")
                setError("")
              }}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Family Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setFamilyName("")
          setSelectedFamily(null)
          setError("")
        }}
        title="Edit Family"
        maxWidth="sm"
      >
        <form onSubmit={handleUpdateFamily} className="space-y-4">
          <div>
            <Label>Family Name</Label>
            <Input
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="e.g., The Smiths"
              required
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowEditModal(false)
                setFamilyName("")
                setSelectedFamily(null)
                setError("")
              }}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assign Kid Modal */}
      <Modal
        isOpen={showAssignKidModal}
        onClose={() => {
          setShowAssignKidModal(false)
          setSelectedFamily(null)
        }}
        title={`Add Kid to ${selectedFamily?.name}`}
        maxWidth="sm"
      >
        <div className="space-y-3">
          {unassignedKids.length === 0 ? (
            <p className="text-center text-gray-500 py-4">
              All kids are already assigned to families.
            </p>
          ) : (
            unassignedKids.map((kid) => (
              <div
                key={kid.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                <div className="flex items-center gap-2">
                  <KidAvatar name={kid.name} color={kid.avatarColor} size="sm" />
                  <span className="font-medium">{kid.name}</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    handleAssignKid(kid.id)
                    setShowAssignKidModal(false)
                    setSelectedFamily(null)
                  }}
                >
                  Add
                </Button>
              </div>
            ))
          )}

          <div className="border-t pt-3 mt-3">
            <Button
              variant="default"
              className="w-full mb-2"
              onClick={() => {
                setShowAssignKidModal(false)
                openCreateKidModal(selectedFamily || undefined)
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Kid
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setShowAssignKidModal(false)
                setSelectedFamily(null)
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Share Link Modal */}
      <Modal
        isOpen={showShareLinkModal}
        onClose={() => {
          setShowShareLinkModal(false)
          setSelectedKid(null)
          setShareLink("")
        }}
        title={`Access Link for ${selectedKid?.name}`}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Anyone with this link can access {selectedKid?.name}&apos;s dashboard
            and complete tasks without logging in.
          </p>

          <div className="flex gap-2">
            <Input
              value={shareLink}
              readOnly
              className="flex-1 bg-gray-50 text-sm"
            />
            <Button onClick={copyToClipboard}>
              {copied ? (
                <Check className="w-5 h-5" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </Button>
          </div>

          <div className="bg-amber-50 text-amber-700 rounded-lg p-3 text-sm">
            <strong>Note:</strong> Be careful who you share this link with.
            Anyone with the link can mark tasks as complete.
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setShowShareLinkModal(false)
              setSelectedKid(null)
              setShareLink("")
            }}
          >
            Close
          </Button>
        </div>
      </Modal>

      {/* Create Kid Modal */}
      <Modal
        isOpen={showCreateKidModal}
        onClose={() => {
          setShowCreateKidModal(false)
          setNewKidName("")
          setNewKidColor(AVATAR_COLORS[0])
          setCreateKidForFamily(null)
          setError("")
        }}
        title={createKidForFamily ? `Create Kid for ${createKidForFamily.name}` : "Create New Kid"}
        maxWidth="sm"
      >
        <form onSubmit={handleCreateKid} className="space-y-4">
          <div>
            <Label>Kid&apos;s Name</Label>
            <Input
              value={newKidName}
              onChange={(e) => setNewKidName(e.target.value)}
              placeholder="Enter kid's name"
              required
            />
          </div>

          <div>
            <Label>Avatar Color</Label>
            <div className="mt-2">
              <ColorPicker value={newKidColor} onChange={setNewKidColor} />
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <KidAvatar name={newKidName || "?"} color={newKidColor} size="lg" />
            <div>
              <p className="font-medium">{newKidName || "Kid Name"}</p>
              {createKidForFamily && (
                <p className="text-sm text-gray-500">Will be added to {createKidForFamily.name}</p>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowCreateKidModal(false)
                setNewKidName("")
                setNewKidColor(AVATAR_COLORS[0])
                setCreateKidForFamily(null)
                setError("")
              }}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting || !newKidName.trim()}>
              {isSubmitting ? "Creating..." : "Create Kid"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
