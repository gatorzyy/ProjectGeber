import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// GET - Get all reward requests
export async function GET() {
  try {
    const requests = await prisma.rewardRequest.findMany({
      include: { kid: true },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(requests)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch reward requests" }, { status: 500 })
  }
}

// POST - Create a new reward request (from kid)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { kidId, name, description, suggestedCost } = body

    if (!kidId || !name) {
      return NextResponse.json({ error: "Kid ID and name are required" }, { status: 400 })
    }

    const rewardRequest = await prisma.rewardRequest.create({
      data: {
        kidId,
        name,
        description: description || null,
        suggestedCost: suggestedCost || 50,
      },
      include: { kid: true },
    })

    return NextResponse.json(rewardRequest)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create reward request" }, { status: 500 })
  }
}
