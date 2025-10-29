import { useEffect } from "react";
import maplibregl from "maplibre-gl";
import { Trail } from "../hooks/useTrails";
import Link from "next/link";

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
    return (
        <div className="absolute z-10 bg-white p-4 rounded shadow-lg text-center" style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
        }}>
            <h5>{trail.name}</h5>
            <div className="flex">
                <button className="border-2 border-blue-500 text-blue-500 px-4 py-2 rounded mr-2">Join Ride</button>
                <button className="border-2 border-blue-500 text-blue-500 px-4 py-2 rounded mr-2"><Link href={`/rides/new?trailId=${trail.id}`}>Create Ride</Link></button>
            </div>

        </div>
    )
}
