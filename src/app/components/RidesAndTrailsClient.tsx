"use client";

import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { RidesList } from "./RidesList";
import { type Ride } from "../hooks/useRides";
import { type Trail } from "../hooks/useTrails";
import { useUser } from "../context/UserContext";
import { calculateSimilarity } from "@/lib/utils";

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
  const [highlightedTrailIds, setHighlightedTrailIds] = useState<string[]>([]);
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
      setHighlightedTrailIds([]);
      return;
    }

    // Highlight the trail on the map
    setHighlightedTrailIds([trailId]);

    // Find all rides that include this trail
    const ridesWithTrail = rides
      .filter(ride => ride.trailIds.includes(trailId))
      .map(ride => ride.id);
    
    setHighlightedRideIds(ridesWithTrail);
  }, [rides]);

  // When a ride card is hovered, highlight all its trails or find trails by location match
  const handleRideHover = useCallback((ride: Ride | null) => {
    if (!ride) {
      setHighlightedTrailIds([]);
      return;
    }

    // If ride has associated trails, use those
    if (ride.trailIds && ride.trailIds.length > 0) {
      setHighlightedTrailIds(ride.trailIds);
      return;
    }

    // If no trails but has location, try to find trails by location matching
    if (ride.location) {
      const matchingTrailIds = new Set<string>();
      const rideLocation = ride.location.trim();
      
      trails.forEach((trail) => {
        // Check trail location
        if (trail.location) {
          const similarity = calculateSimilarity(rideLocation, trail.location);
          if (similarity >= 0.7) {
            matchingTrailIds.add(trail.id);
            return; // Skip checking trail system if trail location matches
          }
        }
        
        // Check trail system location
        if (trail.trailSystem?.location) {
          const similarity = calculateSimilarity(rideLocation, trail.trailSystem.location);
          if (similarity >= 0.7) {
            matchingTrailIds.add(trail.id);
          }
        }
      });

      if (matchingTrailIds.size > 0) {
        setHighlightedTrailIds(Array.from(matchingTrailIds));
      } else {
        setHighlightedTrailIds([]);
      }
    } else {
      setHighlightedTrailIds([]);
    }
  }, [trails]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row gap-8 w-full">
        <RidesList 
          title="Upcoming Rides" 
          rides={rides}
          onTrailHover={(trailId) => handleTrailHover(trailId)}
          onRideHover={handleRideHover}
          highlightedRideIds={highlightedRideIds}
        />
        <div className="flex-1 w-full lg:sticky lg:top-20 lg:self-start">
          <div className="mb-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Trail Map</h2>
            <p className="text-sm text-gray-600">Hover over rides or trails on the map to see connections</p>
          </div>
          <TrailMap 
            trails={trails} 
            highlightedTrailIds={highlightedTrailIds}
            onTrailHover={handleTrailHover}
            center={userCenter ?? undefined}
          />
        </div>
      </div>
    </div>
  );
};

