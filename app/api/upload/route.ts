/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { parseInventoryExcel } from "@/lib/utils/excel-parser";
import { parsePackSize } from "@/lib/utils/pack-size-parser-server";
import { parsePackSizeSync } from "@/lib/utils/pack-size-parser";

/**
 * POST /api/upload
 * Handle Excel file upload and batch product creation
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      return NextResponse.json(
        { error: "Invalid file format. Only .xlsx and .xls files are accepted." },
        { status: 400 }
      );
    }

    // Parse Excel file
    let parsedRows;
    try {
      parsedRows = await parseInventoryExcel(file);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to parse Excel file" },
        { status: 400 }
      );
    }

    if (parsedRows.length === 0) {
      return NextResponse.json(
        { error: "Excel file is empty or has no valid data" },
        { status: 400 }
      );
    }

    // Create upload batch
    const { data: batch, error: batchError } = await (supabase
      .from("upload_batches") as any)
      .insert({
        filename: file.name,
        row_count: parsedRows.length,
        status: "processing",
        user_id: user.id,
      })
      .select()
      .single();

    if (batchError || !batch) {
      return NextResponse.json(
        { error: batchError?.message || "Failed to create upload batch" },
        { status: 500 }
      );
    }

    // Process each row
    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ row: number; item_code: string; error: string }> = [];

    for (let i = 0; i < parsedRows.length; i++) {
      const row = parsedRows[i];

      // Validate required fields
      if (!row.item_code || !row.description || !row.pack_size) {
        errorCount++;
        errors.push({
          row: i + 1,
          item_code: row.item_code || "UNKNOWN",
          error: "Missing required fields (item_code, description, or pack_size)",
        });
        continue;
      }

      // Parse pack size - try sync regex first, then AI async if needed
      let caseWeight = parsePackSizeSync(row.pack_size);

      if (!caseWeight) {
        try {
          caseWeight = await parsePackSize(row.pack_size, row.description);
        } catch (error) {
          // AI fallback failed, continue with null
        }
      }

      const costPerLb = caseWeight && row.unit_cost
        ? row.unit_cost / caseWeight
        : null;

      // Insert product
      const { error: productError } = await (supabase.from("products") as any).insert({
        item_code: row.item_code,
        description: row.description,
        pack_size: row.pack_size,
        case_weight_lbs: caseWeight,
        brand: row.brand || null,
        cases_available: row.cases_available || 0,
        unit_cost: row.unit_cost || null,
        cost_per_lb: costPerLb,
        upload_batch_id: batch.id,
        warehouse_id: 1, // Default to PA warehouse
      });

      if (productError) {
        errorCount++;
        errors.push({
          row: i + 1,
          item_code: row.item_code,
          error: productError.message,
        });
      } else {
        successCount++;
      }
    }

    // Update batch status
    await (supabase
      .from("upload_batches") as any)
      .update({
        status: errorCount === 0 ? "completed" : "error",
        error_message: errors.length > 0
          ? errors.slice(0, 5).map(e => `Row ${e.row} (${e.item_code}): ${e.error}`).join("; ")
          : null,
      })
      .eq("id", batch.id);

    return NextResponse.json({
      batch_id: batch.id,
      row_count: parsedRows.length,
      success_count: successCount,
      error_count: errorCount,
      errors: errors.slice(0, 10), // Return first 10 errors
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
