/**
 * In-memory rate limiter for AI API routes
 *
 * LIMITATION: Rate limits reset on server restart. This is acceptable for
 * development but production deployments should use Redis or similar persistent
 * storage to prevent restart-based evasion of rate limits.
 *
 * Limits requests per user per minute
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (entry.resetAt < now) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check if a user has exceeded the rate limit
 * @param userId User ID to check
 * @param maxRequests Maximum requests per window (default: 10)
 * @param windowMs Window duration in milliseconds (default: 60000 = 1 minute)
 * @returns Rate limit result
 */
export function checkRateLimit(
  userId: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): RateLimitResult {
  const now = Date.now();
  const key = `${userId}`;
  const entry = rateLimitMap.get(key);

  // No existing entry or expired - create new
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    };
  }

  // Check if limit exceeded
  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  // Increment count
  entry.count++;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}
