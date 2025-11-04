"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { type Trail } from "../hooks/useTrails";
import TrailPopup from "./TrailPopup";

interface TrailMapProps {
  trails: Trail[];
  highlightedTrailId?: string | null;
  onTrailHover?: (trailId: string | null) => void;
}

export default function TrailMap({ trails, highlightedTrailId, onTrailHover }: TrailMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onTrailHoverRef = useRef(onTrailHover);
  const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;

  const [selectedTrail, setSelectedTrail] = useState<Partial<Trail> | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [trailCoordinates, setTrailCoordinates] = useState<Map<string, [number, number][]>>(new Map());
  const [loadingCoordinates, setLoadingCoordinates] = useState(false);

  // Keep the ref updated with the latest callback
  useEffect(() => {
    onTrailHoverRef.current = onTrailHover;
  }, [onTrailHover]);

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

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/outdoor/style.json?key=${maptilerKey}`,
      center: [-84.389, 33.75],
      zoom: 9,
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
            "Beginner", "#4CAF50",
            "Intermediate", "#0070f3",
            "Advanced", "#000",
            "#0070f3",
          ],
          "line-width": 3,
          "line-opacity": 1,
        },
      });

      // ✅ Replace popup with React state handler
      map.on("click", "trail-lines", (e) => {
        const feature = e.features?.[0];
        if (!feature) return;

        const coords = (feature.geometry as any).coordinates;
        const midpoint = coords[Math.floor(coords.length / 2)];
        const [lng, lat] = midpoint;

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
        if (feature && onTrailHoverRef.current) {
          const trailId = feature.properties?.id;
          if (trailId) {
            onTrailHoverRef.current(trailId);
          }
        }
      });
      
      map.on("mouseleave", "trail-lines", () => {
        map.getCanvas().style.cursor = "";
        if (onTrailHoverRef.current) {
          onTrailHoverRef.current(null);
        }
      });

      setIsMapLoaded(true);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setIsMapLoaded(false);
    };
  }, [trails, maptilerKey]);

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
        6,
        3,
      ]);

      map.setPaintProperty("trail-lines", "line-opacity", [
        "case",
        ["==", ["get", "id"], highlightId],
        1,
        ["!=", highlightId, ""],
        0.3,
        1,
      ]);
    } catch (error) {
      console.error("Error updating map paint properties:", error);
    }
  }, [highlightedTrailId, isMapLoaded]);

  return (
    <div className="relative w-full h-[600px] rounded-xl shadow-md">
      <div ref={mapContainer} className="w-full h-full" />
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
