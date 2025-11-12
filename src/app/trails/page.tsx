import { prisma } from "@/lib/prisma";
import { TrailsList } from "../components/TrailsList";
import { type Trail } from "../hooks/useTrails";
import type { Metadata } from "next";
import { PageHeader } from "../components/PageHeader";

export const metadata: Metadata = {
  title: "Mountain Bike Trails",
  description: "Discover amazing mountain bike trails for every skill level. From beginner-friendly paths to challenging adventures. Find trails near you and join group rides.",
  openGraph: {
    title: "Mountain Bike Trails - MTB Group Ride",
    description: "Discover amazing mountain bike trails for every skill level. Find trails near you and join group rides.",
    type: "website",
  },
};

export default async function Trails() {
    const trailsData = await prisma.trail.findMany({
        include: {
            trailSystem: true,
        },
        orderBy: { name: "asc" },
    });

    const trails: Trail[] = trailsData.map((t) => ({
        ...t,
        coordinates: t.coordinates as unknown as Trail['coordinates'],
    }));

    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
            <PageHeader
                title="Explore"
                titleHighlight="Mountain Bike Trails"
                description="Discover amazing trails for every skill level. From beginner-friendly paths to challenging adventures."
            />

            {/* Trails Listing */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <TrailsList trails={trails} />
            </section>
        </main>
    );
}