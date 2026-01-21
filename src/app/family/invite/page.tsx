"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Copy, Check, Mail, MessageCircle, Share2 } from "lucide-react"

interface Family {
  id: string
  name: string
  inviteCode: string
}

export default function InviteMemberPage() {
  const searchParams = useSearchParams()
  const familyId = searchParams.get("id")
  const [family, setFamily] = useState<Family | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (familyId) {
      fetchFamily()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyId])

  const fetchFamily = async () => {
    try {
      const res = await fetch(`/api/families/${familyId}`)
      if (res.ok) {
        const data = await res.json()
        setFamily(data.family)
      }
    } catch (error) {
      console.error("Failed to fetch family:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyInviteCode = async () => {
    if (!family) return
    try {
      await navigator.clipboard.writeText(family.inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const shareViaEmail = () => {
    if (!family) return
    const subject = encodeURIComponent(`Join ${family.name} on Little Alchimist`)
    const body = encodeURIComponent(
      `Hi!\n\nI'd like you to join our family "${family.name}" on Little Alchimist.\n\nUse this invite code to join: ${family.inviteCode}\n\nOr visit: ${window.location.origin}/family/claim and enter the code.`
    )
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!family) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <p className="text-gray-500">Family not found</p>
        <Link href="/family" className="text-purple-600 hover:text-purple-700 mt-4 inline-block">
          Back to Family
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Link
        href="/family"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Family
      </Link>

      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Invite Member</h1>
        <p className="text-gray-500 mt-1">
          Share the invite code with family members to let them join{" "}
          <span className="font-medium">{family.name}</span>
        </p>
      </div>

      {/* Invite Code Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <p className="text-sm text-gray-500 mb-2 text-center">Invite Code</p>
        <div className="bg-purple-50 rounded-lg p-4 mb-4">
          <p className="text-2xl font-mono font-bold text-purple-700 text-center tracking-wider">
            {family.inviteCode}
          </p>
        </div>
        <button
          onClick={copyInviteCode}
          className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-5 h-5" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-5 h-5" />
              Copy Code
            </>
          )}
        </button>
      </div>

      {/* Share Options */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-medium text-gray-900 mb-4">Share via</h3>
        <div className="space-y-3">
          <button
            onClick={shareViaEmail}
            className="w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Mail className="w-5 h-5 text-gray-500" />
            <span className="text-gray-700">Email</span>
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `Join ${family.name}`,
                  text: `Use invite code: ${family.inviteCode}`,
                  url: `${window.location.origin}/family/claim`,
                })
              }
            }}
            className="w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Share2 className="w-5 h-5 text-gray-500" />
            <span className="text-gray-700">Share</span>
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="font-medium text-gray-900 mb-3">How it works</h3>
        <ol className="space-y-2 text-sm text-gray-600">
          <li className="flex gap-2">
            <span className="font-medium text-purple-600">1.</span>
            Share the invite code with the family member
          </li>
          <li className="flex gap-2">
            <span className="font-medium text-purple-600">2.</span>
            They create an account or log in at Little Alchimist
          </li>
          <li className="flex gap-2">
            <span className="font-medium text-purple-600">3.</span>
            They go to Family → Join Family and enter the code
          </li>
        </ol>
      </div>
    </div>
  )
}
