import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { generatePasswordResetToken } from "@/lib/passwordReset";
import { renderPasswordResetEmail } from "@/lib/emailTemplates";
import { sendPasswordResetEmail } from "@/lib/mailgun";
import {
  checkRateLimit,
  generalLimiter,
  getRateLimitIdentifier,
} from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
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
        },
      );
    }

    const body = await req.json().catch(() => null);
    const email: string | null =
      body && typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : null;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      const response = NextResponse.json({ success: true });
      response.headers.set(
        "X-RateLimit-Limit",
        rateLimitResult.limit.toString(),
      );
      response.headers.set(
        "X-RateLimit-Remaining",
        rateLimitResult.remaining.toString(),
      );
      response.headers.set(
        "X-RateLimit-Reset",
        rateLimitResult.reset.toString(),
      );
      return response;
    }

    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
      },
    });

    const { token, tokenHash, expiresAt, maxAgeMinutes } =
      generatePasswordResetToken();

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
      req.nextUrl.origin.replace(/\/$/, "");
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    const emailHtml = renderPasswordResetEmail({
      recipientName: user.name,
      resetUrl,
      expiresMinutes: maxAgeMinutes,
    });

    await sendPasswordResetEmail({
      to: user.email,
      subject: "Reset your MTB Group Ride password",
      html: emailHtml,
    });

    const response = NextResponse.json({ success: true });
    response.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString());
    response.headers.set(
      "X-RateLimit-Remaining",
      rateLimitResult.remaining.toString(),
    );
    response.headers.set(
      "X-RateLimit-Reset",
      rateLimitResult.reset.toString(),
    );
    return response;
  } catch (error) {
    console.error("[FORGOT_PASSWORD]", error);
    return NextResponse.json(
      { error: "Unable to process request." },
      { status: 500 },
    );
  }
}

