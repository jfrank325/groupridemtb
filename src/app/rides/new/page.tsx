import { NewRideForm } from "@/app/components/NewRideForm";
import { prisma } from "@/lib/prisma";

export default async function NewRidePage({
    searchParams,
}: {
    searchParams: { trailId?: string };
}) {
    const trailsData = await prisma.trail?.findMany({
        select: { id: true, name: true },
    });
    return (
        <>
            <NewRideForm initialTrailId={searchParams.trailId ?? null} trails={trailsData} />
        </>);
}
