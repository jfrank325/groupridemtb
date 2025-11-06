import NextAuth, { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { NextResponse } from "next/server";
// import Google from "next-auth/providers/google";
// import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";


export const authOptions: NextAuthOptions = {
  // Only use adapter if we need database sessions, but we're using JWT strategy
  // adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          // Rate limiting is handled at the API route level
          // This prevents brute force attacks on login

          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          });
          
          if (!user || !user.passwordHash) {
            return null;
          }

          const isValid = await bcrypt.compare(
            String(credentials.password),
            user.passwordHash
          );
          
          return isValid ? user : null;
        } catch (error) {
          console.error("[AUTHORIZE_ERROR]", error);
          // Return null on error to prevent leaking information
          return null;
        }
      },
    }),
  ],
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: any }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).email = token.email as string;
      }
      return session;
    },
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" 
        ? "__Secure-next-auth.session-token" 
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production", // HTTPS only in production
      },
    },
  },
  // Enable CSRF protection
  useSecureCookies: process.env.NODE_ENV === "production",
};

// Wrap the handler with rate limiting
import { authLimiter, getRateLimitIdentifier, checkRateLimit } from "@/lib/rate-limit";

// Validate required environment variables
if (!process.env.NEXTAUTH_SECRET) {
  console.error("NEXTAUTH_SECRET is not set!");
}

const handler = NextAuth(authOptions);

async function handleAuthRequest(
  req: Request,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  try {
    // Rate limit authentication attempts
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = await checkRateLimit(authLimiter, identifier);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many authentication attempts. Please try again later." },
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

    // Extract route params and pass to NextAuth handler
    const params = await context.params;
    return await handler(req, { params });
  } catch (error) {
    console.error("[NEXTAUTH_ERROR]", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { 
        error: "Authentication error",
        message: errorMessage
      },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  return handleAuthRequest(req, context);
}

export async function POST(
  req: Request,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  return handleAuthRequest(req, context);
}





