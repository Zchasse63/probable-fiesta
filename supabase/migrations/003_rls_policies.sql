-- Phase 2: Row Level Security Policies
-- Created: 2026-01-15

-- Enable RLS on all tables
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_sheet_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE freight_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE manufacturer_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_processing_log ENABLE ROW LEVEL SECURITY;

-- ZONES: reference table, allow public read for development
CREATE POLICY "Anyone can view zones"
  ON zones FOR SELECT
  USING (true);

-- WAREHOUSES: reference table, allow public read for development
CREATE POLICY "Anyone can view warehouses"
  ON warehouses FOR SELECT
  USING (true);

-- UPLOAD_BATCHES: users can view/insert their own batches
CREATE POLICY "Users can view own upload batches"
  ON upload_batches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own upload batches"
  ON upload_batches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own upload batches"
  ON upload_batches FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- CUSTOMERS: authenticated users can CRUD (no user_id on customers table, so allow all authenticated)
CREATE POLICY "Authenticated users can view customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete customers"
  ON customers FOR DELETE
  TO authenticated
  USING (true);

-- PRODUCTS: authenticated users can CRUD (no user_id on products table, so allow all authenticated)
CREATE POLICY "Authenticated users can view products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (true);

-- PRICE_SHEETS: users can CRUD their own price sheets
CREATE POLICY "Users can view own price sheets"
  ON price_sheets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own price sheets"
  ON price_sheets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own price sheets"
  ON price_sheets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own price sheets"
  ON price_sheets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- PRICE_SHEET_ITEMS: access controlled via price_sheets ownership
CREATE POLICY "Users can view price sheet items for own sheets"
  ON price_sheet_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM price_sheets
      WHERE price_sheets.id = price_sheet_items.price_sheet_id
      AND price_sheets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert price sheet items for own sheets"
  ON price_sheet_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM price_sheets
      WHERE price_sheets.id = price_sheet_items.price_sheet_id
      AND price_sheets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update price sheet items for own sheets"
  ON price_sheet_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM price_sheets
      WHERE price_sheets.id = price_sheet_items.price_sheet_id
      AND price_sheets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete price sheet items for own sheets"
  ON price_sheet_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM price_sheets
      WHERE price_sheets.id = price_sheet_items.price_sheet_id
      AND price_sheets.user_id = auth.uid()
    )
  );

-- FREIGHT_RATES: allow all authenticated users (shared cache)
CREATE POLICY "Authenticated users can view freight rates"
  ON freight_rates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert freight rates"
  ON freight_rates FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- MANUFACTURER_DEALS: users can CRUD their own deals
CREATE POLICY "Users can view own manufacturer deals"
  ON manufacturer_deals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own manufacturer deals"
  ON manufacturer_deals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own manufacturer deals"
  ON manufacturer_deals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own manufacturer deals"
  ON manufacturer_deals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- AI_PROCESSING_LOG: users can only view their own logs, insert with their own user_id
CREATE POLICY "Users can view own AI processing log"
  ON ai_processing_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI processing log"
  ON ai_processing_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
