import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET all messages for the current user
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

    // Get all messages where user is a recipient, ordered by most recent
    const messages = await prisma.message.findMany({
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

    return NextResponse.json(messages);
  } catch (error) {
    console.error("[GET_MESSAGES]", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

// POST send a new message
export async function POST(req: Request) {
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

    const body = await req.json();
    const { content, recipientIds, rideId, label } = body;

    if (!content || !recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        senderId: user.id,
        content,
        rideId: rideId || null,
        label: label || null,
        recipients: {
          create: recipientIds.map((recipientId: string) => ({
            userId: recipientId,
            read: false,
          })),
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
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("[POST_MESSAGE]", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

