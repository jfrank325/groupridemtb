import { prisma } from "@/lib/prisma";
import {
  calculateDistanceMiles,
  formatDate,
  formatTime,
} from "@/lib/utils";
import { sendLocalRideAlert } from "@/lib/mailgun";
import { renderLocalRideEmail } from "@/lib/emailTemplates";
import type { Prisma } from "@prisma/client";

const DEFAULT_NOTIFICATION_RADIUS_MILES = 25;
const MAX_NOTIFICATION_RADIUS_MILES = 500;

type LatLng = { lat: number; lng: number };

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const extractLatLng = (
  value: Prisma.JsonValue | null | undefined,
): LatLng | null => {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    const first = value[0];
    if (
      Array.isArray(first) &&
      first.length >= 2 &&
      isFiniteNumber(first[1]) &&
      isFiniteNumber(first[0])
    ) {
      return { lat: first[1], lng: first[0] };
    }
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "coordinates" in value &&
    Array.isArray((value as { coordinates: unknown }).coordinates)
  ) {
    const coordsArray = (value as { coordinates: unknown[] }).coordinates;
    const first = coordsArray[0];
    if (
      Array.isArray(first) &&
      first.length >= 2 &&
      isFiniteNumber(first[1]) &&
      isFiniteNumber(first[0])
    ) {
      return { lat: first[1], lng: first[0] };
    }
  }

  return null;
};

function sanitizeRadius(value: number | null | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return DEFAULT_NOTIFICATION_RADIUS_MILES;
  }
  const rounded = Math.max(1, Math.round(value));
  return Math.min(rounded, MAX_NOTIFICATION_RADIUS_MILES);
}

async function processRideNotifications(rideId: string) {
  try {
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        host: { select: { id: true, name: true, email: true } },
        trails: {
          include: {
            trail: true,
          },
        },
      },
    });

    if (!ride) {
      console.warn("[notifications] Ride not found:", rideId);
      return;
    }

    const firstTrailWithCoords = ride.trails.find((entry) =>
      Boolean(extractLatLng(entry.trail?.coordinates)),
    );

    let rideLatLng: LatLng | null = null;

    if (firstTrailWithCoords) {
      rideLatLng = extractLatLng(firstTrailWithCoords.trail?.coordinates);
    }

    if (!rideLatLng) {
      const locationName = ride.location?.trim();

      if (locationName) {
        const locationTrail = await prisma.trail.findFirst({
          where: {
            OR: [
              { location: { equals: locationName, mode: "insensitive" } },
              {
                trailSystem: {
                  name: { equals: locationName, mode: "insensitive" },
                },
              },
            ],
          },
        });

        if (locationTrail?.coordinates) {
          const latLng = extractLatLng(locationTrail.coordinates);
          if (latLng) {
            rideLatLng = latLng;
            console.info(
              "[notifications] Using coordinates from location match for ride:",
              rideId,
            );
          }
        }
      }

      if (!rideLatLng) {
        console.info(
          "[notifications] Skipping ride without coordinates:",
          rideId,
        );
        return;
      }
    }

    const intendedRecipientsRaw = await prisma.user.findMany({
      where: {
        emailNotificationsEnabled: true,
        notifyLocalRides: true,
        id: { not: ride.userId },
      },
    } as Prisma.UserFindManyArgs);

    type IntendedRecipient = {
      id: string;
      email: string | null;
      name: string | null;
      lat: number | null;
      lng: number | null;
      notificationRadiusMiles: number | null;
    };

    const intendedRecipients: IntendedRecipient[] = intendedRecipientsRaw.map(
      (user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        lat: (user as { lat?: number | null }).lat ?? null,
        lng: (user as { lng?: number | null }).lng ?? null,
        notificationRadiusMiles:
          (user as { notificationRadiusMiles?: number | null })
            .notificationRadiusMiles ?? null,
      }),
    );

    if (!intendedRecipients.length) {
      return;
    }

    const rideUrlBase =
      process.env.NEXT_PUBLIC_SITE_URL || "https://mtbgroupride.com";
    const rideUrl = `${rideUrlBase}/rides/${ride.id}`;
    const rideName = ride.name || "Untitled Ride";
    const rideTrail = firstTrailWithCoords?.trail;
    const rideDifficulty =
      rideTrail?.difficulty || "Not specified";
    const rideDate = formatDate(ride.date, { includeWeekday: true });
    const rideTime = formatTime(ride.date);

    const uniqueRecipientEmails = new Set<string>();
    const rideLocation = ride.location || rideTrail?.name || null;
    const hostName = ride.host?.name || null;

    await Promise.all(
      intendedRecipients.map(async (recipient) => {
        if (
          typeof recipient.lat !== "number" ||
          typeof recipient.lng !== "number"
        ) {
          console.info(
            "[notifications] Skipping user without coordinates:",
            recipient.id,
          );
          return;
        }

        const radiusMiles = sanitizeRadius(recipient.notificationRadiusMiles);
        const distance = calculateDistanceMiles(
          recipient.lat,
          recipient.lng,
          rideLatLng.lat,
          rideLatLng.lng,
        );

        if (distance > radiusMiles) {
          return;
        }

        if (!recipient.email || uniqueRecipientEmails.has(recipient.email)) {
          return;
        }

        uniqueRecipientEmails.add(recipient.email);

        const subject = `New ride near you: ${rideName}`;
        const referralUrl = `${rideUrl}?ref=email-invite`;

        const html = renderLocalRideEmail({
          rideName,
          rideUrl,
          rideDate,
          rideTime,
          rideDifficulty,
          distanceMiles: distance,
          radiusMiles,
          location: rideLocation,
          hostName,
          referralUrl,
        });

        await sendLocalRideAlert({
          to: recipient.email,
          subject,
          html,
        });
      }),
    );
  } catch (error) {
    console.error("[notifications] Failed to process ride notifications:", error);
  }
}

export function queueLocalRideNotifications(rideId: string) {
  setTimeout(() => {
    void processRideNotifications(rideId);
  }, 0);
}

