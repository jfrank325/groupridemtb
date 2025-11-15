import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generalLimiter, getRateLimitIdentifier, checkRateLimit } from "@/lib/rate-limit";
import { getDeterministicCoords, getNextRecurringDate, Recurrence } from "@/lib/utils";

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
      const rideInclude = {
        trails: {
          include: {
            trail: {
              include: {
                trailSystem: true,
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
      } as const;

      const ridesData = await prisma.ride.findMany({
        orderBy: { date: "asc" },
        include: rideInclude,
      });

      const now = new Date();
      const normalizedRidesData = await Promise.all(
        ridesData.map(async (rideRecord) => {
          const recurrenceValue = (rideRecord as typeof rideRecord & { recurrence?: string | null }).recurrence ?? "none";
          const nextDate = getNextRecurringDate(rideRecord.date, recurrenceValue as Recurrence, now);
          if (nextDate) {
            return prisma.ride.update({
              where: { id: rideRecord.id },
              data: { date: nextDate },
              include: rideInclude,
            });
          }
          return rideRecord;
        })
      );

      const rides = normalizedRidesData
        .filter((ride) => ride.date > now)
        .map((ride) => {
        const rideTrails = ride.trails.map((rt) => rt.trail);
        const location = (ride as typeof ride & { location?: string | null }).location ?? null;

        return {
          id: ride.id,
          notes: ride.notes,
          name: ride.name,
          location,
          recurrence: (ride as typeof ride & { recurrence?: string | null }).recurrence ?? "none",
          date: ride.date.toISOString(),
          createdAt: ride.createdAt.toISOString(),
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
