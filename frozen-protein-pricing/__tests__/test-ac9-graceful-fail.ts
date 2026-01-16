/**
 * AC9 Validation Test: Graceful Degradation Without API Key
 * Verify app remains functional when ANTHROPIC_API_KEY is missing
 */

import { parsePackSizeSync } from '../lib/utils/pack-size-parser';

async function testAC9() {
  console.log('=== AC9: Graceful Degradation Test ===\n');

  // Save original API key
  const originalKey = process.env.ANTHROPIC_API_KEY;

  try {
    // Test 1: Basic pack size parsing without AI (should still work)
    console.log('Test 1: Pack size parsing without AI fallback');
    const result1 = parsePackSizeSync('6/5 LB');
    console.log(`  parsePackSizeSync("6/5 LB") = ${result1}`);
    if (result1 === 30) {
      console.log('  ✓ Regex parsing still works without API key');
    } else {
      console.log('  ✗ Regex parsing failed');
      return false;
    }

    // Test 2: Unparseable pack size returns null (graceful)
    console.log('\nTest 2: Unparseable pack size handling');
    const result2 = parsePackSizeSync('approx 40 pounds per case');
    console.log(`  parsePackSizeSync("approx 40 pounds per case") = ${result2}`);
    if (result2 === null) {
      console.log('  ✓ Returns null gracefully for unparseable format');
    } else {
      console.log('  ✗ Should return null for unparseable format');
      return false;
    }

    // Test 3: Verify isAnthropicConfigured check
    console.log('\nTest 3: API configuration check');
    // Temporarily remove API key
    delete process.env.ANTHROPIC_API_KEY;

    const { isAnthropicConfigured } = await import('../lib/anthropic/client');
    const isConfigured = isAnthropicConfigured();
    console.log(`  isAnthropicConfigured() = ${isConfigured}`);

    // Restore API key
    if (originalKey) {
      process.env.ANTHROPIC_API_KEY = originalKey;
    }

    if (!isConfigured) {
      console.log('  ✓ Correctly detects missing API key');
    } else {
      console.log('  ✗ Should detect missing API key');
      return false;
    }

    console.log('\n✅ AC9 PASSED: App degrades gracefully without AI');
    return true;
  } catch (error) {
    // Restore API key on error
    if (originalKey) {
      process.env.ANTHROPIC_API_KEY = originalKey;
    }
    console.error('❌ AC9 FAILED with exception:', error);
    return false;
  }
}

testAC9().then(passed => {
  process.exit(passed ? 0 : 1);
});
