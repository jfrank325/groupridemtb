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
    location: (formData.get("location") as string | null) ?? undefined,
  };

  const parsed = rideSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const trailIds = parsed.data.trailIds ?? [];

  // Validate that all trail IDs exist when provided
  if (trailIds.length > 0) {
    const validTrails = await prisma.trail.findMany({
      where: { id: { in: trailIds } },
      select: { id: true },
    });

    if (validTrails.length !== trailIds.length) {
      return { error: { trailIds: "One or more trail IDs are invalid" } };
    }
  }

  // Sanitize notes field
  const sanitizedNotes = parsed.data.notes 
    ? sanitizeText(parsed.data.notes.trim().slice(0, 5000))
    : null;

  let sanitizedLocation: string | null = null;
  if (parsed.data.location) {
    const cleaned = sanitizeText(parsed.data.location).trim();
    sanitizedLocation = cleaned.length > 0 ? cleaned.slice(0, 255) : null;
  }

  const ride = await prisma.ride.create({
    data: {
      userId: user.id, // Use actual user ID from session
      date: new Date(parsed.data.date),
      durationMin: parsed.data.durationMin,
      notes: sanitizedNotes, // Sanitized
      location: sanitizedLocation,
      trails: trailIds.length
        ? {
            create: trailIds.map((id: string) => ({ trailId: id })),
          }
        : undefined,
    },
  });

  revalidatePath("/rides");
  return { success: true, ride };
}
