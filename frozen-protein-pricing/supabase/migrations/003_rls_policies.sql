-- Phase 2: Row Level Security Policies
-- Enable RLS and create policies for authenticated users

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

-- Zones: Allow all authenticated users to read (reference data)
CREATE POLICY "Authenticated users can view zones"
  ON zones FOR SELECT
  TO authenticated
  USING (true);

-- Warehouses: Allow all authenticated users to read (reference data)
CREATE POLICY "Authenticated users can view warehouses"
  ON warehouses FOR SELECT
  TO authenticated
  USING (true);

-- Upload Batches: Users can only see their own uploads
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

-- Customers: Users can manage their own customers
CREATE POLICY "Users can view own customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete customers"
  ON customers FOR DELETE
  TO authenticated
  USING (true);

-- Products: Users can manage products from their uploads
CREATE POLICY "Users can view products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (true);

-- Price Sheets: Users can manage their own price sheets
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

-- Price Sheet Items: Allow access based on parent price sheet
CREATE POLICY "Users can view price sheet items"
  ON price_sheet_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM price_sheets
      WHERE price_sheets.id = price_sheet_items.price_sheet_id
        AND price_sheets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert price sheet items"
  ON price_sheet_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM price_sheets
      WHERE price_sheets.id = price_sheet_items.price_sheet_id
        AND price_sheets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update price sheet items"
  ON price_sheet_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM price_sheets
      WHERE price_sheets.id = price_sheet_items.price_sheet_id
        AND price_sheets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete price sheet items"
  ON price_sheet_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM price_sheets
      WHERE price_sheets.id = price_sheet_items.price_sheet_id
        AND price_sheets.user_id = auth.uid()
    )
  );

-- Freight Rates: All authenticated users can view and manage
CREATE POLICY "Users can view freight rates"
  ON freight_rates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert freight rates"
  ON freight_rates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update freight rates"
  ON freight_rates FOR UPDATE
  TO authenticated
  USING (true);

-- Manufacturer Deals: Users can manage their own deals
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

-- AI Processing Log: All authenticated users can view and insert
CREATE POLICY "Users can view AI processing log"
  ON ai_processing_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert AI processing log"
  ON ai_processing_log FOR INSERT
  TO authenticated
  WITH CHECK (true);
