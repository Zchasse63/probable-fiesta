/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Margin Management Hooks
 * React Query hooks for product margin management
 * Phase 3: Pricing Engine & Freight Integration
 */

'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { updateProduct } from '@/lib/supabase/helpers';

interface MarginData {
  productId: string;
  marginPercent: number;
}

/**
 * Fetch margins for products in a zone
 * Note: Margins can be stored in multiple places:
 * - product.default_margin_percent (product-level default)
 * - price_sheet_items.margin_percent (price sheet-specific)
 * This hook returns product-level defaults
 */
export function useMargins(zoneId?: number) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['margins', zoneId],
    queryFn: async () => {
      // For now, return product defaults
      // In future, could fetch zone-specific overrides
      const { data, error } = await supabase
        .from('products')
        .select('id, default_margin_percent')
        .order('id');

      if (error) {
        throw new Error(`Failed to fetch margins: ${error.message}`);
      }

      // Transform to Map for easy lookup
      const margins = new Map<string, number>();
      data?.forEach((product: any) => {
        margins.set(product.id, product.default_margin_percent || 15.0);
      });

      return margins;
    },
    staleTime: 60000, // Cache for 1 minute
  });
}

/**
 * Update single product margin
 */
export function useUpdateMargin() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (params: {
      productId: string;
      marginPercent: number;
    }) => {
      if (params.marginPercent < 0 || params.marginPercent > 100) {
        throw new Error('Margin must be between 0 and 100');
      }

      // Update product default_margin_percent field using helper
      const { data, error } = await updateProduct(
        supabase,
        params.productId,
        { default_margin_percent: params.marginPercent }
      );

      if (error) {
        throw new Error(`Failed to update margin: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['margins'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

/**
 * Bulk update margins for multiple products
 */
export function useBulkUpdateMargins() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (params: {
      productIds: string[];
      marginPercent: number;
    }) => {
      if (params.marginPercent < 0 || params.marginPercent > 100) {
        throw new Error('Margin must be between 0 and 100');
      }

      // Bulk update product default_margin_percent field
      // Note: Using direct update with type assertion for bulk operations
      // since updateProduct helper only handles single updates
      const { data, error } = await (supabase
        .from('products') as any)
        .update({ default_margin_percent: params.marginPercent })
        .in('id', params.productIds)
        .select();

      if (error) {
        throw new Error(`Failed to bulk update margins: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['margins'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

/**
 * Debounced margin update hook
 * Updates local state immediately, persists to DB after delay
 */
export function useDebouncedMargin(
  productId: string,
  initialValue: number,
  delay: number = 500
) {
  const [value, setValue] = useState(initialValue);
  const [isPending, setIsPending] = useState(false);
  const updateMargin = useUpdateMargin();

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (value === initialValue) {
      return;
    }

    setIsPending(true);
    const timer = setTimeout(() => {
      updateMargin.mutate(
        { productId, marginPercent: value },
        {
          onSettled: () => setIsPending(false),
        }
      );
    }, delay);

    return () => {
      clearTimeout(timer);
      setIsPending(false);
    };
  }, [value, productId, initialValue, delay]);

  return {
    value,
    setValue,
    isPending: isPending || updateMargin.isPending,
    isError: updateMargin.isError,
    error: updateMargin.error,
  };
}
