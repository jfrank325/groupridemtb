import { formatDate, formatTime } from "@/lib/utils";
import { renderRidePostponedEmail } from "@/lib/emailTemplates";
import { sendRidePostponementEmail } from "@/lib/mailgun";

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

async function processRidePostponement(ride: RideWithAttendees) {
  const rideName = ride.name || "Untitled Ride";
  const rideDate = formatDate(ride.date, { includeWeekday: true });
  const rideTime = formatTime(ride.date);
  const hostName = ride.host?.name || null;
  const rideUrl =
    (process.env.NEXT_PUBLIC_SITE_URL || "https://mtbgroupride.com") +
    `/rides/${ride.id}`;

  const html = renderRidePostponedEmail({
    rideName,
    rideDate,
    rideTime,
    hostName,
    notes: ride.notes,
    rideUrl,
  });

  const subject = `Ride postponed: ${rideName}`;
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
      await sendRidePostponementEmail({
        to: user.email,
        subject,
        html,
      });
    }),
  );
}

export function queueRidePostponementNotifications(ride: RideWithAttendees) {
  setTimeout(() => {
    void processRidePostponement(ride);
  }, 0);
}

