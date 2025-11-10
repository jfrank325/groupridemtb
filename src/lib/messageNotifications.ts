import { prisma } from "@/lib/prisma";
import {
  renderDirectMessageEmail,
  renderRideMessageEmail,
} from "@/lib/emailTemplates";
import { sendMessageNotificationEmail } from "@/lib/mailgun";
import { formatDate, formatTime } from "@/lib/utils";

const MESSAGE_THROTTLE_HOURS = 24;
const INBOX_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://mtbgroupride.com";

type RideMessagePayload = {
  rideId: string;
  rideName: string | null;
  rideDate: Date | null;
  rideLocation: string | null;
  senderId: string;
  senderName: string | null;
  snippet: string;
};

export async function notifyRideMessage(payload: RideMessagePayload) {
  const { rideId, rideName, rideDate, rideLocation, senderId, senderName, snippet } =
    payload;

  const recipients = await prisma.rideAttendee.findMany({
    where: {
      rideId,
      userId: { not: senderId },
      user: {
        email: { not: null },
        emailNotificationsEnabled: true,
        notifyRideMessages: true,
      },
    },
    select: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          emailNotificationsEnabled: true,
          notifyRideMessages: true,
        },
      },
    },
  });

  if (!recipients.length) {
    return;
  }

  const rideUrl = `${INBOX_URL}/rides/${rideId}`;
  const formattedDate = rideDate
    ? formatDate(rideDate, { includeWeekday: true })
    : "Upcoming ride";
  const formattedTime = rideDate ? formatTime(rideDate) : "TBD";
  const safeRideName = rideName || "Group Ride";
  const combinedLocation = rideLocation
    ? `${rideLocation} • ${formattedDate} @ ${formattedTime}`
    : `${formattedDate} @ ${formattedTime}`;

  await Promise.all(
    recipients.map(async ({ user }) => {
      if (!user.email) return;
      if (
        user.emailNotificationsEnabled === false ||
        user.notifyRideMessages === false
      ) {
        return;
      }

      const lastNotification =
        await prisma.messageNotification.findFirst({
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
        await prisma.messageNotification.create({
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

  const recipient = await prisma.user.findUnique({
    where: { id: recipientId },
    select: {
      email: true,
      emailNotificationsEnabled: true,
      notifyDirectMessages: true,
    },
  });

  if (
    !recipient?.email ||
    recipient.emailNotificationsEnabled === false ||
    recipient.notifyDirectMessages === false
  ) {
    return;
  }

  const lastNotification = await prisma.messageNotification.findFirst({
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
    await prisma.messageNotification.create({
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

