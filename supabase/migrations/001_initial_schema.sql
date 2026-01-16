-- Phase 2: Initial Schema - 10 tables in dependency order
-- Created: 2026-01-15

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ZONES: 4 freight zones
CREATE TABLE zones (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  states TEXT[] NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. WAREHOUSES: PA, GA locations
CREATE TABLE warehouses (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  is_active BOOLEAN DEFAULT true,
  serves_zones INTEGER[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. UPLOAD_BATCHES: track inventory uploads
CREATE TABLE upload_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  row_count INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('processing', 'completed', 'error')),
  error_message TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CUSTOMERS: 440+ food distributors
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  zone_id INTEGER REFERENCES zones(id) ON DELETE SET NULL,
  customer_type TEXT DEFAULT 'distributor',
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. PRODUCTS: inventory items
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code TEXT NOT NULL,
  description TEXT NOT NULL,
  pack_size TEXT NOT NULL,
  case_weight_lbs DECIMAL(10, 4),
  brand TEXT,
  category TEXT,
  warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE CASCADE,
  cases_available INTEGER DEFAULT 0,
  unit_cost DECIMAL(10, 4),
  cost_per_lb DECIMAL(10, 4),
  spec_sheet_url TEXT,
  upload_batch_id UUID REFERENCES upload_batches(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(item_code, warehouse_id)
);

-- 6. PRICE_SHEETS: generated price lists
CREATE TABLE price_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id INTEGER REFERENCES zones(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
  excel_storage_path TEXT,
  pdf_storage_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL
);

-- 7. PRICE_SHEET_ITEMS: individual prices per product/zone
CREATE TABLE price_sheet_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_sheet_id UUID REFERENCES price_sheets(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE CASCADE,
  cost_per_lb DECIMAL(10, 4) NOT NULL,
  margin_percent DECIMAL(5, 2) NOT NULL,
  margin_amount DECIMAL(10, 4) NOT NULL,
  freight_per_lb DECIMAL(10, 4) NOT NULL,
  delivered_price_lb DECIMAL(10, 4) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. FREIGHT_RATES: cached freight quotes
CREATE TABLE freight_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE CASCADE,
  destination_zone_id INTEGER REFERENCES zones(id) ON DELETE CASCADE,
  city TEXT,
  state TEXT,
  rate_per_lb DECIMAL(10, 4) NOT NULL,
  rate_type TEXT NOT NULL CHECK (rate_type IN ('dry_ltl', 'frozen_ltl', 'truckload')),
  weight_lbs INTEGER NOT NULL,
  dry_ltl_quote DECIMAL(10, 2),
  multipliers JSONB,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  goship_quote_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. MANUFACTURER_DEALS: parsed deals from emails
CREATE TABLE manufacturer_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL CHECK (source_type IN ('email', 'pdf', 'manual')),
  source_content TEXT,
  parsed_data JSONB,
  product_description TEXT,
  price_per_lb DECIMAL(10, 4),
  quantity_lbs INTEGER,
  expiration_date DATE,
  manufacturer TEXT,
  confidence_score DECIMAL(3, 2),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL
);

-- 10. AI_PROCESSING_LOG: AI usage tracking
CREATE TABLE ai_processing_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type TEXT NOT NULL,
  input_summary TEXT,
  output_summary TEXT,
  tokens_used INTEGER,
  model TEXT,
  latency_ms INTEGER,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
