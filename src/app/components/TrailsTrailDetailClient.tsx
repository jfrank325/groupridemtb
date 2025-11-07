"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser } from "@/app/context/UserContext";
import { formatDate } from "@/lib/utils";

interface Ride {
  id: string;
  date: string;
  name: string | null;
  notes: string | null;
  host: {
    id: string;
    name: string;
  };
  attendees: Array<{
    user: {
      id: string;
      name: string;
    };
  }>;
  trails: Array<{
    trail: {
      id: string;
      name: string;
    };
  }>;
  userId?: string;
  durationMin?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  location?: string | null;
  recurrence?: string | null;
}

interface TrailsTrailDetailClientProps {
  trailId: string;
  initialRides: Ride[];
}

export function TrailsTrailDetailClient({
  trailId,
  initialRides,
}: TrailsTrailDetailClientProps) {
  const { session, user } = useUser();
  const [rides, setRides] = useState<Ride[]>(initialRides);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const currentUserId = user?.id || null;

  const joinRide = async (rideId: string) => {
    if (!session) {
      setError("Please log in to join rides");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/rides/${rideId}/join`, {
        method: "PUT",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to join ride");
      }

      // Refresh rides list
      const refreshRes = await fetch(`/api/rides/by-trail?trailId=${trailId}`);
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        const futureRides = data
          .filter((ride: Ride) => new Date(ride.date) > new Date())
          .sort(
            (a: Ride, b: Ride) =>
              new Date(a.date).getTime() - new Date(b.date).getTime()
          );
        setRides(futureRides);
      }
    } catch (err: any) {
      setError(err.message || "Failed to join ride");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Upcoming Rides</h2>
        <Link
          href={session ? `/rides/new?trailId=${trailId}` : `/login?callbackUrl=${encodeURIComponent(`/rides/new?trailId=${trailId}`)}&authMessage=create-ride`}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          "Create Ride"
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {rides.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="w-16 h-16 mx-auto text-gray-300 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-gray-700 text-lg mb-2">No upcoming rides scheduled</p>
          <div className="mt-4 flex flex-col items-center gap-3">
            <Link
              href={session ? `/rides/new?trailId=${trailId}` : `/login?callbackUrl=${encodeURIComponent(`/rides/new?trailId=${trailId}`)}&authMessage=create-ride`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-600 px-5 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              {session ? "Be the first to create one" : "Log in to create a ride"}
            </Link>
            {!session && (
              <p className="text-xs text-gray-500">
                You’ll be redirected back here after signing in.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {rides.map((ride) => {
            const isAttending = ride.attendees.some(
              (a) => a.user.id === currentUserId
            );
            const isHost = ride.host.id === currentUserId;

            return (
              <div
                key={ride.id}
                className="border border-gray-200 rounded-lg p-6 hover:border-emerald-300 hover:shadow-md transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {formatDate(ride.date, { includeWeekday: true, includeTime: true, hour12: true })}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Hosted by {ride.host.name}
                        </p>
                          {ride.location && (
                            <p className="text-xs text-gray-500 mt-1">
                              Meetup: <span className="font-medium text-gray-900">{ride.location}</span>
                            </p>
                          )}
                      </div>
                      {isHost && (
                        <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full">
                          Your Ride
                        </span>
                      )}
                      {isAttending && !isHost && (
                        <span className="px-2.5 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                          Attending
                        </span>
                      )}
                    </div>

                    {ride.notes && (
                      <p className="text-gray-700 mb-4 whitespace-pre-line">
                        {ride.notes}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        {ride.attendees.length + 1}{" "}
                        {ride.attendees.length + 1 === 1
                          ? "rider"
                          : "riders"}
                      </div>
                      {ride.trails.length > 1 && (
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                            />
                          </svg>
                          {ride.trails.length} trails
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-2 md:items-end">
                    {session ? (
                      !isHost && !isAttending ? (
                        <button
                          onClick={() => joinRide(ride.id)}
                          disabled={loading}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 whitespace-nowrap"
                        >
                          {loading ? "Joining..." : "Join Ride"}
                        </button>
                      ) : null
                    ) : (
                      <Link
                        href={`/login?callbackUrl=${encodeURIComponent(`/rides/${ride.id}`)}&authMessage=create-ride`}
                        className="inline-flex items-center justify-center rounded-lg border border-emerald-600 px-4 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                      >
                        Sign in to Join
                      </Link>
                    )}
                    <Link
                      href={`/rides/${ride.id}`}
                      className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                    >
                      View Ride Details
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
