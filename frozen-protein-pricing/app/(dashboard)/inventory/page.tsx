/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useProducts, useCreateProduct } from "@/lib/hooks/use-products";
import { useQueryClient } from "@tanstack/react-query";
import { UploadDropzone } from "@/components/inventory/upload-dropzone";
import { ProductTable } from "@/components/inventory/product-table";
import { SmartSearch } from "@/components/search/smart-search";
import { parsePackSizeSync } from "@/lib/utils/pack-size-parser";
import type { ParsedRow } from "@/lib/utils/excel-parser";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Insert } from "@/lib/supabase/types";

export default function InventoryPage() {
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [warehouseFilter, setWarehouseFilter] = useState<number | undefined>();
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [priceMin, setPriceMin] = useState<number | undefined>();
  const [priceMax, setPriceMax] = useState<number | undefined>();
  const [inStock, setInStock] = useState<boolean | undefined>();
  const [isFrozen, setIsFrozen] = useState<boolean | undefined>();

  const queryClient = useQueryClient();
  const { data: products = [], isLoading } = useProducts({
    warehouse_id: warehouseFilter,
    category: categoryFilter,
    search: searchQuery,
  });

  const handleUploadComplete = (data: ParsedRow[], file: File) => {
    setParsedData(data);
    setSelectedFile(file);
  };

  const handleImport = async () => {
    if (!selectedFile || parsedData.length === 0) {
      toast.error("No data to import");
      return;
    }

    const supabase = createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      toast.error("Authentication required");
      return;
    }

    try {
      // Create upload batch
      const batchData: Insert<"upload_batches"> = {
        filename: selectedFile.name,
        row_count: parsedData.length,
        status: "processing",
        user_id: user.id,
      };

      const { data: batch, error: batchError } = await (supabase
        .from("upload_batches") as any)
        .insert(batchData)
        .select()
        .single();

      if (batchError || !batch) {
        throw new Error(batchError?.message || "Failed to create batch");
      }

      // Process each row
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const row of parsedData) {
        // Skip rows with missing required fields
        if (!row.item_code || !row.description || !row.pack_size) {
          errorCount++;
          errors.push(`Row with item_code ${row.item_code || 'UNKNOWN'}: Missing required fields`);
          continue;
        }

        // Parse pack size (sync regex only, no AI fallback in client)
        const caseWeight = parsePackSizeSync(row.pack_size);
        const costPerLb = caseWeight && row.unit_cost
          ? row.unit_cost / caseWeight
          : null;

        // Insert product
        const productData: Insert<"products"> = {
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
        };

        const { error: productError } = await (supabase
          .from("products") as any)
          .insert(productData);

        if (productError) {
          errorCount++;
          errors.push(`${row.item_code}: ${productError.message}`);
        } else {
          successCount++;
        }
      }

      // Update batch status
      const updateStatus = errorCount === 0 ? "completed" : "error";
      await (supabase
        .from("upload_batches") as any)
        .update({
          status: updateStatus,
          error_message: errors.length > 0 ? errors.slice(0, 5).join("; ") : null,
        })
        .eq("id", batch.id);

      if (successCount > 0) {
        toast.success(`Imported ${successCount} products successfully`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to import ${errorCount} products`);
      }

      // Clear upload state
      setParsedData([]);
      setSelectedFile(null);

      // Invalidate products query to refetch data
      queryClient.invalidateQueries({ queryKey: ['products'] });

    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Inventory Management</h2>
        <p className="text-gray-600">
          Upload Excel files to import inventory, or manage existing products below
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Upload Inventory</h3>
        <UploadDropzone onUploadComplete={handleUploadComplete} />

        {parsedData.length > 0 && (
          <div className="mt-4">
            <button
              onClick={handleImport}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Import {parsedData.length} Products
            </button>
          </div>
        )}
      </div>

      {/* Smart Search */}
      <div className="bg-white border rounded-lg p-4">
        <SmartSearch
          onFiltersApplied={(filters) => {
            if (filters.category) setCategoryFilter(filters.category);
            if (filters.warehouse_id) setWarehouseFilter(Number(filters.warehouse_id));
            if (filters.search_term) setSearchQuery(filters.search_term);
            if (filters.price_min) setPriceMin(filters.price_min);
            if (filters.price_max) setPriceMax(filters.price_max);
            if (filters.in_stock !== undefined) setInStock(filters.in_stock);
            if (filters.is_frozen !== undefined) setIsFrozen(filters.is_frozen);
          }}
          onClearFilters={() => {
            setCategoryFilter(undefined);
            setWarehouseFilter(undefined);
            setSearchQuery("");
            setPriceMin(undefined);
            setPriceMax(undefined);
            setInStock(undefined);
            setIsFrozen(undefined);
          }}
        />
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={warehouseFilter || ""}
            onChange={(e) =>
              setWarehouseFilter(e.target.value ? Number(e.target.value) : undefined)
            }
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Warehouses</option>
            <option value="1">PA Boyertown</option>
            <option value="2">GA Americus</option>
          </select>
          <select
            value={categoryFilter || ""}
            onChange={(e) =>
              setCategoryFilter(e.target.value || undefined)
            }
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            <option value="chicken">Chicken</option>
            <option value="beef">Beef</option>
            <option value="pork">Pork</option>
            <option value="poultry">Poultry</option>
          </select>
        </div>
      </div>

      {/* Product List */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Products</h3>
        <ProductTable products={products} isLoading={isLoading} />
      </div>
    </div>
  );
}
