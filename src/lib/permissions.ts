// Permission checking utilities
import { prisma } from "./db"

// Permission levels (in order of access)
export const PERMISSIONS = {
  VIEW: "view",
  COMMENT: "comment",
  MANAGE: "manage",
  FULL: "full",
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

const PERMISSION_LEVELS: Record<Permission, number> = {
  view: 1,
  comment: 2,
  manage: 3,
  full: 4,
}

// Role defaults
export const ROLE_DEFAULTS: Record<string, Permission> = {
  primary: "full",
  parent: "manage",
  guardian: "manage",
  grandparent: "comment",
}

// Check if user has at least the required permission level
export function hasPermission(
  userPermission: Permission,
  requiredPermission: Permission
): boolean {
  return PERMISSION_LEVELS[userPermission] >= PERMISSION_LEVELS[requiredPermission]
}

// Check if user has permission for a family
export async function checkFamilyPermission(
  userId: string,
  familyId: string,
  requiredPermission: Permission
): Promise<boolean> {
  // First check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  })

  if (user?.isAdmin) {
    return true // Admins have full access to everything
  }

  // Check family membership
  const membership = await prisma.familyMember.findUnique({
    where: { userId_familyId: { userId, familyId } },
  })

  if (!membership) {
    return false
  }

  return hasPermission(membership.permissions as Permission, requiredPermission)
}

// Check if user has permission to access a kid
export async function checkKidAccess(
  userId: string,
  kidId: string,
  requiredPermission: Permission
): Promise<boolean> {
  // First check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  })

  if (user?.isAdmin) {
    return true // Admins have full access
  }

  // Get kid's family
  const kid = await prisma.kid.findUnique({
    where: { id: kidId },
    select: { familyId: true },
  })

  if (!kid?.familyId) {
    return false
  }

  return checkFamilyPermission(userId, kid.familyId, requiredPermission)
}

// Check if user is an admin
export async function isAdminUser(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  })
  return user?.isAdmin ?? false
}

// Get user's role in a family
export async function getFamilyRole(
  userId: string,
  familyId: string
): Promise<{ role: string; permissions: Permission } | null> {
  const membership = await prisma.familyMember.findUnique({
    where: { userId_familyId: { userId, familyId } },
    select: { role: true, permissions: true },
  })

  if (!membership) {
    return null
  }

  return {
    role: membership.role,
    permissions: membership.permissions as Permission,
  }
}

// Get all families a user belongs to
export async function getUserFamilies(userId: string) {
  return await prisma.familyMember.findMany({
    where: { userId },
    include: {
      family: {
        include: {
          kids: {
            select: {
              id: true,
              name: true,
              avatarColor: true,
            },
          },
          _count: {
            select: {
              members: true,
              kids: true,
            },
          },
        },
      },
    },
  })
}

// Check if user is the primary parent of a family
export async function isPrimaryParent(
  userId: string,
  familyId: string
): Promise<boolean> {
  const membership = await prisma.familyMember.findUnique({
    where: { userId_familyId: { userId, familyId } },
  })
  return membership?.role === "primary"
}

// Update member permissions (only primary parent or admin can do this)
export async function updateMemberPermissions(
  actingUserId: string,
  targetMemberId: string,
  newPermissions: Permission
): Promise<boolean> {
  // Get the target membership
  const targetMember = await prisma.familyMember.findUnique({
    where: { id: targetMemberId },
    select: { familyId: true, userId: true, role: true },
  })

  if (!targetMember) {
    return false
  }

  // Check if acting user is admin or primary parent
  const isAdmin = await isAdminUser(actingUserId)
  const isPrimary = await isPrimaryParent(actingUserId, targetMember.familyId)

  if (!isAdmin && !isPrimary) {
    return false
  }

  // Cannot change primary parent's permissions (they always have full)
  if (targetMember.role === "primary") {
    return false
  }

  await prisma.familyMember.update({
    where: { id: targetMemberId },
    data: { permissions: newPermissions },
  })

  return true
}

// Require authentication helper (throws if not authenticated)
export function requireAuth<T>(
  session: T | null,
  message = "Authentication required"
): asserts session is T {
  if (!session) {
    throw new Error(message)
  }
}

// Require permission helper (throws if no permission)
export async function requireFamilyPermission(
  userId: string,
  familyId: string,
  permission: Permission
): Promise<void> {
  const hasAccess = await checkFamilyPermission(userId, familyId, permission)
  if (!hasAccess) {
    throw new Error("Insufficient permissions")
  }
}

// Require kid access helper (throws if no access)
export async function requireKidAccess(
  userId: string,
  kidId: string,
  permission: Permission
): Promise<void> {
  const hasAccess = await checkKidAccess(userId, kidId, permission)
  if (!hasAccess) {
    throw new Error("Insufficient permissions")
  }
}
