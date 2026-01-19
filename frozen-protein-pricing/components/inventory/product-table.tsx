/**
 * Product Table Component
 * Sortable, filterable product table with pagination
 * Phase 2: Database Schema & Core Data Management
 */

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { Row } from '@/lib/supabase/types';

interface ProductTableProps {
  products: Array<Row<'products'> & { warehouses: Row<'warehouses'> | null }>;
  isLoading: boolean;
}

type SortField = 'item_code' | 'description' | 'pack_size' | 'case_weight_lbs' | 'brand' | 'unit_cost' | 'cost_per_lb';
type SortDirection = 'asc' | 'desc';

export function ProductTable({ products, isLoading }: ProductTableProps) {
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>('item_code');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Sort products
  const sortedProducts = useMemo(() => {
    if (!products) return [];

    const sorted = [...products].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return sorted;
  }, [products, sortField, sortDirection]);

  // Paginate
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleRowClick = (productId: string) => {
    router.push(`/inventory/${productId}`);
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-foreground">Item Code</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Description</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Pack Size</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Case Weight</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Brand</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Warehouse</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Cases</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Cost/Case</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Cost/LB</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-b animate-pulse">
                  <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                  <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-40"></div></td>
                  <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                  <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                  <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                  <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                  <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                  <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                  <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">No products found</p>
        <p className="text-sm text-muted-foreground mt-1">Upload an inventory file to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b">
              <tr>
                <th
                  onClick={() => handleSort('item_code')}
                  className="px-4 py-3 text-left font-medium text-foreground cursor-pointer hover:bg-gray-200"
                >
                  <div className="flex items-center gap-1">
                    Item Code
                    {sortField === 'item_code' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('description')}
                  className="px-4 py-3 text-left font-medium text-foreground cursor-pointer hover:bg-gray-200"
                >
                  <div className="flex items-center gap-1">
                    Description
                    {sortField === 'description' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Pack Size</th>
                <th
                  onClick={() => handleSort('case_weight_lbs')}
                  className="px-4 py-3 text-left font-medium text-foreground cursor-pointer hover:bg-gray-200"
                >
                  <div className="flex items-center gap-1">
                    Case Weight
                    {sortField === 'case_weight_lbs' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('brand')}
                  className="px-4 py-3 text-left font-medium text-foreground cursor-pointer hover:bg-gray-200"
                >
                  <div className="flex items-center gap-1">
                    Brand
                    {sortField === 'brand' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Warehouse</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Cases</th>
                <th
                  onClick={() => handleSort('unit_cost')}
                  className="px-4 py-3 text-left font-medium text-foreground cursor-pointer hover:bg-gray-200"
                >
                  <div className="flex items-center gap-1">
                    Cost/Case
                    {sortField === 'unit_cost' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('cost_per_lb')}
                  className="px-4 py-3 text-left font-medium text-foreground cursor-pointer hover:bg-gray-200"
                >
                  <div className="flex items-center gap-1">
                    Cost/LB
                    {sortField === 'cost_per_lb' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedProducts.map((product) => (
                <tr
                  key={product.id}
                  onClick={() => handleRowClick(product.id)}
                  className="hover:bg-muted cursor-pointer"
                >
                  <td className="px-4 py-3 font-mono text-xs">{product.item_code}</td>
                  <td className="px-4 py-3">{product.description}</td>
                  <td className="px-4 py-3 text-muted-foreground">{product.pack_size}</td>
                  <td className="px-4 py-3">
                    {product.case_weight_lbs ? `${product.case_weight_lbs} lbs` : '—'}
                  </td>
                  <td className="px-4 py-3">{product.brand || '—'}</td>
                  <td className="px-4 py-3">
                    {product.warehouses?.code || '—'}
                  </td>
                  <td className="px-4 py-3">{product.cases_available || 0}</td>
                  <td className="px-4 py-3">
                    {product.unit_cost ? `$${product.unit_cost.toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {product.cost_per_lb ? `$${product.cost_per_lb.toFixed(2)}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, sortedProducts.length)} of{' '}
            {sortedProducts.length} products
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                // Show first, last, current, and adjacent pages
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`
                        px-3 py-1 border rounded
                        ${currentPage === page
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'hover:bg-muted'
                        }
                      `}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  page === currentPage - 2 ||
                  page === currentPage + 2
                ) {
                  return <span key={page} className="px-2">...</span>;
                }
                return null;
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
