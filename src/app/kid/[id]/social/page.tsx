"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserPlus, UserMinus, Users, Heart, Check, X } from "lucide-react"
import { Kid, SocialData, FriendsData } from "@/lib/types"
import { kidsApi, socialApi } from "@/lib/api"
import { KidAvatar, StarPoints, PageHeader, EmptyState, BugReportButton } from "@/components"

export default function SocialPage() {
  const params = useParams()
  const kidId = params.id as string

  const [allKids, setAllKids] = useState<Kid[]>([])
  const [socialData, setSocialData] = useState<SocialData | null>(null)
  const [friendsData, setFriendsData] = useState<FriendsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"friends" | "following" | "discover">("friends")

  useEffect(() => {
    fetchData()
  }, [kidId])

  const fetchData = async () => {
    try {
      const [kids, follow, friends] = await Promise.all([
        kidsApi.getAll(),
        socialApi.getFollowData(kidId, kidId),
        socialApi.getFriends(kidId),
      ])

      setAllKids(kids.filter((k) => k.id !== kidId))
      setSocialData(follow)
      setFriendsData(friends)
    } catch (error) {
      console.error("Failed to fetch social data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFollow = async (targetId: string) => {
    try {
      await socialApi.follow(targetId, kidId)
      fetchData()
    } catch (error) {
      console.error("Failed to follow:", error)
    }
  }

  const handleUnfollow = async (targetId: string) => {
    try {
      await socialApi.unfollow(targetId, kidId)
      fetchData()
    } catch (error) {
      console.error("Failed to unfollow:", error)
    }
  }

  const handleSendFriendRequest = async (targetId: string) => {
    try {
      await socialApi.sendFriendRequest(targetId, kidId)
      fetchData()
    } catch (error) {
      console.error("Failed to send friend request:", error)
    }
  }

  const handleAcceptFriend = async (requestId: string) => {
    try {
      await socialApi.respondToFriendRequest(requestId, "accepted")
      fetchData()
    } catch (error) {
      console.error("Failed to accept friend:", error)
    }
  }

  const handleRejectFriend = async (requestId: string) => {
    try {
      await socialApi.respondToFriendRequest(requestId, "rejected")
      fetchData()
    } catch (error) {
      console.error("Failed to reject friend:", error)
    }
  }

  const handleCancelRequest = async (requestId: string) => {
    try {
      await socialApi.cancelFriendRequest(requestId)
      fetchData()
    } catch (error) {
      console.error("Failed to cancel request:", error)
    }
  }

  const isFollowing = (targetId: string) =>
    socialData?.following.some((k) => k.id === targetId) || false

  const isFriend = (targetId: string) =>
    friendsData?.friends.some((k) => k.id === targetId) || false

  const hasPendingRequest = (targetId: string) =>
    friendsData?.pendingSent.some((k) => k.id === targetId) || false

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <PageHeader title="Friends & Following" backHref={`/kid/${kidId}`} backLabel="Back to Dashboard" />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-pink-600">{friendsData?.friends.length || 0}</p>
            <p className="text-sm text-muted-foreground">Friends</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{socialData?.followingCount || 0}</p>
            <p className="text-sm text-muted-foreground">Following</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{socialData?.followersCount || 0}</p>
            <p className="text-sm text-muted-foreground">Followers</p>
          </CardContent>
        </Card>
      </div>

      {/* Friend Requests */}
      {friendsData && friendsData.pendingReceived.length > 0 && (
        <Card className="mb-6 border-pink-200 bg-pink-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-pink-700">
              <Heart className="w-5 h-5" />
              Friend Requests ({friendsData.pendingReceived.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {friendsData.pendingReceived.map((kid) => (
              <div key={kid.id} className="flex items-center gap-3 bg-white p-3 rounded-lg border">
                <KidAvatar name={kid.name} color={kid.avatarColor} size="lg" />
                <div className="flex-grow">
                  <p className="font-medium">{kid.name}</p>
                  <p className="text-xs text-muted-foreground">wants to be your friend</p>
                </div>
                <Button
                  size="sm"
                  className="bg-green-500 hover:bg-green-600"
                  onClick={() => handleAcceptFriend(kid.requestId)}
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleRejectFriend(kid.requestId)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button variant={activeTab === "friends" ? "default" : "outline"} onClick={() => setActiveTab("friends")}>
          <Heart className="w-4 h-4 mr-1" />
          Friends
        </Button>
        <Button variant={activeTab === "following" ? "default" : "outline"} onClick={() => setActiveTab("following")}>
          <Users className="w-4 h-4 mr-1" />
          Following
        </Button>
        <Button variant={activeTab === "discover" ? "default" : "outline"} onClick={() => setActiveTab("discover")}>
          <UserPlus className="w-4 h-4 mr-1" />
          Discover
        </Button>
      </div>

      {/* Friends Tab */}
      {activeTab === "friends" && (
        <div className="space-y-3">
          {friendsData?.friends.length === 0 ? (
            <EmptyState icon={Heart} description="No friends yet. Send some friend requests!" />
          ) : (
            friendsData?.friends.map((friend) => (
              <Card key={friend.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <KidAvatar name={friend.name} color={friend.avatarColor} size="xl" />
                  <div className="flex-grow">
                    <p className="font-medium">{friend.name}</p>
                    <StarPoints points={friend.totalPoints} size="sm" />
                  </div>
                  <Badge className="bg-pink-500">
                    <Heart className="w-3 h-3 mr-1" />
                    Friend
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Following Tab */}
      {activeTab === "following" && (
        <div className="space-y-3">
          {socialData?.following.length === 0 ? (
            <EmptyState icon={Users} description="You're not following anyone yet." />
          ) : (
            socialData?.following.map((kid) => (
              <Card key={kid.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <KidAvatar name={kid.name} color={kid.avatarColor} size="xl" />
                  <div className="flex-grow">
                    <p className="font-medium">{kid.name}</p>
                    <StarPoints points={kid.totalPoints} size="sm" />
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleUnfollow(kid.id)}>
                    <UserMinus className="w-4 h-4 mr-1" />
                    Unfollow
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Discover Tab */}
      {activeTab === "discover" && (
        <div className="space-y-3">
          {allKids.length === 0 ? (
            <EmptyState icon={Users} description="No other kids to discover." />
          ) : (
            allKids.map((kid) => (
              <Card key={kid.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <KidAvatar name={kid.name} color={kid.avatarColor} size="xl" />
                  <div className="flex-grow">
                    <p className="font-medium">{kid.name}</p>
                    <div className="flex items-center gap-2">
                      <StarPoints points={kid.totalPoints} size="sm" />
                      {isFriend(kid.id) && <Badge className="bg-pink-500 text-xs">Friend</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isFollowing(kid.id) ? (
                      <Button size="sm" variant="outline" onClick={() => handleUnfollow(kid.id)}>
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleFollow(kid.id)}>
                        <UserPlus className="w-4 h-4" />
                      </Button>
                    )}

                    {isFriend(kid.id) ? (
                      <Badge className="bg-pink-500">
                        <Heart className="w-3 h-3" />
                      </Badge>
                    ) : hasPendingRequest(kid.id) ? (
                      <Button size="sm" variant="secondary" disabled>
                        Pending
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-pink-500 hover:bg-pink-600"
                        onClick={() => handleSendFriendRequest(kid.id)}
                      >
                        <Heart className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Pending Sent Requests */}
      {friendsData && friendsData.pendingSent.length > 0 && (
        <Card className="mt-6 border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Pending Sent Requests ({friendsData.pendingSent.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {friendsData.pendingSent.map((kid) => (
              <div key={kid.id} className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg">
                <KidAvatar name={kid.name} color={kid.avatarColor} size="md" />
                <span className="flex-grow text-sm">{kid.name}</span>
                <Button size="sm" variant="ghost" onClick={() => handleCancelRequest(kid.requestId)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <BugReportButton page={`/kid/${kidId}/social`} userType="kid" userId={kidId} />
    </div>
  )
}
