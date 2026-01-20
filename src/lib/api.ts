// API utilities for centralized fetch handling

const BASE_URL = ""

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE"

interface FetchOptions {
  method?: HttpMethod
  body?: unknown
  headers?: Record<string, string>
}

async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {} } = options

  const config: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  }

  if (body && method !== "GET") {
    config.body = JSON.stringify(body)
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }))
    throw new Error(error.error || "Request failed")
  }

  return response.json()
}

// Kids API
export const kidsApi = {
  getAll: () => fetchApi<import("./types").Kid[]>("/api/kids"),

  getById: (id: string) => fetchApi<import("./types").Kid>(`/api/kids/${id}`),

  create: (data: { name: string; avatarColor: string }) =>
    fetchApi<import("./types").Kid>("/api/kids", { method: "POST", body: data }),

  update: (id: string, data: Partial<import("./types").Kid> & { pointEditReason?: string }) =>
    fetchApi<import("./types").Kid>(`/api/kids/${id}`, { method: "PATCH", body: data }),

  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/kids/${id}`, { method: "DELETE" }),

  getPointLogs: (id: string) =>
    fetchApi<import("./types").PointLog[]>(`/api/kids/${id}/point-logs`),

  auth: (id: string, pin: string) =>
    fetchApi<{ success: boolean }>("/api/kids/auth", { method: "POST", body: { kidId: id, pin } }),

  setPin: (id: string, pin: string) =>
    fetchApi<{ success: boolean }>("/api/kids/auth", { method: "PUT", body: { kidId: id, pin } }),
}

// Tasks API
export const tasksApi = {
  getAll: () => fetchApi<import("./types").Task[]>("/api/tasks"),

  getById: (id: string) => fetchApi<import("./types").Task>(`/api/tasks/${id}`),

  create: (data: {
    kidId: string
    title: string
    description: string | null
    pointValue: number
    isRecurring: boolean
    recurringType: string | null
  }) => fetchApi<import("./types").Task>("/api/tasks", { method: "POST", body: data }),

  update: (id: string, data: Partial<import("./types").Task>) =>
    fetchApi<import("./types").Task>(`/api/tasks/${id}`, { method: "PATCH", body: data }),

  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/tasks/${id}`, { method: "DELETE" }),

  copy: (id: string, kidIds: string[]) =>
    fetchApi<{ copies: import("./types").Task[]; count: number }>(`/api/tasks/${id}/copy`, {
      method: "POST",
      body: { kidIds },
    }),
}

// Rewards API
export const rewardsApi = {
  getAll: () => fetchApi<import("./types").Reward[]>("/api/rewards"),

  getById: (id: string) => fetchApi<import("./types").Reward>(`/api/rewards/${id}`),

  create: (data: Omit<import("./types").Reward, "id" | "createdAt" | "updatedAt">) =>
    fetchApi<import("./types").Reward>("/api/rewards", { method: "POST", body: data }),

  update: (id: string, data: Partial<import("./types").Reward>) =>
    fetchApi<import("./types").Reward>(`/api/rewards/${id}`, { method: "PATCH", body: data }),

  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/rewards/${id}`, { method: "DELETE" }),
}

// Redemptions API
export const redemptionsApi = {
  getAll: () => fetchApi<import("./types").Redemption[]>("/api/redemptions"),

  create: (data: { kidId: string; rewardId: string; pointsSpent: number }) =>
    fetchApi<import("./types").Redemption>("/api/redemptions", { method: "POST", body: data }),

  update: (id: string, data: { status: string }) =>
    fetchApi<import("./types").Redemption>(`/api/redemptions/${id}`, { method: "PATCH", body: data }),
}

// Social API
export const socialApi = {
  getFollowData: (kidId: string, viewerId?: string) =>
    fetchApi<import("./types").SocialData>(
      `/api/kids/${kidId}/follow${viewerId ? `?viewerId=${viewerId}` : ""}`
    ),

  follow: (targetId: string, followerId: string) =>
    fetchApi<import("./types").Follow>(`/api/kids/${targetId}/follow`, {
      method: "POST",
      body: { followerId },
    }),

  unfollow: (targetId: string, followerId: string) =>
    fetchApi<{ success: boolean }>(`/api/kids/${targetId}/follow?followerId=${followerId}`, {
      method: "DELETE",
    }),

  getFriends: (kidId: string) =>
    fetchApi<import("./types").FriendsData>(`/api/kids/${kidId}/friends`),

  sendFriendRequest: (targetId: string, requesterId: string) =>
    fetchApi<import("./types").FriendRequest>(`/api/kids/${targetId}/friends`, {
      method: "POST",
      body: { requesterId },
    }),

  respondToFriendRequest: (requestId: string, status: "accepted" | "rejected") =>
    fetchApi<import("./types").FriendRequest>(`/api/friend-requests/${requestId}`, {
      method: "PATCH",
      body: { status },
    }),

  cancelFriendRequest: (requestId: string) =>
    fetchApi<{ success: boolean }>(`/api/friend-requests/${requestId}`, { method: "DELETE" }),
}

// Admin API
export const adminApi = {
  checkAuth: () => fetchApi<{ authenticated: boolean }>("/api/admin/auth"),

  login: (password: string) =>
    fetchApi<{ success: boolean }>("/api/admin/auth", { method: "POST", body: { password } }),

  logout: () => fetchApi<{ success: boolean }>("/api/admin/auth", { method: "DELETE" }),
}

// Upload API
export const uploadApi = {
  upload: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Upload failed")
    }

    return response.json()
  },
}

// Reward Requests API
export const rewardRequestsApi = {
  getAll: () => fetchApi<import("./types").RewardRequest[]>("/api/reward-requests"),

  create: (data: { kidId: string; name: string; description?: string; suggestedCost?: number }) =>
    fetchApi<import("./types").RewardRequest>("/api/reward-requests", {
      method: "POST",
      body: data,
    }),

  respond: (id: string, data: { status: string; parentNote?: string; pointCost?: number }) =>
    fetchApi<import("./types").RewardRequest>(`/api/reward-requests/${id}`, {
      method: "PATCH",
      body: data,
    }),

  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/reward-requests/${id}`, { method: "DELETE" }),
}

// Streak API
export const streakApi = {
  get: (kidId: string) => fetchApi<import("./types").Streak>(`/api/kids/${kidId}/streak`),

  update: (kidId: string) =>
    fetchApi<import("./types").Streak>(`/api/kids/${kidId}/streak`, { method: "POST" }),

  claimBonus: (kidId: string, bonusType: "week" | "month" | "quarter") =>
    fetchApi<{ success: boolean; bonusPoints: number; message: string }>(
      `/api/kids/${kidId}/streak`,
      { method: "PATCH", body: { bonusType } }
    ),
}
