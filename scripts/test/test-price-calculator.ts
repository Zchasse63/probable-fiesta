import { calculateDeliveredPrice, calculateMarginAmount, calculateCostPerLb } from './frozen-protein-pricing/lib/utils/price-calculator';

console.log('=== PRICE CALCULATOR TESTS ===\n');

// Test AC4: Delivered price calculation
console.log('Test 1: Delivered price formula');
const result = calculateDeliveredPrice(2.5000, 15.00, 0.2500);
console.log('Input: costPerLb=2.5000, marginPercent=15.00, freightPerLb=0.2500');
console.log('Expected: {costPerLb: 2.5000, marginAmount: 0.3750, freightPerLb: 0.2500, total: 3.1250}');
console.log('Result:', result);
console.log('Formula check: 2.5000 + 0.3750 + 0.2500 =', 2.5000 + 0.3750 + 0.2500);
console.log('Pass:',
  result.costPerLb === 2.5000 &&
  result.marginAmount === 0.3750 &&
  result.freightPerLb === 0.2500 &&
  result.total === 3.1250
);
console.log();

// Test margin calculation
console.log('Test 2: Margin calculation');
const margin = calculateMarginAmount(2.5000, 15.00);
console.log('Input: costPerLb=2.5000, marginPercent=15.00');
console.log('Expected: 2.5000 × 0.15 = 0.3750');
console.log('Result:', margin);
console.log('Pass:', margin === 0.3750);
console.log();

// Test cost per lb
console.log('Test 3: Cost per lb from unit cost');
const costPerLb = calculateCostPerLb(50, 20);
console.log('Input: unitCost=$50, caseWeight=20 lbs');
console.log('Expected: 50 / 20 = 2.5000');
console.log('Result:', costPerLb);
console.log('Pass:', costPerLb === 2.5000);
