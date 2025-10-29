import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const trailId = searchParams.get("trailId");

  if (!trailId) {
    return NextResponse.json({ error: "Missing trailId" }, { status: 400 });
  }

  try {
    const rides = await prisma.ride.findMany({
      where: {
        trails: {
          some: { trailId },
        },
      },
      include: {
        host: {
          select: { id: true, name: true },
        },
        attendees: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        trails: {
          include: {
            trail: { select: { id: true, name: true, difficulty: true } },
          },
        },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(rides);
  } catch (error) {
    console.error("[GET_RIDES_BY_TRAIL]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
