/**
 * Rate limiter for geocoding API endpoints
 * Mapbox limit: 600 requests per minute per token
 * Per-user rate limiting prevents API quota exhaustion
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if user has exceeded rate limit
   * @param userId - User identifier
   * @returns true if request allowed, false if rate limited
   */
  check(userId: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(userId);

    if (!entry || now > entry.resetTime) {
      // Create new window
      this.limits.set(userId, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  /**
   * Get remaining requests for user
   */
  getRemaining(userId: string): number {
    const now = Date.now();
    const entry = this.limits.get(userId);

    if (!entry || now > entry.resetTime) {
      return this.maxRequests;
    }

    return Math.max(0, this.maxRequests - entry.count);
  }

  /**
   * Get reset time for user's rate limit window
   */
  getResetTime(userId: string): number | null {
    const entry = this.limits.get(userId);
    return entry?.resetTime || null;
  }

  /**
   * Clean up expired entries (call periodically)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [userId, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(userId);
      }
    }
  }
}

// Singleton instance: 10 geocode requests per user per minute
export const geocodeRateLimiter = new RateLimiter(10, 60000);

// Cleanup expired entries every 5 minutes
setInterval(() => geocodeRateLimiter.cleanup(), 5 * 60 * 1000);
