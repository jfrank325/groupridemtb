"use client"

import { useRides, type Ride } from "../hooks/useRides";
import { useState } from "react";
import Modal from "./Modal";
import { RideSummary } from "./RideSummary";

export const RidesClient = ({ rides }: { rides: Ride[] }) => {
    const [selectedRide, setSelectedRide] = useState<Ride | null>(null);

    return (
        <section className="md:max-w-1/2">
            <h1 className="text-3xl pb-4">Upcoming Rides</h1>
            {rides.length === 0 ? (
                <p>No rides scheduled.</p>
            ) : (
                <div className="">
                    <ul className="grid grid-cols-4 gap-6">
                        <li className="font-bold text-lg">Ride Name</li>
                        <li className="font-bold text-lg">Date/Time</li>
                        <li className="font-bold text-lg">Trails</li>
                        <li className="font-bold text-lg">Attendees</li>
                    </ul>
                    <ul className="">
                        {rides.map((ride) => (
                            <li key={ride.id} className="grid grid-cols-4 gap-6 py-2 border-b border-b-gray-200" onClick={() => setSelectedRide(ride)}>
                                <p>{ride.name}</p>
                                <p>{new Date(ride.date).toLocaleDateString('en-us', { month: 'numeric', day: 'numeric' })}@{new Date(ride.date).toLocaleTimeString('en-us', { timeStyle: 'short', hour12: true })}</p>
                                <p>{ride.trailNames.join(", ")}</p>
                                <p>{ride.attendees.length}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            )
            }
            <Modal isOpen={!!selectedRide} onClose={() => setSelectedRide(null)}>
                {selectedRide && <RideSummary ride={selectedRide} />}
            </Modal>
        </section>
    )
}