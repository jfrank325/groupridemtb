import { prisma } from "@/lib/prisma";
import {
  calculateDistanceMiles,
  formatDate,
  formatTime,
} from "@/lib/utils";
import { sendLocalRideAlert } from "@/lib/mailgun";
import { renderLocalRideEmail } from "@/lib/emailTemplates";

const DEFAULT_NOTIFICATION_RADIUS_MILES = 25;
const MAX_NOTIFICATION_RADIUS_MILES = 500;

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
            trail: {
              select: {
                id: true,
                name: true,
                difficulty: true,
                lat: true,
                lng: true,
              },
            },
          },
        },
      },
    });

    if (!ride) {
      console.warn("[notifications] Ride not found:", rideId);
      return;
    }

    const firstTrailWithCoords = ride.trails.find((entry) => {
      const rawCoords = entry.trail?.coordinates;
      if (!rawCoords) return false;

      if (
        Array.isArray(rawCoords) &&
        rawCoords.length > 0 &&
        Array.isArray(rawCoords[0]) &&
        rawCoords[0].length >= 2
      ) {
        return true;
      }

      if (
        typeof rawCoords === "object" &&
        rawCoords !== null &&
        "coordinates" in rawCoords &&
        Array.isArray((rawCoords as any).coordinates)
      ) {
        const coordsArray = (rawCoords as any).coordinates;
        if (
          Array.isArray(coordsArray) &&
          coordsArray.length > 0 &&
          Array.isArray(coordsArray[0]) &&
          coordsArray[0].length >= 2
        ) {
          return true;
        }
      }

      return false;
    });

    let rideLat: number | null = null;
    let rideLng: number | null = null;

    if (firstTrailWithCoords) {
      const rawCoords = firstTrailWithCoords.trail?.coordinates;

      if (
        Array.isArray(rawCoords) &&
        Array.isArray(rawCoords[0]) &&
        rawCoords[0].length >= 2
      ) {
        const [lng, lat] = rawCoords[0] as number[];
        rideLat = typeof lat === "number" ? lat : null;
        rideLng = typeof lng === "number" ? lng : null;
      } else if (
        rawCoords &&
        typeof rawCoords === "object" &&
        "coordinates" in rawCoords
      ) {
        const coordsArray = (rawCoords as any).coordinates;
        if (
          Array.isArray(coordsArray) &&
          Array.isArray(coordsArray[0]) &&
          coordsArray[0].length >= 2
        ) {
          const [lng, lat] = coordsArray[0] as number[];
          rideLat = typeof lat === "number" ? lat : null;
          rideLng = typeof lng === "number" ? lng : null;
        }
      }
    }

    if (rideLat === null || rideLng === null) {
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
            coordinates: { not: null },
          },
        });

        if (locationTrail?.coordinates) {
          const rawCoords = locationTrail.coordinates;

          if (
            Array.isArray(rawCoords) &&
            Array.isArray(rawCoords[0]) &&
            rawCoords[0].length >= 2
          ) {
            const [lng, lat] = rawCoords[0] as number[];
            rideLat = typeof lat === "number" ? lat : null;
            rideLng = typeof lng === "number" ? lng : null;
          } else if (
            typeof rawCoords === "object" &&
            rawCoords !== null &&
            "coordinates" in rawCoords
          ) {
            const coordsArray = (rawCoords as any).coordinates;
            if (
              Array.isArray(coordsArray) &&
              Array.isArray(coordsArray[0]) &&
              coordsArray[0].length >= 2
            ) {
              const [lng, lat] = coordsArray[0] as number[];
              rideLat = typeof lat === "number" ? lat : null;
              rideLng = typeof lng === "number" ? lng : null;
            }
          }

          if (rideLat !== null && rideLng !== null) {
            console.info(
              "[notifications] Using coordinates from location match for ride:",
              rideId,
            );
          }
        }
      }

      if (rideLat === null || rideLng === null) {
        console.info(
          "[notifications] Skipping ride without coordinates:",
          rideId,
        );
        return;
      }
    }

    const intendedRecipients = await prisma.user.findMany({
      where: {
        notifyLocalRides: true,
        id: { not: ride.userId },
      },
      select: {
        id: true,
        email: true,
        name: true,
        lat: true,
        lng: true,
        notificationRadiusMiles: true,
      },
    });

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
          rideLat,
          rideLng,
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

