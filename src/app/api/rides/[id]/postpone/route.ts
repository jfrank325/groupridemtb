import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { queueRidePostponementNotifications } from "@/lib/ridePostponementNotifications";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { postponed: postponedValue } = body;

    if (typeof postponedValue !== "boolean") {
      return NextResponse.json(
        { error: "postponed must be a boolean" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existingRide = await prisma.ride.findUnique({
      where: { id },
      select: { userId: true },
    });

    // Get current postponed status to check if we need to send notifications
    const currentRide = await prisma.ride.findUnique({
      where: { id },
    }) as { postponed?: boolean } | null;

    if (!existingRide) {
      return NextResponse.json({ error: "Ride not found" }, { status: 404 });
    }

    if (existingRide.userId !== user.id) {
      return NextResponse.json(
        { error: "Only the host can postpone a ride" },
        { status: 403 }
      );
    }

    const rideInclude = {
      trails: {
        include: {
          trail: { include: { trailSystem: true } },
        },
      },
      attendees: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              emailNotificationsEnabled: true,
              notifyRideCancellations: true,
            },
          },
        },
      },
      host: {
        select: { id: true, name: true, email: true },
      },
    } as const;

    const updatedRide = await prisma.ride.update({
      where: { id },
      // @ts-ignore - postponed field exists in schema but Prisma types may need regeneration
      data: { postponed: postponedValue },
      include: rideInclude,
    }) as any;

    // Only send notifications when ride is being postponed (true), not when un-postponing (false)
    const wasAlreadyPostponed = currentRide?.postponed ?? false;
    if (postponedValue && !wasAlreadyPostponed) {
      queueRidePostponementNotifications({
        id: updatedRide.id,
        name: updatedRide.name,
        date: updatedRide.date,
        notes: updatedRide.notes,
        host: updatedRide.host,
        attendees: updatedRide.attendees,
      });
    }

    // Transform to match frontend Ride type
    const rideTrails = updatedRide.trails.map((rt: any) => rt.trail);
    const location = (updatedRide as typeof updatedRide & { location?: string | null }).location ?? null;
    const recurrence = (updatedRide as typeof updatedRide & { recurrence?: string | null }).recurrence ?? "none";
    const postponed = (updatedRide as typeof updatedRide & { postponed?: boolean }).postponed ?? false;

    const normalizedRide = {
      id: updatedRide.id,
      notes: updatedRide.notes,
      name: updatedRide.name,
      location,
      recurrence,
      postponed,
      createdAt: updatedRide.createdAt.toISOString(),
      date: updatedRide.date.toISOString(),
      trailIds: rideTrails.map((t: any) => t.id),
      trailNames: rideTrails.map((t: any) => t.name),
      trailSystems: Array.from(new Set(rideTrails.map((t: any) => t.trailSystem?.name || t.name || "Unknown"))),
      difficulties: rideTrails.map((t: any) => t.difficulty || "Unknown"),
      totalDistanceKm: rideTrails.reduce((sum: number, t: any) => sum + (t.distanceKm || 0), 0),
      lat: rideTrails[0]?.lat || 0,
      lng: rideTrails[0]?.lng || 0,
      attendees: updatedRide.attendees.map((a: any) => ({ id: a.user.id, name: a.user.name })),
      host: updatedRide.host ? { id: updatedRide.host.id, name: updatedRide.host.name } : undefined,
    };

    revalidatePath("/rides");
    revalidatePath(`/rides/${id}`);
    revalidatePath("/");

    return NextResponse.json({ ride: normalizedRide });
  } catch (error) {
    console.error("Error updating ride postponed status:", error);
    return NextResponse.json(
      { error: "Failed to update ride" },
      { status: 500 }
    );
  }
}

