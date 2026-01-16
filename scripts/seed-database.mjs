#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedDatabase() {
  try {
    console.log('Starting database seed...');

    // 1. INSERT ZONES
    console.log('Inserting zones...');
    const { error: zonesError } = await supabase.from('zones').upsert([
      { id: 1, name: 'Southeast', code: 'zone_1', description: 'FL/GA/SC/NC/TN/AL/MS', states: ['FL','GA','SC','NC','TN','AL','MS'], color: '#3B82F6' },
      { id: 2, name: 'Northeast', code: 'zone_2', description: 'NY/NJ/PA/MA/CT/MD', states: ['NY','NJ','PA','MA','CT','MD'], color: '#10B981' },
      { id: 3, name: 'Midwest', code: 'zone_3', description: 'OH/MI/IL/IN/WI', states: ['OH','MI','IL','IN','WI'], color: '#F59E0B' },
      { id: 4, name: 'West', code: 'zone_4', description: 'TX/CA/AZ/NV', states: ['TX','CA','AZ','NV'], color: '#EF4444' }
    ], { onConflict: 'id' });

    if (zonesError) throw zonesError;
    console.log('✓ Zones inserted');

    // 2. INSERT WAREHOUSES
    console.log('Inserting warehouses...');
    const { error: warehousesError } = await supabase.from('warehouses').upsert([
      { id: 1, code: 'A R T', name: 'PA Boyertown', city: 'Boyertown', state: 'PA', zip: '19512', lat: 40.3343, lng: -75.6378, is_active: true, serves_zones: [1,2,3] },
      { id: 2, code: 'GA COLD', name: 'GA Americus', city: 'Americus', state: 'GA', zip: '31709', lat: 32.0724, lng: -84.2327, is_active: true, serves_zones: [1,4] }
    ], { onConflict: 'id' });

    if (warehousesError) throw warehousesError;
    console.log('✓ Warehouses inserted');

    // 3. INSERT PRODUCTS (PA Warehouse)
    console.log('Inserting PA warehouse products...');
    const { error: paProductsError } = await supabase.from('products').upsert([
      { item_code: 'PA-001', description: 'Chicken Breast Boneless Skinless', pack_size: '6/5 LB', case_weight_lbs: 30.0, brand: 'Tyson', category: 'chicken', warehouse_id: 1, cases_available: 150, unit_cost: 67.50, cost_per_lb: 2.25 },
      { item_code: 'PA-002', description: 'Ground Beef 80/20', pack_size: '4x10LB', case_weight_lbs: 40.0, brand: 'Swift', category: 'beef', warehouse_id: 1, cases_available: 200, unit_cost: 120.00, cost_per_lb: 3.00 },
      { item_code: 'PA-003', description: 'Pork Chops Center Cut', pack_size: '40 LB', case_weight_lbs: 40.0, brand: 'Koch Foods', category: 'pork', warehouse_id: 1, cases_available: 80, unit_cost: 92.00, cost_per_lb: 2.30 },
      { item_code: 'PA-004', description: 'Chicken Wings Party Style', pack_size: '6-5#', case_weight_lbs: 30.0, brand: 'Perdue', category: 'chicken', warehouse_id: 1, cases_available: 120, unit_cost: 75.00, cost_per_lb: 2.50 },
      { item_code: 'PA-005', description: 'Ground Turkey 93/7', pack_size: '4x10LB', case_weight_lbs: 40.0, brand: 'Butterball', category: 'poultry', warehouse_id: 1, cases_available: 90, unit_cost: 100.00, cost_per_lb: 2.50 },
      { item_code: 'PA-006', description: 'Ribeye Steak Choice', pack_size: '4x10LB', case_weight_lbs: 40.0, brand: 'Certified Angus', category: 'beef', warehouse_id: 1, cases_available: 45, unit_cost: 180.00, cost_per_lb: 4.50 },
      { item_code: 'PA-007', description: 'Chicken Tenders Breaded', pack_size: '6/5 LB', case_weight_lbs: 30.0, brand: 'Tyson', category: 'chicken', warehouse_id: 1, cases_available: 110, unit_cost: 72.00, cost_per_lb: 2.40 },
      { item_code: 'PA-008', description: 'Pork Shoulder Boston Butt', pack_size: '40 LB', case_weight_lbs: 40.0, brand: 'Smithfield', category: 'pork', warehouse_id: 1, cases_available: 75, unit_cost: 80.00, cost_per_lb: 2.00 },
      { item_code: 'PA-009', description: 'Turkey Breast Bone-In', pack_size: '6/5 LB', case_weight_lbs: 30.0, brand: 'Butterball', category: 'poultry', warehouse_id: 1, cases_available: 60, unit_cost: 63.00, cost_per_lb: 2.10 },
      { item_code: 'PA-010', description: 'Ground Beef 90/10', pack_size: '4x10LB', case_weight_lbs: 40.0, brand: 'Swift', category: 'beef', warehouse_id: 1, cases_available: 130, unit_cost: 140.00, cost_per_lb: 3.50 }
    ], { onConflict: 'item_code,warehouse_id' });

    if (paProductsError) throw paProductsError;
    console.log('✓ PA products inserted');

    // 4. INSERT PRODUCTS (GA Warehouse)
    console.log('Inserting GA warehouse products...');
    const { error: gaProductsError } = await supabase.from('products').upsert([
      { item_code: 'GA-001', description: 'Chicken Breast Boneless Skinless', pack_size: '6/5 LB', case_weight_lbs: 30.0, brand: 'Perdue', category: 'chicken', warehouse_id: 2, cases_available: 180, unit_cost: 66.00, cost_per_lb: 2.20 },
      { item_code: 'GA-002', description: 'Ground Beef 80/20', pack_size: '4x10LB', case_weight_lbs: 40.0, brand: 'National Beef', category: 'beef', warehouse_id: 2, cases_available: 220, unit_cost: 118.00, cost_per_lb: 2.95 },
      { item_code: 'GA-003', description: 'Pork Chops Boneless', pack_size: '40 LB', case_weight_lbs: 40.0, brand: 'Hormel', category: 'pork', warehouse_id: 2, cases_available: 95, unit_cost: 88.00, cost_per_lb: 2.20 },
      { item_code: 'GA-004', description: 'Chicken Wings Jumbo', pack_size: '6-5#', case_weight_lbs: 30.0, brand: 'Tyson', category: 'chicken', warehouse_id: 2, cases_available: 140, unit_cost: 78.00, cost_per_lb: 2.60 },
      { item_code: 'GA-005', description: 'Ground Turkey 85/15', pack_size: '4x10LB', case_weight_lbs: 40.0, brand: 'Jennie-O', category: 'poultry', warehouse_id: 2, cases_available: 100, unit_cost: 96.00, cost_per_lb: 2.40 },
      { item_code: 'GA-006', description: 'NY Strip Steak Choice', pack_size: '4x10LB', case_weight_lbs: 40.0, brand: 'Certified Angus', category: 'beef', warehouse_id: 2, cases_available: 50, unit_cost: 200.00, cost_per_lb: 5.00 },
      { item_code: 'GA-007', description: 'Chicken Drumsticks Fresh', pack_size: '40 LB', case_weight_lbs: 40.0, brand: 'Perdue', category: 'chicken', warehouse_id: 2, cases_available: 125, unit_cost: 52.00, cost_per_lb: 1.30 },
      { item_code: 'GA-008', description: 'Pork Ribs Baby Back', pack_size: '6/5 LB', case_weight_lbs: 30.0, brand: 'Smithfield', category: 'pork', warehouse_id: 2, cases_available: 70, unit_cost: 105.00, cost_per_lb: 3.50 },
      { item_code: 'GA-009', description: 'Turkey Thighs Bone-In', pack_size: '40 LB', case_weight_lbs: 40.0, brand: 'Butterball', category: 'poultry', warehouse_id: 2, cases_available: 55, unit_cost: 68.00, cost_per_lb: 1.70 },
      { item_code: 'GA-010', description: 'Ground Beef Sirloin 90/10', pack_size: '4x10LB', case_weight_lbs: 40.0, brand: 'National Beef', category: 'beef', warehouse_id: 2, cases_available: 140, unit_cost: 138.00, cost_per_lb: 3.45 }
    ], { onConflict: 'item_code,warehouse_id' });

    if (gaProductsError) throw gaProductsError;
    console.log('✓ GA products inserted');

    // 5. INSERT CUSTOMERS (Southeast Zone)
    console.log('Inserting Southeast zone customers...');
    const seCustomers = [
      { company_name: 'Jacksonville Foods Inc', address: '1200 Commerce Blvd', city: 'Jacksonville', state: 'FL', zip: '32202', zone_id: 1, contact_name: 'Mike Johnson', contact_email: 'mike@jaxfoods.com', contact_phone: '904-555-0101' },
      { company_name: 'Miami Distributors LLC', address: '850 NW 79th St', city: 'Miami', state: 'FL', zip: '33150', zone_id: 1, contact_name: 'Carlos Garcia', contact_email: 'carlos@miamidist.com', contact_phone: '305-555-0102' },
      { company_name: 'Atlanta Fresh Markets', address: '2400 Piedmont Rd', city: 'Atlanta', state: 'GA', zip: '30324', zone_id: 1, contact_name: 'Sarah Williams', contact_email: 'sarah@atlfresh.com', contact_phone: '404-555-0103' },
      { company_name: 'Charlotte Food Service', address: '5600 Wilkinson Blvd', city: 'Charlotte', state: 'NC', zip: '28208', zone_id: 1, contact_name: 'David Brown', contact_email: 'david@charlottefood.com', contact_phone: '704-555-0104' },
      { company_name: 'Nashville Provisions', address: '712 Division St', city: 'Nashville', state: 'TN', zip: '37203', zone_id: 1, contact_name: 'Emily Davis', contact_email: 'emily@nashprov.com', contact_phone: '615-555-0105' }
    ];

    for (const customer of seCustomers) {
      const { error: seCustomersError } = await supabase.from('customers').insert(customer);
      if (seCustomersError && seCustomersError.code !== '23505') throw seCustomersError;
    }

    console.log('✓ Southeast customers inserted');

    // 6. INSERT CUSTOMERS (Northeast Zone)
    console.log('Inserting Northeast zone customers...');
    const neCustomers = [
      { company_name: 'NYC Metro Foods', address: '450 W 33rd St', city: 'New York', state: 'NY', zip: '10001', zone_id: 2, contact_name: 'John Martinez', contact_email: 'john@nycmetro.com', contact_phone: '212-555-0201' },
      { company_name: 'Philadelphia Food Hub', address: '3025 Market St', city: 'Philadelphia', state: 'PA', zip: '19104', zone_id: 2, contact_name: 'Lisa Anderson', contact_email: 'lisa@philafood.com', contact_phone: '215-555-0202' },
      { company_name: 'Boston Wholesale Meats', address: '128 Border St', city: 'Boston', state: 'MA', zip: '02128', zone_id: 2, contact_name: 'Robert Taylor', contact_email: 'robert@bostonmeat.com', contact_phone: '617-555-0203' },
      { company_name: 'Newark Distribution', address: '500 Doremus Ave', city: 'Newark', state: 'NJ', zip: '07105', zone_id: 2, contact_name: 'Jennifer Lee', contact_email: 'jennifer@newarkdist.com', contact_phone: '973-555-0204' },
      { company_name: 'Baltimore Provisions', address: '1800 S Clinton St', city: 'Baltimore', state: 'MD', zip: '21224', zone_id: 2, contact_name: 'Michael Chen', contact_email: 'michael@baltprov.com', contact_phone: '410-555-0205' }
    ];

    for (const customer of neCustomers) {
      const { error: neCustomersError } = await supabase.from('customers').insert(customer);
      if (neCustomersError && neCustomersError.code !== '23505') throw neCustomersError;
    }
    console.log('✓ Northeast customers inserted');

    // 7. INSERT CUSTOMERS (Midwest Zone)
    console.log('Inserting Midwest zone customers...');
    const mwCustomers = [
      { company_name: 'Chicago Food Supply', address: '2850 S Pulaski Rd', city: 'Chicago', state: 'IL', zip: '60623', zone_id: 3, contact_name: 'Amanda White', contact_email: 'amanda@chicagofood.com', contact_phone: '312-555-0301' },
      { company_name: 'Detroit Meat Distributors', address: '5500 Michigan Ave', city: 'Detroit', state: 'MI', zip: '48210', zone_id: 3, contact_name: 'James Robinson', contact_email: 'james@detroitmeat.com', contact_phone: '313-555-0302' },
      { company_name: 'Columbus Fresh Foods', address: '1234 Parsons Ave', city: 'Columbus', state: 'OH', zip: '43206', zone_id: 3, contact_name: 'Patricia Moore', contact_email: 'patricia@columbusfresh.com', contact_phone: '614-555-0303' },
      { company_name: 'Indianapolis Wholesale', address: '3720 Lafayette Rd', city: 'Indianapolis', state: 'IN', zip: '46254', zone_id: 3, contact_name: 'Christopher Hall', contact_email: 'chris@indywholesale.com', contact_phone: '317-555-0304' },
      { company_name: 'Milwaukee Food Group', address: '2200 W St Paul Ave', city: 'Milwaukee', state: 'WI', zip: '53233', zone_id: 3, contact_name: 'Nancy Young', contact_email: 'nancy@milwaukeefood.com', contact_phone: '414-555-0305' }
    ];

    for (const customer of mwCustomers) {
      const { error: mwCustomersError } = await supabase.from('customers').insert(customer);
      if (mwCustomersError && mwCustomersError.code !== '23505') throw mwCustomersError;
    }
    console.log('✓ Midwest customers inserted');

    // 8. INSERT CUSTOMERS (West Zone)
    console.log('Inserting West zone customers...');
    const westCustomers = [
      { company_name: 'Houston Meat & Seafood', address: '4500 W 34th St', city: 'Houston', state: 'TX', zip: '77092', zone_id: 4, contact_name: 'Thomas King', contact_email: 'thomas@houstonmeat.com', contact_phone: '713-555-0401' },
      { company_name: 'Dallas Distribution Center', address: '2500 Singleton Blvd', city: 'Dallas', state: 'TX', zip: '75212', zone_id: 4, contact_name: 'Sandra Wright', contact_email: 'sandra@dallasdist.com', contact_phone: '214-555-0402' },
      { company_name: 'Los Angeles Foods Inc', address: '1850 E 14th St', city: 'Los Angeles', state: 'CA', zip: '90021', zone_id: 4, contact_name: 'Daniel Lopez', contact_email: 'daniel@lafoods.com', contact_phone: '213-555-0403' },
      { company_name: 'Phoenix Food Service', address: '3636 E Washington St', city: 'Phoenix', state: 'AZ', zip: '85034', zone_id: 4, contact_name: 'Laura Hill', contact_email: 'laura@phoenixfood.com', contact_phone: '602-555-0404' },
      { company_name: 'Las Vegas Provisions', address: '4020 E Lone Mountain Rd', city: 'Las Vegas', state: 'NV', zip: '89081', zone_id: 4, contact_name: 'Kevin Scott', contact_email: 'kevin@vegasprov.com', contact_phone: '702-555-0405' }
    ];

    for (const customer of westCustomers) {
      const { error: westCustomersError } = await supabase.from('customers').insert(customer);
      if (westCustomersError && westCustomersError.code !== '23505') throw westCustomersError;
    }
    console.log('✓ West customers inserted');

    console.log('✅ Database seeding complete!');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
