// app/actions/createRide.ts
"use server";

import { prisma } from "@/lib/prisma";
import { rideSchema } from "@/lib/validation/rideSchema";
import { revalidatePath } from "next/cache";

export async function createRide(formData: FormData) {
  const raw = {
    date: formData.get("date") as string,
    durationMin: Number(formData.get("durationMin")),
    notes: formData.get("notes") as string,
    trailIds: formData.getAll("trailIds") as string[],
  };

  const parsed = rideSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const ride = await prisma.ride.create({
    data: {
      userId: "cld...", // from session
      date: new Date(parsed.data.date),
      durationMin: parsed.data.durationMin,
      notes: parsed.data.notes,
      trails: {
        create: parsed.data.trailIds.map((id:string) => ({ trailId: id })),
      },
    },
  });

  revalidatePath("/rides");
  return { success: true, ride };
}
