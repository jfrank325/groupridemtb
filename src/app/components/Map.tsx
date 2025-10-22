"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState } from "react";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

type Trail = {
  id: string;
  name: string;
  trailSystem: string;
  lat: number;
  lng: number;
  hasGroupRide: boolean;
  nextRideDate?: string | null;
  difficulty?: string | null;
  distanceKm?: number | null;
};

export default function TrailMap() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [trails, setTrails] = useState<Trail[]>([]);
  const [selected, setSelected] = useState<Trail | null>(null);

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [-84.5, 33.9], // Atlanta area
      zoom: 9,
    });

    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Fetch trails from API
    fetch("/api/trails")
      .then((res) => res.json())
      .then((data: Trail[]) => setTrails(data))
      .catch((err) => console.error(err));

    return () => map.remove();
  }, []);

  // Add markers once trails load
  useEffect(() => {
    const map = mapRef.current;
    if (!map || trails.length === 0) return;

    trails.forEach((trail) => {
      const marker = new mapboxgl.Marker({
        color: trail.hasGroupRide ? "red" : "blue",
      })
        .setLngLat([trail.lng, trail.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="font-family: sans-serif; min-width: 180px;">
              <h3>${trail.name}</h3>
              <p><strong>System:</strong> ${trail.trailSystem}</p>
              <p>${trail.difficulty ? `Difficulty: ${trail.difficulty}<br>` : ""}
                 ${trail.distanceKm ? `Distance: ${trail.distanceKm} km<br>` : ""}
                 ${trail.hasGroupRide ? "🚴 Group ride available!" : "No rides yet"}
              </p>
            </div>
          `)
        )
        .addTo(map);

      marker.getElement().addEventListener("click", () => setSelected(trail));
    });
  }, [trails]);

  return (
    <div className="relative w-full h-[90vh]">
      <div ref={mapContainer} className="w-full h-full rounded-lg shadow-md" />

      {selected && (
        <div className="absolute bottom-4 left-4 bg-white shadow-lg rounded-xl p-4 w-80 border border-gray-200">
          <h2 className="text-xl font-semibold">{selected.name}</h2>
          <p className="text-gray-600">{selected.trailSystem}</p>
          {selected.difficulty && <p>Difficulty: {selected.difficulty}</p>}
          {selected.distanceKm && <p>Distance: {selected.distanceKm} km</p>}
          {selected.hasGroupRide ? (
            <p className="text-green-700 font-medium mt-2">
              🚴 Upcoming Group Ride:{" "}
              {selected.nextRideDate
                ? new Date(selected.nextRideDate).toLocaleDateString()
                : "TBD"}
            </p>
          ) : (
            <p className="text-gray-500 mt-2">No group rides yet</p>
          )}
          <button
            className="mt-3 px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            onClick={() => setSelected(null)}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
