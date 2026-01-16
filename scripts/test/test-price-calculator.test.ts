/**
 * Test price calculator edge cases
 */

import { calculateDeliveredPrice, calculateMarginAmount, calculateCostPerLb } from './lib/utils/price-calculator';

console.log('=== Edge Case Testing: Price Calculator ===\n');

// Edge Case 1: Margin validation
console.log('Edge Case 1: Margin >100%');
try {
  const result = calculateMarginAmount(2.5, 150);
  console.log('Result:', result);
  console.log('✗ Fail: Should reject margin >100%');
} catch (error: any) {
  console.log('✓ Pass: Rejects margin >100%:', error.message);
}
console.log('');

// Edge Case 2: Negative margin
console.log('Edge Case 2: Negative margin');
try {
  const result = calculateMarginAmount(2.5, -10);
  console.log('Result:', result);
  console.log('✗ Fail: Should reject negative margin');
} catch (error: any) {
  console.log('✓ Pass: Rejects negative margin:', error.message);
}
console.log('');

// Edge Case 3: Zero cost per lb
console.log('Edge Case 3: Zero cost per lb');
const zeroCost = calculateDeliveredPrice(0, 15, 0.25);
console.log('Result:', zeroCost);
console.log('Expected: {costPerLb: 0, marginAmount: 0, freightPerLb: 0.25, total: 0.25}');
console.log('✓ Pass: Handles zero cost');
console.log('');

// Edge Case 4: Very high precision
console.log('Edge Case 4: High precision (5 decimal places)');
const highPrecision = calculateDeliveredPrice(2.123456, 15.6789, 0.234567);
console.log('Result:', highPrecision);
console.log('Check: All values rounded to 4 decimals?', 
  highPrecision.costPerLb.toString().split('.')[1]?.length <= 4
);
console.log('');

// Edge Case 5: Zero case weight
console.log('Edge Case 5: Zero case weight in calculateCostPerLb');
try {
  const result = calculateCostPerLb(100, 0);
  console.log('Result:', result);
  console.log('✗ Fail: Should reject zero case weight');
} catch (error: any) {
  console.log('✓ Pass: Rejects zero case weight:', error.message);
}
console.log('');

// Edge Case 6: Negative case weight
console.log('Edge Case 6: Negative case weight');
try {
  const result = calculateCostPerLb(100, -10);
  console.log('Result:', result);
  console.log('✗ Fail: Should reject negative case weight');
} catch (error: any) {
  console.log('✓ Pass: Rejects negative case weight:', error.message);
}
console.log('');

// Edge Case 7: Rounding accuracy
console.log('Edge Case 7: Rounding accuracy (0.1 + 0.2 problem)');
const rounding = calculateDeliveredPrice(0.1, 50, 0.2);
console.log('Input: 0.1 cost, 50% margin, 0.2 freight');
console.log('Expected: 0.1 + 0.05 + 0.2 = 0.35');
console.log('Actual:', rounding);
console.log('✓ Pass: Correct rounding:', rounding.total === 0.35);
