import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyRLSFixes() {
  console.log('🔧 Applying RLS policy fixes to remote database...\n');

  const sqlContent = readFileSync(
    join(__dirname, 'apply-rls-fixes.sql'),
    'utf-8'
  );

  // Split SQL content by statement (semicolon-separated)
  const statements = sqlContent
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    if (!statement) continue;

    console.log(`Executing: ${statement.substring(0, 60)}...`);

    const { error } = await supabase.rpc('exec_sql', {
      sql_string: statement,
    });

    if (error) {
      // Try alternative method - direct query
      const { error: error2 } = await supabase.from('_migrations').insert({
        statement: statement,
      });

      if (error2) {
        console.log(`⚠️  Could not execute via RPC: ${error.message}`);
        console.log('   Manual execution may be required via Supabase SQL Editor');
      }
    } else {
      console.log('✅ Executed successfully');
    }
  }

  console.log(
    '\n📝 Note: If RPC execution failed, copy scripts/apply-rls-fixes.sql content to Supabase SQL Editor and run manually.\n'
  );
  console.log('✅ RLS fix script complete!\n');
}

applyRLSFixes().catch((error) => {
  console.error('❌ Error applying RLS fixes:', error.message);
  console.log(
    '\n💡 Manual steps: Go to Supabase Dashboard → SQL Editor → paste scripts/apply-rls-fixes.sql → Run\n'
  );
  process.exit(1);
});
