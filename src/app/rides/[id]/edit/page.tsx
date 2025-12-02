import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { EditRideForm } from "@/app/components/EditRideForm";

interface EditRidePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRidePage({ params }: EditRidePageProps) {
  const { id } = await params;

  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/rides/${id}/edit`)}`);
  }

  const user = await prisma.user.findUnique({
    where: { email: session!.user!.email as string },
    select: { id: true },
  });

  if (!user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/rides/${id}/edit`)}`);
  }

  const ride = await prisma.ride.findUnique({
    where: { id },
    include: {
      trails: {
        select: {
          trailId: true,
        },
      },
    },
  });

  if (!ride) {
    notFound();
  }

  if (ride.userId !== user.id) {
    redirect(`/rides/${id}`);
  }

  const trailsData = await prisma.trail.findMany({
    include: {
      trailSystem: true,
    },
    orderBy: { name: "asc" },
  });

  const rideForForm = {
    id: ride.id,
    name: ride.name,
    date: ride.date.toISOString(),
    durationMin: ride.durationMin,
    notes: ride.notes,
    location: (ride as typeof ride & { location?: string | null }).location ?? null,
    recurrence: (ride as typeof ride & { recurrence?: string | null }).recurrence ?? "none",
    postponed: ride.postponed ?? false,
    trailIds: ride.trails.map((entry) => entry.trailId),
  };

  const trails = trailsData.map((trail) => ({
    id: trail.id,
    name: trail.name,
    location: trail.location,
    difficulty: trail.difficulty,
    distanceKm: trail.distanceKm,
    trailSystemId: trail.trailSystemId,
  }));

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">Edit Ride</h1>
            <p className="mt-2 text-sm text-gray-600">
              Update the ride details below. Changes are saved for all attendees, and you can cancel the ride if plans
              change.
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <EditRideForm ride={rideForForm} trails={trails} />
          </div>

          <aside className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Need to double-check something?</h2>
              <p className="mt-2 text-sm text-gray-600">
                You can view the current ride page to confirm attendee details, messages, and map context before making
                changes.
              </p>
              <Link
                href={`/rides/${ride.id}`}
                className="mt-4 inline-flex items-center justify-center rounded-lg border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
              >
                View Ride Details
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

