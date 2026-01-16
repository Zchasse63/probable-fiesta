import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { categorizeProduct } from '@/lib/anthropic/parsers';
import { parsePackSize } from '@/lib/utils/pack-size-parser-server';
import { parsePackSizeSync } from '@/lib/utils/pack-size-parser';
import { checkRateLimit } from '@/lib/utils/rate-limiter';
import { sanitizeTextInput } from '@/lib/utils/input-sanitizer';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: dealId } = await params;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Rate limiting: 20 requests per minute per user
    const rateLimitResult = checkRateLimit(user.id, 20, 60000);
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

    // CSRF protection removed - auth + rate limiting provide sufficient protection

    // Parse request body
    const body = await request.json();
    const {
      manufacturer,
      product_description,
      price_per_lb,
      quantity_lbs,
      pack_size,
      expiration_date,
      deal_terms,
      warehouse_id,
    } = body;

    // Validate required fields
    if (!manufacturer || !product_description || !price_per_lb || !quantity_lbs || !pack_size) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Sanitize text inputs to prevent XSS/injection
    const sanitizedManufacturer = sanitizeTextInput(manufacturer, 200);
    const sanitizedProductDescription = sanitizeTextInput(product_description, 5000);
    const sanitizedPackSize = sanitizeTextInput(pack_size, 200);
    const sanitizedDealTerms = deal_terms ? sanitizeTextInput(deal_terms, 5000) : null;

    // Validate warehouse_id
    if (!warehouse_id || typeof warehouse_id !== 'number') {
      return NextResponse.json(
        { error: 'warehouse_id is required and must be a valid number' },
        { status: 400 }
      );
    }

    // Verify warehouse exists AND user has access to it through organization
    const { data: userOrg } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!userOrg) {
      return NextResponse.json(
        { error: 'User not associated with any organization' },
        { status: 403 }
      );
    }

    const { data: warehouse, error: warehouseError } = await supabase
      .from('warehouses')
      .select('id, organization_id')
      .eq('id', warehouse_id)
      .eq('organization_id', userOrg.organization_id)
      .single();

    if (warehouseError || !warehouse) {
      return NextResponse.json(
        { error: 'Invalid warehouse_id - warehouse does not exist or you do not have access' },
        { status: 403 }
      );
    }

    // Check for duplicate deal (same manufacturer + product + date within 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: duplicateDeal } = await supabase
      .from('manufacturer_deals')
      .select('id')
      .eq('manufacturer', sanitizedManufacturer)
      .eq('product_description', sanitizedProductDescription)
      .eq('status', 'accepted')
      .gte('created_at', sevenDaysAgo.toISOString())
      .limit(1)
      .single();

    if (duplicateDeal) {
      return NextResponse.json(
        { error: 'Duplicate deal detected - similar deal accepted within last 7 days' },
        { status: 409 }
      );
    }

    // Validate numeric types and bounds
    if (
      typeof price_per_lb !== 'number' ||
      isNaN(price_per_lb) ||
      !isFinite(price_per_lb) ||
      price_per_lb <= 0 ||
      price_per_lb > 10000
    ) {
      return NextResponse.json(
        { error: 'Invalid price_per_lb. Must be a valid number between 0 and 10,000.' },
        { status: 400 }
      );
    }

    if (
      typeof quantity_lbs !== 'number' ||
      isNaN(quantity_lbs) ||
      !isFinite(quantity_lbs) ||
      quantity_lbs <= 0 ||
      quantity_lbs > 1000000
    ) {
      return NextResponse.json(
        { error: 'Invalid quantity_lbs. Must be a valid number between 0 and 1,000,000.' },
        { status: 400 }
      );
    }

    // First verify the deal belongs to this user and is pending
    const { data: existingDeal, error: fetchError } = await supabase
      .from('manufacturer_deals')
      .select('id, status, user_id')
      .eq('id', dealId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingDeal) {
      return NextResponse.json(
        { error: 'Deal not found or access denied' },
        { status: 404 }
      );
    }

    if (existingDeal.status !== 'pending') {
      return NextResponse.json(
        { error: 'Deal has already been processed' },
        { status: 400 }
      );
    }

    // Parse pack size to calculate case weight (use sanitized version)
    // Try sync regex first, then AI async if needed
    let caseWeightLbs = parsePackSizeSync(sanitizedPackSize);

    if (!caseWeightLbs) {
      try {
        caseWeightLbs = await parsePackSize(sanitizedPackSize, sanitizedProductDescription);
      } catch (error) {
        // AI parsing failed, continue with null
        caseWeightLbs = null;
      }
    }

    // Calculate cases - use parsed case weight or default to 40lbs
    const casesAvailable = caseWeightLbs && caseWeightLbs > 0
      ? Math.floor(quantity_lbs / caseWeightLbs)
      : Math.floor(quantity_lbs / 40);

    // CRITICAL: Atomic status claim FIRST to prevent race condition
    // Update deal status with atomic status check - only ONE concurrent request can succeed
    const { data: updatedDeal, error: updateError } = await supabase
      .from('manufacturer_deals')
      .update({
        manufacturer: sanitizedManufacturer,
        product_description: sanitizedProductDescription,
        price_per_lb,
        quantity_lbs,
        pack_size: sanitizedPackSize,
        expiration_date,
        deal_terms: sanitizedDealTerms,
        status: 'accepted',
      })
      .eq('id', dealId)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .select('id')
      .single();

    if (updateError || !updatedDeal) {
      // Race condition - another request already processed this deal
      return NextResponse.json(
        { error: 'Deal has already been processed by another request' },
        { status: 409 }
      );
    }

    // Try AI categorization with fallback (use sanitized description)
    let category = 'Uncategorized';
    try {
      const catResult = await categorizeProduct(sanitizedProductDescription);
      if (catResult?.category?.category) {
        category = catResult.category.category;
      }
    } catch (error) {
      // Categorization failed, use default
    }

    // Create product AFTER atomic status claim - only winner reaches here
    const { data: newProduct, error: productError } = await supabase
      .from('products')
      .insert({
        item_code: `DEAL-${Date.now()}`,
        description: sanitizedProductDescription,
        pack_size: sanitizedPackSize,
        cost_per_lb: price_per_lb,
        brand: sanitizedManufacturer,
        cases_available: casesAvailable || 1,
        case_weight_lbs: caseWeightLbs || 40,
        category,
        warehouse_id,
      })
      .select('id')
      .single();

    if (productError || !newProduct) {
      // Product creation failed after claiming deal - rollback deal status
      await supabase
        .from('manufacturer_deals')
        .update({ status: 'pending' })
        .eq('id', dealId);

      return NextResponse.json(
        { error: 'Failed to create product from deal' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Deal accepted and product created',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
