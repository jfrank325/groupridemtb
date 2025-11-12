"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { type Trail } from "../hooks/useTrails";
import TrailHoverPopup from "./TrailHoverPopup";

interface TrailMapSingleProps {
  trail: Trail;
  relatedTrails?: Trail[];
  highlightedTrailId?: string;
  onTrailHover?: (trailId: string | null) => void;
}

export default function TrailMapSingle({ trail, relatedTrails = [], highlightedTrailId, onTrailHover }: TrailMapSingleProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [hoveredTrail, setHoveredTrail] = useState<Trail | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      // Combine all trails (current + related)
      const allTrails = [trail, ...relatedTrails];
      const highlightId = highlightedTrailId || trail.id;
      
      // Create GeoJSON features for all trails
      const features: GeoJSON.Feature<GeoJSON.LineString>[] = [];
      let allBounds: maplibregl.LngLatBounds | null = null;

      allTrails.forEach((t) => {
        if (t.coordinates && Array.isArray(t.coordinates) && t.coordinates.length > 0) {
          const coords = t.coordinates as number[][];
          
          // Ensure coordinates are in the correct format [lng, lat]
          const formattedCoords = coords.map((coord) => {
            if (Array.isArray(coord) && coord.length >= 2) {
              return [coord[0], coord[1]] as [number, number];
            }
            return [centerLng, centerLat] as [number, number];
          });

          features.push({
            type: "Feature",
            properties: {
              id: t.id,
              name: t.name,
              difficulty: t.difficulty || "Unknown",
              isHighlighted: t.id === highlightId,
            },
            geometry: {
              type: "LineString",
              coordinates: formattedCoords,
            },
          });

          // Calculate bounds
          if (formattedCoords.length > 0) {
            const trailBounds = formattedCoords.reduce(
              (bounds, coord) => {
                return bounds.extend(coord as maplibregl.LngLatLike);
              },
              new maplibregl.LngLatBounds(formattedCoords[0] as maplibregl.LngLatLike, formattedCoords[0] as maplibregl.LngLatLike)
            );

            if (!allBounds) {
              allBounds = trailBounds;
            } else {
              allBounds.extend(trailBounds);
            }
          }
        }
      });

      if (features.length > 0) {
        const geojson: GeoJSON.FeatureCollection<GeoJSON.LineString> = {
          type: "FeatureCollection",
          features,
        };

        map.addSource("trails", {
          type: "geojson",
          data: geojson,
        });

        // Add layer for non-highlighted trails first (so highlighted appears on top)
        map.addLayer({
          id: "trail-lines",
          type: "line",
          source: "trails",
          filter: ["!=", ["get", "isHighlighted"], true],
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": [
              "match",
              ["get", "difficulty"],
              "Easy", "#4CAF50",
              "Intermediate", "#0070f3",
              "Advanced", "#000",
              "#0070f3",
            ],
            "line-width": 3,
            "line-opacity": 0.6,
          },
        });

        // Add layer for highlighted trail (thicker, brighter, emerald color)
        map.addLayer({
          id: "trail-line-highlighted",
          type: "line",
          source: "trails",
          filter: ["==", ["get", "isHighlighted"], true],
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#10b981", // Emerald color
            "line-width": 6,
            "line-opacity": 1,
          },
        });

        // Fit map to all trails bounds
        if (allBounds) {
          map.fitBounds(allBounds, {
            padding: { top: 50, bottom: 50, left: 50, right: 50 },
            maxZoom: 15,
          });
        }

        // Add hover event handlers
        const allTrailsList = [trail, ...relatedTrails];

        map.on("mouseenter", "trail-lines", (e) => {
          map.getCanvas().style.cursor = "pointer";
          const feature = e.features?.[0];
          if (feature) {
            const trailId = feature.properties?.id;
            if (trailId && onTrailHover) {
              onTrailHover(trailId);
            }

            // Clear any existing hide timeout
            if (hideTimeoutRef.current) {
              clearTimeout(hideTimeoutRef.current);
              hideTimeoutRef.current = null;
            }

            // Find the full trail object and set hover state with delay
            const hoveredTrailObj = allTrailsList.find((t) => t.id === trailId);
            if (hoveredTrailObj) {
              // Clear any existing show timeout
              if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
              }

              // Show popup after a short delay (100ms)
              hoverTimeoutRef.current = setTimeout(() => {
                setHoverPosition({
                  x: e.point.x,
                  y: e.point.y,
                });
                setHoveredTrail(hoveredTrailObj);
              }, 100);
            }
          }
        });

        map.on("mouseenter", "trail-line-highlighted", (e) => {
          map.getCanvas().style.cursor = "pointer";
          const feature = e.features?.[0];
          if (feature) {
            const trailId = feature.properties?.id;
            if (trailId && onTrailHover) {
              onTrailHover(trailId);
            }

            // Clear any existing hide timeout
            if (hideTimeoutRef.current) {
              clearTimeout(hideTimeoutRef.current);
              hideTimeoutRef.current = null;
            }

            // Find the full trail object and set hover state with delay
            const hoveredTrailObj = allTrailsList.find((t) => t.id === trailId);
            if (hoveredTrailObj) {
              // Clear any existing show timeout
              if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
              }

              // Show popup after a short delay (100ms)
              hoverTimeoutRef.current = setTimeout(() => {
                setHoverPosition({
                  x: e.point.x,
                  y: e.point.y,
                });
                setHoveredTrail(hoveredTrailObj);
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

        map.on("mousemove", "trail-line-highlighted", (e) => {
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
            if (onTrailHover) {
              onTrailHover(null);
            }
          }, 200);
        });

        map.on("mouseleave", "trail-line-highlighted", () => {
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
            if (onTrailHover) {
              onTrailHover(null);
            }
          }, 200);
        });
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
      // Clean up timeouts
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [trail, maptilerKey]);

  // Update map when relatedTrails changes
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;

    const map = mapRef.current;
    const allTrails = [trail, ...relatedTrails];
    const highlightId = highlightedTrailId || trail.id;

    // Create GeoJSON features for all trails
    const features: GeoJSON.Feature<GeoJSON.LineString>[] = [];
    let allBounds: maplibregl.LngLatBounds | null = null;

    allTrails.forEach((t) => {
      if (t.coordinates && Array.isArray(t.coordinates) && t.coordinates.length > 0) {
        const coords = t.coordinates as number[][];
        
        const formattedCoords = coords.map((coord) => {
          if (Array.isArray(coord) && coord.length >= 2) {
            return [coord[0], coord[1]] as [number, number];
          }
          return [-84.6, 33.8] as [number, number];
        });

        features.push({
          type: "Feature",
          properties: {
            id: t.id,
            name: t.name,
            difficulty: t.difficulty || "Unknown",
            isHighlighted: t.id === highlightId,
          },
          geometry: {
            type: "LineString",
            coordinates: formattedCoords,
          },
        });

        if (formattedCoords.length > 0) {
          const trailBounds = formattedCoords.reduce(
            (bounds, coord) => {
              return bounds.extend(coord as maplibregl.LngLatLike);
            },
            new maplibregl.LngLatBounds(formattedCoords[0] as maplibregl.LngLatLike, formattedCoords[0] as maplibregl.LngLatLike)
          );

          if (!allBounds) {
            allBounds = trailBounds;
          } else {
            allBounds.extend(trailBounds);
          }
        }
      }
    });

    if (features.length > 0 && map.getSource("trails")) {
      const geojson: GeoJSON.FeatureCollection<GeoJSON.LineString> = {
        type: "FeatureCollection",
        features,
      };

      (map.getSource("trails") as maplibregl.GeoJSONSource).setData(geojson);

      // Update bounds if we have them
      if (allBounds) {
        map.fitBounds(allBounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          maxZoom: 15,
        });
      }
    }
  }, [trail, relatedTrails, isMapLoaded]);

  // Update highlighting when highlightedTrailId changes
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;

    const map = mapRef.current;
    const highlightId = highlightedTrailId || trail.id;

    // Update the filter for highlighted trail
    if (map.getLayer("trail-line-highlighted")) {
      map.setFilter("trail-line-highlighted", ["==", ["get", "id"], highlightId]);
    }
    if (map.getLayer("trail-lines")) {
      map.setFilter("trail-lines", ["!=", ["get", "id"], highlightId]);
    }
  }, [highlightedTrailId, trail.id, isMapLoaded]);

  if (!maptilerKey) {
    return (
      <div className="w-full h-[400px] rounded-xl border border-gray-200 bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Map not available. Please configure MapTiler API key.</p>
      </div>
    );
  }

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
    // Navigate to trail page
    window.location.href = `/trails/${trail.id}`;
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
      if (onTrailHover) {
        onTrailHover(null);
      }
    }, 200);
  };

  return (
    <div className="relative w-full h-[400px] rounded-xl shadow-md overflow-hidden">
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
              onShowMore={() => handleShowMore(hoveredTrail)}
              onMouseEnter={handleHoverPopupMouseEnter}
              onMouseLeave={handleHoverPopupMouseLeave}
            />
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 text-xs text-gray-600 bg-white/80 px-2 py-1 rounded">
        © MapTiler © OpenStreetMap contributors
      </div>
    </div>
  );
}
