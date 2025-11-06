"use client";

import { type Trail } from "../hooks/useTrails";
import RelatedTrailsCards from "./RelatedTrailsCards";

interface RelatedTrailsSectionProps {
  currentTrail: Trail & { trailSystem?: { name: string } };
  relatedTrails: Trail[];
  location: string | null;
  highlightedTrailId: string | null;
  onTrailHover: (trailId: string | null) => void;
}

export default function RelatedTrailsSection({
  currentTrail,
  relatedTrails,
  location,
  highlightedTrailId,
  onTrailHover,
}: RelatedTrailsSectionProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:p-8 mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Other Trails at {location}
      </h2>
      <RelatedTrailsCards
        currentTrail={currentTrail}
        relatedTrails={relatedTrails}
        highlightedTrailId={highlightedTrailId}
        onTrailHover={onTrailHover}
      />
    </div>
  );
}

