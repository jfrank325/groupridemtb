import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generalLimiter, getRateLimitIdentifier, checkRateLimit } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const trailId = searchParams.get("trailId");

  if (!trailId) {
    return NextResponse.json({ error: "Missing trailId" }, { status: 400 });
  }

  // Validate trailId format
  if (trailId.length < 10 || trailId.length > 30) {
    return NextResponse.json({ error: "Invalid trailId format" }, { status: 400 });
  }

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

    // Verify trail exists
    const trail = await prisma.trail.findUnique({
      where: { id: trailId },
      select: { id: true },
    });

    if (!trail) {
      return NextResponse.json({ error: "Trail not found" }, { status: 404 });
    }

    const rides = await prisma.ride.findMany({
      where: {
        trails: {
          some: { trailId },
        },
      },
      include: {
        host: {
          select: { id: true, name: true },
        },
        attendees: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        trails: {
          include: {
            trail: { select: { id: true, name: true, difficulty: true } },
          },
        },
      },
      orderBy: { date: "asc" },
      take: 100, // Limit results to prevent DoS
    });

    const response = NextResponse.json(rides);
    response.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString());
    response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString());
    response.headers.set("X-RateLimit-Reset", rateLimitResult.reset.toString());
    
    return response;
  } catch (error) {
    console.error("[GET_RIDES_BY_TRAIL]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
