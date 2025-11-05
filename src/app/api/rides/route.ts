import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generalLimiter, getRateLimitIdentifier, checkRateLimit } from "@/lib/rate-limit";

export async function GET(req: Request) {
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

    try {
      const rides = await prisma.ride.findMany({
        where: {
          date: {
            gt: new Date(), // Only get rides in the future
          },
        },
        orderBy: { date: "asc" },
        include: {
          trails: {
            include: {
              trail: {
                include: {
                  trailSystem: true, // include trailSystem
                },
              },
            },
          },
          host: true,
          attendees: true,
        },
      });

      const response = NextResponse.json(rides);
      response.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString());
      response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString());
      response.headers.set("X-RateLimit-Reset", rateLimitResult.reset.toString());
      
      return response;
    } catch (error) {
      console.error("Error fetching rides:", error);
      return NextResponse.json(
        { error: "Failed to fetch rides" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[GET_RIDES]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
