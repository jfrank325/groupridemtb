import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

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
                            trails: { include: { trail: true } }, // the trails for this ride
                        },
                    },
                },
            },
            // Favorite trails
            favoriteTrails: true,
        },
    });
    console.log({ session, fullUser }, 'profile session');



    return (
        <section>
            <h1 className="text-3xl font-semibold mb-6">Profile Page</h1>
            <p>{session?.user?.name}</p>
            <p>{session?.user?.email}</p>
            <p>{fullUser?.zip}</p>
            {fullUser?.rides && (
                <div>
                    <h2 className="text-2xl font-semibold mt-4 mb-2">Your Rides</h2>
                    <ul>
                        {fullUser.rides.map((ride) => (
                            <li key={ride.rideId} className="mb-2">
                                Ride on {new Date(ride.ride.date).toLocaleDateString()} at {new Date(ride.ride.date).toLocaleTimeString()}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    )
}