"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { type Trail } from "../hooks/useTrails";
import { useUser } from "../context/UserContext";
import Link from "next/link";
import { formatDistanceValue, formatElevationValue } from "@/lib/utils";
import { difficultyColors } from "@/lib/constants";

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

interface TrailsClientProps {
  trails: Trail[];
}

export function TrailsClient({ trails }: TrailsClientProps) {
  const [selectedTrailId, setSelectedTrailId] = useState<string | null>(null);
  const [displayedTrails, setDisplayedTrails] = useState<Trail[]>([]);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");
  const [searchCenter, setSearchCenter] = useState<[number, number] | null>(null);
  const [mapZoom, setMapZoom] = useState<number | undefined>(undefined); // undefined = default (9), number = custom zoom
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recenterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useUser();

  const userCenter = useMemo<[number, number] | null>(() => {
    if (typeof user?.lat === "number" && typeof user?.lng === "number") {
      return [user.lng, user.lat];
    }
    return null;
  }, [user?.lat, user?.lng]);

  // Helper function to extract coordinates from a trail
  const extractTrailCenter = useCallback((trail: Trail): [number, number] | null => {
    // First try lat/lng if available
    if (typeof trail.lat === "number" && typeof trail.lng === "number") {
      return [trail.lng, trail.lat];
    }

    // Then try to extract from coordinates array
    if (trail.coordinates) {
      try {
        // Handle different coordinate formats
        let coords: number[][] | null = null;
        
        if (Array.isArray(trail.coordinates)) {
          // Check if it's a GeoJSON Geometry object
          if (trail.coordinates.length > 0 && typeof trail.coordinates[0] === "object") {
            const first = trail.coordinates[0];
            // Check if it's a GeoJSON LineString format: [[lng, lat], [lng, lat], ...]
            if (Array.isArray(first) && first.length >= 2 && typeof first[0] === "number") {
              coords = trail.coordinates as number[][];
            }
          }
        }

        if (coords && coords.length > 0 && Array.isArray(coords[0]) && coords[0].length >= 2) {
          const firstCoord = coords[0];
          return [firstCoord[0], firstCoord[1]]; // [lng, lat]
        }
      } catch (error) {
        console.warn("Error extracting coordinates from trail:", error);
      }
    }

    return null;
  }, []);

  // Debounce search query to prevent map from updating on every keystroke
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Filter trails by difficulty and search query (using debounced search)
  const filteredTrails = useMemo(() => {
    return trails.filter((trail) => {
      // Filter by difficulty
      if (filter !== "all" && trail.difficulty?.toLowerCase() !== filter.toLowerCase()) {
        return false;
      }

      // Filter by search query (using debounced value)
      if (debouncedSearchQuery.trim()) {
        const query = debouncedSearchQuery.toLowerCase();
        const matchesName = trail.name?.toLowerCase().includes(query);
        const matchesLocation = trail.location?.toLowerCase().includes(query);
        const matchesTrailSystem = trail.trailSystem?.name?.toLowerCase().includes(query) ||
          trail.trailSystem?.location?.toLowerCase().includes(query);
        return matchesName || matchesLocation || matchesTrailSystem;
      }

      return true;
    });
  }, [trails, filter, debouncedSearchQuery]);

  // Recenter map on first search result after debounce delay (only for search, not filters)
  useEffect(() => {
    // Clear any pending recenter
    if (recenterTimeoutRef.current) {
      clearTimeout(recenterTimeoutRef.current);
    }

    // Only recenter if there's a search query (not just a filter)
    if (debouncedSearchQuery.trim()) {
      if (filteredTrails.length > 0) {
        // Add additional delay before recentering to avoid too frequent updates
        recenterTimeoutRef.current = setTimeout(() => {
          const firstTrail = filteredTrails[0];
          const center = extractTrailCenter(firstTrail);
          if (center) {
            setSearchCenter(center);
            setMapZoom(13); // Zoom in closer when showing search results
          } else {
            setSearchCenter(null);
            setMapZoom(9); // Reset to default zoom
          }
        }, 500); // Additional 500ms delay after debounce
      } else {
        setSearchCenter(null);
        setMapZoom(9); // Reset to default zoom
      }
    } else {
      // Clear search center and zoom when search is cleared (but keep map position for filters)
      setSearchCenter(null);
      // Only reset zoom if there's no active filter
      if (filter === "all") {
        setMapZoom(9); // Reset to default zoom
      }
    }

    return () => {
      if (recenterTimeoutRef.current) {
        clearTimeout(recenterTimeoutRef.current);
      }
    };
  }, [debouncedSearchQuery, filteredTrails, extractTrailCenter, filter]);

  // Get all trails that belong to the same location/trail system
  const getTrailsInLocation = useCallback((trail: Trail): { trails: Trail[]; label: string | null } => {
    // If trail belongs to a trail system, show all trails in that system
    if (trail.trailSystemId && trail.trailSystem?.name) {
      const systemTrails = trails.filter(
        (t) => t.trailSystemId === trail.trailSystemId
      );
      const systemLocation = trail.trailSystem?.location;
      return {
        trails: systemTrails,
        label: systemLocation || trail.trailSystem.name || null,
      };
    }
    
    // Otherwise, if trail has a location, show all trails with that same location
    if (trail.location) {
      const locationTrails = trails.filter(
        (t) => t.location === trail.location
      );
      // If there are multiple trails with this location, show them all
      if (locationTrails.length > 1) {
        return {
          trails: locationTrails,
          label: trail.location,
        };
      }
    }
    
    // Otherwise, just show the clicked trail
    return {
      trails: [trail],
      label: trail.location || null,
    };
  }, [trails]);

  const handleTrailClick = useCallback((trail: Trail) => {
    setSelectedTrailId(trail.id);
    const { trails: locationTrails, label } = getTrailsInLocation(trail);
    setDisplayedTrails(locationTrails);
    setLocationLabel(label);
  }, [getTrailsInLocation]);

  const handleMapTrailClick = useCallback((trail: Trail) => {
    handleTrailClick(trail);
  }, [handleTrailClick]);

  // Handle search/filter selection - when a trail is clicked from the filtered list
  const handleTrailSelect = useCallback((trail: Trail) => {
    handleTrailClick(trail);
    // Scroll to map section on mobile
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      const mapSection = document.getElementById("trail-map-section");
      if (mapSection) {
        mapSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [handleTrailClick]);

  // Clear selection when search is cleared and no filter is active
  // This is handled in the onChange handlers instead to avoid dependency array issues

  return (
    <div className="space-y-8">
      {/* Search and Filter Section */}
      <div className="w-full">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search trails by name or location..."
              value={searchQuery}
              onChange={(e) => {
                const newQuery = e.target.value;
                setSearchQuery(newQuery);
                // Clear debounced value, search center, and zoom immediately if search is cleared
                if (!newQuery.trim()) {
                  setDebouncedSearchQuery("");
                  setSearchCenter(null);
                  setMapZoom(9); // Reset to default zoom
                  if (filter === "all") {
                    setSelectedTrailId(null);
                    setDisplayedTrails([]);
                    setLocationLabel(null);
                  }
                } else {
                  setSelectedTrailId(null);
                }
              }}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            All Trails
            {filteredTrails.length !== trails.length && (
              <span className="text-lg font-normal text-gray-600 ml-2">
                ({filteredTrails.length} {filteredTrails.length === 1 ? 'trail' : 'trails'})
              </span>
            )}
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setFilter("all");
                // Clear selection, search center, and zoom when filter is set to "all" and no search query
                if (!searchQuery.trim()) {
                  setSelectedTrailId(null);
                  setDisplayedTrails([]);
                  setLocationLabel(null);
                  setSearchCenter(null);
                  setMapZoom(9); // Reset to default zoom
                }
              }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                filter === "all"
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("easy")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                filter === "easy"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Easy
            </button>
            <button
              onClick={() => setFilter("intermediate")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                filter === "intermediate"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Intermediate
            </button>
            <button
              onClick={() => setFilter("advanced")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                filter === "advanced"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Advanced
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Map Section */}
        <div id="trail-map-section" className="lg:sticky lg:top-20 lg:self-start">
          <div className="mb-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Trail Map</h2>
            <p className="text-sm text-gray-600">Click on a trail to view details</p>
          </div>
          <TrailMap 
            trails={filter !== "all" ? filteredTrails : trails} 
            highlightedTrailId={selectedTrailId}
            onTrailClick={handleMapTrailClick}
            center={searchCenter ?? userCenter ?? undefined}
            zoom={mapZoom}
          />
        </div>

        {/* Trail Cards Section */}
        <div>
          {/* Show search results list when there's a search query or filter, but no selection */}
          {(debouncedSearchQuery.trim() || filter !== "all") && displayedTrails.length === 0 && filteredTrails.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Search Results ({filteredTrails.length} {filteredTrails.length === 1 ? 'trail' : 'trails'})
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {filteredTrails.map((trail) => (
                  <button
                    key={trail.id}
                    onClick={() => handleTrailSelect(trail)}
                    className="text-left bg-white rounded-xl border border-gray-200 p-4 hover:border-emerald-300 hover:shadow-lg transition-all group focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors mb-1">
                          {trail.name}
                        </h4>
                        {trail.location && (
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {trail.location}
                          </p>
                        )}
                      </div>
                      {trail.difficulty && (
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                            difficultyColors[trail.difficulty as keyof typeof difficultyColors] ||
                            "bg-gray-100 text-gray-700 border-gray-200"
                          }`}
                        >
                          {trail.difficulty}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {displayedTrails.length > 0 ? (
            <div>
              {locationLabel && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {locationLabel}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {displayedTrails.length} {displayedTrails.length === 1 ? 'trail' : 'trails'} in this location
                  </p>
                </div>
              )}
              <div className="space-y-4">
                {displayedTrails.map((trail) => (
                  <Link
                    key={trail.id}
                    href={`/trails/${trail.id}`}
                    onClick={() => handleTrailSelect(trail)}
                    className="block bg-white rounded-xl border border-gray-200 p-6 hover:border-emerald-300 hover:shadow-lg transition-all group focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2 focus-within:outline-none"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors mb-2">
                          {trail.name}
                        </h3>
                        {trail.location && trail.location !== locationLabel && (
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {trail.location}
                          </p>
                        )}
                      </div>
                      {trail.difficulty && (
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                            difficultyColors[trail.difficulty as keyof typeof difficultyColors] ||
                            "bg-gray-100 text-gray-700 border-gray-200"
                          }`}
                        >
                          {trail.difficulty}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                      {trail.distanceKm && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Distance</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatDistanceValue(trail.distanceKm)} miles
                          </p>
                        </div>
                      )}
                      {trail.elevationGainM && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Elevation Gain</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatElevationValue(trail.elevationGainM)} feet
                          </p>
                        </div>
                      )}
                      {trail.elevationLossM && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Elevation Loss</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatElevationValue(trail.elevationLossM)} feet
                          </p>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <svg
                className="w-16 h-16 mx-auto text-gray-300 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              <p className="text-gray-700 text-lg mb-2">No trail selected</p>
              <p className="text-gray-500 text-sm">
                {searchQuery.trim() || filter !== "all" 
                  ? "Search or filter to find trails, or click on a trail on the map"
                  : "Click on a trail on the map or search to view details"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

