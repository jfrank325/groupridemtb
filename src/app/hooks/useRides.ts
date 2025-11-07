"use client";

import { useState, useEffect } from "react";

export type Ride = {
  id: string;
  date: string;
  notes: string | null;
  name: string | null;
  createdAt: string;
  isExample: boolean;
  trailIds: string[];
  trailNames: string[];
  trailSystems: string[];
  difficulties: string[];
  totalDistanceKm: number;
  lat: number;
  lng: number;
  attendees: { id: string; name: string }[];
  host?: { id: string; name: string };
};

export function useRides(initialData?: Ride[]) {
  const [rides, setRides] = useState<Ride[]>(initialData || []);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If we have server-provided initial data, skip fetching
    if (initialData) return;

    async function fetchRides() {
      try {
        const res = await fetch("/api/rides");
        if (!res.ok) throw new Error("Failed to fetch rides");
        const data: Ride[] = await res.json();
        setRides(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchRides();
  }, [initialData]);

  return { rides, loading, error, setRides };
}
