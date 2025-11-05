import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET all messages for a specific ride
export async function GET(
  req: Request,
  { params }: { params: Promise<{ rideId: string }> }
) {
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

    const { rideId } = await params;

    // Get all messages for this ride, ordered by most recent
    const messages = await prisma.message.findMany({
      where: {
        rideId: rideId,
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
        createdAt: "asc",
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("[GET_RIDE_MESSAGES]", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}
