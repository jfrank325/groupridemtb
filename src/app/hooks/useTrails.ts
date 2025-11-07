"use client";

import type { Geometry, LineString } from "geojson";
import { useState, useEffect } from "react";

export type Trail = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  location: string | null;
  difficulty: string | null;
  distanceKm: number | null;
  elevationGainM: number | null;
  elevationLossM: number | null;
  description: string | null;
  trailSystemId: string | null;
  trailSystem?: {
    id?: string | null;
    name: string | null;
  } | null;
  lat: number | null;
  lng: number | null;
  coordinates: Geometry | Number[][] | null;
};

export function useTrails(initialData?: Trail[]) {
  const [trails, setTrails] = useState<Trail[]>(initialData || []);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If we have server-provided initial data, skip fetching
    if (initialData) return;

    async function fetchTrails() {
      try {
        const res = await fetch("/api/trails");
        if (!res.ok) throw new Error("Failed to fetch trails");
        const data: Trail[] = await res.json();
        setTrails(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTrails();
  }, [initialData]);

  return { trails, loading, error, setTrails };
}
