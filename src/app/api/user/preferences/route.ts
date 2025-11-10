import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const DEFAULT_NOTIFICATION_RADIUS = 25;

const preferencesSchema = z
  .object({
    emailNotificationsEnabled: z.boolean().optional(),
    notifyLocalRides: z.boolean().optional(),
    notifyRideCancellations: z.boolean().optional(),
    notifyRideMessages: z.boolean().optional(),
    notifyDirectMessages: z.boolean().optional(),
    notificationRadiusMiles: z
      .number()
      .int("Radius must be a whole number")
      .min(1, "Radius must be at least 1 mile")
      .max(500, "Radius must be 500 miles or less")
      .nullable()
      .optional(),
  })
  .superRefine((data, ctx) => {
    const emailEnabled = data.emailNotificationsEnabled ?? true;

    if (!emailEnabled) {
      return;
    }

    if (data.notifyLocalRides ?? true) {
      const radius =
        data.notificationRadiusMiles === null || data.notificationRadiusMiles === undefined
          ? null
          : data.notificationRadiusMiles;

      if (radius === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["notificationRadiusMiles"],
          message: "Please provide a radius when notifications are enabled.",
        });
      }
    }
  });

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch (error) {
    console.error("[preferences] Failed to parse request body", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const parsed = preferencesSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const {
    emailNotificationsEnabled,
    notifyLocalRides,
    notifyRideCancellations,
    notifyRideMessages,
    notifyDirectMessages,
    notificationRadiusMiles,
  } = parsed.data;

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { notificationRadiusMiles: true },
  });

  const effectiveEmailEnabled = emailNotificationsEnabled ?? true;
  const effectiveNotifyLocalRides =
    effectiveEmailEnabled && (notifyLocalRides ?? true);
  const effectiveNotifyRideCancellations =
    effectiveEmailEnabled && (notifyRideCancellations ?? true);
  const effectiveNotifyRideMessages =
    effectiveEmailEnabled && (notifyRideMessages ?? true);
  const effectiveNotifyDirectMessages =
    effectiveEmailEnabled && (notifyDirectMessages ?? true);

  try {
    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        emailNotificationsEnabled: effectiveEmailEnabled,
        notifyLocalRides: effectiveNotifyLocalRides,
        notifyRideCancellations: effectiveNotifyRideCancellations,
        notifyRideMessages: effectiveNotifyRideMessages,
        notifyDirectMessages: effectiveNotifyDirectMessages,
        notificationRadiusMiles:
          effectiveEmailEnabled && effectiveNotifyLocalRides
            ? notificationRadiusMiles ??
              currentUser?.notificationRadiusMiles ??
              DEFAULT_NOTIFICATION_RADIUS
            : null,
      },
      select: {
        emailNotificationsEnabled: true,
        notifyLocalRides: true,
        notifyRideCancellations: true,
        notifyRideMessages: true,
        notifyDirectMessages: true,
        notificationRadiusMiles: true,
      },
    });

    revalidatePath("/profile");

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("[preferences] Failed to update preferences", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 },
    );
  }
}

