import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const trails = await prisma.trail.findMany({
      include: {
        trailSystem: true,
        rides: {
          include: {  
            ride: {
              select: { id: true, date: true },
            },
          },
        },
      },
    });

    const withCoords = trails.map((trail) => ({
      id: trail.id,
      name: trail.name,
      trailSystem: trail.trailSystem?.name || "Unknown System",
      lat: 33.8 + Math.random() * 0.3,
      lng: -84.6 + Math.random() * 0.3,
      hasGroupRide: trail.rides.length > 0,
      nextRideDate: trail.rides[0]?.ride.date ?? null,
      difficulty: trail.difficulty,
      distanceKm: trail.distanceKm,
    }));

    return NextResponse.json(withCoords);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch trails" }, { status: 500 });
  }
}
