import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getDeterministicCoords } from "@/lib/utils";
import { RidesList } from "../components/RidesList";
import LogoutButton from "../components/LogoutButton";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MessagesLink } from "../components/MessagesLink";
import { Prisma } from "@prisma/client";
import { UserNotificationPreferences } from "../components/UserNotificationPreferences";
import { PageHeader } from "../components/PageHeader";

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/login");
    }

    const fullUser = await prisma.user.findUnique({
        where: { email: session?.user?.email || undefined },
        include: {
            rides: {
                include: {
                    ride: {
                        include: {
                            host: { select: { id: true, name: true } },
                            attendees: { include: { user: true } },
                            trails: { include: { trail: { include: { trailSystem: true } } } },
                        },
                    },
                },
            },
            hostRides: {
                include: {
                    host: { select: { id: true, name: true } },
                    attendees: { include: { user: true } },
                    trails: { include: { trail: { include: { trailSystem: true } } } },
                },
            },
            favoriteTrails: true,
        },
    });

    if (!fullUser) {
        redirect("/login");
    }

    type RideWithRelations = Prisma.RideGetPayload<{
        include: {
            host: { select: { id: true; name: true } };
            attendees: { include: { user: true } };
            trails: { include: { trail: { include: { trailSystem: true } } } };
        };
    }>;

    type RideAttendeeWithRide = Prisma.RideAttendeeGetPayload<{
        include: {
            ride: {
                include: {
                    host: { select: { id: true; name: true } };
                    attendees: { include: { user: true } };
                    trails: { include: { trail: { include: { trailSystem: true } } } };
                };
            };
        };
    }>;

    const normalizeRide = (ride: RideWithRelations, role: "host" | "attendee") => {
        const rideTrails = ride.trails.map((rt) => rt.trail);
        const trailIds = rideTrails.map((t) => t.id);
        const trailNames = rideTrails.map((t) => t.name);
        const difficulties = rideTrails.map((t) => t.difficulty || "Unknown");
        const totalDistanceKm = rideTrails.reduce((sum, t) => sum + (t.distanceKm || 0), 0);
        const trailSystems = Array.from(new Set(rideTrails.map((t) => t.trailSystem?.name || t.name || "Unknown")));
        const location = (ride as typeof ride & { location?: string | null }).location ?? null;
        return {
            id: ride.id,
            name: ride.name,
            location,
            role,
            recurrence: (ride as typeof ride & { recurrence?: string | null }).recurrence ?? "none",
            host: ride.host ? { id: ride.host.id, name: ride.host.name } : undefined,
            notes: ride.notes,
            attendees: (ride.attendees || []).map((a) => ({ id: a.user.id, name: a.user.name })),
            date: ride.date ? ride.date.toISOString() : "",
            createdAt: ride.createdAt.toISOString(),
            trailIds,
            trailNames,
            trailSystems,
            difficulties,
            totalDistanceKm,
            ...getDeterministicCoords(ride.id),
        };
    };

    const hostedRides = (fullUser.hostRides ?? []).map((ride) => normalizeRide(ride as RideWithRelations, "host"));
    const attendingRides = (fullUser.rides ?? []).map((wrapper: RideAttendeeWithRide) =>
        normalizeRide(wrapper.ride, "attendee")
    );

    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
            <PageHeader
                title={`${session?.user?.name || "User"}'s Profile`}
                description={session?.user?.email || undefined}
                prefix={
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500">
                        <span className="text-3xl font-bold text-white">
                            {session?.user?.name?.charAt(0).toUpperCase() || "U"}
                        </span>
                    </div>
                }
            />

            {/* Profile Content */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    {/* Profile Info Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Name</label>
                                    <p className="text-gray-900 font-medium">{session?.user?.name || "Not set"}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Email</label>
                                    <p className="text-gray-900 font-medium">{session?.user?.email}</p>
                                </div>
                                {fullUser?.zip && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">ZIP Code</label>
                                        <p className="text-gray-900 font-medium">{fullUser.zip}</p>
                                    </div>
                                )}
                                {fullUser?.favoriteTrails && fullUser.favoriteTrails.length > 0 && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Favorite Trails</label>
                                        <p className="text-gray-900 font-medium">{fullUser.favoriteTrails.length}</p>
                                    </div>
                                )}
                                <div className="pt-4 border-t border-gray-200">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                                        Email Notifications
                                    </h3>
                                    <UserNotificationPreferences
                                        initialEmailEnabled={fullUser?.emailNotificationsEnabled ?? true}
                                        initialNotifyLocalRides={fullUser?.notifyLocalRides ?? true}
                                        initialNotifyRideCancellations={fullUser?.notifyRideCancellations ?? true}
                                        initialNotifyRideMessages={fullUser?.notifyRideMessages ?? true}
                                        initialNotifyDirectMessages={fullUser?.notifyDirectMessages ?? true}
                                        initialRadius={fullUser?.notificationRadiusMiles ?? null}
                                    />
                                </div>
                            </div>
                            <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                                <MessagesLink />
                                <LogoutButton />
                            </div>
                        </div>
                    </div>

                    {/* Rides Section */}
                    <div className="lg:col-span-2 space-y-12">
                        {hostedRides.length > 0 && (
                            <RidesList title="Rides You're Hosting" rides={hostedRides} />
                        )}

                        {attendingRides.length > 0 && (
                            <RidesList title="Rides You're Attending" rides={attendingRides} />
                        )}

                        {hostedRides.length === 0 && attendingRides.length === 0 && (
                            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                                <svg 
                                    className="w-16 h-16 mx-auto text-gray-300 mb-4" 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No rides yet</h3>
                                <p className="text-gray-500 mb-4">You haven't hosted or joined any rides yet.</p>
                                <Link
                                    href="/rides"
                                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-lg hover:shadow-xl"
                                >
                                    Browse Rides
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}