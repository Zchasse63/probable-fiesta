import { NextRequest, NextResponse } from 'next/server';
import { geocodeAddress } from '@/lib/mapbox/geocode';
import { createClient } from '@/lib/supabase/server';
import { geocodeRateLimiter } from './rate-limiter';

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

    // Check rate limit: 10 requests per user per minute
    if (!geocodeRateLimiter.check(user.id)) {
      const resetTime = geocodeRateLimiter.getResetTime(user.id);
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Maximum 10 geocoding requests per minute.',
          resetTime,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetTime?.toString() || '',
          },
        }
      );
    }

    const body = await request.json();
    const { address } = body;

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    const result = await geocodeAddress(address);

    const remaining = geocodeRateLimiter.getRemaining(user.id);
    return NextResponse.json(result, {
      headers: {
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': remaining.toString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Geocoding failed' },
      { status: 500 }
    );
  }
}
