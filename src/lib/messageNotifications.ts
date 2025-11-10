import { prisma } from "@/lib/prisma";
import {
  renderDirectMessageEmail,
  renderRideMessageEmail,
  renderHostJoinEmail,
} from "@/lib/emailTemplates";
import {
  sendMessageNotificationEmail,
  sendHostJoinNotificationEmail,
} from "@/lib/mailgun";
import { formatDate, formatTime } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

const MESSAGE_THROTTLE_HOURS = 24;
const INBOX_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://mtbgroupride.com";

type HostNotificationPayload = {
  hostId: string;
  hostEmail: string;
  hostName: string | null;
  rideId: string;
  rideName: string | null;
  rideDate: Date | null;
  rideUrl: string;
  attendeeName: string;
  attendeeCount: number;
};
type RideMessagePayload = {
  rideId: string;
  rideName: string | null;
  rideDate: Date | null;
  rideLocation: string | null;
  senderId: string;
  senderName: string | null;
  snippet: string;
};

const messageNotificationDelegate = () =>
  (prisma as any).messageNotification as {
    findFirst: (args: any) => Promise<any>;
    create: (args: any) => Promise<any>;
  };

export async function notifyRideMessage(payload: RideMessagePayload) {
  const { rideId, rideName, rideDate, rideLocation, senderId, senderName, snippet } =
    payload;

  const attendeeLinks = await prisma.rideAttendee.findMany({
    where: { rideId },
    select: { userId: true },
  });

  const recipientIds = attendeeLinks
    .map((entry) => entry.userId)
    .filter((id) => id && id !== senderId);

  if (!recipientIds.length) {
    return;
  }

  const recipients = await prisma.user.findMany({
    where: {
      id: { in: recipientIds },
      emailNotificationsEnabled: true,
      notifyRideMessages: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  } as Prisma.UserFindManyArgs);

  const rideUrl = `${INBOX_URL}/rides/${rideId}`;
  const formattedDate = rideDate
    ? formatDate(rideDate, { includeWeekday: true })
    : "Upcoming ride";
  const formattedTime = rideDate ? formatTime(rideDate) : "TBD";
  const safeRideName = rideName || "Group Ride";
  const combinedLocation = rideLocation
    ? `${rideLocation} • ${formattedDate} @ ${formattedTime}`
    : `${formattedDate} @ ${formattedTime}`;

  const notifications = messageNotificationDelegate();

  await Promise.all(
    recipients.map(async (user) => {
      if (!user.email) {
        return;
      }

      const lastNotification = await notifications.findFirst({
        where: {
          userId: user.id,
          rideId,
          sourceType: "RIDE_MESSAGE",
          createdAt: {
            gte: new Date(Date.now() - MESSAGE_THROTTLE_HOURS * 3600 * 1000),
          },
        },
        orderBy: { createdAt: "desc" },
      });

      if (lastNotification) {
        return;
      }

      const totalUnread = await prisma.message.count({
        where: {
          rideId,
          recipients: {
            some: {
              userId: user.id,
              read: false,
            },
          },
        },
      });

      const html = renderRideMessageEmail({
        rideName: safeRideName,
        rideUrl,
        senderName: senderName || "A rider",
        snippet,
        totalUnread,
      });

      const subject = totalUnread > 1
        ? `${totalUnread} new messages about ${safeRideName}`
        : `New message about ${safeRideName}`;

      const sent = await sendMessageNotificationEmail({
        to: user.email,
        subject,
        html,
      });

      if (sent) {
        await notifications.create({
          data: {
            userId: user.id,
            rideId,
            sourceType: "RIDE_MESSAGE",
            metadata: {
              senderId,
              senderName,
              rideName: safeRideName,
              rideLocation: combinedLocation,
            },
          },
        });
      }
    }),
  );
}

type DirectMessagePayload = {
  recipientId: string;
  senderId: string;
  senderName: string | null;
  senderProfileUrl: string;
  snippet: string;
};

export async function notifyDirectMessage(payload: DirectMessagePayload) {
  const {
    recipientId,
    senderId,
    senderName,
    senderProfileUrl,
    snippet,
  } = payload;

  const recipient = await prisma.user.findFirst({
    where: {
      id: recipientId,
      emailNotificationsEnabled: true,
      notifyDirectMessages: true,
    },
    select: {
      email: true,
    },
  } as Prisma.UserFindFirstArgs);

  if (
    !recipient?.email ||
    recipient.email === null
  ) {
    return;
  }

  const notifications = messageNotificationDelegate();

  const lastNotification = await notifications.findFirst({
    where: {
      userId: recipientId,
      senderId,
      sourceType: "DIRECT_MESSAGE",
      createdAt: {
        gte: new Date(Date.now() - MESSAGE_THROTTLE_HOURS * 3600 * 1000),
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (lastNotification) {
    return;
  }

  const totalUnreadFromSender = await prisma.message.count({
    where: {
      senderId,
      rideId: null,
      recipients: {
        some: {
          userId: recipientId,
          read: false,
        },
      },
    },
  });

  const inboxUrl = `${INBOX_URL}/messages`;

  const html = renderDirectMessageEmail({
    senderName: senderName || "A rider",
    senderProfileUrl,
    snippet,
    inboxUrl,
    totalUnreadFromSender,
  });

  const subject = totalUnreadFromSender > 1
    ? `${senderName || "A rider"} sent ${totalUnreadFromSender} new messages`
    : `${senderName || "A rider"} sent you a message`;

  const sent = await sendMessageNotificationEmail({
    to: recipient.email,
    subject,
    html,
  });

  if (sent) {
    await notifications.create({
      data: {
        userId: recipientId,
        senderId,
        sourceType: "DIRECT_MESSAGE",
        metadata: {
          senderName,
        },
      },
    });
  }
}

export async function notifyHostOfNewAttendee(
  payload: HostNotificationPayload,
) {
  const {
    hostId,
    hostEmail,
    hostName,
    rideId,
    rideName,
    rideDate,
    rideUrl,
    attendeeName,
    attendeeCount,
  } = payload;

  const host = await prisma.user.findFirst({
    where: {
      id: hostId,
      emailNotificationsEnabled: true,
      notifyRideMessages: true,
    },
    select: {
      email: true,
    },
  } as Prisma.UserFindFirstArgs);

  if (
    !host?.email ||
    host.email === null
  ) {
    return;
  }

  const notifications = messageNotificationDelegate();

  const lastNotification = await notifications.findFirst({
    where: {
      userId: hostId,
      rideId,
      sourceType: "HOST_JOIN",
      createdAt: {
        gte: new Date(Date.now() - MESSAGE_THROTTLE_HOURS * 3600 * 1000),
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (lastNotification) {
    return;
  }

  const formattedDate = rideDate
    ? formatDate(rideDate, { includeWeekday: true })
    : "Upcoming ride";
  const formattedTime = rideDate ? formatTime(rideDate) : "TBD";

  const html = renderHostJoinEmail({
    hostName: hostName || "Ride host",
    attendeeName,
    rideName: rideName || "Your ride",
    rideDate: formattedDate,
    rideTime: formattedTime,
    rideUrl,
    attendeeCount,
  });

  const subject = `${attendeeName} joined ${rideName || "your ride"}`;

  const sent = await sendHostJoinNotificationEmail({
    to: hostEmail,
    subject,
    html,
  });

  if (sent) {
    await notifications.create({
      data: {
        userId: hostId,
        rideId,
        sourceType: "HOST_JOIN",
        metadata: {
          attendeeName,
        },
      },
    });
  }
}


