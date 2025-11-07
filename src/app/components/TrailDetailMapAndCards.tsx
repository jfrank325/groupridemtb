"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useUser } from "@/app/context/UserContext";
import { type Trail } from "../hooks/useTrails";
import RelatedTrailsSection from "./RelatedTrailsSection";

// Dynamically import TrailMapSingle to reduce initial bundle size
const TrailMapSingle = dynamic(() => import("./TrailMapSingle"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] rounded-xl shadow-md bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-2"></div>
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  ),
});

interface TrailDetailMapAndCardsProps {
  currentTrail: Trail & { trailSystem?: { name: string } };
  relatedTrails: Trail[];
}

export default function TrailDetailMapAndCards({
  currentTrail,
  relatedTrails,
}: TrailDetailMapAndCardsProps) {
  const [highlightedTrailId, setHighlightedTrailId] = useState<string | null>(null);
  const { session } = useUser();

  const createRideHref = useMemo(() => {
    if (session) return `/rides/new?trailId=${currentTrail.id}`;
    const callback = encodeURIComponent(`/rides/new?trailId=${currentTrail.id}`);
    return `/login?callbackUrl=${callback}&authMessage=create-ride`;
  }, [session, currentTrail.id]);

  const ctaLabel = session ? "Plan a Ride on this Trail" : "Log In to Plan a Ride";

  return (
    <>
      {/* Map Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Trail Location</h2>
            <p className="text-sm text-gray-600 mt-1">
              Explore the trail map, see nearby connectors, and plan your next group ride.
            </p>
          </div>
          <Link
            href={createRideHref}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
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
        <TrailMapSingle
          trail={currentTrail}
          relatedTrails={relatedTrails}
          highlightedTrailId={highlightedTrailId || currentTrail.id}
          onTrailHover={setHighlightedTrailId}
        />
      </div>

      {/* Other Trails at Same Location */}
      {relatedTrails.length > 0 && (
        <RelatedTrailsSection
          currentTrail={currentTrail}
          relatedTrails={relatedTrails}
          location={currentTrail.location}
          highlightedTrailId={highlightedTrailId}
          onTrailHover={setHighlightedTrailId}
        />
      )}
    </>
  );
}

