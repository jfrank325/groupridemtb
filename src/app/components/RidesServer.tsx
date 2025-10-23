import { prisma } from "@/lib/prisma";
import { useRides, type Ride } from "../hooks/useRides";
import { RidesClient } from "./RidesClient";

export const RidesServer = async () => {

    const ridesData = await prisma.ride.findMany({
        include: {
            trails: {
                include: {
                    trail: { include: { trailSystem: true } },
                },
            },
            attendees: { include: { user: true } },
        },
    });

    // Transform into frontend-ready structure
    const rides: Ride[] = ridesData.map((ride) => {
        const rideTrails = ride.trails.map((rt) => rt.trail);
        return {
            id: ride.id,
            notes: ride.notes,
            name: ride.name,
            date: ride.date.toISOString(),
            trailIds: rideTrails.map((t) => t.id),
            trailNames: rideTrails.map((t) => t.name),
            trailSystems: Array.from(new Set(rideTrails.map((t) => t.trailSystem?.name || t.name|| "Unknown"))),
            difficulties: rideTrails.map((t) => t.difficulty || "Unknown"),
            totalDistanceKm: rideTrails.reduce((sum, t) => sum + (t.distanceKm || 0), 0),
            lat: 33.8 + Math.random() * 0.3,
            lng: -84.6 + Math.random() * 0.3,
            attendees: ride.attendees.map((a) => ({ id: a.user.id, name: a.user.name })),
        };
    });

    return (
        <RidesClient rides={rides} />
    )
}