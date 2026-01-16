/* eslint-disable @typescript-eslint/no-explicit-any */
// Script to generate 420 additional customers with geocoded coordinates
// Distributes customers across all 4 zones with realistic city coordinates

interface CustomerData {
  company_name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  zone_id: number;
  lat: number;
  lng: number;
}

// Real coordinates for major cities in each zone
const cityData = {
  // Zone 1 - Southeast
  zone1: [
    { city: 'Tampa', state: 'FL', zip: '33602', lat: 27.9506, lng: -82.4572 },
    { city: 'Orlando', state: 'FL', zip: '32801', lat: 28.5383, lng: -81.3792 },
    { city: 'Tallahassee', state: 'FL', zip: '32301', lat: 32.3182, lng: -84.3643 },
    { city: 'Savannah', state: 'GA', zip: '31401', lat: 32.0809, lng: -81.0912 },
    { city: 'Columbus', state: 'GA', zip: '31901', lat: 32.4609, lng: -84.9877 },
    { city: 'Augusta', state: 'GA', zip: '30901', lat: 33.4735, lng: -82.0105 },
    { city: 'Birmingham', state: 'AL', zip: '35203', lat: 33.5207, lng: -86.8025 },
    { city: 'Montgomery', state: 'AL', zip: '36104', lat: 32.3668, lng: -86.3000 },
    { city: 'Mobile', state: 'AL', zip: '36602', lat: 30.6954, lng: -88.0399 },
    { city: 'Charleston', state: 'SC', zip: '29401', lat: 32.7765, lng: -79.9311 },
    { city: 'Columbia', state: 'SC', zip: '29201', lat: 34.0007, lng: -81.0348 },
    { city: 'Greenville', state: 'SC', zip: '29601', lat: 34.8526, lng: -82.3940 },
    { city: 'Raleigh', state: 'NC', zip: '27601', lat: 35.7796, lng: -78.6382 },
    { city: 'Greensboro', state: 'NC', zip: '27401', lat: 36.0726, lng: -79.7920 },
    { city: 'Durham', state: 'NC', zip: '27701', lat: 35.9940, lng: -78.8986 },
    { city: 'Memphis', state: 'TN', zip: '38103', lat: 35.1495, lng: -90.0490 },
    { city: 'Knoxville', state: 'TN', zip: '37902', lat: 35.9606, lng: -83.9207 },
    { city: 'Chattanooga', state: 'TN', zip: '37402', lat: 35.0456, lng: -85.3097 },
    { city: 'Jackson', state: 'MS', zip: '39201', lat: 32.2988, lng: -90.1848 },
    { city: 'Biloxi', state: 'MS', zip: '39530', lat: 30.3960, lng: -88.8853 },
  ],
  // Zone 2 - Northeast
  zone2: [
    { city: 'Buffalo', state: 'NY', zip: '14202', lat: 42.8864, lng: -78.8784 },
    { city: 'Rochester', state: 'NY', zip: '14604', lat: 43.1566, lng: -77.6088 },
    { city: 'Syracuse', state: 'NY', zip: '13202', lat: 43.0481, lng: -76.1474 },
    { city: 'Albany', state: 'NY', zip: '12207', lat: 42.6526, lng: -73.7562 },
    { city: 'Yonkers', state: 'NY', zip: '10701', lat: 40.9312, lng: -73.8987 },
    { city: 'Jersey City', state: 'NJ', zip: '07302', lat: 40.7178, lng: -74.0431 },
    { city: 'Paterson', state: 'NJ', zip: '07505', lat: 40.9168, lng: -74.1718 },
    { city: 'Elizabeth', state: 'NJ', zip: '07201', lat: 40.6640, lng: -74.2107 },
    { city: 'Trenton', state: 'NJ', zip: '08608', lat: 40.2206, lng: -74.7597 },
    { city: 'Pittsburgh', state: 'PA', zip: '15222', lat: 40.4406, lng: -79.9959 },
    { city: 'Allentown', state: 'PA', zip: '18101', lat: 40.6084, lng: -75.4902 },
    { city: 'Erie', state: 'PA', zip: '16501', lat: 42.1292, lng: -80.0851 },
    { city: 'Reading', state: 'PA', zip: '19601', lat: 40.3356, lng: -75.9269 },
    { city: 'Worcester', state: 'MA', zip: '01608', lat: 42.2626, lng: -71.8023 },
    { city: 'Springfield', state: 'MA', zip: '01103', lat: 42.1015, lng: -72.5898 },
    { city: 'Cambridge', state: 'MA', zip: '02139', lat: 42.3736, lng: -71.1097 },
    { city: 'Hartford', state: 'CT', zip: '06103', lat: 41.7658, lng: -72.6734 },
    { city: 'New Haven', state: 'CT', zip: '06511', lat: 41.3083, lng: -72.9279 },
    { city: 'Bridgeport', state: 'CT', zip: '06604', lat: 41.1865, lng: -73.1952 },
    { city: 'Annapolis', state: 'MD', zip: '21401', lat: 38.9784, lng: -76.4922 },
    { city: 'Frederick', state: 'MD', zip: '21701', lat: 39.4143, lng: -77.4105 },
    { city: 'Norfolk', state: 'VA', zip: '23510', lat: 36.8508, lng: -76.2859 },
    { city: 'Richmond', state: 'VA', zip: '23219', lat: 37.5407, lng: -77.4360 },
    { city: 'Virginia Beach', state: 'VA', zip: '23451', lat: 36.8529, lng: -75.9780 },
    { city: 'Dover', state: 'DE', zip: '19901', lat: 39.1582, lng: -75.5244 },
    { city: 'Wilmington', state: 'DE', zip: '19801', lat: 39.7391, lng: -75.5398 },
  ],
  // Zone 3 - Midwest
  zone3: [
    { city: 'Columbus', state: 'OH', zip: '43215', lat: 39.9612, lng: -82.9988 },
    { city: 'Cincinnati', state: 'OH', zip: '45202', lat: 39.1031, lng: -84.5120 },
    { city: 'Toledo', state: 'OH', zip: '43604', lat: 41.6528, lng: -83.5379 },
    { city: 'Akron', state: 'OH', zip: '44308', lat: 41.0814, lng: -81.5190 },
    { city: 'Dayton', state: 'OH', zip: '45402', lat: 39.7589, lng: -84.1916 },
    { city: 'Grand Rapids', state: 'MI', zip: '49503', lat: 42.9634, lng: -85.6681 },
    { city: 'Warren', state: 'MI', zip: '48093', lat: 42.5145, lng: -83.0147 },
    { city: 'Sterling Heights', state: 'MI', zip: '48312', lat: 42.5803, lng: -83.0302 },
    { city: 'Lansing', state: 'MI', zip: '48933', lat: 42.7325, lng: -84.5555 },
    { city: 'Ann Arbor', state: 'MI', zip: '48104', lat: 42.2808, lng: -83.7430 },
    { city: 'Aurora', state: 'IL', zip: '60505', lat: 41.7606, lng: -88.3201 },
    { city: 'Rockford', state: 'IL', zip: '61101', lat: 42.2711, lng: -89.0940 },
    { city: 'Joliet', state: 'IL', zip: '60432', lat: 41.5250, lng: -88.0817 },
    { city: 'Naperville', state: 'IL', zip: '60540', lat: 41.7508, lng: -88.1535 },
    { city: 'Peoria', state: 'IL', zip: '61602', lat: 40.6936, lng: -89.5890 },
    { city: 'Fort Wayne', state: 'IN', zip: '46802', lat: 41.0793, lng: -85.1394 },
    { city: 'Evansville', state: 'IN', zip: '47708', lat: 37.9716, lng: -87.5711 },
    { city: 'South Bend', state: 'IN', zip: '46601', lat: 41.6764, lng: -86.2520 },
    { city: 'Carmel', state: 'IN', zip: '46032', lat: 39.9784, lng: -86.1180 },
    { city: 'Madison', state: 'WI', zip: '53703', lat: 43.0731, lng: -89.4012 },
    { city: 'Green Bay', state: 'WI', zip: '54301', lat: 44.5133, lng: -88.0133 },
    { city: 'Kenosha', state: 'WI', zip: '53140', lat: 42.5847, lng: -87.8212 },
    { city: 'Minneapolis', state: 'MN', zip: '55401', lat: 44.9778, lng: -93.2650 },
    { city: 'St. Paul', state: 'MN', zip: '55101', lat: 44.9537, lng: -93.0900 },
    { city: 'Rochester', state: 'MN', zip: '55902', lat: 44.0121, lng: -92.4802 },
    { city: 'Duluth', state: 'MN', zip: '55802', lat: 46.7867, lng: -92.1005 },
    { city: 'Kansas City', state: 'MO', zip: '64106', lat: 39.0997, lng: -94.5786 },
    { city: 'St. Louis', state: 'MO', zip: '63101', lat: 38.6270, lng: -90.1994 },
    { city: 'Springfield', state: 'MO', zip: '65806', lat: 37.2090, lng: -93.2923 },
  ],
  // Zone 4 - West/Other
  zone4: [
    { city: 'Austin', state: 'TX', zip: '78701', lat: 30.2672, lng: -97.7431 },
    { city: 'San Antonio', state: 'TX', zip: '78205', lat: 29.4241, lng: -98.4936 },
    { city: 'Fort Worth', state: 'TX', zip: '76102', lat: 32.7555, lng: -97.3308 },
    { city: 'El Paso', state: 'TX', zip: '79901', lat: 31.7619, lng: -106.4850 },
    { city: 'Arlington', state: 'TX', zip: '76010', lat: 32.7357, lng: -97.1081 },
    { city: 'Corpus Christi', state: 'TX', zip: '78401', lat: 27.8006, lng: -97.3964 },
    { city: 'Plano', state: 'TX', zip: '75074', lat: 33.0198, lng: -96.6989 },
    { city: 'Laredo', state: 'TX', zip: '78040', lat: 27.5306, lng: -99.4803 },
    { city: 'San Diego', state: 'CA', zip: '92101', lat: 32.7157, lng: -117.1611 },
    { city: 'San Jose', state: 'CA', zip: '95113', lat: 37.3382, lng: -121.8863 },
    { city: 'San Francisco', state: 'CA', zip: '94102', lat: 37.7749, lng: -122.4194 },
    { city: 'Fresno', state: 'CA', zip: '93721', lat: 36.7378, lng: -119.7871 },
    { city: 'Sacramento', state: 'CA', zip: '95814', lat: 38.5816, lng: -121.4944 },
    { city: 'Long Beach', state: 'CA', zip: '90802', lat: 33.7701, lng: -118.1937 },
    { city: 'Oakland', state: 'CA', zip: '94612', lat: 37.8044, lng: -122.2712 },
    { city: 'Bakersfield', state: 'CA', zip: '93301', lat: 35.3733, lng: -119.0187 },
    { city: 'Anaheim', state: 'CA', zip: '92805', lat: 33.8366, lng: -117.9143 },
    { city: 'Tucson', state: 'AZ', zip: '85701', lat: 32.2226, lng: -110.9747 },
    { city: 'Mesa', state: 'AZ', zip: '85201', lat: 33.4152, lng: -111.8315 },
    { city: 'Chandler', state: 'AZ', zip: '85225', lat: 33.3062, lng: -111.8413 },
    { city: 'Scottsdale', state: 'AZ', zip: '85251', lat: 33.4942, lng: -111.9261 },
    { city: 'Reno', state: 'NV', zip: '89501', lat: 39.5296, lng: -119.8138 },
    { city: 'Henderson', state: 'NV', zip: '89009', lat: 36.0395, lng: -114.9817 },
    { city: 'North Las Vegas', state: 'NV', zip: '89030', lat: 36.1989, lng: -115.1175 },
  ],
};

const companyTypes = [
  'Food Distributors',
  'Wholesale Foods',
  'Food Service',
  'Provisions Inc',
  'Food Co',
  'Food Supply',
  'Food Group',
  'Food Partners',
  'Wholesale Meats',
  'Protein Distributors',
  'Quality Foods',
  'Restaurant Supply',
  'Foodservice Solutions',
  'Premium Foods',
  'Fresh Distributors',
  'Gourmet Supplies',
];

const streetNames = [
  'Main St',
  'Market St',
  'Broadway',
  'Industrial Blvd',
  'Commerce Dr',
  'Business Park Way',
  'Corporate Dr',
  'Distribution Center Rd',
  'Warehouse Row',
  'Supply Chain Ave',
];

const firstNames = [
  'John', 'Mary', 'Robert', 'Patricia', 'Michael', 'Jennifer', 'William', 'Linda',
  'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah',
  'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty',
  'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley', 'Steven', 'Kimberly',
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris',
];

function generateCustomer(index: number, zoneId: number, cityList: any[]): CustomerData {
  const cityIndex = index % cityList.length;
  const city = cityList[cityIndex];

  const streetNumber = (index * 100 + 100).toString();
  const streetName = streetNames[index % streetNames.length];
  const address = `${streetNumber} ${streetName}`;

  const companyType = companyTypes[index % companyTypes.length];
  const company_name = `${city.city} ${companyType}`;

  // Add slight coordinate variation for customers in same city
  const latVariation = (Math.sin(index) * 0.02);
  const lngVariation = (Math.cos(index) * 0.02);

  return {
    company_name,
    address,
    city: city.city,
    state: city.state,
    zip: city.zip,
    zone_id: zoneId,
    lat: city.lat + latVariation,
    lng: city.lng + lngVariation,
  };
}

function generateContactInfo(index: number) {
  const firstName = firstNames[index % firstNames.length];
  const lastName = lastNames[(index * 3) % lastNames.length];
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
  const areaCode = (200 + (index % 800)).toString().padStart(3, '0');
  const phone = `${areaCode}-555-${(index % 10000).toString().padStart(4, '0')}`;

  return {
    contact_name: `${firstName} ${lastName}`,
    contact_email: email,
    contact_phone: phone,
  };
}

// Generate 420 customers: 105 per zone
const customersPerZone = 105;
const customers: any[] = [];

// Zone 1 - Southeast (105 customers)
for (let i = 0; i < customersPerZone; i++) {
  const customer = generateCustomer(i, 1, cityData.zone1);
  const contact = generateContactInfo(i);
  customers.push({ ...customer, ...contact });
}

// Zone 2 - Northeast (105 customers)
for (let i = 0; i < customersPerZone; i++) {
  const customer = generateCustomer(i, 2, cityData.zone2);
  const contact = generateContactInfo(i + customersPerZone);
  customers.push({ ...customer, ...contact });
}

// Zone 3 - Midwest (105 customers)
for (let i = 0; i < customersPerZone; i++) {
  const customer = generateCustomer(i, 3, cityData.zone3);
  const contact = generateContactInfo(i + customersPerZone * 2);
  customers.push({ ...customer, ...contact });
}

// Zone 4 - West (105 customers)
for (let i = 0; i < customersPerZone; i++) {
  const customer = generateCustomer(i, 4, cityData.zone4);
  const contact = generateContactInfo(i + customersPerZone * 3);
  customers.push({ ...customer, ...contact });
}

// Generate SQL INSERT statements
let sql = '-- Generated 420 additional customers for performance testing\n\n';

// Insert in batches of 50
const batchSize = 50;
for (let i = 0; i < customers.length; i += batchSize) {
  const batch = customers.slice(i, i + batchSize);

  sql += `-- Batch ${Math.floor(i / batchSize) + 1} (customers ${i + 1}-${Math.min(i + batchSize, customers.length)})\n`;
  sql += 'INSERT INTO customers (company_name, address, city, state, zip, zone_id, customer_type, contact_name, contact_email, contact_phone, lat, lng) VALUES\n';

  const values = batch.map((c, idx) => {
    const isLast = idx === batch.length - 1;
    return `  ('${c.company_name}', '${c.address}', '${c.city}', '${c.state}', '${c.zip}', ${c.zone_id}, 'food_distributor', '${c.contact_name}', '${c.contact_email}', '${c.contact_phone}', ${c.lat.toFixed(4)}, ${c.lng.toFixed(4)})${isLast ? ';' : ','}`;
  }).join('\n');

  sql += values + '\n\n';
}

console.log(sql);
