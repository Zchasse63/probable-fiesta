/**
 * Product Data Hooks
 * React Query hooks for products CRUD operations
 * Phase 2: Database Schema & Core Data Management
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Row, Insert, Update } from '@/lib/supabase/types';
import { toast } from 'sonner';

interface ProductFilters {
  warehouse_id?: number;
  category?: string;
  search?: string;
}

/**
 * Fetch products with optional filters
 */
export function useProducts(filters?: ProductFilters) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, warehouses(*)');

      // Apply filters
      if (filters?.warehouse_id) {
        query = query.eq('warehouse_id', filters.warehouse_id);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.search) {
        query = query.ilike('description', `%${filters.search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch products: ${error.message}`);
      }

      return data as Array<Row<'products'> & { warehouses: Row<'warehouses'> | null }>;
    },
  });
}

/**
 * Fetch single product by ID
 */
export function useProduct(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, warehouses(*)')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch product: ${error.message}`);
      }

      return data as Row<'products'> & { warehouses: Row<'warehouses'> | null };
    },
    enabled: !!id,
  });
}

/**
 * Create new product
 */
export function useCreateProduct() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: Insert<'products'>) => {
      // Calculate cost_per_lb if both values exist
      if (product.unit_cost && product.case_weight_lbs) {
        product.cost_per_lb = product.unit_cost / product.case_weight_lbs;
      }

      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select('*, warehouses(*)')
        .single();

      if (error) {
        throw new Error(`Failed to create product: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate products query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create product: ${error.message}`);
    },
  });
}

/**
 * Update existing product
 */
export function useUpdateProduct() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Update<'products'> & { id: string }) => {
      // Recalculate cost_per_lb if unit_cost or case_weight_lbs changed
      if (updates.unit_cost !== undefined || updates.case_weight_lbs !== undefined) {
        // Fetch current product to get missing values
        const { data: current } = await supabase
          .from('products')
          .select('unit_cost, case_weight_lbs')
          .eq('id', id)
          .single();

        const unit_cost = updates.unit_cost ?? current?.unit_cost;
        const case_weight_lbs = updates.case_weight_lbs ?? current?.case_weight_lbs;

        if (unit_cost && case_weight_lbs) {
          updates.cost_per_lb = unit_cost / case_weight_lbs;
        }
      }

      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select('*, warehouses(*)')
        .single();

      if (error) {
        throw new Error(`Failed to update product: ${error.message}`);
      }

      return data;
    },
    onSuccess: (data) => {
      // Invalidate both list and single product queries
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', data.id] });
      toast.success('Product updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update product: ${error.message}`);
    },
  });
}

/**
 * Delete product
 */
export function useDeleteProduct() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete product: ${error.message}`);
      }

      return id;
    },
    onSuccess: () => {
      // Invalidate products list
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete product: ${error.message}`);
    },
  });
}
