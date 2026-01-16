# Database Migration Instructions

## ⚠️ IMPORTANT: Migrations Must Be Executed Manually

Due to Supabase security restrictions, migrations cannot be executed programmatically via the REST API. You must execute them manually via the Supabase dashboard.

## Step-by-Step Migration Process

### 1. Access Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/lctskueecpvabdjoafpp/sql/new
2. Log in with your Supabase account credentials

### 2. Execute Migrations in Order

**CRITICAL**: Migrations MUST be executed in this exact order to respect foreign key dependencies.

#### Migration 1: Initial Schema (001_initial_schema.sql)

1. Open `supabase/migrations/001_initial_schema.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click "Run" button
5. Verify success message (should create 10 tables)

#### Migration 2: Indexes (002_indexes.sql)

1. Open `supabase/migrations/002_indexes.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click "Run" button
5. Verify success message (should create 6 indexes)

#### Migration 3: RLS Policies (003_rls_policies.sql)

1. Open `supabase/migrations/003_rls_policies.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click "Run" button
5. Verify success message (should enable RLS on 10 tables, create 29 policies)

#### Seed Data (seed.sql)

1. Open `supabase/seed.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click "Run" button
5. Verify success message (should insert 4 zones, 2 warehouses, 20 products, 20 customers)

### 3. Verify Migration Success

Run the verification script to confirm all migrations executed correctly:

```bash
node scripts/verify-migrations.mjs
```

Expected output:
```
✓ Database connection successful
✓ Tables: 10/10 exist
✓ Indexes: 6/6 exist
✓ RLS: enabled on all tables
✓ Seed data: 4 zones, 2 warehouses, 20 products, 20 customers
✓ All migrations verified successfully!
```

### 4. Troubleshooting

**If migrations fail:**

1. Check error message in Supabase SQL Editor
2. Common issues:
   - Table already exists: Run `DROP TABLE IF EXISTS [table_name] CASCADE;` first
   - Foreign key violation: Ensure migrations run in correct order
   - Permission denied: Ensure you're logged in as project owner

**To reset database (CAUTION: destroys all data):**

```sql
-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS ai_processing_log CASCADE;
DROP TABLE IF EXISTS manufacturer_deals CASCADE;
DROP TABLE IF EXISTS freight_rates CASCADE;
DROP TABLE IF EXISTS price_sheet_items CASCADE;
DROP TABLE IF EXISTS price_sheets CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS upload_batches CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE;
DROP TABLE IF EXISTS zones CASCADE;
```

Then re-run migrations from step 2.

## Migration Status

- [ ] 001_initial_schema.sql
- [ ] 002_indexes.sql
- [ ] 003_rls_policies.sql
- [ ] seed.sql

**Mark each checkbox after successful execution.**

## Next Steps

After migrations complete:
1. Run verification script: `node scripts/verify-migrations.mjs`
2. Start dev server: `npm run dev`
3. Navigate to http://localhost:3000/inventory
4. Test inventory upload functionality
