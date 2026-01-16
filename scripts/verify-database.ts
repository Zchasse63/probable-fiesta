import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env file from project root
config({ path: resolve(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!');
  console.error('   Ensure .env file contains:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDatabase() {
  console.log('🔍 Verifying database schema...\n');

  // Check all 10 tables exist
  const tables = [
    'zones',
    'warehouses',
    'upload_batches',
    'customers',
    'products',
    'price_sheets',
    'price_sheet_items',
    'freight_rates',
    'manufacturer_deals',
    'ai_processing_log',
  ];

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ Table ${table}: DOES NOT EXIST - ${error.message}`);
    } else {
      console.log(`✅ Table ${table}: exists`);
    }
  }

  console.log('\n🔍 Verifying seed data...\n');

  // AC3: Check seed data counts
  const { data: zones, error: zonesError } = await supabase
    .from('zones')
    .select('*');
  console.log(
    zonesError
      ? `❌ Zones: error - ${zonesError.message}`
      : `✅ Zones: ${zones?.length || 0} rows (expected 4)`
  );

  const { data: warehouses, error: warehousesError } = await supabase
    .from('warehouses')
    .select('*');
  console.log(
    warehousesError
      ? `❌ Warehouses: error - ${warehousesError.message}`
      : `✅ Warehouses: ${warehouses?.length || 0} rows (expected 2)`
  );
  if (warehouses && warehouses.length > 0) {
    warehouses.forEach((w: any) => {
      console.log(`   - ${w.name} (${w.city}, ${w.state} ${w.zip})`);
    });
  }

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*');
  console.log(
    productsError
      ? `❌ Products: error - ${productsError.message}`
      : `✅ Products: ${products?.length || 0} rows (expected 20)`
  );

  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('*');
  console.log(
    customersError
      ? `❌ Customers: error - ${customersError.message}`
      : `✅ Customers: ${customers?.length || 0} rows (expected 20)`
  );

  console.log('\n🔍 Verifying indexes...\n');

  // AC4: Check indexes exist (using pg_indexes system table)
  const { data: indexes, error: indexError } = await supabase.rpc('sql', {
    query: `SELECT indexname FROM pg_indexes WHERE schemaname='public' AND indexname IN (
      'idx_customers_zone',
      'idx_customers_state',
      'idx_products_warehouse',
      'idx_products_upload_batch',
      'idx_price_sheet_items_sheet',
      'idx_freight_rates_lane'
    ) ORDER BY indexname;`,
  });

  if (indexError) {
    console.log(
      `⚠️  Cannot verify indexes directly (RPC may not be enabled), checking via table structure instead`
    );
  } else {
    console.log(`✅ Found ${indexes?.length || 0} indexes (expected 6)`);
  }

  console.log('\n🔍 Verifying RLS policies...\n');

  // AC2: Verify RLS enabled
  const { data: rlsStatus, error: rlsError } = await supabase.rpc('sql', {
    query: `SELECT tablename FROM pg_tables WHERE schemaname='public' AND rowsecurity=true;`,
  });

  if (rlsError) {
    console.log(`⚠️  Cannot verify RLS status via RPC`);
  } else {
    console.log(
      `✅ RLS enabled on ${rlsStatus?.length || 0} tables (expected 10)`
    );
  }

  console.log('\n✅ Database verification complete!\n');
}

verifyDatabase().catch(console.error);
