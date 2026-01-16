-- Phase 2: Performance Indexes
-- Create indexes on frequently queried columns

CREATE INDEX idx_customers_zone ON customers(zone_id);
CREATE INDEX idx_customers_state ON customers(state);
CREATE INDEX idx_products_warehouse ON products(warehouse_id);
CREATE INDEX idx_products_upload_batch ON products(upload_batch_id);
CREATE INDEX idx_price_sheet_items_sheet ON price_sheet_items(price_sheet_id);
CREATE INDEX idx_freight_rates_lane ON freight_rates(origin_warehouse_id, destination_zone_id);
