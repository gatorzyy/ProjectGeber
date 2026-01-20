import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const logs = await prisma.pointLog.findMany({
    where: { kidId: id },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(logs)
}
