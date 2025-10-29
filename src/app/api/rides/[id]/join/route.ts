import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

interface Params {
  id: string;
}

export async function PUT(req: Request, { params }: { params: Params }) {
  const rideId = params.id;
  if (!rideId) return NextResponse.json({ error: "Missing rideId" }, { status: 400 });

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

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
      host: true,
      attendees: { include: { user: true } },
      trails: { include: { trail: true } },
    },
  });

  return NextResponse.json(updatedRide);
}
