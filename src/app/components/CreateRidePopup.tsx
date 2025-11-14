"use client";

import Link from "next/link";
import { useUser } from "../context/UserContext";
import { formatDateShort } from "@/lib/utils";

interface CreateRidePopupProps {
  date: Date;
  onClose: () => void;
}

export function CreateRidePopup({ date, onClose }: CreateRidePopupProps) {
  const { session } = useUser();

  const createRideHref = session 
    ? `/rides/new?date=${encodeURIComponent(date.toISOString())}`
    : `/login?callbackUrl=${encodeURIComponent(`/rides/new?date=${encodeURIComponent(date.toISOString())}`)}&authMessage=create-ride`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-[90%] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 border-b border-gray-200 px-6 py-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              No Rides Scheduled
            </h2>
            <p className="text-sm text-gray-600">
              {formatDateShort(date.toISOString())}
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

        <div className="flex-1 p-6">
          <div className="text-center py-8">
            <svg 
              className="w-16 h-16 mx-auto text-gray-300 mb-4" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-700 text-lg mb-2">No rides scheduled for this date</p>
            <p className="text-gray-600 text-sm mb-6">Be the first to create a ride!</p>
            <Link
              href={createRideHref}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-emerald-600 rounded-lg shadow-lg transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
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
              Create a Ride
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

