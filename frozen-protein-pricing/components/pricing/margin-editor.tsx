"use client";

import { useState, useMemo } from "react";
import { useUpdateMargin, useBulkUpdateMargins } from "@/lib/hooks/use-margins";
import { useDebouncedMargin } from "@/lib/hooks/use-margins";
import { toast } from "sonner";

interface Product {
  id: string;
  item_code: string;
  description: string;
  pack_size: string;
  cost_per_lb: number;
  default_margin_percent: number;
  case_weight_lbs?: number;
}

interface MarginEditorProps {
  products: Product[];
  freightPerLb: number;
}

function MarginCell({ product, freightPerLb }: { product: Product; freightPerLb: number }) {
  const { value, setValue, isPending } = useDebouncedMargin(
    product.id,
    product.default_margin_percent || 15.0,
    500
  );

  const marginAmount = (product.cost_per_lb * value) / 100;
  const previewPrice = product.cost_per_lb + marginAmount + freightPerLb;

  return (
    <>
      <td className="px-4 py-3 text-sm">{product.item_code}</td>
      <td className="px-4 py-3 text-sm max-w-xs truncate" title={product.description}>
        {product.description}
      </td>
      <td className="px-4 py-3 text-sm">{product.pack_size}</td>
      <td className="px-4 py-3 text-sm text-right">${product.cost_per_lb.toFixed(4)}</td>
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={value}
            onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
            className="w-20 px-2 py-1 border border-border rounded text-right"
          />
          <span>%</span>
          {isPending && (
            <span className="text-xs text-muted-foreground">Saving...</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-right">
        ${marginAmount.toFixed(4)}
      </td>
      <td className="px-4 py-3 text-sm text-right font-semibold">
        ${previewPrice.toFixed(4)}
      </td>
    </>
  );
}

export function MarginEditor({ products, freightPerLb }: MarginEditorProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMargin, setBulkMargin] = useState("15");
  const bulkUpdate = useBulkUpdateMargins();

  const allSelected = selectedIds.size === products.length && products.length > 0;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map(p => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkApply = async (margin: number) => {
    if (selectedIds.size === 0) {
      toast.error("No products selected");
      return;
    }

    if (margin < 0 || margin > 100) {
      toast.error("Margin must be between 0 and 100");
      return;
    }

    try {
      await bulkUpdate.mutateAsync({
        productIds: Array.from(selectedIds),
        marginPercent: margin,
      });

      toast.success(`Updated ${selectedIds.size} products`);
      setSelectedIds(new Set());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bulk update failed");
    }
  };

  const handleApplyToAll = async () => {
    const margin = parseFloat(bulkMargin);
    if (isNaN(margin) || margin < 0 || margin > 100) {
      toast.error("Invalid margin value");
      return;
    }

    if (!confirm(`Apply ${margin}% margin to all ${products.length} products?`)) {
      return;
    }

    try {
      await bulkUpdate.mutateAsync({
        productIds: products.map(p => p.id),
        marginPercent: margin,
      });

      toast.success(`Updated all ${products.length} products`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bulk update failed");
    }
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No products available for this zone.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk actions toolbar */}
      <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
        <span className="text-sm font-medium">
          {selectedIds.size} selected
        </span>

        <div className="flex gap-2">
          <button
            onClick={() => handleBulkApply(12)}
            disabled={selectedIds.size === 0 || bulkUpdate.isPending}
            className="px-3 py-1 text-sm bg-primary-100 text-primary rounded hover:bg-primary-200 disabled:opacity-50"
          >
            12%
          </button>
          <button
            onClick={() => handleBulkApply(15)}
            disabled={selectedIds.size === 0 || bulkUpdate.isPending}
            className="px-3 py-1 text-sm bg-primary-100 text-primary rounded hover:bg-primary-200 disabled:opacity-50"
          >
            15%
          </button>
          <button
            onClick={() => handleBulkApply(18)}
            disabled={selectedIds.size === 0 || bulkUpdate.isPending}
            className="px-3 py-1 text-sm bg-primary-100 text-primary rounded hover:bg-primary-200 disabled:opacity-50"
          >
            18%
          </button>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.01"
            value={bulkMargin}
            onChange={(e) => setBulkMargin(e.target.value)}
            className="w-20 px-2 py-1 border border-border rounded text-right"
          />
          <span className="text-sm">%</span>
          <button
            onClick={handleApplyToAll}
            disabled={bulkUpdate.isPending}
            className="px-3 py-1 text-sm bg-success text-success-foreground rounded hover:bg-success/90 disabled:opacity-50"
          >
            Apply to All
          </button>
        </div>
      </div>

      {/* Products table */}
      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                Code
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                Pack
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                Cost/lb
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                Margin %
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                Margin $/lb
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                Preview $/lb
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(product.id)}
                    onChange={() => toggleSelect(product.id)}
                    className="rounded"
                  />
                </td>
                <MarginCell product={product} freightPerLb={freightPerLb} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
