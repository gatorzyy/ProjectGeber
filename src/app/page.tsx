"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Settings, Sparkles, Trophy, Lock, Star, Gem, User, Users } from "lucide-react"
import { Modal, KidAvatar, BugReportButton } from "@/components"

interface KidDisplay {
  id: string
  name: string
  avatarColor: string
  avatarUrl?: string | null
  motto?: string | null
  totalPoints: number
  hasPin: boolean
}

interface FamilyDisplay {
  id: string
  name: string
  kids: KidDisplay[]
}

export default function HomePage() {
  const [families, setFamilies] = useState<FamilyDisplay[]>([])
  const [kidsWithoutFamily, setKidsWithoutFamily] = useState<KidDisplay[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedKid, setSelectedKid] = useState<KidDisplay | null>(null)
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    fetchFamiliesAndKids()
  }, [])

  const fetchFamiliesAndKids = async () => {
    try {
      const res = await fetch("/api/families/public")
      if (res.ok) {
        const data = await res.json()
        setFamilies(data.families || [])
        setKidsWithoutFamily(data.kidsWithoutFamily || [])
      }
    } catch (error) {
      console.error("Failed to fetch families:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKidSelect = (kid: KidDisplay) => {
    if (!kid.hasPin) {
      // No PIN set, go directly to dashboard
      loginKid(kid.id, "")
    } else {
      setSelectedKid(kid)
      setPin("")
      setError("")
    }
  }

  const loginKid = async (kidId: string, enteredPin: string) => {
    try {
      const res = await fetch("/api/kids/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kidId, pin: enteredPin }),
      })
      if (res.ok) {
        router.push(`/kid/${kidId}`)
      } else {
        setError("Wrong PIN! Try again.")
        setPin("")
      }
    } catch {
      setError("Wrong PIN! Try again.")
      setPin("")
    }
  }

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedKid && pin.length === 4) {
      loginKid(selectedKid.id, pin)
    }
  }

  const gemRatio = 10

  const renderKidCard = (kid: KidDisplay) => {
    const gems = Math.floor(kid.totalPoints / gemRatio)
    const stars = kid.totalPoints % gemRatio

    return (
      <Card
        key={kid.id}
        onClick={() => handleKidSelect(kid)}
        className="hover:shadow-lg transition-all cursor-pointer hover:scale-105 transform duration-200 relative"
      >
        {kid.hasPin && (
          <div className="absolute top-2 right-2">
            <Lock className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
        <CardHeader className="text-center pb-2">
          <KidAvatar
            name={kid.name}
            color={kid.avatarColor}
            size="xl"
            className="mx-auto mb-3"
          />
          <CardTitle className="text-xl">{kid.name}</CardTitle>
          {kid.motto && (
            <p className="text-sm text-muted-foreground italic mt-1">
              &ldquo;{kid.motto}&rdquo;
            </p>
          )}
        </CardHeader>
        <CardContent className="text-center">
          <div className="flex items-center justify-center gap-3">
            {gems > 0 && (
              <div className="flex items-center gap-1">
                <Gem className="w-5 h-5 fill-purple-500 text-purple-600" />
                <span className="font-bold text-purple-600">{gems}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
              <span className="font-bold text-amber-600">{stars}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {kid.totalPoints} total points
          </p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl text-center">
        <p>Loading...</p>
      </div>
    )
  }

  const totalKids = families.reduce((sum, f) => sum + f.kids.length, 0) + kidsWithoutFamily.length
  const hasNoKids = totalKids === 0

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-10 h-10 text-purple-500" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-amber-500 bg-clip-text text-transparent">
            Little Alchimist
          </h1>
          <Sparkles className="w-10 h-10 text-amber-500" />
        </div>
        <p className="text-muted-foreground text-lg">
          Complete tasks, earn stars & gems, unlock rewards!
        </p>
      </header>

      {/* How it works section */}
      <Card className="mb-8 bg-gradient-to-r from-purple-50 to-amber-50">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Complete a task</span>
              <span className="font-bold">=</span>
              <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
              <span className="font-bold text-amber-600">Stars</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              <span className="font-bold">10 stars</span>
              <span className="font-bold">=</span>
              <Gem className="w-5 h-5 fill-purple-500 text-purple-600" />
              <span className="font-bold text-purple-600">1 Gem</span>
            </div>
            <div className="flex items-center gap-2">
              <Gem className="w-4 h-4 fill-purple-500 text-purple-600" />
              <span className="font-bold">Gems</span>
              <span className="font-bold">=</span>
              <span className="font-bold text-green-600">Rewards!</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Who&apos;s playing today?</h2>
        <div className="flex gap-2">
          <Link href="/leaderboard">
            <Button variant="outline" size="sm">
              <Trophy className="w-4 h-4 mr-2" />
              Leaderboard
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="sm">
              <User className="w-4 h-4 mr-2" />
              Parent Login
            </Button>
          </Link>
          <Link href="/admin">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Admin
            </Button>
          </Link>
        </div>
      </div>

      {/* PIN Entry Modal */}
      <Modal
        isOpen={!!selectedKid}
        onClose={() => setSelectedKid(null)}
        title={
          selectedKid && (
            <div className="flex items-center justify-center gap-2">
              <Lock className="w-5 h-5" />
              Enter PIN for {selectedKid.name}
            </div>
          )
        }
        maxWidth="sm"
      >
        {selectedKid && (
          <div className="text-center">
            <KidAvatar
              name={selectedKid.name}
              color={selectedKid.avatarColor}
              size="xl"
              className="mx-auto mb-4"
            />
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 4-digit PIN"
                className="text-center text-2xl tracking-widest"
                autoFocus
              />
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedKid(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={pin.length !== 4}>
                  Enter
                </Button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {hasNoKids ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground mb-4">
              No kids added yet! Go to Admin to add your first child.
            </p>
            <Link href="/admin/kids">
              <Button>Add a Kid</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Render families */}
          {families.map((family) => (
            family.kids.length > 0 && (
              <div key={family.id}>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-purple-500" />
                  <h3 className="text-lg font-semibold text-gray-700">{family.name}</h3>
                  <span className="text-sm text-muted-foreground">
                    ({family.kids.length} {family.kids.length === 1 ? "kid" : "kids"})
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {family.kids.map(renderKidCard)}
                </div>
              </div>
            )
          ))}

          {/* Render kids without family */}
          {kidsWithoutFamily.length > 0 && (
            <div>
              {families.some((f) => f.kids.length > 0) && (
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-500">Other Kids</h3>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {kidsWithoutFamily.map(renderKidCard)}
              </div>
            </div>
          )}
        </div>
      )}

      <BugReportButton page="/" userType="guest" />
    </div>
  )
}
