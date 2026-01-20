// Shared types for the Little Alchimist app

// ============================================
// USER & AUTH TYPES
// ============================================

export interface User {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  isAdmin: boolean
  emailVerified: boolean
  createdAt?: string
  updatedAt?: string
}

export interface AuthSession {
  userId: string
  email: string
  name: string
  isAdmin: boolean
  currentFamilyId?: string
}

// ============================================
// FAMILY TYPES
// ============================================

export interface Family {
  id: string
  name: string
  inviteCode: string
  isDefault: boolean
  createdAt?: string
  updatedAt?: string
}

export interface FamilyMember {
  id: string
  userId: string
  familyId: string
  role: "primary" | "parent" | "guardian" | "grandparent"
  permissions: "view" | "comment" | "manage" | "full"
  joinedAt: string
  invitedBy: string | null
  user?: User
  family?: Family
}

export interface FamilyWithDetails extends Family {
  members?: FamilyMember[]
  kids?: Kid[]
  _count?: {
    members: number
    kids: number
  }
}

// ============================================
// CALENDAR EVENT TYPES
// ============================================

export interface CalendarEvent {
  id: string
  familyId: string
  googleEventId: string | null
  googleCalendarId: string | null
  title: string
  description: string | null
  startTime: string
  endTime: string
  isAllDay: boolean
  location: string | null
  convertedToTaskId: string | null
  recurrenceRule: string | null
  createdAt?: string
  updatedAt?: string
}

// ============================================
// KID TYPES
// ============================================

export interface Kid {
  id: string
  name: string
  avatarColor: string
  avatarUrl?: string | null
  motto?: string | null
  pin?: string | null
  totalPoints: number
  totalGems?: number
  familyId?: string | null
  accessToken?: string | null
  accessTokenExpiry?: string | null
  accessTokenEnabled?: boolean
  createdAt?: string
  updatedAt?: string
  family?: Family
}

export interface Task {
  id: string
  kidId: string
  title: string
  description: string | null
  pointValue: number
  dueDate: string | null
  isRecurring: boolean
  recurringType: string | null
  isCompleted: boolean
  completedAt: string | null
  isKidRequest: boolean
  requestStatus: string // "pending" | "approved" | "rejected"
  proofImageUrl: string | null
  completionNote: string | null
  parentComment: string | null
  feedbackRequested: boolean
  createdAt?: string
  updatedAt?: string
  kid?: Kid
}

export interface Reward {
  id: string
  name: string
  description: string | null
  pointCost: number
  imageUrl: string | null
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Redemption {
  id: string
  kidId: string
  rewardId: string
  pointsSpent: number
  status: string // "pending" | "approved" | "rejected"
  createdAt?: string
  updatedAt?: string
  kid?: Kid
  reward?: Reward
}

export interface PointLog {
  id: string
  kidId: string
  oldPoints: number
  newPoints: number
  reason: string
  createdAt: string
}

export interface Follow {
  id: string
  followerId: string
  followingId: string
  createdAt: string
}

export interface FriendRequest {
  id: string
  requesterId: string
  recipientId: string
  status: string // "pending" | "accepted" | "rejected"
  createdAt: string
  updatedAt: string
}

export interface SocialData {
  following: Kid[]
  followers: Kid[]
  followingCount: number
  followersCount: number
  isFollowing?: boolean
}

export interface FriendsData {
  friends: (Kid & { requestId?: string })[]
  pendingReceived: (Kid & { requestId: string })[]
  pendingSent: (Kid & { requestId: string })[]
}

// Reward request types
export interface RewardRequest {
  id: string
  kidId: string
  name: string
  description: string | null
  suggestedCost: number
  status: string // "pending" | "approved" | "rejected"
  parentNote: string | null
  createdAt?: string
  updatedAt?: string
  kid?: Kid
}

// Streak types
export interface Streak {
  id: string
  kidId: string
  currentStreak: number
  longestStreak: number
  lastActiveDate: string | null
  weekBonus: boolean
  monthBonus: boolean
  quarterBonus: boolean
  createdAt?: string
  updatedAt?: string
}

// Form state types
export interface TaskFormData {
  title: string
  description: string
  pointValue: number
  isRecurring: boolean
  recurringType: string
  isCompleted?: boolean
}

export interface NewTaskFormData extends TaskFormData {
  kidId?: string
}

// Color options for kid avatars
export const AVATAR_COLORS: string[] = [
  "#F472B6", "#FB923C", "#FBBF24", "#A3E635",
  "#34D399", "#22D3D8", "#60A5FA", "#A78BFA",
  "#F87171", "#94A3B8"
]
