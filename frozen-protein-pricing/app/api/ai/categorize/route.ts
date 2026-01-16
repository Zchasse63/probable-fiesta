import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientFromRequest } from '@/lib/supabase/server';
import { categorizeProduct } from '@/lib/anthropic/parsers';
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
    const { description } = await request.json();

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request. "description" field is required.' },
        { status: 400 }
      );
    }

    if (description.length > 500) {
      return NextResponse.json(
        { error: 'Description too long. Maximum 500 characters.' },
        { status: 400 }
      );
    }

    // Sanitize input to prevent prompt injection
    const sanitizedDescription = sanitizeTextInput(description, 500);

    const result = await categorizeProduct(sanitizedDescription);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to categorize product. Please try again.' },
        { status: 500 }
      );
    }

    // Log AI usage
    await logUsage(supabase, 'categorize_product', {
      model: result.model,
      usage: result.tokens_used,
      success: true,
    });

    return NextResponse.json({
      category: result.category.category,
      subcategory: result.category.subcategory,
      is_frozen: result.category.is_frozen,
      is_raw: result.category.is_raw,
      tokens_used: result.tokens_used,
    });
  } catch (error: unknown) {
    // Log detailed error server-side for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AI Categorize] Error:', {
      error_message: errorMessage,
      user_id: user.id.substring(0, 8) + '...',
    });

    await logUsage(supabase, 'categorize_product', {
      model: 'unknown',
      usage: { input_tokens: 0, output_tokens: 0 },
      success: false,
      errorMessage: errorMessage,
    });

    // Generic error for client - don't expose circuit breaker state
    return NextResponse.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
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
