/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * GET /api/pricing/sheets/[id] - Get price sheet with items
 * PATCH /api/pricing/sheets/[id] - Update price sheet
 * DELETE /api/pricing/sheets/[id] - Delete/archive price sheet
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import type { Update } from '@/lib/supabase/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();

    // Fetch price sheet with zone info
    const { data: sheet, error: sheetError } = await supabase
      .from('price_sheets')
      .select('*, zones(id, name, code)')
      .eq('id', id)
      .single();

    if (sheetError || !sheet) {
      return NextResponse.json(
        { error: 'Price sheet not found' },
        { status: 404 }
      );
    }

    // Fetch price sheet items with product and warehouse details
    const { data: items, error: itemsError } = await supabase
      .from('price_sheet_items')
      .select(`
        *,
        products(id, item_code, description, pack_size, brand, category, cases_available, case_weight_lbs),
        warehouses(id, code, name, city, state)
      `)
      .eq('price_sheet_id', id)
      .order('warehouses(code)', { ascending: true });

    if (itemsError) {
      throw itemsError;
    }

    return NextResponse.json({
      sheet,
      items: items || []
    });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Get price sheet error:', error);
    }
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
  try {
    const body = await request.json();
    const supabase = await createServerClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check ownership - Type assertion for Supabase SSR type inference
    const { data: sheet, error: sheetError } = await supabase
      .from('price_sheets')
      .select('user_id')
      .eq('id', id)
      .single() as any;

    if (sheetError || !sheet) {
      return NextResponse.json({ error: 'Price sheet not found' }, { status: 404 });
    }

    if ((sheet as any).user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate status if provided
    if (body.status && !['draft', 'published', 'archived'].includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: draft, published, or archived' },
        { status: 400 }
      );
    }

    // Build update object with proper typing
    const updateData: Update<'price_sheets'> = {
      updated_at: new Date().toISOString()
    };
    if (body.status) updateData.status = body.status;
    if (body.excelStoragePath) updateData.excel_storage_path = body.excelStoragePath;
    if (body.pdfStoragePath) updateData.pdf_storage_path = body.pdfStoragePath;

    const { data, error } = (await (supabase
      .from('price_sheets') as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()) as any;

    if (error) {
      throw error;
    }

    return NextResponse.json(data);

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Update price sheet error:', error);
    }
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
  try {
    const supabase = await createServerClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check ownership - Type assertion for Supabase SSR type inference
    const { data: sheet, error: sheetError } = await supabase
      .from('price_sheets')
      .select('user_id, status')
      .eq('id', id)
      .single() as any;

    if (sheetError || !sheet) {
      return NextResponse.json({ error: 'Price sheet not found' }, { status: 404 });
    }

    if ((sheet as any).user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete: set status to archived
    const { error } = await (supabase
      .from('price_sheets') as any)
      .update({ status: 'archived' as const, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Delete price sheet error:', error);
    }
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
