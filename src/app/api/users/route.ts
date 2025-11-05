import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { generalLimiter, getRateLimitIdentifier, checkRateLimit } from "@/lib/rate-limit";

// GET all users (for messaging)
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

    // Get query parameters for pagination
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 100); // Max 100
    const offset = parseInt(searchParams.get("offset") || "0");
    const search = searchParams.get("search")?.trim().slice(0, 100); // Limit search length

    // Build where clause
    const where: any = {
      id: {
        not: user.id,
      },
    };

    // Add search filter if provided
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get all users except the current user
    // Don't expose email addresses for privacy
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        // Email removed for privacy - only include if absolutely necessary
      },
      orderBy: {
        name: "asc",
      },
      take: limit,
      skip: offset,
    });

    const response = NextResponse.json(users);
    response.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString());
    response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString());
    response.headers.set("X-RateLimit-Reset", rateLimitResult.reset.toString());
    
    return response;
  } catch (error) {
    console.error("[GET_USERS]", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
