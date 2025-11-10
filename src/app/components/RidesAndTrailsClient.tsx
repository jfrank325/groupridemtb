"use client";

import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { RidesList } from "./RidesList";
import { type Ride } from "../hooks/useRides";
import { type Trail } from "../hooks/useTrails";
import { useUser } from "../context/UserContext";

// Dynamically import TrailMap to reduce initial bundle size
const TrailMap = dynamic(() => import("./TrailMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] rounded-xl shadow-md bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-2"></div>
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  ),
});

interface RidesAndTrailsClientProps {
  rides: Ride[];
  trails: Trail[];
}

export const RidesAndTrailsClient = ({ rides, trails }: RidesAndTrailsClientProps) => {
  const [highlightedTrailId, setHighlightedTrailId] = useState<string | null>(null);
  const [highlightedRideIds, setHighlightedRideIds] = useState<string[]>([]);
  const { user } = useUser();

  const userCenter = useMemo<[number, number] | null>(() => {
    if (typeof user?.lat === "number" && typeof user?.lng === "number") {
      return [user.lng, user.lat];
    }
    return null;
  }, [user?.lat, user?.lng]);

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
            center={userCenter ?? undefined}
          />
        </div>
      </div>
    </div>
  );
};

