-- Phase 4: Customer Management & Mapping
-- Add performance indexes for customer table

-- Index for zone filtering (used frequently in map and list views)
CREATE INDEX IF NOT EXISTS idx_customers_zone
ON customers(zone_id)
WHERE zone_id IS NOT NULL;

-- Index for state filtering
CREATE INDEX IF NOT EXISTS idx_customers_state
ON customers(state)
WHERE state IS NOT NULL;

-- Index for customer type filtering
CREATE INDEX IF NOT EXISTS idx_customers_type
ON customers(customer_type)
WHERE customer_type IS NOT NULL;

-- Index for company name search (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_customers_company_name_trgm
ON customers
USING gin (company_name gin_trgm_ops);

-- Spatial index for lat/lng queries (if PostGIS is available)
-- This enables fast radius searches and map viewport queries
-- Note: Requires PostGIS extension
DO $$
BEGIN
    -- Check if PostGIS extension exists
    IF EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'postgis'
    ) THEN
        -- Create geography column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'customers' AND column_name = 'location'
        ) THEN
            ALTER TABLE customers ADD COLUMN location geography(POINT, 4326);
        END IF;

        -- Create trigger to auto-update location from lat/lng
        CREATE OR REPLACE FUNCTION update_customer_location()
        RETURNS TRIGGER AS $func$
        BEGIN
            IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
                NEW.location = ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
            ELSE
                NEW.location = NULL;
            END IF;
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS update_customer_location_trigger ON customers;
        CREATE TRIGGER update_customer_location_trigger
        BEFORE INSERT OR UPDATE ON customers
        FOR EACH ROW
        EXECUTE FUNCTION update_customer_location();

        -- Create spatial index on location column
        CREATE INDEX IF NOT EXISTS idx_customers_location
        ON customers
        USING GIST (location);

        -- Update existing records
        UPDATE customers
        SET location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
        WHERE lat IS NOT NULL AND lng IS NOT NULL AND location IS NULL;
    END IF;
END$$;

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_customers_zone_state
ON customers(zone_id, state)
WHERE zone_id IS NOT NULL AND state IS NOT NULL;

-- Index for updated_at (useful for sync and recent changes queries)
CREATE INDEX IF NOT EXISTS idx_customers_updated_at
ON customers(updated_at DESC);

-- Comment on indexes for documentation
COMMENT ON INDEX idx_customers_zone IS 'Optimizes zone-based filtering in map and list views';
COMMENT ON INDEX idx_customers_state IS 'Optimizes state-based filtering';
COMMENT ON INDEX idx_customers_type IS 'Optimizes customer type filtering';
COMMENT ON INDEX idx_customers_company_name_trgm IS 'Optimizes fuzzy search on company names using trigrams';
COMMENT ON INDEX idx_customers_zone_state IS 'Optimizes combined zone and state queries';
COMMENT ON INDEX idx_customers_updated_at IS 'Optimizes queries for recently updated customers';
