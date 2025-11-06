"use client";

import { useState } from "react";
import { type Trail } from "../hooks/useTrails";
import TrailMapSingle from "./TrailMapSingle";
import RelatedTrailsSection from "./RelatedTrailsSection";

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

