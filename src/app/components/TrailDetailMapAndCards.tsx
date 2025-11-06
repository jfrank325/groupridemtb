"use client";

import { useState, Suspense } from "react";
import dynamic from "next/dynamic";
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

  return (
    <>
      {/* Map Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Trail Location</h2>
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

