-- Phase 2: Seed Data
-- Created: 2026-01-15

-- 1. INSERT 4 ZONES
INSERT INTO zones (id, name, code, description, states, color) VALUES
  (1, 'Southeast', 'zone_1', 'FL/GA/AL/SC/NC/TN/MS', ARRAY['FL','GA','AL','SC','NC','TN','MS'], '#FF6B6B'),
  (2, 'Northeast', 'zone_2', 'NY/NJ/PA/MA/CT/MD/VA/DE', ARRAY['NY','NJ','PA','MA','CT','MD','VA','DE'], '#4ECDC4'),
  (3, 'Midwest', 'zone_3', 'OH/MI/IL/IN/WI/MN/MO', ARRAY['OH','MI','IL','IN','WI','MN','MO'], '#45B7D1'),
  (4, 'West', 'zone_4', 'TX/CA/AZ/NV/OR/WA/CO/UT', ARRAY['TX','CA','AZ','NV','OR','WA','CO','UT'], '#FFA07A');

-- 2. INSERT 2 WAREHOUSES
INSERT INTO warehouses (id, code, name, city, state, zip, lat, lng, is_active, serves_zones) VALUES
  (1, 'A R T', 'PA Boyertown', 'Boyertown', 'PA', '19512', 40.3343, -75.6378, true, ARRAY[1,2,3]),
  (2, 'GA COLD', 'GA Americus', 'Americus', 'GA', '31709', 32.0724, -84.2327, true, ARRAY[1,4]);

-- 3. INSERT 20 SAMPLE PRODUCTS (10 per warehouse)
-- PA Warehouse Products
INSERT INTO products (item_code, description, pack_size, case_weight_lbs, brand, category, warehouse_id, cases_available, unit_cost, cost_per_lb) VALUES
  ('PA-001', 'Chicken Breast Boneless Skinless', '6/5 LB', 30.0, 'Tyson', 'chicken', 1, 150, 67.50, 2.25),
  ('PA-002', 'Ground Beef 80/20', '4x10LB', 40.0, 'Swift', 'beef', 1, 200, 120.00, 3.00),
  ('PA-003', 'Pork Chops Center Cut', '40 LB', 40.0, 'Koch Foods', 'pork', 1, 80, 92.00, 2.30),
  ('PA-004', 'Chicken Wings Party Style', '6-5#', 30.0, 'Perdue', 'chicken', 1, 120, 75.00, 2.50),
  ('PA-005', 'Ground Turkey 93/7', '4x10LB', 40.0, 'Butterball', 'poultry', 1, 90, 100.00, 2.50),
  ('PA-006', 'Ribeye Steak Choice', '4x10LB', 40.0, 'Certified Angus', 'beef', 1, 45, 180.00, 4.50),
  ('PA-007', 'Chicken Tenders Breaded', '6/5 LB', 30.0, 'Tyson', 'chicken', 1, 110, 72.00, 2.40),
  ('PA-008', 'Pork Shoulder Boston Butt', '40 LB', 40.0, 'Smithfield', 'pork', 1, 75, 80.00, 2.00),
  ('PA-009', 'Turkey Breast Bone-In', '6/5 LB', 30.0, 'Butterball', 'poultry', 1, 60, 63.00, 2.10),
  ('PA-010', 'Ground Beef 90/10', '4x10LB', 40.0, 'Swift', 'beef', 1, 130, 140.00, 3.50);

-- GA Warehouse Products
INSERT INTO products (item_code, description, pack_size, case_weight_lbs, brand, category, warehouse_id, cases_available, unit_cost, cost_per_lb) VALUES
  ('GA-001', 'Chicken Breast Boneless Skinless', '6/5 LB', 30.0, 'Perdue', 'chicken', 2, 180, 66.00, 2.20),
  ('GA-002', 'Ground Beef 80/20', '4x10LB', 40.0, 'National Beef', 'beef', 2, 220, 118.00, 2.95),
  ('GA-003', 'Pork Chops Boneless', '40 LB', 40.0, 'Hormel', 'pork', 2, 95, 88.00, 2.20),
  ('GA-004', 'Chicken Wings Jumbo', '6-5#', 30.0, 'Tyson', 'chicken', 2, 140, 78.00, 2.60),
  ('GA-005', 'Ground Turkey 85/15', '4x10LB', 40.0, 'Jennie-O', 'poultry', 2, 100, 96.00, 2.40),
  ('GA-006', 'NY Strip Steak Choice', '4x10LB', 40.0, 'Certified Angus', 'beef', 2, 50, 200.00, 5.00),
  ('GA-007', 'Chicken Drumsticks Fresh', '40 LB', 40.0, 'Perdue', 'chicken', 2, 125, 52.00, 1.30),
  ('GA-008', 'Pork Ribs Baby Back', '6/5 LB', 30.0, 'Smithfield', 'pork', 2, 70, 105.00, 3.50),
  ('GA-009', 'Turkey Thighs Bone-In', '40 LB', 40.0, 'Butterball', 'poultry', 2, 55, 68.00, 1.70),
  ('GA-010', 'Ground Beef Sirloin 90/10', '4x10LB', 40.0, 'National Beef', 'beef', 2, 140, 138.00, 3.45);

-- 4. INSERT 20 SAMPLE CUSTOMERS (5 per zone)
-- Southeast Zone (zone_id = 1)
INSERT INTO customers (company_name, address, city, state, zip, zone_id, contact_name, contact_email, contact_phone) VALUES
  ('Jacksonville Foods Inc', '1200 Commerce Blvd', 'Jacksonville', 'FL', '32202', 1, 'Mike Johnson', 'mike@jaxfoods.com', '904-555-0101'),
  ('Miami Distributors LLC', '850 NW 79th St', 'Miami', 'FL', '33150', 1, 'Carlos Garcia', 'carlos@miamidist.com', '305-555-0102'),
  ('Atlanta Fresh Markets', '2400 Piedmont Rd', 'Atlanta', 'GA', '30324', 1, 'Sarah Williams', 'sarah@atlfresh.com', '404-555-0103'),
  ('Charlotte Food Service', '5600 Wilkinson Blvd', 'Charlotte', 'NC', '28208', 1, 'David Brown', 'david@charlottefood.com', '704-555-0104'),
  ('Nashville Provisions', '712 Division St', 'Nashville', 'TN', '37203', 1, 'Emily Davis', 'emily@nashprov.com', '615-555-0105');

-- Northeast Zone (zone_id = 2)
INSERT INTO customers (company_name, address, city, state, zip, zone_id, contact_name, contact_email, contact_phone) VALUES
  ('NYC Metro Foods', '450 W 33rd St', 'New York', 'NY', '10001', 2, 'John Martinez', 'john@nycmetro.com', '212-555-0201'),
  ('Philadelphia Food Hub', '3025 Market St', 'Philadelphia', 'PA', '19104', 2, 'Lisa Anderson', 'lisa@philafood.com', '215-555-0202'),
  ('Boston Wholesale Meats', '128 Border St', 'Boston', 'MA', '02128', 2, 'Robert Taylor', 'robert@bostonmeat.com', '617-555-0203'),
  ('Newark Distribution', '500 Doremus Ave', 'Newark', 'NJ', '07105', 2, 'Jennifer Lee', 'jennifer@newarkdist.com', '973-555-0204'),
  ('Baltimore Provisions', '1800 S Clinton St', 'Baltimore', 'MD', '21224', 2, 'Michael Chen', 'michael@baltprov.com', '410-555-0205');

-- Midwest Zone (zone_id = 3)
INSERT INTO customers (company_name, address, city, state, zip, zone_id, contact_name, contact_email, contact_phone) VALUES
  ('Chicago Food Supply', '2850 S Pulaski Rd', 'Chicago', 'IL', '60623', 3, 'Amanda White', 'amanda@chicagofood.com', '312-555-0301'),
  ('Detroit Meat Distributors', '5500 Michigan Ave', 'Detroit', 'MI', '48210', 3, 'James Robinson', 'james@detroitmeat.com', '313-555-0302'),
  ('Columbus Fresh Foods', '1234 Parsons Ave', 'Columbus', 'OH', '43206', 3, 'Patricia Moore', 'patricia@columbusfresh.com', '614-555-0303'),
  ('Indianapolis Wholesale', '3720 Lafayette Rd', 'Indianapolis', 'IN', '46254', 3, 'Christopher Hall', 'chris@indywholesale.com', '317-555-0304'),
  ('Milwaukee Food Group', '2200 W St Paul Ave', 'Milwaukee', 'WI', '53233', 3, 'Nancy Young', 'nancy@milwaukeefood.com', '414-555-0305');

-- West Zone (zone_id = 4)
INSERT INTO customers (company_name, address, city, state, zip, zone_id, contact_name, contact_email, contact_phone) VALUES
  ('Houston Meat & Seafood', '4500 W 34th St', 'Houston', 'TX', '77092', 4, 'Thomas King', 'thomas@houstonmeat.com', '713-555-0401'),
  ('Dallas Distribution Center', '2500 Singleton Blvd', 'Dallas', 'TX', '75212', 4, 'Sandra Wright', 'sandra@dallasdist.com', '214-555-0402'),
  ('Los Angeles Foods Inc', '1850 E 14th St', 'Los Angeles', 'CA', '90021', 4, 'Daniel Lopez', 'daniel@lafoods.com', '213-555-0403'),
  ('Phoenix Food Service', '3636 E Washington St', 'Phoenix', 'AZ', '85034', 4, 'Laura Hill', 'laura@phoenixfood.com', '602-555-0404'),
  ('Las Vegas Provisions', '4020 E Lone Mountain Rd', 'Las Vegas', 'NV', '89081', 4, 'Kevin Scott', 'kevin@vegasprov.com', '702-555-0405');
