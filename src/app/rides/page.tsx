import Link from "next/link";
import { getServerSession } from "next-auth";
import { RidesServer } from "../components/RidesServer";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { PageHeader } from "../components/PageHeader";

export default async function Rides() {
    const session = await getServerSession(authOptions);

    const createRideHref = session ? "/rides/new" : "/login?callbackUrl=%2Frides%2Fnew&authMessage=create-ride";
    const ctaLabel = session ? "Create a Ride" : "Log in to Create a Ride";

    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
            <PageHeader
                title="Upcoming"
                titleHighlight="Group Rides"
                description="Join fellow riders for group mountain bike rides. Find your next adventure or create your own."
            >
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                    <Link
                        href="/trails"
                        className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-emerald-700 border border-emerald-600 rounded-lg bg-white transition-colors hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                    >
                        Explore Trails
                    </Link>
                    <Link
                        href={createRideHref}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-emerald-600 rounded-lg shadow-lg transition-colors hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                    >
                        <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                        {ctaLabel}
                    </Link>
                </div>
                {!session && (
                    <p className="mt-2 text-xs text-gray-500">
                        We'll bring you back here after sign-in so you can finish creating your ride.
                    </p>
                )}
            </PageHeader>

            {/* Rides Listing */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <RidesServer />
            </section>
        </main>
    );
}