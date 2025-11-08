"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

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
    select: { userId: true },
  });

  if (!ride) {
    return { error: "Ride not found" };
  }

  if (ride.userId !== currentUser.id) {
    return { error: "Only the host can cancel this ride." };
  }

  await prisma.ride.delete({ where: { id: rideId } });

  revalidatePath("/");
  revalidatePath("/rides");
  revalidatePath(`/rides/${rideId}`);
  revalidatePath("/profile");
  revalidatePath("/trails");

  return { success: true };
}

