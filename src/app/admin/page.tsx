"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, ListTodo, Gift, CheckCircle, ArrowLeft, LogOut, ClipboardList, Lightbulb, Home, Bug } from "lucide-react"
import { BugReportButton } from "@/components"

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [bugReportCount, setBugReportCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchBugReportCount()
    }
  }, [isAuthenticated])

  const checkAuth = async () => {
    const res = await fetch("/api/admin/auth")
    const data = await res.json()
    setIsAuthenticated(data.authenticated)
  }

  const fetchBugReportCount = async () => {
    try {
      const res = await fetch("/api/bug-reports")
      if (res.ok) {
        const data = await res.json()
        const openCount = data.reports?.filter((r: { status: string }) => r.status === "open").length || 0
        setBugReportCount(openCount)
      }
    } catch (error) {
      console.error("Failed to fetch bug reports:", error)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      setIsAuthenticated(true)
      setPassword("")
    } else {
      setError("Invalid password")
    }
    setIsLoading(false)
  }

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" })
    setIsAuthenticated(false)
  }

  if (isAuthenticated === null) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <p>Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>
              Enter the admin password to access the management panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Default password: admin123
              </p>
            </form>
          </CardContent>
        </Card>
        <BugReportButton page="/admin (login)" userType="guest" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <header className="flex items-center justify-between mb-8">
        <div>
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </header>

      {/* Account Management Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Account Management
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/admin/kids">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="w-5 h-5 text-purple-500" />
                  Manage Kids
                </CardTitle>
                <CardDescription>
                  Add, edit, or remove children from the system
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/families">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-l-4 border-l-teal-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Home className="w-5 h-5 text-teal-500" />
                  Manage Families
                </CardTitle>
                <CardDescription>
                  View and manage family groups and members
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </section>

      {/* Task Management Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <ListTodo className="w-5 h-5" />
          Task Management
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/admin/tasks">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ListTodo className="w-5 h-5 text-blue-500" />
                  Manage Tasks
                </CardTitle>
                <CardDescription>
                  Create and manage tasks for each child
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/task-requests">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-l-4 border-l-orange-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardList className="w-5 h-5 text-orange-500" />
                  Task Requests
                </CardTitle>
                <CardDescription>
                  Review kids&apos; task requests and add comments
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </section>

      {/* Reward Management Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5" />
          Reward Management
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/admin/rewards">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-l-4 border-l-amber-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Gift className="w-5 h-5 text-amber-500" />
                  Manage Rewards
                </CardTitle>
                <CardDescription>
                  Create and manage redeemable rewards
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/redemptions">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Redemptions
                </CardTitle>
                <CardDescription>
                  Approve or reject reward redemption requests
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/reward-requests">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lightbulb className="w-5 h-5 text-purple-500" />
                  Reward Ideas
                </CardTitle>
                <CardDescription>
                  Review kids&apos; reward suggestions
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </section>

      {/* System Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Bug className="w-5 h-5" />
          System
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/admin/bug-reports">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-l-4 border-l-red-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bug className="w-5 h-5 text-red-500" />
                  Bug Reports
                  {bugReportCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {bugReportCount}
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  View and manage user-reported bugs
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </section>

      <BugReportButton page="/admin" userType="admin" />
    </div>
  )
}
