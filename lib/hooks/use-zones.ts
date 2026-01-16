/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Zone Data Hooks
 * React Query hooks for zones (reference data)
 * Phase 2: Database Schema & Core Data Management
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Row } from '@/lib/supabase/types';

/**
 * Fetch all zones (static reference data)
 */
export function useZones() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['zones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('zones')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch zones: ${error.message}`);
      }

      return data as Row<'zones'>[];
    },
    staleTime: Infinity, // Zones rarely change, keep cached indefinitely
  });
}

/**
 * Fetch single zone with customer count
 */
export function useZone(id: number) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['zone', id],
    queryFn: async () => {
      // Fetch zone
      const { data: zone, error: zoneError } = await supabase
        .from('zones')
        .select('*')
        .eq('id', id)
        .single();

      if (zoneError) {
        throw new Error(`Failed to fetch zone: ${zoneError.message}`);
      }

      // Count customers in this zone
      const { count, error: countError } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('zone_id', id);

      if (countError) {
        throw new Error(`Failed to count customers: ${countError.message}`);
      }

      return {
        ...zone,
        customer_count: count || 0,
      };
    },
    enabled: !!id,
    staleTime: 60000, // Cache for 1 minute
  });
}

/**
 * Update zone
 */
export function useUpdateZone() {
  const supabase = createClient();

  return {
    mutateAsync: async (data: { id: number; [key: string]: any }) => {
      const { id, ...updates } = data;
      const { error } = await supabase
        .from('zones')
        .update(updates)
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to update zone: ${error.message}`);
      }
    },
    isPending: false,
  };
}

/**
 * Fetch warehouses (reference data)
 */
export function useWarehouses() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .eq('is_active', true)
        .order('id', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch warehouses: ${error.message}`);
      }

      return data as Row<'warehouses'>[];
    },
    staleTime: Infinity, // Warehouses rarely change
  });
}
