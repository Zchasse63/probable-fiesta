import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generatePriceSheetExcel } from '@/lib/export/excel';
import { checkRateLimit } from '@/lib/utils/rate-limiter';
import { validateCORS, addCORSHeaders } from '@/lib/utils/cors';

async function handlePOST(request: NextRequest) {
  // CORS validation
  if (!validateCORS(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting: 5 exports per minute per user
    const rateLimitResult = checkRateLimit(user.id, 5, 60000);
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

    const { priceSheetId } = await request.json();

    if (!priceSheetId) {
      return NextResponse.json(
        { error: 'priceSheetId is required' },
        { status: 400 }
      );
    }

    // Fetch price sheet with authorization check - verify user owns this price sheet
    const { data: priceSheet, error: sheetError } = await supabase
      .from('price_sheets')
      .select(
        `
        *,
        zone:freight_zones(zone_name, organization_id),
        items:price_sheet_items(
          *,
          product:products(
            item_code,
            description,
            pack_size,
            brand,
            spec_sheet_url,
            warehouse:warehouses(name, organization_id)
          )
        )
      `
      )
      .eq('id', priceSheetId)
      .single();

    // Verify ownership through organization_id check
    if (priceSheet) {
      const { data: userOrg } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      const zoneOrg = (priceSheet.zone as { organization_id?: number })?.organization_id;

      if (!userOrg || zoneOrg !== userOrg.organization_id) {
        return NextResponse.json(
          { error: 'Unauthorized - you do not have access to this price sheet' },
          { status: 403 }
        );
      }
    }

    if (sheetError || !priceSheet) {
      return NextResponse.json(
        { error: 'Price sheet not found' },
        { status: 404 }
      );
    }

    // Enforce product count limit to prevent DoS via large exports
    if (priceSheet.items && priceSheet.items.length > 5000) {
      return NextResponse.json(
        { error: 'Export exceeds maximum product limit (5000). Please filter your price sheet.' },
        { status: 413 }
      );
    }

    // Transform data for Excel export - truncate descriptions to prevent DoS
    const products = priceSheet.items.map((item: {
      product: {
        item_code: string;
        description: string;
        pack_size: string;
        brand?: string;
        spec_sheet_url?: string;
        warehouse?: { name?: string };
      };
      price_per_lb: number;
    }) => ({
      product_code: item.product.item_code,
      description: item.product.description.substring(0, 500), // Max 500 chars per description
      pack_size: item.product.pack_size,
      brand: item.product.brand || 'N/A',
      availability: 'In Stock',
      price_per_lb: item.price_per_lb,
      warehouse_name: item.product.warehouse?.name || 'Unknown',
      spec_sheet_url: item.product.spec_sheet_url,
    }));

    const exportData = {
      zone_name: priceSheet.zone.zone_name,
      generated_date: new Date().toLocaleDateString(),
      products,
    };

    const buffer = await generatePriceSheetExcel(exportData);

    // Sanitize zone_name for filename - whitelist only safe characters
    const sanitizedZone = priceSheet.zone.zone_name
      .replace(/[^a-zA-Z0-9-_]/g, '-') // Whitelist alphanumeric, dash, underscore
      .replace(/^\.+/, '') // Remove leading dots
      .substring(0, 50); // Limit length
    const filename = `price-sheet-${sanitizedZone}-${new Date().toISOString().split('T')[0]}.xlsx`;

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Failed to generate Excel file' },
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
