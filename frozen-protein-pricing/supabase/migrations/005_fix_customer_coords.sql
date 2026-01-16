-- Phase 4 Fix: Rename latitude/longitude to lat/lng
-- Resolves schema mismatch between database and application code

-- Rename columns in customers table
ALTER TABLE customers RENAME COLUMN latitude TO lat;
ALTER TABLE customers RENAME COLUMN longitude TO lng;

-- Rename columns in warehouses table (for consistency)
ALTER TABLE warehouses RENAME COLUMN latitude TO lat;
ALTER TABLE warehouses RENAME COLUMN longitude TO lng;

-- Update PostGIS trigger function to use correct column names
-- This replaces the incorrect function created in 004_customer_indexes.sql
CREATE OR REPLACE FUNCTION update_customer_location()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
        NEW.location = ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
    ELSE
        NEW.location = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update existing records if PostGIS is available
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'postgis'
    ) THEN
        UPDATE customers
        SET location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
        WHERE lat IS NOT NULL AND lng IS NOT NULL;
    END IF;
END$$;
