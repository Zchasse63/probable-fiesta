import { NextResponse } from 'next/server';
import { isAnthropicConfigured } from '@/lib/anthropic/client';
import { persistentCircuitBreaker } from '@/lib/anthropic/circuit-breaker-persistent';

/**
 * AI Health Check Endpoint
 * Returns 200 if AI features are available, 503 if unavailable
 * Used by client-side components to check circuit breaker state before AI calls
 */
export async function GET() {
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
