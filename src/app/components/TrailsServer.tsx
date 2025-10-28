
import { prisma } from "@/lib/prisma";
import { useTrails, type Trail } from "../hooks/useTrails";
import TrailMap from "./TrailMap";


export const TrailsServer = async () => {

    const trailsData = await prisma.trail?.findMany({
    });
console.log({trailsData})
    // Cast/map the Prisma JsonValue coordinates to the application's Trail type so the prop matches.
    const trails: Trail[] = (trailsData ?? []).map((t) => ({
        ...t,
        coordinates: t.coordinates as unknown as Trail['coordinates'],
    }));


    return (
        <TrailMap trails={trails} />
    )
}