import { useEffect, useState } from "react";
import maplibregl from "maplibre-gl";
import { Trail } from "../hooks/useTrails";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { useSession } from "next-auth/react";
import { useUser } from "@/app/context/UserContext";

interface TrailPopupProps {
    trail: Partial<Trail>;
    map: maplibregl.Map | null;
    onClose: () => void;
}

export default function TrailPopup({ trail, map, onClose }: TrailPopupProps) {
    // useEffect(() => {
    //     if (!map || !trail.coordinates) return;

    //     const coords = trail.coordinates as [number, number][];
    //     console.log({coords}, 'coords');
    //     const midpoint = coords[Math.floor(coords.length / 2)];
    //     console.log({midpoint}, 'midpoint');
    //     const [lng, lat] = midpoint;

    //     const popup = new maplibregl.Popup({ offset: 12 })
    //         .setLngLat([lng, lat])
    //         .setHTML(`
    //     <div style="min-width: 180px">
    //       <strong>${trail.name}</strong><br/>
    //       Difficulty: ${trail.difficulty}<br/>
    //       <button id="joinRideBtn" style="margin-top:5px;padding:4px 8px;border-radius:4px;background:#0070f3;color:white;border:none;cursor:pointer;">Join Ride</button>
    //     </div>
    //   `)
    //         .addTo(map);

    //     popup.on("close", onClose);

    //     // ✅ Cleanup must return a function that removes the popup
    //     return () => {
    //         popup.remove();
    //     };
    // }, [map, trail, onClose]);

    // return null;
    const [rides, setRides] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { session } = useUser();
    useEffect(() => {
        async function fetchRides() {
            try {
                const res = await fetch(`/api/rides/by-trail?trailId=${trail.id}`);
                if (!res.ok) throw new Error("Failed to fetch rides");
                const data = await res.json();
                setRides(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchRides();
    }, [trail.id, session]);

    const joinRide = async (rideId: string) => {
        try {
            const res = await fetch(`/api/rides/${rideId}/join`, {method: 'PUT'});
            if (!res.ok) throw new Error("Failed to fetch rides");
            const data = await res.json();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }


    return (
        <div className="absolute z-10 bg-white p-4 rounded shadow-lg text-center" style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
        }}>
            <h5>{trail.name}</h5>
            <div className="flex">
                {session && rides.length > 0 && rides.map((ride) => (
                    <button key={ride.id} className="border-2 border-green-500 text-green-500 px-4 py-2 rounded mr-2" onClick={() => joinRide(ride.id)}>Join Ride on {new Date(ride.date).toLocaleDateString()}</button>
                ))




                    // <button className="border-2 border-blue-500 text-blue-500 px-4 py-2 rounded mr-2" onClick={() => joinRide(trail.id, session?.user?.id)}>Join Ride</button>
                }
                <button className="border-2 border-blue-500 text-blue-500 px-4 py-2 rounded mr-2"><Link href={`/rides/new?trailId=${trail.id}`}>Create Ride</Link></button>
            </div>

        </div>
    )
}
