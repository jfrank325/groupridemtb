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
                            <div
                                key={ride.id}
                                onClick={() => setSelectedRide(ride)}
                                className={`bg-white rounded-xl border p-6 transition-all cursor-pointer group focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2 focus-within:outline-none ${
                                    isHighlighted 
                                        ? 'border-emerald-500 shadow-lg bg-emerald-50/30' 
                                        : 'border-gray-200 hover:border-emerald-300 hover:shadow-lg'
                                }`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors mb-2">
                                            {ride.name || "Untitled Ride"}
                                        </h3>
                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span className="font-medium">
                                                    {formatDateShort(ride.date)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>{formatTime(ride.date)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                                <span>{ride.attendees.length} {ride.attendees.length === 1 ? 'attendee' : 'attendees'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ml-4 flex-shrink-0">
                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-medium text-gray-700">Trails:</span>
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
                            </div>
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