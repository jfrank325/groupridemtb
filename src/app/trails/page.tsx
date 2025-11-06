import { prisma } from "@/lib/prisma";
import { TrailsList } from "../components/TrailsList";
import { type Trail } from "../hooks/useTrails";
import type { Metadata } from "next";

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
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                    <div className="text-center">
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                            Explore
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                                Mountain Bike Trails
                            </span>
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Discover amazing trails for every skill level. From beginner-friendly paths to challenging adventures.
                        </p>
                    </div>
                </div>
            </section>

            {/* Trails Listing */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <TrailsList trails={trails} />
            </section>
        </main>
    );
}