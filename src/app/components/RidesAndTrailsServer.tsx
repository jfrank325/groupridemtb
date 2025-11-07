import { prisma } from "@/lib/prisma";
import { EXAMPLE_RIDE_CUTOFF, getDeterministicCoords, getNextRecurringDate, Recurrence } from "@/lib/utils";
import { RidesAndTrailsClient } from "./RidesAndTrailsClient";
import { type Ride } from "../hooks/useRides";
import { type Trail } from "../hooks/useTrails";

export const RidesAndTrailsServer = async () => {
  // Fetch rides data
  const rideInclude = {
    trails: {
      include: {
        trail: { include: { trailSystem: true } },
      },
    },
    attendees: { include: { user: true } },
    host: { select: { id: true, name: true } },
  } as const;

  const ridesData = await prisma.ride.findMany({
    orderBy: { date: "asc" },
    include: rideInclude,
  });

  // Transform rides into frontend-ready structure
  const exampleRideCutoff = EXAMPLE_RIDE_CUTOFF;

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

  const rides: Ride[] = normalizedRidesData
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
      createdAt: ride.createdAt.toISOString(),
      isExample: ride.createdAt.getTime() < exampleRideCutoff.getTime(),
      date: ride.date.toISOString(),
      trailIds: rideTrails.map((t) => t.id),
      trailNames: rideTrails.map((t) => t.name),
      trailSystems: Array.from(new Set(rideTrails.map((t) => t.trailSystem?.name || t.name || "Unknown"))),
      difficulties: rideTrails.map((t) => t.difficulty || "Unknown"),
      totalDistanceKm: rideTrails.reduce((sum, t) => sum + (t.distanceKm || 0), 0),
      ...getDeterministicCoords(ride.id),
      attendees: ride.attendees.map((a) => ({ id: a.user.id, name: a.user.name })),
      host: ride.host ? { id: ride.host.id, name: ride.host.name } : undefined,
    };
  });

  // Fetch trails data
  const trailsData = await prisma.trail.findMany({
    include: {
      trailSystem: true,
    },
  });
  
  // Cast/map the Prisma JsonValue coordinates to the application's Trail type
  const trails: Trail[] = trailsData.map((t) => {
    // Type assertion: elevationLossM exists in the schema and Prisma client
    const trailWithElevationLoss = t as typeof t & { elevationLossM: number | null };
    
    return {
      id: t.id,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      name: t.name,
      location: t.location,
      difficulty: t.difficulty,
      distanceKm: t.distanceKm,
      elevationGainM: t.elevationGainM,
      elevationLossM: trailWithElevationLoss.elevationLossM ?? null,
      description: t.description,
      trailSystemId: t.trailSystemId,
      lat: t.lat,
      lng: t.lng,
      coordinates: t.coordinates as unknown as Trail['coordinates'],
      trailSystem: t.trailSystem ? {
        id: t.trailSystem.id,
        name: t.trailSystem.name,
      } : null,
    };
  });

  return <RidesAndTrailsClient rides={rides} trails={trails} />;
};

