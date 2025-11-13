import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { formatDate, formatTime, getNextRecurringDate, Recurrence } from "@/lib/utils";
import { ShareRideButton } from "@/app/components/ShareRideButton";
import { RideAttendanceActions } from "@/app/components/RideAttendanceActions";

export default async function RideDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let ride = await prisma.ride.findUnique({
    where: { id },
    include: {
      host: {
        select: { id: true, name: true, email: true },
      },
      attendees: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      trails: {
        include: {
          trail: {
            include: {
              trailSystem: true,
            },
          },
        },
      },
    },
  });

  if (!ride) {
    notFound();
  }

  const recurrenceValueRaw = (ride as typeof ride & { recurrence?: string | null }).recurrence ?? "none";
  const nextDate = getNextRecurringDate(ride.date, recurrenceValueRaw as Recurrence);
  if (nextDate) {
    ride = await prisma.ride.update({
      where: { id },
      data: { date: nextDate },
      include: {
        host: {
          select: { id: true, name: true, email: true },
        },
        attendees: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        trails: {
          include: {
            trail: {
              include: {
                trailSystem: true,
              },
            },
          },
        },
      },
    });
  }

  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.email
    ? (
        await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true },
        })
      )?.id ?? null
    : null;

  const isHost = currentUserId === ride.userId;

  const recurrenceValue = (ride as typeof ride & { recurrence?: string | null }).recurrence ?? "none";
  const recurrenceLabels: Record<Exclude<Recurrence, "none">, string> = {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    yearly: "Yearly",
  };
  const recurrenceLabel =
    recurrenceValue !== "none"
      ? recurrenceLabels[recurrenceValue as Exclude<Recurrence, "none">]
      : null;

  const rideDate = ride.date;
  const rideDateLabel = formatDate(rideDate, { includeWeekday: true });
  const rideLocation = (ride as { location?: string | null }).location ?? null;
  const trailDetails = ride.trails.map((entry) => entry.trail);
  const attendeeUsers = ride.attendees.map((attendee) => attendee.user);
  const isAttending = currentUserId
    ? attendeeUsers.some((user) => user.id === currentUserId)
    : false;

  const baseSiteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://mtbgroupride.com";
  const shareUrl = `${baseSiteUrl}/rides/${ride.id}`;
  const shareTitle = ride.name ? `Ride: ${ride.name}` : "Join this MTB Group Ride";
  const shareDescription = rideLocation
    ? `Join this ride at ${rideLocation} on ${rideDateLabel}.`
    : `Join this ride on ${rideDateLabel}.`;
  const ridePath = `/rides/${ride.id}`;
  const loginHref = `/login?callbackUrl=${encodeURIComponent(ridePath)}`;

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600">
          <Link
            href="/rides"
            className="hover:text-emerald-600 transition-colors"
          >
            Rides
          </Link>
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="text-gray-900 font-medium">
            {ride.name || "Untitled Ride"}
          </span>
        </nav>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              {ride.name || "Untitled Ride"}
            </h1>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <ShareRideButton
              url={shareUrl}
              title={shareTitle}
              description={shareDescription}
            />
            <RideAttendanceActions
              rideId={ride.id}
              isHost={isHost}
              initialIsAttending={isAttending}
              canJoin={Boolean(currentUserId)}
              loginHref={loginHref}
              rideName={ride.name}
            />
            <Link
              href="/rides/new"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Plan Another Ride
            </Link>
            {isHost && (
              <Link
                href={`/rides/${ride.id}/edit`}
                className="inline-flex items-center justify-center rounded-lg border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
              >
                Edit Ride
              </Link>
            )}
          </div>
        </div>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Schedule</h2>
            <p className="text-gray-700">
              <span className="font-medium">Date:</span> {rideDateLabel}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Time:</span> {formatTime(rideDate)}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Duration:</span> {ride.durationMin} minutes
            </p>
            {rideLocation && (
              <p className="text-gray-700">
                <span className="font-medium">Location:</span> {rideLocation}
              </p>
            )}
            {recurrenceLabel && (
              <p className="text-gray-700">
                <span className="font-medium">Recurrence:</span> {recurrenceLabel}
              </p>
            )}
          </div>

          <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Host &amp; Attendees</h2>
            {ride.host ? (
              <div className="space-y-1 text-gray-700">
                <p className="font-medium text-gray-900">{ride.host.name}</p>
                {ride.host.email && <p className="text-sm">{ride.host.email}</p>}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Host information unavailable.</p>
            )}
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-900">Attendees ({attendeeUsers.length})</h3>
              {attendeeUsers.length === 0 ? (
                <p className="text-sm text-gray-500 mt-1">No attendees yet.</p>
              ) : (
                <ul className="mt-2 space-y-1 text-sm text-gray-700">
                  {attendeeUsers.map((user) => (
                    <li key={user.id}>
                      <span className="font-medium text-gray-900">{user.name}</span>
                      {user.email && <span className="text-gray-500"> — {user.email}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Route Details</h2>
          {trailDetails.length > 0 ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {trailDetails.map((trail) => (
                <li key={trail.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="font-medium text-gray-900">{trail.name}</p>
                  {trail.location && (
                    <p className="text-xs text-gray-600 mt-1">{trail.location}</p>
                  )}
                  {trail.difficulty && (
                    <span className="mt-2 inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      {trail.difficulty}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">This ride doesn&apos;t list specific trails. Review the notes for additional context.</p>
          )}
        </section>

        {ride.notes && (
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
            <p className="text-gray-700 whitespace-pre-line">{ride.notes}</p>
          </section>
        )}
      </div>
    </main>
  );
}