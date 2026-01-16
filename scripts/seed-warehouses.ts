import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Inserting warehouse data...');
  
  const warehouses = [
    {
      id: 1,
      code: 'PA',
      name: 'PA Boyertown',
      city: 'Boyertown',
      state: 'PA',
      zip: '19512',
      lat: 40.3342,
      lng: -75.6377,
      is_active: true,
      serves_zones: [1, 2, 3]
    },
    {
      id: 2,
      code: 'GA',
      name: 'GA Americus',
      city: 'Americus',
      state: 'GA',
      zip: '31709',
      lat: 32.0726,
      lng: -84.2327,
      is_active: true,
      serves_zones: [1, 4]
    }
  ];
  
  const { data, error } = await supabase.from('warehouses').upsert(warehouses).select();
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success:', data);
  }
}

seed();
