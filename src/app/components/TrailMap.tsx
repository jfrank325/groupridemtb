"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { prisma } from "@/lib/prisma";
import { useTrails, type Trail } from "../hooks/useTrails";

export default function TrailMap({ trails }: { trails: Trail[] }) {


  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;

  useEffect(() => {
    if (!mapContainer.current || mapRef.current || !maptilerKey) return;
console.log("Initializing map with trails:", trails);
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/outdoor/style.json?key=${maptilerKey}`,
      center: [-84.6, 33.8],
      zoom: 10,
    });

    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      // Combine all trails into one GeoJSON source for better performance
      const geojson: GeoJSON.FeatureCollection<GeoJSON.LineString, GeoJSON.GeoJsonProperties> = {
        type: "FeatureCollection",
        features: trails.map((trail) => ({
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: trail.coordinates as unknown as GeoJSON.Position[],
          },
          properties: {
            id: trail.id,
            name: trail.name,
            difficulty: trail.difficulty || "Unknown",
          },
        })),
      };

      map.addSource("trails", {
        type: "geojson",
        data: geojson,
      });

      map.addLayer({
        id: "trail-lines",
        type: "line",
        source: "trails",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": [
            "match",
            ["get", "difficulty"],
            "Easy", "#4CAF50",
            "Intermediate", "#FFC107",
            "Advanced", "#F44336",
            "#0070f3",
          ],
          "line-width": 3,
        },
      });

      // Popup on click
      map.on("click", "trail-lines", (e) => {
        const feature = e.features?.[0];
        if (!feature || feature.geometry?.type !== "LineString") return;

        const coordinates = (feature.geometry as any).coordinates[Math.floor((feature.geometry as any).coordinates.length / 2)];
        const { name, difficulty } = feature.properties as any;

        new maplibregl.Popup()
          .setLngLat(coordinates)
          .setHTML(
            `<strong>${name}</strong><br/>Difficulty: ${difficulty}<br/><button id="joinRideBtn" style="margin-top:5px;padding:4px 8px;border-radius:4px;background:#0070f3;color:white;border:none;cursor:pointer;">Join Ride</button>`
          )
          .addTo(map);
      });

      // Cursor change on hover
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
    <div
      ref={mapContainer}
      className="w-full h-[600px] rounded-xl shadow-md relative"
    >
      {/* Attribution overlay */}
      <div className="absolute bottom-2 left-2 text-xs text-gray-600 bg-white/80 px-2 py-1 rounded">
        © MapTiler © OpenStreetMap contributors
      </div>
    </div>
  );
}
