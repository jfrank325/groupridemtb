import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generalLimiter, getRateLimitIdentifier, checkRateLimit } from "@/lib/rate-limit";
import { EXAMPLE_RIDE_CUTOFF, getDeterministicCoords } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    // Rate limiting
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = await checkRateLimit(generalLimiter, identifier);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { 
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          },
        }
      );
    }

    try {
      const ridesData = await prisma.ride.findMany({
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
          host: {
            select: {
              id: true,
              name: true,
            },
          },
          attendees: {
            include: {
              user: true,
            },
          },
        },
      });

      const exampleRideCutoff = EXAMPLE_RIDE_CUTOFF;

      const rides = ridesData.map((ride) => {
        const rideTrails = ride.trails.map((rt) => rt.trail);

        return {
          id: ride.id,
          notes: ride.notes,
          name: ride.name,
          date: ride.date.toISOString(),
          createdAt: ride.createdAt.toISOString(),
          isExample: ride.createdAt.getTime() < exampleRideCutoff.getTime(),
          trailIds: rideTrails.map((t) => t.id),
          trailNames: rideTrails.map((t) => t.name),
          trailSystems: Array.from(
            new Set(rideTrails.map((t) => t.trailSystem?.name || t.name || "Unknown"))
          ),
          difficulties: rideTrails.map((t) => t.difficulty || "Unknown"),
          totalDistanceKm: rideTrails.reduce((sum, t) => sum + (t.distanceKm || 0), 0),
          ...getDeterministicCoords(ride.id),
          attendees: ride.attendees.map((a) => ({
            id: a.user.id,
            name: a.user.name,
          })),
          host: ride.host ? { id: ride.host.id, name: ride.host.name } : undefined,
        };
      });

      const response = NextResponse.json(rides);
      response.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString());
      response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString());
      response.headers.set("X-RateLimit-Reset", rateLimitResult.reset.toString());
      
      return response;
    } catch (error) {
      console.error("Error fetching rides:", error);
      return NextResponse.json(
        { error: "Failed to fetch rides" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[GET_RIDES]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
