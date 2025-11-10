import { formatDate, formatTime } from "@/lib/utils";
import { renderRideCancelledEmail } from "@/lib/emailTemplates";
import { sendRideCancellationEmail } from "@/lib/mailgun";

type RideWithAttendees = {
  id: string;
  name: string | null;
  date: Date;
  notes: string | null;
  host: { id: string; name: string | null; email: string | null } | null;
  attendees: Array<{
    user: {
      id: string;
      name: string | null;
      email: string | null;
      emailNotificationsEnabled?: boolean | null;
      notifyRideCancellations?: boolean | null;
    };
  }>;
};

async function processRideCancellation(ride: RideWithAttendees) {
  const rideName = ride.name || "Untitled Ride";
  const rideDate = formatDate(ride.date, { includeWeekday: true });
  const rideTime = formatTime(ride.date);
  const hostName = ride.host?.name || null;
  const ridesUrl =
    (process.env.NEXT_PUBLIC_SITE_URL || "https://mtbgroupride.com") + "/rides";

  const html = renderRideCancelledEmail({
    rideName,
    rideDate,
    rideTime,
    hostName,
    notes: ride.notes,
    ridesUrl,
  });

  const subject = `Ride cancelled: ${rideName}`;
  const uniqueEmails = new Set<string>();

  await Promise.all(
    ride.attendees.map(async ({ user }) => {
      const canNotify =
        (user.emailNotificationsEnabled ?? true) &&
        (user.notifyRideCancellations ?? true);

      if (!canNotify || !user.email || uniqueEmails.has(user.email)) {
        return;
      }
      uniqueEmails.add(user.email);
      await sendRideCancellationEmail({
        to: user.email,
        subject,
        html,
      });
    }),
  );
}

export function queueRideCancellationNotifications(ride: RideWithAttendees) {
  setTimeout(() => {
    void processRideCancellation(ride);
  }, 0);
}

