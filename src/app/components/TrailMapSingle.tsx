"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { type Trail } from "../hooks/useTrails";

interface TrailMapSingleProps {
  trail: Trail;
}

export default function TrailMapSingle({ trail }: TrailMapSingleProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current || !maptilerKey) return;

    // Get center coordinates - use lat/lng if available, otherwise use first coordinate
    let centerLat = 33.8; // Default center (Atlanta area)
    let centerLng = -84.6;

    if (trail.lat && trail.lng) {
      centerLat = trail.lat;
      centerLng = trail.lng;
    } else if (trail.coordinates && Array.isArray(trail.coordinates)) {
      // Try to extract coordinates from the trail data
      const coords = trail.coordinates as number[][];
      if (coords.length > 0 && Array.isArray(coords[0]) && coords[0].length >= 2) {
        const firstCoord = coords[0];
        centerLng = firstCoord[0];
        centerLat = firstCoord[1];
      }
    }

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${maptilerKey}`,
      center: [centerLng, centerLat],
      zoom: 13,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      // Create GeoJSON feature for the trail
      if (trail.coordinates && Array.isArray(trail.coordinates) && trail.coordinates.length > 0) {
        const coords = trail.coordinates as number[][];
        
        // Ensure coordinates are in the correct format [lng, lat]
        const formattedCoords = coords.map((coord) => {
          if (Array.isArray(coord) && coord.length >= 2) {
            return [coord[0], coord[1]] as [number, number];
          }
          return [centerLng, centerLat] as [number, number];
        });

        const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
          type: "Feature",
          properties: {
            id: trail.id,
            name: trail.name,
            difficulty: trail.difficulty || "Unknown",
          },
          geometry: {
            type: "LineString",
            coordinates: formattedCoords,
          },
        };

        map.addSource("trail", {
          type: "geojson",
          data: geojson,
        });

        map.addLayer({
          id: "trail-line",
          type: "line",
          source: "trail",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": (() => {
              switch (trail.difficulty) {
                case "Easy":
                case "Beginner":
                  return "#4CAF50";
                case "Intermediate":
                  return "#0070f3";
                case "Advanced":
                  return "#000";
                default:
                  return "#0070f3";
              }
            })(),
            "line-width": 4,
            "line-opacity": 0.8,
          },
        });

        // Fit map to trail bounds
        if (formattedCoords.length > 0) {
          const bounds = formattedCoords.reduce(
            (bounds, coord) => {
              return bounds.extend(coord as maplibregl.LngLatLike);
            },
            new maplibregl.LngLatBounds(formattedCoords[0] as maplibregl.LngLatLike, formattedCoords[0] as maplibregl.LngLatLike)
          );

          map.fitBounds(bounds, {
            padding: { top: 50, bottom: 50, left: 50, right: 50 },
            maxZoom: 15,
          });
        }
      } else {
        // If no coordinates, just show a marker at the location
        new maplibregl.Marker({ color: "#10b981" })
          .setLngLat([centerLng, centerLat])
          .setPopup(
            new maplibregl.Popup().setHTML(`<strong>${trail.name}</strong>`)
          )
          .addTo(map);
      }

      setIsMapLoaded(true);
    });

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setIsMapLoaded(false);
    };
  }, [trail, maptilerKey]);

  if (!maptilerKey) {
    return (
      <div className="w-full h-[400px] rounded-xl border border-gray-200 bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Map not available. Please configure MapTiler API key.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[400px] rounded-xl shadow-md overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />
      <div className="absolute bottom-2 left-2 text-xs text-gray-600 bg-white/80 px-2 py-1 rounded">
        © MapTiler © OpenStreetMap contributors
      </div>
    </div>
  );
}
