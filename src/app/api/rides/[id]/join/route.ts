import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { generalLimiter, getRateLimitIdentifier, checkRateLimit } from "@/lib/rate-limit";

interface Params {
  id: string;
}

export async function PUT(req: Request, { params }: { params: Params }) {
  try {
    // Rate limiting
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = await checkRateLimit(generalLimiter, identifier);
    
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

    const rideId = params.id;
    if (!rideId) {
      return NextResponse.json({ error: "Missing rideId" }, { status: 400 });
    }

    // Validate rideId format (basic check for CUID format)
    if (rideId.length < 10 || rideId.length > 30) {
      return NextResponse.json({ error: "Invalid ride ID format" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ 
      where: { email: session.user.email } 
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if ride exists
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        attendees: {
          where: { userId: user.id },
        },
      },
    });

    if (!ride) {
      return NextResponse.json({ error: "Ride not found" }, { status: 404 });
    }

    // Prevent joining own ride (host is automatically an attendee conceptually)
    if (ride.userId === user.id) {
      return NextResponse.json(
        { error: "You are already the host of this ride" }, 
        { status: 400 }
      );
    }

    // Check if user is already an attendee
    if (ride.attendees.length > 0) {
      return NextResponse.json(
        { error: "You are already attending this ride" }, 
        { status: 400 }
      );
    }

    // Add user as attendee
    const updatedRide = await prisma.ride.update({
      where: { id: rideId },
      data: {
        attendees: {
          create: {
            user: { connect: { id: user.id } },
          },
        },
      },
      include: {
        host: { select: { id: true, name: true } },
        attendees: { 
          include: { user: { select: { id: true, name: true } } } 
        },
        trails: { 
          include: { trail: { select: { id: true, name: true } } } 
        },
      },
    });

    const response = NextResponse.json(updatedRide);
    response.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString());
    response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString());
    response.headers.set("X-RateLimit-Reset", rateLimitResult.reset.toString());
    
    return response;
  } catch (error) {
    console.error("[JOIN_RIDE]", error);
    // Check for unique constraint violation (double-join race condition)
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "You are already attending this ride" }, 
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to join ride" }, 
      { status: 500 }
    );
  }
}
