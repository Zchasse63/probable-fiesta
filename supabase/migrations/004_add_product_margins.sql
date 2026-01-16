-- Phase 3: Add default_margin_percent column to products table
-- Created: 2026-01-16

-- Add default_margin_percent column for per-product margin defaults
ALTER TABLE products
ADD COLUMN IF NOT EXISTS default_margin_percent DECIMAL(5, 2) DEFAULT 15.00;

-- Add indexes for freight_rates performance optimization
CREATE INDEX IF NOT EXISTS idx_freight_rates_lane
ON freight_rates(origin_warehouse_id, destination_zone_id);

CREATE INDEX IF NOT EXISTS idx_freight_rates_valid
ON freight_rates(valid_until)
WHERE valid_until > NOW();

-- Add index for price_sheet_items lookups
CREATE INDEX IF NOT EXISTS idx_price_sheet_items_sheet
ON price_sheet_items(price_sheet_id);

CREATE INDEX IF NOT EXISTS idx_price_sheet_items_product
ON price_sheet_items(product_id);

-- Add comments
COMMENT ON COLUMN products.default_margin_percent IS 'Default margin percentage for this product (0-100)';
COMMENT ON INDEX idx_freight_rates_lane IS 'Composite index for warehouse-zone lane lookups';
COMMENT ON INDEX idx_freight_rates_valid IS 'Partial index for active freight rates only';
