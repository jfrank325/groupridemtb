import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import TrailDetailMapAndCards from "@/app/components/TrailDetailMapAndCards";
import { type Trail } from "../../hooks/useTrails";
import { TrailsTrailDetailClient } from "@/app/components/TrailsTrailDetailClient";
import { formatDistanceValue, formatElevationValue, getNextRecurringDate, Recurrence } from "@/lib/utils";

interface TrailDetailPageProps {
  params: Promise<{ id: string }>;
}

const difficultyColors = {
  Easy: "bg-green-100 text-green-700 border-green-200",
  Beginner: "bg-green-100 text-green-700 border-green-200",
  Intermediate: "bg-blue-100 text-blue-700 border-blue-200",
  Advanced: "bg-red-100 text-red-700 border-red-200",
};

export default async function TrailDetailPage({ params }: TrailDetailPageProps) {
  const { id } = await params;

  const trailData = await prisma.trail.findUnique({
    where: { id },
    include: {
      trailSystem: true,
    },
  });

  if (!trailData) {
    notFound();
  }

  const trail: Trail & { trailSystem?: { name: string } } = {
    ...trailData,
    coordinates: trailData.coordinates as unknown as Trail['coordinates'],
    trailSystem: trailData.trailSystem || undefined,
  };

  const rideInclude = {
    host: {
      select: { id: true, name: true },
    },
    attendees: {
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    },
    trails: {
      include: {
        trail: {
          select: { id: true, name: true },
        },
      },
    },
  } as const;

  const ridesData = await prisma.ride.findMany({
    where: {
      trails: {
        some: {
          trailId: id,
        },
      },
    },
    include: rideInclude,
    orderBy: { date: "asc" },
    take: 25,
  });

  const now = new Date();
  const normalizedRidesData = await Promise.all(
    ridesData.map(async (rideRecord) => {
      const nextDate = getNextRecurringDate(rideRecord.date, (rideRecord.recurrence as Recurrence) ?? "none", now);
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

  // Transform rides to match the expected interface (convert Date to string)
  const transformedRides = normalizedRidesData
    .filter((ride) => ride.date > now)
    .slice(0, 10)
    .map((ride) => ({
      id: ride.id,
      date: ride.date.toISOString(),
      name: ride.name,
      location: (ride as typeof ride & { location?: string | null }).location ?? null,
      recurrence: (ride as typeof ride & { recurrence?: string | null }).recurrence ?? "none",
      notes: ride.notes,
      host: ride.host,
      attendees: ride.attendees,
      trails: ride.trails,
    }));

  // Fetch other trails at the same location
  const relatedTrailsData = trail.location
    ? await prisma.trail.findMany({
        where: {
          location: trail.location,
          id: { not: id }, // Exclude the current trail
        },
        include: {
          trailSystem: true,
        },
        orderBy: { name: "asc" },
      })
    : [];

  const relatedTrails: Trail[] = relatedTrailsData.map((t) => ({
    ...t,
    coordinates: t.coordinates as unknown as Trail['coordinates'],
    trailSystem: t.trailSystem || undefined,
  }));

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link
          href="/trails"
          className="inline-flex items-center text-sm text-gray-600 hover:text-emerald-600 transition-colors mb-6 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Trails
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Header Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                {trail.name}
              </h1>
              {trail.location && (
                <div className="flex items-center text-gray-600 mb-4">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="text-lg">{trail.location}</span>
                  {trail.trailSystem && (
                    <span className="text-gray-400 mx-2">•</span>
                  )}
                  {trail.trailSystem && (
                    <span className="text-lg">{trail.trailSystem.name}</span>
                  )}
                </div>
              )}
            </div>
            {trail.difficulty && (
              <span
                className={`text-sm font-semibold px-4 py-2 rounded-full border ${
                  difficultyColors[
                    trail.difficulty as keyof typeof difficultyColors
                  ] || "bg-gray-100 text-gray-700 border-gray-200"
                }`}
              >
                {trail.difficulty}
              </span>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-200">
            {trail.distanceKm && (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Distance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatDistanceValue(trail.distanceKm)}
                </p>
                <p className="text-xs text-gray-500">miles</p>
              </div>
            )}
            {trail.elevationGainM && (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Elevation Gain</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatElevationValue(trail.elevationGainM)}
                </p>
                <p className="text-xs text-gray-500">feet</p>
              </div>
            )}
            {trail.elevationLossM && (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Elevation Loss</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatElevationValue(trail.elevationLossM)}
                </p>
                <p className="text-xs text-gray-500">feet</p>
              </div>
            )}
            {trail.distanceKm && trail.elevationGainM && (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Avg Grade</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(
                    (trail.elevationGainM / (trail.distanceKm * 1000)) *
                    100
                  ).toFixed(1)}
                </p>
                <p className="text-xs text-gray-500">percent</p>
              </div>
            )}
            {transformedRides.length > 0 && (
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <p className="text-sm text-emerald-700 mb-1">Upcoming Rides</p>
                <p className="text-2xl font-bold text-emerald-900">
                  {transformedRides.length}
                </p>
                <p className="text-xs text-emerald-600">scheduled</p>
              </div>
            )}
          </div>
        </div>

        {/* Map and Related Trails Section */}
        <TrailDetailMapAndCards
          currentTrail={trail}
          relatedTrails={relatedTrails}
        />

        {/* Description Section */}
        {trail.description && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Trail</h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {trail.description}
              </p>
            </div>
          </div>
        )}

        {/* Upcoming Rides Section */}
        <TrailsTrailDetailClient trailId={trail.id} initialRides={transformedRides} />
      </div>
    </main>
  );
}
