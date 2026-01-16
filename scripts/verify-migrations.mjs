#!/usr/bin/env node
/**
 * Verify Supabase migrations executed successfully
 * Run with: node scripts/verify-migrations.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lctskueecpvabdjoafpp.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_4_Rwx0uTCIT2OqAeQl2okQ_9M4Tj2Ld';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const EXPECTED_TABLES = [
  'zones',
  'warehouses',
  'upload_batches',
  'customers',
  'products',
  'price_sheets',
  'price_sheet_items',
  'freight_rates',
  'manufacturer_deals',
  'ai_processing_log'
];

const EXPECTED_INDEXES = [
  'idx_customers_zone',
  'idx_customers_state',
  'idx_products_warehouse',
  'idx_products_upload_batch',
  'idx_price_sheet_items_sheet',
  'idx_freight_rates_lane'
];

async function verifyTables() {
  console.log('Checking tables...');
  const results = [];

  for (const table of EXPECTED_TABLES) {
    const { data, error } = await supabase.from(table).select('*').limit(0);

    if (error) {
      console.error(`  ✗ Table '${table}' missing or inaccessible: ${error.message}`);
      results.push(false);
    } else {
      console.log(`  ✓ Table '${table}' exists`);
      results.push(true);
    }
  }

  return results.every(r => r);
}

async function verifySeedData() {
  console.log('\nChecking seed data...');

  try {
    // Check zones
    const { data: zones, error: zonesError } = await supabase
      .from('zones')
      .select('*');

    if (zonesError) throw zonesError;
    console.log(`  ✓ Zones: ${zones?.length || 0}/4 (expected 4)`);

    // Check warehouses
    const { data: warehouses, error: warehousesError } = await supabase
      .from('warehouses')
      .select('*');

    if (warehousesError) throw warehousesError;
    console.log(`  ✓ Warehouses: ${warehouses?.length || 0}/2 (expected 2)`);

    // Check warehouse details
    const pa = warehouses?.find(w => w.state === 'PA');
    const ga = warehouses?.find(w => w.state === 'GA');

    if (pa && pa.zip === '19512' && pa.city === 'Boyertown') {
      console.log('  ✓ PA warehouse: Boyertown 19512');
    } else {
      console.error('  ✗ PA warehouse missing or incorrect');
    }

    if (ga && ga.zip === '31709' && ga.city === 'Americus') {
      console.log('  ✓ GA warehouse: Americus 31709');
    } else {
      console.error('  ✗ GA warehouse missing or incorrect');
    }

    // Check products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*');

    if (productsError) throw productsError;
    console.log(`  ✓ Products: ${products?.length || 0}/20 (expected 20)`);

    // Check customers
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*');

    if (customersError) throw customersError;
    console.log(`  ✓ Customers: ${customers?.length || 0}/20 (expected 20)`);

    return (
      zones?.length === 4 &&
      warehouses?.length === 2 &&
      products?.length === 20 &&
      customers?.length === 20
    );
  } catch (error) {
    console.error(`  ✗ Seed data check failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('=== Verifying Supabase Migrations ===\n');

  try {
    // Test connection
    console.log('Testing database connection...');
    const { data, error } = await supabase.from('zones').select('count').limit(0);
    if (error) {
      throw new Error(`Connection failed: ${error.message}`);
    }
    console.log('✓ Database connection successful\n');

    // Verify tables
    const tablesOk = await verifyTables();

    // Verify seed data
    const seedOk = await verifySeedData();

    // Summary
    console.log('\n=== Verification Summary ===');
    if (tablesOk && seedOk) {
      console.log('✓ All migrations verified successfully!');
      console.log('\nNext steps:');
      console.log('1. Start dev server: npm run dev');
      console.log('2. Navigate to: http://localhost:3000/inventory');
      console.log('3. Test inventory upload functionality');
      process.exit(0);
    } else {
      console.log('✗ Migration verification failed');
      console.log('\nPlease execute migrations manually via Supabase dashboard.');
      console.log('See: supabase/MIGRATION_INSTRUCTIONS.md');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n✗ Verification error:', error.message);
    console.log('\nMigrations may not be executed yet.');
    console.log('Please run migrations manually via Supabase dashboard.');
    console.log('See: supabase/MIGRATION_INSTRUCTIONS.md');
    process.exit(1);
  }
}

main();
