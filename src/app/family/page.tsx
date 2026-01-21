"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Users, Settings, Plus, Copy, Check, UserPlus, ArrowLeft } from "lucide-react"

interface Member {
  id: string
  role: string
  permissions: string
  joinedAt: string
  user: {
    id: string
    name: string
    email: string
    avatarUrl: string | null
  }
}

interface Kid {
  id: string
  name: string
  avatarColor: string
  totalPoints: number
}

interface Family {
  id: string
  name: string
  inviteCode: string
  members: Member[]
  kids: Kid[]
}

export default function FamilyPage() {
  const [families, setFamilies] = useState<Family[]>([])
  const [currentFamily, setCurrentFamily] = useState<Family | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch("/api/families")
      if (res.ok) {
        const data = await res.json()
        setFamilies(data.families)
        if (data.families.length > 0) {
          setCurrentFamily(data.families[0])
        }
      }
    } catch (error) {
      console.error("Failed to fetch families:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyInviteCode = async () => {
    if (!currentFamily) return
    try {
      await navigator.clipboard.writeText(currentFamily.inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "primary":
        return "bg-purple-100 text-purple-700"
      case "parent":
        return "bg-blue-100 text-blue-700"
      case "guardian":
        return "bg-green-100 text-green-700"
      case "grandparent":
        return "bg-amber-100 text-amber-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (families.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
          <Users className="w-10 h-10 text-purple-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          No Family Yet
        </h1>
        <p className="text-gray-500 mb-6">
          Create a family to start managing your kids and inviting other family
          members.
        </p>
        <Link
          href="/family/create"
          className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Family
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/parent"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Family</h1>
          <p className="text-gray-500">Manage your family and members</p>
        </div>
        {families.length > 1 && (
          <select
            value={currentFamily?.id || ""}
            onChange={(e) => {
              const family = families.find((f) => f.id === e.target.value)
              setCurrentFamily(family || null)
            }}
            className="border rounded-lg p-2"
          >
            {families.map((family) => (
              <option key={family.id} value={family.id}>
                {family.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {currentFamily && (
        <>
          {/* Family Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {currentFamily.name}
              </h2>
              <Link
                href={`/family/settings?id=${currentFamily.id}`}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <Settings className="w-5 h-5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-3xl font-bold text-gray-900">
                  {currentFamily.members.length}
                </p>
                <p className="text-sm text-gray-500">Members</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-3xl font-bold text-gray-900">
                  {currentFamily.kids.length}
                </p>
                <p className="text-sm text-gray-500">Kids</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 mb-2">Invite Code</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentFamily.inviteCode}
                  readOnly
                  className="flex-1 bg-gray-50 border rounded-lg p-2 font-mono text-sm"
                />
                <button
                  onClick={copyInviteCode}
                  className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Share this code with family members to let them join
              </p>
            </div>
          </div>

          {/* Members Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Members</h2>
              <Link
                href={`/family/invite?id=${currentFamily.id}`}
                className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700"
              >
                <UserPlus className="w-4 h-4" />
                Invite Member
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {currentFamily.members.map((member) => (
                <div
                  key={member.id}
                  className="p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-purple-600 font-medium">
                        {member.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {member.user.name}
                      </p>
                      <p className="text-sm text-gray-500">{member.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium capitalize ${getRoleBadgeColor(
                        member.role
                      )}`}
                    >
                      {member.role}
                    </span>
                    <span className="text-xs text-gray-400 capitalize">
                      {member.permissions}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Kids Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Kids</h2>
              <Link
                href="/parent/kids"
                className="text-sm text-purple-600 hover:text-purple-700"
              >
                Manage Kids
              </Link>
            </div>
            {currentFamily.kids.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No kids in this family yet
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {currentFamily.kids.map((kid) => (
                  <div
                    key={kid.id}
                    className="p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                        style={{ backgroundColor: kid.avatarColor }}
                      >
                        {kid.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{kid.name}</p>
                        <p className="text-sm text-gray-500">
                          {kid.totalPoints} points
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/kid/${kid.id}`}
                      className="text-sm text-purple-600 hover:text-purple-700"
                    >
                      View Dashboard
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
