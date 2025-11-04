"use client";

import { useState } from "react";
import { RidesList } from "./RidesList";
import TrailMap from "./TrailMap";
import { type Ride } from "../hooks/useRides";
import { type Trail } from "../hooks/useTrails";

interface RidesAndTrailsClientProps {
  rides: Ride[];
  trails: Trail[];
}

export const RidesAndTrailsClient = ({ rides, trails }: RidesAndTrailsClientProps) => {
  const [highlightedTrailId, setHighlightedTrailId] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row gap-8 w-full">
        <RidesList 
          title="Upcoming Rides" 
          rides={rides}
          onTrailHover={setHighlightedTrailId}
        />
        <div className="flex-1 lg:sticky lg:top-20 lg:self-start">
          <div className="mb-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Trail Map</h2>
            <p className="text-sm text-gray-600">Hover over trail names in the rides list to highlight them on the map</p>
          </div>
          <TrailMap trails={trails} highlightedTrailId={highlightedTrailId} />
        </div>
      </div>
    </div>
  );
};

