-- Phase 2: Initial Database Schema
-- Creates tables in dependency order to respect foreign keys

-- Zones (4 freight zones) - no dependencies
CREATE TABLE zones (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  states TEXT[],
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Warehouses - no dependencies
CREATE TABLE warehouses (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_active BOOLEAN DEFAULT true,
  serves_zones INTEGER[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Upload Batches - depends on auth.users
CREATE TABLE upload_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  row_count INTEGER,
  status TEXT DEFAULT 'processing',
  error_message TEXT,
  user_id UUID REFERENCES auth.users(id)
);

-- Customers - depends on zones
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  zone_id INTEGER REFERENCES zones(id),
  customer_type TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products - depends on warehouses, upload_batches
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code TEXT NOT NULL,
  description TEXT NOT NULL,
  pack_size TEXT,
  case_weight_lbs DECIMAL(10, 2),
  brand TEXT,
  category TEXT,
  warehouse_id INTEGER REFERENCES warehouses(id),
  cases_available INTEGER,
  unit_cost DECIMAL(10, 4),
  cost_per_lb DECIMAL(10, 4),
  spec_sheet_url TEXT,
  upload_batch_id UUID REFERENCES upload_batches(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Price Sheets - depends on zones, auth.users
CREATE TABLE price_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id INTEGER REFERENCES zones(id),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  status TEXT DEFAULT 'draft',
  excel_storage_path TEXT,
  pdf_storage_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id)
);

-- Price Sheet Items - depends on price_sheets, products, warehouses
CREATE TABLE price_sheet_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_sheet_id UUID REFERENCES price_sheets(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  warehouse_id INTEGER REFERENCES warehouses(id),
  cost_per_lb DECIMAL(10, 4),
  margin_percent DECIMAL(5, 2) DEFAULT 15.00,
  margin_amount DECIMAL(10, 4),
  freight_per_lb DECIMAL(10, 4),
  delivered_price_lb DECIMAL(10, 4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Freight Rates - depends on warehouses, zones
CREATE TABLE freight_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_warehouse_id INTEGER REFERENCES warehouses(id),
  destination_zone_id INTEGER REFERENCES zones(id),
  destination_city TEXT,
  destination_state TEXT,
  rate_per_lb DECIMAL(10, 4),
  rate_type TEXT,
  weight_lbs INTEGER DEFAULT 7500,
  dry_ltl_quote DECIMAL(10, 2),
  reefer_multiplier DECIMAL(5, 3),
  season_modifier DECIMAL(5, 3),
  origin_modifier DECIMAL(5, 3),
  valid_from DATE,
  valid_until DATE,
  goship_quote_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Manufacturer Deals - depends on auth.users
CREATE TABLE manufacturer_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT,
  source_content TEXT,
  parsed_data JSONB,
  product_description TEXT,
  price_per_lb DECIMAL(10, 4),
  quantity_lbs INTEGER,
  expiration_date DATE,
  manufacturer TEXT,
  confidence_score DECIMAL(3, 2),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- AI Processing Log - no dependencies
CREATE TABLE ai_processing_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type TEXT,
  input_summary TEXT,
  output_summary TEXT,
  tokens_used INTEGER,
  model TEXT,
  latency_ms INTEGER,
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
