/**
 * Test freight calculator with minimum charge bug
 */

import { estimateReeferRate } from './lib/utils/freight-calculator';

console.log('=== Testing Minimum Charge Bug ===\n');

// The issue: minimum charge is applied to the RANGE, not just the base estimate
// When estimate < 350, range should be 85-115% of calculated value, not 85-115% of 350

const test1 = estimateReeferRate(100, 'GA', new Date('2026-01-15'));
console.log('Dry Quote: 100, GA, Jan 2026');
console.log('Calculated: 100 × 2.25 × 1.00 × 1.00 = 225.00');
console.log('Actual estimate:', test1.estimate);
console.log('Actual range:', test1.rangeLow, '-', test1.rangeHigh);
console.log('');

// Check line 71-74 of freight-calculator.ts
console.log('Issue Analysis:');
console.log('Line 71: estimate is set to max(calculatedEstimate, minimumCharge)');
console.log('Line 74: rangeLow = estimate * 0.85');
console.log('Line 75: rangeHigh = estimate * 1.15');
console.log('');
console.log('This means if calculatedEstimate=225 but minimum=350:');
console.log('  estimate = 350');
console.log('  rangeLow = 350 * 0.85 = 297.5 (WRONG - should be 225 * 0.85 = 191.25)');
console.log('  rangeHigh = 350 * 1.15 = 402.5 (WRONG - should be 225 * 1.15 = 258.75)');
console.log('');

console.log('Expected Behavior:');
console.log('  calculatedEstimate = 225');
console.log('  rangeLow = 225 * 0.85 = 191.25');
console.log('  rangeHigh = 225 * 1.15 = 258.75');
console.log('  estimate = max(225, 350) = 350 (apply minimum AFTER range calc)');
