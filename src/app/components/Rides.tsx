import { prisma } from "@/lib/prisma";
import { useRides, type Ride } from "../hooks/useRides";

export const Rides = async () => {
    // Server-side fetch
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
    console.log("Rides fetched:", rides);
    return (
        <section className="">
            <h1 className="text-3xl pb-4">Upcoming Rides</h1>
            {rides.length === 0 ? (
                <p>No rides scheduled.</p>
            ) : (
                <div className="">
                    <ul className="grid grid-cols-4 gap-6">
                        <li className="font-bold text-lg">Ride Name</li>
                        <li className="font-bold text-lg">Date/Time</li>
                        <li className="font-bold text-lg">Trails</li>
                        <li className="font-bold text-lg">Attendees</li>
                    </ul>
                    <ul className="">
                        {rides.map((ride) => (
                            <li key={ride.id} className="grid grid-cols-4 gap-6 py-2 border-b border-b-gray-200">
                                <p>{ride.name}</p>
                                <p>{new Date(ride.date).toLocaleDateString('en-us', { month: 'numeric', day: 'numeric' })}@{new Date(ride.date).toLocaleTimeString('en-us', { timeStyle: 'short', hour12: true })}</p>
                                <p>{ride.trailNames.join(", ")}</p>
                                <p>{ride.attendees.length}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            )
            }
        </section>
    )
}