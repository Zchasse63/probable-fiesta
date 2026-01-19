/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useZones } from "@/lib/hooks/use-zones";
import { useProducts } from "@/lib/hooks/use-products";
import { useFreightRates } from "@/lib/hooks/use-freight-rates";
import { useCreatePriceSheet } from "@/lib/hooks/use-price-sheets";
import { MarginEditor } from "@/components/pricing/margin-editor";
import { toast } from "sonner";

export default function PricingPage() {
  const [selectedZone, setSelectedZone] = useState<number>(1);
  const [weekStart, setWeekStart] = useState(() => {
    const monday = new Date();
    const day = monday.getDay();
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);
    return monday.toISOString().split('T')[0];
  });

  const { data: zones = [] } = useZones();
  const { data: products = [] as any } = useProducts({});
  const { data: freightRates = [] } = useFreightRates(selectedZone);
  const createSheet = useCreatePriceSheet();

  // Calculate average freight rate for zone
  const avgFreightRate = freightRates.length > 0
    ? freightRates.reduce((sum: number, r: any) => sum + r.rate_per_lb, 0) / freightRates.length
    : 0;

  const ratesExpired = freightRates.length === 0 || freightRates.some((r: any) => {
    return new Date(r.valid_until) < new Date();
  });

  const handleGenerateSheet = async () => {
    if (products.length === 0) {
      toast.error("No products available");
      return;
    }

    if (ratesExpired) {
      toast.error("Freight rates are expired. Please refresh rates first.");
      return;
    }

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const margins: Record<string, number> = {};
    products.forEach((p: any) => {
      margins[p.id] = 15.0; // Default margin, per-product margins in Phase 3
    });

    try {
      const result = await createSheet.mutateAsync({
        zoneId: selectedZone,
        weekStart,
        weekEnd: weekEnd.toISOString().split('T')[0],
        productIds: products.map((p: any) => p.id),
        margins,
      });

      toast.success(`Price sheet created with ${result.itemCount} items`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create price sheet");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Price Sheet Builder</h1>
          <p className="text-muted-foreground">Create and manage weekly price sheets by zone</p>
        </div>
      </div>

      {/* Zone selector */}
      <div className="bg-card rounded-lg shadow">
        <div className="border-b border-border">
          <nav className="flex -mb-px">
            {zones.map((zone) => (
              <button
                key={zone.id}
                onClick={() => setSelectedZone(zone.id)}
                className={`px-6 py-4 border-b-2 font-medium ${
                  selectedZone === zone.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                {zone.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6 space-y-6">
          {/* Freight rate summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-muted p-4 rounded">
              <p className="text-sm text-muted-foreground">Avg Freight Rate</p>
              <p className="text-2xl font-bold">
                ${avgFreightRate.toFixed(4)}/lb
              </p>
            </div>
            <div className="bg-muted p-4 rounded">
              <p className="text-sm text-muted-foreground">Active Rates</p>
              <p className="text-2xl font-bold">{freightRates.length}</p>
            </div>
            <div className="bg-muted p-4 rounded">
              <p className="text-sm text-muted-foreground">Products</p>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
          </div>

          {ratesExpired && (
            <div className="p-4 bg-warning-50 border border-warning-200 rounded">
              <p className="text-warning-800 font-medium">
                ⚠️ Freight rates expired. Please refresh rates before generating price sheet.
              </p>
              <a
                href="/freight"
                className="text-warning-600 underline hover:text-warning-800"
              >
                Go to Freight Management →
              </a>
            </div>
          )}

          {/* Week selector and generate button */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-1">
                Week Starting
              </label>
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                className="px-3 py-2 border border-border rounded"
              />
            </div>
            <button
              onClick={handleGenerateSheet}
              disabled={createSheet.isPending || ratesExpired || products.length === 0}
              className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
            >
              {createSheet.isPending ? "Generating..." : "Generate Price Sheet"}
            </button>
          </div>

          {/* Margin editor */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Product Margins</h2>
            <MarginEditor products={products} freightPerLb={avgFreightRate} />
          </div>
        </div>
      </div>
    </div>
  );
}
