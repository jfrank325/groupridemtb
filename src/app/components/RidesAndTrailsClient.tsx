"use client";

import { useState, useCallback } from "react";
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
  const [highlightedRideIds, setHighlightedRideIds] = useState<string[]>([]);

  // When a trail is hovered on the map, highlight the trail and find all rides that include that trail
  const handleTrailHover = useCallback((trailId: string | null) => {
    if (!trailId) {
      setHighlightedRideIds([]);
      return;
    }

    // Highlight the trail on the map
    setHighlightedTrailId(trailId);

    // Find all rides that include this trail
    const ridesWithTrail = rides
      .filter(ride => ride.trailIds.includes(trailId))
      .map(ride => ride.id);
    
    setHighlightedRideIds(ridesWithTrail);
  }, [rides]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row gap-8 w-full">
        <RidesList 
          title="Upcoming Rides" 
          rides={rides}
          onTrailHover={setHighlightedTrailId}
          highlightedRideIds={highlightedRideIds}
        />
        <div className="flex-1 lg:sticky lg:top-20 lg:self-start">
          <div className="mb-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Trail Map</h2>
            <p className="text-sm text-gray-600">Hover over trails on the map or trail names in the rides list to see connections</p>
          </div>
          <TrailMap 
            trails={trails} 
            highlightedTrailId={highlightedTrailId}
            onTrailHover={handleTrailHover}
          />
        </div>
      </div>
    </div>
  );
};

