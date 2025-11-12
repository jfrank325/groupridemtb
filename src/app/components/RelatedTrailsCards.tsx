"use client";

import Link from "next/link";
import { type Trail } from "../hooks/useTrails";
import { formatDistanceValue, formatElevationValue } from "@/lib/utils";
import { difficultyColors } from "@/lib/constants";

interface RelatedTrailsCardsProps {
  currentTrail: Trail & { trailSystem?: { name: string } };
  relatedTrails: Trail[];
  highlightedTrailId: string | null;
  onTrailHover: (trailId: string | null) => void;
}

export default function RelatedTrailsCards({
  currentTrail,
  relatedTrails,
  highlightedTrailId,
  onTrailHover,
}: RelatedTrailsCardsProps) {
  const isCurrentTrailHighlighted = highlightedTrailId === currentTrail.id;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Current Trail - Highlighted */}
      <div
        className={`rounded-xl p-6 shadow-md transition-all ${
          isCurrentTrailHighlighted
            ? "bg-emerald-100 border-2 border-emerald-600"
            : "bg-emerald-50 border-2 border-emerald-500"
        }`}
        onMouseEnter={() => onTrailHover(currentTrail.id)}
        onMouseLeave={() => onTrailHover(null)}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{currentTrail.name}</h3>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
                Current
              </span>
            </div>
            {currentTrail.trailSystem && (
              <p className="text-sm text-gray-600 mb-2">{currentTrail.trailSystem.name}</p>
            )}
          </div>
          {currentTrail.difficulty && (
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${
                difficultyColors[
                  currentTrail.difficulty as keyof typeof difficultyColors
                ] || "bg-gray-100 text-gray-700 border-gray-200"
              }`}
            >
              {currentTrail.difficulty}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-emerald-200">
          {currentTrail.distanceKm && (
            <div>
              <p className="text-xs text-gray-600 mb-1">Distance</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatDistanceValue(currentTrail.distanceKm)} miles
              </p>
            </div>
          )}
          {currentTrail.elevationGainM && (
            <div>
              <p className="text-xs text-gray-600 mb-1">Elevation</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatElevationValue(currentTrail.elevationGainM)} ft
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Other Trails */}
      {relatedTrails.map((relatedTrail) => {
        const isHighlighted = highlightedTrailId === relatedTrail.id;
        return (
          <Link
            key={relatedTrail.id}
            href={`/trails/${relatedTrail.id}`}
            className={`rounded-xl p-6 transition-all group focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2 focus-within:outline-none ${
              isHighlighted
                ? "bg-emerald-50 border-2 border-emerald-500 shadow-lg"
                : "bg-white border border-gray-200 hover:border-emerald-300 hover:shadow-lg"
            }`}
            onMouseEnter={() => onTrailHover(relatedTrail.id)}
            onMouseLeave={() => onTrailHover(null)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3
                  className={`text-lg font-semibold mb-2 transition-colors ${
                    isHighlighted
                      ? "text-emerald-700"
                      : "text-gray-900 group-hover:text-emerald-600"
                  }`}
                >
                  {relatedTrail.name}
                </h3>
                {relatedTrail.trailSystem && (
                  <p className="text-sm text-gray-600 mb-2">{relatedTrail.trailSystem.name}</p>
                )}
              </div>
              {relatedTrail.difficulty && (
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${
                    difficultyColors[
                      relatedTrail.difficulty as keyof typeof difficultyColors
                    ] || "bg-gray-100 text-gray-700 border-gray-200"
                  }`}
                >
                  {relatedTrail.difficulty}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
              {relatedTrail.distanceKm && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Distance</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatDistanceValue(relatedTrail.distanceKm)} miles
                  </p>
                </div>
              )}
              {relatedTrail.elevationGainM && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Elevation</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatElevationValue(relatedTrail.elevationGainM)} ft
                  </p>
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

