import { estimateReeferRate, calculateFreightPerLb } from './lib/utils/freight-calculator';
import { calculateDeliveredPrice } from './lib/utils/price-calculator';

console.log('===== REALISTIC FREIGHT TEST (AC1 scenario) =====\n');

// AC1 says: PA warehouse to Miami FL with 7500 lbs, 4 pallets
// Let's assume GoShip returns $800 for dry LTL (realistic)
const dryQuote = 800;
const weight = 7500;

console.log('Scenario: PA warehouse → Miami FL');
console.log('Weight: 7500 lbs, Pallets: 4');
console.log('Dry LTL Quote: $' + dryQuote);
console.log();

const paToMiami = estimateReeferRate(dryQuote, 'PA', new Date('2026-01-20'));
console.log('Reefer Estimate:', paToMiami);
console.log('Calculation: 800 × 2.25 × 0.98068 × 1.00 =', 800 * 2.25 * 0.98068);
console.log('Range: $' + paToMiami.rangeLow + ' - $' + paToMiami.rangeHigh);

const ratePerLb = calculateFreightPerLb(paToMiami.estimate, weight);
console.log('Rate per lb:', ratePerLb);

console.log('\n===== DELIVERED PRICE CALCULATION =====\n');

// Product: Chicken Breast at $2.50/lb cost
const costPerLb = 2.5;
const marginPercent = 15.0;

const delivered = calculateDeliveredPrice(costPerLb, marginPercent, ratePerLb);
console.log('Product: Chicken Breast');
console.log('Cost per lb: $' + delivered.costPerLb);
console.log('Margin (15%): $' + delivered.marginAmount);
console.log('Freight per lb: $' + delivered.freightPerLb);
console.log('Delivered price per lb: $' + delivered.total);

console.log('\n===== MINIMUM CHARGE TEST (Small shipment) =====\n');

// Small shipment: 500 lbs
const smallDry = 200; // Dry quote for 500 lbs
const smallWeight = 500;

console.log('Small shipment: 500 lbs, Dry quote: $' + smallDry);
const smallReefer = estimateReeferRate(smallDry, 'GA', new Date('2026-01-15'));
console.log('Calculated (before minimum):', 200 * 2.25 * 1.0 * 1.0, '= $450');
console.log('After minimum floor: $' + smallReefer.estimate);
console.log('Rate per lb:', calculateFreightPerLb(smallReefer.estimate, smallWeight));
