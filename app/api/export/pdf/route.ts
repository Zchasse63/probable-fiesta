import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { PriceSheetPDF, PDFExportData, PDFExportProduct } from '@/lib/export/pdf';
import { checkRateLimit } from '@/lib/utils/rate-limiter';
import { validateCORS, addCORSHeaders } from '@/lib/utils/cors';
import React from 'react';

async function handleGET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const priceSheetId = searchParams.get('priceSheetId');
    const preview = searchParams.get('preview') === 'true';

    if (!priceSheetId) {
      return NextResponse.json(
        { error: 'priceSheetId is required' },
        { status: 400 }
      );
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

    return handlePDFGeneration(priceSheetId, preview);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Failed to generate PDF file' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const response = await handleGET(request);
  return addCORSHeaders(response, request);
}

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

    return handlePDFGeneration(priceSheetId, false);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Failed to generate PDF file' },
      { status: 500 }
    );
  }
}

async function handlePDFGeneration(priceSheetId: string, isPreview: boolean) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch price sheet with authorization check
    const { data: priceSheet, error: sheetError } = await supabase
      .from('price_sheets')
      .select(`
        *,
        freight_zones (zone_name, organization_id)
      `)
      .eq('id', priceSheetId)
      .single();

    if (sheetError || !priceSheet) {
      return NextResponse.json(
        { error: 'Price sheet not found' },
        { status: 404 }
      );
    }

    // Verify ownership through organization_id
    const { data: userOrg } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    const zoneOrg = (priceSheet.freight_zones as { organization_id?: number })?.organization_id;

    if (!userOrg || zoneOrg !== userOrg.organization_id) {
      return NextResponse.json(
        { error: 'Unauthorized - you do not have access to this price sheet' },
        { status: 403 }
      );
    }

    // Fetch price sheet items with product and warehouse info
    const { data: items, error: itemsError } = await supabase
      .from('price_sheet_items')
      .select(`
        *,
        products (
          item_code,
          description,
          pack_size,
          brand
        ),
        warehouses (
          name
        )
      `)
      .eq('price_sheet_id', priceSheetId)
      .limit(5000); // Max 5000 products per export to prevent memory exhaustion

    if (itemsError) {
      return NextResponse.json(
        { error: 'Failed to fetch price sheet items' },
        { status: 500 }
      );
    }

    // Enforce product count limit to prevent DoS via large exports
    if (items && items.length > 5000) {
      return NextResponse.json(
        { error: 'Export exceeds maximum product limit (5000). Please filter your price sheet.' },
        { status: 413 }
      );
    }

    // Transform data for PDF
    interface PriceSheetItem {
      products?: {
        item_code?: string;
        description?: string;
        pack_size?: string;
        brand?: string;
      };
      in_stock: boolean;
      price_per_lb?: number;
      warehouses?: {
        name?: string;
      };
    }

    const products: PDFExportProduct[] = (items || []).map((item: PriceSheetItem) => ({
      product_code: item.products?.item_code || '',
      description: item.products?.description || '',
      pack_size: item.products?.pack_size || '',
      brand: item.products?.brand || '',
      availability: item.in_stock ? 'In Stock' : 'Out of Stock',
      price_per_lb: item.price_per_lb || 0,
      warehouse_name: item.warehouses?.name || 'Unknown',
    }));

    interface FreightZone {
      zone_name?: string;
    }

    const pdfData: PDFExportData = {
      zone_name: (priceSheet.freight_zones as FreightZone)?.zone_name || 'Unknown Zone',
      generated_date: new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      products,
    };

    // Render PDF to buffer for server-side generation
    // Type assertion needed - PriceSheetPDF component returns Document internally
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = React.createElement(PriceSheetPDF, { data: pdfData }) as any;
    const pdfBuffer = await renderToBuffer(element);

    // Return PDF as response
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');

    if (!isPreview) {
      // Sanitize zone_name for filename - whitelist only safe characters
      const sanitizedZone = pdfData.zone_name
        .replace(/[^a-zA-Z0-9-_]/g, '-')
        .replace(/^\.+/, '') // Remove leading dots
        .substring(0, 50);
      headers.set(
        'Content-Disposition',
        `attachment; filename="price-sheet-${sanitizedZone}-${new Date().toISOString().split('T')[0]}.pdf"`
      );
    } else {
      headers.set('Content-Disposition', 'inline');
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Failed to generate PDF file' },
      { status: 500 }
    );
  }
}
