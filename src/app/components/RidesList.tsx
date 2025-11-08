"use client"

import { useRides, type Ride } from "../hooks/useRides";
import { useState } from "react";
import Modal from "./Modal";
import { RideSummary } from "./RideSummary";
import { formatDateShort, formatTime } from "@/lib/utils";

interface RidesListProps {
    title: string;
    rides: Ride[];
    onTrailHover?: (trailId: string | null) => void;
    highlightedRideIds?: string[];
}

export const RidesList = ({ title, rides, onTrailHover, highlightedRideIds = [] }: RidesListProps) => {
    const [selectedRide, setSelectedRide] = useState<Ride | null>(null);

    return (
        <section className="w-full lg:w-1/2">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {rides.length} {rides.length === 1 ? 'ride' : 'rides'}
                </span>
            </div>
            {rides.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <svg 
                        className="w-16 h-16 mx-auto text-gray-300 mb-4" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-700 text-lg">No rides scheduled yet.</p>
                    <p className="text-gray-600 text-sm mt-2">Be the first to create a ride!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {rides.map((ride) => {
                        const isHighlighted = highlightedRideIds.includes(ride.id);
                        return (
                            <button
                                key={ride.id}
                                type="button"
                                onClick={() => setSelectedRide(ride)}
                                className={`w-full bg-white rounded-xl border p-6 text-left transition-all group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
                                    isHighlighted
                                        ? "border-emerald-500 shadow-lg bg-emerald-50/30"
                                        : "border-gray-200 hover:border-emerald-300 hover:shadow-lg"
                                }`}
                            >
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors mb-2">
                                            {ride.name || "Untitled Ride"}
                                        </h3>
                                        {ride.isExample && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
                                                Example Ride
                                            </span>
                                        )}
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 pr-2">
                                            <div className="flex items-center gap-1 whitespace-nowrap">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span className="font-medium">
                                                    {formatDateShort(ride.date)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 whitespace-nowrap">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>{formatTime(ride.date)}</span>
                                            </div>
                                            {ride.location && (
                                                <div className="flex items-center gap-1 min-w-0">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    <span className="truncate max-w-[10rem]" title={ride.location}>
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
                                        </div>
                                    </div>
                                    {ride.role && (
                                        <div className="flex-shrink-0 self-start">
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                                                    ride.role === "host"
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : "bg-slate-100 text-slate-600"
                                                }`}
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    {ride.role === "host" ? (
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c1.657 0 3-1.567 3-3.5S13.657 1 12 1 9 2.567 9 4.5 10.343 8 12 8zm0 2c-3.314 0-6 2.462-6 5.5V19a2 2 0 002 2h8a2 2 0 002-2v-3.5c0-3.038-2.686-5.5-6-5.5z" />
                                                    ) : (
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    )}
                                                </svg>
                                                {ride.role === "host" ? "You're hosting" : "You're attending"}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">Route</span>
                                        {ride.trailNames.length === 0 && ride.location && (
                                            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
                                                {ride.location}
                                            </span>
                                        )}
                                        {ride.trailNames.map((trailName, idx) => {
                                            const trailId = ride.trailIds[idx];
                                            if (!trailId) {
                                                return (
                                                    <span key={idx} className="text-xs text-gray-600">
                                                        {trailName}
                                                        {idx < ride.trailNames.length - 1 && ", "}
                                                    </span>
                                                );
                                            }
                                            return (
                                                <span
                                                    key={trailId}
                                                    className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md cursor-pointer hover:bg-emerald-100 transition-colors"
                                                    onMouseEnter={() => onTrailHover?.(trailId)}
                                                    onMouseLeave={() => onTrailHover?.(null)}
                                                >
                                                    {trailName}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
            <Modal isOpen={!!selectedRide} onClose={() => setSelectedRide(null)}>
                {selectedRide && <RideSummary ride={selectedRide} />}
            </Modal>
        </section>
    )
}