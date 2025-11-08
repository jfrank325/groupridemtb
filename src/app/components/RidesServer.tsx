
import { prisma } from "@/lib/prisma";
import { EXAMPLE_RIDE_CUTOFF, getDeterministicCoords, getNextRecurringDate, Recurrence } from "@/lib/utils";
import { type Ride } from "../hooks/useRides";
import { RidesList } from "./RidesList";

export const RidesServer = async () => {

    const exampleRideCutoff = EXAMPLE_RIDE_CUTOFF;

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
        where: {
            date: {
                gt: new Date(),
            },
        },
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
            trailSystems: Array.from(new Set(rideTrails.map((t) => t.trailSystem?.name || t.name|| "Unknown"))),
            difficulties: rideTrails.map((t) => t.difficulty || "Unknown"),
            totalDistanceKm: rideTrails.reduce((sum, t) => sum + (t.distanceKm || 0), 0),
            ...getDeterministicCoords(ride.id),
            attendees: ride.attendees.map((a) => ({ id: a.user.id, name: a.user.name })),
            host: ride.host ? { id: ride.host.id, name: ride.host.name } : undefined,
        };
    });

    return (
        <RidesList title="Upcoming Rides" rides={rides} />
    )
}