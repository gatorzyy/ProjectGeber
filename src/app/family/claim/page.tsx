"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Users, Check } from "lucide-react"

interface Kid {
  id: string
  name: string
}

export default function ClaimFamilyPage() {
  const router = useRouter()
  const [kids, setKids] = useState<Kid[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isClaiming, setIsClaiming] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    checkDefaultFamily()
  }, [])

  const checkDefaultFamily = async () => {
    try {
      const res = await fetch("/api/users/me")
      if (!res.ok) {
        router.push("/login")
        return
      }
      // The kids to claim are passed during registration/login
      // For now, we'll proceed with the claim
    } catch (error) {
      console.error("Failed to check:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClaim = async () => {
    setIsClaiming(true)
    setError("")

    try {
      const res = await fetch("/api/families/claim-default", {
        method: "POST",
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to claim family")
        return
      }

      router.push("/parent")
    } catch (err) {
      setError("An error occurred")
    } finally {
      setIsClaiming(false)
    }
  }

  const handleSkip = () => {
    router.push("/family/create")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Existing Kids Found!
          </h1>
          <p className="text-gray-500">
            We found existing kid accounts. Would you like to become their
            primary parent?
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <div className="bg-purple-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-purple-700 mb-2">
            <strong>As the primary parent, you will:</strong>
          </p>
          <ul className="text-sm text-purple-600 space-y-1">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              Have full control over all kid accounts
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              Be able to invite other family members
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              Manage tasks, rewards, and permissions
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleClaim}
            disabled={isClaiming}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {isClaiming ? "Claiming..." : "Claim as Primary Parent"}
          </button>
          <button
            onClick={handleSkip}
            className="w-full border border-gray-300 text-gray-600 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Skip and Create New Family
          </button>
        </div>
      </div>
    </div>
  )
}
