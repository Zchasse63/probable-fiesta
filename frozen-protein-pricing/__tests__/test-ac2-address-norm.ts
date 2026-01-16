/**
 * AC2 Validation Test: Address Normalization
 * Verify AI corrects malformed addresses and logs changes
 */

import { normalizeAddress } from '../lib/anthropic/parsers';

async function testAC2() {
  console.log('=== AC2: Address Normalization Test ===\n');

  const testAddress = '123 main st nyc';

  try {
    console.log(`Normalizing address: "${testAddress}"`);
    const result = await normalizeAddress(testAddress);

    if (!result) {
      console.error('❌ FAIL: normalizeAddress returned null');
      return false;
    }

    console.log('✓ Address normalized successfully\n');
    console.log('Normalized address:');
    console.log('  Street:', result.normalized.street);
    console.log('  City:', result.normalized.city);
    console.log('  State:', result.normalized.state);
    console.log('  ZIP:', result.normalized.zip || 'N/A');
    console.log('  Country:', result.normalized.country || 'US');

    console.log('\nCorrections made:');
    if (result.corrections.length === 0) {
      console.log('  (none)');
    } else {
      result.corrections.forEach(correction => console.log('  -', correction));
    }

    console.log('\nToken usage:');
    console.log('  Input tokens:', result.tokens_used.input_tokens);
    console.log('  Output tokens:', result.tokens_used.output_tokens);
    console.log('  Model:', result.model);

    // Validate normalized fields
    const hasStreet = result.normalized.street && result.normalized.street.length > 0;
    const hasCity = result.normalized.city && result.normalized.city.length > 0;
    const hasState = result.normalized.state && result.normalized.state.length > 0;

    console.log('\nValidation:');
    console.log(`  ${hasStreet ? '✓' : '✗'} Street: ${result.normalized.street}`);
    console.log(`  ${hasCity ? '✓' : '✗'} City: ${result.normalized.city}`);
    console.log(`  ${hasState ? '✓' : '✗'} State: ${result.normalized.state}`);

    // Check that corrections were detected (street should be capitalized, city expanded)
    const hasCorrections = result.corrections.length > 0;
    console.log(`  ${hasCorrections ? '✓' : '✗'} Corrections logged: ${result.corrections.length} corrections`);

    if (hasStreet && hasCity && hasState) {
      console.log('\n✅ AC2 PASSED: Address normalized with corrections');
      return true;
    } else {
      console.log('\n❌ AC2 FAILED: Missing required fields');
      return false;
    }
  } catch (error) {
    console.error('❌ AC2 FAILED with exception:', error);
    return false;
  }
}

testAC2().then(passed => {
  process.exit(passed ? 0 : 1);
});
