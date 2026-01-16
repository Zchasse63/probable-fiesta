/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * POST /api/pricing/calculate
 * Calculate delivered prices for products in a zone
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { calculateDeliveredPrice } from '@/lib/utils/price-calculator';

interface CalculateRequest {
  zoneId: number;
  productIds: string[];
  margins: Record<string, number>; // productId -> margin percent
}

interface PriceItem {
  productId: string;
  itemCode: string;
  description: string;
  packSize: string;
  brand: string;
  warehouseId: number;
  casesAvailable: number;
  costPerLb: number;
  marginPercent: number;
  marginAmount: number;
  freightPerLb: number;
  deliveredPriceLb: number;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: CalculateRequest = await request.json();

    // Validate request
    if (!body.zoneId) {
      return NextResponse.json(
        { error: 'zoneId is required' },
        { status: 400 }
      );
    }

    if (!body.productIds || body.productIds.length === 0) {
      return NextResponse.json(
        { error: 'productIds array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (!body.margins || typeof body.margins !== 'object') {
      return NextResponse.json(
        { error: 'margins object is required' },
        { status: 400 }
      );
    }

    // Validate margin percentages
    for (const [productId, margin] of Object.entries(body.margins)) {
      if (margin < 0 || margin > 100) {
        return NextResponse.json(
          { error: `Margin for product ${productId} must be between 0 and 100` },
          { status: 400 }
        );
      }
    }

    // Fetch products - Type assertion for Supabase SSR type inference
    const { data: products, error: productsError } = (await supabase
      .from('products')
      .select('id, item_code, description, pack_size, brand, warehouse_id, cases_available, cost_per_lb')
      .in('id', body.productIds)) as any;

    if (productsError) {
      throw productsError;
    }

    if (!products || products.length === 0) {
      return NextResponse.json(
        { error: 'No products found' },
        { status: 404 }
      );
    }

    // Get unique warehouse IDs
    const warehouseIds = [...new Set(products.map((p: any) => p.warehouse_id))];

    // Fetch freight rates for this zone and warehouses - Type assertion for Supabase SSR type inference
    const { data: freightRates, error: freightError } = (await supabase
      .from('freight_rates')
      .select('origin_warehouse_id, rate_per_lb, valid_until')
      .eq('destination_zone_id', body.zoneId)
      .in('origin_warehouse_id', warehouseIds)
      .gte('valid_until', new Date().toISOString())
      .order('created_at', { ascending: false })) as any;

    if (freightError) {
      throw freightError;
    }

    // Create warehouse -> rate map (use most recent valid rate per warehouse)
    const warehouseRateMap = new Map<number, number>();
    if (freightRates) {
      for (const rate of freightRates) {
        if (!warehouseRateMap.has(rate.origin_warehouse_id)) {
          warehouseRateMap.set(rate.origin_warehouse_id, rate.rate_per_lb);
        }
      }
    }

    // Calculate prices for each product
    const items: PriceItem[] = [];
    const missingRates: number[] = [];

    for (const product of products) {
      const freightPerLb = warehouseRateMap.get(product.warehouse_id);

      if (freightPerLb === undefined) {
        missingRates.push(product.warehouse_id);
        continue;
      }

      const marginPercent = body.margins[product.id] || 15.0; // Default 15%
      const costPerLb = product.cost_per_lb || 0;

      const deliveredPrice = calculateDeliveredPrice(
        costPerLb,
        marginPercent,
        freightPerLb
      );

      items.push({
        productId: product.id,
        itemCode: product.item_code,
        description: product.description,
        packSize: product.pack_size,
        brand: product.brand,
        warehouseId: product.warehouse_id,
        casesAvailable: product.cases_available,
        costPerLb: deliveredPrice.costPerLb,
        marginPercent,
        marginAmount: deliveredPrice.marginAmount,
        freightPerLb: deliveredPrice.freightPerLb,
        deliveredPriceLb: deliveredPrice.total
      });
    }

    const response: any = { items };

    if (missingRates.length > 0) {
      response.warning = `Missing freight rates for warehouses: ${[...new Set(missingRates)].join(', ')}`;
    }

    return NextResponse.json(response);

  } catch (error) {
    // Log error details for debugging (development only)
    if (process.env.NODE_ENV === 'development') {
      console.error('Price calculation error:', error);
    }
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
