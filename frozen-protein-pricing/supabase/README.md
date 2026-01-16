# Supabase Database Setup

This directory contains database migrations and seed data for Phase 2 of the Frozen Protein Pricing Platform.

## Migration Files

1. **001_initial_schema.sql** - Creates all 10 tables with proper foreign key relationships
2. **002_indexes.sql** - Creates performance indexes on frequently queried columns
3. **003_rls_policies.sql** - Enables Row Level Security and creates policies for authenticated users
4. **seed.sql** - Inserts reference data (zones, warehouses) and sample data (products, customers)

## Running Migrations

### Option 1: Supabase Dashboard (Recommended for Manual Execution)

1. Navigate to your Supabase project dashboard
2. Go to **SQL Editor**
3. Execute each migration file in order:
   - Copy contents of `001_initial_schema.sql` → Run
   - Copy contents of `002_indexes.sql` → Run
   - Copy contents of `003_rls_policies.sql` → Run
   - Copy contents of `seed.sql` → Run

### Option 2: Supabase CLI (Automated)

If you have the Supabase CLI installed and configured:

```bash
# Navigate to project root
cd frozen-protein-pricing

# Apply all migrations
supabase db push

# Or apply migrations one by one
supabase migration up
```

## Verification

After running migrations, verify the setup in the Supabase dashboard:

### Tables Created (10 total)
- zones
- warehouses
- upload_batches
- customers
- products
- price_sheets
- price_sheet_items
- freight_rates
- manufacturer_deals
- ai_processing_log

### Indexes Created (6 total)
Run this query to verify indexes:
```sql
SELECT indexname FROM pg_indexes
WHERE schemaname='public'
ORDER BY indexname;
```

Expected indexes:
- idx_customers_zone
- idx_customers_state
- idx_products_warehouse
- idx_products_upload_batch
- idx_price_sheet_items_sheet
- idx_freight_rates_lane

### RLS Policies Active
Run this query to verify RLS is enabled:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

All tables should show `rowsecurity = true`.

### Seed Data Loaded
Verify reference data:
```sql
SELECT COUNT(*) FROM zones;        -- Expect: 4
SELECT COUNT(*) FROM warehouses;   -- Expect: 2
SELECT COUNT(*) FROM products;     -- Expect: 20
SELECT COUNT(*) FROM customers;    -- Expect: 20
```

Verify warehouse details:
```sql
SELECT city, zip FROM warehouses;
-- Expected:
-- Boyertown, 19512
-- Americus, 31709
```

## Seed Data Details

### Zones (4)
1. Southeast (zone_1): FL, GA, SC, NC, TN, AL, MS
2. Northeast (zone_2): NY, NJ, PA, MA, CT, MD
3. Midwest (zone_3): OH, MI, IL, IN, WI
4. West (zone_4): TX, CA, AZ, NV

### Warehouses (2)
1. **PA Boyertown** (A R T): 19512, serves zones 1, 2, 3
2. **GA Americus** (GA COLD): 31709, serves zones 1, 4

### Sample Products (20 total)
- 10 products per warehouse
- Covers chicken, beef, pork categories
- Brands: Tyson, Perdue, Koch, Smithfield, Hormel
- Pack sizes demonstrate all 4 parsing formats:
  - 6/5 LB → 30 lbs
  - 4x10LB → 40 lbs
  - 40 LB → 40 lbs
  - 6-5# → 30 lbs

### Sample Customers (20 total)
- 5 customers per zone
- Distributed across major cities
- All type: food_distributor
- Complete contact information

## Troubleshooting

### Foreign Key Errors
If you get foreign key constraint errors, ensure migrations run in order (001, 002, 003) and that auth.users table exists (created by Supabase automatically).

### Duplicate Key Errors on Seed Data
If re-running seed.sql, first delete existing data:
```sql
DELETE FROM customers;
DELETE FROM products;
DELETE FROM warehouses;
DELETE FROM zones;
```

### RLS Blocking Queries
If queries fail with "permission denied", ensure:
1. You're authenticated (logged in user)
2. RLS policies are correctly configured
3. For testing, you can temporarily disable RLS:
```sql
ALTER TABLE [table_name] DISABLE ROW LEVEL SECURITY;
```

## Next Steps

After migrations are complete:
1. Test Excel upload at `/inventory` page
2. Verify pack size parsing works for all 4 formats
3. Test product CRUD operations
4. Confirm React Query hooks fetch data correctly
