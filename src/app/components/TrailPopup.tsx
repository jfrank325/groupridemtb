import { useEffect, useState } from "react";
import maplibregl from "maplibre-gl";
import { Trail } from "../hooks/useTrails";
import Link from "next/link";
import { useUser } from "@/app/context/UserContext";

interface TrailPopupProps {
    trail: Partial<Trail>;
    map: maplibregl.Map | null;
    onClose: () => void;
}

interface Ride {
    id: string;
    date: string;
    name: string | null;
    notes: string | null;
    host: { id: string; name: string } | null;
    attendees: Array<{ user: { id: string; name: string } }>;
}

const difficultyColors = {
    Easy: "bg-green-100 text-green-700 border-green-200",
    Intermediate: "bg-blue-100 text-blue-700 border-blue-200",
    Advanced: "bg-red-100 text-red-700 border-red-200",
};

export default function TrailPopup({ trail, map, onClose }: TrailPopupProps) {
    const [rides, setRides] = useState<Ride[]>([]);
    const [loading, setLoading] = useState(true);
    const { session } = useUser();

    const trailId = trail.id;

    useEffect(() => {
        if (!trailId) {
            setLoading(false);
            return;
        }

        async function fetchRides() {
            try {
                const res = await fetch(`/api/rides/by-trail?trailId=${trailId}`);
                if (!res.ok) throw new Error("Failed to fetch rides");
                const data = await res.json();
                // Filter to only future rides and sort by date
                const futureRides = data
                    .filter((ride: Ride) => new Date(ride.date) > new Date())
                    .sort((a: Ride, b: Ride) => new Date(a.date).getTime() - new Date(b.date).getTime());
                setRides(futureRides);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        fetchRides();
    }, [trailId]);

    const joinRide = async (rideId: string) => {
        if (!trailId) return;
        
        try {
            const res = await fetch(`/api/rides/${rideId}/join`, { method: 'PUT' });
            if (!res.ok) throw new Error("Failed to join ride");
            // Refresh rides after joining
            const refreshRes = await fetch(`/api/rides/by-trail?trailId=${trailId}`);
            if (refreshRes.ok) {
                const data = await refreshRes.json();
                const futureRides = data
                    .filter((ride: Ride) => new Date(ride.date) > new Date())
                    .sort((a: Ride, b: Ride) => new Date(a.date).getTime() - new Date(b.date).getTime());
                setRides(futureRides);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const formatDistance = (km: number | null | undefined) => {
        if (!km) return "N/A";
        return km < 1 ? `${(km * 1000).toFixed(0)}m` : `${km.toFixed(1)}km`;
    };

    const formatElevation = (m: number | null | undefined) => {
        if (!m) return "N/A";
        return `${m.toFixed(0)}m`;
    };

    return (
        <div 
            className="absolute z-10 bg-white rounded-xl border border-gray-200 shadow-xl max-w-lg w-[90vw] max-h-[85vh] overflow-y-auto"
            style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
            }}
            role="dialog"
            aria-labelledby="trail-popup-title"
        >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-start justify-between z-10">
                <h2 id="trail-popup-title" className="text-xl font-bold text-gray-900 pr-4">
                    {trail.name || "Trail Details"}
                </h2>
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

            <div className="p-6 space-y-6">
                {/* Trail Info Section */}
                <div className="space-y-4">
                    {/* Location and Difficulty */}
                    <div className="flex items-start justify-between gap-4">
                        {trail.location && (
                            <p className="text-sm text-gray-600 flex items-center gap-1.5 flex-1">
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>{trail.location}</span>
                            </p>
                        )}
                        {trail.difficulty && (
                            <span
                                className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${
                                    difficultyColors[trail.difficulty as keyof typeof difficultyColors] ||
                                    "bg-gray-100 text-gray-700 border-gray-200"
                                }`}
                            >
                                {trail.difficulty}
                            </span>
                        )}
                    </div>

                    {/* Stats Grid */}
                    {(trail.distanceKm || trail.elevationGainM) && (
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                            {trail.distanceKm && (
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Distance</p>
                                    <p className="text-lg font-semibold text-gray-900">{formatDistance(trail.distanceKm)}</p>
                                </div>
                            )}
                            {trail.elevationGainM && (
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Elevation Gain</p>
                                    <p className="text-lg font-semibold text-gray-900">{formatElevation(trail.elevationGainM)}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Description */}
                    {trail.description && (
                        <div className="pt-4 border-t border-gray-100">
                            <p className="text-sm text-gray-700 leading-relaxed">{trail.description}</p>
                        </div>
                    )}
                </div>

                {/* Upcoming Rides Section */}
                {session && (
                    <div className="pt-6 border-t border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Rides</h3>
                        {loading ? (
                            <div className="text-center py-4 text-gray-500 text-sm">Loading rides...</div>
                        ) : rides.length === 0 ? (
                            <div className="text-center py-4 text-gray-500 text-sm mb-4">
                                No upcoming rides scheduled for this trail.
                            </div>
                        ) : (
                            <div className="space-y-3 mb-4">
                                {rides.map((ride) => (
                                    <div
                                        key={ride.id}
                                        className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:border-emerald-300 transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">
                                                    {ride.name || "Group Ride"}
                                                </p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {new Date(ride.date).toLocaleDateString('en-US', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: 'numeric',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                                {ride.host && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Hosted by {ride.host.name}
                                                    </p>
                                                )}
                                                {ride.attendees && ride.attendees.length > 0 && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {ride.attendees.length} {ride.attendees.length === 1 ? 'rider' : 'riders'} attending
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {ride.notes && (
                                            <p className="text-sm text-gray-700 mb-3 pt-2 border-t border-gray-200">
                                                {ride.notes}
                                            </p>
                                        )}
                                        <button
                                            onClick={() => joinRide(ride.id)}
                                            className="w-full border-2 border-emerald-600 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 hover:border-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 font-medium text-sm"
                                        >
                                            Join Ride
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <Link
                            href={`/rides/new?trailId=${trailId}`}
                            className="block w-full border-2 border-emerald-600 text-emerald-700 bg-white px-4 py-2 rounded-lg hover:bg-emerald-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 font-medium text-center text-sm"
                        >
                            Create Ride
                        </Link>
                    </div>
                )}

                {!session && (
                    <div className="pt-6 border-t border-gray-200 text-center">
                        <Link
                            href={`/rides/new?trailId=${trailId}`}
                            className="inline-block border-2 border-emerald-600 text-emerald-700 bg-white px-6 py-2 rounded-lg hover:bg-emerald-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 font-medium text-sm"
                        >
                            Create Ride
                        </Link>
                        <p className="text-xs text-gray-500 mt-3">
                            <Link href="/login" className="text-emerald-600 hover:text-emerald-700 underline">
                                Sign in
                            </Link>
                            {" "}to join rides on this trail
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
