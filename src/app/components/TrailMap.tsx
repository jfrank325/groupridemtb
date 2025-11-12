"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { type Trail } from "../hooks/useTrails";
import TrailPopup from "./TrailPopup";
import TrailHoverPopup from "./TrailHoverPopup";

interface TrailMapProps {
  trails: Trail[];
  highlightedTrailId?: string | null;
  onTrailHover?: (trailId: string | null) => void;
  onTrailClick?: (trail: Trail) => void;
  center?: [number, number];
  zoom?: number;
}

export default function TrailMap({ trails, highlightedTrailId, onTrailHover, onTrailClick, center, zoom }: TrailMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onTrailHoverRef = useRef(onTrailHover);
  const onTrailClickRef = useRef(onTrailClick);
  const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;

  const [selectedTrail, setSelectedTrail] = useState<Partial<Trail> | null>(null);
  const [hoveredTrail, setHoveredTrail] = useState<Trail | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [trailCoordinates, setTrailCoordinates] = useState<Map<string, [number, number][]>>(new Map());
  const [loadingCoordinates, setLoadingCoordinates] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const isTouchDeviceRef = useRef(false);

  // Keep the refs updated with the latest callbacks
  useEffect(() => {
    onTrailHoverRef.current = onTrailHover;
  }, [onTrailHover]);

  useEffect(() => {
    onTrailClickRef.current = onTrailClick;
  }, [onTrailClick]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(pointer: coarse)");
    const updateMatches = (matches: boolean) => {
      setIsTouchDevice(matches);
      isTouchDeviceRef.current = matches;
    };

    updateMatches(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => updateMatches(event.matches);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }

    mediaQuery.addListener(listener);
    return () => mediaQuery.removeListener(listener);
  }, []);

  // Fetch coordinates from MTB Projects API for trails that need them
  useEffect(() => {
    async function fetchTrailCoordinates() {
      if (loadingCoordinates) return;
      
      const trailsToFetch = trails.filter(trail => {
        // Fetch coordinates if:
        // 1. Trail doesn't have coordinates in DB, or
        // 2. Coordinates are null/empty
        const hasCoordinates = trail.coordinates && 
          (Array.isArray(trail.coordinates) ? trail.coordinates.length > 0 : true);
        return !hasCoordinates && !trailCoordinates.has(trail.id);
      });

      if (trailsToFetch.length === 0) return;

      setLoadingCoordinates(true);
      
      try {
        const coordinatePromises = trailsToFetch.map(async (trail) => {
          try {
            const res = await fetch(`/api/trails/${trail.id}/coordinates`);
            if (res.ok) {
              const data = await res.json();
              if (data.coordinates && Array.isArray(data.coordinates) && data.coordinates.length > 0) {
                return { trailId: trail.id, coordinates: data.coordinates };
              }
            }
          } catch (error) {
            console.error(`Failed to fetch coordinates for trail ${trail.id}:`, error);
          }
          return null;
        });

        const results = await Promise.all(coordinatePromises);
        const newCoordinates = new Map(trailCoordinates);
        
        results.forEach((result) => {
          if (result) {
            newCoordinates.set(result.trailId, result.coordinates);
          }
        });

        setTrailCoordinates(newCoordinates);
      } catch (error) {
        console.error("Error fetching trail coordinates:", error);
      } finally {
        setLoadingCoordinates(false);
      }
    }

    fetchTrailCoordinates();
  }, [trails, trailCoordinates, loadingCoordinates]);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current || !maptilerKey) return;

    const initialCenter = center ?? [-84.389, 33.75];
    const initialZoom = zoom ?? 9;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/outdoor/style.json?key=${maptilerKey}`,
      center: initialCenter,
      zoom: initialZoom,
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      const features: GeoJSON.Feature<GeoJSON.LineString>[] = trails
        .map((trail) => {
          // Use API coordinates if available, otherwise use DB coordinates
          let coordinates: [number, number][] | null = null;
          
          if (trailCoordinates.has(trail.id)) {
            coordinates = trailCoordinates.get(trail.id)!;
          } else if (trail.coordinates) {
            coordinates = trail.coordinates as unknown as [number, number][];
          }

          // Only include trail if it has coordinates
          if (!coordinates || coordinates.length === 0) {
            return null;
          }

          // Convert to Position[] format (GeoJSON standard)
          const positions: GeoJSON.Position[] = coordinates.map(coord => [coord[0], coord[1]]);

          return {
            type: "Feature" as const,
            geometry: {
              type: "LineString" as const,
              coordinates: positions,
            } as GeoJSON.LineString,
            properties: {
              id: trail.id,
              name: trail.name,
              difficulty: trail.difficulty || "Unknown",
            } as GeoJSON.GeoJsonProperties,
          };
        })
        .filter((feature): feature is GeoJSON.Feature<GeoJSON.LineString> => feature !== null);

      const geojson: GeoJSON.FeatureCollection<GeoJSON.LineString> = {
        type: "FeatureCollection",
        features,
      };

      map.addSource("trails", { type: "geojson", data: geojson });

      map.addLayer({
        id: "trail-lines",
        type: "line",
        source: "trails",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": [
            "match",
            ["get", "difficulty"],
            "Easy", "#4CAF50",
            "Intermediate", "#0070f3",
            "Advanced", "#000",
            "#0070f3",
          ],
          "line-width": 2,
          "line-opacity": 1,
        },
      });

      // ✅ Replace popup with React state handler
      map.on("click", "trail-lines", (e) => {
        const feature = e.features?.[0];
        if (!feature) return;

        const trailId = feature.properties?.id;
        const trail = trails.find((t) => t.id === trailId);
        if (!trail) return;

        // Clear pending hover timers
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = null;
        }
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = null;
        }

        // Call onTrailClick callback if provided
        if (onTrailClickRef.current) {
          onTrailClickRef.current(trail);
        }

        if (isTouchDeviceRef.current) {
          setSelectedTrail(null);
          setHoverPosition({ x: e.point.x, y: e.point.y });
          setHoveredTrail(trail);
          if (onTrailHoverRef.current) {
            onTrailHoverRef.current(trailId ?? null);
          }
          return;
        }

        const coords = (feature.geometry as any).coordinates;
        const midpoint = coords[Math.floor(coords.length / 2)];
        const [lng, lat] = midpoint;

        setHoveredTrail(null);
        setHoverPosition(null);

        setSelectedTrail({
          id: feature.properties?.id,
          name: feature.properties?.name,
          difficulty: feature.properties?.difficulty,
          coordinates: [[lng, lat]],
        });
      });

      map.on("mouseenter", "trail-lines", (e) => {
        map.getCanvas().style.cursor = "pointer";
        const feature = e.features?.[0];
        if (feature) {
          const trailId = feature.properties?.id;
          if (trailId && onTrailHoverRef.current) {
            onTrailHoverRef.current(trailId);
          }
          
          // Clear any existing hide timeout
          if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
          }
          
          // Find the full trail object and set hover state with delay
          const trail = trails.find(t => t.id === trailId);
          if (trail) {
            // Clear any existing show timeout
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
            }
            
            // Show popup after a short delay (300ms)
            hoverTimeoutRef.current = setTimeout(() => {
              setHoverPosition({
                x: e.point.x,
                y: e.point.y,
              });
              setHoveredTrail(trail);
            }, 100);
          }
        }
      });
      
      map.on("mousemove", "trail-lines", (e) => {
        // Update hover position as mouse moves
        if (hoveredTrail) {
          setHoverPosition({
            x: e.point.x,
            y: e.point.y,
          });
        }
      });
      
      map.on("mouseleave", "trail-lines", () => {
        map.getCanvas().style.cursor = "";
        
        // Clear any pending show timeout
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = null;
        }
        
        // Hide popup after a short delay (200ms) to allow moving mouse to popup
        hideTimeoutRef.current = setTimeout(() => {
          setHoveredTrail(null);
          setHoverPosition(null);
          if (onTrailHoverRef.current) {
            onTrailHoverRef.current(null);
          }
        }, 200);
      });

      setIsMapLoaded(true);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setIsMapLoaded(false);
      // Clean up timeouts
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };
  }, [trails, maptilerKey, center]);

  // Update map source when coordinates are fetched
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;

    const map = mapRef.current;
    if (!map.getSource("trails")) return;

    const features: GeoJSON.Feature<GeoJSON.LineString>[] = trails
      .map((trail) => {
        let coordinates: [number, number][] | null = null;
        
        if (trailCoordinates.has(trail.id)) {
          coordinates = trailCoordinates.get(trail.id)!;
        } else if (trail.coordinates) {
          coordinates = trail.coordinates as unknown as [number, number][];
        }

        if (!coordinates || coordinates.length === 0) {
          return null;
        }

        // Convert to Position[] format (GeoJSON standard)
        const positions: GeoJSON.Position[] = coordinates.map(coord => [coord[0], coord[1]]);

        return {
          type: "Feature" as const,
          geometry: {
            type: "LineString" as const,
            coordinates: positions,
          } as GeoJSON.LineString,
          properties: {
            id: trail.id,
            name: trail.name,
            difficulty: trail.difficulty || "Unknown",
          } as GeoJSON.GeoJsonProperties,
        };
      })
      .filter((feature): feature is GeoJSON.Feature<GeoJSON.LineString> => feature !== null);

    const geojson: GeoJSON.FeatureCollection<GeoJSON.LineString> = {
      type: "FeatureCollection",
      features,
    };

    try {
      (map.getSource("trails") as maplibregl.GeoJSONSource).setData(geojson);
    } catch (error) {
      console.error("Error updating map source:", error);
    }
  }, [trailCoordinates, trails, isMapLoaded]);

  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;
    const map = mapRef.current;
    if (!map.loaded()) return;

    // If center is provided, animate to it
    if (center) {
      map.easeTo({
        center,
        zoom: zoom ?? 9, // Use provided zoom or default to 9
        duration: 800,
      });
    } else if (zoom !== undefined) {
      // If only zoom changes without center, just update zoom
      map.easeTo({
        zoom: zoom,
        duration: 800,
      });
    }
  }, [center, zoom, isMapLoaded]);

  // Update map styling when highlightedTrailId changes
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;

    const map = mapRef.current;
    
    // Check if map is loaded and layer exists
    if (!map.loaded() || !map.getLayer("trail-lines")) return;

    const highlightId = highlightedTrailId || "";

    try {
      map.setPaintProperty("trail-lines", "line-width", [
        "case",
        ["==", ["get", "id"], highlightId],
        4,
        3,
      ]);

      map.setPaintProperty("trail-lines", "line-opacity", [
        "case",
        ["==", ["get", "id"], highlightId],
        1,
        ["!=", highlightId, ""],
        0.5,
        1,
      ]);
    } catch (error) {
      console.error("Error updating map paint properties:", error);
    }
  }, [highlightedTrailId, isMapLoaded]);

  const handleShowMore = (trail: Trail) => {
    // Clear any pending timeouts
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setHoveredTrail(null);
    setHoverPosition(null);
    setSelectedTrail(trail);
  };

  const handleHoverPopupMouseEnter = () => {
    // Cancel hide timeout when mouse enters the popup
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const handleHoverPopupMouseLeave = () => {
    // Hide popup after a short delay when mouse leaves
    hideTimeoutRef.current = setTimeout(() => {
      setHoveredTrail(null);
      setHoverPosition(null);
      if (onTrailHoverRef.current) {
        onTrailHoverRef.current(null);
      }
    }, 200);
  };

  return (
    <div className="relative w-full h-[600px] rounded-xl shadow-md">
      <div ref={mapContainer} className="w-full h-full" />
      {hoveredTrail && hoverPosition && (
        <div
          className="absolute z-20 pointer-events-none"
          style={{
            left: `${hoverPosition.x}px`,
            top: `${hoverPosition.y}px`,
            transform: 'translate(-50%, -100%)',
            marginTop: '-8px',
          }}
        >
          <div className="pointer-events-auto">
            <TrailHoverPopup
              trail={hoveredTrail}
              onShowMore={isTouchDevice ? undefined : () => handleShowMore(hoveredTrail)}
              onMouseEnter={handleHoverPopupMouseEnter}
              onMouseLeave={handleHoverPopupMouseLeave}
              linkHref={isTouchDevice ? `/trails/${hoveredTrail.id}` : undefined}
            />
          </div>
        </div>
      )}
      {selectedTrail && (
        <TrailPopup
          trail={selectedTrail}
          map={mapRef.current}
          onClose={() => setSelectedTrail(null)}
        />
      )}
      <div className="absolute bottom-2 left-2 text-xs text-gray-600 bg-white/80 px-2 py-1 rounded">
        © MapTiler © OpenStreetMap contributors
      </div>
    </div>
  );
}
