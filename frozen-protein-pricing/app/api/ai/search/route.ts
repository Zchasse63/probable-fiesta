import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientFromRequest } from '@/lib/supabase/server';
import { parseSearchQuery } from '@/lib/anthropic/parsers';
import { logUsage } from '@/lib/anthropic/utils';
import { isAnthropicConfigured } from '@/lib/anthropic/client';
import { checkRateLimit } from '@/lib/utils/rate-limiter';
import { sanitizeTextInput } from '@/lib/utils/input-sanitizer';
import { validateCORS, addCORSHeaders } from '@/lib/utils/cors';

async function handlePOST(request: NextRequest) {
  // CORS validation
  if (!validateCORS(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Try Bearer token first (for API clients), fall back to cookies (for browser)
  let supabase = createClientFromRequest(request);
  let user;

  if (supabase) {
    const { data: { user: apiUser }, error: apiAuthError } = await supabase.auth.getUser();
    if (apiAuthError || !apiUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    user = apiUser;
  } else {
    // Fall back to cookie-based auth for browser requests
    supabase = await createClient();
    const { data: { user: cookieUser }, error: cookieAuthError } = await supabase.auth.getUser();
    if (cookieAuthError || !cookieUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    user = cookieUser;
  }

  // Rate limiting: 10 requests per minute per user
  const rateLimitResult = checkRateLimit(user.id, 10, 60000);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateLimitResult.resetAt).toISOString(),
        },
      }
    );
  }

  if (!isAnthropicConfigured()) {
    return NextResponse.json(
      { error: 'AI features are not configured. Please set ANTHROPIC_API_KEY.' },
      { status: 503 }
    );
  }

  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request. "query" field is required.' },
        { status: 400 }
      );
    }

    if (query.length > 500) {
      return NextResponse.json(
        { error: 'Query too long. Maximum 500 characters.' },
        { status: 400 }
      );
    }

    // Sanitize input to prevent prompt injection
    const sanitizedQuery = sanitizeTextInput(query, 500);

    const result = await parseSearchQuery(sanitizedQuery);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to parse search query. Please try again.' },
        { status: 500 }
      );
    }

    // Log AI usage
    await logUsage(supabase, 'search_query', {
      model: result.model,
      usage: result.tokens_used,
      success: true,
    });

    // Filters already validated in parseSearchQuery parser
    return NextResponse.json({
      filters: result.filters,
      explanation: result.explanation,
      tokens_used: result.tokens_used,
    });
  } catch (error: unknown) {

    await logUsage(supabase, 'search_query', {
      model: 'unknown',
      usage: { input_tokens: 0, output_tokens: 0 },
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    // Sanitize error message to avoid exposing internal details
    return NextResponse.json(
      { error: 'Failed to process search query. Please try again.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const response = await handlePOST(request);
  return addCORSHeaders(response, request);
}

export async function OPTIONS(request: NextRequest) {
  return addCORSHeaders(new NextResponse(null, { status: 204 }), request);
}
