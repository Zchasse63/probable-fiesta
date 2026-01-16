import { geocodeAddress } from '../lib/mapbox/geocode';

async function testGeocode() {
  try {
    const testAddress = '1600 Pennsylvania Ave NW, Washington, DC 20500';
    console.log(`Testing geocoding for: ${testAddress}\n`);

    const result = await geocodeAddress(testAddress);

    console.log('Geocode Result:');
    console.log(`  Latitude: ${result.latitude}`);
    console.log(`  Longitude: ${result.longitude}`);
    console.log(`  Confidence: ${result.confidence}`);

    // Validate White House coordinates (approximately)
    const expectedLat = 38.8977;
    const expectedLng = -77.0365;
    const tolerance = 0.01;

    const latMatch = Math.abs(result.latitude - expectedLat) < tolerance;
    const lngMatch = Math.abs(result.longitude - expectedLng) < tolerance;

    console.log(`\nValidation:`);
    console.log(`  Latitude matches expected (${expectedLat}): ${latMatch}`);
    console.log(`  Longitude matches expected (${expectedLng}): ${lngMatch}`);
    console.log(`  Confidence > 0.8: ${result.confidence > 0.8}`);

    if (latMatch && lngMatch && result.confidence > 0.8) {
      console.log('\n✓ Geocoding test PASSED');
      process.exit(0);
    } else {
      console.log('\n✗ Geocoding test FAILED');
      process.exit(1);
    }
  } catch (error) {
    console.error('Geocoding error:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.message.includes('placeholder')) {
      console.log('\n⚠ Skipping geocoding test - Mapbox token not configured (expected in non-production)');
      process.exit(0);
    }
    process.exit(1);
  }
}

testGeocode();
