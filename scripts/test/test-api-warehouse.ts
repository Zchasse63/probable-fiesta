import { createServerClient } from '@/lib/supabase/server';
import { getWarehouseById } from '@/lib/supabase/helpers';

async function test() {
  const supabase = await createServerClient();
  
  console.log('Testing getWarehouseById(1)...');
  const result = await getWarehouseById(supabase, 1);
  console.log('Result:', result);
  
  console.log('\nDirect query...');
  const direct = await supabase.from('warehouses').select('*').eq('id', 1).single();
  console.log('Direct:', direct);
}

test().catch(console.error);
