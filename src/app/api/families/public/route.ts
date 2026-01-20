import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// Public endpoint to get all families with their kids (for home page display)
export async function GET() {
  try {
    // Get all families with kids
    const families = await prisma.family.findMany({
      include: {
        kids: {
          select: {
            id: true,
            name: true,
            avatarColor: true,
            avatarUrl: true,
            motto: true,
            totalPoints: true,
            pin: true,
          },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    })

    // Also get kids without a family
    const kidsWithoutFamily = await prisma.kid.findMany({
      where: { familyId: null },
      select: {
        id: true,
        name: true,
        avatarColor: true,
        avatarUrl: true,
        motto: true,
        totalPoints: true,
        pin: true,
      },
      orderBy: { name: "asc" },
    })

    // Transform to hide actual PIN but expose whether it exists
    const transformedFamilies = families.map((family) => ({
      id: family.id,
      name: family.name,
      kids: family.kids.map((kid) => ({
        ...kid,
        hasPin: !!kid.pin,
        pin: undefined,
      })),
    }))

    const orphanKids = kidsWithoutFamily.map((kid) => ({
      ...kid,
      hasPin: !!kid.pin,
      pin: undefined,
    }))

    return NextResponse.json({
      families: transformedFamilies,
      kidsWithoutFamily: orphanKids,
    })
  } catch (error) {
    console.error("Get public families error:", error)
    return NextResponse.json(
      { error: "Failed to get families" },
      { status: 500 }
    )
  }
}
