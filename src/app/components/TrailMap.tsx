"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { type Trail } from "../hooks/useTrails";
import TrailPopup from "./TrailPopup";

export default function TrailMap({ trails }: { trails: Trail[] }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;

  const [selectedTrail, setSelectedTrail] = useState<Partial<Trail> | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current || !maptilerKey) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/outdoor/style.json?key=${maptilerKey}`,
      center: [-84.6, 33.8],
      zoom: 10,
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      const geojson: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: trails.map((trail) => ({
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: (trail.coordinates as unknown as [number, number][]),
          },
          properties: {
            id: trail.id,
            name: trail.name,
            difficulty: trail.difficulty || "Unknown",
          },
        })),
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
            "Advanced", "#F44336",
            "#0070f3",
          ],
          "line-width": 3,
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

      map.on("mouseenter", "trail-lines", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "trail-lines", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    return () => {
      map.remove();
    };
  }, [trails, maptilerKey]);

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
