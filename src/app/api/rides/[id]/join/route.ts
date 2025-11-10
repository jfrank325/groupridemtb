import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { EXAMPLE_RIDE_CUTOFF, getDeterministicCoords } from "@/lib/utils";
import { generalLimiter, getRateLimitIdentifier, checkRateLimit } from "@/lib/rate-limit";
import { notifyHostOfNewAttendee } from "@/lib/messageNotifications";

const rideInclude = {
  host: {
    select: {
      id: true,
      name: true,
      email: true,
      emailNotificationsEnabled: true,
      notifyRideMessages: true,
    },
  },
  attendees: {
    include: {
      user: { select: { id: true, name: true } },
    },
  },
  trails: {
    include: {
      trail: {
        select: {
          id: true,
          name: true,
          distanceKm: true,
          difficulty: true,
          trailSystem: { select: { name: true } },
        },
      },
    },
  },
} as const;

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = await checkRateLimit(generalLimiter, identifier);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          },
        }
      );
    }

    const { id } = await context.params;
    const rideId = id;

    if (!rideId) {
      return NextResponse.json({ error: "Missing ride id." }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "You must be signed in to join rides." }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: rideInclude,
    });

    if (!ride) {
      return NextResponse.json({ error: "Ride not found." }, { status: 404 });
    }

    if (ride.userId === currentUser.id) {
      return NextResponse.json({ error: "Hosts are automatically included in their rides." }, { status: 400 });
    }

    const alreadyAttending = await prisma.rideAttendee.findUnique({
      where: {
        rideId_userId: {
          rideId,
          userId: currentUser.id,
        },
      },
    });

    if (!alreadyAttending) {
      await prisma.rideAttendee.create({
        data: {
          rideId,
          userId: currentUser.id,
        },
      });
    }

    const updatedRide = await prisma.ride.findUnique({
      where: { id: rideId },
      include: rideInclude,
    });

    if (!updatedRide) {
      return NextResponse.json({ error: "Ride not found after joining." }, { status: 404 });
    }

    const rideTrails = updatedRide.trails.map((rt) => rt.trail);
    const trailIds = rideTrails.map((trail) => trail.id);
    const trailNames = rideTrails.map((trail) => trail.name);
    const difficulties = rideTrails.map((trail) => trail.difficulty || "Unknown");
    const totalDistanceKm = rideTrails.reduce((sum, trail) => sum + (trail.distanceKm || 0), 0);
    const trailSystems = Array.from(
      new Set(
        rideTrails.map((trail) => trail.trailSystem?.name || trail.name || "Unknown")
      )
    );

    const normalizedRide = {
      id: updatedRide.id,
      name: updatedRide.name,
      notes: updatedRide.notes,
      location: (updatedRide as typeof updatedRide & { location?: string | null }).location ?? null,
      recurrence: (updatedRide as typeof updatedRide & { recurrence?: string | null }).recurrence ?? "none",
      date: updatedRide.date.toISOString(),
      createdAt: updatedRide.createdAt.toISOString(),
      isExample: updatedRide.createdAt.getTime() < EXAMPLE_RIDE_CUTOFF.getTime(),
      trailIds,
      trailNames,
      trailSystems,
      difficulties,
      totalDistanceKm,
      ...getDeterministicCoords(updatedRide.id),
      attendees: updatedRide.attendees.map((attendee) => ({
        id: attendee.user.id,
        name: attendee.user.name,
      })),
      host: updatedRide.host ? { id: updatedRide.host.id, name: updatedRide.host.name } : undefined,
      role: "attendee" as const,
    };

    revalidatePath("/");
    revalidatePath("/rides");
    revalidatePath("/profile");
    revalidatePath(`/rides/${rideId}`);
    revalidatePath("/trails");

    const response = NextResponse.json({
      success: true,
      ride: normalizedRide,
    });

    response.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString());
    response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString());
    response.headers.set("X-RateLimit-Reset", rateLimitResult.reset.toString());

    if (
      updatedRide.host?.email &&
      updatedRide.host.emailNotificationsEnabled &&
      updatedRide.host.notifyRideMessages
    ) {
      const attendeeCount = updatedRide.attendees.length;
      const rideUrlBase =
        process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
        "https://mtbgroupride.com";
      const rideUrl = `${rideUrlBase}/rides/${updatedRide.id}`;

      void notifyHostOfNewAttendee({
        hostId: updatedRide.host.id,
        hostEmail: updatedRide.host.email,
        hostName: updatedRide.host.name,
        rideId: updatedRide.id,
        rideName: updatedRide.name,
        rideDate: updatedRide.date,
        rideUrl,
        attendeeName: currentUser.name || "A rider",
        attendeeCount,
      });
    }

    return response;
  } catch (error) {
    console.error("[JOIN_RIDE]", error);
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "You are already attending this ride" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to join ride" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = await checkRateLimit(generalLimiter, identifier);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          },
        }
      );
    }

    const { id } = await context.params;
    const rideId = id;

    if (!rideId) {
      return NextResponse.json({ error: "Missing ride id." }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "You must be signed in to update rides." }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: rideInclude,
    });

    if (!ride) {
      return NextResponse.json({ error: "Ride not found." }, { status: 404 });
    }

    if (ride.userId === currentUser.id) {
      return NextResponse.json(
        { error: "Hosts cannot remove themselves from their own ride." },
        { status: 400 }
      );
    }

    const attendeeRecord = await prisma.rideAttendee.findUnique({
      where: {
        rideId_userId: {
          rideId,
          userId: currentUser.id,
        },
      },
    });

    if (!attendeeRecord) {
      return NextResponse.json(
        { error: "You are not currently attending this ride." },
        { status: 400 }
      );
    }

    await prisma.rideAttendee.delete({
      where: {
        rideId_userId: {
          rideId,
          userId: currentUser.id,
        },
      },
    });

    const updatedRide = await prisma.ride.findUnique({
      where: { id: rideId },
      include: rideInclude,
    });

    if (!updatedRide) {
      return NextResponse.json({ error: "Ride not found after update." }, { status: 404 });
    }

    const rideTrails = updatedRide.trails.map((rt) => rt.trail);
    const trailIds = rideTrails.map((trail) => trail.id);
    const trailNames = rideTrails.map((trail) => trail.name);
    const difficulties = rideTrails.map((trail) => trail.difficulty || "Unknown");
    const totalDistanceKm = rideTrails.reduce((sum, trail) => sum + (trail.distanceKm || 0), 0);
    const trailSystems = Array.from(
      new Set(
        rideTrails.map((trail) => trail.trailSystem?.name || trail.name || "Unknown")
      )
    );

    const normalizedRide = {
      id: updatedRide.id,
      name: updatedRide.name,
      notes: updatedRide.notes,
      location: (updatedRide as typeof updatedRide & { location?: string | null }).location ?? null,
      recurrence: (updatedRide as typeof updatedRide & { recurrence?: string | null }).recurrence ?? "none",
      date: updatedRide.date.toISOString(),
      createdAt: updatedRide.createdAt.toISOString(),
      isExample: updatedRide.createdAt.getTime() < EXAMPLE_RIDE_CUTOFF.getTime(),
      trailIds,
      trailNames,
      trailSystems,
      difficulties,
      totalDistanceKm,
      ...getDeterministicCoords(updatedRide.id),
      attendees: updatedRide.attendees.map((attendee) => ({
        id: attendee.user.id,
        name: attendee.user.name,
      })),
      host: updatedRide.host ? { id: updatedRide.host.id, name: updatedRide.host.name } : undefined,
      role: "attendee" as const,
    };

    revalidatePath("/");
    revalidatePath("/rides");
    revalidatePath("/profile");
    revalidatePath(`/rides/${rideId}`);
    revalidatePath("/trails");

    const response = NextResponse.json({
      success: true,
      ride: normalizedRide,
    });

    response.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString());
    response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString());
    response.headers.set("X-RateLimit-Reset", rateLimitResult.reset.toString());

    return response;
  } catch (error) {
    console.error("[LEAVE_RIDE]", error);
    return NextResponse.json(
      { error: "Failed to update ride attendance." },
      { status: 500 }
    );
  }
}
