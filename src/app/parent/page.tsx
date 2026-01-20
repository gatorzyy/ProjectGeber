"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Users, Calendar, Star, ListTodo, Plus, Share2 } from "lucide-react"

interface Kid {
  id: string
  name: string
  avatarColor: string
  totalPoints: number
}

interface Family {
  id: string
  name: string
  kids: Kid[]
  membersCount: number
}

export default function ParentDashboard() {
  const [families, setFamilies] = useState<Family[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  const allKids = families.flatMap((f) => f.kids)

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome to Little Alchimist</p>
        </div>
        <Link
          href="/parent/kids"
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Kid
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{allKids.length}</p>
              <p className="text-sm text-gray-500">Kids</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <Star className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {allKids.reduce((sum, k) => sum + k.totalPoints, 0)}
              </p>
              <p className="text-sm text-gray-500">Total Points</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {families.length}
              </p>
              <p className="text-sm text-gray-500">Families</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <Link
                href="/parent/calendar"
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                View Calendar
              </Link>
              <p className="text-sm text-gray-500">Family events</p>
            </div>
          </div>
        </div>
      </div>

      {/* Kids Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Your Kids</h2>
        </div>
        {allKids.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">No kids added yet</p>
            <Link
              href="/parent/kids"
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Add your first kid
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {allKids.map((kid) => (
              <div
                key={kid.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
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
                <div className="flex items-center gap-2">
                  <Link
                    href={`/kid/${kid.id}`}
                    className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  >
                    View Dashboard
                  </Link>
                  <Link
                    href={`/kid/${kid.id}/tasks`}
                    className="px-4 py-2 text-sm bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg transition-colors"
                  >
                    <ListTodo className="w-4 h-4 inline mr-1" />
                    Tasks
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Families Overview */}
      {families.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Your Families
            </h2>
            <Link
              href="/family"
              className="text-sm text-purple-600 hover:text-purple-700"
            >
              Manage
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {families.map((family) => (
              <div
                key={family.id}
                className="p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">{family.name}</p>
                  <p className="text-sm text-gray-500">
                    {family.kids.length} kids • {family.membersCount} members
                  </p>
                </div>
                <Link
                  href={`/family?id=${family.id}`}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
