"use client";

import { useState, useMemo } from "react";

interface PriceItem {
  productId: string;
  itemCode: string;
  description: string;
  packSize: string;
  brand: string;
  warehouseId: number;
  warehouse?: {
    code: string;
    name: string;
  };
  casesAvailable: number;
  costPerLb: number;
  marginPercent: number;
  marginAmount: number;
  freightPerLb: number;
  deliveredPriceLb: number;
  caseWeightLbs?: number;
}

interface PriceTableProps {
  items: PriceItem[];
  groupBy?: 'warehouse' | 'brand' | 'none';
  sortBy?: keyof PriceItem;
  editable?: boolean;
  isLoading?: boolean;
}

export function PriceTable({ items, groupBy = 'warehouse', sortBy, editable = false, isLoading = false }: PriceTableProps) {
  const [sortColumn, setSortColumn] = useState<keyof PriceItem>(sortBy || 'itemCode');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState("");

  // Filter items by search
  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;

    const query = searchQuery.toLowerCase();
    return items.filter(item =>
      item.itemCode.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.brand?.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  // Sort items
  const sortedItems = useMemo(() => {
    const sorted = [...filteredItems].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });

    return sorted;
  }, [filteredItems, sortColumn, sortDirection]);

  // Group items
  const groupedItems = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Products': sortedItems };
    }

    const groups: Record<string, PriceItem[]> = {};

    sortedItems.forEach(item => {
      let key: string;

      if (groupBy === 'warehouse') {
        key = item.warehouse?.name || `Warehouse ${item.warehouseId}`;
      } else if (groupBy === 'brand') {
        key = item.brand || 'Unknown Brand';
      } else {
        key = 'All Products';
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });

    return groups;
  }, [sortedItems, groupBy]);

  const handleSort = (column: keyof PriceItem) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading prices...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No products available for this zone.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by code, description, or brand..."
          className="flex-1 px-4 py-2 border border-border rounded"
        />
        <span className="text-sm text-muted-foreground">
          {filteredItems.length} of {items.length} products
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-border rounded-lg">
        {Object.entries(groupedItems).map(([groupName, groupItems]) => (
          <div key={groupName}>
            {groupBy !== 'none' && (
              <div className="bg-muted px-4 py-2 font-semibold border-b border-border">
                {groupName} ({groupItems.length})
              </div>
            )}

            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-muted">
                <tr>
                  <SortableHeader column="itemCode" currentColumn={sortColumn} direction={sortDirection} onSort={handleSort}>
                    Code
                  </SortableHeader>
                  <SortableHeader column="description" currentColumn={sortColumn} direction={sortDirection} onSort={handleSort}>
                    Description
                  </SortableHeader>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Pack
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Brand
                  </th>
                  <SortableHeader column="costPerLb" currentColumn={sortColumn} direction={sortDirection} onSort={handleSort} align="right">
                    Cost/lb
                  </SortableHeader>
                  <SortableHeader column="marginPercent" currentColumn={sortColumn} direction={sortDirection} onSort={handleSort} align="right">
                    Margin %
                  </SortableHeader>
                  <SortableHeader column="marginAmount" currentColumn={sortColumn} direction={sortDirection} onSort={handleSort} align="right">
                    Margin $/lb
                  </SortableHeader>
                  <SortableHeader column="freightPerLb" currentColumn={sortColumn} direction={sortDirection} onSort={handleSort} align="right">
                    Freight/lb
                  </SortableHeader>
                  <SortableHeader column="deliveredPriceLb" currentColumn={sortColumn} direction={sortDirection} onSort={handleSort} align="right">
                    Delivered $/lb
                  </SortableHeader>
                  <SortableHeader column="casesAvailable" currentColumn={sortColumn} direction={sortDirection} onSort={handleSort} align="right">
                    Cases
                  </SortableHeader>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-gray-200">
                {groupItems.map((item) => {
                  const lowMargin = item.marginPercent < 10;

                  return (
                    <tr
                      key={item.productId}
                      className={`hover:bg-muted ${lowMargin ? 'bg-warning-50' : ''}`}
                      title={lowMargin ? 'Low margin warning' : ''}
                    >
                      <td className="px-4 py-3 text-sm font-mono">{item.itemCode}</td>
                      <td className="px-4 py-3 text-sm max-w-xs truncate" title={item.description}>
                        {item.description}
                      </td>
                      <td className="px-4 py-3 text-sm">{item.packSize}</td>
                      <td className="px-4 py-3 text-sm">{item.brand}</td>
                      <td className="px-4 py-3 text-sm text-right">${item.costPerLb.toFixed(4)}</td>
                      <td className="px-4 py-3 text-sm text-right">{item.marginPercent.toFixed(2)}%</td>
                      <td className="px-4 py-3 text-sm text-right">${item.marginAmount.toFixed(4)}</td>
                      <td className="px-4 py-3 text-sm text-right">${item.freightPerLb.toFixed(4)}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">
                        ${item.deliveredPriceLb.toFixed(4)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">{item.casesAvailable}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

function SortableHeader({
  column,
  currentColumn,
  direction,
  onSort,
  align = 'left',
  children
}: {
  column: keyof PriceItem;
  currentColumn: keyof PriceItem;
  direction: 'asc' | 'desc';
  onSort: (column: keyof PriceItem) => void;
  align?: 'left' | 'right';
  children: React.ReactNode;
}) {
  const isActive = currentColumn === column;

  return (
    <th
      className={`px-4 py-3 text-${align} text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:bg-muted`}
      onClick={() => onSort(column)}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
        {children}
        {isActive && (
          <span>{direction === 'asc' ? '↑' : '↓'}</span>
        )}
      </div>
    </th>
  );
}
