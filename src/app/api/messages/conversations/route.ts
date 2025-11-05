import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET conversations grouped by sender/recipients
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all messages where user is involved (as sender or recipient)
    const sentMessages = await prisma.message.findMany({
      where: {
        senderId: user.id,
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
        recipients: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        ride: {
          include: {
            host: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const receivedMessages = await prisma.message.findMany({
      where: {
        recipients: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
        recipients: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        ride: {
          include: {
            host: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Group conversations by ride or by other participants
    const conversationMap = new Map<string, any>();

    // Process sent messages
    sentMessages.forEach((message) => {
      // For ride messages, group by rideId. For non-ride, group by sender + all recipients
      const key = message.rideId 
        ? message.rideId 
        : [message.senderId, ...message.recipients.map(r => r.userId).sort()].join('-');
      
      if (!conversationMap.has(key)) {
        // Get all unique participants
        const allParticipants = [
          message.sender,
          ...message.recipients.map(r => r.user),
        ];
        const uniqueParticipants = Array.from(
          new Map(allParticipants.map(p => [p.id, p])).values()
        );

        conversationMap.set(key, {
          id: key,
          rideId: message.rideId,
          ride: message.ride,
          participants: uniqueParticipants,
          messages: [],
          unreadCount: 0,
          lastMessage: null,
        });
      }
      const conv = conversationMap.get(key);
      if (!conv.messages.find((m: typeof message) => m.id === message.id)) {
        conv.messages.push(message);
      }
      if (!conv.lastMessage || message.createdAt > conv.lastMessage.createdAt) {
        conv.lastMessage = message;
      }
    });

    // Process received messages
    receivedMessages.forEach((message) => {
      // For ride messages, group by rideId. For non-ride, group by sender + all recipients
      const key = message.rideId 
        ? message.rideId 
        : [message.senderId, ...message.recipients.map(r => r.userId).sort()].join('-');
      
      if (!conversationMap.has(key)) {
        // Get all unique participants
        const allParticipants = [
          message.sender,
          ...message.recipients.map(r => r.user),
        ];
        const uniqueParticipants = Array.from(
          new Map(allParticipants.map(p => [p.id, p])).values()
        );

        conversationMap.set(key, {
          id: key,
          rideId: message.rideId,
          ride: message.ride,
          participants: uniqueParticipants,
          messages: [],
          unreadCount: 0,
          lastMessage: null,
        });
      }
      const conv = conversationMap.get(key);
      if (!conv.messages.find((m: typeof message) => m.id === message.id)) {
        conv.messages.push(message);
      }
      
      // Count unread messages
      const recipient = message.recipients.find(r => r.userId === user.id);
      if (recipient && !recipient.read) {
        conv.unreadCount++;
      }
      
      if (!conv.lastMessage || message.createdAt > conv.lastMessage.createdAt) {
        conv.lastMessage = message;
      }
    });

    // Convert to array and sort by last message time
    const conversations = Array.from(conversationMap.values()).sort((a, b) => {
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("[GET_CONVERSATIONS]", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}

