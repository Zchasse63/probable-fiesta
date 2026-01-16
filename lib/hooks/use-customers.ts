/**
 * Customer Data Hooks
 * React Query hooks for customers CRUD operations
 * Phase 2: Database Schema & Core Data Management
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Row, Insert, Update } from '@/lib/supabase/types';
import { toast } from 'sonner';

interface CustomerFilters {
  zone_id?: number;
  state?: string;
  customer_type?: string;
}

/**
 * Fetch customers with optional filters
 */
export function useCustomers(filters?: CustomerFilters) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['customers', filters],
    queryFn: async () => {
      let query = supabase
        .from('customers')
        .select('*, zones(*)');

      // Apply filters
      if (filters?.zone_id) {
        query = query.eq('zone_id', filters.zone_id);
      }
      if (filters?.state) {
        query = query.eq('state', filters.state);
      }
      if (filters?.customer_type) {
        query = query.eq('customer_type', filters.customer_type);
      }

      const { data, error } = await query.order('company_name', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch customers: ${error.message}`);
      }

      return data as Array<Row<'customers'> & { zones: Row<'zones'> | null }>;
    },
  });
}

/**
 * Fetch single customer by ID
 */
export function useCustomer(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*, zones(*)')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch customer: ${error.message}`);
      }

      return data as Row<'customers'> & { zones: Row<'zones'> | null };
    },
    enabled: !!id,
  });
}

/**
 * Create new customer
 */
export function useCreateCustomer() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customer: Insert<'customers'>) => {
      const { data, error } = await supabase
        .from('customers')
        .insert(customer)
        .select('*, zones(*)')
        .single();

      if (error) {
        throw new Error(`Failed to create customer: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create customer: ${error.message}`);
    },
  });
}

/**
 * Update existing customer
 */
export function useUpdateCustomer() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Update<'customers'> & { id: string }) => {
      // Update updated_at timestamp
      updates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select('*, zones(*)')
        .single();

      if (error) {
        throw new Error(`Failed to update customer: ${error.message}`);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', data.id] });
      toast.success('Customer updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update customer: ${error.message}`);
    },
  });
}

/**
 * Delete customer
 */
export function useDeleteCustomer() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete customer: ${error.message}`);
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete customer: ${error.message}`);
    },
  });
}

/**
 * Fetch customers by zone
 */
export function useCustomersByZone(zoneId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['customers', 'zone', zoneId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*, zones(*)')
        .eq('zone_id', zoneId)
        .order('company_name', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch customers by zone: ${error.message}`);
      }

      return data as Array<Row<'customers'> & { zones: Row<'zones'> | null }>;
    },
    enabled: !!zoneId,
  });
}

/**
 * Bulk update customer zones
 */
export function useBulkUpdateCustomerZone() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerIds, zoneId }: { customerIds: string[]; zoneId: number }) => {
      // Validate zoneId is valid (1-4)
      if (!Number.isInteger(zoneId) || zoneId < 1 || zoneId > 4) {
        throw new Error('Invalid zone_id: must be an integer between 1 and 4');
      }

      const { data, error } = await supabase
        .from('customers')
        .update({
          zone_id: zoneId,
          updated_at: new Date().toISOString()
        })
        .in('id', customerIds)
        .select();

      if (error) {
        throw new Error(`Failed to update customer zones: ${error.message}`);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success(`${data.length} customers assigned to zone successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update customer zones: ${error.message}`);
    },
  });
}

/**
 * Batch geocode customers
 */
export function useGeocodeCustomers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addresses: string[]) => {
      const response = await fetch('/api/geocode/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresses }),
      });

      if (!response.ok) {
        throw new Error('Failed to geocode addresses');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Addresses geocoded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to geocode addresses: ${error.message}`);
    },
  });
}
