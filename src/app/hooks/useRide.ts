"use client";

import { useState, useEffect } from "react";

export type Ride = {
  id: string;
  date: string;
  notes: string | null;
  name: string | null;
  trailIds: string[];
  trailNames: string[];
  // trailSystems: string[];
  difficulties: string[];
  totalDistanceKm: number;
  lat: number;
  lng: number;
  attendees: { id: string; name: string }[];
};

export function useRide(rideId: string) {
  const [ride, setRide] = useState<Ride>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {

    async function fetchRide() {
      try {
        const res = await fetch("/api/ride");
        if (!res.ok) throw new Error("Failed to fetch Ride");
        const data: Ride = await res.json();
        setRide(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchRide();
  }, [rideId]);

  return { ride, loading, error, setRide };
}
