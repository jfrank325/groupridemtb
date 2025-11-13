import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import maplibregl from "maplibre-gl";
import { Trail } from "../hooks/useTrails";
import Link from "next/link";
import { useUser } from "@/app/context/UserContext";
import Modal from "./Modal";
import { formatDistance, formatElevation, formatDate, formatTime, Recurrence } from "@/lib/utils";
import { difficultyColors } from "@/lib/constants";
import { TruncatedText } from "./TruncatedText";

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
    attendees: Array<{ id: string; name: string }>;
    location: string | null;
    recurrence?: string | null;
    trailNames: string[];
    trails: Array<{ trail: { id: string; name: string } | null }>;
}

type JoinRideSuccess = {
    id: string;
    name: string | null;
    date: string;
    location: string | null;
    trailNames: string[];
    recurrence: string | null;
};

const normalizeRide = (ride: any): Ride => {
    const attendees = Array.isArray(ride.attendees)
        ? ride.attendees.map((entry: any) => ({
            id: entry?.user?.id ?? entry?.id ?? "",
            name: entry?.user?.name ?? entry?.name ?? "Rider",
        })).filter((attendee: { id: string }) => attendee.id)
        : [];

    const host = ride.host ? { id: ride.host.id, name: ride.host.name } : null;

    const trails: Array<{ trail: { id: string; name: string } | null }> = Array.isArray(ride.trails)
        ? ride.trails.map((rt: any) => ({
            trail: rt?.trail
                ? { id: rt.trail.id, name: rt.trail.name }
                : rt
                    ? { id: rt.id ?? "", name: rt.name ?? "Trail" }
                    : null,
        }))
        : Array.isArray(ride.trailIds)
            ? ride.trailIds.map((id: string, index: number) => ({
                trail: {
                    id,
                    name: Array.isArray(ride.trailNames) ? ride.trailNames[index] ?? "Trail" : "Trail",
                },
            }))
            : [];

    const trailNames = trails
        .map((entry) => entry.trail?.name)
        .filter((name): name is string => Boolean(name));

    return {
        id: ride.id,
        date: typeof ride.date === "string" ? ride.date : new Date(ride.date).toISOString(),
        name: ride.name ?? null,
        notes: ride.notes ?? null,
        host,
        attendees,
        location: ride.location ?? null,
        recurrence: ride.recurrence ?? "none",
        trailNames,
        trails,
    };
};

export default function TrailPopup({ trail, map, onClose }: TrailPopupProps) {
    const [rides, setRides] = useState<Ride[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [joinSuccess, setJoinSuccess] = useState<JoinRideSuccess | null>(null);
    const [joinLoading, setJoinLoading] = useState(false);
    const [pendingRideId, setPendingRideId] = useState<string | null>(null);
    const { session, user } = useUser();
    const router = useRouter();

    const trailId = trail.id;
    const currentUserId = user?.id || null;

    const createRideHref = useMemo(() => {
        if (!trailId) return "/rides/new";
        if (session) {
            return `/rides/new?trailId=${trailId}`;
        }
        const callback = encodeURIComponent(`/rides/new?trailId=${trailId}`);
        return `/login?callbackUrl=${callback}&authMessage=create-ride`;
    }, [session, trailId]);

    const trailDetailPath = trailId ? `/trails/${trailId}` : "/trails";

    const recurrenceLabels: Record<Exclude<Recurrence, "none">, string> = {
        daily: "Daily",
        weekly: "Weekly",
        monthly: "Monthly",
        yearly: "Yearly",
    };

    const successRecurrenceLabel =
        joinSuccess && joinSuccess.recurrence && joinSuccess.recurrence !== "none"
            ? recurrenceLabels[joinSuccess.recurrence as Exclude<Recurrence, "none">]
            : null;

    useEffect(() => {
        if (!trailId) {
            setLoading(false);
            return;
        }

        async function fetchRides() {
            try {
                setError(null);
                const res = await fetch(`/api/rides/by-trail?trailId=${trailId}`);
                if (!res.ok) throw new Error("Failed to fetch rides");
                const data = await res.json();
                const normalized: Ride[] = Array.isArray(data) ? data.map((rideData: any) => normalizeRide(rideData)) : [];
                const now = new Date();
                const futureRides = normalized
                    .filter((ride) => new Date(ride.date) > now)
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                setRides(futureRides);
            } catch (err) {
                console.error(err);
                setError(err instanceof Error ? err.message : "Failed to load rides");
            } finally {
                setLoading(false);
            }
        }

        fetchRides();
    }, [trailId]);

    const joinRide = async (rideId: string) => {
        if (!trailId) return;

        if (!session) {
            const callback = encodeURIComponent(`/rides/${rideId}`);
            router.push(`/login?callbackUrl=${callback}&authMessage=create-ride`);
            return;
        }

        setJoinLoading(true);
        setPendingRideId(rideId);
        setError(null);

        try {
            const res = await fetch(`/api/rides/${rideId}/join`, { method: "PUT" });
            const data = await res.json().catch(() => ({}));

            if (res.status === 401) {
                const callback = encodeURIComponent(`/rides/${rideId}`);
                router.push(`/login?callbackUrl=${callback}&authMessage=create-ride`);
                return;
            }

            if (!res.ok) {
                throw new Error(data?.error || "Failed to join ride");
            }

            const normalized = normalizeRide(data.ride);
            const now = new Date();

            setRides((prev) => {
                const existing = prev.some((ride) => ride.id === normalized.id);
                const updated = existing
                    ? prev.map((ride) => (ride.id === normalized.id ? normalized : ride))
                    : [...prev, normalized];
                return updated
                    .filter((ride) => new Date(ride.date) > now)
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            });

            setJoinSuccess({
                id: normalized.id,
                name: normalized.name,
                date: normalized.date,
                location: normalized.location,
                trailNames: normalized.trailNames,
                recurrence: normalized.recurrence ?? "none",
            });
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Failed to join ride");
        } finally {
            setJoinLoading(false);
            setPendingRideId(null);
        }
    };


    return (
        <>
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
                <div className="flex-1 pr-4">
                    <h2 id="trail-popup-title" className="text-xl font-bold text-gray-900 mb-2">
                        {trail.name || "Trail Details"}
                    </h2>
                    {trail.id && (
                        <Link
                            href={`/trails/${trail.id}`}
                            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded"
                        >
                            View full trail details
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    )}
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
                    {(trail.distanceKm != null || trail.elevationGainM != null || trail.elevationLossM != null) && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                            {trail.distanceKm != null && (
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Distance</p>
                                    <p className="text-lg font-semibold text-gray-900">{formatDistance(trail.distanceKm)}</p>
                                </div>
                            )}
                            {trail.elevationGainM != null && (
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Elevation Gain</p>
                                    <p className="text-lg font-semibold text-gray-900">{formatElevation(trail.elevationGainM)}</p>
                                </div>
                            )}
                            {trail.elevationLossM != null && (
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Elevation Loss</p>
                                    <p className="text-lg font-semibold text-gray-900">{formatElevation(trail.elevationLossM)}</p>
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
                <div className="pt-6 border-t border-gray-200">
                    <div className="mb-4 flex items-center justify-between gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">Upcoming Rides</h3>
                        {!session && (
                            <Link
                                href={`/login?callbackUrl=${encodeURIComponent(trailDetailPath)}&authMessage=create-ride`}
                                className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                            >
                                Sign in to join rides
                            </Link>
                        )}
                    </div>
                    {error && (
                        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                            {error}
                        </div>
                    )}
                    {loading ? (
                        <div className="text-center py-4 text-gray-500 text-sm">Loading rides...</div>
                    ) : rides.length === 0 ? (
                        <div className="text-center py-4 text-gray-500 text-sm mb-4">
                            No upcoming rides scheduled for this trail.
                        </div>
                    ) : (
                        <div className="space-y-3 mb-4">
                            {rides.map((ride) => {
                                const isAttending = ride.attendees.some((attendee) => attendee.id === currentUserId);
                                const isHost = ride.host?.id === currentUserId;
                                const attendeeCount = ride.attendees.length + (ride.host ? 1 : 0);
                                const joinDisabled = joinLoading && pendingRideId === ride.id;

                                return (
                                    <div
                                        key={ride.id}
                                        className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:border-emerald-300 transition-colors"
                                    >
                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="font-medium text-gray-900">
                                                        {ride.name || "Group Ride"}
                                                    </p>
                                                    {isHost && (
                                                        <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full">
                                                            Your Ride
                                                        </span>
                                                    )}
                                                    {!isHost && isAttending && (
                                                        <span className="px-2.5 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                                                            You're attending
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {formatDate(ride.date, { includeWeekday: true, includeTime: true, hour12: true })}
                                                </p>
                                                {ride.location && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Meetup: <span className="font-medium text-gray-900">{ride.location}</span>
                                                    </p>
                                                )}
                                                {ride.host && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Hosted by {ride.host.name}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {attendeeCount} {attendeeCount === 1 ? "rider" : "riders"}
                                                </p>
                                                {ride.notes && (
                                                    <div className="mt-3 border-t border-gray-200 pt-2">
                                                        <TruncatedText
                                                            text={ride.notes}
                                                            maxLength={200}
                                                            className="text-sm text-gray-700"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-2 md:items-end">
                                                {session ? (
                                                    !isHost && !isAttending ? (
                                                        <button
                                                            onClick={() => joinRide(ride.id)}
                                                            disabled={joinDisabled}
                                                            className="w-full md:w-auto border-2 border-emerald-600 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 hover:border-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 font-medium text-sm disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-300"
                                                        >
                                                            {joinDisabled ? "Joining..." : "Join Ride"}
                                                        </button>
                                                    ) : null
                                                ) : (
                                                    <Link
                                                        href={`/login?callbackUrl=${encodeURIComponent(`/rides/${ride.id}`)}&authMessage=create-ride`}
                                                        className="w-full md:w-auto inline-flex items-center justify-center border border-emerald-600 px-4 py-2 text-sm font-medium text-emerald-700 rounded-lg hover:bg-emerald-50"
                                                    >
                                                        Sign in to Join
                                                    </Link>
                                                )}
                                                <Link
                                                    href={`/rides/${ride.id}`}
                                                    className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
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
                    {trailId && (
                        <Link
                            href={createRideHref}
                            className="block w-full border-2 border-emerald-600 text-emerald-700 bg-white px-4 py-2 rounded-lg hover:bg-emerald-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 font-medium text-center text-sm"
                        >
                            Plan a Ride on this Trail
                        </Link>
                    )}
                    {!session && (
                        <p className="text-xs text-gray-500 mt-3 text-center">
                            Log in to join or host rides on this trail.
                        </p>
                    )}
                </div>
            </div>
        </div>
        <Modal isOpen={!!joinSuccess} onClose={() => setJoinSuccess(null)}>
            {joinSuccess && (
                <div className="space-y-4 text-gray-800">
                    <div>
                        <h3 className="text-xl font-semibold text-emerald-700">Ride joined successfully</h3>
                        <p className="text-sm text-gray-600">
                            You're now attending{" "}
                            <span className="font-medium text-gray-900">
                                {joinSuccess.name || "this ride"}
                            </span>.
                        </p>
                    </div>
                    <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
                        <p>
                            <span className="font-medium text-gray-900">Date:</span>{" "}
                            {formatDate(joinSuccess.date, { includeWeekday: true })}
                        </p>
                        <p>
                            <span className="font-medium text-gray-900">Time:</span>{" "}
                            {formatTime(joinSuccess.date)}
                        </p>
                        {joinSuccess.location && (
                            <p>
                                <span className="font-medium text-gray-900">Location:</span>{" "}
                                {joinSuccess.location}
                            </p>
                        )}
                        {joinSuccess.trailNames.length > 0 && (
                            <p>
                                <span className="font-medium text-gray-900">Trails:</span>{" "}
                                {joinSuccess.trailNames.join(", ")}
                            </p>
                        )}
                        {successRecurrenceLabel && (
                            <p>
                                <span className="font-medium text-gray-900">Recurrence:</span>{" "}
                                {successRecurrenceLabel}
                            </p>
                        )}
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                        <button
                            type="button"
                            onClick={() => setJoinSuccess(null)}
                            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                            Close
                        </button>
                        <Link
                            href={`/rides/${joinSuccess.id}`}
                            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                        >
                            View Ride Details
                        </Link>
                    </div>
                </div>
            )}
        </Modal>
        </>
    );
}
