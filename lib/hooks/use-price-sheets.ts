/**
 * Price Sheet Hooks
 * React Query hooks for price sheet CRUD operations
 * Phase 3: Pricing Engine & Freight Integration
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Row } from '@/lib/supabase/types';

type PriceSheet = Row<'price_sheets'>;

interface PriceSheetFilters {
  zoneId?: number;
  status?: 'draft' | 'published' | 'archived';
  dateRange?: {
    start: string;
    end: string;
  };
  page?: number;
  limit?: number;
}

/**
 * Fetch price sheets with filters
 */
export function usePriceSheets(filters?: PriceSheetFilters) {
  return useQuery({
    queryKey: ['price-sheets', filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.zoneId) {
        params.append('zoneId', filters.zoneId.toString());
      }
      if (filters?.status) {
        params.append('status', filters.status);
      }
      if (filters?.page) {
        params.append('page', filters.page.toString());
      }
      if (filters?.limit) {
        params.append('limit', filters.limit.toString());
      }

      const response = await fetch(`/api/pricing/sheets?${params}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch price sheets');
      }

      return response.json();
    },
    staleTime: 60000, // Cache for 1 minute
  });
}

/**
 * Fetch single price sheet with items
 */
export function usePriceSheet(id: string | null) {
  return useQuery({
    queryKey: ['price-sheet', id],
    queryFn: async () => {
      if (!id) {
        throw new Error('Price sheet ID is required');
      }

      const response = await fetch(`/api/pricing/sheets/${id}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch price sheet');
      }

      return response.json();
    },
    enabled: !!id,
    staleTime: 30000, // Cache for 30 seconds
  });
}

/**
 * Create new price sheet
 */
export function useCreatePriceSheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      zoneId: number;
      weekStart: string;
      weekEnd: string;
      productIds: string[];
      margins: Record<string, number>;
    }) => {
      const response = await fetch('/api/pricing/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create price sheet');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-sheets'] });
    },
  });
}

/**
 * Publish price sheet (draft → published)
 */
export function usePublishPriceSheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/pricing/sheets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to publish price sheet');
      }

      return response.json();
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['price-sheets'] });
      queryClient.invalidateQueries({ queryKey: ['price-sheet', id] });
    },
  });
}

/**
 * Update price sheet
 */
export function useUpdatePriceSheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      status?: 'draft' | 'published' | 'archived';
      excelStoragePath?: string;
      pdfStoragePath?: string;
    }) => {
      const { id, ...updates } = params;

      const response = await fetch(`/api/pricing/sheets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update price sheet');
      }

      return response.json();
    },
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: ['price-sheets'] });
      queryClient.invalidateQueries({ queryKey: ['price-sheet', params.id] });
    },
  });
}

/**
 * Delete/archive price sheet
 */
export function useDeletePriceSheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/pricing/sheets/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete price sheet');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-sheets'] });
    },
  });
}

/**
 * Calculate prices for products in a zone
 */
export function useCalculatePrices() {
  return useMutation({
    mutationFn: async (params: {
      zoneId: number;
      productIds: string[];
      margins: Record<string, number>;
    }) => {
      const response = await fetch('/api/pricing/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to calculate prices');
      }

      return response.json();
    },
  });
}
