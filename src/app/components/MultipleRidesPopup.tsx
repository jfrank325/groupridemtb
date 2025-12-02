"use client";

import { type Ride } from "../hooks/useRides";
import { formatDateShort, formatTime } from "@/lib/utils";
import Link from "next/link";
import { useUser } from "../context/UserContext";

interface MultipleRidesPopupProps {
  date: Date;
  rides: Ride[];
  onSelectRide: (ride: Ride) => void;
  onClose: () => void;
}

export function MultipleRidesPopup({ date, rides, onSelectRide, onClose }: MultipleRidesPopupProps) {
  const { session } = useUser();
  const sortedRides = [...rides].sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    return timeA - timeB;
  });

  const createRideHref = session 
    ? `/rides/new?date=${encodeURIComponent(date.toISOString())}`
    : `/login?callbackUrl=${encodeURIComponent(`/rides/new?date=${encodeURIComponent(date.toISOString())}`)}&authMessage=create-ride`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-2xl w-[90%] max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 border-b border-gray-200 px-6 py-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Rides on {formatDateShort(date.toISOString())}
            </h2>
            <p className="text-sm text-gray-600">
              {sortedRides.length} {sortedRides.length === 1 ? 'ride' : 'rides'} scheduled
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded p-1 transition-colors"
            aria-label="Close popup"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {sortedRides.map((ride) => (
              <button
                key={ride.id}
                type="button"
                onClick={() => {
                  onSelectRide(ride);
                  onClose();
                }}
                className="w-full bg-white rounded-lg border border-gray-200 p-4 text-left hover:border-emerald-300 hover:shadow-md transition-all group focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                        {ride.name || "Untitled Ride"}
                      </h3>
                      {ride.postponed && (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Postponed
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">{formatTime(ride.date)}</span>
                      </div>
                      {ride.location && (
                        <div className="flex items-center gap-1 min-w-0">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="truncate max-w-[12rem]" title={ride.location}>
                            {ride.location}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>{ride.attendees.length} {ride.attendees.length === 1 ? 'attendee' : 'attendees'}</span>
                      </div>
                      {ride.host && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <span>Hosted by {ride.host.name}</span>
                        </div>
                      )}
                    </div>
                    {ride.trailNames.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {ride.trailNames.slice(0, 3).map((trailName, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md"
                          >
                            {trailName}
                          </span>
                        ))}
                        {ride.trailNames.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{ride.trailNames.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 sm:ml-4">
                    <Link
                      href={`/rides/${ride.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4">
          <Link
            href={createRideHref}
            className="block w-full text-center border-2 border-emerald-600 text-emerald-700 bg-white px-4 py-2 rounded-lg hover:bg-emerald-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 font-medium text-sm"
          >
            Create a Ride on This Date
          </Link>
        </div>
      </div>
    </div>
  );
}

