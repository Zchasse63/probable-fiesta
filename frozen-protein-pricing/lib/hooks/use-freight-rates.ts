/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Freight Rate Hooks
 * React Query hooks for freight rates management
 * Phase 3: Pricing Engine & Freight Integration
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Row } from '@/lib/supabase/types';
import { updateFreightRate } from '@/lib/supabase/helpers';

type FreightRate = Row<'freight_rates'>;

/**
 * Fetch all freight rates, optionally filtered by zone
 */
export function useFreightRates(zoneId?: number) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['freight-rates', zoneId],
    queryFn: async () => {
      let query = supabase
        .from('freight_rates')
        .select('*, warehouses(id, code, name, city, state), zones(id, name, code)')
        .gte('valid_until', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (zoneId) {
        query = query.eq('destination_zone_id', zoneId);
      }

      // Type assertion: Supabase SSR client sometimes fails to infer generic types
      // The query returns freight_rates rows with joined warehouses/zones data
      const { data, error } = await query as any;

      if (error) {
        throw new Error(`Failed to fetch freight rates: ${error.message}`);
      }

      return data;
    },
    staleTime: 300000, // Cache for 5 minutes
  });
}

/**
 * Fetch specific freight rate for warehouse-zone pair
 */
export function useFreightRate(warehouseId: number, zoneId: number) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['freight-rate', warehouseId, zoneId],
    queryFn: async () => {
      // Type assertion: Supabase SSR client sometimes fails to infer generic types
      const { data, error } = await supabase
        .from('freight_rates')
        .select('*, warehouses(id, code, name), zones(id, name, code)')
        .eq('origin_warehouse_id', warehouseId)
        .eq('destination_zone_id', zoneId)
        .gte('valid_until', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single() as any;

      if (error && error.code !== 'PGRST116') { // Not found is ok
        throw new Error(`Failed to fetch freight rate: ${error.message}`);
      }

      return data;
    },
    enabled: !!warehouseId && !!zoneId,
    staleTime: 300000, // Cache for 5 minutes
  });
}

/**
 * Update/override freight rate
 */
export function useUpdateFreightRate() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (params: {
      id?: string;
      originWarehouseId: number;
      destinationZoneId: number;
      ratePerLb: number;
      city?: string;
      state?: string;
      validUntilDays?: number;
    }) => {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + (params.validUntilDays || 7));

      const payload = {
        origin_warehouse_id: params.originWarehouseId,
        destination_zone_id: params.destinationZoneId,
        rate_per_lb: params.ratePerLb,
        rate_type: 'frozen_ltl' as const,
        weight_lbs: 7500,
        city: params.city,
        state: params.state,
        valid_from: new Date().toISOString(),
        valid_until: validUntil.toISOString(),
      };

      if (params.id) {
        // Update existing rate
        const { data, error } = await updateFreightRate(supabase, params.id, payload);

        if (error) {
          throw new Error(`Failed to update freight rate: ${error.message}`);
        }

        return data;
      } else {
        // Insert new rate - Type assertion for Supabase SSR type inference
        const { data, error } = await (supabase
          .from('freight_rates') as any)
          .insert(payload)
          .select()
          .single() as any;

        if (error) {
          throw new Error(`Failed to insert freight rate: ${error.message}`);
        }

        return data;
      }
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['freight-rates'] });
      queryClient.invalidateQueries({
        queryKey: ['freight-rate', data.origin_warehouse_id, data.destination_zone_id]
      });
    },
  });
}

/**
 * Trigger freight rate calibration
 */
export function useCalibrateLanes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/freight/calibrate', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to calibrate lanes');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all freight rate queries
      queryClient.invalidateQueries({ queryKey: ['freight-rates'] });
      queryClient.invalidateQueries({ queryKey: ['freight-rate'] });
    },
  });
}

/**
 * Get GoShip quote for custom parameters
 */
export function useGetFreightQuote() {
  return useMutation({
    mutationFn: async (params: {
      originWarehouseId: number;
      destinationZip: string;
      weight: number;
      pickupDate: string;
      pallets?: number;
    }) => {
      const response = await fetch('/api/freight/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get freight quote');
      }

      return response.json();
    },
  });
}
