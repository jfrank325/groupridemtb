import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { RidesList } from "../components/RidesList";

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);
    const fullUser = await prisma.user.findUnique({
        where: { email: session?.user?.email || undefined },
        include: {
            // The rides the user is attending
            rides: {
                include: {
                    ride: {
                        include: {
                            host: true, // host user
                            attendees: { include: { user: true } }, // all attendees with their user info
                            trails: { include: { trail: { include: { trailSystem: true } } } }, // the trails for this ride
                        },
                    },
                },
            },
            // Favorite trails
            favoriteTrails: true,
        },
    });
    console.log({ session, fullUser }, 'profile session');
    const rides = fullUser?.rides?.map((r) => {
        const ride = r.ride;
        const trailIds = ride.trails.map((t) => t.trail.id);
        const trailNames = ride.trails.map((t) => t.trail.name);
        const difficulties = ride.trails.map((t) => t.trail.difficulty || "Unknown");
        const totalDistanceKm = ride.trails.reduce((sum, t) => sum + (t.trail.distanceKm || 0), 0);
        const trailSystems = Array.from(new Set(ride.trails.map((t) => t.trail.trailSystem?.name || t.trail.name || "Unknown")));
        return {
            id: ride.id,
            name: ride.name,
            host: ride.host,
            notes: ride.notes,
            attendees: (ride.attendees || []).map((a) => ({ id: a.user.id, name: a.user.name })),
            date: ride.date ? ride.date.toISOString() : "",
            // Get trail info from the first trail for simplicity
            trailIds,
            trailNames,
            lat: 33.8 + Math.random() * 0.3,
            lng: -84.6 + Math.random() * 0.3,
            difficulties,
            totalDistanceKm,
            trailSystems,
        }
    });


    return (
        <section>
            <h1 className="text-3xl font-semibold mb-6">Profile Page</h1>
            <p>{session?.user?.name}</p>
            <p>{session?.user?.email}</p>
            <p>{fullUser?.zip}</p>
            {rides?.length && rides.length > 0&& (
                <div>
                    <RidesList title="Your Rides" rides={rides} />
                    {/* <ul>
                        {fullUser.rides.map((ride) => (
                            <li key={ride.rideId} className="mb-2">
                                Ride on {new Date(ride.ride.date).toLocaleDateString()} at {new Date(ride.ride.date).toLocaleTimeString()}
                            </li>
                        ))}
                    </ul> */}
                </div>
            )}
        </section>
    )
}