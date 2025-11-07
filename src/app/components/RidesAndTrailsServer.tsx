import { prisma } from "@/lib/prisma";
import { getDeterministicCoords } from "@/lib/utils";
import { RidesAndTrailsClient } from "./RidesAndTrailsClient";
import { type Ride } from "../hooks/useRides";
import { type Trail } from "../hooks/useTrails";

export const RidesAndTrailsServer = async () => {
  // Fetch rides data
  const ridesData = await prisma.ride?.findMany({
    where: {
      date: {
        gt: new Date(), // Only get rides in the future
      },
    },
    orderBy: { date: "asc" },
    include: {
      trails: {
        include: {
          trail: { include: { trailSystem: true } },
        },
      },
      attendees: { include: { user: true } },
      host: { select: { id: true, name: true } },
    },
  });

  // Transform rides into frontend-ready structure
  const rides: Ride[] = ridesData.map((ride) => {
    const rideTrails = ride.trails.map((rt) => rt.trail);
    return {
      id: ride.id,
      notes: ride.notes,
      name: ride.name,
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
  const trailsData = await prisma.trail?.findMany({
    include: {
      trailSystem: true,
    },
  });
  
  // Cast/map the Prisma JsonValue coordinates to the application's Trail type
  const trails: Trail[] = (trailsData ?? []).map((t) => ({
    id: t.id,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    name: t.name,
    location: t.location,
    difficulty: t.difficulty,
    distanceKm: t.distanceKm,
    elevationGainM: t.elevationGainM,
    elevationLossM: t.elevationLossM ?? null,
    description: t.description,
    trailSystemId: t.trailSystemId,
    lat: t.lat,
    lng: t.lng,
    coordinates: t.coordinates as unknown as Trail['coordinates'],
    trailSystem: t.trailSystem ? {
      id: t.trailSystem.id,
      name: t.trailSystem.name,
    } : null,
  }));

  return <RidesAndTrailsClient rides={rides} trails={trails} />;
};

