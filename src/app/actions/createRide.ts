// app/actions/createRide.ts
"use server";

import { prisma } from "@/lib/prisma";
import { rideSchema } from "@/lib/validation/rideSchema";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { rideLimiter, getRateLimitIdentifier, checkRateLimit } from "@/lib/rate-limit";
import { sanitizeText } from "@/lib/sanitize";
import { headers } from "next/headers";

export async function createRide(formData: FormData) {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { error: "Unauthorized" };
  }

  // Rate limiting
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : headersList.get("x-real-ip") || "unknown";
  
  const rateLimitResult = await checkRateLimit(rideLimiter, ip);
  if (!rateLimitResult.success) {
    return { 
      error: { 
        _form: "Too many requests. Please try again later." 
      } 
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return { error: "User not found" };
  }

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

  // Validate that all trail IDs exist
  const validTrails = await prisma.trail.findMany({
    where: { id: { in: parsed.data.trailIds } },
    select: { id: true },
  });

  if (validTrails.length !== parsed.data.trailIds.length) {
    return { error: { trailIds: "One or more trail IDs are invalid" } };
  }

  // Sanitize notes field
  const sanitizedNotes = parsed.data.notes 
    ? sanitizeText(parsed.data.notes.trim().slice(0, 5000))
    : null;

  const ride = await prisma.ride.create({
    data: {
      userId: user.id, // Use actual user ID from session
      date: new Date(parsed.data.date),
      durationMin: parsed.data.durationMin,
      notes: sanitizedNotes, // Sanitized
      trails: {
        create: parsed.data.trailIds.map((id: string) => ({ trailId: id })),
      },
    },
  });

  revalidatePath("/rides");
  return { success: true, ride };
}
