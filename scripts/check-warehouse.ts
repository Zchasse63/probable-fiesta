import { createClient } from '@supabase/supabase-js';
import { existsSync } from 'fs';
import * as dotenv from 'dotenv';

// Auto-detect .env.local vs .env
dotenv.config({ path: existsSync('.env.local') ? '.env.local' : '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Querying warehouses table...');
  const { data, error } = await supabase.from('warehouses').select('*');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Warehouses:', JSON.stringify(data, null, 2));
  }
}

test();
