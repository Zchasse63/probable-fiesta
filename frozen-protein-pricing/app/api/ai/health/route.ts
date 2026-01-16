import { NextResponse } from 'next/server';
import { isAnthropicConfigured } from '@/lib/anthropic/client';
import { persistentCircuitBreaker } from '@/lib/anthropic/circuit-breaker-persistent';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/utils/rate-limiter';

/**
 * AI Health Check Endpoint
 * Returns 200 if AI features are available, 503 if unavailable
 * Used by client-side components to check circuit breaker state before AI calls
 * SECURITY: Requires authentication to prevent attackers from detecting degraded system state
 */
export async function GET() {
  // SECURITY: Authenticate user first
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Rate limiting: 60 requests per minute per user
  const rateLimitResult = checkRateLimit(user.id, 60, 60000);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateLimitResult.resetAt).toISOString(),
        },
      }
    );
  }

  // Check if Anthropic API is configured
  if (!isAnthropicConfigured()) {
    return NextResponse.json(
      { available: false, reason: 'API key not configured' },
      { status: 503 }
    );
  }

  // Check if circuit breaker is open (service degraded due to failures)
  if (await persistentCircuitBreaker.isOpen()) {
    return NextResponse.json(
      { available: false, reason: 'Service temporarily unavailable (circuit breaker open)' },
      { status: 503 }
    );
  }

  return NextResponse.json({ available: true }, { status: 200 });
}
