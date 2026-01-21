"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Share2, Link2, Copy, Check, X } from "lucide-react"
import { AVATAR_COLORS } from "@/lib/types"

interface Kid {
  id: string
  name: string
  avatarColor: string
  totalPoints: number
  totalGems: number
  accessTokenEnabled: boolean
  familyId: string
}

interface Family {
  id: string
  name: string
  kids: Kid[]
}

export default function ParentKidsPage() {
  const [families, setFamilies] = useState<Family[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddKidModal, setShowAddKidModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [selectedKid, setSelectedKid] = useState<Kid | null>(null)
  const [shareLink, setShareLink] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch("/api/users/me")
      if (res.ok) {
        const data = await res.json()
        setFamilies(data.families)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateShareLink = async (kid: Kid) => {
    try {
      const res = await fetch(`/api/kids/${kid.id}/access-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      if (res.ok) {
        const data = await res.json()
        setShareLink(data.shareableLink)
        setSelectedKid(kid)
        setShowShareModal(true)
      }
    } catch (error) {
      console.error("Failed to generate share link:", error)
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

  const toggleAccessLink = async (kid: Kid, enabled: boolean) => {
    try {
      await fetch(`/api/kids/${kid.id}/access-link`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      })
      fetchData()
    } catch (error) {
      console.error("Failed to toggle access link:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  const allKids = families.flatMap((f) =>
    f.kids.map((k) => ({ ...k, familyId: f.id, familyName: f.name }))
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kids</h1>
          <p className="text-gray-500">Manage your children&apos;s accounts</p>
        </div>
        <button
          onClick={() => setShowAddKidModal(true)}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Kid
        </button>
      </div>

      {allKids.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
            <Plus className="w-10 h-10 text-purple-400" />
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            No kids yet
          </h2>
          <p className="text-gray-500 mb-4">
            Add your first child to start tracking their tasks and rewards
          </p>
          <button
            onClick={() => setShowAddKidModal(true)}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Add Kid
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allKids.map((kid) => (
            <div
              key={kid.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl"
                    style={{ backgroundColor: kid.avatarColor }}
                  >
                    {kid.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {kid.name}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>⭐ {kid.totalPoints} points</span>
                      {kid.totalGems > 0 && <span>💎 {kid.totalGems} gems</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <Link
                    href={`/kid/${kid.id}`}
                    className="flex-1 text-center py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href={`/kid/${kid.id}/tasks`}
                    className="flex-1 text-center py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                  >
                    Tasks
                  </Link>
                </div>

                <button
                  onClick={() => generateShareLink(kid)}
                  className="w-full flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-600"
                >
                  <Share2 className="w-4 h-4" />
                  Share Access Link
                </button>

                {kid.accessTokenEnabled && (
                  <div className="flex items-center justify-between text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">
                    <span className="flex items-center gap-1">
                      <Link2 className="w-3 h-3" />
                      Access link active
                    </span>
                    <button
                      onClick={() => toggleAccessLink(kid, false)}
                      className="text-red-500 hover:text-red-600"
                    >
                      Disable
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Kid Modal */}
      {showAddKidModal && (
        <AddKidModal
          families={families}
          onClose={() => setShowAddKidModal(false)}
          onSuccess={() => {
            setShowAddKidModal(false)
            fetchData()
          }}
        />
      )}

      {/* Share Link Modal */}
      {showShareModal && selectedKid && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Share Access Link
              </h2>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Anyone with this link can access {selectedKid.name}&apos;s dashboard
              and complete tasks without logging in.
            </p>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 border rounded-lg p-2 text-sm bg-gray-50"
              />
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {copied ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="bg-amber-50 text-amber-700 rounded-lg p-3 text-sm">
              <strong>Note:</strong> Be careful who you share this link with.
              Anyone with the link can mark tasks as complete.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AddKidModal({
  families,
  onClose,
  onSuccess,
}: {
  families: Family[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    name: "",
    avatarColor: AVATAR_COLORS[0],
    familyId: families[0]?.id || "",
    pin: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const res = await fetch("/api/kids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to add kid")
        return
      }

      onSuccess()
    } catch {
      setError("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Add Kid</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full border rounded-lg p-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Avatar Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, avatarColor: color })}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    formData.avatarColor === color
                      ? "ring-2 ring-offset-2 ring-purple-500 scale-110"
                      : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {families.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Family
              </label>
              <select
                value={formData.familyId}
                onChange={(e) =>
                  setFormData({ ...formData, familyId: e.target.value })
                }
                className="w-full border rounded-lg p-2"
                required
              >
                {families.map((family) => (
                  <option key={family.id} value={family.id}>
                    {family.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PIN (optional)
            </label>
            <input
              type="password"
              value={formData.pin}
              onChange={(e) =>
                setFormData({ ...formData, pin: e.target.value })
              }
              className="w-full border rounded-lg p-2"
              placeholder="4-digit PIN"
              maxLength={4}
              pattern="[0-9]{4}"
            />
            <p className="text-xs text-gray-400 mt-1">
              Optional 4-digit PIN for kid to access their dashboard
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? "Adding..." : "Add Kid"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
