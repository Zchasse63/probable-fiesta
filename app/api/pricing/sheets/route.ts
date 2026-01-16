/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * GET /api/pricing/sheets - List price sheets
 * POST /api/pricing/sheets - Create new price sheet
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { calculateDeliveredPrice } from '@/lib/utils/price-calculator';

interface CreateSheetRequest {
  zoneId: number;
  weekStart: string; // YYYY-MM-DD
  weekEnd: string;   // YYYY-MM-DD
  productIds: string[];
  margins: Record<string, number>; // productId -> margin percent
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get('zoneId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const supabase = await createServerClient();

    let query = supabase
      .from('price_sheets')
      .select('*, zones(name, code)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (zoneId) {
      query = query.eq('zone_id', parseInt(zoneId));
    }

    if (status) {
      query = query.eq('status', status);
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      sheets: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('List price sheets error:', error);
    }
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateSheetRequest = await request.json();

    // Validate request
    if (!body.zoneId) {
      return NextResponse.json({ error: 'zoneId is required' }, { status: 400 });
    }

    if (!body.weekStart || !body.weekEnd) {
      return NextResponse.json({ error: 'weekStart and weekEnd are required' }, { status: 400 });
    }

    if (!body.productIds || body.productIds.length === 0) {
      return NextResponse.json({ error: 'productIds array is required' }, { status: 400 });
    }

    const supabase = await createServerClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch products
    const { data: products, error: productsError } = await (supabase
      .from('products') as any)
      .select('id, item_code, description, pack_size, brand, warehouse_id, cases_available, cost_per_lb')
      .in('id', body.productIds);

    if (productsError) {
      throw productsError;
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ error: 'No products found' }, { status: 404 });
    }

    // Get warehouse IDs
    const warehouseIds = [...new Set(products.map((p: any) => p.warehouse_id))] as number[];

    // Fetch freight rates
    const { data: freightRates, error: freightError } = await (supabase
      .from('freight_rates') as any)
      .select('origin_warehouse_id, rate_per_lb')
      .eq('destination_zone_id', body.zoneId)
      .in('origin_warehouse_id', warehouseIds as any)
      .gte('valid_until', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (freightError) {
      throw freightError;
    }

    // Create warehouse rate map
    const warehouseRateMap = new Map<number, number>();
    if (freightRates) {
      for (const rate of freightRates as any[]) {
        if (!warehouseRateMap.has(rate.origin_warehouse_id)) {
          warehouseRateMap.set(rate.origin_warehouse_id, rate.rate_per_lb);
        }
      }
    }

    // Check if all warehouses have rates
    const missingRates = warehouseIds.filter(wid => !warehouseRateMap.has(wid));
    if (missingRates.length > 0) {
      return NextResponse.json(
        { error: `Missing freight rates for warehouses: ${missingRates.join(', ')}. Please calibrate rates first.` },
        { status: 400 }
      );
    }

    // Create price sheet
    const { data: priceSheet, error: sheetError } = await (supabase
      .from('price_sheets') as any)
      .insert({
        zone_id: body.zoneId,
        week_start: body.weekStart,
        week_end: body.weekEnd,
        status: 'draft',
        user_id: user.id
      })
      .select()
      .single() as any;

    if (sheetError) {
      throw sheetError;
    }

    // Calculate prices and prepare items
    const items = products
      .filter((p: any) => warehouseRateMap.has(p.warehouse_id))
      .map((product: any) => {
        const freightPerLb = warehouseRateMap.get(product.warehouse_id)!;
        const marginPercent = body.margins[product.id] || 15.0;
        const costPerLb = product.cost_per_lb || 0;

        const deliveredPrice = calculateDeliveredPrice(costPerLb, marginPercent, freightPerLb);

        return {
          price_sheet_id: priceSheet.id,
          product_id: product.id,
          warehouse_id: product.warehouse_id,
          cost_per_lb: deliveredPrice.costPerLb,
          margin_percent: marginPercent,
          margin_amount: deliveredPrice.marginAmount,
          freight_per_lb: deliveredPrice.freightPerLb,
          delivered_price_lb: deliveredPrice.total
        };
      });

    // Bulk insert price sheet items
    const { error: itemsError } = await (supabase
      .from('price_sheet_items') as any)
      .insert(items) as any;

    if (itemsError) {
      // Rollback: delete the price sheet
      await supabase.from('price_sheets').delete().eq('id', priceSheet.id);
      throw itemsError;
    }

    return NextResponse.json({
      id: priceSheet.id,
      zoneId: priceSheet.zone_id,
      weekStart: priceSheet.week_start,
      weekEnd: priceSheet.week_end,
      status: priceSheet.status,
      itemCount: items.length
    }, { status: 201 });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Create price sheet error:', error);
    }
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
