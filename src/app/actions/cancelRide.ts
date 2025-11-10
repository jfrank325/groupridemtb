"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { queueRideCancellationNotifications } from "@/lib/rideCancellationNotifications";

export async function cancelRide(rideId: string) {
  if (!rideId) {
    return { error: "Missing ride id." };
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { error: "Unauthorized" };
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!currentUser) {
    return { error: "User not found" };
  }

  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: {
      host: {
        select: { id: true, name: true, email: true },
      },
      attendees: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!ride) {
    return { error: "Ride not found" };
  }

  if (ride.userId !== currentUser.id) {
    return { error: "Only the host can cancel this ride." };
  }

  queueRideCancellationNotifications({
    id: ride.id,
    name: ride.name,
    date: ride.date,
    notes: ride.notes,
    host: ride.host,
    attendees: ride.attendees,
  });

  await prisma.ride.delete({ where: { id: rideId } });

  revalidatePath("/");
  revalidatePath("/rides");
  revalidatePath(`/rides/${rideId}`);
  revalidatePath("/profile");
  revalidatePath("/trails");

  return { success: true };
}

