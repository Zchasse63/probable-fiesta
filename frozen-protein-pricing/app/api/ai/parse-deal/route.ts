import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientFromRequest } from '@/lib/supabase/server';
import { parseDealEmail } from '@/lib/anthropic/parsers';
import { logUsage } from '@/lib/anthropic/utils';
import { isAnthropicConfigured } from '@/lib/anthropic/client';
import { checkRateLimit } from '@/lib/utils/rate-limiter';
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
    const { content } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request. "content" field is required.' },
        { status: 400 }
      );
    }

    if (content.length > 20000) {
      return NextResponse.json(
        { error: 'Content too long. Maximum 20,000 characters.' },
        { status: 400 }
      );
    }

    const result = await parseDealEmail(content);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to parse deal from content. Please try again.' },
        { status: 500 }
      );
    }

    // Validate all required fields and business logic constraints
    const parsedDeal = result.deal;

    if (!parsedDeal.manufacturer || !parsedDeal.product_description || !parsedDeal.pack_size) {
      return NextResponse.json(
        { error: 'Missing required fields in parsed deal' },
        { status: 400 }
      );
    }

    if (typeof parsedDeal.price_per_lb !== 'number' || parsedDeal.price_per_lb <= 0 || parsedDeal.price_per_lb > 10000) {
      return NextResponse.json(
        { error: 'Invalid price_per_lb. Must be between 0 and 10,000.' },
        { status: 400 }
      );
    }

    if (typeof parsedDeal.quantity_lbs !== 'number' || parsedDeal.quantity_lbs <= 0 || parsedDeal.quantity_lbs > 1000000) {
      return NextResponse.json(
        { error: 'Invalid quantity_lbs. Must be between 0 and 1,000,000.' },
        { status: 400 }
      );
    }

    if (parsedDeal.expiration_date && !/^\d{4}-\d{2}-\d{2}$/.test(parsedDeal.expiration_date)) {
      return NextResponse.json(
        { error: 'Invalid expiration_date format. Must be YYYY-MM-DD.' },
        { status: 400 }
      );
    }

    // Insert parsed deal into database
    const { data: deal, error: insertError } = await supabase
      .from('manufacturer_deals')
      .insert({
        user_id: user.id,
        manufacturer: parsedDeal.manufacturer,
        product_description: parsedDeal.product_description,
        price_per_lb: parsedDeal.price_per_lb,
        quantity_lbs: parsedDeal.quantity_lbs,
        pack_size: parsedDeal.pack_size,
        expiration_date: parsedDeal.expiration_date || null,
        deal_terms: parsedDeal.deal_terms || null,
        status: 'pending',
        raw_content: content,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to save parsed deal to database.' },
        { status: 500 }
      );
    }

    // Log AI usage
    await logUsage(supabase, 'parse_deal', {
      model: result.model,
      usage: result.tokens_used,
      success: true,
    });

    return NextResponse.json({
      deal,
      dealId: deal.id,
      tokens_used: result.tokens_used,
    });
  } catch (error: unknown) {
    await logUsage(supabase, 'parse_deal', {
      model: 'unknown',
      usage: { input_tokens: 0, output_tokens: 0 },
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to process deal parsing request. Please try again.' },
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
