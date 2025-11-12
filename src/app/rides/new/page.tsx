import { NewRideForm } from "@/app/components/NewRideForm";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PageHeader } from "@/app/components/PageHeader";

export default async function NewRidePage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const resolvedSearchParams = await searchParams;
    const rawTrailId = resolvedSearchParams?.trailId;
    const session = await getServerSession(authOptions);
    const trailId = Array.isArray(rawTrailId) ? rawTrailId[0] : rawTrailId;

    if (!session) {
        const callbackPath = trailId ? `/rides/new?trailId=${encodeURIComponent(trailId)}` : "/rides/new";
        redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}&authMessage=create-ride`);
    }

    const trailsData = await prisma.trail?.findMany({
        select: { id: true, name: true, difficulty: true, location: true },
        orderBy: { name: "asc" },
    });
    
    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
            <PageHeader
                title="Create a New"
                titleHighlight="Group Ride"
                description="Organize a mountain bike ride and invite fellow riders to join the adventure."
            />

            {/* Form Section */}
            <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 md:p-8">
                    <NewRideForm initialTrailId={trailId ?? null} trails={trailsData} />
                </div>
                <div className="mt-6 text-center">
                    <Link 
                        href="/rides"
                        className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                    >
                        ← Back to Rides
                    </Link>
                </div>
            </section>
        </main>
    );
}
