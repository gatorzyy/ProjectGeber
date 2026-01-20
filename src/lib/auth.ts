// Auth utilities for JWT-based authentication
import { SignJWT, jwtVerify } from "jose"
import { nanoid } from "nanoid"
import { cookies } from "next/headers"
import { prisma } from "./db"
import bcrypt from "bcryptjs"

// Environment variables (should be in .env)
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"
)
const ACCESS_TOKEN_EXPIRY = "15m" // 15 minutes
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000 // 7 days in ms

// Types
export interface JWTPayload {
  userId: string
  email: string
  name: string
  isAdmin: boolean
  [key: string]: unknown
}

export interface AuthSession {
  userId: string
  email: string
  name: string
  isAdmin: boolean
  currentFamilyId?: string
}

// Generate access token (short-lived JWT)
export async function generateAccessToken(payload: JWTPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .setJti(nanoid())
    .sign(JWT_SECRET)
}

// Verify access token
export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

// Generate refresh token (random string, stored in DB)
export function generateRefreshToken(): string {
  return nanoid(64)
}

// Hash refresh token for storage
export async function hashToken(token: string): Promise<string> {
  return await bcrypt.hash(token, 10)
}

// Compare token with hash
export async function compareToken(token: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(token, hash)
}

// Create a new session with refresh token
export async function createSession(
  userId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<{ refreshToken: string; accessToken: string }> {
  const refreshToken = generateRefreshToken()
  const tokenHash = await hashToken(refreshToken)

  // Get user for access token payload
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, isAdmin: true },
  })

  if (!user) {
    throw new Error("User not found")
  }

  // Create session in database
  await prisma.session.create({
    data: {
      userId,
      token: tokenHash,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY),
      userAgent,
      ipAddress,
    },
  })

  // Generate access token
  const accessToken = await generateAccessToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin,
  })

  return { refreshToken, accessToken }
}

// Refresh access token using refresh token
export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string } | null> {
  // Find all non-expired sessions
  const sessions = await prisma.session.findMany({
    where: {
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  })

  // Check each session for matching token
  for (const session of sessions) {
    const matches = await compareToken(refreshToken, session.token)
    if (matches) {
      // Generate new access token
      const accessToken = await generateAccessToken({
        userId: session.user.id,
        email: session.user.email,
        name: session.user.name,
        isAdmin: session.user.isAdmin,
      })
      return { accessToken }
    }
  }

  return null
}

// Invalidate session (logout)
export async function invalidateSession(refreshToken: string): Promise<boolean> {
  const sessions = await prisma.session.findMany({
    where: { expiresAt: { gt: new Date() } },
  })

  for (const session of sessions) {
    const matches = await compareToken(refreshToken, session.token)
    if (matches) {
      await prisma.session.delete({ where: { id: session.id } })
      return true
    }
  }

  return false
}

// Invalidate all sessions for a user
export async function invalidateAllSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } })
}

// Get session from cookies (for server components)
export async function getSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("access_token")?.value

  if (!accessToken) {
    return null
  }

  const payload = await verifyAccessToken(accessToken)
  if (!payload) {
    return null
  }

  // Get current family from cookie if set
  const currentFamilyId = cookieStore.get("current_family")?.value

  return {
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
    isAdmin: payload.isAdmin,
    currentFamilyId,
  }
}

// Get session from request (for API routes)
export async function getSessionFromRequest(
  request: Request
): Promise<AuthSession | null> {
  // Try Authorization header first
  const authHeader = request.headers.get("Authorization")
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7)
    const payload = await verifyAccessToken(token)
    if (payload) {
      return {
        userId: payload.userId,
        email: payload.email,
        name: payload.name,
        isAdmin: payload.isAdmin,
      }
    }
  }

  // Try cookie
  const cookieHeader = request.headers.get("Cookie")
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split("; ").map((c) => {
        const [key, ...value] = c.split("=")
        return [key, value.join("=")]
      })
    )
    const accessToken = cookies["access_token"]
    if (accessToken) {
      const payload = await verifyAccessToken(accessToken)
      if (payload) {
        return {
          userId: payload.userId,
          email: payload.email,
          name: payload.name,
          isAdmin: payload.isAdmin,
          currentFamilyId: cookies["current_family"],
        }
      }
    }
  }

  return null
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12)
}

// Verify password
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

// Set auth cookies
export function getAuthCookieOptions(isRefreshToken = false) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: isRefreshToken ? REFRESH_TOKEN_EXPIRY / 1000 : 15 * 60, // seconds
    path: "/",
  }
}
