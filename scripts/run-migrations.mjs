#!/usr/bin/env node
/**
 * Execute Supabase migrations
 * Run with: node scripts/run-migrations.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lctskueecpvabdjoafpp.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_4_Rwx0uTCIT2OqAeQl2okQ_9M4Tj2Ld';

// Create admin client with service role key
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSql(sql, description) {
  console.log(`Executing: ${description}...`);

  try {
    // Split SQL into individual statements (simple split by semicolon)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      const { data, error } = await supabase.rpc('exec', { sql: statement + ';' });
      if (error) {
        // Try alternative: direct query execution
        const result = await fetch(`${SUPABASE_URL}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ query: statement })
        });

        if (!result.ok) {
          const errorText = await result.text();
          throw new Error(`SQL execution failed: ${errorText}`);
        }
      }
    }

    console.log(`✓ ${description} completed`);
    return true;
  } catch (error) {
    console.error(`✗ ${description} failed:`, error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('Starting database migrations...\n');

    // Read migration files
    const migration001 = readFileSync(join(projectRoot, 'supabase/migrations/001_initial_schema.sql'), 'utf8');
    const migration002 = readFileSync(join(projectRoot, 'supabase/migrations/002_indexes.sql'), 'utf8');
    const migration003 = readFileSync(join(projectRoot, 'supabase/migrations/003_rls_policies.sql'), 'utf8');
    const seedSql = readFileSync(join(projectRoot, 'supabase/seed.sql'), 'utf8');

    // Execute migrations in order
    await executeSql(migration001, '001_initial_schema.sql');
    await executeSql(migration002, '002_indexes.sql');
    await executeSql(migration003, '003_rls_policies.sql');
    await executeSql(seedSql, 'seed.sql');

    console.log('\n✓ All migrations and seed data executed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    console.error('\nPlease execute migrations manually via Supabase dashboard:');
    console.error('1. Go to https://supabase.com/dashboard/project/lctskueecpvabdjoafpp/sql/new');
    console.error('2. Copy and paste each migration file in order:');
    console.error('   - supabase/migrations/001_initial_schema.sql');
    console.error('   - supabase/migrations/002_indexes.sql');
    console.error('   - supabase/migrations/003_rls_policies.sql');
    console.error('   - supabase/seed.sql');
    process.exit(1);
  }
}

main();
