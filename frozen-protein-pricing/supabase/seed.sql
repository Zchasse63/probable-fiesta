-- Phase 2: Seed Data
-- Insert reference data for zones, warehouses, and sample products/customers

-- Insert 4 zones
INSERT INTO zones (id, name, code, description, states, color) VALUES
  (1, 'Southeast', 'zone_1', 'Florida, Georgia, South Carolina, North Carolina, Tennessee, Alabama, Mississippi', ARRAY['FL','GA','SC','NC','TN','AL','MS'], '#3B82F6'),
  (2, 'Northeast', 'zone_2', 'New York, New Jersey, Pennsylvania, Massachusetts, Connecticut, Maryland', ARRAY['NY','NJ','PA','MA','CT','MD'], '#10B981'),
  (3, 'Midwest', 'zone_3', 'Ohio, Michigan, Illinois, Indiana, Wisconsin', ARRAY['OH','MI','IL','IN','WI'], '#F59E0B'),
  (4, 'West', 'zone_4', 'Texas, California, Arizona, Nevada', ARRAY['TX','CA','AZ','NV'], '#EF4444');

-- Insert 2 warehouses
INSERT INTO warehouses (id, code, name, city, state, zip, latitude, longitude, is_active, serves_zones) VALUES
  (1, 'A R T', 'PA Boyertown', 'Boyertown', 'PA', '19512', 40.3343, -75.6378, true, ARRAY[1,2,3]),
  (2, 'GA COLD', 'GA Americus', 'Americus', 'GA', '31709', 32.0724, -84.2327, true, ARRAY[1,4]);

-- Insert sample products for PA warehouse
INSERT INTO products (item_code, description, pack_size, case_weight_lbs, brand, category, warehouse_id, cases_available, unit_cost, cost_per_lb) VALUES
  ('PA-001', 'Boneless Skinless Chicken Breast', '6/5 LB', 30, 'Tyson', 'chicken', 1, 100, 85.50, 2.85),
  ('PA-002', 'Chicken Tenders', '4x10LB', 40, 'Perdue', 'chicken', 1, 75, 120.00, 3.00),
  ('PA-003', 'Ground Beef 80/20', '40 LB', 40, 'Koch', 'beef', 1, 50, 160.00, 4.00),
  ('PA-004', 'Ribeye Steak', '6-5#', 30, 'Tyson', 'beef', 1, 30, 210.00, 7.00),
  ('PA-005', 'Pork Chops Center Cut', '6/5 LB', 30, 'Smithfield', 'pork', 1, 60, 75.00, 2.50),
  ('PA-006', 'Bacon Sliced', '12x1LB', 12, 'Hormel', 'pork', 1, 120, 48.00, 4.00),
  ('PA-007', 'Chicken Wings', '40 LB', 40, 'Tyson', 'chicken', 1, 80, 100.00, 2.50),
  ('PA-008', 'Ground Turkey', '4x10LB', 40, 'Perdue', 'chicken', 1, 45, 80.00, 2.00),
  ('PA-009', 'Sirloin Steak', '6/5 LB', 30, 'Koch', 'beef', 1, 25, 180.00, 6.00),
  ('PA-010', 'Pork Tenderloin', '6-5#', 30, 'Smithfield', 'pork', 1, 40, 90.00, 3.00);

-- Insert sample products for GA warehouse
INSERT INTO products (item_code, description, pack_size, case_weight_lbs, brand, category, warehouse_id, cases_available, unit_cost, cost_per_lb) VALUES
  ('GA-001', 'Chicken Breast Boneless', '6/5 LB', 30, 'Perdue', 'chicken', 2, 110, 82.00, 2.73),
  ('GA-002', 'Chicken Drumsticks', '40 LB', 40, 'Tyson', 'chicken', 2, 90, 60.00, 1.50),
  ('GA-003', 'Ground Beef 90/10', '4x10LB', 40, 'Koch', 'beef', 2, 55, 180.00, 4.50),
  ('GA-004', 'T-Bone Steak', '6-5#', 30, 'Tyson', 'beef', 2, 20, 240.00, 8.00),
  ('GA-005', 'Pork Ribs Baby Back', '6/5 LB', 30, 'Hormel', 'pork', 2, 50, 105.00, 3.50),
  ('GA-006', 'Sausage Links', '12x1LB', 12, 'Smithfield', 'pork', 2, 100, 42.00, 3.50),
  ('GA-007', 'Chicken Thighs Boneless', '40 LB', 40, 'Perdue', 'chicken', 2, 70, 80.00, 2.00),
  ('GA-008', 'Turkey Breast', '4x10LB', 40, 'Tyson', 'chicken', 2, 35, 120.00, 3.00),
  ('GA-009', 'Beef Brisket', '6/5 LB', 30, 'Koch', 'beef', 2, 30, 150.00, 5.00),
  ('GA-010', 'Pork Shoulder', '6-5#', 30, 'Hormel', 'pork', 2, 45, 72.00, 2.40);

-- Insert sample customers across zones with geocoded coordinates
-- Southeast (Zone 1) - 5 customers
INSERT INTO customers (company_name, address, city, state, zip, zone_id, customer_type, contact_name, contact_email, contact_phone, lat, lng) VALUES
  ('Jacksonville Foods Inc', '1200 Main St', 'Jacksonville', 'FL', '32202', 1, 'food_distributor', 'John Smith', 'john@jacksonvillefoods.com', '904-555-0101', 30.3322, -81.6557),
  ('Miami Distributors LLC', '4500 NW 72nd Ave', 'Miami', 'FL', '33166', 1, 'food_distributor', 'Maria Garcia', 'maria@miamidist.com', '305-555-0102', 25.7767, -80.2121),
  ('Atlanta Food Service', '2800 Peachtree Rd', 'Atlanta', 'GA', '30305', 1, 'food_distributor', 'Robert Johnson', 'rob@atlantafs.com', '404-555-0103', 33.8409, -84.3843),
  ('Charlotte Wholesale Foods', '3000 Sugar Creek Rd', 'Charlotte', 'NC', '28269', 1, 'food_distributor', 'Sarah Williams', 'sarah@charlottewholesale.com', '704-555-0104', 35.2615, -80.7673),
  ('Nashville Food Partners', '1500 Broadway', 'Nashville', 'TN', '37203', 1, 'food_distributor', 'David Brown', 'david@nashvillefp.com', '615-555-0105', 36.1540, -86.7767);

-- Northeast (Zone 2) - 5 customers
INSERT INTO customers (company_name, address, city, state, zip, zone_id, customer_type, contact_name, contact_email, contact_phone, lat, lng) VALUES
  ('NYC Food Distributors', '450 W 33rd St', 'New York', 'NY', '10001', 2, 'food_distributor', 'Michael Chen', 'michael@nycfood.com', '212-555-0201', 40.7527, -73.9959),
  ('Philadelphia Food Co', '1234 Market St', 'Philadelphia', 'PA', '19107', 2, 'food_distributor', 'Jennifer Lee', 'jennifer@philafood.com', '215-555-0202', 39.9526, -75.1635),
  ('Boston Provisions Inc', '50 Congress St', 'Boston', 'MA', '02109', 2, 'food_distributor', 'Thomas Anderson', 'thomas@bostonprov.com', '617-555-0203', 42.3554, -71.0518),
  ('Newark Food Supply', '100 Raymond Blvd', 'Newark', 'NJ', '07102', 2, 'food_distributor', 'Lisa Martinez', 'lisa@newarkfood.com', '973-555-0204', 40.7357, -74.1724),
  ('Baltimore Wholesale', '300 E Pratt St', 'Baltimore', 'MD', '21202', 2, 'food_distributor', 'James Wilson', 'james@baltimorewholesale.com', '410-555-0205', 39.2864, -76.6078);

-- Midwest (Zone 3) - 5 customers
INSERT INTO customers (company_name, address, city, state, zip, zone_id, customer_type, contact_name, contact_email, contact_phone, lat, lng) VALUES
  ('Chicago Food Group', '200 N Michigan Ave', 'Chicago', 'IL', '60601', 3, 'food_distributor', 'William Taylor', 'william@chicagofood.com', '312-555-0301', 41.8868, -87.6248),
  ('Detroit Distributors', '1500 Woodward Ave', 'Detroit', 'MI', '48226', 3, 'food_distributor', 'Patricia Thomas', 'patricia@detroitdist.com', '313-555-0302', 42.3314, -83.0458),
  ('Cleveland Food Service', '1100 Superior Ave', 'Cleveland', 'OH', '44114', 3, 'food_distributor', 'Richard Moore', 'richard@clevelandfs.com', '216-555-0303', 41.4993, -81.6944),
  ('Indianapolis Food Co', '200 E Washington St', 'Indianapolis', 'IN', '46204', 3, 'food_distributor', 'Barbara Jackson', 'barbara@indyfood.com', '317-555-0304', 39.7684, -86.1581),
  ('Milwaukee Provisions', '750 N Water St', 'Milwaukee', 'WI', '53202', 3, 'food_distributor', 'Christopher White', 'chris@milwaukeeprov.com', '414-555-0305', 43.0389, -87.9065);

-- West (Zone 4) - 5 customers
INSERT INTO customers (company_name, address, city, state, zip, zone_id, customer_type, contact_name, contact_email, contact_phone, lat, lng) VALUES
  ('Dallas Food Distributors', '1200 Main St', 'Dallas', 'TX', '75201', 4, 'food_distributor', 'Jessica Harris', 'jessica@dallasfood.com', '214-555-0401', 32.7767, -96.7970),
  ('Houston Wholesale Foods', '1000 Louisiana St', 'Houston', 'TX', '77002', 4, 'food_distributor', 'Daniel Martin', 'daniel@houstonwholesale.com', '713-555-0402', 29.7604, -95.3698),
  ('Los Angeles Food Service', '633 W 5th St', 'Los Angeles', 'CA', '90071', 4, 'food_distributor', 'Michelle Thompson', 'michelle@lafs.com', '213-555-0403', 34.0522, -118.2437),
  ('Phoenix Distributors', '100 N Central Ave', 'Phoenix', 'AZ', '85004', 4, 'food_distributor', 'Kevin Garcia', 'kevin@phxdist.com', '602-555-0404', 33.4484, -112.0740),
  ('Las Vegas Food Co', '200 S 4th St', 'Las Vegas', 'NV', '89101', 4, 'food_distributor', 'Amanda Rodriguez', 'amanda@lvfood.com', '702-555-0405', 36.1699, -115.1398);

-- Reset sequences for zones and warehouses to ensure proper auto-increment
SELECT setval('zones_id_seq', (SELECT MAX(id) FROM zones));
SELECT setval('warehouses_id_seq', (SELECT MAX(id) FROM warehouses));
