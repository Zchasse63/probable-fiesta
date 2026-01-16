import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientFromRequest } from '@/lib/supabase/server';
import { parsePackSize } from '@/lib/anthropic/parsers';
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
    const { packSize, description } = await request.json();

    if (!packSize || typeof packSize !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request. "packSize" field is required.' },
        { status: 400 }
      );
    }

    if (packSize.length > 200) {
      return NextResponse.json(
        { error: 'Pack size string too long. Maximum 200 characters.' },
        { status: 400 }
      );
    }

    // Sanitize input to prevent prompt injection
    const sanitizedPackSize = sanitizeTextInput(packSize, 200);
    const sanitizedDescription = description ? sanitizeTextInput(description, 500) : undefined;

    const result = await parsePackSize(sanitizedPackSize, sanitizedDescription);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to parse pack size. Please try again.' },
        { status: 500 }
      );
    }

    // Log AI usage
    await logUsage(supabase, 'parse_pack_size', {
      model: result.model,
      usage: result.tokens_used,
      success: true,
    });

    return NextResponse.json({
      case_weight_lbs: result.case_weight_lbs,
      tokens_used: result.tokens_used,
    });
  } catch (error: unknown) {
    await logUsage(supabase, 'parse_pack_size', {
      model: 'unknown',
      usage: { input_tokens: 0, output_tokens: 0 },
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    // Sanitize error message to avoid exposing internal details
    return NextResponse.json(
      { error: 'Failed to process pack size parsing. Please try again.' },
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
