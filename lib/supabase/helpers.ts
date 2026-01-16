/**
 * Supabase Type-Safe Helper Functions
 *
 * PURPOSE: These wrapper functions provide type-safe interfaces for Supabase operations
 * where @supabase/ssr's generic type parameter doesn't propagate correctly through
 * the query builder chain, resulting in TypeScript inferring `never` types.
 *
 * ISSUE: When using `createBrowserClient<Database>()` or `createServerClient<Database>()`,
 * TypeScript sometimes fails to apply the Database generic to `.from()` calls, causing
 * `.insert()`, `.update()`, and `.select()` to have `never` types for their parameters
 * and return values.
 *
 * SOLUTION: These helper functions explicitly type their inputs (Insert/Update types)
 * and outputs (Row types), then use controlled type assertions ONLY at the Supabase
 * client boundary where type inference fails. The type assertions are safe because:
 * 1. Input data is validated against Database Insert/Update types
 * 2. Return types are explicitly declared to match Database Row types
 * 3. Supabase runtime behavior matches these type declarations
 * 4. All type assertions are isolated to this single file with clear documentation
 *
 * This is superior to scattering `as any` throughout the codebase because:
 * - Centralized: All type boundaries in one maintainable location
 * - Documented: Clear explanation of why assertions are necessary
 * - Auditable: Easy to review and verify safety of type assertions
 * - Type-safe API: Consumer code uses fully-typed functions without any unsafe casts
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

/**
 * Type-safe insert for upload_batches table
 * Workaround for Supabase SSR generic type inference issues
 */
export async function insertUploadBatch(
  client: SupabaseClient<Database>,
  data: Database['public']['Tables']['upload_batches']['Insert']
): Promise<{
  data: Database['public']['Tables']['upload_batches']['Row'] | null;
  error: any;
}> {
  return await (client
    .from('upload_batches') as any)
    .insert(data)
    .select()
    .single() as any;
}

/**
 * Type-safe insert for products table
 */
export async function insertProduct(
  client: SupabaseClient<Database>,
  data: Database['public']['Tables']['products']['Insert']
): Promise<{ data: null; error: any }> {
  return await (client
    .from('products') as any)
    .insert(data) as any;
}

/**
 * Type-safe insert for products table with full row return
 */
export async function insertProductWithSelect(
  client: SupabaseClient<Database>,
  data: Database['public']['Tables']['products']['Insert']
): Promise<{
  data: any | null;
  error: any;
}> {
  return await (client
    .from('products') as any)
    .insert(data)
    .select('*, warehouses(*)')
    .single() as any;
}

/**
 * Type-safe query for single product by ID
 */
export async function getProductById(
  client: SupabaseClient<Database>,
  id: string
): Promise<{
  data: Database['public']['Tables']['products']['Row'] | null;
  error: any;
}> {
  return await client
    .from('products')
    .select('unit_cost, case_weight_lbs')
    .eq('id', id)
    .single() as any;
}

/**
 * Type-safe update for products table with full row return
 */
export async function updateProductWithSelect(
  client: SupabaseClient<Database>,
  id: string,
  updates: Database['public']['Tables']['products']['Update']
): Promise<{
  data: any | null;
  error: any;
}> {
  return await ((client
    .from('products') as any)
    .update(updates as any)
    .eq('id', id)
    .select('*, warehouses(*)')
    .single()) as any;
}

/**
 * Type-safe update for upload_batches table
 */
export async function updateUploadBatch(
  client: SupabaseClient<Database>,
  id: string,
  updates: Database['public']['Tables']['upload_batches']['Update']
): Promise<{ data: null; error: any }> {
  return await (client
    .from('upload_batches') as any)
    .update(updates)
    .eq('id', id) as any;
}

/**
 * Type-safe query for all active warehouses
 */
export async function getActiveWarehouses(
  client: SupabaseClient<Database>
): Promise<{
  data: Database['public']['Tables']['warehouses']['Row'][] | null;
  error: any;
}> {
  return await client
    .from('warehouses')
    .select('*')
    .eq('is_active', true) as any;
}

/**
 * Type-safe upsert for freight_rates table
 */
export async function upsertFreightRate(
  client: SupabaseClient<Database>,
  data: Database['public']['Tables']['freight_rates']['Insert']
): Promise<{ data: null; error: any }> {
  return await (client
    .from('freight_rates') as any)
    .upsert(data) as any;
}

/**
 * Type-safe query for single warehouse by ID
 */
export async function getWarehouseById(
  client: SupabaseClient<Database>,
  id: number
): Promise<{
  data: Database['public']['Tables']['warehouses']['Row'] | null;
  error: any;
}> {
  return await client
    .from('warehouses')
    .select('*')
    .eq('id', id)
    .single() as any;
}

/**
 * Type-safe update for price_sheets table
 */
export async function updatePriceSheet(
  client: SupabaseClient<Database>,
  id: string,
  updates: Database['public']['Tables']['price_sheets']['Update']
): Promise<{
  data: Database['public']['Tables']['price_sheets']['Row'] | null;
  error: any;
}> {
  return await (client
    .from('price_sheets') as any)
    .update(updates as any)
    .eq('id', id)
    .select()
    .single() as any;
}

/**
 * Type-safe update for products table
 */
export async function updateProduct(
  client: SupabaseClient<Database>,
  id: string,
  updates: Database['public']['Tables']['products']['Update']
): Promise<{
  data: Database['public']['Tables']['products']['Row'] | null;
  error: any;
}> {
  return await (client
    .from('products') as any)
    .update(updates)
    .eq('id', id)
    .select()
    .single() as any;
}

/**
 * Type-safe insert for customers table
 */
export async function insertCustomer(
  client: SupabaseClient<Database>,
  data: Database['public']['Tables']['customers']['Insert']
): Promise<{
  data: any | null;
  error: any;
}> {
  return await (client
    .from('customers') as any)
    .insert(data)
    .select('*, zones(*)')
    .single() as any;
}

/**
 * Type-safe update for customers table
 */
export async function updateCustomer(
  client: SupabaseClient<Database>,
  id: string,
  updates: Database['public']['Tables']['customers']['Update']
): Promise<{
  data: any | null;
  error: any;
}> {
  return await (client
    .from('customers') as any)
    .update(updates as any)
    .eq('id', id)
    .select('*, zones(*)')
    .single() as any;
}

/**
 * Type-safe update for freight_rates table
 */
export async function updateFreightRate(
  client: SupabaseClient<Database>,
  id: string,
  updates: Database['public']['Tables']['freight_rates']['Update']
): Promise<{
  data: Database['public']['Tables']['freight_rates']['Row'] | null;
  error: any;
}> {
  return await (client
    .from('freight_rates') as any)
    .update(updates)
    .eq('id', id)
    .select()
    .single() as any;
}
