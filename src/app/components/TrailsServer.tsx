
import { prisma } from "@/lib/prisma";
import { useTrails, type Trail } from "../hooks/useTrails";
import dynamic from "next/dynamic";

// Dynamically import TrailMap to reduce initial bundle size
const TrailMap = dynamic(() => import("./TrailMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] rounded-xl shadow-md bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-2"></div>
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  ),
});


export const TrailsServer = async () => {

    const trailsData = await prisma.trail?.findMany({
    });
    console.log({ trailsData })
    // Cast/map the Prisma JsonValue coordinates to the application's Trail type so the prop matches.
    const trails: Trail[] = (trailsData ?? []).map((t) => ({
        ...t,
        coordinates: t.coordinates as unknown as Trail['coordinates'],
    }));


    return (
        <TrailMap trails={trails} />
    )
}