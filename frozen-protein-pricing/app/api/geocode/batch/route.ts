import { NextRequest, NextResponse } from 'next/server';
import { geocodeAddress } from '@/lib/mapbox/geocode';
import { createClient } from '@/lib/supabase/server';
import { geocodeRateLimiter } from '../rate-limiter';

// Mapbox Geocoding API rate limit: 600 requests per minute
// Implementation: Process one request every 100ms = 10 req/sec = 600 req/min
// This sequential approach with 100ms delay ensures we stay under the limit
const REQUEST_DELAY = 100; // milliseconds between each request

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { addresses } = body;

    if (!addresses || !Array.isArray(addresses)) {
      return NextResponse.json(
        { error: 'Addresses array is required' },
        { status: 400 }
      );
    }

    // Enforce maximum batch size for geocoding
    if (addresses.length > 1000) {
      return NextResponse.json(
        { error: 'Geocoding batch too large (max 1000 addresses)' },
        { status: 400 }
      );
    }

    // Check rate limit for batch operations
    // Batch geocoding counts as number of addresses against user's rate limit
    const initialRemaining = geocodeRateLimiter.getRemaining(user.id);
    if (addresses.length > initialRemaining) {
      return NextResponse.json(
        {
          error: `Batch size exceeds rate limit. ${initialRemaining} requests remaining in current window.`,
          remaining: initialRemaining,
        },
        { status: 429 }
      );
    }

    const results: Array<{
      address: string;
      latitude?: number;
      longitude?: number;
      confidence?: number;
      error?: string;
    }> = [];

    // Process addresses sequentially with 100ms delay between each request
    // This achieves 10 requests/second (1000ms / 100ms = 10 req/sec)
    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i];

      // Decrement user's rate limit counter
      if (!geocodeRateLimiter.check(user.id)) {
        // Should not happen due to pre-check, but handle gracefully
        results.push({
          address,
          error: 'Rate limit exceeded during batch processing',
        });
        continue;
      }

      try {
        const result = await geocodeAddress(address);
        results.push({
          address,
          ...result,
        });
      } catch (error) {
        results.push({
          address,
          error: error instanceof Error ? error.message : 'Geocoding failed',
        });
      }

      // Delay before next request (except for last address)
      if (i < addresses.length - 1) {
        await delay(REQUEST_DELAY);
      }
    }

    const remainingRequests = geocodeRateLimiter.getRemaining(user.id);
    return NextResponse.json(results, {
      headers: {
        'X-RateLimit-Remaining': remainingRequests.toString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Batch geocoding failed' },
      { status: 500 }
    );
  }
}
