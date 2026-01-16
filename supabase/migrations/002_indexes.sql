-- Phase 2: Performance Indexes
-- Created: 2026-01-15

-- Customers: frequent zone/state filtering
CREATE INDEX idx_customers_zone ON customers(zone_id);
CREATE INDEX idx_customers_state ON customers(state);

-- Products: frequent warehouse/batch filtering
CREATE INDEX idx_products_warehouse ON products(warehouse_id);
CREATE INDEX idx_products_upload_batch ON products(upload_batch_id);

-- Price sheet items: frequent sheet lookup
CREATE INDEX idx_price_sheet_items_sheet ON price_sheet_items(price_sheet_id);

-- Freight rates: frequent origin-destination lookup
CREATE INDEX idx_freight_rates_lane ON freight_rates(origin_warehouse_id, destination_zone_id);

-- Freight rates: efficient filtering of valid rates by zone
CREATE INDEX idx_freight_rates_valid ON freight_rates(destination_zone_id, valid_until) WHERE valid_until > NOW();

-- Note: PostGIS spatial index (idx_customers_location) deferred to Phase 4 mapping
