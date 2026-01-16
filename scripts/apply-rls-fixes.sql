-- Apply RLS policy fixes to allow public read access for development
-- This fixes the blocking issue where unauthenticated users cannot view reference data

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can view zones" ON zones;
DROP POLICY IF EXISTS "Authenticated users can view warehouses" ON warehouses;
DROP POLICY IF EXISTS "Authenticated users can view products" ON products;
DROP POLICY IF EXISTS "Authenticated users can view customers" ON customers;

-- Create new public read policies
CREATE POLICY "Anyone can view zones"
  ON zones FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view warehouses"
  ON warehouses FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view customers"
  ON customers FOR SELECT
  USING (true);
