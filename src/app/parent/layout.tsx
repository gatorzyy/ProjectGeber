"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Home,
  Users,
  Calendar,
  LogOut,
  Menu,
  ChevronDown,
  HomeIcon,
} from "lucide-react"
import { BugReportButton } from "@/components"

interface Family {
  id: string
  name: string
  role: string
  kidsCount: number
}

interface User {
  id: string
  name: string
  email: string
  isAdmin: boolean
}

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [families, setFamilies] = useState<Family[]>([])
  const [currentFamily, setCurrentFamily] = useState<Family | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUserData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/users/me")
      if (!res.ok) {
        router.push("/login")
        return
      }
      const data = await res.json()
      setUser(data.user)
      setFamilies(data.families)
      if (data.families.length > 0) {
        setCurrentFamily(
          data.families.find(
            (f: Family) => f.id === data.currentFamilyId
          ) || data.families[0]
        )
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error)
      router.push("/login")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const navItems = [
    { href: "/parent", label: "Dashboard", icon: Home },
    { href: "/parent/kids", label: "Kids", icon: Users },
    { href: "/parent/calendar", label: "Calendar", icon: Calendar },
    { href: "/family", label: "Family", icon: Users },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform lg:transform-none ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b">
            <Link href="/parent" className="flex items-center gap-2">
              <span className="text-2xl">✨</span>
              <span className="text-xl font-bold text-purple-600">
                Little Alchimist
              </span>
            </Link>
          </div>

          {/* Family Selector */}
          {families.length > 0 && (
            <div className="p-4 border-b">
              <div className="relative">
                <select
                  value={currentFamily?.id || ""}
                  onChange={(e) => {
                    const family = families.find((f) => f.id === e.target.value)
                    setCurrentFamily(family || null)
                  }}
                  className="w-full bg-purple-50 border border-purple-200 rounded-lg p-2 pr-8 text-sm font-medium text-purple-700 appearance-none cursor-pointer"
                >
                  {families.map((family) => (
                    <option key={family.id} value={family.id}>
                      {family.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-purple-100 text-purple-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}

            {user?.isAdmin && (
              <>
                <div className="pt-4 pb-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Admin
                  </span>
                </div>
                <Link
                  href="/admin/users"
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    pathname === "/admin/users"
                      ? "bg-purple-100 text-purple-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span className="font-medium">All Users</span>
                </Link>
                <Link
                  href="/admin/families"
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    pathname === "/admin/families"
                      ? "bg-purple-100 text-purple-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span className="font-medium">All Families</span>
                </Link>
              </>
            )}
          </nav>

          {/* User section */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-purple-600 font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <Link
              href="/"
              className="w-full flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors mb-1"
            >
              <HomeIcon className="w-5 h-5" />
              <span>Home Page</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <span className="text-xl font-bold text-purple-600">
            Little Alchimist
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>

      <BugReportButton page="/parent" userType="parent" />
    </div>
  )
}
