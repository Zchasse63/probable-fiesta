/**
 * Persistent rate limiter using filesystem or database
 * Survives server restarts to prevent rate limit bypass
 */

import { createClient } from '@/lib/supabase/server';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check if a user has exceeded the rate limit using database persistence
 * @param userId User ID to check
 * @param maxRequests Maximum requests per window (default: 10)
 * @param windowMs Window duration in milliseconds (default: 60000 = 1 minute)
 * @returns Rate limit result
 */
export async function checkRateLimitPersistent(
  userId: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): Promise<RateLimitResult> {
  const now = Date.now();
  const supabase = await createClient();

  try {
    // Query rate limit entries from database
    const { data: entries, error } = await supabase
      .from('rate_limit_entries')
      .select('*')
      .eq('user_id', userId)
      .gt('reset_at', now)
      .order('created_at', { ascending: false });

    if (error) {
      // Fallback to allowing request on DB error
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetAt: now + windowMs,
      };
    }

    const validEntries = entries?.filter(e => e.reset_at > now) || [];
    const currentCount = validEntries.length;

    if (currentCount >= maxRequests) {
      const oldestEntry = validEntries[validEntries.length - 1];
      return {
        allowed: false,
        remaining: 0,
        resetAt: oldestEntry.reset_at,
      };
    }

    // Insert new rate limit entry
    await supabase.from('rate_limit_entries').insert({
      user_id: userId,
      reset_at: now + windowMs,
      created_at: now,
    });

    return {
      allowed: true,
      remaining: maxRequests - currentCount - 1,
      resetAt: now + windowMs,
    };
  } catch {
    // Fallback to allowing request on error
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    };
  }
}

/**
 * Cleanup expired rate limit entries (run periodically)
 */
export async function cleanupExpiredRateLimits() {
  const supabase = await createClient();
  const now = Date.now();

  try {
    await supabase
      .from('rate_limit_entries')
      .delete()
      .lt('reset_at', now);
  } catch {
    // Silent failure
  }
}
