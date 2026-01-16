/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * GET /api/products
 * List products with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;

    // Extract filters
    const warehouse_id = searchParams.get("warehouse_id");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    // Build query
    let query = supabase
      .from("products")
      .select("*, warehouses(*)");

    // Apply filters
    if (warehouse_id) {
      const warehouseIdNum = parseInt(warehouse_id, 10);
      if (isNaN(warehouseIdNum)) {
        return NextResponse.json(
          { error: "Invalid warehouse_id parameter" },
          { status: 400 }
        );
      }
      query = query.eq("warehouse_id", warehouseIdNum);
    }

    if (category) {
      query = query.eq("category", category);
    }

    if (search) {
      // Sanitize search input to prevent SQL injection via special characters
      const sanitizedSearch = search.replace(/[%_\\]/g, '\\$&');
      query = query.ilike("description", `%${sanitizedSearch}%`);
    }

    // Execute query
    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products
 * Create a new product
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.item_code || !body.description || !body.warehouse_id) {
      return NextResponse.json(
        { error: "Missing required fields: item_code, description, warehouse_id" },
        { status: 400 }
      );
    }

    // Validate input lengths to prevent DoS
    if (body.description && body.description.length > 1000) {
      return NextResponse.json(
        { error: "Description exceeds maximum length of 1000 characters" },
        { status: 400 }
      );
    }

    if (body.item_code && body.item_code.length > 100) {
      return NextResponse.json(
        { error: "Item code exceeds maximum length of 100 characters" },
        { status: 400 }
      );
    }

    // Calculate cost_per_lb if possible
    const costPerLb = body.case_weight_lbs && body.unit_cost
      ? body.unit_cost / body.case_weight_lbs
      : null;

    // Insert product
    const { data, error } = await (supabase
      .from("products") as any)
      .insert({
        item_code: body.item_code,
        description: body.description,
        pack_size: body.pack_size || "",
        case_weight_lbs: body.case_weight_lbs || null,
        brand: body.brand || null,
        category: body.category || null,
        warehouse_id: body.warehouse_id,
        cases_available: body.cases_available || 0,
        unit_cost: body.unit_cost || null,
        cost_per_lb: costPerLb,
        spec_sheet_url: body.spec_sheet_url || null,
        upload_batch_id: body.upload_batch_id || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
