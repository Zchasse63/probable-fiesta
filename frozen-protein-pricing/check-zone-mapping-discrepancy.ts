/**
 * Check for discrepancies between zone-lookup.ts and zones.ts
 */

import { getZoneFromZip } from './lib/utils/zone-lookup';
import { getZoneByState } from './lib/mapbox/zones';

// States defined in zones.ts per zone
const ZONES_TS_MAPPING: Record<string, string[]> = {
  '1': ['FL', 'GA', 'AL', 'SC', 'NC', 'TN', 'MS'], // Southeast
  '2': ['NY', 'NJ', 'PA', 'MA', 'CT', 'MD', 'VA', 'DE'], // Northeast
  '3': ['OH', 'MI', 'IL', 'IN', 'WI', 'MN', 'MO'], // Midwest
  '4': ['TX', 'CA', 'AZ', 'NV', 'OR', 'WA', 'CO', 'UT'], // West/Other
};

// States in zone-lookup.ts (from comments at top of file)
const ZONE_LOOKUP_MAPPING: Record<string, string[]> = {
  '1': ['FL', 'GA', 'SC', 'NC', 'TN', 'AL', 'MS', 'LA'], // Southeast
  '2': ['PA', 'NJ', 'NY', 'CT', 'MA', 'RI', 'VT', 'NH', 'ME', 'DE', 'MD', 'VA', 'WV', 'DC'], // Northeast
  '3': ['OH', 'IN', 'IL', 'MI', 'WI', 'MN', 'IA', 'MO', 'KS', 'NE', 'SD', 'ND'], // Midwest
  '4': ['CA', 'OR', 'WA', 'NV', 'AZ', 'UT', 'CO', 'NM', 'TX', 'OK', 'AR'], // West
};

console.log('='.repeat(80));
console.log('Zone Mapping Discrepancy Check');
console.log('='.repeat(80));
console.log();

console.log('COMPARISON: zones.ts vs zone-lookup.ts');
console.log('-'.repeat(80));

let hasDiscrepancies = false;

// Check each zone
for (const zoneId of ['1', '2', '3', '4']) {
  console.log(`\nZone ${zoneId}:`);

  const zonesTs = ZONES_TS_MAPPING[zoneId];
  const zoneLookupTs = ZONE_LOOKUP_MAPPING[zoneId];

  console.log(`  zones.ts states:       ${zonesTs.join(', ')}`);
  console.log(`  zone-lookup.ts states: ${zoneLookupTs.join(', ')}`);

  // Find states in zone-lookup.ts but not in zones.ts
  const extraInLookup = zoneLookupTs.filter(s => !zonesTs.includes(s));
  if (extraInLookup.length > 0) {
    console.log(`  ⚠️  Extra in zone-lookup.ts: ${extraInLookup.join(', ')}`);
    hasDiscrepancies = true;
  }

  // Find states in zones.ts but not in zone-lookup.ts
  const missingFromLookup = zonesTs.filter(s => !zoneLookupTs.includes(s));
  if (missingFromLookup.length > 0) {
    console.log(`  ⚠️  Missing from zone-lookup.ts: ${missingFromLookup.join(', ')}`);
    hasDiscrepancies = true;
  }

  if (extraInLookup.length === 0 && missingFromLookup.length === 0) {
    console.log(`  ✅ Mappings match!`);
  }
}

console.log();
console.log('='.repeat(80));
console.log('IMPORTANT NOTES:');
console.log('-'.repeat(80));
console.log('- zones.ts is used by customer-form.tsx for STATE-based auto-assignment');
console.log('- zone-lookup.ts is used for ZIP-based lookup');
console.log('- The discrepancies show that zone-lookup.ts has MORE states mapped');
console.log('- This means some states will auto-assign via ZIP but NOT via state dropdown');
console.log('='.repeat(80));

if (hasDiscrepancies) {
  console.log('\n⚠️  DISCREPANCY DETECTED: The two files have different state mappings!');
} else {
  console.log('\n✅ All mappings are consistent between files');
}
console.log('='.repeat(80));
