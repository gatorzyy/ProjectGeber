"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Lock, Check, User, Palette, MessageSquare } from "lucide-react"
import { AVATAR_COLORS } from "@/lib/types"
import { BugReportButton } from "@/components"

export default function KidSettingsPage() {
  const params = useParams()
  const kidId = params.id as string
  const [newPin, setNewPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [hasPin, setHasPin] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)

  // Profile fields
  const [name, setName] = useState("")
  const [avatarColor, setAvatarColor] = useState("#8B5CF6")
  const [motto, setMotto] = useState("")
  const [profileSuccess, setProfileSuccess] = useState("")
  const [profileError, setProfileError] = useState("")
  const [isProfileLoading, setIsProfileLoading] = useState(false)

  useEffect(() => {
    if (kidId) {
      fetchKidProfile()
      checkSession()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kidId])

  const fetchKidProfile = async () => {
    try {
      const res = await fetch(`/api/kids/${kidId}`)
      if (res.ok) {
        const kid = await res.json()
        setName(kid.name || "")
        setAvatarColor(kid.avatarColor || "#8B5CF6")
        setMotto(kid.motto || "")
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error)
    } finally {
      setIsPageLoading(false)
    }
  }

  const checkSession = async () => {
    try {
      const res = await fetch("/api/kids/auth")
      const data = await res.json()
      setHasPin(data.hasPin || false)
    } catch (error) {
      console.error("Failed to check session:", error)
    }
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError("")
    setProfileSuccess("")

    if (!name.trim()) {
      setProfileError("Name is required")
      return
    }

    setIsProfileLoading(true)
    try {
      const res = await fetch(`/api/kids/${kidId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          avatarColor,
          motto: motto.trim() || null,
        }),
      })

      if (res.ok) {
        setProfileSuccess("Profile updated successfully!")
        setTimeout(() => setProfileSuccess(""), 3000)
      } else {
        const data = await res.json()
        setProfileError(data.error || "Failed to update profile")
      }
    } catch (error) {
      console.error("Profile update error:", error)
      setProfileError("Failed to update profile")
    }
    setIsProfileLoading(false)
  }

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (newPin.length !== 4) {
      setError("PIN must be 4 digits")
      return
    }

    if (newPin !== confirmPin) {
      setError("New PINs don't match")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/kids/auth", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: newPin }),
      })

      if (res.ok) {
        setSuccess("PIN updated successfully!")
        setCurrentPin("")
        setNewPin("")
        setConfirmPin("")
        setHasPin(true)
      } else {
        const data = await res.json()
        setError(data.error || "Failed to update PIN")
      }
    } catch (error) {
      console.error("PIN update error:", error)
      setError("Failed to update PIN")
    }
    setIsLoading(false)
  }

  if (isPageLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <p className="text-center text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Link href={`/kid/${kidId}`}>
        <Button variant="ghost" size="sm" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </Link>

      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Profile Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5" />
            My Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSave} className="space-y-4">
            {/* Avatar Preview */}
            <div className="flex justify-center mb-4">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold"
                style={{ backgroundColor: avatarColor }}
              >
                {name ? name.charAt(0).toUpperCase() : "?"}
              </div>
            </div>

            {/* Name */}
            <div>
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                maxLength={30}
              />
            </div>

            {/* Avatar Color */}
            <div>
              <Label className="flex items-center gap-1 mb-2">
                <Palette className="w-4 h-4" />
                Avatar Color
              </Label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAvatarColor(color)}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      avatarColor === color
                        ? "ring-2 ring-offset-2 ring-purple-500 scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Motto */}
            <div>
              <Label className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                Motto / Intro
              </Label>
              <Input
                value={motto}
                onChange={(e) => setMotto(e.target.value)}
                placeholder="Your personal motto or introduction..."
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {motto.length}/100 characters
              </p>
            </div>

            {profileError && <p className="text-sm text-red-500">{profileError}</p>}
            {profileSuccess && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <Check className="w-4 h-4" />
                {profileSuccess}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isProfileLoading}>
              {isProfileLoading ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* PIN Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="w-5 h-5" />
            {hasPin ? "Change PIN" : "Set PIN"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePin} className="space-y-4">
            <div>
              <Label>New PIN</Label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 4 digits"
                className="text-center tracking-widest"
              />
            </div>
            <div>
              <Label>Confirm New PIN</Label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                placeholder="Confirm 4 digits"
                className="text-center tracking-widest"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <Check className="w-4 h-4" />
                {success}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Saving..." : hasPin ? "Update PIN" : "Set PIN"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <BugReportButton page={`/kid/${kidId}/settings`} userType="kid" userId={kidId} />
    </div>
  )
}
