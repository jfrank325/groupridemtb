import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const trails = await prisma.trail.findMany({
      include: {
        trailSystem: true,
        rides: {
          include: {  
            ride: {
              select: { id: true, date: true },
            },
          },
        },
      },
    });



    return NextResponse.json(trails);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch trails" }, { status: 500 });
  }
}
