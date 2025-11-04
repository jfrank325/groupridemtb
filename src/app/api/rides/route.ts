import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rides = await prisma.ride.findMany({
      where: {
        date: {
          gt: new Date(), // Only get rides in the future
        },
      },
      orderBy: { date: "asc" },
      include: {
        trails: {
          include: {
            trail: {
              include: {
                trailSystem: true, // include trailSystem
              },
            },
          },
        },
        host: true,
        attendees: true,
      },
    });

    const withTrail = rides.map((ride) => ({
      id: ride.id,
      host: ride.host,
      notes: ride.notes,
      attendees: ride.attendees,
      date: ride.date,
      // Get trail info from the first trail for simplicity
      trailId: ride.trails[0]?.trail.id,
      trailName: ride.trails[0]?.trail.name,
      trailSystem: ride.trails[0]?.trail.trailSystem?.name || "Unknown System",
      lat: 33.8 + Math.random() * 0.3,
      lng: -84.6 + Math.random() * 0.3,
      difficulty: ride.trails[0]?.trail.difficulty || "Unknown",
      distanceKm: ride.trails[0]?.trail.distanceKm || 0,
    }));

    return NextResponse.json(withTrail);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch rides" }, { status: 500 });
  }
}
