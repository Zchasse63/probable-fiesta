-- Fix RLS policies to require authentication per spec
-- Created: 2026-01-16

-- Drop existing public read policies
DROP POLICY IF EXISTS "Anyone can view customers" ON customers;
DROP POLICY IF EXISTS "Anyone can view products" ON products;

-- Replace with authenticated-only policies
CREATE POLICY "Authenticated users can view customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view products"
  ON products FOR SELECT
  TO authenticated
  USING (true);
