import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ride = await prisma.ride?.findUnique({
      where: { id },
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

    const withTrail = {
      id: ride?.id,
      host: ride?.host,
      notes: ride?.notes,
      attendees: ride?.attendees,
      date: ride?.date,
      // Get trail info from the first trail for simplicity
      trailId: ride?.trails[0]?.trail.id,
      trailName: ride?.trails[0]?.trail.name,
      trailSystem: ride?.trails[0]?.trail.trailSystem?.name || "Unknown System",
      lat: ride?.trails[0]?.trail.lat,
      lng: ride?.trails[0]?.trail.lng,
      difficulty: ride?.trails[0]?.trail.difficulty || "Unknown",
      distanceKm: ride?.trails[0]?.trail.distanceKm || 0,
    };

    return NextResponse.json(withTrail);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch rides" }, { status: 500 });
  }
}
