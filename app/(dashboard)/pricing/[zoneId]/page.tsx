/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import { useZone } from "@/lib/hooks/use-zones";
import { useProducts } from "@/lib/hooks/use-products";
import { useFreightRates } from "@/lib/hooks/use-freight-rates";
import { PriceTable } from "@/components/pricing/price-table";
import { ExportPanel } from "@/components/pricing/export-panel";
import { SmartSearch } from "@/components/search/smart-search";
import { createClient } from "@/lib/supabase/client";

export default function ZonePricingPage() {
  const params = useParams();
  const zoneId = parseInt(params.zoneId as string);
  const [searchQuery, setSearchQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState<string>("");
  const [warehouseFilter, setWarehouseFilter] = useState<number | null>(null);
  const [aiFilters, setAiFilters] = useState<{
    category?: string;
    price_min?: number;
    price_max?: number;
    warehouse_id?: string;
    in_stock?: boolean;
    is_frozen?: boolean;
    search_term?: string;
  } | null>(null);
  const [priceSheetId, setPriceSheetId] = useState<string | null>(null);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const supabase = createClient();

  const { data: zone } = useZone(zoneId);
  const { data: allProducts = [] } = useProducts({});
  const { data: freightRates = [] } = useFreightRates(zoneId);

  // Calculate average freight rate for zone
  const avgFreightRate = useMemo(() => {
    if (freightRates.length === 0) return 0;
    return freightRates.reduce((sum: number, r: any) => sum + r.rate_per_lb, 0) / freightRates.length;
  }, [freightRates]);

  // Get or create price sheet for export
  useEffect(() => {
    const getOrCreatePriceSheet = async () => {
      if (!zoneId || isCreatingSheet || allProducts.length === 0) return;

      try {
        // Check if a price sheet exists for this zone
        const { data: existingSheet } = await supabase
          .from('price_sheets')
          .select('id')
          .eq('zone_id', zoneId)
          .maybeSingle();

        if (existingSheet) {
          setPriceSheetId(existingSheet.id);
        } else {
          // Create a new price sheet
          setIsCreatingSheet(true);
          const { data: { user } } = await supabase.auth.getUser();

          const { data: newSheet, error } = await supabase
            .from('price_sheets')
            .insert({
              zone_id: zoneId,
              name: `${zone?.name || 'Zone'} Price Sheet`,
              created_by: user?.id,
            })
            .select('id')
            .single();

          if (error) throw error;
          if (newSheet) {
            setPriceSheetId(newSheet.id);

            // Compute filtered products for initial creation
            const availableProducts = allProducts.filter((product: any) => {
              return product.cases_available > 0;
            });

            // Create price sheet items from available products
            const items = availableProducts.map((product: any) => ({
              price_sheet_id: newSheet.id,
              product_id: product.id,
              warehouse_id: product.warehouse_id,
              price_per_lb: (product.cost_per_lb || 0) + avgFreightRate,
              in_stock: product.cases_available > 0,
            }));

            if (items.length > 0) {
              await supabase.from('price_sheet_items').insert(items);
            }
          }
          setIsCreatingSheet(false);
        }
      } catch (error) {
        setIsCreatingSheet(false);
      }
    };

    getOrCreatePriceSheet();
  }, [zoneId, zone, supabase, isCreatingSheet, allProducts.length, avgFreightRate]);

  // Get unique brands and warehouses for filters
  const brands = useMemo(() => {
    const uniqueBrands = new Set(allProducts.map((p: any) => p.brand).filter(Boolean));
    return Array.from(uniqueBrands).sort();
  }, [allProducts]);

  const warehouses = useMemo(() => {
    const warehouseMap = new Map();
    allProducts.forEach((p: any) => {
      if (p.warehouse_id && !warehouseMap.has(p.warehouse_id)) {
        warehouseMap.set(p.warehouse_id, {
          id: p.warehouse_id,
          name: `Warehouse ${p.warehouse_id}`,
        });
      }
    });
    return Array.from(warehouseMap.values());
  }, [allProducts]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product: any) => {
      // AI filters have priority if set
      if (aiFilters) {
        if (aiFilters.category && product.category !== aiFilters.category) return false;
        if (aiFilters.price_min !== undefined && aiFilters.price_min !== null && (product.cost_per_lb || 0) < aiFilters.price_min) return false;
        if (aiFilters.price_max !== undefined && aiFilters.price_max !== null && (product.cost_per_lb || 0) > aiFilters.price_max) return false;
        if (aiFilters.warehouse_id && product.warehouse_id !== Number(aiFilters.warehouse_id)) return false;
        if (aiFilters.in_stock && product.cases_available <= 0) return false;
        if (aiFilters.search_term) {
          const term = String(aiFilters.search_term).toLowerCase();
          const matches =
            product.item_code?.toLowerCase().includes(term) ||
            product.description?.toLowerCase().includes(term);
          if (!matches) return false;
        }
      } else {
        // Standard filters when no AI filters active
        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesSearch =
            product.item_code?.toLowerCase().includes(query) ||
            product.description?.toLowerCase().includes(query);
          if (!matchesSearch) return false;
        }

        // Brand filter
        if (brandFilter && product.brand !== brandFilter) {
          return false;
        }

        // Warehouse filter
        if (warehouseFilter && product.warehouse_id !== warehouseFilter) {
          return false;
        }
      }

      // Only include products with availability
      if (product.cases_available <= 0) {
        return false;
      }

      return true;
    });
  }, [allProducts, searchQuery, brandFilter, warehouseFilter, aiFilters]);

  if (!zone) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading zone...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{zone.name} Price Sheet</h1>
          <p className="text-gray-600">
            Zone {zone.code} - Delivered pricing with freight rate ${avgFreightRate.toFixed(4)}/lb
          </p>
        </div>
      </div>

      {/* AI Smart Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <SmartSearch
          onFiltersApplied={(filters) => {
            setAiFilters(filters);
            setSearchQuery("");
            setBrandFilter("");
            setWarehouseFilter(null);
          }}
          onClearFilters={() => {
            setAiFilters(null);
          }}
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setAiFilters(null);
              }}
              placeholder="Search by item code or description..."
              className="w-full px-3 py-2 border border-gray-300 rounded"
              disabled={!!aiFilters}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand
            </label>
            <select
              value={brandFilter}
              onChange={(e) => {
                setBrandFilter(e.target.value);
                setAiFilters(null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              disabled={!!aiFilters}
            >
              <option value="">All Brands</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Warehouse
            </label>
            <select
              value={warehouseFilter || ''}
              onChange={(e) => {
                setWarehouseFilter(e.target.value ? Number(e.target.value) : null);
                setAiFilters(null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              disabled={!!aiFilters}
            >
              <option value="">All Warehouses</option>
              {warehouses.map((wh: any) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Products</p>
          <p className="text-2xl font-bold">{filteredProducts.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Avg Freight Rate</p>
          <p className="text-2xl font-bold">${avgFreightRate.toFixed(4)}/lb</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Active Freight Rates</p>
          <p className="text-2xl font-bold">{freightRates.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Zone</p>
          <p className="text-2xl font-bold">{zone.code}</p>
        </div>
      </div>

      {/* Freight rate warning */}
      {freightRates.length === 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-800 font-medium">
            ⚠️ No freight rates available for this zone. Prices cannot be calculated.
          </p>
          <a
            href="/freight"
            className="text-yellow-600 underline hover:text-yellow-800"
          >
            Go to Freight Management →
          </a>
        </div>
      )}

      {/* Export Panel */}
      {priceSheetId && (
        <ExportPanel
          priceSheetId={priceSheetId}
          zoneName={zone.name}
        />
      )}

      {/* Price Table */}
      <div className="bg-white rounded-lg shadow">
        <PriceTable
          items={filteredProducts.map(p => ({
            productId: p.id,
            itemCode: p.item_code,
            description: p.description,
            packSize: p.pack_size,
            brand: p.brand || '',
            warehouseId: p.warehouse_id || 0,
            casesAvailable: p.cases_available,
            costPerLb: p.cost_per_lb || 0,
            marginPercent: 15.0,
            marginAmount: 0,
            freightPerLb: avgFreightRate,
            deliveredPriceLb: (p.cost_per_lb || 0) + avgFreightRate,
            caseWeightLbs: p.case_weight_lbs || undefined,
          }))}
          groupBy="warehouse"
          editable={true}
        />
      </div>
    </div>
  );
}
