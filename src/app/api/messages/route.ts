import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { messageLimiter, getRateLimitIdentifier, checkRateLimit } from "@/lib/rate-limit";
import { sanitizeText } from "@/lib/sanitize";

// GET all messages for the current user
export async function GET(req: Request) {
  try {
    // Rate limiting
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = await checkRateLimit(messageLimiter, identifier);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { 
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          },
        }
      );
    }

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
              select: { id: true, name: true }, // Email removed for privacy
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
      take: 100, // Limit results to prevent DoS
    });

    // Sanitize message content before returning
    const sanitizedMessages = messages.map(msg => ({
      ...msg,
      content: sanitizeText(msg.content),
      label: msg.label ? sanitizeText(msg.label) : null,
    }));

    const response = NextResponse.json(sanitizedMessages);
    response.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString());
    response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString());
    response.headers.set("X-RateLimit-Reset", rateLimitResult.reset.toString());
    
    return response;
  } catch (error) {
    console.error("[GET_MESSAGES]", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

// POST send a new message
export async function POST(req: Request) {
  try {
    // Rate limiting for message sending
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = await checkRateLimit(messageLimiter, identifier);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { 
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          },
        }
      );
    }

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
    let { content, recipientIds, rideId, label } = body;

    // Validate and sanitize content
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    content = sanitizeText(content.trim().slice(0, 10000)); // Sanitize and limit to 10,000 characters
    
    if (content.length === 0) {
      return NextResponse.json({ error: "Content cannot be empty" }, { status: 400 });
    }

    // Validate recipientIds
    if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      return NextResponse.json({ error: "At least one recipient is required" }, { status: 400 });
    }

    // Remove self from recipient list
    const filteredRecipientIds = recipientIds.filter(id => id !== user.id);
    
    if (filteredRecipientIds.length === 0) {
      return NextResponse.json({ error: "Cannot send message to yourself" }, { status: 400 });
    }

    if (filteredRecipientIds.length > 50) {
      return NextResponse.json({ error: "Maximum 50 recipients allowed" }, { status: 400 });
    }

    // Validate that all recipient IDs are valid users
    const validRecipients = await prisma.user.findMany({
      where: { 
        id: { in: filteredRecipientIds },
      },
      select: { id: true },
    });

    if (validRecipients.length !== filteredRecipientIds.length) {
      return NextResponse.json({ error: "One or more recipient IDs are invalid" }, { status: 400 });
    }

    // Sanitize label
    if (label && typeof label === 'string') {
      label = sanitizeText(label.trim().slice(0, 100));
      if (label.length === 0) {
        label = null;
      }
    } else {
      label = null;
    }

    // Validate rideId if provided
    let ride = null;
    if (rideId) {
      if (typeof rideId !== 'string' || rideId.length < 10) {
        return NextResponse.json({ error: "Invalid ride ID format" }, { status: 400 });
      }

      ride = await prisma.ride.findUnique({
        where: { id: rideId },
        include: {
          host: { select: { id: true } },
          attendees: { include: { user: { select: { id: true } } } },
        },
      });

      if (!ride) {
        return NextResponse.json({ error: "Ride not found" }, { status: 404 });
      }

      // Verify user has access to this ride (is host or attendee)
      const hasAccess = ride.userId === user.id || 
        ride.attendees.some(a => a.userId === user.id);
      
      if (!hasAccess) {
        return NextResponse.json(
          { error: "You don't have access to send messages for this ride" }, 
          { status: 403 }
        );
      }
    }

    // If this is a ride message, automatically include all ride attendees (host + attendees) as recipients
    let finalRecipientIds = [...filteredRecipientIds];
    if (ride) {
      // Add host if not already included
      if (ride.userId !== user.id && !finalRecipientIds.includes(ride.userId)) {
        finalRecipientIds.push(ride.userId);
      }
      // Add all attendees if not already included
      ride.attendees.forEach((attendee) => {
        if (attendee.userId !== user.id && !finalRecipientIds.includes(attendee.userId)) {
          finalRecipientIds.push(attendee.userId);
        }
      });
    }

    // Remove duplicates
    finalRecipientIds = Array.from(new Set(finalRecipientIds));

    // Validate final recipient list doesn't exceed limit
    if (finalRecipientIds.length > 50) {
      return NextResponse.json({ error: "Total recipients exceed maximum allowed" }, { status: 400 });
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        senderId: user.id,
        content, // Already sanitized
        rideId: rideId || null,
        label: label || null, // Already sanitized
        recipients: {
          create: finalRecipientIds.map((recipientId: string) => ({
            userId: recipientId,
            read: false,
          })),
        },
      },
      include: {
        sender: {
          select: { id: true, name: true }, // Email removed for privacy
        },
        recipients: {
          include: {
            user: {
              select: { id: true, name: true }, // Email removed for privacy
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

    const response = NextResponse.json(message);
    response.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString());
    response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString());
    response.headers.set("X-RateLimit-Reset", rateLimitResult.reset.toString());
    
    return response;
  } catch (error) {
    console.error("[POST_MESSAGE]", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

