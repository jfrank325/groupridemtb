import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Redis client (works with Upstash Redis)
// For local development or if not using Upstash, you can use an in-memory store
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Rate limiter for general API endpoints (10 requests per 10 seconds)
export const generalLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "10 s"),
      analytics: true,
    })
  : null;

// Rate limiter for authentication endpoints (5 requests per minute)
export const authLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      analytics: true,
    })
  : null;

// Rate limiter for message sending (20 requests per minute)
export const messageLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 m"),
      analytics: true,
    })
  : null;

// Rate limiter for ride creation (5 requests per minute)
export const rideLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      analytics: true,
    })
  : null;

// Helper function to get identifier for rate limiting
export function getRateLimitIdentifier(request: Request): string {
  // Try to get IP from headers (works with most proxies)
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : request.headers.get("x-real-ip");
  
  // Fallback to a default identifier if IP not available
  // In production, you should always have IP available
  return ip || "anonymous";
}

// Helper function to check rate limit
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  if (!limiter) {
    // If Redis is not configured, allow all requests (for local development)
    // In production, you should always have rate limiting enabled
    console.warn("Rate limiting disabled: Redis not configured");
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  }

  const result = await limiter.limit(identifier);
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}
